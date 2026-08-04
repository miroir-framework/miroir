import {
  type JzodElement,
  resolveJzodSchemaReferenceInContext,
  type JzodReference,
  defaultMiroirModelEnvironment,
} from "miroir-core";
import type { McpToolDescriptionProperty } from "./mcpHandlersForEndpoint.js";
import {
  isJzodConversionLimitReached,
  normalizeJzodConversionOptions,
  schemaReferenceKey,
  type JzodConversionOptions,
} from "./jzodConversionContext.js";

function looseObject(description: string): McpToolDescriptionProperty {
  return {
    type: "object",
    description: description || "Open object (recursive or opaque Miroir schema)",
    properties: {},
    required: [],
    additionalProperties: true,
  };
}

/**
 * Recursively converts a JzodElement to an MCP tool description property.
 *
 * Schema references are resolved against the Miroir fundamental model environment.
 * Cyclic references (jzodElement ↔ jzodObject, compositeAction ↔ domainAction, …)
 * degrade to a generic object rather than overflowing the stack.
 */
export function jzodElementToJsonSchema(
  jzodElement: JzodElement,
  propertyName?: string,
  propertyNameMapping?: Record<string, string>,
  conversionOptions?: JzodConversionOptions,
): McpToolDescriptionProperty | any {
  const options = normalizeJzodConversionOptions(conversionOptions);
  if (options.depth >= options.maxDepth) {
    return looseObject("");
  }

  const description =
    jzodElement.tag?.value?.description || jzodElement.tag?.value?.defaultLabel || "";

  switch (jzodElement.type) {
    case "uuid":
    case "string":
      return {
        type: "string",
        description,
      };

    case "boolean":
      return {
        type: "boolean",
        description,
      };

    case "schemaReference": {
      const ref = jzodElement as JzodReference;
      const refKey = schemaReferenceKey(ref);
      if (isJzodConversionLimitReached(options, refKey)) {
        return looseObject(description);
      }

      options.resolvingRefs.add(refKey);
      const childOptions: JzodConversionOptions = {
        ...options,
        depth: options.depth + 1,
      };

      try {
        const resolvedSchema = resolveJzodSchemaReferenceInContext(
          ref,
          ref.context || {},
          defaultMiroirModelEnvironment,
        );
        return jzodElementToJsonSchema(
          resolvedSchema,
          propertyName,
          propertyNameMapping,
          childOptions,
        );
      } finally {
        options.resolvingRefs.delete(refKey);
      }
    }

    case "object": {
      const properties: Record<string, any> = {};
      const required: string[] = [];

      if (jzodElement.definition) {
        for (const [key, value] of Object.entries(jzodElement.definition)) {
          properties[key] = jzodElementToJsonSchema(
            value as any,
            key,
            propertyNameMapping,
            { ...options, depth: options.depth + 1 },
          );
          if (!(value as any).optional && !(value as any).nullable) {
            required.push(key);
          }
        }
      }

      return {
        type: "object",
        properties,
        required,
        additionalProperties: true,
      };
    }

    case "array": {
      if (!jzodElement.definition) {
        throw new Error("Array definition missing item type");
      }
      return {
        type: "array",
        description,
        items: jzodElementToJsonSchema(
          jzodElement.definition,
          undefined,
          propertyNameMapping,
          { ...options, depth: options.depth + 1 },
        ),
      };
    }
    case "enum": {
      return {
        type: "string",
        description,
        enum: jzodElement.definition,
      };
    }
    case "number": {
      return {
        type: "number",
        description,
      };
    }
    case "date": {
      return {
        type: "string",
        format: "date-time",
        description,
      };
    }
    case "literal": {
      const literalValue = jzodElement.definition;
      const literalType = typeof literalValue === "number" ? "number" : "string";
      return {
        type: literalType,
        const: literalValue,
        description,
      };
    }
    case "record": {
      if (!jzodElement.definition) {
        throw new Error("Record definition missing value type");
      }
      return {
        type: "object",
        description,
        additionalProperties: jzodElementToJsonSchema(
          jzodElement.definition,
          undefined,
          propertyNameMapping,
          { ...options, depth: options.depth + 1 },
        ),
      };
    }
    case "tuple": {
      if (!jzodElement.definition || !Array.isArray(jzodElement.definition)) {
        throw new Error("Tuple definition missing or invalid");
      }
      const prefixItems = jzodElement.definition.map((item) =>
        jzodElementToJsonSchema(item as any, undefined, propertyNameMapping, {
          ...options,
          depth: options.depth + 1,
        }),
      );
      return {
        type: "array",
        description,
        prefixItems,
        minItems: prefixItems.length,
        maxItems: prefixItems.length,
      };
    }
    case "union": {
      if (!jzodElement.definition || !Array.isArray(jzodElement.definition)) {
        throw new Error("Union definition missing or invalid");
      }

      const convertedMembers = jzodElement.definition.map((member) =>
        jzodElementToJsonSchema(member as any, undefined, propertyNameMapping, {
          ...options,
          depth: options.depth + 1,
        }),
      );

      const isDiscriminated = !!(jzodElement as any).discriminator;

      if (isDiscriminated) {
        return {
          oneOf: convertedMembers,
          discriminator: {
            propertyName: (jzodElement as any).discriminator,
          },
          description,
        };
      }
      return {
        anyOf: convertedMembers,
        description,
      };
    }
    case "intersection": {
      const intersection = jzodElement.definition as { left?: JzodElement; right?: JzodElement };
      if (!intersection?.left || !intersection?.right) {
        return looseObject(description);
      }
      return {
        allOf: [
          jzodElementToJsonSchema(intersection.left, propertyName, propertyNameMapping, {
            ...options,
            depth: options.depth + 1,
          }),
          jzodElementToJsonSchema(intersection.right, propertyName, propertyNameMapping, {
            ...options,
            depth: options.depth + 1,
          }),
        ],
        description,
      };
    }
    case "lazy": {
      if (!jzodElement.definition) {
        return looseObject(description);
      }
      return jzodElementToJsonSchema(
        jzodElement.definition,
        propertyName,
        propertyNameMapping,
        { ...options, depth: options.depth + 1 },
      );
    }
    case "any":
    case "unknown":
    case "void":
    case "undefined":
      return looseObject(description);
    case "bigint":
      return {
        type: "string",
        description: description || "BigInt (serialized as string)",
      };
    case "never":
      return {
        type: "object",
        description: description || "Never",
        properties: {},
        required: [],
        additionalProperties: false,
      };
    case "function":
    case "map":
    case "promise":
    case "set": {
      throw new Error(`Unsupported Jzod type for MCP tool description: ${jzodElement.type}`);
    }

    default:
      return looseObject(description);
  }
}
