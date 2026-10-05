/**
 * Shared bridge between an agent SDK session and CopilotKit (#409): builds the prompt from the
 * AG-UI run input, maps SDK messages to AG-UI events (assistant text, CopilotKit frontend tool
 * calls), and holds the helpers every backend needs (scratch cwd, MCP URL, one SDK import per
 * importer). Backends (`cursorAgent.ts`, `claudeAgent.ts`) only open an `AgentSession`.
 */

import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AbstractAgent } from "@ag-ui/client";
import type { BaseEvent, RunAgentInput } from "@ag-ui/core";
import { EventType } from "@ag-ui/core";
import { resolveSecret } from "miroir-core";
import { Observable } from "rxjs";

/** Name of the Miroir MCP server in every agent's MCP configuration. */
export const MIROIR_MCP_SERVER_NAME = "miroir";

/** One prompt sent to an agent session. */
export type AgentRun = {
  /** SDK messages, in order. */
  events?: AsyncIterable<unknown>;
  /** Waits for the run to end, after `events` is drained. */
  finish?: () => Promise<void>;
  /** Final text, shown when the events carried no assistant text. */
  result?: () => string | undefined;
};

/** An agent SDK session, as the bridge drives it. */
export type AgentSession = {
  send: (prompt: string) => Promise<AgentRun>;
  dispose?: () => Promise<void>;
};

export type McpUrlOptions = {
  mcpHttpUrl?: string;
  apiPort?: number;
  /** Sent with every MCP request of the agent, e.g. the caller's `Authorization` (#263). */
  mcpHeaders?: Record<string, string>;
};

const sdkModuleByImporter = new WeakMap<() => Promise<unknown>, Promise<unknown>>();

/** Imports an SDK once per importer function, so every agent of a process shares the module. */
export function loadSdkOnce<Module>(importSdk: () => Promise<Module>): Promise<Module> {
  const cached = sdkModuleByImporter.get(importSdk);
  if (cached) {
    return cached as Promise<Module>;
  }
  const loaded = importSdk();
  sdkModuleByImporter.set(importSdk, loaded);
  return loaded;
}

/** The value of a named secret, or an error naming it. Resolved before any SDK import. */
export function requireSecret(name: string): string {
  try {
    const value = resolveSecret(name).value;
    if (value) {
      return value;
    }
  } catch {
    // reported below with the secret name
  }
  throw new Error(`missing secret \`${name}\`: import it before using this agent backend`);
}

/** A scratch working directory for an agent, outside any deployment folder. */
export function createScratchCwd(dirname: string, parentDirectory: string = tmpdir()): string {
  const cwd = join(parentDirectory, dirname);
  mkdirSync(cwd, { recursive: true });
  return cwd;
}

/**
 * The Miroir MCP server entry of an agent's MCP configuration. `headers` carry the CopilotKit
 * caller's `Authorization`, so the agent's tool calls run as that user (#263).
 */
export function miroirMcpServerConfig(
  url: string,
  headers?: Record<string, string>,
): { type: "http"; url: string; headers?: Record<string, string> } {
  return headers && Object.keys(headers).length > 0 ? { type: "http", url, headers } : { type: "http", url };
}

export function loopbackMcpHttpUrl(apiPort: number): string {
  return `http://127.0.0.1:${apiPort}/mcp`;
}

