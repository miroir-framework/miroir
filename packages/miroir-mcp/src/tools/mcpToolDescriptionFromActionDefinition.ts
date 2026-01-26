import { type EndpointDefinition } from "miroir-core";
import type { McpToolDescription } from "./handlers_InstanceEndpoint.js";
import { mcpToolDescriptionFromJzodElement } from "./mcpToolDescriptionFromJzodElement.js";

/**
 * Generates an MCP tool description from an action definition in an endpoint.
 * 
 * @param toolName - The name of the MCP tool (e.g., "miroir_createInstance")
 * @param endpoint - The endpoint definition containing action definitions
 * @returns An MCP tool description with name, description, and JSON schema
 */
export function mcpToolDescriptionFromActionDefinition(
  toolName: string,
  endpoint: EndpointDefinition
): McpToolDescription {
  // Extract the action type from the tool name (e.g., "miroir_createInstance" -> "createInstance")
  const actionType = toolName.replace('miroir_', '');
  
  // Find the action definition matching the action type
  const actionDef = endpoint.definition.actions.find(
    (action: any) => action.actionParameters.actionType.definition === actionType
  );

  if (!actionDef) {
    throw new Error(`Action definition not found for action type: ${actionType}`);
  }

  if (!actionDef.actionParameters.payload) {
    throw new Error(`Payload definition not found for action type: ${actionType}`);
  }

  // Get the payload definition as a JzodObject
  const payload = actionDef.actionParameters.payload;
  
  // Map of internal property names to MCP tool property names
  const propertyNameMapping: Record<string, string> = {
    // objects: 'objects', // Map 'objects' to 'instances' for MCP tools
  };

  // Convert the entire payload object using the recursive function
  const inputSchema = mcpToolDescriptionFromJzodElement(
    payload,
    undefined,
    propertyNameMapping
  ) as any;

  // Build the complete description
  const description = getActionDescription(actionType);

  return {
    name: toolName,
    description,
    inputSchema,
  };
}

/**
 * Get the description for each action type
 */
function getActionDescription(actionType: string): string {
  const descriptions: Record<string, string> = {
    createInstance: 'Create new entity instances in Miroir. Creates one or more instances of a specific entity type in the specified application deployment.',
    getInstance: 'Retrieve a single entity instance by UUID. Returns the complete instance data for the specified entity instance.',
    getInstances: 'Retrieve all instances of a specific entity type. Returns an array of all instances for the given entity.',
    updateInstance: 'Update existing entity instances. Updates one or more instances with new data. Instances are identified by their uuid and parentUuid.',
    deleteInstance: 'Delete a single entity instance by UUID. Removes the instance from the specified deployment.',
    deleteInstanceWithCascade: 'Delete an entity instance and all its dependent instances (cascade delete). Removes the instance and any related instances that reference it.',
    loadNewInstancesInLocalCache: 'Load new instances into the local cache without persisting them. Useful for temporary data or previewing changes before committing.',
  };
  
  return descriptions[actionType] || `Execute ${actionType} action`;
}
