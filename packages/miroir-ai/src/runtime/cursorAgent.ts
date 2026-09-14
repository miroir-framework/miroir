/**
 * Persistence-process Cursor agent wrapper for CopilotKit (#275 Slice 4).
 * Loads `@cursor/sdk` only via injected / default dynamic import — never statically.
 */

import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AbstractAgent } from "@ag-ui/client";
import type { BaseEvent, RunAgentInput } from "@ag-ui/core";
import { EventType } from "@ag-ui/core";
import { resolveSecret } from "miroir-core";
import { Observable } from "rxjs";

const CURSOR_DUMMY_CWD_DIRNAME = ".miroir-cursor-cwd";
const CURSOR_NODE_MAJOR = 22;
const CURSOR_NODE_MINOR = 13;
const CURSOR_NODE_PATCH = 0;
const CURSOR_NODE_FLOOR = `${CURSOR_NODE_MAJOR}.${CURSOR_NODE_MINOR}.${CURSOR_NODE_PATCH}`;
const MIROIR_MCP_SERVER_NAME = "miroir";

export type CursorSdkAgentHandle = {
  send?: (prompt: string) => Promise<{
    stream?: () => AsyncIterable<unknown>;
    wait?: () => Promise<{
      status?: string;
      result?: string;
      error?: { message?: string };
    }>;
    result?: string;
  }>;
  [Symbol.asyncDispose]?: () => Promise<void>;
};

export type CursorSdkModule = {
  Agent: {
    create: (options: Record<string, unknown>) => Promise<CursorSdkAgentHandle>;
  };
};

export type ImportCursorSdk = () => Promise<CursorSdkModule>;

export type CreateCursorAbstractAgentOptions = {
  importSdk?: ImportCursorSdk;
  mcpHttpUrl?: string;
  apiPort?: number;
  nodeVersion?: string;
  cwdParent?: string;
};

const defaultImportSdk: ImportCursorSdk = () => import("@cursor/sdk") as Promise<CursorSdkModule>;

const sdkModuleByImporter = new WeakMap<ImportCursorSdk, Promise<CursorSdkModule>>();

function loadCursorSdk(importSdk: ImportCursorSdk): Promise<CursorSdkModule> {
  const cached = sdkModuleByImporter.get(importSdk);
  if (cached) {
    return cached;
  }
  const loaded = importSdk();
  sdkModuleByImporter.set(importSdk, loaded);
  return loaded;
}

function parseNodeVersion(version: string): [number, number, number] {
  const match = version.trim().replace(/^v/i, "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return [0, 0, 0];
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function isNodeVersionAtLeast(
  major: number,
  minor: number,
  patch: number,
  version: string = process.versions.node,
): boolean {
  const [haveMajor, haveMinor, havePatch] = parseNodeVersion(version);
  if (haveMajor !== major) {
    return haveMajor > major;
  }
  if (haveMinor !== minor) {
    return haveMinor > minor;
  }
  return havePatch >= patch;
}

export function createCursorDummyCwd(parentDirectory: string = tmpdir()): string {
  const cwd = join(parentDirectory, CURSOR_DUMMY_CWD_DIRNAME);
  mkdirSync(cwd, { recursive: true });
  return cwd;
}

export function loopbackMcpHttpUrl(apiPort: number): string {
  return `http://127.0.0.1:${apiPort}/mcp`;
}

function resolveMcpHttpUrl(options?: CreateCursorAbstractAgentOptions): string {
  if (options?.mcpHttpUrl) {
    return options.mcpHttpUrl;
  }
  if (options?.apiPort != null) {
    return loopbackMcpHttpUrl(options.apiPort);
  }
  throw new Error("Cursor agent requires mcpHttpUrl or apiPort");
}

function messageContentToText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return "";
  }
  return content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }
      if (part && typeof part === "object" && "text" in part) {
        return String((part as { text?: unknown }).text ?? "");
      }
      return "";
    })
    .join("");
}

function copilotKitToolNames(input: RunAgentInput): Set<string> {
  return new Set(
    (input.tools ?? [])
      .map((tool) => tool?.name)
      .filter((name): name is string => typeof name === "string" && name.length > 0),
  );
}

