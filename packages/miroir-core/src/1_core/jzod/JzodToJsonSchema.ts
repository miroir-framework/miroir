import type { JzodElement } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

// ################################################################################################
export interface JsonSchema {
  type?: string | string[];
  properties?: { [k: string]: JsonSchema };
  required?: string[];
  items?: JsonSchema;
  additionalProperties?: JsonSchema | boolean;
  anyOf?: JsonSchema[];
  allOf?: JsonSchema[];
  enum?: any[];
  const?: any;
  $ref?: string;
  $defs?: { [k: string]: JsonSchema };
  description?: string;
  nullable?: boolean;
}

export type JzodToJsonSchemaContext = { [k: string]: JzodElement };

// ################################################################################################
/**
 * Convert a JzodElement to a JSON Schema definition.
 * Context maps reference names to their JzodElement definitions, used to resolve schemaReference elements.
 */
export function jzodToJsonSchema(
  element: JzodElement,
  context: JzodToJsonSchemaContext = {},
): JsonSchema {
  if (!element) {
    return {};
  }

  const description = element.description;
  const nullable = element.nullable;

  function withMeta(schema: JsonSchema): JsonSchema {
    if (description) schema.description = description;
    if (nullable) schema.nullable = true;
    return schema;
  }

  switch (element.type) {
    case "string":
      return withMeta({ type: "string" });

    case "number":
      return withMeta({ type: "number" });

    case "boolean":
      return withMeta({ type: "boolean" });

    case "any":
    case "unknown":
      return withMeta({});

    case "never":
      return withMeta({ not: {} } as JsonSchema);

    // case "null":
    //   return withMeta({ type: "null" });

    case "undefined":
    case "void":
      return withMeta({});

    case "uuid":
    case "bigint":
      return withMeta({ type: "string" });

    case "date":
      return withMeta({ type: "string", format: "date-time" } as JsonSchema);

    case "literal": {
      const castElement = element as { type: "literal"; definition: string; optional?: boolean };
      return withMeta({ const: castElement.definition });
    }

    case "enum": {
      const castElement = element as { type: "enum"; definition: string[]; optional?: boolean };
      return withMeta({ enum: castElement.definition });
    }

    case "array": {
      const castElement = element as { type: "array"; definition: JzodElement; optional?: boolean };
      return withMeta({
        type: "array",
        items: jzodToJsonSchema(castElement.definition, context),
      });
    }

    case "object": {
      const castElement = element as {
        type: "object";
        definition: { [k: string]: JzodElement };
        optional?: boolean;
        nonStrict?: boolean;
        partial?: boolean;
      };
      const properties: { [k: string]: JsonSchema } = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(castElement.definition)) {
        properties[key] = jzodToJsonSchema(value, context);
        if (!value.optional && !castElement.partial) {
          required.push(key);
        }
      }

      const schema: JsonSchema = { type: "object", properties };
      if (required.length > 0) schema.required = required;
      if (castElement.nonStrict !== true) {
        schema.additionalProperties = false;
      }
      return withMeta(schema);
    }

    case "record": {
      const castElement = element as { type: "record"; definition: JzodElement; optional?: boolean };
      return withMeta({
        type: "object",
        additionalProperties: jzodToJsonSchema(castElement.definition, context),
      });
    }

    case "union": {
      const castElement = element as { type: "union"; definition: JzodElement[]; optional?: boolean };
      return withMeta({
        anyOf: castElement.definition.map((d) => jzodToJsonSchema(d, context)),
      });
    }

    case "intersection": {
      const castElement = element as { type: "intersection"; definition: { left: JzodElement; right: JzodElement }; optional?: boolean };
      return withMeta({
        allOf: [
          jzodToJsonSchema(castElement.definition.left, context),
          jzodToJsonSchema(castElement.definition.right, context),
        ],
      });
    }

    case "schemaReference": {
      const castElement = element as {
        type: "schemaReference";
        context?: { [k: string]: JzodElement };
        definition: { relativePath: string; absolutePath?: string; eager?: boolean };
        optional?: boolean;
      };
      // Merge local context with the passed context
      const mergedContext: JzodToJsonSchemaContext = {
        ...context,
        ...(castElement.context ?? {}),
      };
      const refPath = castElement.definition.relativePath;
      const resolved = mergedContext[refPath];
      if (resolved) {
        return jzodToJsonSchema(resolved, mergedContext);
      }
      // Unresolvable reference: emit a $ref as fallback
      return withMeta({ $ref: `#/$defs/${refPath}` });
    }

    case "lazy": {
      const castElement = element as { type: "lazy"; definition: JzodElement; optional?: boolean };
      return jzodToJsonSchema(castElement.definition, context);
    }

    case "tuple": {
      const castElement = element as { type: "tuple"; definition: JzodElement[]; optional?: boolean };
      return withMeta({
        type: "array",
        items: castElement.definition.map((d) => jzodToJsonSchema(d, context)),
        minItems: castElement.definition.length,
        maxItems: castElement.definition.length,
      } as JsonSchema);
    }

    case "map":
    case "set":
      return withMeta({ type: "object" });

    case "function":
    case "promise":
      return withMeta({});

    default:
      return withMeta({});
  }
}
