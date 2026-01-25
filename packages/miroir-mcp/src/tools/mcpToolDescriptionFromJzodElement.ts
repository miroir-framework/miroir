import type { JzodElement } from "miroir-core";
import type { McpToolDescriptionProperty } from "./handlers_InstanceEndpoint.js";

/**
 * Recursively converts a JzodElement to an MCP tool description property.
 * 
 * @param jzodElement - The Jzod schema element to convert
 * @param propertyName - Optional property name for context-specific handling
 * @returns An MCP tool description property
 */
export function mcpToolDescriptionFromJzodElement(
  jzodElement: JzodElement,
  propertyName?: string
): McpToolDescriptionProperty | any {
  const propDef = jzodElement as any;

  // Extract description from tag
  const description = propDef.tag?.value?.description || propDef.tag?.value?.defaultLabel || '';

  switch (propDef.type) {
    case 'uuid':
    case 'string':
    case 'boolean':
      return {
        type: 'string',
        description,
      };

    case 'schemaReference':
      // Handle applicationSection specifically
      if (propertyName === 'applicationSection') {
        return {
          type: 'string',
          enum: ['model', 'data'],
          description,
        };
      }
      // For other schema references, return any since we can't resolve them
      return undefined;

    case 'object': {
      const properties: Record<string, any> = {};
      const required: string[] = [];

      if (propDef.definition) {
        for (const [key, value] of Object.entries(propDef.definition)) {
          const fieldDef = value as any;
          
          // Skip optional fields that don't have a description (internal-only fields)
          if (fieldDef.optional && !fieldDef.tag?.value?.description) {
            continue;
          }

          const fieldSchema = mcpToolDescriptionFromJzodElement(fieldDef, key);
          
          if (fieldSchema !== undefined) {
            properties[key] = fieldSchema;
            
            // Add to required if not optional and not nullable
            if (!fieldDef.optional && !fieldDef.nullable) {
              required.push(key);
            }
          }
        }
      }

      return {
        type: 'object',
        properties,
        required,
        additionalProperties: true,
      };
    }

    case 'array': {
      const arrayItemDef = propDef.definition;
      
      if (!arrayItemDef) {
        return {
          type: 'array',
          description,
        };
      }

      if (arrayItemDef.type === 'object') {
        // Recursively convert the object items
        const itemsSchema = mcpToolDescriptionFromJzodElement(arrayItemDef);
        return {
          type: 'array',
          description,
          items: itemsSchema,
        };
      } else if (arrayItemDef.type === 'schemaReference') {
        // Schema references in arrays can't be fully resolved
        return {
          type: 'array',
          description,
        };
      } else {
        // Other array item types
        const itemsSchema = mcpToolDescriptionFromJzodElement(arrayItemDef);
        return {
          type: 'array',
          description,
          items: itemsSchema,
        };
      }
    }

    default:
      // Unknown type - return any
      return undefined;
  }
}
