import {
  type EndpointDefinition
} from "miroir-core";
import { mcpToolEntry, type McpRequestHandler, type McpRequestHandlers } from "./handlersForEndpoint.js";

// ################################################################################################
export function getMcpRequestHandlersFromEndpoint(
  instanceEndpointV1:EndpointDefinition,
  endpointActions: string[],
  toolPrefix: string,
): McpRequestHandlers {
  const result: McpRequestHandlers = endpointActions.reduce((acc, actionType) => {
    const toolName = toolPrefix + actionType;
    const toolConfig: McpRequestHandler<any> = mcpToolEntry(
      instanceEndpointV1,
      actionType,
      toolPrefix
    );
    acc[toolName] = toolConfig;
    return acc;
  }, {} as McpRequestHandlers);

  return result;
}