/**
 * Persistence-process Claude agent for CopilotKit (#409), on the Claude Agent SDK.
 * Loads `@anthropic-ai/claude-agent-sdk` only via injected / default dynamic import — never
 * statically. The run loop and event mapping live in `agentBridge.ts`.
 */

import {
  BridgedAbstractAgent,
  createScratchCwd,
  loadSdkOnce,
  MIROIR_MCP_SERVER_NAME,
  miroirMcpServerConfig,
  requireSecret,
  resolveMcpHttpUrl,
  type AgentSession,
} from "./agentBridge.js";

const CLAUDE_SCRATCH_CWD_DIRNAME = ".miroir-claude-cwd";

/** Model used when `features.agentModel` is not set. */
export const DEFAULT_CLAUDE_AGENT_MODEL = "claude-opus-5-5";

/**
 * Variables the Claude Code subprocess inherits. The SDK `env` option replaces the subprocess
 * environment, so the server's own secrets (the secrets wrapping key, database passwords) stay out.
 */
const INHERITED_ENV_NAMES = [
  "PATH",
  "HOME",
  "USERPROFILE",
  "SYSTEMROOT",
  "TMPDIR",
  "TEMP",
  "TMP",
  "HTTPS_PROXY",
  "HTTP_PROXY",
  "NO_PROXY",
  "https_proxy",
  "http_proxy",
  "no_proxy",
  "NODE_EXTRA_CA_CERTS",
];

export type ClaudeSdkModule = {
  query: (params: { prompt: string; options: Record<string, unknown> }) => AsyncIterable<unknown>;
};

export type ImportClaudeSdk = () => Promise<ClaudeSdkModule>;

export type CreateClaudeAbstractAgentOptions = {
  importSdk?: ImportClaudeSdk;
  mcpHttpUrl?: string;
  apiPort?: number;
  mcpHeaders?: Record<string, string>;
  /** `features.agentModel`; defaults to `DEFAULT_CLAUDE_AGENT_MODEL`. */
  model?: string;
  cwdParent?: string;
};

const defaultImportSdk: ImportClaudeSdk = () =>
  import("@anthropic-ai/claude-agent-sdk") as unknown as Promise<ClaudeSdkModule>;

function subprocessEnv(apiKey: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const name of INHERITED_ENV_NAMES) {
    const value = process.env[name];
    if (value !== undefined) {
      env[name] = value;
    }
  }
  env.ANTHROPIC_API_KEY = apiKey;
  return env;
}

/** Fails the run on an error result, which the SDK reports as a message rather than a throw. */
async function* failOnErrorResult(messages: AsyncIterable<unknown>): AsyncIterable<unknown> {
  for await (const message of messages) {
    const typed = message as {
      type?: string;
      subtype?: string;
      is_error?: boolean;
      result?: string;
      errors?: string[];
    };
    if (typed?.type === "result" && (typed.is_error || (typed.subtype ?? "").startsWith("error"))) {
      const detail = typed.result || typed.errors?.join("; ") || typed.subtype || "unknown error";
      throw new Error(`Claude agent run failed: ${detail}`);
    }
    yield message;
  }
}

function claudeSession(sdk: ClaudeSdkModule, options: Record<string, unknown>): AgentSession {
  return {
    send: async (prompt) => ({ events: failOnErrorResult(sdk.query({ prompt, options })) }),
  };
}

export async function createClaudeAbstractAgent(
  options: CreateClaudeAbstractAgentOptions = {},
): Promise<BridgedAbstractAgent> {
  const mcpHttpUrl = resolveMcpHttpUrl(options, "Claude");
  const apiKey = requireSecret("aiAnthropicKey");
  const cwd = createScratchCwd(CLAUDE_SCRATCH_CWD_DIRNAME, options.cwdParent);
  const sdk = await loadSdkOnce(options.importSdk ?? defaultImportSdk);

  return new BridgedAbstractAgent(
    claudeSession(sdk, {
      model: options.model ?? DEFAULT_CLAUDE_AGENT_MODEL,
      cwd,
      env: subprocessEnv(apiKey),
      // Only the Miroir MCP tools: no built-in tool, no settings or MCP servers from disk.
      tools: [],
      allowedTools: [`mcp__${MIROIR_MCP_SERVER_NAME}__*`],
      disallowedTools: [
        "mcp__miroir__Miroir_compositeActionSequence",
        "mcp__miroir__Miroir_compositeRunBoxedQueryAction",
        "mcp__miroir__Miroir_compositeRunBoxedQueryTemplateAction",
        "mcp__miroir__Miroir_runBoxedQueryAction",
        "mcp__miroir__Miroir_runBoxedQueryTemplateAction",
      ],
      permissionMode: "dontAsk",
      settingSources: [],
      strictMcpConfig: true,
      mcpServers: {
        [MIROIR_MCP_SERVER_NAME]: miroirMcpServerConfig(mcpHttpUrl, options.mcpHeaders),
      },
    }),
    "claude",
  );
}
