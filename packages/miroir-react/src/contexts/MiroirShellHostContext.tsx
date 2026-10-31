import { createContext, useContext, type ReactNode } from "react";

import type { ProcessCapabilities, Runner } from "miroir-core";

// ################################################################################################
// Host features of the app shell (#633 D2). miroir-react renders the shell, its pages and its
// runners; what needs code miroir-react must not depend on comes from the host application:
// the MCP tool call (miroir-mcp/client). Every slot is optional and has the behaviour a client
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

export interface MiroirShellHost {
  /** Calls the MCP tool of an mcpToolRunner. Default: the feature is unavailable. */
  runMcpTool?: RunMcpTool;
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
export function useMiroirShellHost(): Required<MiroirShellHost> {
  const host = useContext(MiroirShellHostContext);
  return { runMcpTool: host.runMcpTool ?? mcpToolUnavailable };
}
