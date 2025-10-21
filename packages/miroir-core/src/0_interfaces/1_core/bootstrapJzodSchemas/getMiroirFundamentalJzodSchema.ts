// import stringify from "fast-json-stable-stringify";
// import equal from "fast-deep-equal";
// import * as Diff from "diff";
// import * as Colors from "colors";

// import {
//   JzodReferenceResolutionFunction,
// } from "@miroir-framework/jzod";
// import { JzodElement, JzodReference } from "@miroir-fr>amework/jzod-ts";
import { Chalk } from "chalk";
import { cleanLevel } from "../../../1_core/constants";
import { jzodTransitiveDependencySet } from "../../../1_core/jzod/JzodSchemaReferences";
import {
  applyLimitedCarryOnSchema,
  applyLimitedCarryOnSchemaOnLevel,
  forgeCarryOnReferenceName,
  JzodReferenceResolutionFunction,
} from "../../../1_core/jzod/JzodToJzod";
import {
  miroirTransformersForBuild,
  miroirTransformersForBuildPlusRuntime,
  miroirTransformersForRuntime,
  mlsTransformers,
  transformerForBuildNames,
  transformerForBuildPlusRuntimeNames,
  transformerForRuntimeNames
} from "../../../2_domain/Transformers";
import { MiroirLoggerFactory } from "../../../4_services/MiroirLoggerFactory";
import { packageName } from "../../../constants";
import { LoggerInterface } from "../../4-services/LoggerInterface";
import { testSuitesResults } from "../../4-services/TestInterface";
import { zodParseErrorJzodSchema, zodParseErrorIssueJzodSchema } from "../zodParseError";
import { JzodElement, JzodReference } from "../preprocessor-generated/miroirFundamentalType";
import { keyMapEntry, resolvedJzodSchemaReturnType, resolvedJzodSchemaReturnTypeError, resolvedJzodSchemaReturnTypeOK } from "../jzodTypeCheckInterface";
import { jzodUnion_RecursivelyUnfold_ReturnType, jzodUnion_RecursivelyUnfold_ReturnTypeError, jzodUnion_RecursivelyUnfold_ReturnTypeOK } from "../jzodUnion_RecursivelyUnfoldInterface";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "getMiroirFundamentalJzodSchema")
).then((logger: LoggerInterface) => {
  log = logger;
});
const customChalk = new Chalk({level: 1})

export const miroirFundamentalJzodSchemaUuid = "fe9b7d99-f216-44de-bb6e-60e1a1ebb739";

const testCompositeActionParams: JzodElement = {
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
    {
      type: "object",
      definition: {
        testActionType: { type: "literal", definition: "testRuntimeCompositeActionSuite" },
        testActionLabel: { type: "string" },
        deploymentUuid: { type: "uuid" },
        testCompositeAction: {
          type: "schemaReference",
          definition: {
            relativePath: "testRuntimeCompositeActionSuite",
          }
        },
      },
    },
    {
      type: "object",
      definition: {
        testActionType: { type: "literal", definition: "testRuntimeCompositeAction" },
        testActionLabel: { type: "string" },
        deploymentUuid: { type: "uuid" },
        testCompositeAction: {
          type: "schemaReference",
          definition: {
            relativePath: "testRuntimeCompositeAction",
          }
        },
      },
    },
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
  // log.info("makeReferencesAbsolute received", JSON.stringify(jzodSchema), absolutePath, force);
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
    case "enum":
    case "literal":
    default: {
      return jzodSchema;
      break;
    }
  }
}

