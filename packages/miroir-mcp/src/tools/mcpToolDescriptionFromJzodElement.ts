import type { JzodElement } from "miroir-core";
import type { McpToolDescriptionProperty } from "./handlers_InstanceEndpoint.js";

/**
 * Recursively converts a JzodElement to an MCP tool description property.
 * 
 * @param jzodElement - The Jzod schema element to convert
 * @param propertyName - Optional property name for context-specific handling
 * @param propertyNameMapping - Optional mapping of property names for renaming
 * @returns An MCP tool description property
 */
export function mcpToolDescriptionFromJzodElement(
  jzodElement: JzodElement,
  propertyName?: string,
  propertyNameMapping?: Record<string, string>
): McpToolDescriptionProperty | any {
  // const jzodElement = jzodElement as any;

  // Extract description from tag
  const description = jzodElement.tag?.value?.description || jzodElement.tag?.value?.defaultLabel || '';

  switch (jzodElement.type) {
    case 'uuid':
    case 'string':
    case 'boolean':
      return {
        type: 'string',
        description,
      };

    case 'schemaReference': {
      switch (jzodElement.definition.relativePath) {
        case 'entityInstance': {
          return {
            type: "object",
            properties: {
              uuid: { type: "string", description: "Instance UUID" },
              parentUuid: { type: "string", description: "Parent entity UUID" },
            },
            required: ["uuid", "parentUuid"],
            additionalProperties: true,
          };
        }
        case 'applicationSection': {
          return {
            type: 'string',
            enum: ['model', 'data'],
            description: "A section of the application (model or data)",
          };
        }
        case 'entityInstanceCollection': {
          return {
            type: "object",
            properties: {
              parentName: { type: "string", description: "Parent entity name" },
              parentUuid: { type: "string", description: "Parent entity UUID" },
              applicationSection: {
                type: "string",
                enum: ["model", "data"],
                description: "A section of the application (model or data)",
              },
              instances: {
                type: "array",
                description: "Array of entity instances",
                items: {
                  type: "object",
                  properties: {
                    uuid: { type: "string", description: "Instance UUID" },
                    parentUuid: { type: "string", description: "Parent entity UUID" },
                  },
                  required: ["uuid", "parentUuid"],
                  additionalProperties: true,
                },
              },
            },
            required: ["parentUuid", "applicationSection", "instances" ],
            additionalProperties: true,
          };
        }
        default: {
          throw new Error(`Unsupported schema reference for MCP tool description: ${jzodElement.definition.relativePath}`);
        }
      }
    }

    case 'object': {
      const properties: Record<string, any> = {};
      const required: string[] = [];

      if (jzodElement.definition) {
        for (const [key, value] of Object.entries(jzodElement.definition)) {
          properties[key] = mcpToolDescriptionFromJzodElement(value as any, key, propertyNameMapping);
          if (!(value as any).optional && !(value as any).nullable) {
            required.push(key);
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
      // const arrayItemDef = jzodElement.definition;
      
      if (!jzodElement.definition) {
        throw new Error('Array definition missing item type');
      }
      return {
        type: 'array',
        description,
        items: mcpToolDescriptionFromJzodElement(jzodElement.definition, undefined, propertyNameMapping),
      };
    }
    case "enum": {
      return {
        type: 'string',
        description,
        enum: jzodElement.definition,
      };
    }
    case "number":
    case "bigint":
    case "undefined":
    case "function":
    case "any":
    case "never":
    case "unknown":
    case "void":
    case "date":
    case "lazy":
    case "literal":
    case "intersection":
    case "map":
    case "promise":
    case "record":
    case "set":
    case "tuple":
    case "union": {
      throw new Error(`Unsupported Jzod type for MCP tool description: ${jzodElement.type}`);
    }

    default:
      // Unknown type - return any
      return undefined;
  }
}
