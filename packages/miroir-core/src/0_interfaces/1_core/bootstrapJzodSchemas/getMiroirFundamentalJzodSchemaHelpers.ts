// import { Chalk } from "chalk";


import { cleanLevel } from "../../../1_core/constants";
import {
  applyLimitedCarryOnSchemaOnLevel,
  forgeCarryOnReferenceName,
  JzodReferenceResolutionFunction
} from "../../../1_core/jzod/JzodToJzod";
import { MiroirLoggerFactory } from "../../../4_services/MiroirLoggerFactory";
import { packageName } from "../../../constants";
import { LoggerInterface } from "../../4-services/LoggerInterface";
import type { JzodReference, JzodElement } from "@miroir-framework/jzod-ts";
import { jzodTransitiveDependencySet } from "../../../1_core/jzod/JzodSchemaReferences";
// import { JzodElement, JzodReference } from "../preprocessor-generated/miroirFundamentalType";

// const customChalk = new Chalk({level: 1})

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "getMiroirFundamentalJzodSchemaHelpers")
).then((logger: LoggerInterface) => {
  log = logger;
});

export const miroirFundamentalJzodSchemaUuid = "fe9b7d99-f216-44de-bb6e-60e1a1ebb739";

export const testCompositeActionParams: JzodElement = {
  type: "union",
  definition: [
    {
      type: "object",
      definition: {
        testActionType: { type: "literal", definition: "testCompositeActionSuite"},
        testActionLabel: { type: "string" },
        application: { type: "uuid" },
        // deploymentUuid: { type: "uuid" },
        testCompositeAction: {
          type: "schemaReference",
          definition: {
            relativePath: "testCompositeActionSuite",
          }
        },
      },
    },
    {
      type: "object",
      definition: {
        testActionType: { type: "literal", definition: "testCompositeAction" },
        testActionLabel: { type: "string" },
        application: { type: "uuid" },
        // deploymentUuid: { type: "uuid" },
        testCompositeAction: {
          type: "schemaReference",
          definition: {
            relativePath: "testCompositeAction",
          }
        },
      },
    },
    // {
    //   type: "object",
    //   definition: {
    //     testActionType: { type: "literal", definition: "testRuntimeCompositeActionSuite" },
    //     testActionLabel: { type: "string" },
    //     deploymentUuid: { type: "uuid" },
    //     testCompositeAction: {
    //       type: "schemaReference",
    //       definition: {
    //         relativePath: "testRuntimeCompositeActionSuite",
    //       }
    //     },
    //   },
    // },
    // {
    //   type: "object",
    //   definition: {
    //     testActionType: { type: "literal", definition: "testRuntimeCompositeAction" },
    //     testActionLabel: { type: "string" },
    //     deploymentUuid: { type: "uuid" },
    //     testCompositeAction: {
    //       type: "schemaReference",
    //       definition: {
    //         relativePath: "testRuntimeCompositeAction",
    //       }
    //     },
    //   },
    // },
    {
      type: "object",
      definition: {
        testActionType:{type:"literal",definition:"testBuildPlusRuntimeCompositeActionSuite"},
        testActionLabel:{type:"string"},
        application: { type: "uuid" },
        // deploymentUuid:{type:"uuid"},
        testParams:{type:"record",definition:{ type: "any"}},
        testCompositeAction:{
          type:"schemaReference",
          definition:{
            relativePath:"testBuildPlusRuntimeCompositeActionSuite"
          }
        }
      }
    },
    {
      type:"object",
      definition:{
        testActionType:{type:"literal",definition:"testBuildPlusRuntimeCompositeAction"},
        testActionLabel:{type:"string"},
        application: { type: "uuid" },
        // deploymentUuid:{type:"uuid"},
        testParams:{type:"record",definition:{ type: "any"}},
        testCompositeAction:{
          type:"schemaReference",
          definition:{
            relativePath:"testBuildPlusRuntimeCompositeAction"
          }
        }
      }
    },
    {
      type: "object",
      definition: {
        testActionType: { type: "literal", definition: "testCompositeActionTemplateSuite"},
        testActionLabel: { type: "string" },
        application: { type: "uuid" },
        // deploymentUuid: { type: "uuid" },
        testCompositeActionSuite: {
          type: "schemaReference",
          definition: {
            relativePath: "testCompositeActionTemplateSuite",
          }
        },
      },
    },
    {
      type: "object",
      definition: {
        testActionType: { type: "literal", definition: "testCompositeActionTemplate" },
        testActionLabel: { type: "string" },
        application: { type: "uuid" },
        // deploymentUuid: { type: "uuid" },
        testCompositeAction: {
          type: "schemaReference",
          definition: {
            relativePath: "testCompositeActionTemplate",
          }
        },
      },
    },
  ]
}