export function resolveMcpHttpUrl(options: McpUrlOptions, agentLabel: string): string {
  if (options.mcpHttpUrl) {
    return options.mcpHttpUrl;
  }
  if (options.apiPort != null) {
    return loopbackMcpHttpUrl(options.apiPort);
  }
  throw new Error(`${agentLabel} agent requires mcpHttpUrl or apiPort`);
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
      "CopilotKit frontend tools (review forms, not MCP). Invoke these by name; Miroir shows a form. Do not look for them among your own tools.",
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

type CopilotKitToolCall = { id: string; name: string; args: unknown };

function splitCopilotKitToolFences(
  text: string,
  toolNames: Set<string>,
  idPrefix: string,
): { visibleText: string; calls: CopilotKitToolCall[] } {
  const calls: CopilotKitToolCall[] = [];
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
        typeof parsed.id === "string" && parsed.id.length > 0 ? parsed.id : `${idPrefix}-tool-${name}-${calls.length}`;
      calls.push({ id, name, args: parsed.arguments ?? parsed.args ?? {} });
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

/** CopilotKit tool calls in an SDK message: Cursor `tool_call` events and `tool_use` blocks. */
function copilotKitToolCallsFromSdkEvent(
  event: unknown,
  toolNames: Set<string>,
  idPrefix: string,
): CopilotKitToolCall[] {
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
  const found: CopilotKitToolCall[] = [];

  if (
    typed.type === "tool_call" &&
    typed.name &&
    toolNames.has(typed.name) &&
    typed.status !== "completed" &&
    typed.status !== "error"
  ) {
    found.push({ id: typed.call_id ?? `${idPrefix}-tool-${typed.name}`, name: typed.name, args: typed.args });
  }

  if (typed.type === "assistant") {
    for (const block of typed.message?.content ?? []) {
      if (block.type !== "tool_use" || !block.name || !toolNames.has(block.name)) {
        continue;
      }
      found.push({ id: block.id ?? `${idPrefix}-tool-${block.name}`, name: block.name, args: block.input });
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

/** A CopilotKit agent that runs each AG-UI run through an agent SDK session. */
export class BridgedAbstractAgent extends AbstractAgent {
  constructor(
    private session: AgentSession,
    private idPrefix: string,
  ) {
    super({ agentId: "default" });
  }

  run(input: RunAgentInput): Observable<BaseEvent> {
    return observableFromAsync(async (emit) => {
      emit({ type: EventType.RUN_STARTED, threadId: input.threadId, runId: input.runId } as BaseEvent);

      const agentRun = await this.session.send(promptFromRunInput(input));
      const messageId = `${this.idPrefix}-${input.runId}`;
      const toolNames = copilotKitToolNames(input);
      const emittedToolCallIds = new Set<string>();
      let textOpen = false;
      let textSeen = false;

      const openText = () => {
        if (!textOpen) {
          emit({ type: EventType.TEXT_MESSAGE_START, messageId, role: "assistant" } as BaseEvent);
          textOpen = true;
        }
      };
      const closeText = () => {
        if (textOpen) {
          emit({ type: EventType.TEXT_MESSAGE_END, messageId } as BaseEvent);
          textOpen = false;
        }
      };
      const emitText = (delta: string) => {
        openText();
        emit({ type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta } as BaseEvent);
        textSeen = true;
      };
      const emitCopilotKitToolCall = (call: CopilotKitToolCall) => {
        if (emittedToolCallIds.has(call.id)) {
          return;
        }
        emittedToolCallIds.add(call.id);
        closeText();
        emit({
          type: EventType.TOOL_CALL_START,
          toolCallId: call.id,
          toolCallName: call.name,
          parentMessageId: messageId,
        } as BaseEvent);
        emit({ type: EventType.TOOL_CALL_ARGS, toolCallId: call.id, delta: stringifyToolArgs(call.args) } as BaseEvent);
        emit({ type: EventType.TOOL_CALL_END, toolCallId: call.id } as BaseEvent);
      };

      if (agentRun.events) {
        for await (const event of agentRun.events) {
          for (const call of copilotKitToolCallsFromSdkEvent(event, toolNames, this.idPrefix)) {
            emitCopilotKitToolCall(call);
          }
          const rawText = assistantTextFromSdkEvent(event);
          const { visibleText, calls: fencedCalls } = splitCopilotKitToolFences(rawText, toolNames, this.idPrefix);
          if (visibleText) {
            emitText(visibleText);
          }
          for (const call of fencedCalls) {
            emitCopilotKitToolCall(call);
          }
        }
      }
      closeText();

      await agentRun.finish?.();

      const result = agentRun.result?.();
      if (!textSeen && typeof result === "string" && result.length > 0) {
        emitText(result);
        closeText();
      }

      emit({ type: EventType.RUN_FINISHED, threadId: input.threadId, runId: input.runId } as BaseEvent);
    });
  }

  override clone(): this {
    const cloned = super.clone() as this;
    cloned.session = this.session;
    cloned.idPrefix = this.idPrefix;
    return cloned;
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.session.dispose?.();
  }
}
