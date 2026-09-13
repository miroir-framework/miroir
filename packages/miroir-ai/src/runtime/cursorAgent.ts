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

const CURSOR_DUMMY_CWD_DIRNAME = ".miroir-cursor-cwd";
const CURSOR_NODE_MAJOR = 22;
const CURSOR_NODE_MINOR = 13;
const CURSOR_NODE_PATCH = 0;
const CURSOR_NODE_FLOOR = `${CURSOR_NODE_MAJOR}.${CURSOR_NODE_MINOR}.${CURSOR_NODE_PATCH}`;
const MIROIR_MCP_SERVER_NAME = "miroir";

export type CursorSdkAgentHandle = {
  send?: (prompt: string) => Promise<{
    stream?: () => AsyncIterable<unknown>;
    wait?: () => Promise<unknown>;
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

function lastUserText(input: RunAgentInput): string {
  for (let index = input.messages.length - 1; index >= 0; index -= 1) {
    const message = input.messages[index] as { role?: string; content?: unknown };
    if (message.role !== "user") {
      continue;
    }
    const content = message.content;
    if (typeof content === "string") {
      return content;
    }
    if (Array.isArray(content)) {
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
  }
  return "";
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

function observableFromAsync(run: (emit: (event: BaseEvent) => void) => Promise<void>) {
  return {
    subscribe(observerOrNext?: any, error?: any, complete?: any) {
      const observer =
        typeof observerOrNext === "function"
          ? { next: observerOrNext, error, complete }
          : observerOrNext ?? {};
      let closed = false;
      void run((event) => {
        if (!closed) {
          observer.next?.(event);
        }
      })
        .then(() => {
          if (!closed) {
            observer.complete?.();
          }
        })
        .catch((err) => {
          if (!closed) {
            observer.error?.(err);
          }
        });
      return {
        unsubscribe() {
          closed = true;
        },
      };
    },
  };
}

class CursorSdkAbstractAgent extends AbstractAgent {
  constructor(private readonly sdkAgent: CursorSdkAgentHandle) {
    super({ agentId: "cursor" });
  }

  run(input: RunAgentInput) {
    return observableFromAsync(async (emit) => {
      emit({
        type: EventType.RUN_STARTED,
        threadId: input.threadId,
        runId: input.runId,
      } as BaseEvent);

      const prompt = lastUserText(input);
      const sdkRun = await this.sdkAgent.send?.(prompt);
      const messageId = `cursor-${input.runId}`;
      let started = false;

      if (sdkRun?.stream) {
        for await (const event of sdkRun.stream()) {
          const text = assistantTextFromSdkEvent(event);
          if (!text) {
            continue;
          }
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
            delta: text,
          } as BaseEvent);
        }
      }

      if (started) {
        emit({
          type: EventType.TEXT_MESSAGE_END,
          messageId,
        } as BaseEvent);
      }

      await sdkRun?.wait?.();

      emit({
        type: EventType.RUN_FINISHED,
        threadId: input.threadId,
        runId: input.runId,
      } as BaseEvent);
    }) as ReturnType<AbstractAgent["run"]>;
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
