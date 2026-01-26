import { 
  miroirFundamentalJzodSchema, 
  type JzodElement,
  resolveJzodSchemaReferenceInContext,
  type JzodReference,
  type MlSchema,
} from "miroir-core";
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
      // Resolve the schema reference using the miroir context
      const resolvedSchema = resolveJzodSchemaReferenceInContext(
        jzodElement as JzodReference,
        (jzodElement as JzodReference).context || {},
        { 
          miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as MlSchema,
          endpointsByUuid: {}
        }
      );
      
      // Recursively convert the resolved schema
      return mcpToolDescriptionFromJzodElement(resolvedSchema, propertyName, propertyNameMapping);
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
    case 'enum': {
      return {
        type: 'string',
        description,
        enum: jzodElement.definition,
      };
    }
    case "number": {
      return {
        type: 'number',
        description,
      };
    }
    case "date": {
      return {
        type: 'string',
        format: 'date-time',
        description,
      };
    }
    case "literal": {
      const literalValue = jzodElement.definition;
      const literalType = typeof literalValue === 'number' ? 'number' : 'string';
      return {
        type: literalType,
        const: literalValue,
        description,
      };
    }
    case "record": {
      if (!jzodElement.definition) {
        throw new Error('Record definition missing value type');
      }
      return {
        type: 'object',
        description,
        additionalProperties: mcpToolDescriptionFromJzodElement(jzodElement.definition, undefined, propertyNameMapping),
      };
    }
    case "tuple": {
      if (!jzodElement.definition || !Array.isArray(jzodElement.definition)) {
        throw new Error('Tuple definition missing or invalid');
      }
      const prefixItems = jzodElement.definition.map(item => 
        mcpToolDescriptionFromJzodElement(item as any, undefined, propertyNameMapping)
      );
      return {
        type: 'array',
        description,
        prefixItems,
        minItems: prefixItems.length,
        maxItems: prefixItems.length,
      };
    }
    case "union": {
      if (!jzodElement.definition || !Array.isArray(jzodElement.definition)) {
        throw new Error('Union definition missing or invalid');
      }
      
      // Convert all union members recursively
      const convertedMembers = jzodElement.definition.map(member => 
        mcpToolDescriptionFromJzodElement(member as any, undefined, propertyNameMapping)
      );
      
      // Check if this is a discriminated union
      const isDiscriminated = !!(jzodElement as any).discriminator;
      
      if (isDiscriminated) {
        // Use oneOf for discriminated unions with discriminator info
        return {
          oneOf: convertedMembers,
          discriminator: {
            propertyName: (jzodElement as any).discriminator,
          },
          description,
        };
      } else {
        // Use anyOf for general unions
        return {
          anyOf: convertedMembers,
          description,
        };
      }
    }
    case "bigint":
    case "undefined":
    case "function":
    case "any":
    case "never":
    case "unknown":
    case "void":
    case "lazy":
    case "intersection":
    case "map":
    case "promise":
    case "set": {
      throw new Error(`Unsupported Jzod type for MCP tool description: ${jzodElement.type}`);
    }

    default:
      // Unknown type - return any
      return undefined;
  }
}
