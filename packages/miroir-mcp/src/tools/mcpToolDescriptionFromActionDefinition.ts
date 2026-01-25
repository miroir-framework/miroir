import { EndpointDefinition } from "miroir-core";
import type { mcpToolDescription } from "./handlers_InstanceEndpoint.js";

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
): mcpToolDescription {
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

  // Get the payload definition
  const payloadDef = actionDef.actionParameters.payload.definition;
  
  // Map of internal property names to MCP tool property names
  const propertyNameMapping: Record<string, string> = {
    objects: 'instances', // Map 'objects' to 'instances' for MCP tools
  };

  // Build the inputSchema properties and required array from the payload definition
  // Preserving the order from the endpoint definition
  const properties: Record<string, any> = {};
  const required: string[] = [];

  // Process each property in the payload definition (order is preserved)
  for (const [key, value] of Object.entries(payloadDef)) {
    const propDef = value as any;
    
    // Skip optional fields that don't have a description (internal-only fields)
    if (propDef.optional && !propDef.tag?.value?.description) {
      continue;
    }
    
    // Get the mapped property name or use the original
    const mappedKey = propertyNameMapping[key] || key;

    // Determine if this field is required (not optional and not nullable)
    const isRequired = !propDef.optional && !propDef.nullable;

    // Build the property schema based on its type
    if (propDef.type === 'uuid' || propDef.type === 'string' || propDef.type === 'boolean') {
      properties[mappedKey] = {
        type: 'string',
        description: propDef.tag?.value?.description || propDef.tag?.value?.defaultLabel || '',
      };
      if (isRequired) {
        required.push(mappedKey);
      }
    } else if (propDef.type === 'schemaReference') {
      // Handle applicationSection specifically
      if (key === 'applicationSection') {
        properties[mappedKey] = {
          type: 'string',
          enum: ['model', 'data'],
          description: propDef.tag?.value?.description || '',
        };
        if (isRequired) {
          required.push(mappedKey);
        }
      }
    } else if (propDef.type === 'array') {
      // Handle arrays (like objects/instances)
      const arrayItemDef = propDef.definition;
      
      if (arrayItemDef?.type === 'object') {
        // Build items schema for object arrays
        const itemProperties: Record<string, any> = {};
        const itemRequired: string[] = [];
        
        if (arrayItemDef.definition?.instances?.definition) {
          // This is the objects array with nested instances
          itemProperties.uuid = { type: 'string', description: 'Instance UUID' };
          itemProperties.parentUuid = { type: 'string', description: 'Parent entity UUID' };
          itemRequired.push('uuid', 'parentUuid');
          
          properties[mappedKey] = {
            type: 'array',
            description: propDef.tag?.value?.description || '',
            items: {
              type: 'object',
              properties: itemProperties,
              required: itemRequired,
              additionalProperties: true,
            },
          };
          if (isRequired) {
            required.push(mappedKey);
          }
        }
      } else if (arrayItemDef?.type === 'schemaReference') {
        // Handle schema reference arrays (like entityInstanceCollection)
        properties[mappedKey] = {
          type: 'array',
          description: propDef.tag?.value?.description || '',
        };
        if (isRequired) {
          required.push(mappedKey);
        }
      }
    }
  }

  // Build the complete description
  const description = getActionDescription(actionType);

  return {
    name: toolName,
    description,
    inputSchema: {
      type: 'object',
      properties,
      required,
    },
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
