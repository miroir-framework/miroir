import {
  JzodElement,
  JzodObject,
  JzodReference,
  JzodSchema,
  MetaModel
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export function resolveJzodSchemaReferenceInContext(
  jzodReference: JzodReference | JzodObject | (JzodReference | JzodObject | undefined)[],
  relativeReferenceJzodContext: { [k: string]: JzodElement } = {},
  miroirFundamentalJzodSchema: JzodSchema,
  currentModel?: MetaModel,
  miroirMetaModel?: MetaModel,
): JzodElement {
  if (Array.isArray(jzodReference)) {
    // Aggregate resolved items into an object with keys as indices
    const resolvedItems = jzodReference.map((ref, idx) => {
      if (ref === undefined) return undefined;
      return resolveJzodSchemaReferenceInContext(
        ref,
        relativeReferenceJzodContext,
        miroirFundamentalJzodSchema,
        currentModel,
        miroirMetaModel,
      );
    });
    // If all items are objects with a definition, merge them into one object
    if (resolvedItems.every(item => item && item.type === "object" && typeof item.definition === "object")) {
      const mergedDefinition = Object.assign(
        {},
        ...resolvedItems.map(item => (item as JzodObject).definition)
      );
    return { type: "object", definition: mergedDefinition };
    } else {
      throw new Error(
        "resolveJzodSchemaReferenceInContext can not handle array of references with mixed types or non-object definitions: " +
          JSON.stringify(resolvedItems)
      );
    }
  }
  if (jzodReference.type == "object") {
    throw new Error(
      "resolveJzodSchemaReferenceInContext can not handle object reference " +
        JSON.stringify(jzodReference)
    );
  }
  if ((!jzodReference.definition || !jzodReference.definition?.absolutePath) && !relativeReferenceJzodContext) {
    throw new Error(
      "resolveJzodSchemaReferenceInContext can not handle complex / unexisting reference " +
        JSON.stringify(jzodReference) +
        " for empty relative reference: " +
        JSON.stringify(relativeReferenceJzodContext)
    );
  }
  // log.info(
  //   "resolveJzodSchemaReferenceInContext called for reference",
  //   JSON.stringify(jzodReference, null, 2),
  // );
  const absoluteReferences = currentModel
    ? [
        miroirFundamentalJzodSchema,
        ...((currentModel as any)?.jzodSchemas || []),
        ...((miroirMetaModel as any)?.jzodSchemas || []),
      ] // very inefficient!
    : [miroirFundamentalJzodSchema];
  const absoluteReferenceTargetJzodSchema: { [k: string]: JzodElement } = jzodReference?.definition.absolutePath
    ? absoluteReferences.find((s: JzodSchema) => s.uuid == jzodReference?.definition.absolutePath)?.definition
        .context ?? {}
    : relativeReferenceJzodContext ?? jzodReference;

  const targetJzodSchema: JzodElement | undefined = jzodReference?.definition.relativePath
    ? absoluteReferenceTargetJzodSchema[jzodReference?.definition.relativePath]
    : { type: "object", definition: absoluteReferenceTargetJzodSchema };


  // log.info(
  //   "resolveJzodSchemaReferenceInContext for reference",
  //   "absolutePath",
  //   jzodReference.definition.absolutePath,
  //   "relativePath",
  //   jzodReference.definition.relativePath,
  //   "relativeReferenceJzodContext",
  //   Object.keys(relativeReferenceJzodContext??{}),
  //   "result",
  //   targetJzodSchema,
  // );

  if (!targetJzodSchema) {
    throw new Error(
      "resolveJzodSchemaReferenceInContext could not resolve reference " +
        JSON.stringify(jzodReference.definition) +
        " absoluteReferences keys " +
        JSON.stringify(absoluteReferences.map(r => r.uuid)) +
        " current Model " + Object.keys(currentModel??{}) + 
        " relativeReferenceJzodContext keys " +
        JSON.stringify(relativeReferenceJzodContext)
    );
  }

  return targetJzodSchema;
}


// ################################################################################################
// TODO: redundant to resolveJzodSchemaReferenceInContext, resolveJzodSchemaReference is used only in JzodTools,
// refactor / merge with resolveJzodSchemaReferenceInContext.
export function resolveJzodSchemaReference(
  miroirFundamentalJzodSchema: JzodSchema,
  jzodReference?: JzodReference,
  currentModel?: MetaModel,
  relativeReferenceJzodContext?: JzodObject | JzodReference,
): JzodElement {
  // const fundamentalJzodSchemas = miroirFundamentalJzodSchema.definition.context
  const absoluteReferences = (currentModel
    ? [miroirFundamentalJzodSchema, ...((currentModel as any)?.jzodSchemas || [])] // very inefficient!
    : [miroirFundamentalJzodSchema]
  )
  const absoluteReferenceTargetJzodSchema: JzodObject | JzodReference | undefined = jzodReference?.definition
    .absolutePath
    ? {
        type: "object",
        definition:
          absoluteReferences.find((s: JzodSchema) => s.uuid == jzodReference?.definition.absolutePath)?.definition.context ?? {},
      }
    : relativeReferenceJzodContext ?? jzodReference;
  const targetJzodSchema = jzodReference?.definition.relativePath
    ? absoluteReferenceTargetJzodSchema?.type == "object" && absoluteReferenceTargetJzodSchema?.definition
      ? absoluteReferenceTargetJzodSchema?.definition[jzodReference?.definition.relativePath]
      : absoluteReferenceTargetJzodSchema?.type == "schemaReference" && absoluteReferenceTargetJzodSchema?.context
      ? absoluteReferenceTargetJzodSchema?.context[jzodReference?.definition.relativePath]
      : undefined
    : absoluteReferenceTargetJzodSchema;


  if (!targetJzodSchema) {
    console.error(
      "resolveJzodSchemaReference failed for jzodSchema",
      jzodReference,
      "result",
      targetJzodSchema,
      " absoluteReferences", 
      absoluteReferences,
      "absoluteReferenceTargetJzodSchema",
      absoluteReferenceTargetJzodSchema,
      "currentModel",
      currentModel,
      "rootJzodSchema",
      relativeReferenceJzodContext
    );
    throw new Error("resolveJzodSchemaReference could not resolve reference " + JSON.stringify(jzodReference) + " absoluteReferences" + absoluteReferences);
  }

  return targetJzodSchema;
}