export function promptFromRunInput(input: RunAgentInput): string {
  const parts: string[] = [];
  const context = input.context ?? [];
  if (context.length > 0) {
    parts.push("Additional instructions:");
    for (const item of context) {
      const description = item?.description?.trim() ?? "";
      const value = item?.value?.trim() ?? "";
      if (description && value) {
        parts.push(`${description}: ${value}`);
      } else if (description || value) {
        parts.push(description || value);
      }
    }
  }

  const tools = input.tools ?? [];
  if (tools.length > 0) {
    parts.push(
      "CopilotKit frontend tools (review forms, not MCP). Invoke these by name; Miroir shows a form. Do not treat them as Cursor custom tools.",
    );
    parts.push(
      'To invoke one, emit a fenced JSON block tagged copilotkit-tool with {"name":"<tool>","arguments":{...}}.',
    );
    for (const tool of tools) {
      if (!tool?.name) {
        continue;
      }
      const description = tool.description ? `: ${tool.description}` : "";
      parts.push(`- ${tool.name}${description}`);
    }
  }

  const messages = input.messages ?? [];
  if (messages.length > 0) {
    parts.push("Conversation:");
    for (const message of messages) {
      const role = typeof message?.role === "string" ? message.role : "user";
      const text = messageContentToText(message?.content);
      if (!text) {
        continue;
      }
      parts.push(`${role}: ${text}`);
    }
  }

  return parts.join("\n");
}

function splitCopilotKitToolFences(
  text: string,
  toolNames: Set<string>,
): { visibleText: string; calls: Array<{ id: string; name: string; args: unknown }> } {
  const calls: Array<{ id: string; name: string; args: unknown }> = [];
  const visibleText = text.replace(/```copilotkit-tool\s*([\s\S]*?)```/g, (match, jsonText) => {
    try {
      const parsed = JSON.parse(String(jsonText).trim()) as {
        id?: unknown;
        name?: unknown;
        arguments?: unknown;
        args?: unknown;
      };
      const name = parsed?.name;
      if (typeof name !== "string" || !toolNames.has(name)) {
        return match;
      }
      const id =
        typeof parsed.id === "string" && parsed.id.length > 0
          ? parsed.id
          : `cursor-tool-${name}-${calls.length}`;
      calls.push({
        id,
        name,
        args: parsed.arguments ?? parsed.args ?? {},
      });
      return "";
    } catch {
      return match;
    }
  });
  return { visibleText: visibleText.trim(), calls };
}

function stringifyToolArgs(args: unknown): string {
  if (typeof args === "string") {
    return args;
  }
  if (args == null) {
    return "{}";
  }
  try {
    return JSON.stringify(args);
  } catch {
    return "{}";
  }
}

function copilotKitToolCallsFromSdkEvent(
  event: unknown,
  toolNames: Set<string>,
): Array<{ id: string; name: string; args: unknown }> {
  if (!event || typeof event !== "object" || toolNames.size === 0) {
    return [];
  }
  const typed = event as {
    type?: string;
    call_id?: string;
    name?: string;
    args?: unknown;
    status?: string;
    message?: {
      content?: Array<{ type?: string; id?: string; name?: string; input?: unknown }>;
    };
  };
  const found: Array<{ id: string; name: string; args: unknown }> = [];

  if (
    typed.type === "tool_call" &&
    typed.name &&
    toolNames.has(typed.name) &&
    typed.status !== "completed" &&
    typed.status !== "error"
  ) {
    found.push({
      id: typed.call_id ?? `cursor-tool-${typed.name}`,
      name: typed.name,
      args: typed.args,
    });
  }

  if (typed.type === "assistant") {
    for (const block of typed.message?.content ?? []) {
      if (block.type !== "tool_use" || !block.name || !toolNames.has(block.name)) {
        continue;
      }
      found.push({
        id: block.id ?? `cursor-tool-${block.name}`,
        name: block.name,
        args: block.input,
      });
    }
  }

  return found;
}

function assistantTextFromSdkEvent(event: unknown): string {
  if (!event || typeof event !== "object") {
    return "";
  }
  const typed = event as {
    type?: string;
    message?: { content?: Array<{ type?: string; text?: string }> };
    text?: string;
  };
  if (typed.type === "assistant") {
    const blocks = typed.message?.content ?? [];
    return blocks
      .filter((block) => block.type === "text" && typeof block.text === "string")
      .map((block) => block.text as string)
      .join("");
  }
  if (typeof typed.text === "string") {
    return typed.text;
  }
  return "";
}

function observableFromAsync(run: (emit: (event: BaseEvent) => void) => Promise<void>): Observable<BaseEvent> {
  return new Observable<BaseEvent>((subscriber) => {
    let closed = false;
    void run((event) => {
      if (!closed) {
        subscriber.next(event);
      }
    })
      .then(() => {
        if (!closed) {
          subscriber.complete();
        }
      })
      .catch((err) => {
        if (!closed) {
          subscriber.error(err);
        }
      });
    return () => {
      closed = true;
    };
  });
}

