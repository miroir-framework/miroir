import {
  JzodObject,
  JzodElement,
  JzodReference,
  JzodSchema,
  MetaModel,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../../0_interfaces/1_core/Transformer";
import { resolveJzodSchemaReferenceInContext } from "./jzodResolveSchemaReferenceInContext";
import equal from "fast-deep-equal";

  // Function to recursively get all properties from parent objects
const getAllProperties = <T extends MiroirModelEnvironment>(
  parent: JzodObject | JzodReference | (JzodObject | JzodReference | undefined)[],
  referenceChain: JzodReference[] = [],
  modelEnvironment: T,
  relativeReferenceJzodContext?: { [k: string]: JzodElement }
): Record<string, JzodElement> => {
  // Handle array of extends
  if (Array.isArray(parent)) {
    const allProps: Record<string, JzodElement> = {};
    for (const p of parent) {
      if (p) {
        const props = getAllProperties(p, referenceChain, modelEnvironment, relativeReferenceJzodContext);
        Object.assign(allProps, props);
      }
    }
    return allProps;
  }

  // Handle JzodReference - resolve it using the provided context
  if (parent.type === "schemaReference") {
    // Check for circular reference
    for (const ref of referenceChain) {
      if (equal(ref, parent)) {
        throw new Error(
          "jzodObjectFlatten: Circular reference detected. Reference chain: " +
            JSON.stringify(referenceChain.map((r) => r.definition)) +
            " -> " +
            JSON.stringify(parent.definition)
        );
      }
    }

    if (!modelEnvironment.miroirFundamentalJzodSchema) {
      throw new Error(
        "jzodObjectFlatten: Cannot resolve schema reference without miroirFundamentalJzodSchema"
      );
    }

    const resolvedElement = resolveJzodSchemaReferenceInContext(
      parent,
      relativeReferenceJzodContext || {},
      modelEnvironment
    );

    // Add current reference to the chain for circular detection
    const newReferenceChain = [...referenceChain, parent];

    // If resolved element is still a reference, continue resolving recursively
    if (resolvedElement.type === "schemaReference") {
      return getAllProperties(resolvedElement as JzodReference, newReferenceChain, modelEnvironment, relativeReferenceJzodContext);
    }

    if (resolvedElement.type !== "object") {
      throw new Error(
        `jzodObjectFlatten: Schema reference resolved to non-object type '${resolvedElement.type}'. ` +
          `Only object types can be used in extend clauses.`
      );
    }

    // Recursively get properties from the resolved object
    return getAllProperties(resolvedElement as JzodObject, newReferenceChain, modelEnvironment, relativeReferenceJzodContext);
  }

  // Handle JzodObject
  if (parent.type === "object") {
    // Start with the parent's own definition
    const properties = parent.definition ? { ...parent.definition } : {};

    // If the parent has an extend property, merge its properties as well (parents first)
    if (parent.extend) {
      const parentProps = getAllProperties(parent.extend, referenceChain, modelEnvironment, relativeReferenceJzodContext);
      return { ...parentProps, ...properties };
    }

    return properties;
  }

  return {};
};

/**
 * Flattens a JzodObject by removing the "extend" clause and incorporating
 * all parent attributes directly into the definition.
 *
 * @param obj The JzodObject to flatten
 * @param miroirFundamentalJzodSchema Schema for resolving references
 * @param currentModel Current model for context
 * @param miroirMetaModel Miroir meta model for context
 * @param relativeReferenceJzodContext Relative reference context
 * @returns A new JzodObject with all inherited properties directly in the definition
 * @throws Error if a schema reference resolves to a non-object type
 */
export function jzodObjectFlatten<T extends MiroirModelEnvironment>(
  obj: JzodObject,
  modelEnvironment: T,
  relativeReferenceJzodContext?: { [k: string]: JzodElement }
): JzodObject {
  // If there's no extend property, just return the object as is
  if (!obj.extend) {
    return obj;
  }


  // Get all parent properties
  const parentProperties = getAllProperties(obj.extend, [], modelEnvironment, relativeReferenceJzodContext);

  // Create flattened object with extend removed
  const flattened: JzodObject = {
    type: "object",
    definition: {
      ...parentProperties,
      ...obj.definition, // Current object properties override parent properties
    },
  };

  // Copy other properties from original object (excluding extend)
  if (obj.optional !== undefined) {
    flattened.optional = obj.optional;
  }
  if (obj.nullable !== undefined) {
    flattened.nullable = obj.nullable;
  }
  if (obj.tag !== undefined) {
    flattened.tag = obj.tag;
  }

  return flattened;
}
