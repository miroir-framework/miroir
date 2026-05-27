// ################################################################################################
// aggregate all instance action tools

import type { McpRequestHandlers } from "./handlersForEndpoint.js";
import { mcpRequestHandlers_Library_lendingEndpoint } from "./ToolsForApplication_Library.js";
// import { mcpRequestHandlers_Library_lendingEndpoint } from "./ToolsForApplication_Library.js";
import { getMcpRequestHandlers_EntityEndpoint } from "./ToolsForApplication_Miroir.js";

// ################################################################################################
export function getMcpRequestHandlers(): McpRequestHandlers {
  const result: McpRequestHandlers = {
     ...getMcpRequestHandlers_EntityEndpoint(), // Pass the existing handlers to allow for composition};
     ...mcpRequestHandlers_Library_lendingEndpoint
  }
  return result;
}