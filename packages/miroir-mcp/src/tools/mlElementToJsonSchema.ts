import {
  type MlElement,
  resolveMlSchemaReferenceInContext,
  type MlReference,
  defaultMiroirModelEnvironment,
} from "miroir-core";
import type { McpToolDescriptionProperty } from "./mcpHandlersForEndpoint.js";
import {
  jsonSchemaRefPointer,
  normalizeMlConversionOptions,
  sanitizeJsonSchemaDefKey,
  schemaReferenceKey,
  type MlConversionOptions,
  type NormalizedMlConversionOptions,
} from "./mlConversionContext.js";

function looseObject(description: string): McpToolDescriptionProperty {
  return {
    type: "object",
    description: description || "Open object (recursive or opaque Miroir schema)",
    properties: {},
    required: [],
    additionalProperties: true,
  };
}

function childOptions(
  options: NormalizedMlConversionOptions,
): NormalizedMlConversionOptions {
  return {
    ...options,
    depth: options.depth + 1,
  };
}

/**
 * MCP tool `inputSchema` must be a JSON Schema with root `type: "object"` (Cursor and
 * other clients reject bare root `$ref` — #248 cause 2).
 * Only expands/wraps a top-level `$ref`; nested `$ref`s and non-ref roots are unchanged.
 */
function finalizeRootMcpInputSchema(
  result: any,
  defs: Record<string, unknown>,
): any {
  let root = result;

  if (
    root &&
    typeof root === "object" &&
    typeof root.$ref === "string" &&
    root.type === undefined
  ) {
    const prefix = "#/$defs/";
    const defKey = root.$ref.startsWith(prefix) ? root.$ref.slice(prefix.length) : undefined;
    const body = defKey !== undefined ? defs[defKey] : undefined;
    if (body && typeof body === "object") {
      root = { ...(body as Record<string, unknown>) };
    }

    if (!root || typeof root !== "object" || root.type !== "object") {
      const inner =
        root && typeof root === "object"
          ? root
          : { type: "object", properties: {}, required: [], additionalProperties: true };
      root = {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: true,
        allOf: [inner],
      };
    }
  }

  if (Object.keys(defs).length > 0) {
    return { ...root, $defs: defs };
  }
  return root;
}

/**
 * Recursively converts a MlElement to an MCP tool description property.
 *
 * Schema references are resolved against the Miroir fundamental model environment and
 * emitted as JSON Schema `$ref` / `$defs` entries so recursive Miroir types are not
 * combinatorially inlined (see #248).
 */
export function mlElementToJsonSchema(
  mlElement: MlElement,
  propertyName?: string,
  propertyNameMapping?: Record<string, string>,
  conversionOptions?: MlConversionOptions,
): McpToolDescriptionProperty | any {
  const ownsDefs = conversionOptions?.defs === undefined;
  const options = normalizeMlConversionOptions(conversionOptions);

  const result = mlElementToJsonSchemaInner(
    mlElement,
    propertyName,
    propertyNameMapping,
    options,
  );

  if (ownsDefs) {
    return finalizeRootMcpInputSchema(result, options.defs);
  }
  return result;
}