// ################################################################################################
/**
 * adds given absolutePath to all references in the schema
 * @param mlSchema
 * @param absolutePath
 * @param force
 * @returns
 */
export function makeReferencesAbsolute(mlSchema: any /** JzodElement */, absolutePath: string, force?: boolean): any /** JzodElement */ {
  // log.info("makeReferencesAbsolute called", JSON.stringify(mlSchema), absolutePath, force);
  switch (mlSchema.type) {
    case "schemaReference": {
      const convertedContext = Object.fromEntries(
        Object.entries(mlSchema.context ?? {}).map((e: [string, any]) => {
          if (!e[1]) {
            throw new Error(
              "makeReferencesAbsolute schemaReference: context mlSchema is undefined for " + e[0]
            );
            // throw new Error("makeReferencesAbsolute schemaReference: context mlSchema is undefined for " + e[0] + " context " + JSON.stringify(Object.keys(mlSchema.context)));
          }
          return [
            // Object.entries(mlSchema.context ?? {}).map((e: [string, JzodElement]) => [
            e[0],
            makeReferencesAbsolute(e[1], absolutePath, force),
          ];
        })
      );

      const result =
        mlSchema.definition.absolutePath && !force
          ? {
              ...mlSchema,
              context: convertedContext,
            }
          : {
              ...mlSchema,
              context: convertedContext,
              definition: {
                ...mlSchema.definition,
                absolutePath,
              },
            };
      // log.info("makeReferencesAbsolute schemaReference received", JSON.stringify(mlSchema));
      // log.info("makeReferencesAbsolute schemaReference returns", JSON.stringify(result));
      return result;
      break;
    }
    case "object": {
      const convertedExtend = mlSchema.extend
        ? typeof mlSchema.extend == "object" && !Array.isArray(mlSchema.extend)
          ? makeReferencesAbsolute(mlSchema.extend, absolutePath, force)
          : mlSchema.extend.map((e: any) => makeReferencesAbsolute(e, absolutePath, force))
        : (undefined as any);
      const convertedDefinition = Object.fromEntries(
        Object.entries(mlSchema.definition).map((e: [string, any]) => [
          // Object.entries(mlSchema.definition).map((e: [string, JzodElement]) => [
          e[0],
          makeReferencesAbsolute(e[1], absolutePath, force),
        ])
      );
      return convertedExtend
        ? {
            ...mlSchema,
            extend: convertedExtend,
            definition: convertedDefinition,
          }
        : {
            ...mlSchema,
            definition: convertedDefinition,
          };
      break;
    }
    case "array":
    case "lazy":
    case "record":
    case "promise":
    case "set": {
      if (!mlSchema.definition) {
        throw new Error(
          "makeReferencesAbsolute set: mlSchema.definition is undefined " +
            JSON.stringify(mlSchema)
        );
      }
      return {
        ...mlSchema,
        definition: makeReferencesAbsolute(mlSchema.definition, absolutePath, force) as any,
      };
      break;
    }
    case "map": {
      if (!mlSchema.definition[0]) {
        throw new Error(
          "makeReferencesAbsolute map: mlSchema.definition[0] is undefined " +
            JSON.stringify(mlSchema)
        );
      }
      if (!mlSchema.definition[1]) {
        throw new Error(
          "makeReferencesAbsolute map: mlSchema.definition[0] is undefined " +
            JSON.stringify(mlSchema)
        );
      }
      return {
        ...mlSchema,
        definition: [
          makeReferencesAbsolute(mlSchema.definition[0], absolutePath, force),
          makeReferencesAbsolute(mlSchema.definition[1], absolutePath, force),
        ],
      };
    }
    case "function": {
      if (!mlSchema.definition.returns) {
        throw new Error(
          "makeReferencesAbsolute: mlSchema.definition is undefined " + JSON.stringify(mlSchema)
        );
      }

      return {
        ...mlSchema,
        definition: {
          args: mlSchema.definition.args.map((e: any) =>
            makeReferencesAbsolute(e, absolutePath, force)
          ),
          returns: mlSchema.definition.returns
            ? makeReferencesAbsolute(mlSchema.definition.returns, absolutePath, force)
            : undefined,
        },
      };
      break;
    }
    case "intersection": {
      if (!mlSchema.definition.left) {
        throw new Error(
          "makeReferencesAbsolute intersection: mlSchema.definition.left is undefined " +
            JSON.stringify(mlSchema)
        );
      }
      if (!mlSchema.definition.right) {
        throw new Error(
          "makeReferencesAbsolute intersection: mlSchema.definition.left is undefined " +
            JSON.stringify(mlSchema)
        );
      }

      return {
        ...mlSchema,
        definition: {
          left: makeReferencesAbsolute(mlSchema.definition.left, absolutePath, force),
          right: makeReferencesAbsolute(mlSchema.definition.right, absolutePath, force),
        },
      };
      break;
    }
    case "union":
    case "tuple": {
      return {
        ...mlSchema,
        definition: mlSchema.definition.map((e: any) =>
          makeReferencesAbsolute(e, absolutePath, force)
        ),
      };
      break;
    }
    // case "simpleType":
    case "any":
    case "enum":
    case "literal":
    default: {
      return mlSchema;
      break;
    }
  }
}

