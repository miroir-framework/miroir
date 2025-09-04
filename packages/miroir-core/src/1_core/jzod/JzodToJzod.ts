import equal from "fast-deep-equal";
import {
  JzodElement,
  JzodObject,
  JzodReference,
  JzodUnion,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { LoggerInterface } from "../../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../../4_services/LoggerFactory";
import { packageName } from "../../constants";
import { cleanLevel } from "../constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodToJzod")
).then((logger: LoggerInterface) => {log = logger});

export type JzodReferenceResolutionFunction = (schema: JzodReference) => JzodElement | undefined;

// function forgeIdFromReference(r:JzodReference) {
// ################################################################################################
export function forgeCarryOnReferenceName(
  absolutePath: string,
  relativePath: string | undefined,
  suffix?: string,
  prefix: string = "carryOn_",
) {
  return (
    // "carryOn_" +
    prefix +
    absolutePath?.replace(/-/g, "$") +
    "_" +
    relativePath +
    (suffix ? "_" + suffix : "")
  );
}

// ################################################################################################
export function applyLimitedCarryOnSchema(
  baseSchema: JzodElement,
  carryOnSchema: JzodElement,
  carryOnSchemaDiscriminator: undefined | string | string[] = undefined,
  alwaysPropagate: boolean = true,
  carryOnPrefix?: string | undefined,
  localReferencePrefix?: string | undefined,
  suffixForReferences?: string | undefined,
  resolveJzodReference?: JzodReferenceResolutionFunction, // non-converted reference lookup
  convertedReferences?: Record<string, JzodElement>, // converted reference lookup
): { resultSchema: JzodElement; hasBeenApplied: boolean; resolvedReferences?: Record<string, JzodElement> } {
  return applyLimitedCarryOnSchemaOnLevel(
    baseSchema,
    carryOnSchema,
    carryOnSchemaDiscriminator,
    alwaysPropagate,
    true, // applyOnFirstLevel,
    carryOnPrefix, // carryOnPrefix,
    localReferencePrefix,
    suffixForReferences,
    resolveJzodReference,
    convertedReferences
  );
}

// ################################################################################################
export interface ApplyCarryOnSchemaOnLevelReturnType {
  resultSchema: JzodElement;
  hasBeenApplied: boolean;
  resolvedReferences?: Record<string, JzodElement>;
}

// ################################################################################################
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
 * @param alwaysPropagate if true, the result is a union of the baseSchema and the carryOnSchema
 * @param applyOnFirstLevel if true, the result is a union of the baseSchema and the carryOnSchema
 * @param carryOnPrefix the prefix to use for carryOn references, if any
 * @param localReferencePrefix the prefix to use for local references, if any
 * @param suffixForReferences the suffix to use for references, if any
 * @param resolveJzodReference the reference resolution function. Corollary: the definition of absolute references must be known at carryOn-application time.
 * @param convertedReferences the references already converted, to be used for reference resolution
 * @returns transformed @param baseSchema joined with @param carryOnSchema
 */
