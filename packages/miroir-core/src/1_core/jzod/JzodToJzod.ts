import { JzodElement, JzodObject, JzodReference } from "@miroir-framework/jzod-ts";

export type JzodReferenceResolutionFunction = (schema: JzodReference) => JzodElement | undefined;

// function forgeIdFromReference(r:JzodReference) {
export function forgeCarryOnReferenceName(absolutePath: string, relativePath:string | undefined, suffix?: string) {
  return "carryOn_" + absolutePath?.replace(/-/g,"$") + "_" + relativePath + (suffix?"_" + suffix:"")
}

export function applyLimitedCarryOnSchema(
  baseSchema: JzodElement,
  carryOnSchema: JzodElement,
  localReferencePrefix?: string | undefined,
  suffixForReferences?: string | undefined,
  resolveJzodReference?: JzodReferenceResolutionFunction, // non-converted reference lookup
  convertedReferences?: Record<string, JzodElement>, // converted reference lookup
): { resultSchema: JzodElement; resolvedReferences?: Record<string, JzodElement> } {
  return applyLimitedCarryOnSchemaOnLevel(
    baseSchema,
    carryOnSchema,
    true, // applyOnFirstLevel,
    localReferencePrefix,
    suffixForReferences,
    resolveJzodReference,
    convertedReferences
  );
}

export interface ApplyCarryOnSchemaOnLevelReturnType { resultSchema: JzodElement; resolvedReferences?: Record<string, JzodElement> }
/**
 * returns transformed @param baseSchema so that any node within the schema can be replaced
 * with @param carryOnSchema. 
 * It returns also a new environment where the references found in the returned result can
 * be resolved. This is required because schemas referenced in @param baseSchema have to be
 * tranformed to take @param carryOnSchema into account also.
 * 
 * It pushes internal reference resolution to the top level.
 * 
 * only eager references are allowed in @param baseSchema
 * This function resolves / converts each found reference at most 1 time.
 * 
 * @param baseSchema 
 * @param carryOnSchema 
 * @param applyOnFirstLevel if true, the result is a union of the baseSchema and the carryOnSchema
 * @param resolveJzodReference the reference resolution function. Corollary: the definition of absolute references must be known at carryOn-application time.
 * @returns transformed @param baseSchema joined with @param carryOnSchema
 */