// ################################################################################################
export function getExtendedSchemas(jzodSchemajzodMiroirBootstrapSchemaDefinitionContext: any) {
  const result = [
    ...Object.keys(jzodSchemajzodMiroirBootstrapSchemaDefinitionContext),
    "applicationSection",
    "shippingBox",
    "entityDefinitionRoot",
    "extractorOrCombinerRoot",
    "transformer_inner_label",
    "transformer_orderBy",
    "transformerForBuildPlusRuntime_Abstract",
    "transformerForBuildPlusRuntime_optional_Abstract",
  ];
  // log.info("getExtendedSchemas result", JSON.stringify(result, null, 2));
  return result;
}

// ################################################################################################
export function getExtendedSchemasWithCarryOn(
  jzodSchemajzodMiroirBootstrapSchema: any,
  absolutePath: string,
  prefix?: string,
) {
  const result = getExtendedSchemas(jzodSchemajzodMiroirBootstrapSchema.definition.context).map(
    (relativePath: string) => forgeCarryOnReferenceName(absolutePath, relativePath, "extend", prefix)
  );
  // log.info("getExtendedSchemasWithCarryOn result", JSON.stringify(result, null, 2));
  return result;
}
// ################################################################################################
  // const resolveReferencesWithCarryOn: JzodReferenceResolutionFunction = ((
export function resolveReferencesWithCarryOn(
  localizedResolutionStore: Record<string, any>,
  ref: any /** JzodReference */
): any /** JzodElement */ | undefined {
  // looks up the reference in the localizedResolutionStore
  const resolvedAbsolutePath = localizedResolutionStore[ref.definition?.absolutePath ?? ""];
  const result =
    resolvedAbsolutePath && resolvedAbsolutePath.context
      ? resolvedAbsolutePath.context[ref.definition?.relativePath ?? ""]
      : undefined;
  const resultWithAbsoluteReferences = result
    ? (makeReferencesAbsolute(result, miroirFundamentalJzodSchemaUuid) as any)
    : result;
  if (resultWithAbsoluteReferences) {
    // log.info(
    //   "resolveReferencesWithCarryOn skipped resolved reference",
    //   JSON.stringify(ref),
    // );

    return resultWithAbsoluteReferences;
  } else {
    throw new Error(
      "getMiroirFundamentalJzodSchema resolveReferencesWithCarryOn resolve reference could not find reference " +
        JSON.stringify(ref) +
        " in " +
        Object.keys(localizedResolutionStore)
    );
  }
};