function mlElementToJsonSchemaInner(
  mlElement: MlElement,
  propertyName: string | undefined,
  propertyNameMapping: Record<string, string> | undefined,
  options: NormalizedMlConversionOptions,
): McpToolDescriptionProperty | any {
  if (options.depth >= options.maxDepth) {
    return looseObject("");
  }

  const description =
    mlElement.tag?.value?.description || mlElement.tag?.value?.defaultLabel || "";

  switch (mlElement.type) {
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
      const ref = mlElement as MlReference;
      const refKey = schemaReferenceKey(ref);
      const defKey = sanitizeJsonSchemaDefKey(refKey);
      const refPointer = jsonSchemaRefPointer(defKey);

      // Already defined, or placeholder reserved while resolving (cycle): share via $ref.
      if (Object.prototype.hasOwnProperty.call(options.defs, defKey)) {
        return { $ref: refPointer };
      }

      if (options.depth >= options.maxDepth) {
        return looseObject(description);
      }

      // Reserve before resolving so recursive encounters return $ref instead of re-inlining.
      options.defs[defKey] = looseObject(description || "Resolving schema reference");
      options.resolvingRefs.add(refKey);

      try {
        const resolvedSchema = resolveMlSchemaReferenceInContext(
          ref,
          ref.context || {},
          defaultMiroirModelEnvironment,
        );
        options.defs[defKey] = mlElementToJsonSchemaInner(
          resolvedSchema,
          propertyName,
          propertyNameMapping,
          childOptions(options),
        );
      } catch (error) {
        delete options.defs[defKey];
        throw error;
      } finally {
        options.resolvingRefs.delete(refKey);
      }

      return { $ref: refPointer };
    }

    case "object": {
      const properties: Record<string, any> = {};
      const required: string[] = [];

      if (mlElement.definition) {
        for (const [key, value] of Object.entries(mlElement.definition)) {
          properties[key] = mlElementToJsonSchemaInner(
            value as any,
            key,
            propertyNameMapping,
            childOptions(options),
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
      if (!mlElement.definition) {
        throw new Error("Array definition missing item type");
      }
      return {
        type: "array",
        description,
        items: mlElementToJsonSchemaInner(
          mlElement.definition,
          undefined,
          propertyNameMapping,
          childOptions(options),
        ),
      };
    }
    case "enum": {
      return {
        type: "string",
        description,
        enum: mlElement.definition,
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
      const literalValue = mlElement.definition;
      const literalType = typeof literalValue === "number" ? "number" : "string";
      return {
        type: literalType,
        const: literalValue,
        description,
      };
    }
    case "record": {
      if (!mlElement.definition) {
        throw new Error("Record definition missing value type");
      }
      return {
        type: "object",
        description,
        additionalProperties: mlElementToJsonSchemaInner(
          mlElement.definition,
          undefined,
          propertyNameMapping,
          childOptions(options),
        ),
      };
    }
    case "tuple": {
      if (!mlElement.definition || !Array.isArray(mlElement.definition)) {
        throw new Error("Tuple definition missing or invalid");
      }
      const prefixItems = mlElement.definition.map((item: MlElement) =>
        mlElementToJsonSchemaInner(item as any, undefined, propertyNameMapping, childOptions(options)),
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
      if (!mlElement.definition || !Array.isArray(mlElement.definition)) {
        throw new Error("Union definition missing or invalid");
      }

      const convertedMembers = mlElement.definition.map((member: MlElement) =>
        mlElementToJsonSchemaInner(member as any, undefined, propertyNameMapping, childOptions(options)),
      );

      const isDiscriminated = !!(mlElement as any).discriminator;

      if (isDiscriminated) {
        return {
          oneOf: convertedMembers,
          discriminator: {
            propertyName: (mlElement as any).discriminator,
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
      const intersection = mlElement.definition as { left?: MlElement; right?: MlElement };
      if (!intersection?.left || !intersection?.right) {
        return looseObject(description);
      }
      return {
        allOf: [
          mlElementToJsonSchemaInner(
            intersection.left,
            propertyName,
            propertyNameMapping,
            childOptions(options),
          ),
          mlElementToJsonSchemaInner(
            intersection.right,
            propertyName,
            propertyNameMapping,
            childOptions(options),
          ),
        ],
        description,
      };
    }
    case "lazy": {
      if (!mlElement.definition) {
        return looseObject(description);
      }
      return mlElementToJsonSchemaInner(
        mlElement.definition,
        propertyName,
        propertyNameMapping,
        childOptions(options),
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
      throw new Error(`Unsupported ML type for MCP tool description: ${mlElement.type}`);
    }

    default:
      return looseObject(description);
  }
}