// ################################################################################################
export function getExtendedSchemas(jzodSchemajzodMiroirBootstrapSchema: any) {
  const result = [
    ...Object.keys(jzodSchemajzodMiroirBootstrapSchema.definition.context),
    "applicationSection",
    "shippingBox",
    // "entityAttributeUntypedCore",
    "extractorTemplateRoot",
    "extractorOrCombinerRoot",
    "transformer_inner_label",
    "transformer_orderBy",
    "transformerForBuild_Abstract",
    "transformerForBuild_optional_Abstract",
    "transformerForRuntime_Abstract",
    "transformerForRuntime_optional_Abstract",
    "transformerForBuildPlusRuntime_optional_Abstract",
    "transformerForBuild_objectDynamicAccess",
    "transformerForRuntime_contextReference",
    "transformerForBuild_parameterReference",
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
  const result = getExtendedSchemas(jzodSchemajzodMiroirBootstrapSchema).map(
    (relativePath: string) => forgeCarryOnReferenceName(absolutePath, relativePath, "extend", prefix)
  );
  // log.info("getExtendedSchemasWithCarryOn result", JSON.stringify(result, null, 2));
  return result;
}
// ################################################################################################
  // const resolveReferencesWithCarryOn: JzodReferenceResolutionFunction = ((
function resolveReferencesWithCarryOn(
  localizedResolutionStore: Record<string, any>,
  ref: any
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
function createLocalizedInnerResolutionStoreForExtendedSchemas(
  // localizedResolutionStore: Record<string, JzodReference>,
  localizedResolutionStore: JzodReference,
  extendedSchemas: string[],
  carryOnSchemaReference: JzodReference,
  carryOnSchemaDiscriminator: undefined | string | string[] = undefined,
  resolveReferencesWithCarryOn: JzodReferenceResolutionFunction,
  prefix: string = "carryOn_",
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
function createLocalizedInnerResolutionStoreWithCarryOn(
  // localizedResolutionStore: Record<string, any>,
  localizedResolutionStore: JzodReference,
  extendedSchemas: string[],
  carryOnSchemaReference: JzodReference,
  carryOnSchemaDiscriminator: undefined | string | string[] = undefined,
  resolveReferencesWithCarryOn: JzodReferenceResolutionFunction,
  prefix: string = "carryOn_",
  alwaysPropagate: boolean = true,
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
        const schemaWithCarryOn = applyLimitedCarryOnSchemaOnLevel(
          f[1] as any,
          carryOnSchemaReference as any,
          carryOnSchemaDiscriminator,
          alwaysPropagate, // alwaysPropagate
          true, // applyOnFirstLevel
          prefix, // carryOnPrefix
          undefined, //localReferencePrefix
          undefined, // suffixForReferences
          resolveReferencesWithCarryOn
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
function createDomainActionCarryOnSchemaResolver(
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
          "transformerForRuntime"
        ),
      },
    },
    // ["transformerType", "interpolation"], // carryOnSchemaDiscriminator
    carryOnSchemaDiscriminator,
    false, // alwaysPropagate
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


// ################################################################################################
export function getMiroirFundamentalJzodSchema(
  entityDefinitionBundleV1: any,
  entityDefinitionCommit: any,
  modelEndpointVersionV1: any,
  storeManagementEndpoint: any,
  instanceEndpointVersionV1: any,
  undoRedoEndpointVersionV1: any,
  localCacheEndpointVersionV1: any,
  domainEndpointVersionV1: any,
  queryEndpointVersionV1: any,
  persistenceEndpointVersionV1: any,
  testEndpointVersionV1: any,
  jzodSchemajzodMiroirBootstrapSchema: any,
  transformerJzodSchema: any,
  miroirTransformersJzodSchemas: any[], // TransformerDefinition[] NOT USED
  entityDefinitionAdminApplication: any,
  entityDefinitionSelfApplicationV1: any,
  entityDefinitionSelfApplicationVersionV1: any,
  entityDefinitionDeployment: any,
  entityDefinitionEntity: any,
  entityDefinitionEntityDefinitionV1: any,
  entityDefinitionJzodSchemaV1: any,
  entityDefinitionMenu: any,
  entityDefinitionQueryVersionV1: any,
  entityDefinitionReportV1: any,
  // entityDefinitionSelfApplication: any,
  entityDefinitionSelfApplicationDeploymentConfiguration: any,
  entityDefinitionTest: any,
  entityDefinitionTransformerTest: any,
  entityDefinitionTransformerDefinition: any,
  entityDefinitionEndpointDefinition: any,
// ): JzodReference {
  // ): any /** JzodReference, avoiding reference to ensure proper compilation */ {
  ): any /** JzodSchema, avoiding reference to ensure proper compilation */ {
  // TODO: not really a JzodReference!!
  log.info("getMiroirFundamentalJzodSchema called!");
  // log.info(
  //   "graphConfig: (entityDefinitionReportV1 as any).jzodSchema.definition.definition.context.graphReportSection.definition.definition.definition.config",
  //   JSON.stringify((entityDefinitionReportV1 as any).jzodSchema.definition.definition.context.graphReportSection.definition.definition.definition.config??{},null,2)
  //   // JSON.stringify(entityDefinitionJzodSchemaV1.jzodSchema.definition.definition.context.miroirTransformersForBuild ?? {}, null, 2)
  // );
  // log.info(
  //   "getMiroirFundamentalJzodSchema entityDefinitionTransformerTest.jzodSchema.definition.definition.context",
  //   entityDefinitionTransformerTest.jzodSchema.definition.definition.context
  // );
  const entityDefinitionQueryVersionV1WithAbsoluteReferences = makeReferencesAbsolute(
    entityDefinitionQueryVersionV1.jzodSchema.definition.definition,
    miroirFundamentalJzodSchemaUuid
  ) as any;


  log.info(
    "getMiroirFundamentalJzodSchema entityDefinitionQueryVersionV1WithAbsoluteReferences",
    Object.keys(entityDefinitionQueryVersionV1WithAbsoluteReferences.context ?? {}).length,
    JSON.stringify(entityDefinitionQueryVersionV1WithAbsoluteReferences.context.combinerForObjectByRelation ?? {}, null, 2)
  );
  // log.info("getMiroirFundamentalJzodSchema miroirTransformersJzodSchemas", JSON.stringify(miroirTransformersJzodSchemas.map(e=>e.name)), null, 2);
  // log.info("getMiroirFundamentalJzodSchema miroirTransformersForBuild", JSON.stringify(Object.keys(miroirTransformersForBuild), null, 2));
  // log.info("getMiroirFundamentalJzodSchema transformerForBuildNames", JSON.stringify(transformerForBuildNames, null, 2));
  const miroirFundamentalJzodSchema: any = {
    // const miroirFundamentalJzodSchema: JzodSchema = {
    uuid: miroirFundamentalJzodSchemaUuid,
    parentName: "JzodSchema",
    parentUuid: "5e81e1b9-38be-487c-b3e5-53796c57fccf",
    name: "miroirFundamentalJzodSchema",
    defaultLabel:
      "The Jzod Schema of fundamental Miroir Datatypes. Those are fundamental Jzod schemas that are needed before further Jzod Schemas can be loaded from the datastore.",
    definition: {
      type: "schemaReference",
      context: {
        // ...(jzodSchemajzodMiroirBootstrapSchema as any).definition.context,
        ...// ) as JzodReference
        (
          makeReferencesAbsolute(
            // jzodSchemajzodMiroirBootstrapSchema.definition as JzodElement,
            jzodSchemajzodMiroirBootstrapSchema.definition as any,
            miroirFundamentalJzodSchemaUuid,
            true
          ) as any
        ).context,
        // miroirIcon: entityDefinitionEntityDefinitionV1.jzodSchema.definition.icon,
        miroirIcon: {
          type: "union",
          discriminator: "iconType",
          tag: {
            value: {
              id: 11,
              defaultLabel: "Icon used to represent instances of this Entity",
              editable: true,
            },
          },
          definition: [
            {
              type: "string",
            },
            {
              type: "object",
              definition: {
                iconType: {
                  type: "literal",
                  definition: "emoji",
                  tag: {
                    value: {
                      defaultLabel: "Icon Type",
                      editable: false,
                    },
                  },
                },
                name: {
                  type: "string",
                  tag: {
                    value: {
                      defaultLabel: "Icon Name",
                      editable: true,
                    },
                  },
                },
              },
            },
            {
              type: "object",
              definition: {
                iconType: {
                  type: "literal",
                  definition: "mui",
                  tag: {
                    value: {
                      defaultLabel: "Icon Type",
                      editable: false,
                    },
                  },
                },
                name: {
                  type: "string",
                  tag: {
                    value: {
                      defaultLabel: "Icon Name",
                      editable: true,
                    },
                  },
                },
              },
            },
          ],
        },
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        ______________________________________________transformers_____________________________________________:
          {
            type: "never",
          },
        // ...(transformerJzodSchema as any).definition.context, // gives "transformerForBuild_InnerReference", "transformerForBuild", "actionHandler"
        // TODO: remove parameter transformerJzodSchema, there is no direct correspondance from transformer definition to type of input
        ...makeReferencesAbsolute(
          (transformerJzodSchema as any).definition,
          miroirFundamentalJzodSchemaUuid,
          true
        ).context, // gives "transformerForBuild_InnerReference", "transformerForBuild", "actionHandler"
        // jzodTypeCheck
        jzodUnion_RecursivelyUnfold_ReturnTypeOK: jzodUnion_RecursivelyUnfold_ReturnTypeOK,
        jzodUnion_RecursivelyUnfold_ReturnTypeError: jzodUnion_RecursivelyUnfold_ReturnTypeError,
        jzodUnion_RecursivelyUnfold_ReturnType: jzodUnion_RecursivelyUnfold_ReturnType,
        keyMapEntry: keyMapEntry,
        resolvedJzodSchemaReturnTypeOK: resolvedJzodSchemaReturnTypeOK,
        resolvedJzodSchemaReturnTypeError: resolvedJzodSchemaReturnTypeError,
        resolvedJzodSchemaReturnType: resolvedJzodSchemaReturnType,
        // ########################################################################################
        ...Object.fromEntries(
          miroirTransformersJzodSchemas.map((e: any) => [
            e.name,
            { type: "object", definition: e.transformerInterface.transformerParameterSchema },
          ])
        ),
        // ########################################################################################
        ...makeReferencesAbsolute(
          zodParseErrorJzodSchema as any,
          miroirFundamentalJzodSchemaUuid,
          true
        ).context, // gives "transformerForBuild_InnerReference", "transformerForBuild", "actionHandler"
        // zodParseErrorIssue: zodParseError.context.zodParseErrorIssue as any,
        // zodParseError: zodParseError.context.zodParseError as any,
        // ########################################################################################
        transformerForBuild_menu_addItem: miroirTransformersForBuild.transformer_menu_addItem,
        //
        transformerForBuild_conditional: miroirTransformersForBuild.transformer_conditional,
        transformerForBuild_constant: miroirTransformersForBuild.transformer_constant,
        transformerForBuild_constantBoolean: miroirTransformersForBuild.transformer_constantBoolean,
        transformerForBuild_constantBigint: miroirTransformersForBuild.transformer_constantBigint,
        transformerForBuild_constantUuid: miroirTransformersForBuild.transformer_constantUuid,
        transformerForBuild_constantObject: miroirTransformersForBuild.transformer_constantObject,
        transformerForBuild_constantNumber: miroirTransformersForBuild.transformer_constantNumber,
        transformerForBuild_constantString: miroirTransformersForBuild.transformer_constantString,
        transformerForBuild_constantArray: miroirTransformersForBuild.transformer_constantArray,
        transformerForBuild_constantAsExtractor:
          miroirTransformersForBuild.transformer_constantAsExtractor,
        transformerForBuild_contextReference:
          miroirTransformersForBuild.transformer_contextReference,
        transformerForBuild_count: miroirTransformersForBuild.transformer_count,
        transformerForBuild_dataflowObject: miroirTransformersForBuild.transformer_dataflowObject,
        transformerForBuild_mapperListToList:
          miroirTransformersForBuild.transformer_mapperListToList,
        transformerForBuild_freeObjectTemplate:
          miroirTransformersForBuild.transformer_freeObjectTemplate,
        transformerForBuild_newUuid: miroirTransformersForBuild.transformer_newUuid,
        transformerForBuild_mustacheStringTemplate:
          miroirTransformersForBuild.transformer_mustacheStringTemplate,
        transformerForBuild_objectAlter: miroirTransformersForBuild.transformer_objectAlter,
        transformerForBuild_objectDynamicAccess:
          miroirTransformersForBuild.transformer_objectDynamicAccess,
        transformerForBuild_objectEntries: miroirTransformersForBuild.transformer_objectEntries,
        transformerForBuild_objectValues: miroirTransformersForBuild.transformer_objectValues,
        transformerForBuild_listPickElement: miroirTransformersForBuild.transformer_listPickElement,
        transformerForBuild_listReducerToIndexObject:
          miroirTransformersForBuild.transformer_listReducerToIndexObject,
        transformerForBuild_listReducerToSpreadObject:
          miroirTransformersForBuild.transformer_listReducerToSpreadObject,
        transformerForBuild_object_fullTemplate:
          miroirTransformersForBuild.transformer_object_fullTemplate,
        transformerForBuild_parameterReference:
          miroirTransformersForBuild.transformer_parameterReference,
        transformerForBuild_unique: miroirTransformersForBuild.transformer_unique,
        // MLS
        ...Object.fromEntries(
          Object.entries(mlsTransformers).map(([key, value]) => [
            key.replace("transformer_", "transformerForBuild_"),
            miroirTransformersForBuild[key as keyof typeof miroirTransformersForBuild],
          ])
        ),
        //
        transformerForBuild: {
          type: "union",
          discriminator: ["transformerType", "interpolation"],
          // discriminator: "transformerType",
          optInDiscriminator: true,
          definition: [
            ...transformerForBuildNames.map((e: any) => ({
              type: "schemaReference",
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: e,
              },
            })),
            {
              type: "schemaReference",
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "transformerForBuild_InnerReference",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "transformerForBuild_dataflowSequence",
              },
            },
          ],
        },
        // ########################################################################################
        transformerForRuntime_menu_addItem: miroirTransformersForRuntime.transformer_menu_addItem,
        //
        //
        transformerForRuntime_conditional: miroirTransformersForRuntime.transformer_conditional,
        transformerForRuntime_constant: miroirTransformersForRuntime.transformer_constant,
        transformerForRuntime_constantArray: miroirTransformersForRuntime.transformer_constantArray,
        transformerForRuntime_constantBoolean:
          miroirTransformersForRuntime.transformer_constantBoolean,
        transformerForRuntime_constantBigint:
          miroirTransformersForRuntime.transformer_constantBigint,
        transformerForRuntime_constantNumber:
          miroirTransformersForRuntime.transformer_constantNumber,
        transformerForRuntime_constantObject:
          miroirTransformersForRuntime.transformer_constantObject,
        transformerForRuntime_constantString:
          miroirTransformersForRuntime.transformer_constantString,
        transformerForRuntime_constantUuid: miroirTransformersForRuntime.transformer_constantUuid,
        transformerForRuntime_constantAsExtractor:
          miroirTransformersForRuntime.transformer_constantAsExtractor,
        transformerForRuntime_contextReference:
          miroirTransformersForRuntime.transformer_contextReference,
        transformerForRuntime_count: miroirTransformersForRuntime.transformer_count,
        transformerForRuntime_dataflowObject:
          miroirTransformersForRuntime.transformer_dataflowObject,
        transformerForRuntime_freeObjectTemplate:
          miroirTransformersForRuntime.transformer_freeObjectTemplate,
        transformerForRuntime_mapperListToList:
          miroirTransformersForRuntime.transformer_mapperListToList,
        transformerForRuntime_listPickElement:
          miroirTransformersForRuntime.transformer_listPickElement,
        transformerForRuntime_newUuid: miroirTransformersForRuntime.transformer_newUuid,
        transformerForRuntime_mustacheStringTemplate:
          miroirTransformersForRuntime.transformer_mustacheStringTemplate,
        transformerForRuntime_listReducerToIndexObject:
          miroirTransformersForRuntime.transformer_listReducerToIndexObject,
        transformerForRuntime_listReducerToSpreadObject:
          miroirTransformersForRuntime.transformer_listReducerToSpreadObject,
        transformerForRuntime_objectAlter: miroirTransformersForRuntime.transformer_objectAlter,
        transformerForRuntime_objectDynamicAccess:
          miroirTransformersForRuntime.transformer_objectDynamicAccess,
        transformerForRuntime_objectEntries: miroirTransformersForRuntime.transformer_objectEntries,
        transformerForRuntime_objectValues: miroirTransformersForRuntime.transformer_objectValues,
        transformerForRuntime_object_fullTemplate:
          miroirTransformersForRuntime.transformer_object_fullTemplate,
        transformerForRuntime_unique: miroirTransformersForRuntime.transformer_unique,
        // MLS
        ...Object.fromEntries(
          Object.entries(mlsTransformers).map(([key, value]) => [
            key.replace("transformer_", "transformerForRuntime_"),
            miroirTransformersForBuild[key as keyof typeof miroirTransformersForRuntime],
          ])
        ),
        // extendedTransformerForRuntime: {
        //   type: "schemaReference",
        //   definition: {
        //     absolutePath: miroirFundamentalJzodSchemaUuid,
        //     relativePath: "transformerForRuntime",
        //   },
        // },
        transformerForRuntime: {
          type: "union",
          optInDiscriminator: true,
          // discriminator: ["transformerType", "interpolation"],
          discriminator: "transformerType",
          definition: [
            ...transformerForRuntimeNames.map((e: any) => ({
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: e,
              },
            })),
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "transformerForRuntime_InnerReference",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "transformerForRuntime_dataflowSequence",
              },
            },
          ],
        },
        extendedTransformerForRuntime: {
          type: "union",
          discriminator: "transformerType",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "transformerForRuntime",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "transformerForRuntime_menu_addItem",
              },
            },
          ],
        },
        // ########################################################################################
        // WRONG!!!!
        transformerForBuildPlusRuntime_menu_addItem:
          miroirTransformersForBuildPlusRuntime.transformer_menu_addItem,
        //
        transformerForBuildPlusRuntime_conditional:
          miroirTransformersForBuildPlusRuntime.transformer_conditional,
        transformerForBuildPlusRuntime_constant:
          miroirTransformersForBuildPlusRuntime.transformer_constant,
        transformerForBuildPlusRuntime_constantArray:
          miroirTransformersForBuildPlusRuntime.transformer_constantArray,
        transformerForBuildPlusRuntime_constantBoolean:
          miroirTransformersForBuildPlusRuntime.transformer_constantBoolean,
        transformerForBuildPlusRuntime_constantBigint:
          miroirTransformersForBuildPlusRuntime.transformer_constantBigint,
        transformerForBuildPlusRuntime_constantNumber:
          miroirTransformersForBuildPlusRuntime.transformer_constantNumber,
        transformerForBuildPlusRuntime_constantObject:
          miroirTransformersForBuildPlusRuntime.transformer_constantObject,
        transformerForBuildPlusRuntime_constantString:
          miroirTransformersForBuildPlusRuntime.transformer_constantString,
        transformerForBuildPlusRuntime_constantUuid:
          miroirTransformersForBuildPlusRuntime.transformer_constantUuid,
        transformerForBuildPlusRuntime_constantAsExtractor:
          miroirTransformersForBuildPlusRuntime.transformer_constantAsExtractor,
        transformerForBuildPlusRuntime_contextReference:
          miroirTransformersForBuildPlusRuntime.transformer_contextReference,
        transformerForBuildPlusRuntime_count:
          miroirTransformersForBuildPlusRuntime.transformer_count,
        transformerForBuildPlusRuntime_dataflowObject:
          miroirTransformersForBuildPlusRuntime.transformer_dataflowObject,
        transformerForBuildPlusRuntime_freeObjectTemplate:
          miroirTransformersForBuildPlusRuntime.transformer_freeObjectTemplate,
        transformerForBuildPlusRuntime_mapperListToList:
          miroirTransformersForBuildPlusRuntime.transformer_mapperListToList,
        transformerForBuildPlusRuntime_parameterReference:
          miroirTransformersForBuildPlusRuntime.transformer_parameterReference,
        transformerForBuildPlusRuntime_listPickElement:
          miroirTransformersForBuildPlusRuntime.transformer_listPickElement,
        transformerForBuildPlusRuntime_newUuid:
          miroirTransformersForBuildPlusRuntime.transformer_newUuid,
        transformerForBuildPlusRuntime_mustacheStringTemplate:
          miroirTransformersForBuildPlusRuntime.transformer_mustacheStringTemplate,
        transformerForBuildPlusRuntime_listReducerToIndexObject:
          miroirTransformersForBuildPlusRuntime.transformer_listReducerToIndexObject,
        transformerForBuildPlusRuntime_listReducerToSpreadObject:
          miroirTransformersForBuildPlusRuntime.transformer_listReducerToSpreadObject,
        transformerForBuildPlusRuntime_objectAlter:
          miroirTransformersForBuildPlusRuntime.transformer_objectAlter,
        transformerForBuildPlusRuntime_objectDynamicAccess:
          miroirTransformersForBuildPlusRuntime.transformer_objectDynamicAccess,
        transformerForBuildPlusRuntime_objectEntries:
          miroirTransformersForBuildPlusRuntime.transformer_objectEntries,
        transformerForBuildPlusRuntime_objectValues:
          miroirTransformersForBuildPlusRuntime.transformer_objectValues,
        transformerForBuildPlusRuntime_object_fullTemplate:
          miroirTransformersForBuildPlusRuntime.transformer_object_fullTemplate,
        transformerForBuildPlusRuntime_unique:
          miroirTransformersForBuildPlusRuntime.transformer_unique,
        // MLS
        ...Object.fromEntries(
          Object.entries(mlsTransformers).map(([key, value]) => [
            key.replace("transformer_", "transformerForBuildPlusRuntime_"),
            miroirTransformersForBuildPlusRuntime[
              key as keyof typeof miroirTransformersForBuildPlusRuntime
            ],
          ])
        ),
        transformerForBuildPlusRuntime: {
          type: "union",
          optInDiscriminator: true,
          discriminator: ["transformerType", "interpolation"],
          definition: [
            // {
            //   type: "schemaReference",
            //   definition: {
            //     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            //     relativePath: "transformerForBuild",
            //   },
            // },
            // {
            //   type: "schemaReference",
            //   definition: {
            //     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            //     relativePath: "transformerForRuntime",
            //   },
            // },
            ...transformerForBuildPlusRuntimeNames.map((e: any) => ({
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: e,
              },
            })),
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "transformerForBuildPlusRuntime_InnerReference",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "transformerForBuildPlusRuntime_dataflowSequence",
              },
            },
          ],
        },
        ...entityDefinitionTransformerDefinition.jzodSchema.definition.transformerInterface
          .definition.inputOutput.context,
        // inputOutputObject: entityDefinitionTransformerDefinition.jzodSchema.definition.transformerInterface.definition.inputOutput as any,
        transformerDefinition: entityDefinitionTransformerDefinition.jzodSchema as any,
        ______________________________________________miroirMetaModel_____________________________________________:
          {
            type: "never",
          },
        entityAttributeExpandedType: {
          type: "enum",
          definition: ["UUID", "STRING", "BOOLEAN", "OBJECT"],
        },
        entityAttributeType: {
          type: "union",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "entityInstance",
              },
            },
            {
              type: "enum",
              definition: ["ENTITY_INSTANCE_UUID", "ARRAY"],
            },
          ],
        },
        entityAttributeUntypedCore: {
          type: "object",
          definition: {
            id: { type: "number" },
            name: { type: "string" },
            defaultLabel: { type: "string" },
            description: { type: "string", optional: true },
            editable: { type: "boolean" },
            nullable: { type: "boolean" },
          },
        },
        entityAttributeCore: {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: miroirFundamentalJzodSchemaUuid,
              relativePath: "entityAttributeUntypedCore",
            },
          },
          definition: {
            type: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "entityAttributeExpandedType",
              },
            },
          },
        },
        entityArrayAttribute: {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: miroirFundamentalJzodSchemaUuid,
              relativePath: "entityAttributeUntypedCore",
            },
          },
          definition: {
            type: {
              type: "literal",
              definition: "ARRAY",
            },
            lineFormat: {
              type: "array",
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: miroirFundamentalJzodSchemaUuid,
                  relativePath: "entityAttributeCore",
                },
              },
            },
          },
        },
        entityForeignKeyAttribute: {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: miroirFundamentalJzodSchemaUuid,
              relativePath: "entityAttributeUntypedCore",
            },
          },
          definition: {
            type: {
              type: "literal",
              definition: "ENTITY_INSTANCE_UUID",
            },
            applicationSection: {
              type: "schemaReference",
              optional: true,
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "applicationSection",
              },
            },
            entityUuid: {
              type: "uuid",
              tag: { value: { id: 1, defaultLabel: "Entity Uuid", editable: false } },
            },
          },
        },
        entityAttribute: {
          type: "union",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "entityForeignKeyAttribute",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "entityArrayAttribute",
              },
            },
          ],
        },
        entityAttributePartial: {
          type: "schemaReference",
          definition: {
            eager: true,
            partial: true,
            absolutePath: miroirFundamentalJzodSchemaUuid,
            relativePath: "jzodElement",
          },
        },
        applicationSection: {
          type: "enum",
          tag: {
            value: {
              defaultLabel: "Application Section",
              initializeTo: { initializeToType: "value", value: "data" },
            },
          },
          definition: ["model", "data"],
        },
        dataStoreApplicationType: {
          type: "enum",
          tag: {
            value: {
              defaultLabel: "DataStore Appication Type",
              initializeTo: { initializeToType: "value", value: "app" },
            },
          },
          definition: ["miroir", "app"],
        },
        storeBasedConfiguration: {
          type: "object",
          definition: {
            uuid: {
              type: "uuid",
              tag: { value: { id: 1, defaultLabel: "Uuid", editable: false } },
            },
            parentName: {
              type: "string",
              optional: true,
              tag: { value: { id: 2, defaultLabel: "Entity Name", editable: false } },
            },
            parentUuid: {
              type: "uuid",
              tag: { value: { id: 3, defaultLabel: "Entity Uuid", editable: false } },
            },
            conceptLevel: {
              type: "enum",
              definition: ["MetaModel", "Model", "Data"],
              optional: true,
              tag: { value: { id: 4, defaultLabel: "Concept Level", editable: false } },
            },
            defaultLabel: {
              type: "uuid",
              tag: { value: { id: 3, defaultLabel: "Entity Uuid", editable: false } },
            },
            definition: {
              type: "object",
              definition: {
                currentApplicationVersion: {
                  type: "uuid",
                  tag: {
                    value: {
                      id: 1,
                      defaultLabel: "Current SelfApplication Version",
                      editable: false,
                    },
                  },
                },
              },
            },
          },
        },
        entityInstance: {
          type: "object",
          nonStrict: true,
          definition: {
            uuid: {
              type: "uuid",
              tag: { value: { id: 1, defaultLabel: "Uuid", editable: false, canBeTemplate: true } },
            },
            parentName: {
              type: "string",
              optional: true,
              tag: {
                value: { id: 2, defaultLabel: "Entity Name", editable: false, canBeTemplate: true },
              },
            },
            parentUuid: {
              type: "uuid",
              tag: {
                value: { id: 3, defaultLabel: "Entity Uuid", editable: false, canBeTemplate: true },
              },
            },
            conceptLevel: {
              type: "enum",
              definition: ["MetaModel", "Model", "Data"],
              optional: true,
              tag: {
                value: {
                  id: 4,
                  defaultLabel: "Concept Level",
                  editable: false,
                  canBeTemplate: true,
                },
              },
            },
          },
        },
        entityInstanceCollection: {
          type: "object",
          definition: {
            parentName: {
              type: "string",
              optional: true,
              tag: {
                value: { id: 1, defaultLabel: "Parent Name", editable: false, canBeTemplate: true },
              },
            },
            parentUuid: {
              type: "string",
              tag: {
                value: { id: 2, defaultLabel: "Parent Name", editable: false, canBeTemplate: true },
              },
            },
            applicationSection: {
              type: "schemaReference",
              optional: false,
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "applicationSection",
              },
            },
            instances: {
              type: "array",
              definition: {
                type: "schemaReference",
                tag: { value: { canBeTemplate: true } },
                definition: {
                  absolutePath: miroirFundamentalJzodSchemaUuid,
                  relativePath: "entityInstance",
                },
              },
            },
          },
        },
        conceptLevel: entityDefinitionEntity.jzodSchema.definition.conceptLevel,
        // {
        //   type: "enum",
        //   definition: ["MetaModel", "Model", "Data"],
        // },
        storageAccess: entityDefinitionEntity.jzodSchema.definition.storageAccess,
        dataStoreType: {
          type: "enum",
          definition: ["miroir", "app"],
        },
        entityInstanceUuid: {
          type: "string",
        },
        entityInstancesUuidIndex: {
          type: "record",
          definition: {
            type: "schemaReference",
            definition: {
              absolutePath: miroirFundamentalJzodSchemaUuid,
              relativePath: "entityInstance",
            },
          },
        },
        entityInstancesUuidIndexUuidIndex: {
          type: "record",
          definition: {
            type: "schemaReference",
            definition: {
              absolutePath: miroirFundamentalJzodSchemaUuid,
              relativePath: "entityInstancesUuidIndex",
            },
          },
        },
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        ______________________________________________tests_____________________________________________:
          {
            type: "never",
          },
        ...makeReferencesAbsolute(testSuitesResults, miroirFundamentalJzodSchemaUuid, true).context,
        testSuitesResults: {
          type: "schemaReference",
          definition: {
            absolutePath: miroirFundamentalJzodSchemaUuid,
            relativePath: testSuitesResults.definition.relativePath,
          },
        },
        ...makeReferencesAbsolute(
          entityDefinitionTransformerTest.jzodSchema.definition.definition,
          miroirFundamentalJzodSchemaUuid,
          true
        ).context,
        transformerTestDefinition: entityDefinitionTransformerTest.jzodSchema as any,
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        ______________________________________________entities_____________________________________________:
          {
            type: "never",
          },
        adminApplication: entityDefinitionAdminApplication.jzodSchema as any,
        selfApplication: entityDefinitionSelfApplicationV1.jzodSchema as any,
        applicationVersion: entityDefinitionSelfApplicationVersionV1.jzodSchema as any,
        bundle: entityDefinitionBundleV1.jzodSchema as any,
        deployment: entityDefinitionDeployment.jzodSchema as any,
        entity: entityDefinitionEntity.jzodSchema as any,
        entityDefinition: entityDefinitionEntityDefinitionV1.jzodSchema as any,
        testCompositeAction: (
          entityDefinitionTest.jzodSchema as any
        ).definition.definition.definition.fullTestDefinition.definition.find(
          (e: any) => e.definition.testType.definition == "testCompositeAction"
        ),
        testCompositeActionSuite: (
          entityDefinitionTest.jzodSchema as any
        ).definition.definition.definition.fullTestDefinition.definition.find(
          (e: any) => e.definition.testType.definition == "testCompositeActionSuite"
        ),
        testBuildCompositeAction: (
          entityDefinitionTest.jzodSchema as any
        ).definition.definition.definition.fullTestDefinition.definition.find(
          (e: any) => e.definition.testType.definition == "testBuildCompositeAction"
        ),
        testBuildCompositeActionSuite: (
          entityDefinitionTest.jzodSchema as any
        ).definition.definition.definition.fullTestDefinition.definition.find(
          (e: any) => e.definition.testType.definition == "testBuildCompositeActionSuite"
        ),
        testRuntimeCompositeAction: (
          entityDefinitionTest.jzodSchema as any
        ).definition.definition.definition.fullTestDefinition.definition.find(
          (e: any) => e.definition.testType.definition == "testRuntimeCompositeAction"
        ),
        testRuntimeCompositeActionSuite: (
          entityDefinitionTest.jzodSchema as any
        ).definition.definition.definition.fullTestDefinition.definition.find(
          (e: any) => e.definition.testType.definition == "testRuntimeCompositeActionSuite"
        ),
        testBuildPlusRuntimeCompositeAction: (
          entityDefinitionTest.jzodSchema as any
        ).definition.definition.definition.fullTestDefinition.definition.find(
          (e: any) => e.definition.testType.definition == "testBuildPlusRuntimeCompositeAction"
        ),
        testBuildPlusRuntimeCompositeActionSuite: (
          entityDefinitionTest.jzodSchema as any
        ).definition.definition.definition.fullTestDefinition.definition.find(
          (e: any) => e.definition.testType.definition == "testBuildPlusRuntimeCompositeActionSuite"
        ),
        testCompositeActionTemplate: (
          entityDefinitionTest.jzodSchema as any
        ).definition.definition.definition.fullTestDefinition.definition.find(
          (e: any) => e.definition.testType.definition == "testCompositeActionTemplate"
        ),
        testCompositeActionTemplateSuite: (
          entityDefinitionTest.jzodSchema as any
        ).definition.definition.definition.fullTestDefinition.definition.find(
          (e: any) => e.definition.testType.definition == "testCompositeActionTemplateSuite"
        ),
        testAssertion: (
          entityDefinitionTest.jzodSchema as any
        ).definition.definition.definition.fullTestDefinition.definition.find(
          (e: any) => e.definition.testType.definition == "testAssertion"
        ),
        test: entityDefinitionTest.jzodSchema as any,
        testCompositeActionParams,
        selfApplicationDeploymentConfiguration:
          entityDefinitionSelfApplicationDeploymentConfiguration.jzodSchema as any,
        // selfApplication: entityDefinitionSelfApplicationV1.jzodSchema as JzodObject,
        // applicationVersion: entityDefinitionSelfApplicationVersionV1.jzodSchema as JzodObject,
        // bundle: entityDefinitionBundleV1.jzodSchema as JzodObject,
        // deployment: entityDefinitionDeployment.jzodSchema as JzodObject,
        // entity: entityDefinitionEntity.jzodSchema as JzodObject,
        // entityDefinition: entityDefinitionEntityDefinitionV1.jzodSchema as JzodObject,
        ...(entityDefinitionMenu.jzodSchema.definition.definition as any).context,
        menu: entityDefinitionMenu.jzodSchema as any,
        // menu: entityDefinitionMenu.jzodSchema as JzodObject,
        graphConfig: (entityDefinitionReportV1 as any).jzodSchema.definition.definition.context.graphReportSection.definition.definition.definition.config,
        ...Object.fromEntries(
          Object.entries(
            (entityDefinitionReportV1 as any).jzodSchema.definition.definition.context
          ).filter((e) =>
            [ // TODO: remove this filter, this introduces unnecessary coupling
              "objectInstanceReportSection",
              "objectListReportSection",
              "gridReportSection",
              "listReportSection",
              "graphReportSection",
              "markdownReportSection",
              "reportSection",
              "rootReport",
              "runStoredQuery",
            ].includes(e[0])
          )
        ),
        jzodObjectOrReference: (entityDefinitionJzodSchemaV1 as any).jzodSchema.definition
          .definition.context.jzodObjectOrReference,
        jzodSchema: entityDefinitionJzodSchemaV1.jzodSchema as any,
        // jzodSchema: entityDefinitionJzodSchemaV1.jzodSchema as JzodObject,
        report: (entityDefinitionReportV1 as any).jzodSchema,
        metaModel: {
          type: "object",
          definition: {
            applicationVersions: {
              type: "array",
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: miroirFundamentalJzodSchemaUuid,
                  relativePath: "applicationVersion",
                },
              },
            },
            applicationVersionCrossEntityDefinition: {
              type: "array",
              definition: {
                type: "object",
                definition: {
                  uuid: {
                    type: "uuid",
                    tag: { value: { id: 1, defaultLabel: "Uuid", editable: false } },
                  },
                  parentName: {
                    type: "string",
                    optional: true,
                    tag: { value: { id: 2, defaultLabel: "Entity Name", editable: false } },
                  },
                  parentUuid: {
                    type: "uuid",
                    tag: { value: { id: 3, defaultLabel: "Entity Uuid", editable: false } },
                  },
                  conceptLevel: {
                    type: "enum",
                    definition: ["MetaModel", "Model", "Data"],
                    optional: true,
                    tag: { value: { id: 4, defaultLabel: "Concept Level", editable: false } },
                  },
                  applicationVersion: {
                    type: "uuid",
                    tag: {
                      value: { id: 1, defaultLabel: "SelfApplication Version", editable: false },
                    },
                  },
                  entityDefinition: {
                    type: "uuid",
                    tag: { value: { id: 1, defaultLabel: "Entity Definition", editable: false } },
                  },
                },
              },
            },
            // configuration: {
            //   type: "array",
            //   definition: {
            //     type: "schemaReference",
            //     definition: {
            //       absolutePath: miroirFundamentalJzodSchemaUuid,
            //       relativePath: "storeBasedConfiguration",
            //     },
            //   },
            // },
            entities: {
              type: "array",
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: miroirFundamentalJzodSchemaUuid,
                  relativePath: "entity",
                },
              },
            },
            entityDefinitions: {
              type: "array",
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: miroirFundamentalJzodSchemaUuid,
                  relativePath: "entityDefinition",
                },
              },
            },
            jzodSchemas: {
              type: "array",
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: miroirFundamentalJzodSchemaUuid,
                  // relativePath: "jzodSchema",
                  relativePath: "jzodSchema",
                },
              },
            },
            menus: {
              type: "array",
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: miroirFundamentalJzodSchemaUuid,
                  relativePath: "menu",
                },
              },
            },
            storedQueries: {
              type: "array",
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: miroirFundamentalJzodSchemaUuid,
                  relativePath: "query",
                },
              },
            },
            reports: {
              type: "array",
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: miroirFundamentalJzodSchemaUuid,
                  relativePath: "report",
                },
              },
            },
          },
        },
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        _________________________________configuration_and_bundles_________________________________:
          {
            type: "never",
          },
        indexedDbStoreSectionConfiguration: {
          type: "object",
          definition: {
            emulatedServerType: { type: "literal", definition: "indexedDb" },
            indexedDbName: { type: "string" },
          },
        },
        filesystemDbStoreSectionConfiguration: {
          type: "object",
          definition: {
            emulatedServerType: { type: "literal", definition: "filesystem" },
            directory: { type: "string" },
          },
        },
        sqlDbStoreSectionConfiguration: {
          type: "object",
          definition: {
            emulatedServerType: { type: "literal", definition: "sql" },
            connectionString: { type: "string" },
            schema: { type: "string" },
          },
        },
        storeSectionConfiguration: {
          type: "union",
          discriminator: "emulatedServerType",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "indexedDbStoreSectionConfiguration",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "filesystemDbStoreSectionConfiguration",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "sqlDbStoreSectionConfiguration",
              },
            },
          ],
        },
        storeUnitConfiguration: {
          type: "object",
          definition: {
            admin: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "storeSectionConfiguration",
              },
            },
            model: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "storeSectionConfiguration",
              },
            },
            data: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "storeSectionConfiguration",
              },
            },
          },
        },
        deploymentStorageConfig: {
          type: "record",
          definition: {
            type: "schemaReference",
            definition: {
              absolutePath: miroirFundamentalJzodSchemaUuid,
              relativePath: "storeUnitConfiguration",
            },
          },
        },
        serverConfigForClientConfig: {
          type: "object",
          definition: {
            rootApiUrl: {
              type: "string",
            },
            dataflowConfiguration: {
              type: "any",
            },
            storeSectionConfiguration: {
              type: "record",
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: miroirFundamentalJzodSchemaUuid,
                  relativePath: "storeUnitConfiguration",
                },
              },
            },
          },
        },
        miroirConfigForClientStub: {
          type: "object",
          definition: {
            emulateServer: {
              type: "literal",
              definition: true,
            },
            rootApiUrl: {
              type: "string",
            },
            deploymentStorageConfig: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "deploymentStorageConfig",
              },
            },
          },
        },
        miroirConfigForRestClient: {
          type: "object",
          definition: {
            emulateServer: {
              type: "literal",
              definition: false,
            },
            serverConfig: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "serverConfigForClientConfig",
              },
            },
          },
        },
        miroirConfigClient: {
          type: "object",
          definition: {
            miroirConfigType: {
              type: "literal",
              definition: "client",
            },
            client: {
              type: "union",
              definition: [
                {
                  type: "schemaReference",
                  definition: {
                    absolutePath: miroirFundamentalJzodSchemaUuid,
                    relativePath: "miroirConfigForClientStub",
                  },
                },
                {
                  type: "schemaReference",
                  definition: {
                    absolutePath: miroirFundamentalJzodSchemaUuid,
                    relativePath: "miroirConfigForRestClient",
                  },
                },
              ],
            },
          },
        },
        miroirConfigServer: {
          type: "object",
          definition: {
            miroirConfigType: {
              type: "literal",
              definition: "server",
            },
            server: {
              type: "object",
              definition: {
                rootApiUrl: {
                  type: "string",
                },
              },
            },
          },
        },
        miroirConfig: {
          type: "union",
          definition: [
            {
              type: "literal",
              definition: "miroirConfigClient",
            },
            {
              type: "literal",
              definition: "miroirConfigServer",
            },
          ],
        },
        commit: {
          type: "object",
          definition: {
            ...entityDefinitionCommit.jzodSchema.definition,
            actions: {
              type: "array",
              definition: {
                type: "object",
                definition: {
                  endpoint: {
                    type: "uuid",
                    tag: { value: { id: 1, defaultLabel: "Uuid", editable: false } },
                  },
                  actionArguments: {
                    type: "schemaReference",
                    definition: {
                      absolutePath: miroirFundamentalJzodSchemaUuid,
                      relativePath: "modelAction",
                    },
                  },
                },
              },
            },
            patches: {
              type: "array",
              definition: {
                type: "any",
              },
            },
          },
        },
        miroirAllFundamentalTypesUnion: {
          type: "union",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "applicationSection",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "entityInstance",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "entityInstanceCollection",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "instanceAction",
              },
            },
          ],
        },
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        ______________________________________________queries_____________________________________________:
          {
            type: "never",
          },
        // ...(makeReferencesAbsolute(entityDefinitionQueryVersionV1.jzodSchema.definition.definition,miroirFundamentalJzodSchemaUuid) as any).context,
        ...entityDefinitionQueryVersionV1WithAbsoluteReferences.context,
        domainElementVoid: {
          type: "object",
          definition: {
            elementType: {
              type: "literal",
              definition: "void",
            },
            elementValue: {
              type: "void",
            },
          },
        },
        domainElementAny: {
          type: "object",
          definition: {
            elementType: {
              type: "literal",
              definition: "any",
            },
            elementValue: {
              type: "any",
            },
          },
        },
        domainElementFailed: {
          type: "object",
          definition: {
            elementType: {
              type: "literal",
              definition: "failure",
            },
            elementValue: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "queryFailed",
              },
            },
          },
        },
        domainElementObject: {
          type: "object",
          definition: {
            elementType: {
              type: "literal",
              definition: "object",
            },
            elementValue: {
              type: "record",
              definition: {
                type: "schemaReference",
                definition: {
                  relativePath: "domainElement",
                },
              },
            },
          },
        },
        domainElementArray: {
          type: "object",
          definition: {
            elementType: {
              type: "literal",
              definition: "array",
            },
            elementValue: {
              type: "array",
              definition: {
                type: "schemaReference",
                definition: {
                  relativePath: "domainElement",
                },
              },
            },
          },
        },
        domainElementString: {
          type: "object",
          definition: {
            elementType: {
              type: "literal",
              definition: "string",
            },
            elementValue: {
              type: "string",
            },
          },
        },
        domainElementNumber: {
          type: "object",
          definition: {
            elementType: {
              type: "literal",
              definition: "number",
            },
            elementValue: {
              type: "number",
            },
          },
        },
        domainElementObjectOrFailed: {
          type: "union",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementObject",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementFailed",
              },
            },
          ],
        },
        domainElementInstanceUuidIndex: {
          type: "object",
          definition: {
            elementType: {
              type: "literal",
              definition: "instanceUuidIndex",
            },
            elementValue: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "entityInstancesUuidIndex",
              },
            },
          },
        },
        domainElementInstanceUuidIndexOrFailed: {
          type: "union",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementInstanceUuidIndex",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementFailed",
              },
            },
          ],
        },
        domainElementEntityInstance: {
          type: "object",
          definition: {
            elementType: {
              type: "literal",
              definition: "instance",
            },
            elementValue: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "entityInstance",
              },
            },
          },
        },
        domainElementEntityInstanceOrFailed: {
          type: "union",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementEntityInstance",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementFailed",
              },
            },
          ],
        },
        domainElementEntityInstanceCollection: {
          type: "object",
          definition: {
            elementType: {
              type: "literal",
              definition: "entityInstanceCollection",
            },
            elementValue: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "entityInstanceCollection",
              },
            },
          },
        },
        domainElementEntityInstanceCollectionOrFailed: {
          type: "union",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementEntityInstanceCollection",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementFailed",
              },
            },
          ],
        },
        domainElementInstanceArray: {
          type: "object",
          definition: {
            elementType: {
              type: "literal",
              definition: "instanceArray",
            },
            elementValue: {
              type: "array",
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: miroirFundamentalJzodSchemaUuid,
                  relativePath: "entityInstance",
                },
              },
            },
          },
        },
        domainElementInstanceArrayOrFailed: {
          type: "union",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementInstanceArray",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementFailed",
              },
            },
          ],
        },
        domainElementInstanceUuid: {
          type: "object",
          definition: {
            elementType: {
              type: "literal",
              definition: "instanceUuid",
            },
            elementValue: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "entityInstanceUuid",
              },
            },
          },
        },
        domainElementType: {
          type: "enum",
          definition: [
            "any",
            "object",
            "instanceUuidIndex",
            "entityInstanceCollection",
            "instanceArray",
            "instance",
            "instanceUuid",
            "instanceUuidIndexUuidIndex",
            "void",
          ],
        },
        domainElementSuccess: {
          type: "union",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementVoid",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementAny",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementObject",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementInstanceUuidIndex",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementEntityInstanceCollection",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementInstanceArray",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementEntityInstance",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementInstanceUuid",
              },
            },
            // {
            //   type: "object",
            //   definition: {
            //     elementType: {
            //       type: "literal",
            //       definition: "instanceUuidIndexUuidIndex",
            //     },
            //     elementValue: {
            //       type: "schemaReference",
            //       definition: {
            //         absolutePath: miroirFundamentalJzodSchemaUuid,
            //         relativePath: "entityInstancesUuidIndex",
            //       },
            //     },
            //   },
            // },
            {
              type: "schemaReference",
              definition: {
                relativePath: "domainElementString",
              },
            },
            {
              type: "schemaReference",
              definition: {
                relativePath: "domainElementNumber",
              },
            },
            {
              type: "schemaReference",
              definition: {
                relativePath: "domainElementArray",
              },
            },
          ],
        },
        domainElement: {
          type: "union",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementSuccess",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementFailed",
              },
            },
          ],
        },
        // ########################################################################################
        // QUERIES    #############################################################################
        // ########################################################################################
        localCacheExtractor: {
          type: "object",
          definition: {
            queryType: {
              type: "literal",
              definition: "localCacheEntityInstancesExtractor",
            },
            definition: {
              type: "object",
              definition: {
                deploymentUuid: {
                  type: "uuid",
                  optional: true,
                  tag: { value: { id: 1, defaultLabel: "Uuid", editable: false } },
                },
                applicationSection: {
                  type: "schemaReference",
                  optional: true,
                  definition: {
                    absolutePath: miroirFundamentalJzodSchemaUuid,
                    relativePath: "applicationSection",
                  },
                },
                entityUuid: {
                  type: "uuid",
                  optional: true,
                  tag: { value: { id: 1, defaultLabel: "Entity", editable: false } },
                },
                instanceUuid: {
                  type: "uuid",
                  optional: true,
                  tag: { value: { id: 1, defaultLabel: "Instance", editable: false } },
                },
              },
            },
          },
        },
        shippingBox: {
          type: "object",
          definition: {
            deploymentUuid: {
              // TODO: REPLACE WITH APPLICATION UUID OR LEAVE IT OPTIONAL
              type: "uuid",
              tag: {
                value: {
                  id: 1,
                  canBeTemplate: true,
                  defaultLabel: "Uuid",
                  editable: false,
                },
              },
            },
            pageParams: {
              type: "record",
              definition: {
                type: "any",
              },
            },
            queryParams: {
              type: "record",
              definition: {
                type: "any",
              },
            },
            contextResults: {
              type: "record",
              definition: {
                type: "any",
              },
            },
          },
        },
        boxedExtractorOrCombinerReturningObject: {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: miroirFundamentalJzodSchemaUuid,
              relativePath: "shippingBox",
            },
          },
          definition: {
            queryType: {
              type: "literal",
              definition: "boxedExtractorOrCombinerReturningObject",
            },
            select: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "extractorOrCombinerReturningObject", // TODO: is this still an extractor, while it includes extractorTemplateCombinerForObjectByRelation?
              },
            },
          },
        },
        boxedExtractorOrCombinerReturningObjectList: {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: miroirFundamentalJzodSchemaUuid,
              relativePath: "shippingBox",
            },
          },
          definition: {
            queryType: {
              type: "literal",
              definition: "boxedExtractorOrCombinerReturningObjectList",
            },
            select: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "extractorOrCombinerReturningObjectList",
              },
            },
          },
        },
        boxedExtractorOrCombinerReturningObjectOrObjectList: {
          type: "union",
          discriminator: "queryType",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "boxedExtractorOrCombinerReturningObject",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "boxedExtractorOrCombinerReturningObjectList",
              },
            },
          ],
        },
        boxedQueryWithExtractorCombinerTransformer: {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: miroirFundamentalJzodSchemaUuid,
              relativePath: "shippingBox",
            },
          },
          definition: {
            queryType: {
              type: "literal",
              definition: "boxedQueryWithExtractorCombinerTransformer",
            },
            runAsSql: {
              type: "boolean",
              optional: true,
            },
            extractors: {
              type: "schemaReference",
              optional: true,
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "extractorOrCombinerRecord",
              },
            },
            combiners: {
              type: "schemaReference",
              optional: true,
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "extractorOrCombinerRecord",
              },
            },
            runtimeTransformers: {
              type: "record",
              optional: true,
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: miroirFundamentalJzodSchemaUuid,
                  // relativePath: "transformerForRuntime",
                  // relativePath: "extendedTransformerForRuntime",
                  relativePath: "transformerForBuildPlusRuntime",
                },
              },
            },
          },
        },
        boxedExtractorTemplateReturningObject: {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: miroirFundamentalJzodSchemaUuid,
              relativePath: "shippingBox",
            },
          },
          definition: {
            queryType: {
              type: "literal",
              definition: "boxedExtractorTemplateReturningObject",
            },
            select: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "extractorTemplateReturningObject", // TODO: is this still an extractor, while it includes extractorTemplateCombinerForObjectByRelation?
              },
            },
          },
        },
        boxedExtractorTemplateReturningObjectList: {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: miroirFundamentalJzodSchemaUuid,
              relativePath: "shippingBox",
            },
          },
          definition: {
            queryType: {
              type: "literal",
              definition: "boxedExtractorTemplateReturningObjectList",
            },
            select: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "extractorTemplateReturningObjectList",
              },
            },
          },
        },
        boxedExtractorTemplateReturningObjectOrObjectList: {
          type: "union",
          discriminator: "queryType",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "boxedExtractorTemplateReturningObject",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "boxedExtractorTemplateReturningObjectList",
              },
            },
          ],
        },
        boxedQueryTemplateWithExtractorCombinerTransformer: {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: miroirFundamentalJzodSchemaUuid,
              relativePath: "shippingBox",
            },
          },
          definition: {
            queryType: {
              type: "literal",
              definition: "boxedQueryTemplateWithExtractorCombinerTransformer",
            },
            runAsSql: {
              type: "boolean",
              optional: true,
            },
            extractorTemplates: {
              type: "schemaReference",
              optional: true,
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "extractorOrCombinerTemplateRecord",
              },
            },
            combinerTemplates: {
              type: "schemaReference",
              optional: true,
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "extractorOrCombinerTemplateRecord",
              },
            },
            runtimeTransformers: {
              type: "record",
              optional: true,
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: miroirFundamentalJzodSchemaUuid,
                  // relativePath: "transformerForRuntime",
                  // relativePath: "extendedTransformerForRuntime",
                  relativePath: "transformerForBuildPlusRuntime",
                },
              },
            },
          },
        },
        // JzodSchema queries  ##############################################################
        queryByEntityUuidGetEntityDefinition: {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: miroirFundamentalJzodSchemaUuid,
              relativePath: "shippingBox",
            },
          },
          definition: {
            queryType: {
              type: "literal",
              definition: "getEntityDefinition",
            },
            deploymentUuid: {
              type: "uuid",
              tag: { value: { id: 1, defaultLabel: "Uuid", editable: false } },
            },
            entityUuid: {
              type: "uuid",
              tag: { value: { id: 1, defaultLabel: "Uuid", editable: false } },
            },
          },
        },
        queryByTemplateGetParamJzodSchema: {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: miroirFundamentalJzodSchemaUuid,
              relativePath: "shippingBox",
            },
          },
          definition: {
            queryType: {
              type: "literal",
              definition: "queryByTemplateGetParamJzodSchema",
            },
            fetchParams: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "boxedQueryTemplateWithExtractorCombinerTransformer",
              },
            },
          },
        },
        queryByQuery2GetParamJzodSchema: {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: miroirFundamentalJzodSchemaUuid,
              relativePath: "shippingBox",
            },
          },
          definition: {
            queryType: {
              type: "literal",
              definition: "queryByTemplateGetParamJzodSchema", // TODO: CORRECT!!!
            },
            fetchParams: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "boxedQueryWithExtractorCombinerTransformer",
              },
            },
          },
        },
        queryByQueryTemplateGetParamJzodSchema: {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: miroirFundamentalJzodSchemaUuid,
              relativePath: "shippingBox",
            },
          },
          definition: {
            queryType: {
              type: "literal",
              definition: "getQueryJzodSchema",
            },
            select: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "extractorOrCombinerTemplate",
              },
            },
          },
        },
        queryByQueryGetParamJzodSchema: {
          type: "object",
          extend: {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: miroirFundamentalJzodSchemaUuid,
              relativePath: "shippingBox",
            },
          },
          definition: {
            queryType: {
              type: "literal",
              definition: "getQueryJzodSchema", // TODO: CORRECT!!!
            },
            select: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "extractorOrCombiner",
              },
            },
          },
        },
        // TODO: THIS IS DUPLICATED BELOW!!!!
        domainModelQueryTemplateJzodSchemaParams: {
          type: "union",
          discriminator: "queryType",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "queryByEntityUuidGetEntityDefinition",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "queryByTemplateGetParamJzodSchema",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "queryByQueryTemplateGetParamJzodSchema",
              },
            },
          ],
        },
        queryJzodSchemaParams: {
          type: "union",
          discriminator: "queryType",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "queryByEntityUuidGetEntityDefinition",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "queryByQuery2GetParamJzodSchema",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "queryByQueryGetParamJzodSchema",
              },
            },
          ],
        },
        miroirQueryTemplate: {
          type: "union",
          discriminator: "queryType",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "boxedExtractorTemplateReturningObjectOrObjectList",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "boxedQueryTemplateWithExtractorCombinerTransformer",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "localCacheExtractor",
              },
            },
            // ##############################
            // domainModelQueryTemplateJzodSchemaParams reference yields to issue when producing TS types
            // {
            //   "type": "schemaReference",
            //   "definition": {
            //     "absolutePath": miroirFundamentalJzodSchemaUuid,
            //     "relativePath": "domainModelQueryTemplateJzodSchemaParams"
            //   }
            // }
            // DUPLICATED BELOW
            //   |
            //   |
            //   v
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "queryByEntityUuidGetEntityDefinition",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "queryByTemplateGetParamJzodSchema",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "queryByQueryTemplateGetParamJzodSchema",
              },
            },
          ],
        },
        miroirQuery: {
          type: "union",
          discriminator: "queryType",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "boxedExtractorOrCombinerReturningObjectOrObjectList",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "boxedQueryWithExtractorCombinerTransformer",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "localCacheExtractor",
              },
            },
            // ##############################
            // domainModelQueryTemplateJzodSchemaParams reference yields to issue when producing TS types
            // {
            //   "type": "schemaReference",
            //   "definition": {
            //     "absolutePath": miroirFundamentalJzodSchemaUuid,
            //     "relativePath": "domainModelQueryTemplateJzodSchemaParams"
            //   }
            // }
            // DUPLICATED BELOW
            //   |
            //   |
            //   v
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "queryByEntityUuidGetEntityDefinition",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "queryByQuery2GetParamJzodSchema",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "queryByQueryGetParamJzodSchema",
              },
            },
          ],
        },
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        ______________________________________________actions_____________________________________________:
          {
            type: "never",
          },
        actionError: {
          type: "object",
          definition: {
            status: { type: "literal", definition: "error" },
            // error: {
            //   type: "object",
            //   definition: {
            errorType: {
              type: "union",
              definition: [
                ...(storeManagementEndpoint as any).definition.actions
                  .filter((e: any) => !!e.actionErrors)
                  .map((e: any) => e.actionErrors),
                ...(instanceEndpointVersionV1 as any).definition.actions
                  .filter((e: any) => !!e.actionErrors)
                  .map((e: any) => e.actionErrors),
                {
                  type: "literal",
                  definition: "FailedToResolveTemplate", // TODO: add a Template Endpoint
                },
              ],
            },
            errorMessage: { type: "string", optional: true },
            errorStack: {
              type: "array",
              optional: true,
              definition: { type: "string", optional: true },
            },
            innerError: {
              type: "schemaReference",
              optional: true,
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "actionError",
              },
            },
          },
          // },
          // },
        },
        actionVoidSuccess: {
          type: "object",
          definition: {
            status: { type: "literal", definition: "ok" },
            returnedDomainElement: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementVoid",
              },
            },
          },
        },
        actionVoidReturnType: {
          type: "union",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "actionError",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "actionVoidSuccess",
              },
            },
          ],
        },
        actionEntityInstanceSuccess: {
          type: "object",
          definition: {
            status: { type: "literal", definition: "ok" },
            returnedDomainElement: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementEntityInstance",
              },
            },
          },
        },
        actionEntityInstanceReturnType: {
          type: "union",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "actionError",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "actionEntityInstanceSuccess",
              },
            },
          ],
        },
        actionEntityInstanceCollectionSuccess: {
          type: "object",
          definition: {
            status: { type: "literal", definition: "ok" },
            returnedDomainElement: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementEntityInstanceCollection",
              },
            },
          },
        },
        actionEntityInstanceCollectionReturnType: {
          type: "union",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "actionError",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "actionEntityInstanceCollectionSuccess",
              },
            },
          ],
        },
        actionSuccess: {
          type: "object",
          definition: {
            status: { type: "literal", definition: "ok" },
            returnedDomainElement: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElement",
              },
            },
          },
        },
        actionReturnType: {
          type: "union",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "actionError",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "actionSuccess",
              },
            },
          ],
        },
        modelActionInitModelParams: modelEndpointVersionV1.definition.actions.find(
          (a: any) => a.actionParameters.actionType.definition == "initModel"
        )?.actionParameters.payload.definition.params,
        modelActionCommit: {
          type: "object",
          definition: modelEndpointVersionV1.definition.actions.find(
            (a: any) => a.actionParameters.actionType.definition == "commit"
          )?.actionParameters,
        },
        modelActionRollback: {
          type: "object",
          definition: modelEndpointVersionV1.definition.actions.find(
            (a: any) => a.actionParameters.actionType.definition == "rollback"
          )?.actionParameters,
        },
        modelActionInitModel: {
          type: "object",
          definition: modelEndpointVersionV1.definition.actions.find(
            (a: any) => a.actionParameters.actionType.definition == "initModel"
          )?.actionParameters,
        },
        modelActionResetModel: {
          type: "object",
          definition: modelEndpointVersionV1.definition.actions.find(
            (a: any) => a.actionParameters.actionType.definition == "resetModel"
          )?.actionParameters,
        },
        modelActionResetData: {
          type: "object",
          definition: modelEndpointVersionV1.definition.actions.find(
            (a: any) => a.actionParameters.actionType.definition == "resetData"
          )?.actionParameters,
        },
        modelActionAlterEntityAttribute: {
          type: "object",
          definition: modelEndpointVersionV1.definition.actions.find(
            (a: any) => a.actionParameters.actionType.definition == "alterEntityAttribute"
          )?.actionParameters,
        },
        modelActionCreateEntity: {
          type: "object",
          definition: modelEndpointVersionV1.definition.actions.find(
            (a: any) => a.actionParameters.actionType.definition == "createEntity"
          )?.actionParameters,
        },
        modelActionDropEntity: {
          type: "object",
          definition: modelEndpointVersionV1.definition.actions.find(
            (a: any) => a.actionParameters.actionType.definition == "dropEntity"
          )?.actionParameters,
        },
        modelActionRenameEntity: {
          type: "object",
          definition: modelEndpointVersionV1.definition.actions.find(
            (a: any) => a.actionParameters.actionType.definition == "renameEntity"
          )?.actionParameters,
        },
        modelAction: {
          type: "union",
          discriminator: "actionType",
          definition: modelEndpointVersionV1.definition.actions.map((e: any) => ({
            type: "object",
            definition: e.actionParameters,
          })),
        },
        testAction_runTestCompositeAction: testEndpointVersionV1.definition.actions.find(
          (a: any) =>
            a.actionParameters.definition.actionName.definition == "runTestCompositeAction"
        )?.actionParameters,
        testAction_runTestCase: testEndpointVersionV1.definition.actions.find(
          (a: any) => a.actionParameters.definition.actionName.definition == "runTestCase"
        )?.actionParameters,
        instanceCUDAction: {
          type: "union",
          discriminator: "actionType",
          definition: instanceEndpointVersionV1.definition.actions
            .filter((e: any) =>
              ["createInstance", "updateInstance", "deleteInstance"].includes(
                e.actionParameters.actionType.definition
              )
            )
            .map((e: any) => ({ type: "object", definition: e.actionParameters })),
        },
        instanceAction: {
          type: "union",
          discriminator: "actionType",
          definition: instanceEndpointVersionV1.definition.actions.map((e: any) => ({
            type: "object",
            definition: e.actionParameters,
          })),
        },
        undoRedoAction: {
          type: "union",
          discriminator: "actionType",
          definition: undoRedoEndpointVersionV1.definition.actions.map((e: any) => ({
            type: "object",
            definition: e.actionParameters,
          })),
        },
        transactionalInstanceAction: domainEndpointVersionV1.definition.actions.find(
          (a: any) =>
            a.actionParameters.definition.actionType &&
            a.actionParameters.definition.actionType.definition == "transactionalInstanceAction"
        )?.actionParameters,
        localCacheAction: {
          type: "union",
          discriminator: "actionType",
          definition: localCacheEndpointVersionV1.definition.actions.map(
            (e: any) => e.actionParameters
          ),
        },
        storeManagementAction: {
          type: "union",
          discriminator: "actionType",
          definition: storeManagementEndpoint.definition.actions.map(
            (e: any) => e.actionParameters
          ),
        },
        persistenceAction: {
          type: "union",
          discriminator: "actionType",
          definition: persistenceEndpointVersionV1.definition.actions.map(
            (e: any) => e.actionParameters
          ),
        },
        localPersistenceAction: persistenceEndpointVersionV1.definition.actions[0].actionParameters,
        restPersistenceAction: persistenceEndpointVersionV1.definition.actions[1].actionParameters,
        runBoxedQueryTemplateOrBoxedExtractorTemplateAction: {
          type: "object",
          definition: queryEndpointVersionV1.definition.actions[0].actionParameters,
        },
        runBoxedExtractorOrQueryAction: {
          type: "object",
          definition: queryEndpointVersionV1.definition.actions[1].actionParameters,
        },
        runBoxedQueryTemplateAction: {
          type: "object",
          definition: queryEndpointVersionV1.definition.actions[2].actionParameters,
        },
        runBoxedExtractorTemplateAction: {
          type: "object",
          definition: queryEndpointVersionV1.definition.actions[3].actionParameters,
        },
        runBoxedQueryAction: {
          type: "object",
          definition: queryEndpointVersionV1.definition.actions[4].actionParameters,
        },
        runBoxedExtractorAction: {
          type: "object",
          definition: queryEndpointVersionV1.definition.actions[5].actionParameters,
        },
        // ################################################################################
        compositeActionDefinition: domainEndpointVersionV1.definition.actions.find(
          (a: any) => a.actionParameters?.definition?.actionType?.definition == "compositeAction"
        )?.actionParameters.definition.definition,
        compositeAction: domainEndpointVersionV1.definition.actions.find(
          (a: any) => a.actionParameters?.definition?.actionType?.definition == "compositeAction"
        )?.actionParameters,
        // ################################################################################
        // ################################################################################
        // ################################################################################
        // ################################################################################
        // ################################################################################
        // ################################################################################
        // ################################################################################
        buildCompositeAction: {
          type: "object",
          definition: {
            actionType: { type: "literal", definition: "compositeAction" },
            actionName: { type: "literal", definition: "sequence" },
            actionLabel: { type: "string", optional: true },
            deploymentUuid: {
              type: "uuid",
              optional: true,
              tag: { value: { defaultLabel: "Module Deployment Uuid", editable: false } },
            },
            templates: {
              type: "record",
              optional: true,
              definition: {
                type: "any",
              },
            },
            definition: {
              type: "array",
              definition: {
                type: "union",
                discriminator: "actionType",
                definition: [
                  {
                    type: "schemaReference",
                    definition: {
                      absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      relativePath: "buildDomainAction",
                    },
                  },
                  {
                    type: "schemaReference",
                    definition: {
                      absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      relativePath: "buildCompositeAction",
                    },
                  },
                  {
                    type: "object",
                    definition: {
                      actionType: { type: "literal", definition: "compositeRunBoxedQueryAction" },
                      actionLabel: { type: "string", optional: true },
                      nameGivenToResult: { type: "string" },
                      queryTemplate: {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                          relativePath: "runBoxedQueryAction",
                        },
                      },
                    },
                  },
                  {
                    type: "object",
                    definition: {
                      actionType: {
                        type: "literal",
                        definition: "compositeRunBoxedExtractorAction",
                      },
                      actionLabel: { type: "string", optional: true },
                      nameGivenToResult: { type: "string" },
                      queryTemplate: {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                          relativePath: "runBoxedExtractorAction",
                        },
                      },
                    },
                  },
                  {
                    type: "object",
                    definition: {
                      actionType: {
                        type: "literal",
                        definition: "compositeRunBoxedExtractorOrQueryAction",
                      },
                      actionLabel: { type: "string", optional: true },
                      nameGivenToResult: { type: "string" },
                      query: {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                          relativePath: "runBoxedExtractorOrQueryAction",
                        },
                      },
                    },
                  },
                  {
                    type: "object",
                    definition: {
                      actionType: { type: "literal", definition: "compositeRunTestAssertion" },
                      actionLabel: { type: "string", optional: true },
                      nameGivenToResult: { type: "string" },
                      testAssertion: {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                          relativePath: "testAssertion",
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        runtimeCompositeAction: {
          type: "object",
          definition: {
            actionType: { type: "literal", definition: "compositeAction" },
            actionName: { type: "literal", definition: "sequence" },
            actionLabel: { type: "string", optional: true },
            deploymentUuid: {
              type: "uuid",
              optional: true,
              tag: { value: { defaultLabel: "Module Deployment Uuid", editable: false } },
            },
            templates: {
              type: "record",
              optional: true,
              definition: {
                type: "any",
              },
            },
            definition: {
              type: "array",
              definition: {
                type: "union",
                discriminator: "actionType",
                definition: [
                  {
                    type: "schemaReference",
                    definition: {
                      absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      relativePath: "runtimeDomainAction",
                    },
                  },
                  {
                    type: "schemaReference",
                    definition: {
                      absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      relativePath: "runtimeCompositeAction",
                    },
                  },
                  {
                    type: "object",
                    definition: {
                      actionType: { type: "literal", definition: "compositeRunBoxedQueryAction" },
                      actionLabel: { type: "string", optional: true },
                      nameGivenToResult: { type: "string" },
                      queryTemplate: {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                          relativePath: "runBoxedQueryAction",
                        },
                      },
                    },
                  },
                  {
                    type: "object",
                    definition: {
                      actionType: {
                        type: "literal",
                        definition: "compositeRunBoxedExtractorAction",
                      },
                      actionLabel: { type: "string", optional: true },
                      nameGivenToResult: { type: "string" },
                      queryTemplate: {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                          relativePath: "runBoxedExtractorAction",
                        },
                      },
                    },
                  },
                  {
                    type: "object",
                    definition: {
                      actionType: {
                        type: "literal",
                        definition: "compositeRunBoxedExtractorOrQueryAction",
                      },
                      actionLabel: { type: "string", optional: true },
                      nameGivenToResult: { type: "string" },
                      query: {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                          relativePath: "runBoxedExtractorOrQueryAction",
                        },
                      },
                    },
                  },
                  {
                    type: "object",
                    definition: {
                      actionType: { type: "literal", definition: "compositeRunTestAssertion" },
                      actionLabel: { type: "string", optional: true },
                      nameGivenToResult: { type: "string" },
                      testAssertion: {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                          relativePath: "testAssertion",
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        // buildPlusRuntimeCompositeAction: {
        //   type: "object",
        //   definition: {
        //     actionType: { type: "literal", definition: "compositeAction" },
        //     actionName: { type: "literal", definition: "sequence" },
        //     actionLabel: { type: "string", optional: true },
        //     deploymentUuid: {
        //       type: "uuid",
        //       optional: true,
        //       tag: { value: { defaultLabel: "Module Deployment Uuid", editable: false } },
        //     },
        //     templates: {
        //       type: "record",
        //       optional: true,
        //       definition: {
        //         type: "any",
        //       },
        //     },
        //     definition: {
        //       type: "array",
        //       definition: {
        //         type: "union",
        //         discriminator: "actionType",
        //         definition: [
        //           {
        //             type: "schemaReference",
        //             definition: {
        //               absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        //               relativePath: "buildPlusRuntimeDomainAction",
        //             },
        //           },
        //           {
        //             type: "schemaReference",
        //             definition: {
        //               absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        //               relativePath: "buildPlusRuntimeCompositeAction",
        //             },
        //           },
        //           {
        //             type: "object",
        //             definition: {
        //               actionType: { type: "literal", definition: "compositeRunBoxedQueryAction" },
        //               actionLabel: { type: "string", optional: true },
        //               nameGivenToResult: { type: "string" },
        //               queryTemplate: {
        //                 type: "schemaReference",
        //                 definition: {
        //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        //                   relativePath: "runBoxedQueryAction",
        //                 },
        //               },
        //             },
        //           },
        //           {
        //             type: "object",
        //             definition: {
        //               actionType: {
        //                 type: "literal",
        //                 definition: "compositeRunBoxedExtractorAction",
        //               },
        //               actionLabel: { type: "string", optional: true },
        //               nameGivenToResult: { type: "string" },
        //               queryTemplate: {
        //                 type: "schemaReference",
        //                 definition: {
        //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        //                   relativePath: "runBoxedExtractorAction",
        //                 },
        //               },
        //             },
        //           },
        //           {
        //             type: "object",
        //             definition: {
        //               actionType: {
        //                 type: "literal",
        //                 definition: "compositeRunBoxedExtractorOrQueryAction",
        //               },
        //               actionLabel: { type: "string", optional: true },
        //               nameGivenToResult: { type: "string" },
        //               query: {
        //                 type: "schemaReference",
        //                 definition: {
        //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        //                   relativePath: "runBoxedExtractorOrQueryAction",
        //                 },
        //               },
        //             },
        //           },
        //           {
        //             type: "object",
        //             definition: {
        //               actionType: { type: "literal", definition: "compositeRunTestAssertion" },
        //               actionLabel: { type: "string", optional: true },
        //               nameGivenToResult: { type: "string" },
        //               testAssertion: {
        //                 type: "schemaReference",
        //                 definition: {
        //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        //                   relativePath: "testAssertion",
        //                 },
        //               },
        //             },
        //           },
        //         ],
        //       },
        //     },
        //   },
        // },
        buildPlusRuntimeCompositeAction: {
          type: "schemaReference",
          definition: {
            absolutePath: miroirFundamentalJzodSchemaUuid,
            relativePath:
              "buildPlusRuntimeDomainAction_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction",
          },
        },
        // ################################################################################
        // ################################################################################
        // ################################################################################
        // ################################################################################
        // ################################################################################
        // ################################################################################
        // ################################################################################
        // ################################################################################
        // ################################################################################
        compositeRunTestAssertion: domainEndpointVersionV1.definition.actions
          .find(
            (a: any) => a.actionParameters?.definition?.actionType?.definition == "compositeAction"
          )
          ?.actionParameters.definition.definition.definition.definition.find(
            (a: any) => a.definition?.actionType?.definition == "compositeRunTestAssertion"
          ),
        domainAction: {
          type: "union",
          discriminator: "actionType",
          definition: domainEndpointVersionV1.definition.actions.map(
            (e: any) => e.actionParameters
          ),
        },
        // ...(transformerJzodSchema as any).definition.context, // gives "transformerForBuild_InnerReference", "transformerForBuild", "actionHandler"
        modelActionReplayableAction: {
          type: "union",
          discriminator: "actionType",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "modelActionAlterEntityAttribute",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "modelActionCreateEntity",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "modelActionDropEntity",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "modelActionRenameEntity",
              },
            },
          ],
        },
        // "compositeDomainAction": {
        //   "type": "object",
        //   "definition": {
        //     "actionType": {
        //       "type": "literal",
        //       "definition": "composite"
        //     },
        //     "actionName": {
        //       "type": "literal",
        //       "definition": "sequence"
        //     },

        //   }
        // },
        bundleAction: {
          type: "union",
          discriminator: "actionType",
          definition: [
            {
              type: "object",
              definition: {
                actionType: {
                  type: "literal",
                  definition: "bundleAction",
                },
                actionName: {
                  type: "literal",
                  definition: "createBundle",
                },
                actionLabel: {
                  type: "string",
                  optional: true,
                },
                deploymentUuid: {
                  type: "uuid",
                  tag: { value: { id: 1, defaultLabel: "Uuid", editable: false } },
                },
              },
            },
            {
              type: "object",
              definition: {
                actionType: {
                  type: "literal",
                  definition: "bundleAction",
                },
                actionName: {
                  type: "literal",
                  definition: "deleteBundle",
                },
                actionLabel: {
                  type: "string",
                  optional: true,
                },
                deploymentUuid: {
                  type: "uuid",
                  tag: { value: { id: 1, defaultLabel: "Uuid", editable: false } },
                },
              },
            },
          ],
        },
        storeOrBundleAction: {
          type: "union",
          discriminator: "actionType",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "storeManagementAction",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "bundleAction",
              },
            },
          ],
        },
        actionTransformer: {
          type: "object",
          definition: {
            transformerType: {
              type: "literal",
              definition: "actionTransformer",
            },
          },
        },
        dataTransformer: {
          type: "object",
          definition: {
            transformerType: {
              type: "literal",
              definition: "dataTransformer",
            },
          },
        },
        getBasicApplicationConfigurationParameters: {
          type: "union",
          discriminator: {
            discriminatorType: "string",
            value: "emulatedServerType",
          },
          definition: [
            {
              type: "object",
              definition: {
                emulatedServerType: {
                  type: "literal",
                  definition: "sql",
                },
                connectionString: {
                  type: "string",
                },
              },
            },
            {
              type: "object",
              definition: {
                emulatedServerType: {
                  type: "literal",
                  definition: "indexedDb",
                },
                rootIndexDbName: {
                  type: "string",
                },
              },
            },
            {
              type: "object",
              definition: {
                emulatedServerType: {
                  type: "literal",
                  definition: "filesystem",
                },
                rootDirectory: {
                  type: "string",
                },
              },
            },
          ],
        },
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        ______________________________________________endpoint_____________________________________________:
          {
            type: "never",
          },
        ...entityDefinitionEndpointDefinition.jzodSchema.definition.definition.definition.actions
          .context,
        // endpointDefinition: entityDefinitionEndpointDefinition.jzodSchema.definition.definition,
        endpointDefinition: entityDefinitionEndpointDefinition.jzodSchema,
      },
      definition: {
        absolutePath: miroirFundamentalJzodSchemaUuid,
        relativePath: "miroirAllFundamentalTypesUnion",
      },
    },
  };
  log.info(
    "################## miroirFundamentalJzodSchema",
    JSON.stringify(Object.keys(miroirFundamentalJzodSchema.definition.context), null, 2)
  );

  log.info(
    "getMiroirFundamentalJzodSchema miroirFundamentalJzodSchema transformerForBuild_objectDynamicAccess:",
    JSON.stringify((miroirFundamentalJzodSchema as any).definition.context["transformerForBuild_objectDynamicAccess"], null, 2)
  );

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  const absoluteMiroirFundamentalJzodSchema = {
    ...miroirFundamentalJzodSchema,
    definition: {
      ...miroirFundamentalJzodSchema.definition,
      context: Object.fromEntries(
        Object.entries(miroirFundamentalJzodSchema.definition.context).map((e) => [
          e[0],
          makeReferencesAbsolute(e[1], miroirFundamentalJzodSchemaUuid, true) as any,
        ])
      ),
    }
  }

  const oldCompositeActionDependencySet = jzodTransitiveDependencySet(
    miroirFundamentalJzodSchema.definition,
    "compositeAction",
    true, // includeExtend
  );

  // TODO: HACK!! forcing jzod schema definition into compositeActionDependencySet
  Object.keys((jzodSchemajzodMiroirBootstrapSchema as any).definition.context).forEach((key) => {
    oldCompositeActionDependencySet.add(key);
  });

  // TODO: HACK!! forcing build transformer into compositeActionDependencySet, although the compositeAction does not directly reference it, it is used in the extendedSchemas
  [
    "transformerForBuild_Abstract", 
    "transformerForBuild_optional_Abstract",
    "transformerForBuild_objectDynamicAccess",
    "transformerForBuild_parameterReference",
    "transformerForBuild_mustacheStringTemplate",
    // "transformerForBuild",
    "transformerForBuild_conditional",
    "transformerForBuild_constant",
    "transformerForBuild_constantBoolean",
    "transformerForBuild_constantBigint",
    "transformerForBuild_constantUuid",
    "transformerForBuild_constantObject",
    "transformerForBuild_constantNumber",
    "transformerForBuild_constantString",
    "transformerForBuild_constantArray",
    "transformerForBuild_constantAsExtractor",
    "transformerForBuild_contextReference",
    "transformerForBuild_count",
    "transformerForBuild_dataflowObject",
    "transformerForBuild_mapperListToList",
    "transformerForBuild_freeObjectTemplate",
    "transformerForBuild_newUuid",
    "transformerForBuild_mustacheStringTemplate",
    "transformerForBuild_objectAlter",
    "transformerForBuild_objectDynamicAccess",
    "transformerForBuild_objectEntries",
    "transformerForBuild_objectValues",
    "transformerForBuild_listPickElement",
    "transformerForBuild_listReducerToIndexObject",
    "transformerForBuild_listReducerToSpreadObject",
    "transformerForBuild_object_fullTemplate",
    "transformerForBuild_parameterReference",
    "transformerForBuild_unique",
    // "transformerForBuild_InnerReference"
  ].forEach((key) => {
    oldCompositeActionDependencySet.add(key);
  });

  log.info(
    "oldCompositeActionDependencySet",
    Array.from(oldCompositeActionDependencySet.keys()).length,
    JSON.stringify(Array.from(oldCompositeActionDependencySet.keys()), null, 2),
  );
  const oldCompositeActionDependenciesJzodReference: JzodReference = {
    type: "schemaReference",
    context: Object.fromEntries(
      Array.from(oldCompositeActionDependencySet.keys()).map((key) => {
        if (!absoluteMiroirFundamentalJzodSchema.definition.context[key]) {
          throw new Error(
            `Key ${key} not found in miroirFundamentalJzodSchema.context, existing keys are: ${Object.keys(
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
  };

  log.info(
    "getMiroirFundamentalJzodSchema oldCompositeActionDependenciesInnerResolutionStore keys:",
    Object.keys(oldCompositeActionDependenciesJzodReference.context??{}).length,
    JSON.stringify(Object.keys(oldCompositeActionDependenciesJzodReference.context??{}), null, 2)
  );


  const transformerForBuildCarryOnSchema: any = miroirFundamentalJzodSchema.definition.context
    .transformerForBuild as any;

  const transformerForBuildCarryOnSchemaReference: JzodReference = {
    type: "schemaReference",
    definition: {
      relativePath: "transformerForBuildCarryOnObject",
    },
  };

  const transformerForRuntimeCarryOnSchema: any = miroirFundamentalJzodSchema.definition.context
    .transformerForBuild as any;

  const extendedSchemas: string[] = getExtendedSchemas(jzodSchemajzodMiroirBootstrapSchema);

  log.info(
    "getMiroirFundamentalJzodSchema extendedSchemas",
    extendedSchemas.length,
    JSON.stringify(extendedSchemas, null, 2)
  );

  const oldCompositeActionLocalizedInnerResolutionStoreForExtendedSchemas =
    createLocalizedInnerResolutionStoreForExtendedSchemas(
      oldCompositeActionDependenciesJzodReference,
      extendedSchemas,
      transformerForBuildCarryOnSchemaReference,
      undefined, // carryOnSchemaDiscriminator
      resolveReferencesWithCarryOn.bind(
        undefined,
        {
          [miroirFundamentalJzodSchemaUuid]:oldCompositeActionDependenciesJzodReference
        }
      ),
      "carryOn_", // prefix
      true, // alwaysPropagate
    );

  log.info(
    "oldCompositeActionLocalizedInnerResolutionStoreForExtendedSchemas",
    JSON.stringify(Object.keys(oldCompositeActionLocalizedInnerResolutionStoreForExtendedSchemas), null, 2)
  );

  const oldCompositeActionLocalizedInnerResolutionStorePlainReferences =
    createLocalizedInnerResolutionStoreWithCarryOn(
      oldCompositeActionDependenciesJzodReference,
      extendedSchemas,
      transformerForBuildCarryOnSchemaReference,
      undefined, // carryOnSchemaDiscriminator
      resolveReferencesWithCarryOn.bind(undefined, {
        [miroirFundamentalJzodSchemaUuid]: oldCompositeActionDependenciesJzodReference,
      }),
      "carryOn_", // prefix
      true, // alwaysPropagate
    );
  log.info(
    "getMiroirFundamentalJzodSchema oldCompositeActionLocalizedInnerResolutionStorePlainReferences",
    Object.keys(oldCompositeActionLocalizedInnerResolutionStorePlainReferences).length,
    JSON.stringify(Object.keys(oldCompositeActionLocalizedInnerResolutionStorePlainReferences), null, 2)
  );

  const localizedInnerResolutionStoreReferences = Object.assign(
    {},
    oldCompositeActionLocalizedInnerResolutionStoreForExtendedSchemas,
    oldCompositeActionLocalizedInnerResolutionStorePlainReferences
  );

  // ##############################################################################################
  log.info("getMiroirFundamentalJzodSchema domainAction ##############################################################################################");
  const domainAction = (miroirFundamentalJzodSchema as any).definition.context["domainAction"]
  const runtimeDomainActionReferencePrefix = "runtimeDomainAction_";

  const transformerForRuntimeDomainActionSchemaReference: JzodReference = {
    type: "schemaReference",
    definition: {
      absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
      relativePath: "transformerForRuntime",
    },
  };

  const domainActionDependencySet = jzodTransitiveDependencySet(
    miroirFundamentalJzodSchema.definition,
    // "instanceCUDAction",
    "domainAction",
    true, // includeExtend
  );

  // TODO: HACK!! forcing jzod schema definition into compositeActionDependencySet
  Object.keys((jzodSchemajzodMiroirBootstrapSchema as any).definition.context).forEach((key) => {
    domainActionDependencySet.add(key);
  });
  
    [
    "transformerForBuild_Abstract", 
    "transformerForBuild_optional_Abstract",
    "transformerForBuild_objectDynamicAccess",
    "transformerForBuild_parameterReference",
    "transformerForBuild_mustacheStringTemplate",
    // "transformerForBuild",
    "transformerForBuild_conditional",
    "transformerForBuild_constant",
    "transformerForBuild_constantBoolean",
    "transformerForBuild_constantBigint",
    "transformerForBuild_constantUuid",
    "transformerForBuild_constantObject",
    "transformerForBuild_constantNumber",
    "transformerForBuild_constantString",
    "transformerForBuild_constantArray",
    "transformerForBuild_constantAsExtractor",
    "transformerForBuild_contextReference",
    "transformerForBuild_count",
    "transformerForBuild_dataflowObject",
    "transformerForBuild_mapperListToList",
    "transformerForBuild_freeObjectTemplate",
    "transformerForBuild_newUuid",
    "transformerForBuild_mustacheStringTemplate",
    "transformerForBuild_objectAlter",
    "transformerForBuild_objectDynamicAccess",
    "transformerForBuild_objectEntries",
    "transformerForBuild_objectValues",
    "transformerForBuild_listPickElement",
    "transformerForBuild_listReducerToIndexObject",
    "transformerForBuild_listReducerToSpreadObject",
    "transformerForBuild_object_fullTemplate",
    "transformerForBuild_parameterReference",
    "transformerForBuild_unique",
    // "transformerForBuild_InnerReference"
  ].forEach((key) => {
    domainActionDependencySet.add(key);
  });

  log.info(
    "domainActionDependencySet",
    Array.from(domainActionDependencySet.keys()).length,
    JSON.stringify(Array.from(domainActionDependencySet.keys()), null, 2),
  );


  const {
    carryOnDomainActionLocalizedInnerResolutionStoreForExtendedSchemas: runtimeDomainActionLocalizedInnerResolutionStoreForExtendedSchemas,
    domainActionLocalizedInnerResolutionStorePlainReferences: runtimeDomainActionLocalizedInnerResolutionStorePlainReferences,
    carryOnDomainActionSchemaBuilder: runtimeDomainActionSchemaBuilder,
  } = createDomainActionCarryOnSchemaResolver(
    domainAction,
    transformerForRuntimeDomainActionSchemaReference,
    ["transformerType", "interpolation"],
    domainActionDependencySet,
    runtimeDomainActionReferencePrefix,
    false, // alwaysPropagate
    absoluteMiroirFundamentalJzodSchema,
    extendedSchemas,
  );
  const {
    carryOnDomainActionLocalizedInnerResolutionStoreForExtendedSchemas: buildDomainActionLocalizedInnerResolutionStoreForExtendedSchemas,
    domainActionLocalizedInnerResolutionStorePlainReferences: buildDomainActionLocalizedInnerResolutionStorePlainReferences,
    carryOnDomainActionSchemaBuilder: buildDomainActionSchemaBuilder,
  } = createDomainActionCarryOnSchemaResolver(
    domainAction,
    transformerForBuildCarryOnSchemaReference,
    ["transformerType", "interpolation"],
    domainActionDependencySet,
    "buildDomainAction_",
    false, // alwaysPropagate
    absoluteMiroirFundamentalJzodSchema,
    extendedSchemas,
  );

  const {
    carryOnDomainActionLocalizedInnerResolutionStoreForExtendedSchemas:
      buildPlusRuntimeDomainActionLocalizedInnerResolutionStoreForExtendedSchemas,
    domainActionLocalizedInnerResolutionStorePlainReferences:
      buildPlusRuntimeDomainActionLocalizedInnerResolutionStorePlainReferences,
    carryOnDomainActionSchemaBuilder: buildPlusRuntimeDomainActionSchemaBuilder,
  } = createDomainActionCarryOnSchemaResolver(
    domainAction,
    {
      type: "schemaReference",
      definition: {
        absolutePath: miroirFundamentalJzodSchemaUuid,
        relativePath: "transformerForBuildPlusRuntimeCarryOnObject",
      },
    },
    ["transformerType", "interpolation"],
    domainActionDependencySet,
    "buildPlusRuntimeDomainAction_",
    false, // alwaysPropagate
    absoluteMiroirFundamentalJzodSchema,
    extendedSchemas
  );


  // ##############################################################################################
  const miroirFundamentalJzodSchemaWithActionTemplate: any = {
    ...miroirFundamentalJzodSchema,
    definition: {
      ...miroirFundamentalJzodSchema.definition,
      context: {
        ...((miroirFundamentalJzodSchema.definition as any)?.context ?? {}),
        ...localizedInnerResolutionStoreReferences,
        ...runtimeDomainActionLocalizedInnerResolutionStoreForExtendedSchemas,
        ...runtimeDomainActionLocalizedInnerResolutionStorePlainReferences,
        ...buildDomainActionLocalizedInnerResolutionStoreForExtendedSchemas,
        ...buildDomainActionLocalizedInnerResolutionStorePlainReferences,
        ...buildPlusRuntimeDomainActionLocalizedInnerResolutionStoreForExtendedSchemas,
        ...buildPlusRuntimeDomainActionLocalizedInnerResolutionStorePlainReferences,
        transformerForBuildCarryOnObject: transformerForBuildCarryOnSchema,
        transformerForRuntimeCarryOnObject: transformerForRuntimeCarryOnSchema,
        transformerForBuildPlusRuntimeCarryOnObject: miroirFundamentalJzodSchema.definition.context
          .transformerForBuildPlusRuntime as any,
        ...(() => {
          // defining a function, which is called immediately (just one time)
          const compositeActionSchemaBuilder = applyLimitedCarryOnSchema(
            {
              type: "schemaReference",
              definition: {
                relativePath: forgeCarryOnReferenceName(
                  miroirFundamentalJzodSchemaUuid,
                  "compositeAction"
                ),
              },
            },
            transformerForBuildCarryOnSchemaReference as any,
            ["transformerType", "interpolation"],
            true, // alwaysPropagate
            undefined, // carryOnPrefix,
            undefined, // reference prefix
            undefined, // reference suffix
            resolveReferencesWithCarryOn.bind(
              undefined,
              oldCompositeActionDependenciesJzodReference
            )
          );
          return {
            ...compositeActionSchemaBuilder.resolvedReferences,
            // ...runtimeDomainActionSchemaBuilder.resolvedReferences,
            // TODO: use / define replayableActionTemplate (ModelAction + InstanceCUDAction) & Non-transactionalActionTemplate
            // non-transactional action templates can be used wich queries, they do not need to be replayable post-mortem.
            buildDomainAction: buildDomainActionSchemaBuilder.resultSchema,
            runtimeDomainAction: runtimeDomainActionSchemaBuilder.resultSchema,
            buildPlusRuntimeDomainAction: buildPlusRuntimeDomainActionSchemaBuilder.resultSchema,
            compositeActionTemplate: compositeActionSchemaBuilder.resultSchema, // compositeActionTemplate: THAT's THE RESULT OF THE WHOLE MOVEMENT!
          };
        })(),
      } as Record<string, any /**JzodElement */>,
    } as any /** JzodObjectOrReference */,
  };
  log.info("entityDefinitionQueryVersionV1WithAbsoluteReferences=",JSON.stringify(entityDefinitionQueryVersionV1WithAbsoluteReferences))

  return miroirFundamentalJzodSchemaWithActionTemplate;

}
