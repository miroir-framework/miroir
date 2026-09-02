import type { Runner } from "miroir-core";
import { callMcpToolViaHttp, type McpHttpFetch } from "miroir-mcp/client";

export type McpToolRunnerEnvelope = {
  status?: string;
  action?: string;
  result?: unknown;
  error?: { message?: string; type?: string };
};

export async function runMcpToolRunner(
  runner: Runner,
  args: Record<string, unknown>,
  serverUrl: string,
  fetchImpl?: McpHttpFetch,
): Promise<McpToolRunnerEnvelope> {
  if (runner.definition.runnerType !== "mcpToolRunner") {
    throw new Error(
      `runMcpToolRunner: expected mcpToolRunner, got ${runner.definition.runnerType}`,
    );
  }
  const response = await callMcpToolViaHttp(
    serverUrl,
    runner.definition.toolName,
    args,
    fetchImpl,
  );
  return (response.content[0]?.parsed ?? {}) as McpToolRunnerEnvelope;
}

export function browserMcpServerUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "http://127.0.0.1";
}
