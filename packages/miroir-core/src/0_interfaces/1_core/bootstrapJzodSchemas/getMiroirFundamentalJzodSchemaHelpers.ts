import { Chalk } from "chalk";


import { cleanLevel } from "../../../1_core/constants";
import {
  applyLimitedCarryOnSchemaOnLevel,
  forgeCarryOnReferenceName,
  JzodReferenceResolutionFunction
} from "../../../1_core/jzod/JzodToJzod";
import { MiroirLoggerFactory } from "../../../4_services/MiroirLoggerFactory";
import { packageName } from "../../../constants";
import { LoggerInterface } from "../../4-services/LoggerInterface";
import { JzodElement, JzodReference } from "../preprocessor-generated/miroirFundamentalType";

const customChalk = new Chalk({level: 1})

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
        deploymentUuid: { type: "uuid" },
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
        deploymentUuid: { type: "uuid" },
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
        deploymentUuid:{type:"uuid"},
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
        deploymentUuid:{type:"uuid"},
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
        deploymentUuid: { type: "uuid" },
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
        deploymentUuid: { type: "uuid" },
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
 * @param jzodSchema
 * @param absolutePath
 * @param force
 * @returns
 */
export function makeReferencesAbsolute(jzodSchema: any /** JzodElement */, absolutePath: string, force?: boolean): any /** JzodElement */ {
  // log.info("makeReferencesAbsolute called", JSON.stringify(jzodSchema), absolutePath, force);
  switch (jzodSchema.type) {
    case "schemaReference": {
      const convertedContext = Object.fromEntries(
        Object.entries(jzodSchema.context ?? {}).map((e: [string, any]) => {
          if (!e[1]) {
            throw new Error(
              "makeReferencesAbsolute schemaReference: context jzodSchema is undefined for " + e[0]
            );
            // throw new Error("makeReferencesAbsolute schemaReference: context jzodSchema is undefined for " + e[0] + " context " + JSON.stringify(Object.keys(jzodSchema.context)));
          }
          return [
            // Object.entries(jzodSchema.context ?? {}).map((e: [string, JzodElement]) => [
            e[0],
            makeReferencesAbsolute(e[1], absolutePath, force),
          ];
        })
      );

      const result =
        jzodSchema.definition.absolutePath && !force
          ? {
              ...jzodSchema,
              context: convertedContext,
            }
          : {
              ...jzodSchema,
              context: convertedContext,
              definition: {
                ...jzodSchema.definition,
                absolutePath,
              },
            };
      // log.info("makeReferencesAbsolute schemaReference received", JSON.stringify(jzodSchema));
      // log.info("makeReferencesAbsolute schemaReference returns", JSON.stringify(result));
      return result;
      break;
    }
    case "object": {
      const convertedExtend = jzodSchema.extend
        ? typeof jzodSchema.extend == "object" && !Array.isArray(jzodSchema.extend)
          ? makeReferencesAbsolute(jzodSchema.extend, absolutePath, force)
          : jzodSchema.extend.map((e: any) => makeReferencesAbsolute(e, absolutePath, force))
        : (undefined as any);
      const convertedDefinition = Object.fromEntries(
        Object.entries(jzodSchema.definition).map((e: [string, any]) => [
          // Object.entries(jzodSchema.definition).map((e: [string, JzodElement]) => [
          e[0],
          makeReferencesAbsolute(e[1], absolutePath, force),
        ])
      );
      return convertedExtend
        ? {
            ...jzodSchema,
            extend: convertedExtend,
            definition: convertedDefinition,
          }
        : {
            ...jzodSchema,
            definition: convertedDefinition,
          };
      break;
    }
    case "array":
    case "lazy":
    case "record":
    case "promise":
    case "set": {
      if (!jzodSchema.definition) {
        throw new Error(
          "makeReferencesAbsolute set: jzodSchema.definition is undefined " +
            JSON.stringify(jzodSchema)
        );
      }
      return {
        ...jzodSchema,
        definition: makeReferencesAbsolute(jzodSchema.definition, absolutePath, force) as any,
      };
      break;
    }
    case "map": {
      if (!jzodSchema.definition[0]) {
        throw new Error(
          "makeReferencesAbsolute map: jzodSchema.definition[0] is undefined " +
            JSON.stringify(jzodSchema)
        );
      }
      if (!jzodSchema.definition[1]) {
        throw new Error(
          "makeReferencesAbsolute map: jzodSchema.definition[0] is undefined " +
            JSON.stringify(jzodSchema)
        );
      }
      return {
        ...jzodSchema,
        definition: [
          makeReferencesAbsolute(jzodSchema.definition[0], absolutePath, force),
          makeReferencesAbsolute(jzodSchema.definition[1], absolutePath, force),
        ],
      };
    }
    case "function": {
      if (!jzodSchema.definition.returns) {
        throw new Error(
          "makeReferencesAbsolute: jzodSchema.definition is undefined " + JSON.stringify(jzodSchema)
        );
      }

      return {
        ...jzodSchema,
        definition: {
          args: jzodSchema.definition.args.map((e: any) =>
            makeReferencesAbsolute(e, absolutePath, force)
          ),
          returns: jzodSchema.definition.returns
            ? makeReferencesAbsolute(jzodSchema.definition.returns, absolutePath, force)
            : undefined,
        },
      };
      break;
    }
    case "intersection": {
      if (!jzodSchema.definition.left) {
        throw new Error(
          "makeReferencesAbsolute intersection: jzodSchema.definition.left is undefined " +
            JSON.stringify(jzodSchema)
        );
      }
      if (!jzodSchema.definition.right) {
        throw new Error(
          "makeReferencesAbsolute intersection: jzodSchema.definition.left is undefined " +
            JSON.stringify(jzodSchema)
        );
      }

      return {
        ...jzodSchema,
        definition: {
          left: makeReferencesAbsolute(jzodSchema.definition.left, absolutePath, force),
          right: makeReferencesAbsolute(jzodSchema.definition.right, absolutePath, force),
        },
      };
      break;
    }
    case "union":
    case "tuple": {
      return {
        ...jzodSchema,
        definition: jzodSchema.definition.map((e: any) =>
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
      return jzodSchema;
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
    // "entityAttributeUntypedCore",
    "extractorTemplateRoot",
    "extractorOrCombinerRoot",
    "transformer_inner_label",
    "transformer_orderBy",
    "transformerForBuild_Abstract",
    "transformerForBuild_optional_Abstract",
    // "transformerForRuntime_Abstract",
    // "transformerForRuntime_optional_Abstract",
    "transformerForBuildPlusRuntime_Abstract",
    "transformerForBuildPlusRuntime_optional_Abstract",
    "transformerForBuild_accessDynamicPath",
    // "transformerForRuntime_getFromContext",
    "transformerForBuildPlusRuntime_getFromContext",
    "transformerForBuild_getFromParameters",
    "transformerForBuildPlusRuntime_getFromParameters",
    "transformer_contextOrParameterReferenceTO_REMOVE",
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
  // pre-converts extended schemas to carryOnSchema, since extended schemas have "eager" references to the carryOnSchema
  // const localizedInnerResolutionStoreExtendedReferences: Record<string, JzodElement> =
export function createLocalizedInnerResolutionStoreForExtendedSchemas(
  // localizedResolutionStore: Record<string, JzodReference>,
  localizedResolutionStore: JzodReference,
  extendedSchemas: string[],
  carryOnSchemaReference: JzodReference,
  carryOnSchemaDiscriminator: undefined | string | string[] | (string | string[])[] = undefined,
  resolveReferencesWithCarryOn: JzodReferenceResolutionFunction,
  prefix: string = "mlElementTemplate_",
  alwaysPropagate: boolean = false,
): Record<string, any> {


  return Object.fromEntries(
    extendedSchemas.map((e) => {
      if (localizedResolutionStore.context === undefined) {
        throw new Error(
          `createLocalizedInnerResolutionStoreForExtendedSchemas: localizedResolutionStore.context is undefined`
        );
      }
      if (localizedResolutionStore.context[e] === undefined) {
        log.error(
          "createLocalizedInnerResolutionStoreForExtendedSchemas: localizedResolutionStore.context",
          JSON.stringify(Object.keys(localizedResolutionStore.context), null, 2)
        );
        throw new Error(
          `createLocalizedInnerResolutionStoreForExtendedSchemas: localizedResolutionStore.context["${e}"] is undefined`
        );
      }

      const appliedLimitedCarryOnResult = applyLimitedCarryOnSchemaOnLevel(
        localizedResolutionStore.context[e],
        carryOnSchemaReference,
        carryOnSchemaDiscriminator,
        alwaysPropagate,
        false, // applyOnFirstLevel is false, since the result will be an object that is used in an "extend" clause
        prefix, // carryOnPrefix
        undefined, // localReferencePrefix
        "extend", // suffixForReferences
        resolveReferencesWithCarryOn
      );
      // const convertedString = stringify(appliedLimitedCarryOnResult.resultSchema);
      // const baseString = stringify(localizedResolutionStore.context[e]);
      // const diffResult = Diff.diffLines(baseString, convertedString, { ignoreWhitespace: true });
      // // if (diffResult.length === 1 && diffResult[0].added === false && diffResult[0].removed === false) {
      // if (appliedLimitedCarryOnResult.hasBeenApplied) {
      //   log.info(
      //     "createLocalizedInnerResolutionStoreForExtendedSchemas: convertedSchema is different from localizedResolutionStore for",
      //     e,
      //   );
      // }
      return [
        forgeCarryOnReferenceName(miroirFundamentalJzodSchemaUuid, e, "extend", prefix),
        appliedLimitedCarryOnResult.resultSchema
        // TODO: there's a bug in the squash of inheritence, it does not recursively follow the schema references
        // appliedLimitedCarryOnResult.hasBeenApplied
        //   ? appliedLimitedCarryOnResult.resultSchema
        //   : {
        //       type: "schemaReference",
        //       definition: {
        //         absolutePath: miroirFundamentalJzodSchemaUuid,
        //         relativePath: e,
        //       },
        //     },
      ];})
  );
}


// ################################################################################################
export function createLocalizedInnerResolutionStoreWithCarryOn(
  // localizedResolutionStore: Record<string, any>,
  localizedResolutionStore: JzodReference,
  extendedSchemas: string[],
  carryOnSchemaReference: JzodReference,
  carryOnSchemaDiscriminator: undefined | string | string[] = undefined,
  resolveReferencesWithCarryOn: JzodReferenceResolutionFunction,
  prefix: string = "mlElementTemplate_",
  alwaysPropagate: boolean = true,
  skipContextEntry?: (name:string, defn: JzodElement) => boolean,
): Record<string, any> {
  log.info(
    "createLocalizedInnerResolutionStoreWithCarryOn: localizedResolutionStore.context",
    Object.keys(localizedResolutionStore.context ?? {}).length,
    JSON.stringify(Object.keys(localizedResolutionStore.context ?? {}), null, 2)
  );
  return Object.fromEntries(
      Object.entries(localizedResolutionStore.context ?? {}).map((f) => {
        log.info(
          customChalk.blue("createLocalizedInnerResolutionStoreWithCarryOn: localizedResolutionStore.context"),
          customChalk.green(f[0]),
          customChalk.yellow(f[1] && f[1].type),
          // customChalk.magenta(f[1] && f[1].definition && f[1].definition.relativePath)
          customChalk.magenta(f[1] && (f[1] as any).definition && (f[1] as any).definition?.relativePath)
        );
        const schemaWithCarryOn =
          skipContextEntry && skipContextEntry(f[0], f[1])
            ? {
                resultSchema: f[1],
                hasBeenApplied: false,
                resolvedReferences: undefined,
              }
            : applyLimitedCarryOnSchemaOnLevel(
                f[1] as any,
                carryOnSchemaReference as any,
                carryOnSchemaDiscriminator,
                alwaysPropagate, // alwaysPropagate
                true, // applyOnFirstLevel
                prefix, // carryOnPrefix
                undefined, //localReferencePrefix
                undefined, // suffixForReferences
                resolveReferencesWithCarryOn,
                {}, // convertedReferences
                [], // skipObjectAttributesOnFirstLevel
                skipContextEntry,
              );
        return [
          forgeCarryOnReferenceName(miroirFundamentalJzodSchemaUuid, f[0], undefined, prefix),
          // TODO: add inner references to environment!!!!
          schemaWithCarryOn.hasBeenApplied? schemaWithCarryOn.resultSchema : {
            type: "schemaReference",
            definition: {
              absolutePath: miroirFundamentalJzodSchemaUuid,
              relativePath: f[0],
            },
          }
        ]
      }
    )
    // )
  );
}

// ################################################################################################
/**
 * checks that entries in the domainActionDependencySet are present in the context of the carryOnSchemaReference
 * @param domainAction 
 * @param carryOnSchemaReference 
 * @param domainActionDependencySet 
 * @param prefix 
 * @param absoluteMiroirFundamentalJzodSchema 
 * @param extendedSchemas 
 * @returns 
 */
export function createDomainActionCarryOnSchemaResolver(
  domainAction: JzodElement,
  carryOnSchemaReference: JzodReference,
  carryOnSchemaDiscriminator: undefined | string | string[] = undefined,
  domainActionDependencySet: Set<string>,
  prefix: string,
  alwaysPropagate: boolean,
  absoluteMiroirFundamentalJzodSchema: any, /** miroirFundamentalJzodSchema with absolute references */
  extendedSchemas: string[],
) {
  if (absoluteMiroirFundamentalJzodSchema.definition.context == undefined) {
    throw new Error(
      `Key context not found in miroirFundamentalJzodSchema.context, existing keys are: ${Object.keys(
        absoluteMiroirFundamentalJzodSchema.definition
      )}`
    );
  }

  // checks that entries in the domainActionDependencySet are present in the context of the carryOnSchemaReference
  const carryOnDomainActionDependenciesJzodReference: JzodReference = {
    type: "schemaReference",
    context: Object.fromEntries(
      Array.from(domainActionDependencySet.keys()).map((key) => {
        if (!absoluteMiroirFundamentalJzodSchema.definition.context[key]) {
          throw new Error(
            `Key ${key} not found in miroirFundamentalJzodSchema.context when building domainActionDependenciesInnerResolutionStore, existing keys are: ${Object.keys(
              absoluteMiroirFundamentalJzodSchema.definition.context
            )}`
          );
        }
        return [key, (absoluteMiroirFundamentalJzodSchema.definition as any).context[key]];
      })
    ),
    definition: {
      relativePath: "jzodElement",
    },
    // },
  };

  // convert extendedSchemas to carryOn-bearing schemas
  const carryOnDomainActionLocalizedInnerResolutionStoreForExtendedSchemas = createLocalizedInnerResolutionStoreForExtendedSchemas(
    carryOnDomainActionDependenciesJzodReference,
    extendedSchemas,
    carryOnSchemaReference,
    carryOnSchemaDiscriminator,
    resolveReferencesWithCarryOn.bind(
      undefined,
      {
        [miroirFundamentalJzodSchemaUuid]: carryOnDomainActionDependenciesJzodReference
      }
    ),
    prefix,
    alwaysPropagate // alwaysPropagate
  );

  // log.info(
  //   "runtimeDomainActionLocalizedInnerResolutionStoreForExtendedSchemas",
  //   Object.keys(carryOnDomainActionLocalizedInnerResolutionStoreForExtendedSchemas).length,
  //   // JSON.stringify(runtimeDomainActionLocalizedInnerResolutionStoreForExtendedSchemas, null, 2),
  //   JSON.stringify(Object.keys(carryOnDomainActionLocalizedInnerResolutionStoreForExtendedSchemas), null, 2)
  // );

  // convert plain references found in domainAction to carryOn-bearing schemas
  const domainActionLocalizedInnerResolutionStorePlainReferences = createLocalizedInnerResolutionStoreWithCarryOn(
    carryOnDomainActionDependenciesJzodReference,
    extendedSchemas,
    carryOnSchemaReference,
    carryOnSchemaDiscriminator,
    resolveReferencesWithCarryOn.bind(undefined, {
      [miroirFundamentalJzodSchemaUuid]: carryOnDomainActionDependenciesJzodReference,
    }),
    prefix,
    alwaysPropagate
  );

  // log.info(
  //   "domainActionLocalizedInnerResolutionStorePlainReferences",
  //   Object.keys(domainActionLocalizedInnerResolutionStorePlainReferences).length,
  //   JSON.stringify(Object.keys(domainActionLocalizedInnerResolutionStorePlainReferences), null, 2)
  // );

  const carryOnDomainActionSchemaBuilder = applyLimitedCarryOnSchemaOnLevel(
    domainAction,
    {
      type: "schemaReference",
      definition: {
        relativePath: forgeCarryOnReferenceName(
          miroirFundamentalJzodSchemaUuid,
          "transformerForBuildPlusRuntime"
        ),
      },
    },
    // ["transformerType", "interpolation"], // carryOnSchemaDiscriminator
    carryOnSchemaDiscriminator,
    alwaysPropagate,// false, // alwaysPropagate
    false, // applyOnFirstLevel
    prefix, // carryOnPrefix,
    undefined, // reference prefix
    undefined, // reference suffix
    resolveReferencesWithCarryOn.bind(undefined, {
      [miroirFundamentalJzodSchemaUuid]: carryOnDomainActionDependenciesJzodReference,
    })
  );
  return {
    carryOnDomainActionLocalizedInnerResolutionStoreForExtendedSchemas,
    domainActionLocalizedInnerResolutionStorePlainReferences,
    carryOnDomainActionSchemaBuilder,
  };
  // return runtimeDomainActionSchemaBuilder;
}