export function applyLimitedCarryOnSchemaOnLevel(
  baseSchema: JzodElement,
  carryOnSchema: JzodElement,
  carryOnSchemaDiscriminator: undefined | string | string[] = undefined,
  alwaysPropagate: boolean = true,
  applyOnFirstLevel: boolean,
  carryOnPrefix?: string | undefined,
  localReferencePrefix?: string | undefined,
  suffixForReferences?: string | undefined,
  resolveJzodReference?: JzodReferenceResolutionFunction, // non-converted reference lookup
  convertedReferences?: Record<string, JzodElement> // converted reference lookup
): ApplyCarryOnSchemaOnLevelReturnType
// {
//   resultSchema: JzodElement;
//   hasBeenApplied: boolean;
//   resolvedReferences?: Record<string, JzodElement>;
// }
{
  /**
   * jzodBaseObject.tag is {type: "any"} by default but can be subtyped to any concrete type
   * and shall then be applied the carryOn type
   * jzodBaseObject.tag is only indirectly taken into account during the translation to Zod,
   * through inheritance of jzodBaseObject. It is then viewed as any JzodObject attribute.
   *
   * But jzodBaseObject.tag presents a specific problem when applying a carryOn schema.
   * jzodBaseObject.tag gives the concrete type for the tag attribute of a JzodElement
   * there is no attribute giving the metatype of the jzodBaseObject.tag attribute, which is JzodElement
   * this metaTag attribute shall be interpreted and replaced by the concrete extra attribute during
   * the translation to Zod / TS. (???)
   *
   *
   */
  // log.info(
  //   "############# applyLimitedCarryOnSchemaOnLevel",
  //   "baseSchema",
  //   JSON.stringify(baseSchema),
  //   "carryOnSchema",
  //   JSON.stringify(carryOnSchema),
  //   "alwaysPropagate",
  //   alwaysPropagate,
  // );

  // const convertedTag = baseSchema.tag;
  const castTag = (baseSchema as any).tag as any;

  // if (!castTag || !Object.hasOwn(castTag, "canBeTemplate") || !castTag.canBeTemplate) {
  //   log.info("############# applyCarryOnSchema nothing to do for", "baseSchema.tag", castTag)
  //   return {
  //     resultSchema: baseSchema,
  //     resolvedReferences: convertedReferences,
  //   }
  // }
  // let convertedTag:JzodElement = castTag;
  let convertedTag:JzodElement = castTag?.value?{
    ...castTag,
    value: {...castTag.value, isTemplate: true}
  }: castTag;
  if (castTag && castTag.schema && castTag.schema.valueSchema) {    
    // Check if this tag references a transformer schema - if so, skip carryOn application
    // to prevent infinite recursion since transformers are already complete types
    const isTransformerReference = castTag.value && 
      castTag.value.conditionalMMLS && 
      castTag.value.conditionalMMLS.mmlsReference && 
      castTag.value.conditionalMMLS.mmlsReference.relativePath &&
      (castTag.value.conditionalMMLS.mmlsReference.relativePath.startsWith("transformerForBuild") ||
       castTag.value.conditionalMMLS.mmlsReference.relativePath.startsWith("transformerForRuntime"));
    
    if (isTransformerReference) {
      // Don't apply carryOn to transformer references to prevent infinite recursion
      convertedTag = castTag;
    } else {
      convertedTag = {
        ...castTag,
        schema: {
          ...castTag.schema,
          // isTemplate: true,
          valueSchema: applyLimitedCarryOnSchemaOnLevel(
            castTag.schema.valueSchema, // hard-coded type for jzodBaseSchema.extra is "any", it is replaced in any "concrete" jzodSchema definition
            carryOnSchema,
            carryOnSchemaDiscriminator,
            alwaysPropagate,
            false, // applyOnFirstLevel
            carryOnPrefix,
            localReferencePrefix,
            suffixForReferences,
            resolveJzodReference,
            convertedReferences
          ).resultSchema,
        },
      }; // TODO: what about resolvedReferences for extra? They are ignored, is it about right?
    }
  }

  // if (baseSchema.tag && baseSchema.tag.schema && baseSchema.tag.schema.valueSchema) {
  //   log.info("############# applyCarryOnSchema", "convertedTag", convertedTag)
  // }

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
      let resultSchema: any = undefined;
      if (
        applyOnFirstLevel &&
        (alwaysPropagate ||
          (castTag &&
            castTag.value &&
            Object.hasOwn(castTag.value, "canBeTemplate") &&
            castTag.value.canBeTemplate))
      ) {
        resultSchema = {
          resultSchema: {
            ...baseSchema,
            tag: convertedTag,
            type: "union",
            discriminator: carryOnSchemaDiscriminator,
            definition: [baseSchema, carryOnSchema],
          },
          hasBeenApplied: true,
        };
      } else {
        resultSchema = {
          resultSchema: baseSchema,
          hasBeenApplied: false,
        };
      }
      // if (equal(resultSchema, baseSchema) && identicalConvertedReferences) {
      //   // log.info("############# applyLimitedCarryOnSchemaOnLevel", "baseSchema", JSON.stringify(baseSchema, null, 2), "resultSchema", JSON.stringify(resultSchema, null, 2), "identicalConvertedReferences", identicalConvertedReferences)
      //   identicalConvertedReferences.add();
      // }
      return resultSchema;
      break;
    }
    case "record": {
      // const convertedSubSchemas: JzodElement[] = [];
      const convertedSubSchemasReferences: Record<string, JzodElement> = {};
      const convertedSubSchema = applyLimitedCarryOnSchemaOnLevel(
        baseSchema.definition,
        carryOnSchema,
        carryOnSchemaDiscriminator,
        alwaysPropagate,
        true, // applyOnFirstLevel
        carryOnPrefix,
        localReferencePrefix,
        suffixForReferences,
        resolveJzodReference,
        convertedReferences
      );
      for (const c of Object.entries(convertedSubSchema.resolvedReferences ?? {})) {
        convertedSubSchemasReferences[c[0]] = c[1];
      }
      // !applyOnFirstLevel || (
      //   !alwaysPropagate && (
      //     !castTag ||
      //     !Object.hasOwn(castTag, "canBeTemplate") ||
      //     !castTag.canBeTemplate
      //   )
      // )
      if (
        applyOnFirstLevel &&
        (alwaysPropagate ||
          (castTag &&
            castTag.value &&
            Object.hasOwn(castTag.value, "canBeTemplate") &&
            castTag.value.canBeTemplate))
      ) {
        return {
          resultSchema: {
            ...baseSchema,
            tag: convertedTag,
            type: "union",
            discriminator: carryOnSchemaDiscriminator,
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
          hasBeenApplied: true,
          resolvedReferences: convertedSubSchemasReferences,
        };
      } else {
        return {
          resultSchema: {
            ...baseSchema,
            tag: convertedTag,
            type: "record",
            definition: convertedSubSchema.resultSchema,
          } as any,
          hasBeenApplied: convertedSubSchema.hasBeenApplied,
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
        carryOnSchemaDiscriminator,
        alwaysPropagate,
        true, // applyOnFirstLevel
        carryOnPrefix,
        localReferencePrefix,
        suffixForReferences,
        resolveJzodReference,
        convertedReferences
      );
      for (const c of Object.entries(convertedSubSchema.resolvedReferences ?? {})) {
        convertedSubSchemasReferences[c[0]] = c[1];
      }
      // let result;
      if (
        applyOnFirstLevel &&
        (alwaysPropagate ||
          (castTag &&
            castTag.value &&
            Object.hasOwn(castTag.value, "canBeTemplate") &&
            castTag.value.canBeTemplate))
      ) {
        return {
          resultSchema: {
            ...baseSchema,
            tag: convertedTag,
            type: "union",
            discriminator: carryOnSchemaDiscriminator,
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
          hasBeenApplied: true,
          resolvedReferences: convertedSubSchemasReferences,
        };
      } else {
        return {
          resultSchema: {
            ...baseSchema,
            tag: convertedTag,
            type: "set",
            definition: convertedSubSchema.resultSchema,
          } as any,
          hasBeenApplied: convertedSubSchema.hasBeenApplied,
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
        carryOnSchemaDiscriminator,
        alwaysPropagate,
        true, // applyOnFirstLevel
        carryOnPrefix,
        localReferencePrefix,
        suffixForReferences,
        resolveJzodReference,
        convertedReferences
      );
      for (const c of Object.entries(convertedSubSchema.resolvedReferences ?? {})) {
        convertedSubSchemasReferences[c[0]] = c[1];
      }
      if (
        applyOnFirstLevel &&
        (alwaysPropagate || (castTag && castTag.value && castTag.value.canBeTemplate))
      ) {
        return {
          resultSchema: {
            ...baseSchema,
            tag: convertedTag,
            type: "union",
            discriminator: carryOnSchemaDiscriminator,
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
          hasBeenApplied: true,
          resolvedReferences: convertedSubSchemasReferences,
        };
      } else {
        return {
          resultSchema: {
            ...baseSchema,
            tag: convertedTag,
            type: "array",
            definition: convertedSubSchema.resultSchema,
          } as any,
          hasBeenApplied: convertedSubSchema.hasBeenApplied,
          resolvedReferences: convertedSubSchemasReferences,
        };
      }
      break;
    }
    case "tuple": {
      const convertedSubSchemas: JzodElement[] = [];
      const convertedSubSchemasHasBeenApplied: boolean[] = [];
      const convertedSubSchemasReferences: Record<string, JzodElement> = {};
      for (const subSchema of baseSchema.definition) {
        const convertedSubSchema = applyLimitedCarryOnSchemaOnLevel(
          subSchema,
          carryOnSchema,
          carryOnSchemaDiscriminator,
          alwaysPropagate,
          true, //applyOnFirstLevel
          carryOnPrefix,
          localReferencePrefix,
          suffixForReferences,
          resolveJzodReference,
          {
            ...convertedReferences,
            ...convertedSubSchemasReferences,
          }
        );
        convertedSubSchemas.push(convertedSubSchema.resultSchema);
        convertedSubSchemasHasBeenApplied.push(convertedSubSchema.hasBeenApplied);
        for (const c of Object.entries(convertedSubSchema.resolvedReferences ?? {})) {
          convertedSubSchemasReferences[c[0]] = c[1];
        }
      }
      if (
        applyOnFirstLevel &&
        (alwaysPropagate || (castTag && castTag.value && castTag.value.canBeTemplate))
      ) {
        return {
          resultSchema: {
            ...baseSchema,
            tag: convertedTag,
            type: "union",
            discriminator: carryOnSchemaDiscriminator,
            definition: [
              {
                ...baseSchema,
                tag: convertedTag,
                definition: convertedSubSchemas,
              } as any,
              carryOnSchema,
            ],
          } as any,
          hasBeenApplied: true,
        };
      } else {
        return {
          // returns a tuple
          resultSchema: {
            ...baseSchema,
            tag: convertedTag,
            // type: "tuple",
            definition: convertedSubSchemas,
          } as any,
          resolvedReferences: convertedSubSchemasReferences,
          hasBeenApplied: convertedSubSchemasHasBeenApplied.some((e) => e),
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
          carryOnSchemaDiscriminator,
          alwaysPropagate,
          false, // applyOnFirstLevel, no need to apply since result is a union, and carryOnSchema is added to union (array) definition
          carryOnPrefix,
          localReferencePrefix,
          suffixForReferences,
          resolveJzodReference,
          convertedReferences
        )
      );
      const newResolvedReferences = subConvertedSchemas.filter((e) => e.resolvedReferences);
      const references = newResolvedReferences
        ? Object.fromEntries(
            newResolvedReferences.flatMap((e) => Object.entries(e.resolvedReferences ?? {}))
          )
        : undefined;
      if (
        applyOnFirstLevel &&
        (alwaysPropagate || (castTag && castTag.value && castTag.value.canBeTemplate))
      ) {
        return {
          resultSchema: {
            ...baseSchema,
            tag: convertedTag,
            type: "union",
            discriminator: baseSchema.discriminator??carryOnSchemaDiscriminator,
            definition: [...subConvertedSchemas.map((e) => e.resultSchema), carryOnSchema],
          } as any,
          hasBeenApplied: true,
          resolvedReferences: references,
        };
      } else {
        return {
          resultSchema: {
            ...baseSchema,
            tag: convertedTag,
            type: "union",
            // discriminator: subConvertedSchemas.some((e) => e.hasBeenApplied)?carryOnSchemaDiscriminator: baseSchema.discriminator,
            definition: [...subConvertedSchemas.map((e) => e.resultSchema)], // do not include carryOnSchema as !applyOnFirstLevel and canBeTemplate is false or undefined
          } as any,
          hasBeenApplied: subConvertedSchemas.some((e) => e.hasBeenApplied),
          resolvedReferences: references,
        };
      }
      break;
    }
    case "object": {
      const convertedSubSchemas: Record<string, JzodElement> = {};
      const convertedSubSchemasHasBeenApplied: boolean[] = [];
      const convertedSubSchemasReferences: Record<string, JzodElement> = {};
      for (const subSchema of Object.entries(baseSchema.definition)) {
        // log.info("SubSchema", subSchema[0], JSON.stringify(subSchema, null, 2));
        const convertedSubSchema = applyLimitedCarryOnSchemaOnLevel(
          subSchema[1],
          carryOnSchema,
          carryOnSchemaDiscriminator,
          alwaysPropagate,
          true, // applyOnFirstLevel
          carryOnPrefix,
          localReferencePrefix,
          undefined, // do not add suffixForReferences to definition of an object, only to extended references
          resolveJzodReference,
          { ...convertedReferences, ...convertedSubSchemasReferences }
        );
        convertedSubSchemas[subSchema[0]] = convertedSubSchema.resultSchema;
        convertedSubSchemasHasBeenApplied.push(convertedSubSchema.hasBeenApplied);
        // log.info("convertedSubSchema", subSchema[0], JSON.stringify(convertedSubSchema.resultSchema, null, 2));
        for (const c of Object.entries(convertedSubSchema.resolvedReferences ?? {})) {
          convertedSubSchemasReferences[c[0]] = c[1];
        }
      }
      // log.info("convertedSubSchemasReferences", JSON.stringify(convertedSubSchemasReferences, null, 2));
      // log.info("convertedSubSchemas", JSON.stringify(convertedSubSchemas, null, 2));`
      const convertedExtendResults: ApplyCarryOnSchemaOnLevelReturnType[] | undefined =
        baseSchema.extend && typeof baseSchema.extend == "object"
          ? !Array.isArray(baseSchema.extend)
            ? [
                applyLimitedCarryOnSchemaOnLevel(
                  baseSchema.extend,
                  carryOnSchema,
                  carryOnSchemaDiscriminator,
                  alwaysPropagate,
                  false, // applyOnFirstLevel
                  carryOnPrefix,
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
                    carryOnSchemaDiscriminator,
                    alwaysPropagate,
                    false, // applyOnFirstLevel
                    carryOnPrefix,
                    localReferencePrefix,
                    "extend", //suffixForReferences,
                    resolveJzodReference,
                    convertedReferences
                  )
              )
          : undefined; // TODO: apply carryOn object
      // log.info("convertedExtendResults", JSON.stringify(convertedExtendResults, null, 2));
      const convertedExtendReferences = convertedExtendResults
        ? Object.fromEntries(
            convertedExtendResults.flatMap((e) => Object.entries(e.resolvedReferences ?? {}))
          )
        : undefined;
      if (
        applyOnFirstLevel &&
        (alwaysPropagate ||
          (castTag &&
            castTag.value &&
            Object.hasOwn(castTag.value, "canBeTemplate") &&
            castTag.value.canBeTemplate))
      ) {
        return {
          resultSchema: {
            // ...baseSchema,
            optional: baseSchema.optional,
            nullable: baseSchema.nullable,
            // extra: baseSchema.extra,
            tag: convertedTag,
            type: "union",
            discriminator: carryOnSchemaDiscriminator,
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
                // extra: baseSchema.extra,
                tag: convertedTag,
                definition: convertedSubSchemas,
              },
            ],
          } as any,
          hasBeenApplied: true,
          resolvedReferences: {
            ...convertedSubSchemasReferences,
            ...convertedExtendReferences,
          },
        };
      } else {
        return {
          resultSchema: {
            ...baseSchema,
            optional: baseSchema.optional,
            nullable: baseSchema.nullable,
            // extra: baseSchema.extra,
            tag: convertedTag,
            extend: convertedExtendResults
              ? (convertedExtendResults.map((e) => e.resultSchema) as (
                  | JzodReference
                  | JzodObject
                )[])
              : undefined,
            definition: convertedSubSchemas,
          } as any,
          hasBeenApplied:
            convertedSubSchemasHasBeenApplied.some((e) => e) ||
            (convertedExtendResults && Array.isArray(convertedExtendResults)
              ? convertedExtendResults.some((e) => e.hasBeenApplied)
              : false),
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
      let convertedContextSubSchemasHasBeenApplied: boolean[] = [];
      const convertedContextSubSchemasReferences: Record<string, JzodElement> = {};
      const convertedAbosulteReferences: Record<string, JzodElement> = {};
      let resultReferenceDefinition = undefined;

      /**
       * the transformer references must not be converted, since it is implied the carryOnSchema is a tranformer reference
       * 
       */
      if (["transformerForBuild", "transformerForRuntime", "transformerForBuildPlusRuntime"].includes(baseSchema?.definition?.relativePath??"")) {
        return {
          resultSchema: baseSchema,
          hasBeenApplied: false,
        };
      }

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
          carryOnPrefix
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
            carryOnSchemaDiscriminator,
            alwaysPropagate,
            true, // applyOnFirstLevel
            carryOnPrefix,
            baseSchema.definition.absolutePath,
            suffixForReferences,
            resolveJzodReference,
            {
              ...convertedReferences,
              [localReferenceName]: { type: "never" },
            }
          );
          convertedContextSubSchemasHasBeenApplied.push(convertedReference.hasBeenApplied);
          convertedAbosulteReferences[localReferenceName] = convertedReference.resultSchema; // what about local references of absolute references?
          resultReferenceDefinition = {
            ...baseSchema.definition,
            relativePath: localReferenceName,
          };
        } else {
          // localReferenceName already exists in convertedReferences, it can be referencesd without further conversion
          resultReferenceDefinition = {
            ...baseSchema.definition,
            relativePath: localReferenceName,
          };
        }
      } else {
        // if (baseSchema.definition.absolutePath)
        // we only need to replace it with a renamed local reference in case we have a prefix
        resultReferenceDefinition = {
          ...baseSchema.definition,
          relativePath: localReferencePrefix
            ? forgeCarryOnReferenceName(
                localReferencePrefix,
                baseSchema.definition.relativePath,
                suffixForReferences,
                carryOnPrefix
              )
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
          carryOnSchemaDiscriminator,
          alwaysPropagate,
          true, // applyOnFirstLevel
          carryOnPrefix,
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
        convertedContextSubSchemasHasBeenApplied.push(convertedSubSchema.hasBeenApplied);
        for (const c of Object.entries(convertedSubSchema.resolvedReferences ?? {})) {
          convertedContextSubSchemasReferences[c[0]] = c[1];
        }
      }

      if (
        applyOnFirstLevel &&
        (alwaysPropagate ||
          (castTag &&
            castTag.value &&
            Object.hasOwn(castTag.value, "canBeTemplate") &&
            castTag.value.canBeTemplate))
      ) {
        return {
          resultSchema: {
            type: "union",
            tag: convertedTag,
            discriminator: carryOnSchemaDiscriminator,
            definition: [
              {
                ...baseSchema,
                tag: convertedTag,
                definition: resultReferenceDefinition
                  ? {
                      ...baseSchema.definition,
                      ...resultReferenceDefinition,
                    }
                  : baseSchema.definition,
              } as any,
              carryOnSchema,
            ],
          },
          hasBeenApplied: true,
          resolvedReferences: {
            ...convertedReferences,
            ...convertedAbosulteReferences,
            ...convertedContextSubSchemasReferences,
          },
        };
      } else {
        return {
          resultSchema: {
            ...baseSchema, // keeping all baseSchema attributes (optional, nullable...) including context! TODO: remove context?
            tag: convertedTag,
            context: convertedContextSubSchemas,
            definition: resultReferenceDefinition
              ? {
                  ...baseSchema.definition,
                  ...resultReferenceDefinition,
                }
              : baseSchema.definition,
          } as any,
          hasBeenApplied: convertedContextSubSchemasHasBeenApplied.some((e) => e),
          resolvedReferences: {
            ...convertedReferences,
            ...convertedAbosulteReferences,
            ...convertedContextSubSchemasReferences,
          },
        };
      }
      break;
    }
    case "intersection":
    case "promise":
    case "lazy": // TODO: alter the lazy's returned value to "carryOn" it? (becoming z.lazy(()=>carryOn(baseSchema)))
    case "function":
    default: {
      throw new Error(
        "applyLimitedCarryOnSchemaOnLevel could not handle baseSchema: " +
          JSON.stringify(baseSchema, null, 2)
      );
      break;
    }
  }
}