export function applyLimitedCarryOnSchemaOnLevel(
  baseSchema: JzodElement,
  carryOnSchema: JzodElement,
  applyOnFirstLevel: boolean,
  localReferencePrefix?: string | undefined,
  suffixForReferences?: string | undefined,
  resolveJzodReference?: JzodReferenceResolutionFunction, // non-converted reference lookup
  convertedReferences?: Record<string, JzodElement>, // converted reference lookup
): { resultSchema: JzodElement; resolvedReferences?: Record<string, JzodElement> } {
  /**
   * jzodBaseObject.extra is {type: "any"} by default but can be subtyped to any concrete type
   * and shall then be applied the carryOn type
   * jzodBaseObject.extra is only indirectly taken into account during the translation to Zod,
   * through inheritance of jzodBaseObject. It is then viewed as any JzodObject attribute.
   * 
   * But jzodBaseObject.extra presents a specific problem when applying a carryOn schema.
   * jzodBaseObject.extra gives the concrete type for the extra attribute of a JzodElement
   * there is no attribute giving the metatype of the jzodBaseObject.extra attribute, which is JzodElement
   * this metaExtra attribute shall be interpreted and replaced by the concrete extra attribute during
   * the translation to Zod / TS. (???)
   * 
   * 
   */
  
  // const convertedExtra: JzodElement | undefined = baseSchema.extra
  //   ? applyCarryOnSchema(
  //       baseSchema.extra, // hard-coded type for jzodBaseSchema.extra is "any", it is replaced in any "concrete" jzodSchema definition 
  //       carryOnSchema,
  //       localReferencePrefix,
  //       resolveJzodReference,
  //       convertedReferences
  //     ).resultSchema // TODO: what about resolvedReferences for extra? They are ignored, is it about right?
  //   : undefined;


  // const convertedTag = baseSchema.tag;
  const castTag = (baseSchema as any).tag as any;

  // if (!castTag || !Object.hasOwn(castTag, "canBeTemplate") || !castTag.canBeTemplate) {
  //   console.log("############# applyCarryOnSchema nothing to do for", "baseSchema.tag", castTag)
  //   return {
  //     resultSchema: baseSchema,
  //     resolvedReferences: convertedReferences,
  //   }
  // }
  const convertedTag = castTag && castTag.schema && castTag.schema.valueSchema
    ? {
      ...castTag,
      schema: {
        ...castTag.schema,
        valueSchema: applyLimitedCarryOnSchemaOnLevel(
          castTag.schema.valueSchema, // hard-coded type for jzodBaseSchema.extra is "any", it is replaced in any "concrete" jzodSchema definition 
          carryOnSchema,
          false, // applyOnFirstLevel
          localReferencePrefix,
          suffixForReferences,
          resolveJzodReference,
          convertedReferences
        ).resultSchema
      }
    } // TODO: what about resolvedReferences for extra? They are ignored, is it about right?
    : castTag;

  // if (baseSchema.tag && baseSchema.tag.schema && baseSchema.tag.schema.valueSchema) {
  //   console.log("############# applyCarryOnSchema", "convertedTag", convertedTag)
  // }
  // console.log("############# applyCarryOnSchemaOnLevel", "baseSchema", JSON.stringify(baseSchema))

  switch (baseSchema.type) {
    case "any":
    case "bigint":
    case "boolean":
    case "date":
    case "enum":
    case "literal":
    case "map": // TODO!!!
    case "never":
    case "null":
    case "number":
    case "string":
    case "uuid":
    case "unknown":
    case "void":
    case "undefined": {
      return {
        resultSchema:
          !castTag ||
          !Object.hasOwn(castTag, "canBeTemplate") ||
          !castTag.canBeTemplate ||
          !applyOnFirstLevel
            ? baseSchema
            : ({
                ...baseSchema,
                tag: convertedTag,
                type: "union",
                definition: [baseSchema, carryOnSchema],
              } as any),
      };
      break;
    }
    case "record": {
      // const convertedSubSchemas: JzodElement[] = [];
      const convertedSubSchemasReferences: Record<string, JzodElement> = {};
      const convertedSubSchema = applyLimitedCarryOnSchemaOnLevel(
        baseSchema.definition,
        carryOnSchema,
        true, // applyOnFirstLevel
        localReferencePrefix,
        suffixForReferences,
        resolveJzodReference,
        convertedReferences
      );
      for (const c of Object.entries(convertedSubSchema.resolvedReferences ?? {})) {
        convertedSubSchemasReferences[c[0]] = c[1];
      }
      let result;
      if (
        !castTag ||
        !Object.hasOwn(castTag, "canBeTemplate") ||
        !castTag.canBeTemplate ||
        !applyOnFirstLevel
      ) {
        return {
          resultSchema: {
            ...baseSchema,
            tag: convertedTag,
            type: "record",
            definition: convertedSubSchema.resultSchema,
          } as any,
          resolvedReferences: convertedSubSchemasReferences,
        };
      } else {
        return {
          resultSchema: {
            ...baseSchema,
            tag: convertedTag,
            type: "union",
            definition: [
              {
                ...baseSchema,
                tag: convertedTag,
                type: "record",
                definition: convertedSubSchema.resultSchema,
              } as any,
              carryOnSchema,
            ],
          } as any,
          resolvedReferences: convertedSubSchemasReferences,
        };
      }
      break;
    }
    case "set": {
      // const convertedSubSchemas: JzodElement[] = [];
      const convertedSubSchemasReferences: Record<string, JzodElement> = {};
      const convertedSubSchema = applyLimitedCarryOnSchemaOnLevel(
        baseSchema.definition,
        carryOnSchema,
        true, // applyOnFirstLevel
        localReferencePrefix,
        suffixForReferences,
        resolveJzodReference,
        convertedReferences
      );
      for (const c of Object.entries(convertedSubSchema.resolvedReferences ?? {})) {
        convertedSubSchemasReferences[c[0]] = c[1];
      }
      let result;
      if (
        !castTag ||
        !Object.hasOwn(castTag, "canBeTemplate") ||
        !castTag.canBeTemplate ||
        !applyOnFirstLevel
      ) {
        return {
          resultSchema: {
            ...baseSchema,
            tag: convertedTag,
            type: "set",
            definition: convertedSubSchema.resultSchema,
          } as any,
          resolvedReferences: convertedSubSchemasReferences,
        };
      } else {
        return {
          resultSchema: {
            ...baseSchema,
            tag: convertedTag,
            type: "union",
            definition: [
              {
                ...baseSchema,
                tag: convertedTag,
                type: "set",
                definition: convertedSubSchema.resultSchema,
              },
              carryOnSchema,
            ],
          } as any,
          resolvedReferences: convertedSubSchemasReferences,
        };
      }
      break;
    }
    case "array": {
      // const convertedSubSchemas: JzodElement[] = [];
      const convertedSubSchemasReferences: Record<string, JzodElement> = {};
      const convertedSubSchema = applyLimitedCarryOnSchemaOnLevel(
        baseSchema.definition,
        carryOnSchema,
        true, // applyOnFirstLevel
        localReferencePrefix,
        suffixForReferences,
        resolveJzodReference,
        convertedReferences
      );
      for (const c of Object.entries(convertedSubSchema.resolvedReferences ?? {})) {
        convertedSubSchemasReferences[c[0]] = c[1];
      }
      let result;
      if (
        !castTag ||
        !Object.hasOwn(castTag, "canBeTemplate") ||
        !castTag.canBeTemplate ||
        !applyOnFirstLevel
      ) {
        return {
          resultSchema: {
            ...baseSchema,
            tag: convertedTag,
            type: "array",
            definition: convertedSubSchema.resultSchema,
          } as any,
          resolvedReferences: convertedSubSchemasReferences,
        };
      } else {
        return {
          resultSchema: {
            ...baseSchema,
            tag: convertedTag,
            type: "union",
            definition: [
              {
                ...baseSchema,
                tag: convertedTag,
                type: "array",
                definition: convertedSubSchema.resultSchema,
              } as any,
              carryOnSchema,
            ],
          } as any,
          resolvedReferences: convertedSubSchemasReferences,
        };
      }
      break;
    }
    case "tuple": {
      const convertedSubSchemas: JzodElement[] = [];
      const convertedSubSchemasReferences: Record<string, JzodElement> = {};
      for (const subSchema of baseSchema.definition) {
        const convertedSubSchema = applyLimitedCarryOnSchemaOnLevel(
          subSchema,
          carryOnSchema,
          true, //applyOnFirstLevel
          localReferencePrefix,
          suffixForReferences,
          resolveJzodReference,
          {
            ...convertedReferences,
            ...convertedSubSchemasReferences,
          }
        );
        convertedSubSchemas.push(convertedSubSchema.resultSchema);
        for (const c of Object.entries(convertedSubSchema.resolvedReferences ?? {})) {
          convertedSubSchemasReferences[c[0]] = c[1];
        }
      }
      if (
        !castTag ||
        !Object.hasOwn(castTag, "canBeTemplate") ||
        !castTag.canBeTemplate ||
        !applyOnFirstLevel
      ) {
        return {
          // returns a tuple
          resultSchema: {
            ...baseSchema,
            tag: convertedTag,
            // type: "tuple",
            definition: convertedSubSchemas,
          } as any,
          resolvedReferences: convertedSubSchemasReferences,
        };
      } else {
        return {
          resultSchema: {
            ...baseSchema,
            tag: convertedTag,
            type: "union",
            definition: [
              {
                ...baseSchema,
                tag: convertedTag,
                definition: convertedSubSchemas,
              } as any,
              carryOnSchema,
              // {

              //   resolvedReferences: convertedSubSchemasReferences
              // }
            ],
          } as any,
        };
      }
      break;
    }
    case "union": {
      // TODO: accumulate returned environment into unique object
      const subConvertedSchemas = baseSchema.definition.map((e) =>
        applyLimitedCarryOnSchemaOnLevel(
          e,
          carryOnSchema,
          false, // applyOnFirstLevel, no need to apply since result is a union, and carryOnSchema is added to union (array) definition
          localReferencePrefix,
          suffixForReferences,
          resolveJzodReference,
          convertedReferences
        )
      );
      const newResolvedReferences = subConvertedSchemas.filter((e) => e.resolvedReferences);
      const references = newResolvedReferences
        ? Object.fromEntries(newResolvedReferences.flatMap((e) => Object.entries(e.resolvedReferences ?? {})))
        : undefined;
      return {
        resultSchema: {
          ...baseSchema,
          tag: convertedTag,
          type: "union",
          definition: [...subConvertedSchemas.map((e) => e.resultSchema), carryOnSchema],
          // definition: [...baseSchema.definition, carryOnSchema],
        } as any,
        resolvedReferences: references,
      };
      break;
    }
    case "object": {
      const convertedSubSchemas: Record<string, JzodElement> = {};
      const convertedSubSchemasReferences: Record<string, JzodElement> = {};
      for (const subSchema of Object.entries(baseSchema.definition)) {
        // console.log("SubSchema", subSchema[0], JSON.stringify(subSchema, null, 2));
        const convertedSubSchema = applyLimitedCarryOnSchemaOnLevel(
          subSchema[1],
          carryOnSchema,
          true,
          localReferencePrefix,
          undefined, // do not add suffixForReferences to definition of an object, only to extended references
          resolveJzodReference,
          { ...convertedReferences, ...convertedSubSchemasReferences }
        );
        convertedSubSchemas[subSchema[0]] = convertedSubSchema.resultSchema;
        console.log("convertedSubSchema", subSchema[0], JSON.stringify(convertedSubSchema.resultSchema, null, 2));
        for (const c of Object.entries(convertedSubSchema.resolvedReferences ?? {})) {
          convertedSubSchemasReferences[c[0]] = c[1];
        }
      }
      // console.log("convertedSubSchemasReferences", JSON.stringify(convertedSubSchemasReferences, null, 2));
      // console.log("convertedSubSchemas", JSON.stringify(convertedSubSchemas, null, 2));`
      const convertedExtendResults: ApplyCarryOnSchemaOnLevelReturnType[] | undefined =
        baseSchema.extend && typeof baseSchema.extend == "object"
          ? !Array.isArray(baseSchema.extend)
            ? [
                applyLimitedCarryOnSchemaOnLevel(
                  baseSchema.extend,
                  carryOnSchema,
                  false, // applyOnFirstLevel
                  localReferencePrefix,
                  "extend", //suffixForReferences,
                  resolveJzodReference,
                  convertedReferences
                ),
              ]
            : (baseSchema.extend as (JzodObject | JzodReference)[]).map(
                (e: JzodObject | JzodReference): ApplyCarryOnSchemaOnLevelReturnType =>
                  applyLimitedCarryOnSchemaOnLevel(
                    e,
                    carryOnSchema,
                    false, // applyOnFirstLevel
                    localReferencePrefix,
                    "extend", //suffixForReferences,
                    resolveJzodReference,
                    convertedReferences
                  )
              )
          : undefined; // TODO: apply carryOn object
      // console.log("convertedExtendResults", JSON.stringify(convertedExtendResults, null, 2));
      const convertedExtendReferences = convertedExtendResults
        ? Object.fromEntries(convertedExtendResults.flatMap((e) => Object.entries(e.resolvedReferences ?? {})))
        : undefined;
      // console.log("convertedExtended references", JSON.stringify(convertedExtendReferences, null, 2));
      if (
        !castTag ||
        !Object.hasOwn(castTag, "canBeTemplate") ||
        !castTag.canBeTemplate ||
        !applyOnFirstLevel
      ) {
        return {
          resultSchema: {
            ...baseSchema,
            optional: baseSchema.optional,
            nullable: baseSchema.nullable,
            extra: baseSchema.extra,
            tag: convertedTag,
            extend: convertedExtendResults
              ? (convertedExtendResults.map((e) => e.resultSchema) as (
                  | JzodReference
                  | JzodObject
                )[])
              : undefined,
            definition: convertedSubSchemas,
          } as any,
          resolvedReferences: {
            ...convertedSubSchemasReferences,
            ...convertedExtendReferences,
          },
        };
      } else {
        return {
          resultSchema: {
            // ...baseSchema,
            optional: baseSchema.optional,
            nullable: baseSchema.nullable,
            extra: baseSchema.extra,
            tag: convertedTag,
            type: "union",
            definition: [
              carryOnSchema,
              {
                type: "object",
                // extend: baseSchema.extend,
                extend: convertedExtendResults
                  ? (convertedExtendResults.map((e) => e.resultSchema) as (
                      | JzodReference
                      | JzodObject
                    )[])
                  : undefined,
                extra: baseSchema.extra,
                tag: convertedTag,
                definition: convertedSubSchemas,
              },
            ],
          } as any,
          resolvedReferences: {
            ...convertedSubSchemasReferences,
            ...convertedExtendReferences,
          },
        };
      }
      break;
    }
    case "schemaReference": {
      // if absolute reference, resolve (eager) and add to local context after running carryOnType on it
      // reference resolution is necessarily lazy, because only the name of the reference is used for now
      let convertedContextSubSchemas: Record<string, JzodElement> = undefined as any;
      const convertedContextSubSchemasReferences: Record<string, JzodElement> = {};
      const convertedAbosulteReferences: Record<string, JzodElement> = {};
      let resultReferenceDefinition = undefined;
      /**
       * absolute references have to be converted for carryOn, then enclosed and pushed-up as a local context reference/definition.
       * this creates a new local reference/context, and the absolute reference has to be replaced by a local reference.
       * Absolute references shall be first sought in relative reference set, to be replaced by their local counterpart.
       * What about name clashes? concatenate absolute-relative parts of name as a new name?
       * relative references of converted absolute references must be referred to by their CONVERTED reference name!
       *
       */
      if (baseSchema.definition.absolutePath) {
        // lookup a locally-defined converted version of the reference
        const localReferenceName = forgeCarryOnReferenceName(
          baseSchema.definition.absolutePath,
          baseSchema.definition.relativePath,
          suffixForReferences,
        );

        if (!convertedReferences || !convertedReferences[localReferenceName]) {
          // absolute reference must be converted
          // we must lookup for the reference definition
          if (!resolveJzodReference) {
            throw new Error(
              "applyCarryOnSchema was not provided a resolveJzodReference function, but a reference with absolutePath was found " +
                JSON.stringify(baseSchema.definition)
            );
          }
          const resolvedReference = resolveJzodReference(baseSchema);
          if (!resolvedReference) {
            throw new Error(
              "applyCarryOnSchema no value corresponding to absolute reference for resolveJzodReference: " +
                JSON.stringify(baseSchema.definition)
            );
          }
          const convertedReference = applyLimitedCarryOnSchemaOnLevel(
            resolvedReference,
            carryOnSchema,
            true, // applyOnFirstLevel
            baseSchema.definition.absolutePath,
            suffixForReferences,
            resolveJzodReference,
            {
              ...convertedReferences,
              [localReferenceName]: { type: "never" },
            }
          );
          convertedAbosulteReferences[localReferenceName] = convertedReference.resultSchema; // what about local references of absolute references?
          resultReferenceDefinition = {
            ...baseSchema.definition,
            relativePath: localReferenceName,
          };
        }
        else {
          // localReferenceName already exists in convertedReferences, it can be referencesd without further conversion
          resultReferenceDefinition = {
            ...baseSchema.definition,
            relativePath: localReferenceName,
          };
        }
      } else {
        // we only need to replace it with a renamed local reference in case we have a prefix
        resultReferenceDefinition = {
          ...baseSchema.definition,
          relativePath: localReferencePrefix
            ? forgeCarryOnReferenceName(localReferencePrefix, baseSchema.definition.relativePath, suffixForReferences)
            : baseSchema.definition.relativePath,
        };
      }
      // throw error if reference definition is not found
      // do we check for integrity of relative references? We do not need to resolve it now!!
      // relative reference names are already defined, with a known definition, in baseSchema! they can be found in convertedReferences... but is it useful?
      // if the type is consistent, relative references are converted as part of the conversion process (they are in the context of one of the englobing references)

      // treating context
      for (const contextSubSchema of Object.entries(baseSchema.context ?? {})) {
        const convertedSubSchema = applyLimitedCarryOnSchemaOnLevel(
          contextSubSchema[1],
          carryOnSchema,
          true, // applyOnFirstLevel
          localReferencePrefix,
          suffixForReferences,
          resolveJzodReference,
          {
            ...convertedReferences,
            ...convertedContextSubSchemasReferences,
            [contextSubSchema[0]]: { type: "never" },
          }
        );
        if (!convertedContextSubSchemas) {
          convertedContextSubSchemas = {};
        }
        convertedContextSubSchemas[contextSubSchema[0]] = convertedSubSchema.resultSchema;
        for (const c of Object.entries(convertedSubSchema.resolvedReferences ?? {})) {
          convertedContextSubSchemasReferences[c[0]] = c[1];
        }
      }

      return {
        resultSchema: {
          ...baseSchema, // keeping all baseSchema attributes (optional, nullable...) including context! TODO: remove context?
          tag: convertedTag,
          context: convertedContextSubSchemas,
          definition: resultReferenceDefinition ? {
            ...baseSchema.definition,
            ...resultReferenceDefinition
          } : baseSchema.definition,
        } as any,
        resolvedReferences: {
          ...convertedReferences,
          ...convertedAbosulteReferences,
          ...convertedContextSubSchemasReferences,
        },
      };
      break;
    }
    case "intersection":
    case "promise":
    case "lazy": // TODO: alter the lazy's returned value to "carryOn" it? (becoming z.lazy(()=>carryOn(baseSchema)))
    case "function":
    default: {
      throw new Error("applyCarryOnSchemaOnLevel could not handle baseSchema: " + JSON.stringify(baseSchema, null, 2));
      break;
    }
  }
}
