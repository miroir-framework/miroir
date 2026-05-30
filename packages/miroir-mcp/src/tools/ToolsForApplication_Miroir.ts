import {
  type EndpointDefinition
} from "miroir-core";
import { mcpToolEntry, type McpRequestHandler, type McpRequestHandlers } from "./mcpHandlersForEndpoint.js";

export interface getMcpRequestHandlersFromEndpointParams {
  instanceEndpoint: EndpointDefinition;
  endpointActions: string[];
  toolPrefix: string;
}

// ################################################################################################
export function getMcpRequestHandlersFromEndpoint(
  {instanceEndpoint, endpointActions, toolPrefix}: getMcpRequestHandlersFromEndpointParams,
): McpRequestHandlers {
  const result: McpRequestHandlers = endpointActions.reduce((acc, actionType) => {
    const toolName = toolPrefix + actionType;
    const toolConfig: McpRequestHandler<any> = mcpToolEntry(
      instanceEndpoint,
      actionType,
      toolPrefix
    );
    acc[toolName] = toolConfig;
    return acc;
  }, {} as McpRequestHandlers);

  return result;
}