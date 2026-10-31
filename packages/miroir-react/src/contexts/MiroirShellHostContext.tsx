import { createContext, useContext, type ComponentType, type ReactNode } from "react";

import type { ProcessCapabilities, Runner } from "miroir-core";

import { requestLoginTokenOverHttp } from "../auth/httpLogin.js";

// ################################################################################################
// Features of the app shell that the host application provides (#633 D2).
//
// miroir-react renders the shell, its pages and its runners. Three features need code that
// miroir-react must not depend on, so the host passes them in:
// - runMcpTool: calls an MCP tool (miroir-mcp/client),
// - requestLoginToken: logs in over a transport other than HTTP (Electron IPC),
// - assistantPanel: the AI assistant panel (CopilotKit).
//
// Every slot is optional; a missing slot falls back to its default (see useMiroirShellHost).
// Hosts should fill slots with `import()` wrappers, to keep that code out of the eager chunks.
// ################################################################################################

/** What a call of an mcpToolRunner returns to the runner view. */
export type McpToolRunnerEnvelope = {
  status?: string;
  action?: string;
  result?: unknown;
  error?: { message?: string; type?: string; capability?: string };
};

export type RunMcpTool = (
  runner: Runner,
  args: Record<string, unknown>,
  serverUrl: string,
  capabilities: Pick<ProcessCapabilities, "mcp">,
) => Promise<McpToolRunnerEnvelope>;

export type RequestLoginToken = (username: string, password: string) => Promise<string | undefined>;

export interface MiroirShellHost {
  /** Calls the MCP tool of an mcpToolRunner. Default: returns a FeatureUnavailable error. */
  runMcpTool?: RunMcpTool;
  /** Returns a Bearer token for the credentials, or undefined if login fails. Default: POST `/auth/login`. */
  requestLoginToken?: RequestLoginToken;
  /** Assistant panel, mounted by RootComponent the first time the AI AppBar panel opens. Default: no panel. */
  assistantPanel?: ComponentType;
}

export const mcpToolUnavailable: RunMcpTool = async () => ({
  status: "error",
  error: {
    message: "This client cannot call MCP tools",
    type: "FeatureUnavailable",
    capability: "mcp",
  },
});

const MiroirShellHostContext = createContext<MiroirShellHost>({});

export function MiroirShellHostProvider(props: { host: MiroirShellHost; children?: ReactNode }) {
  return <MiroirShellHostContext.Provider value={props.host}>{props.children}</MiroirShellHostContext.Provider>;
}

/** The host's slots, with each missing slot replaced by its default. */
export function useMiroirShellHost(): Required<Omit<MiroirShellHost, "assistantPanel">> &
  Pick<MiroirShellHost, "assistantPanel"> {
  const host = useContext(MiroirShellHostContext);
  return {
    runMcpTool: host.runMcpTool ?? mcpToolUnavailable,
    requestLoginToken: host.requestLoginToken ?? requestLoginTokenOverHttp,
    assistantPanel: host.assistantPanel,
  };
}
