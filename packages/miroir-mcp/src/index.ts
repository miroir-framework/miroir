/**
 * Miroir MCP: exposes the Endpoint actions of the deployed applications as MCP tools.
 *
 * A library: miroir-server and the Electron main process serve MCP from their environment
 * (`server.mcpUrl`, `features.mcp`, see docs/reference/environments.md). The package has no
 * configuration of its own (#345).
 */
import { MiroirMcpServer, setupMcpServer, refreshLocalCachesForDeployedApplications, MCP_HTTP_ENDPOINT } from "./mcpServer.js";

export { MiroirMcpServer, setupMcpServer, refreshLocalCachesForDeployedApplications, MCP_HTTP_ENDPOINT };
export { EndpointToolRegistry, toolNameFor } from "./tools/EndpointToolRegistry.js";
export { callMcpToolViaHttp, listMcpToolsViaHttp, sendMcpRequestViaHttp } from "./mcpHttpClient.js";
export type { McpHttpFetch } from "./mcpHttpClient.js";
export { startEphemeralMcpHttpServer } from "./ephemeralMcpHttp.js";
export type { EphemeralMcpHttpServer } from "./ephemeralMcpHttp.js";
