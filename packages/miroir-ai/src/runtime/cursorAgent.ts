/**
 * Persistence-process Cursor agent for CopilotKit (#275 Slice 4, #409).
 * Loads `@cursor/sdk` only via injected / default dynamic import — never statically. The run
 * loop and event mapping live in `agentBridge.ts`.
 */

import {
  BridgedAbstractAgent,
  createScratchCwd,
  loadSdkOnce,
  MIROIR_MCP_SERVER_NAME,
  requireSecret,
  resolveMcpHttpUrl,
  type AgentSession,
} from "./agentBridge.js";

export { loopbackMcpHttpUrl, promptFromRunInput } from "./agentBridge.js";

const CURSOR_DUMMY_CWD_DIRNAME = ".miroir-cursor-cwd";
const CURSOR_NODE_MAJOR = 22;
const CURSOR_NODE_MINOR = 13;
const CURSOR_NODE_PATCH = 0;
const CURSOR_NODE_FLOOR = `${CURSOR_NODE_MAJOR}.${CURSOR_NODE_MINOR}.${CURSOR_NODE_PATCH}`;

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

export function createCursorDummyCwd(parentDirectory?: string): string {
  return createScratchCwd(CURSOR_DUMMY_CWD_DIRNAME, parentDirectory);
}

function cursorSession(sdkAgent: CursorSdkAgentHandle): AgentSession {
  return {
    send: async (prompt) => {
      const sdkRun = await sdkAgent.send?.(prompt);
      return {
        events: sdkRun?.stream?.(),
        finish: async () => {
          await sdkRun?.wait?.();
        },
        result: () => sdkRun?.result,
      };
    },
    dispose: async () => {
      await sdkAgent[Symbol.asyncDispose]?.();
    },
  };
}

export async function createCursorAbstractAgent(
  options: CreateCursorAbstractAgentOptions = {},
): Promise<BridgedAbstractAgent> {
  const nodeVersion = options.nodeVersion ?? process.versions.node;
  if (!isNodeVersionAtLeast(CURSOR_NODE_MAJOR, CURSOR_NODE_MINOR, CURSOR_NODE_PATCH, nodeVersion)) {
    throw new Error(
      `Cursor agent requires Node.js ${CURSOR_NODE_FLOOR} or later (current: ${nodeVersion})`,
    );
  }

  const mcpHttpUrl = resolveMcpHttpUrl(options, "Cursor");
  const apiKey = requireSecret("aiCursorKey");
  const cwd = createCursorDummyCwd(options.cwdParent);
  const sdk = await loadSdkOnce(options.importSdk ?? defaultImportSdk);

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

  return new BridgedAbstractAgent(cursorSession(sdkAgent), "cursor");
}
