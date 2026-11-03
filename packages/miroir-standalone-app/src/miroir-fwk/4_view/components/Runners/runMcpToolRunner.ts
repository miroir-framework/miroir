// #672 D6: the MCP tool runner lives in @miroir-framework/mcp/client, the package's browser entry,
// so that miroir-react-testing and the app share it.
export { browserMcpServerUrl, runMcpToolRunner } from "@miroir-framework/mcp/client";
export type { McpToolRunnerEnvelope } from "@miroir-framework/mcp/client";
