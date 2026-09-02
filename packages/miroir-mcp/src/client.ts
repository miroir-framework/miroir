/**
 * Browser-safe Miroir MCP surface. Do not import the package root from Vite client
 * code: `dist/index.js` is the Node CLI (shebang + Express).
 */
export { MCP_HTTP_ENDPOINT } from "./mcpConstants.js";
export { callMcpToolViaHttp, listMcpToolsViaHttp, sendMcpRequestViaHttp } from "./mcpHttpClient.js";
export type { McpHttpFetch } from "./mcpHttpClient.js";
export {
  MCP_TOOL_NAME_MAX_LENGTH,
  sanitizeToolNamePart,
  toolNameFor,
  truncateToolName,
} from "./tools/toolNameFor.js";
