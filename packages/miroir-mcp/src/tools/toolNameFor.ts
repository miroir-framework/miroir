// #627: the naming of endpoint actions lives in the miroir-core endpoint action catalog, shared by
// every surface; these are its historical miroir-mcp names.
export {
  ENDPOINT_ACTION_NAME_MAX_LENGTH as MCP_TOOL_NAME_MAX_LENGTH,
  endpointActionName as toolNameFor,
  sanitizeEndpointActionNamePart as sanitizeToolNamePart,
  truncateEndpointActionName as truncateToolName,
} from "@miroir-framework/core";
