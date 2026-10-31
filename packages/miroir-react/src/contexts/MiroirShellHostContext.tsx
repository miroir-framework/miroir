import { createContext, useContext, type ComponentType, type ReactNode } from "react";

import type { ProcessCapabilities, Runner } from "miroir-core";

import { requestLoginTokenOverHttp } from "../auth/httpLogin.js";

// ################################################################################################
// Host features of the app shell (#633 D2). miroir-react renders the shell, its pages and its
// runners; what needs code miroir-react must not depend on comes from the host application:
// the MCP tool call (miroir-mcp/client), a login transport other than HTTP (Electron IPC) and the
// assistant panel (CopilotKit). Every slot is optional and has the behaviour a client
// without the feature needs. The host fills the slots with `import()` wrappers so the code they
// reach stays out of the page's eager chunks.
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
  /** Calls the MCP tool of an mcpToolRunner. Default: the feature is unavailable. */
  runMcpTool?: RunMcpTool;
  /** The Bearer token for these credentials, or undefined when the login fails. Default: `/auth/login` over HTTP. */
  requestLoginToken?: RequestLoginToken;
  /** The assistant panel RootComponent mounts once the AI AppBar button is used. Default: none. */
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