// ################################################################################################
export const getDependencySet = (
  jzodSchemajzodMiroirBootstrapSchema: any,
  context: JzodReference,
  absoluteMiroirFundamentalJzodSchema: any /** miroirFundamentalJzodSchema with absolute references */,
  elementName: string,
  addJzodElementsToDependencySet: boolean = true,
) : JzodReference => {
  const _t0 = Date.now();
  log.info("########################################## Calculating", elementName, "DependencySet...");

  const jzodElementDependencySet = jzodTransitiveDependencySet(
    context,
    elementName,
    true, // includeExtend
  );
  // log.info("getDependencySet before hack:", Array.from(jzodElementDependencySet.keys()).length);
  // log.info("Forcing jzod schema definition into jzodElementDependencySet...");
  if (addJzodElementsToDependencySet) {
    log.info("Adding jzod schema definition into jzodElementDependencySet...");
    Object.keys((jzodSchemajzodMiroirBootstrapSchema as any).definition.context).forEach((key) => {
      jzodElementDependencySet.add(key);
    });
  }

  // log.info(
  //   "jzodElementDependencySet",
  //   Array.from(jzodElementDependencySet.keys()).length,
  //   JSON.stringify(Array.from(jzodElementDependencySet.keys()), null, 2),
  // );
  const jzodElementDependenciesJzodReference: JzodReference = {
    type: "schemaReference",
    context: Object.fromEntries(
      Array.from(jzodElementDependencySet.keys()).map((key) => {
        if (!absoluteMiroirFundamentalJzodSchema.definition.context[key]) {
          throw new Error(
            `jzodElementDependenciesJzodReference failed, Key ${key} not found in miroirFundamentalJzodSchema.context, existing keys are: ${Object.keys(
              absoluteMiroirFundamentalJzodSchema.definition.context,
            )}`,
          );
        }

        return [key, (absoluteMiroirFundamentalJzodSchema.definition as any).context[key]];
      }),
    ),
    definition: {
      relativePath: elementName,
    },
  };
  // log.info(
  //   "getMiroirFundamentalJzodSchema jzodElement_extendedSchemas",
  //   jzodElement_extendedSchemas.length,
  //   JSON.stringify(jzodElement_extendedSchemas, null, 2),
  // );

  log.info(`########################################## Calculating ${elementName} DependencySet DONE, took ${Date.now() - _t0}ms.`);
  return jzodElementDependenciesJzodReference;
};



// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// applies applyLimitedCarryOnSchemaOnLevel
// ################################################################################################
// pre-converts extended schemas to carryOnSchema, since extended schemas have "eager" references to the carryOnSchema
export function createLocalizedInnerResolutionStoreForExtendedSchemas(
  localizedResolutionStore: JzodReference,
  extendedSchemas: string[],
  carryOnSchemaReference: JzodReference,
  carryOnSchemaReferenceForArray: JzodReference,
  carryOnSchemaDiscriminator: undefined | string | string[] | (string | string[])[] = undefined,
  resolveReferencesWithCarryOn: JzodReferenceResolutionFunction,
  prefix: string,
  alwaysPropagate: boolean = false,
): Record<string, any> {
  const _t0 = Date.now();
  // console.log("createLocalizedInnerResolutionStoreForExtendedSchemas called with localizedResolutionStore.context:", JSON.stringify(localizedResolutionStore.context, null, 2));
  console.log(
    `createLocalizedInnerResolutionStoreForExtendedSchemas(${prefix}) called, extendedSchemas: ${extendedSchemas.length}, localizedResolutionStore.context keys: ${JSON.stringify(Object.keys(localizedResolutionStore.context ?? {}), null, 2)}`,
  );
  const result: Record<string, any> = {};
  
  extendedSchemas.forEach((e) => {
    if (localizedResolutionStore.context === undefined) {
      throw new Error(
        `createLocalizedInnerResolutionStoreForExtendedSchemas: localizedResolutionStore.context is undefined`,
      );
    }
    if (localizedResolutionStore.context[e] === undefined) {
      log.error(
        "createLocalizedInnerResolutionStoreForExtendedSchemas: localizedResolutionStore.context",
        JSON.stringify(Object.keys(localizedResolutionStore.context), null, 2),
      );
      throw new Error(
        `createLocalizedInnerResolutionStoreForExtendedSchemas: localizedResolutionStore.context["${e}"] is undefined`,
      );
    }

    const appliedLimitedCarryOnResult = applyLimitedCarryOnSchemaOnLevel(
      localizedResolutionStore.context[e] as any, // applyLimitedCarryOnSchemaOnLevel uses the generated JzodElement, not the one from jzod-ts
      carryOnSchemaReference as any,
      carryOnSchemaReferenceForArray as any, // applyLimitedCarryOnSchemaOnLevel uses the generated JzodElement, not the one from jzod-ts
      carryOnSchemaDiscriminator as any, // applyLimitedCarryOnSchemaOnLevel uses the generated JzodElement, not the one from jzod-ts
      alwaysPropagate,
      false, // applyOnFirstLevel is false, since the result will be an object that is used in an "extend" clause
      prefix, // carryOnPrefix
      undefined, // localReferencePrefix
      "extend", // suffixForReferences
      resolveReferencesWithCarryOn,
      result, // convertedReferences: we want to accumulate converted references across extended schemas to avoid re-converting same absolute references across multiple extended schemas
    );
    result[forgeCarryOnReferenceName(miroirFundamentalJzodSchemaUuid, e, "extend", prefix)] =
      appliedLimitedCarryOnResult.resultSchema;
  });
  log.info(`createLocalizedInnerResolutionStoreForExtendedSchemas(${prefix}) took ${Date.now() - _t0}ms, ${extendedSchemas.length} schemas`);
  return result;
}

