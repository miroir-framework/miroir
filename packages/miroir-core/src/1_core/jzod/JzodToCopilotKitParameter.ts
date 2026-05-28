import type { JzodElement } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { JzodToJsonSchemaContext } from "./JzodToJsonSchema";

// ################################################################################################
// CopilotKit-compatible Parameter type, mirroring @copilotkit/shared Parameter.
// Defined here so miroir-core has no runtime dependency on @copilotkit/shared.
// ################################################################################################

export type CopilotKitParameterType =
  | "string"
  | "number"
  | "boolean"
  | "object"
  | "string[]"
  | "number[]"
  | "boolean[]"
  | "object[]";

export interface CopilotKitParameter {
  name: string;
  type?: CopilotKitParameterType;
  description?: string;
  required?: boolean;
  /** For string parameters: restricts accepted values */
  enum?: string[];
  /** For object / object[] parameters: describes nested fields */
  attributes?: CopilotKitParameter[];
}

// ################################################################################################
/**
 * Convert a named JzodElement to a CopilotKit-compatible Parameter.
 *
 * @param name          The parameter name (required by CopilotKit)
 * @param element       The Jzod schema element to convert
 * @param context       Optional map of named JzodElement definitions for resolving schemaReference
 */
export function jzodToCopilotKitParameter(
  name: string,
  element: JzodElement,
  context: JzodToJsonSchemaContext = {},
): CopilotKitParameter {
  if (!element) {
    return { name };
  }

  const description = element.description ?? undefined;
  const required = element.optional ? false : undefined;

  function base(): Pick<CopilotKitParameter, "name"> & Partial<CopilotKitParameter> {
    const p: Pick<CopilotKitParameter, "name"> & Partial<CopilotKitParameter> = { name };
    if (description) p.description = description;
    if (required !== undefined) p.required = required;
    return p;
  }

  switch (element.type) {
    case "string":
      return { ...base(), type: "string" };

    case "number":
      return { ...base(), type: "number" };

    case "boolean":
      return { ...base(), type: "boolean" };

    case "uuid":
    case "bigint":
    case "date":
      return { ...base(), type: "string" };

    case "any":
    case "unknown":
    case "never":
    case "undefined":
    case "void":
      return { ...base() };

    case "literal": {
      const castEl = element as { type: "literal"; definition: string };
      return { ...base(), type: "string", enum: [castEl.definition] };
    }

    case "enum": {
      const castEl = element as { type: "enum"; definition: string[] };
      return { ...base(), type: "string", enum: castEl.definition };
    }

    case "array": {
      const castEl = element as { type: "array"; definition: JzodElement };
      const inner = castEl.definition;
      const innerType = inner.type;

      if (innerType === "string" || innerType === "uuid" || innerType === "bigint" || innerType === "date") {
        return { ...base(), type: "string[]" };
      }
      if (innerType === "number") {
        return { ...base(), type: "number[]" };
      }
      if (innerType === "boolean") {
        return { ...base(), type: "boolean[]" };
      }
      if (innerType === "object") {
        const castInner = inner as { type: "object"; definition: { [k: string]: JzodElement }; partial?: boolean };
        return {
          ...base(),
          type: "object[]",
          attributes: Object.entries(castInner.definition).map(([k, v]) =>
            jzodToCopilotKitParameter(k, v, context)
          ),
        };
      }
      // fallback: treat as object[]
      return { ...base(), type: "object[]" };
    }

    case "object": {
      const castEl = element as {
        type: "object";
        definition: { [k: string]: JzodElement };
        partial?: boolean;
      };
      return {
        ...base(),
        type: "object",
        attributes: Object.entries(castEl.definition).map(([k, v]) =>
          jzodToCopilotKitParameter(k, v, context)
        ),
      };
    }

    case "record":
      return { ...base(), type: "object" };

    case "union": {
      const castEl = element as { type: "union"; definition: JzodElement[] };
      // Collect enum strings if all branches are literals
      const allLiterals = castEl.definition.every(
        (d) => d.type === "literal"
      );
      if (allLiterals) {
        const enumValues = castEl.definition.map(
          (d) => (d as { type: "literal"; definition: string }).definition
        );
        return { ...base(), type: "string", enum: enumValues };
      }
      // Otherwise fall back to a plain string parameter
      return { ...base(), type: "string" };
    }

    case "intersection":
      return { ...base(), type: "object" };

    case "schemaReference": {
      const castEl = element as {
        type: "schemaReference";
        context?: { [k: string]: JzodElement };
        definition: { relativePath: string };
      };
      const mergedContext: JzodToJsonSchemaContext = {
        ...context,
        ...(castEl.context ?? {}),
      };
      const resolved = mergedContext[castEl.definition.relativePath];
      if (resolved) {
        return jzodToCopilotKitParameter(name, resolved, mergedContext);
      }
      return { ...base() };
    }

    case "lazy": {
      const castEl = element as { type: "lazy"; definition: JzodElement };
      return jzodToCopilotKitParameter(name, castEl.definition, context);
    }

    default:
      return { ...base() };
  }
}
