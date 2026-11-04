/**
 * #672 D6: runs an `mcpToolRunner` over the MCP HTTP endpoint. Browser-safe: it only calls
 * `callMcpToolViaHttp`. Used by the apps' shell host and by the runner tests of
 * `@miroir-framework/react-testing`.
 */
import { browserMcpServerUrl, type ProcessCapabilities, type Runner } from "@miroir-framework/core";

import { callMcpToolViaHttp, type McpHttpFetch } from "./mcpHttpClient.js";

export { browserMcpServerUrl };

/** What a Miroir MCP tool answers; the same shape as `McpToolRunnerEnvelope` of `@miroir-framework/react`. */
export type McpToolRunnerEnvelope = {
  status?: string;
  action?: string;
  result?: unknown;
  error?: { message?: string; type?: string; capability?: string };
};

export async function runMcpToolRunner(
  runner: Runner,
  args: Record<string, unknown>,
  serverUrl: string,
  capabilities: Pick<ProcessCapabilities, "mcp">,
  fetchImpl?: McpHttpFetch,
): Promise<McpToolRunnerEnvelope> {
  if (runner.definition.runnerType !== "mcpToolRunner") {
    throw new Error(
      `runMcpToolRunner: expected mcpToolRunner, got ${runner.definition.runnerType}`,
    );
  }
  if (capabilities.mcp !== true) {
    return {
      status: "error",
      error: {
        message: 'Process capability "mcp" is not available',
        type: "FeatureUnavailable",
        capability: "mcp",
      },
    };
  }
  try {
    const response = await callMcpToolViaHttp(
      serverUrl,
      runner.definition.toolName,
      args,
      fetchImpl,
    );
    return (response.content[0]?.parsed ?? {}) as McpToolRunnerEnvelope;
  } catch (error) {
    return {
      status: "error",
      error: {
        message: error instanceof Error ? error.message : String(error),
        type: "FailedToHandleAction",
      },
    };
  }
}