// ################################################################################################
// ################################################################################################
export function createLocalizedInnerResolutionStoreWithCarryOn(
  localizedResolutionStore: JzodReference,
  carryOnSchemaReference: JzodReference,
  carryOnSchemaReferenceForArray: JzodReference,
  carryOnSchemaDiscriminator: undefined | string | string[] = undefined,
  resolveReferencesWithCarryOn: JzodReferenceResolutionFunction,
  prefix: string,
  alwaysPropagate: boolean = true,
  convertedReferences?: Record<string, JzodElement>, // converted reference lookup
): Record<string, any> {
  // log.info(
  //   "createLocalizedInnerResolutionStoreWithCarryOn: localizedResolutionStore.context",
  //   Object.keys(localizedResolutionStore.context ?? {}).length,
  //   JSON.stringify(Object.keys(localizedResolutionStore.context ?? {}), null, 2)
  // );
  const _t0 = Date.now();
  const sharedConvertedReferences: Record<string, any> = {}; // uses 'any' to avoid JzodElement version conflict between jzod-ts and generated miroirFundamentalType
  const resultEntries: [string, any][] = [];
  for (const [entryName, entrySchema] of Object.entries(localizedResolutionStore.context ?? {})) {
    // log.info(
    //   customChalk.blue("createLocalizedInnerResolutionStoreWithCarryOn: localizedResolutionStore.context"),
    //   customChalk.green(entryName),
    //   customChalk.yellow(entrySchema && entrySchema.type),
    //   customChalk.magenta(entrySchema && (entrySchema as any).definition && (entrySchema as any).definition?.relativePath)
    // );
    if (entryName in (convertedReferences??{})) {
      log.info(`createLocalizedInnerResolutionStoreWithCarryOn(${prefix}): entry ${entryName} already converted, skipping carryOn application`);
      resultEntries.push([
        entryName,
        entrySchema
      ]);
      continue;
    }
    const schemaWithCarryOn = applyLimitedCarryOnSchemaOnLevel(
      entrySchema as any, // applyLimitedCarryOnSchemaOnLevel uses the generated JzodElement, not the one from jzod-ts
      carryOnSchemaReference as any,
      carryOnSchemaReferenceForArray as any,
      carryOnSchemaDiscriminator,
      alwaysPropagate, // alwaysPropagate
      true, // applyOnFirstLevel
      prefix, // carryOnPrefix
      undefined, //localReferencePrefix
      undefined, // suffixForReferences
      resolveReferencesWithCarryOn,
      sharedConvertedReferences, // convertedReferences: shared across entries to avoid re-converting same absolute references
      [], // skipObjectAttributesOnFirstLevel
      // skipContextEntry as any,
    );
    if (schemaWithCarryOn.resolvedReferences) {
      Object.assign(sharedConvertedReferences, schemaWithCarryOn.resolvedReferences);
    }
    resultEntries.push([
      forgeCarryOnReferenceName(miroirFundamentalJzodSchemaUuid, entryName, undefined, prefix),
      // TODO: add inner references to environment!!!!
      schemaWithCarryOn.hasBeenApplied ? schemaWithCarryOn.resultSchema : {
        type: "schemaReference",
        definition: {
          absolutePath: miroirFundamentalJzodSchemaUuid,
          relativePath: entryName,
        },
      }
    ]);
  }
  const result = Object.fromEntries(resultEntries);
  log.info(`  createLocalizedInnerResolutionStoreWithCarryOn(${prefix}) took ${Date.now() - _t0}ms, context entries: ${Object.keys(localizedResolutionStore.context ?? {}).length}, shared refs accumulated: ${Object.keys(sharedConvertedReferences).length}`);
  return result;
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
/**
 * checks that entries in the domainActionDependencySet are present in the context of the carryOnSchemaReference
 * @param element 
 * @param absoluteMiroirFundamentalJzodSchema 
 * @param carryOnSchemaReference 
 * @param dependencySet 
 * @param prefix 
 * @param alwaysPropagate
 * @param convertedReferences - used to avoid re-converting same absolute references across multiple calls to getCarryOnScemaBuilder, since the same references are often shared across multiple domainAction schemas
 * @returns 
 */
export function getCarryOnSchemaBuilder(
  element: JzodElement,
  dependencySet: Set<string>,
  absoluteMiroirFundamentalJzodSchema: any, /** miroirFundamentalJzodSchema with absolute references */
  carryOnSchemaReference: JzodReference,
  carryOnSchemaReferenceForArray: JzodReference,
  carryOnSchemaDiscriminator: undefined | string | string[] = undefined,
  prefix: string,
  alwaysPropagate: boolean,
  convertedReferences?: Record<string, JzodElement>, // converted reference lookup
) {
  const _tStart = Date.now();
  if (absoluteMiroirFundamentalJzodSchema.definition.context == undefined) {
    throw new Error(
      `Key context not found in miroirFundamentalJzodSchema.context, existing keys are: ${Object.keys(
        absoluteMiroirFundamentalJzodSchema.definition
      )}`
    );
  }

  // checks that entries in the domainActionDependencySet are present in the context of the carryOnSchemaReference
  const dependenciesJzodReference: JzodReference = {
    type: "schemaReference",
    context: Object.fromEntries(
      Array.from(dependencySet.keys()).map((key) => {
        if (!absoluteMiroirFundamentalJzodSchema.definition.context[key]) {
          throw new Error(
            `Key ${key} not found in miroirFundamentalJzodSchema.context when building dependenciesInnerResolutionStore, existing keys are: ${Object.keys(
              absoluteMiroirFundamentalJzodSchema.definition.context
            )}`
          );
        }
        return [key, (absoluteMiroirFundamentalJzodSchema.definition as any).context[key]];
      })
    ),
    definition: {
      relativePath: "jzodElement", // not relevant???
    },
    // },
  };

  // // // convert extendedSchemas to carryOn-bearing schemas
  // const _t0 = Date.now();

  // log.info(`getCarryOnSchemaBuilder extendedSchemas(${prefix}) took ${Date.now() - _t0}ms`);
  // convert plain references found in domainAction to carryOn-bearing schemas
  const _t1 = Date.now();
  const localizedInnerResolutionStorePlainReferences = createLocalizedInnerResolutionStoreWithCarryOn(
    dependenciesJzodReference,
    carryOnSchemaReference,
    carryOnSchemaReferenceForArray,
    carryOnSchemaDiscriminator,
    resolveReferencesWithCarryOn.bind(undefined, {
      [miroirFundamentalJzodSchemaUuid]: dependenciesJzodReference,
      // [miroirFundamentalJzodSchemaUuid]: absoluteMiroirFundamentalJzodSchema.definition,
    }),
    prefix,
    alwaysPropagate,
    convertedReferences,
  );

  // log.info(
  //   "domainActionLocalizedInnerResolutionStorePlainReferences",
  //   Object.keys(domainActionLocalizedInnerResolutionStorePlainReferences).length,
  //   JSON.stringify(Object.keys(domainActionLocalizedInnerResolutionStorePlainReferences), null, 2)
  // );

  log.info(`  getCarryOnScemaBuilder plainRefs(${prefix}) took ${Date.now() - _t1}ms`);
  const _t2 = Date.now();
  const carryOnDomainActionSchemaBuilder = applyLimitedCarryOnSchemaOnLevel(
    element as any,
    carryOnSchemaReference as any,
    carryOnSchemaReferenceForArray as any,
    carryOnSchemaDiscriminator as any,
    alwaysPropagate,// false, // alwaysPropagate
    false, // applyOnFirstLevel
    prefix, // carryOnPrefix,
    undefined, // reference prefix
    undefined, // reference suffix
    resolveReferencesWithCarryOn.bind(undefined, {
      [miroirFundamentalJzodSchemaUuid]: dependenciesJzodReference,
    }), // resolveReference
    convertedReferences as any, // cast to avoid using generated JzodElement type in this function (that would be a recursive reference)
  );
  log.info(`  getCarryOnScemaBuilder schema(${prefix}) took ${Date.now() - _t2}ms`);
  log.info(`########################################## getCarryOnScemaBuilder(${prefix}) DONE, total took ${Date.now() - _tStart}ms`);
  return {
    localizedInnerResolutionStorePlainReferences,
    carryOnDomainActionSchemaBuilder,
  };
  // return runtimeDomainActionSchemaBuilder;
}


// ##############################################################################################
export const getJzodElementWithCarryOnContextDEFUNCT = (
  prefix: string,
  transformerForBuildPlusRuntimeCarryOnSchemaReference: JzodReference,
  transformerForBuildPlusRuntimeForArrayCarryOnSchemaReference: JzodReference,
  jzodElement_extendedSchemas: string[],
  jzodElementDependenciesJzodReference: JzodReference,
  skipAlreadyProducedKeys?: Set<string>,
) => {
  const _tStart = Date.now();
  log.info("########################################## getJzodElementWithCarryOnContext start:", prefix);
  // Filter extended schemas: skip those whose output key is already covered by domainAction stores
  const effectiveExtendedSchemas = skipAlreadyProducedKeys
    ? jzodElement_extendedSchemas.filter(
        (e) => !skipAlreadyProducedKeys.has(forgeCarryOnReferenceName(miroirFundamentalJzodSchemaUuid, e, "extend", prefix))
      )
    : jzodElement_extendedSchemas;
  const _t0 = Date.now();
  const jzodElementLocalizedInnerResolutionStoreForExtendedSchemas =
    createLocalizedInnerResolutionStoreForExtendedSchemas(
      jzodElementDependenciesJzodReference,
      jzodElement_extendedSchemas,// effectiveExtendedSchemas, // filtered extendedSchemas
      transformerForBuildPlusRuntimeCarryOnSchemaReference,
      transformerForBuildPlusRuntimeForArrayCarryOnSchemaReference,
      "transformerType", // mlElementTemplateSchemaDiscriminator
      resolveReferencesWithCarryOn.bind(undefined, {
        [miroirFundamentalJzodSchemaUuid]: jzodElementDependenciesJzodReference,
      }),
      prefix, // prefix
      true, // alwaysPropagate
    );
  log.info(
    `  getJzodElementWithCarryOnContext extendedSchemas(${prefix}): ${jzodElement_extendedSchemas.length} total, ${effectiveExtendedSchemas.length} computed (${jzodElement_extendedSchemas.length - effectiveExtendedSchemas.length} skipped), took ${Date.now() - _t0}ms`,
  );
  const _t1 = Date.now();
  const jzodElementLocalizedInnerResolutionStorePlainReferences =
    createLocalizedInnerResolutionStoreWithCarryOn(
      jzodElementDependenciesJzodReference,
      // jzodElement_extendedSchemas, //effectiveExtendedSchemas, // filtered extendedSchemas
      transformerForBuildPlusRuntimeCarryOnSchemaReference,
      transformerForBuildPlusRuntimeForArrayCarryOnSchemaReference,
      "transformerType", // mlElementTemplateSchemaDiscriminator
      resolveReferencesWithCarryOn.bind(undefined, {
        [miroirFundamentalJzodSchemaUuid]: jzodElementDependenciesJzodReference,
      }),
      prefix, // prefix
      true, // alwaysPropagate
      // Skip coreTransformer* entries AND entries already covered by domainAction stores
      // (key: string, _defn: JzodElement) =>
      //   key.startsWith("coreTransformer") ||
      //   (skipAlreadyProducedKeys?.has(forgeCarryOnReferenceName(miroirFundamentalJzodSchemaUuid, key, undefined, prefix)) ?? false),
    );
  log.info(
    `  getJzodElementWithCarryOnContext plainRefs(${prefix}): ${Object.keys(jzodElementLocalizedInnerResolutionStorePlainReferences).length} computed, took ${Date.now() - _t1}ms`,
  );
  const jzodElementWithCarryOnContext = {
    ...jzodElementLocalizedInnerResolutionStoreForExtendedSchemas,
    ...jzodElementLocalizedInnerResolutionStorePlainReferences,
  };
  log.info(
    `########################################## getJzodElementWithCarryOnContext ${prefix} DONE: ${Object.keys(jzodElementWithCarryOnContext).length} entries, total took ${Date.now() - _tStart}ms`,
  );
  return jzodElementWithCarryOnContext;
};
  