class CursorSdkAbstractAgent extends AbstractAgent {
  constructor(private sdkAgent: CursorSdkAgentHandle) {
    super({ agentId: "default" });
  }

  run(input: RunAgentInput): Observable<BaseEvent> {
    return observableFromAsync(async (emit) => {
      emit({
        type: EventType.RUN_STARTED,
        threadId: input.threadId,
        runId: input.runId,
      } as BaseEvent);

      const prompt = promptFromRunInput(input);
      const sdkRun = await this.sdkAgent.send?.(prompt);
      const messageId = `cursor-${input.runId}`;
      const toolNames = copilotKitToolNames(input);
      const emittedToolCallIds = new Set<string>();
      let started = false;

      const closeTextIfOpen = () => {
        if (!started) {
          return;
        }
        emit({
          type: EventType.TEXT_MESSAGE_END,
          messageId,
        } as BaseEvent);
        started = false;
      };

      const emitCopilotKitToolCall = (call: { id: string; name: string; args: unknown }) => {
        if (emittedToolCallIds.has(call.id)) {
          return;
        }
        emittedToolCallIds.add(call.id);
        closeTextIfOpen();
        emit({
          type: EventType.TOOL_CALL_START,
          toolCallId: call.id,
          toolCallName: call.name,
          parentMessageId: messageId,
        } as BaseEvent);
        emit({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: call.id,
          delta: stringifyToolArgs(call.args),
        } as BaseEvent);
        emit({
          type: EventType.TOOL_CALL_END,
          toolCallId: call.id,
        } as BaseEvent);
      };

      if (sdkRun?.stream) {
        for await (const event of sdkRun.stream()) {
          for (const call of copilotKitToolCallsFromSdkEvent(event, toolNames)) {
            emitCopilotKitToolCall(call);
          }
          const rawText = assistantTextFromSdkEvent(event);
          const { visibleText, calls: fencedCalls } = splitCopilotKitToolFences(rawText, toolNames);
          if (visibleText) {
            if (!started) {
              emit({
                type: EventType.TEXT_MESSAGE_START,
                messageId,
                role: "assistant",
              } as BaseEvent);
              started = true;
            }
            emit({
              type: EventType.TEXT_MESSAGE_CONTENT,
              messageId,
              delta: visibleText,
            } as BaseEvent);
          }
          for (const call of fencedCalls) {
            emitCopilotKitToolCall(call);
          }
        }
      }

      if (started) {
        emit({
          type: EventType.TEXT_MESSAGE_END,
          messageId,
        } as BaseEvent);
      }

      await sdkRun?.wait?.();

      if (!started && typeof sdkRun?.result === "string" && sdkRun.result.length > 0) {
        emit({
          type: EventType.TEXT_MESSAGE_START,
          messageId,
          role: "assistant",
        } as BaseEvent);
        emit({
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId,
          delta: sdkRun.result,
        } as BaseEvent);
        emit({
          type: EventType.TEXT_MESSAGE_END,
          messageId,
        } as BaseEvent);
      }

      emit({
        type: EventType.RUN_FINISHED,
        threadId: input.threadId,
        runId: input.runId,
      } as BaseEvent);
    });
  }

  override clone(): this {
    const cloned = super.clone() as this;
    cloned.sdkAgent = this.sdkAgent;
    return cloned;
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.sdkAgent[Symbol.asyncDispose]?.();
  }
}

export async function createCursorAbstractAgent(
  options: CreateCursorAbstractAgentOptions = {},
): Promise<CursorSdkAbstractAgent> {
  const nodeVersion = options.nodeVersion ?? process.versions.node;
  if (!isNodeVersionAtLeast(CURSOR_NODE_MAJOR, CURSOR_NODE_MINOR, CURSOR_NODE_PATCH, nodeVersion)) {
    throw new Error(
      `Cursor agent requires Node.js ${CURSOR_NODE_FLOOR} or later (current: ${nodeVersion})`,
    );
  }

  const mcpHttpUrl = resolveMcpHttpUrl(options);
  const apiKey = resolveSecret("aiCursorKey").value;
  const cwd = createCursorDummyCwd(options.cwdParent);
  const sdk = await loadCursorSdk(options.importSdk ?? defaultImportSdk);

  const sdkAgent = await sdk.Agent.create({
    apiKey,
    model: { id: "auto" },
    tools: ["mcp"],
    local: { cwd },
    mcpServers: {
      [MIROIR_MCP_SERVER_NAME]: {
        type: "http",
        url: mcpHttpUrl,
      },
    },
  });

  return new CursorSdkAbstractAgent(sdkAgent);
}
