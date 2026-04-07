import { JzodElement, JzodReference } from "@miroir-framework/jzod-ts";
import { miroirThemeSchemaJson, tableThemeSchemaJson } from "miroir-test-app_deployment-miroir";

import { cleanLevel } from "../../../1_core/constants";
import { jzodTransitiveDependencySet } from "../../../1_core/jzod/JzodSchemaReferences";
import {
  coreTransformerForBuildPlusRuntimeNames,
  miroirCoreTransformers,
  miroirCoreTransformersForBuildPlusRuntime,
  miroirTransformersForBuildPlusRuntime,
  mlsTransformers
} from "../../../2_domain/Transformers";
import { MiroirLoggerFactory } from "../../../4_services/MiroirLoggerFactory";
import { packageName } from "../../../constants";
import { LoggerInterface } from "../../4-services/LoggerInterface";
import { testSuitesResults } from "../../4-services/TestInterface";
import {
  keyMapEntry,
  resolvedJzodSchemaReturnType,
  resolvedJzodSchemaReturnTypeError,
  resolvedJzodSchemaReturnTypeOK,
} from "../jzodTypeCheckInterface";
import {
  jzodUnion_RecursivelyUnfold_ReturnType,
  jzodUnion_RecursivelyUnfold_ReturnTypeError,
  jzodUnion_RecursivelyUnfold_ReturnTypeOK,
} from "../jzodUnion_RecursivelyUnfoldInterface";
import { zodParseErrorJzodSchema } from "../zodParseError";
import {
  createDomainActionCarryOnSchemaResolver,
  getDependencySet,
  getExtendedSchemas,
  getJzodElementWithCarryOnContext,
  makeReferencesAbsolute,
  miroirFundamentalJzodSchemaUuid,
  testCompositeActionParams,
} from "./getMiroirFundamentalJzodSchemaHelpers";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "getMiroirFundamentalJzodSchema")
).then((logger: LoggerInterface) => {
  log = logger;
});


function makeObjectsMandatory (element: JzodElement): JzodElement {
  if (element.type === "object") {
    const result: JzodElement = {
      ...element,
      definition: Object.fromEntries(
        Object.entries(element.definition).map(([key, value]) => [key, makeObjectsMandatory(value)])
      ),
    };
    delete result.optional;
    delete result.nullable;
    return result;
  }
  return element;
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
  entityDefinitionRunner: any,
  // entityDefinitionSelfApplication: any,
  entityDefinitionSelfApplicationDeploymentConfiguration: any,
  entityDefinitionTest: any,
  entityDefinitionTransformerTest: any,
  entityDefinitionTransformerDefinition: any,
  entityDefinitionEndpointDefinition: any,
// ): JzodReference {
  // ): any /** JzodReference, avoiding reference to ensure proper compilation */ {
  ): any /** MlSchema, avoiding reference to ensure proper compilation */ {
  // TODO: not really a JzodReference!!
  log.info("getMiroirFundamentalJzodSchema called!");
  const _t_start = Date.now();
  const _phaseTimings: Array<{phase: string; ms: number}> = [];
  // log.info(
  //   "graphConfig: (entityDefinitionReportV1 as any).mlSchema.definition.definition.context.graphReportSection.definition.definition.definition.config",
  //   JSON.stringify((entityDefinitionReportV1 as any).mlSchema.definition.definition.context.graphReportSection.definition.definition.definition.config??{},null,2)
  //   // JSON.stringify(entityDefinitionJzodSchemaV1.mlSchema.definition.definition.context.miroirTransformersForBuild ?? {}, null, 2)
  // );
  // log.info(
  //   "getMiroirFundamentalJzodSchema entityDefinitionTransformerTest.mlSchema.definition.definition.context",
  //   entityDefinitionTransformerTest.mlSchema.definition.definition.context
  // );
  const entityDefinitionQueryVersionV1WithAbsoluteReferences = makeReferencesAbsolute(
    entityDefinitionQueryVersionV1.mlSchema.definition.definition,
    miroirFundamentalJzodSchemaUuid
  ) as any;


  // log.info(
  //   "getMiroirFundamentalJzodSchema entityDefinitionQueryVersionV1WithAbsoluteReferences",
  //   Object.keys(entityDefinitionQueryVersionV1WithAbsoluteReferences.context ?? {}).length,
  //   JSON.stringify(entityDefinitionQueryVersionV1WithAbsoluteReferences.context.combinerOneToOne ?? {}, null, 2)
  // );
  // log.info("getMiroirFundamentalJzodSchema miroirTransformersJzodSchemas", JSON.stringify(miroirTransformersJzodSchemas.map(e=>e.name)), null, 2);
  // log.info("getMiroirFundamentalJzodSchema miroirTransformersForBuild", JSON.stringify(Object.keys(miroirTransformersForBuild), null, 2));
  // log.info("getMiroirFundamentalJzodSchema transformerForBuildNames", JSON.stringify(transformerForBuildNames, null, 2));
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  const miroirFundamentalJzodSchema: any = {
    // const miroirFundamentalJzodSchema: MlSchema = {
    uuid: miroirFundamentalJzodSchemaUuid,
    parentName: "MlSchema",
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
            true,
          ) as any
        ).context,
        // miroirIcon: entityDefinitionEntityDefinitionV1.mlSchema.definition.icon,
        miroirIcon: {
          type: "union",
          discriminator: "iconType",
          tag: {
            value: {
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
                superImpose: {
                  type: "object",
                  optional: true,
                  definition: {
                    letter: {
                      type: "string",
                      optional: true,
                      tag: {
                        value: {
                          defaultLabel: "Letter Superimposed on Icon",
                          editable: true,
                        },
                      },
                    },
                    color: {
                      type: "string",
                      optional: true,
                      tag: {
                        value: {
                          defaultLabel: "Color of Superimposed Letter",
                          editable: true,
                        },
                      },
                    },
                  },
                },
                color: {
                  type: "union",
                  discriminator: "colorType",
                  optional: true,
                  tag: {
                    value: {
                      defaultLabel: "Icon Color",
                      editable: true,
                    },
                  },
                  definition: [
                    { type: "string" },
                    {
                      type: "object",
                      definition: {
                        colorType: {
                          type: "literal",
                          definition: "themeColor",
                        },
                        currentThemeColorPath: {
                          type: "string",
                        },
                      },
                    },
                  ],
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
          true,
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
          ]),
        ),
        // ########################################################################################
        ...makeReferencesAbsolute(
          zodParseErrorJzodSchema as any,
          miroirFundamentalJzodSchemaUuid,
          true,
        ).context, // gives "transformerForBuild_InnerReference", "transformerForBuild", "actionHandler"
        // zodParseErrorIssue: zodParseError.context.zodParseErrorIssue as any,
        // zodParseError: zodParseError.context.zodParseError as any,
        // ########################################################################################
        ...Object.fromEntries(
          Object.entries(miroirCoreTransformers).map(([key, value]) => [
            key.replace("transformer_", "coreTransformerForBuildPlusRuntime_"),
            miroirCoreTransformersForBuildPlusRuntime[key as keyof typeof miroirCoreTransformersForBuildPlusRuntime],
          ]),
        ),
        coreTransformerForBuildPlusRuntimeWithoutArray: {
          type: "union",
          optInDiscriminator: true,
          discriminator: ["transformerType", "interpolation"],
          definition: [
            {
              type: "string",
            },
            {
              type: "number",
            },
            { type: "boolean" },
            ...coreTransformerForBuildPlusRuntimeNames.map((e: any) => ({
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
                relativePath: "coreTransformerForBuildPlusRuntime_dataflowSequence",
              },
            },
          ],
        },
        coreTransformerForBuildPlusRuntime:{
          type: "union",
          optInDiscriminator: true,
          discriminator: ["transformerType", "interpolation"],
          definition: [
            {
              type: "string",
            },
            {
              type: "number",
            },
            { type: "boolean" },
            {
              type: "array",
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: miroirFundamentalJzodSchemaUuid,
                  relativePath: "coreTransformerForBuildPlusRuntime",
                },
              },
            },
            ...coreTransformerForBuildPlusRuntimeNames.map((e: any) => ({
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
                relativePath: "coreTransformerForBuildPlusRuntime_dataflowSequence",
              },
            },
          ],
        },
        // ########################################################################################
        // ########################################################################################
        // WRONG!!!! (???)
        //
        transformerForBuildPlusRuntime_spreadSheetToJzodSchema:
          miroirTransformersForBuildPlusRuntime.transformer_spreadSheetToJzodSchema,
        //
        transformerForBuildPlusRuntime_getActiveDeployment:
          miroirTransformersForBuildPlusRuntime.transformer_getActiveDeployment,
        //
        transformerForBuildPlusRuntime_menu_addItem:
          miroirTransformersForBuildPlusRuntime.transformer_menu_addItem,
        //
          transformerForBuildPlusRuntime_ansiColumnsToJzodSchema:
            miroirTransformersForBuildPlusRuntime.transformer_ansiColumnsToJzodSchema,
        // 
        // ...Object.fromEntries(
        //   Object.entries(miroirCoreTransformers).map(([key, value]) => [
        //     key.replace("transformer_", "transformerForBuildPlusRuntime_"),
        //     miroirTransformersForBuildPlusRuntime[
        //       key as keyof typeof miroirTransformersForBuildPlusRuntime
        //     ],
        //   ]),
        // ),
        // MLS
        ...Object.fromEntries(
          Object.entries(mlsTransformers).map(([key, value]) => [
            key.replace("transformer_", "transformerForBuildPlusRuntime_"),
            miroirTransformersForBuildPlusRuntime[
              key as keyof typeof miroirTransformersForBuildPlusRuntime
            ],
          ]),
        ),
        // transformerForBuildPlusRuntimeWithoutArray: {
        //   type: "union",
        //   optInDiscriminator: true,
        //   discriminator: ["transformerType", "interpolation"],
        //   definition: [
        //     {
        //       type: "string",
        //     },
        //     {
        //       type: "number",
        //     },
        //     { type: "boolean" },
        //     ...transformerForBuildPlusRuntimeNames.map((e: any) => ({
        //       type: "schemaReference",
        //       definition: {
        //         absolutePath: miroirFundamentalJzodSchemaUuid,
        //         relativePath: e,
        //       },
        //     })),
        //     {
        //       type: "schemaReference",
        //       definition: {
        //         absolutePath: miroirFundamentalJzodSchemaUuid,
        //         relativePath: "coreTransformerForBuildPlusRuntime_InnerReference",
        //       },
        //     },
        //     {
        //       type: "schemaReference",
        //       definition: {
        //         absolutePath: miroirFundamentalJzodSchemaUuid,
        //         relativePath: "coreTransformerForBuildPlusRuntime_dataflowSequence",
        //       },
        //     },
        //   ],
        // },
        // transformerForBuildPlusRuntime:{
        //   type: "union",
        //   optInDiscriminator: true,
        //   discriminator: ["transformerType", "interpolation"],
        //   definition: [
        //     {
        //       type: "string",
        //     },
        //     {
        //       type: "number",
        //     },
        //     { type: "boolean" },
        //     {
        //       type: "array",
        //       definition: {
        //         type: "schemaReference",
        //         definition: {
        //           absolutePath: miroirFundamentalJzodSchemaUuid,
        //           relativePath: "coreTransformerForBuildPlusRuntime",
        //         },
        //       },
        //     },
        //     ...transformerForBuildPlusRuntimeNames.map((e: any) => ({
        //       type: "schemaReference",
        //       definition: {
        //         absolutePath: miroirFundamentalJzodSchemaUuid,
        //         relativePath: e,
        //       },
        //     })),
        //     {
        //       type: "schemaReference",
        //       definition: {
        //         absolutePath: miroirFundamentalJzodSchemaUuid,
        //         relativePath: "coreTransformerForBuildPlusRuntime_InnerReference",
        //       },
        //     },
        //     {
        //       type: "schemaReference",
        //       definition: {
        //         absolutePath: miroirFundamentalJzodSchemaUuid,
        //         relativePath: "coreTransformerForBuildPlusRuntime_dataflowSequence",
        //       },
        //     },
        //   ],
        // },
        ...entityDefinitionTransformerDefinition.mlSchema.definition.transformerInterface.definition
          .inputOutput.context,
        // inputOutputObject: entityDefinitionTransformerDefinition.mlSchema.definition.transformerInterface.definition.inputOutput as any,
        transformerDefinition: entityDefinitionTransformerDefinition.mlSchema as any,
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
              description: "A section of the application (model or data)",
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
              definition: ["MetaModel", "Model", "Data", "External"],
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
              optional: true,
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
              optional: true,
              tag: {
                value: { id: 3, defaultLabel: "Entity Uuid", editable: false, canBeTemplate: true },
              },
            },
            conceptLevel: {
              type: "enum",
              definition: ["MetaModel", "Model", "Data", "External"],
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
        conceptLevel: entityDefinitionEntity.mlSchema.definition.conceptLevel,
        // {
        //   type: "enum",
        //   definition: ["MetaModel", "Model", "Data"],
        // },
        storageAccess: entityDefinitionEntity.mlSchema.definition.storageAccess,
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
          entityDefinitionTransformerTest.mlSchema.definition.definition,
          miroirFundamentalJzodSchemaUuid,
          true,
        ).context,
        transformerTestDefinition: entityDefinitionTransformerTest.mlSchema as any,
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
        adminApplication: entityDefinitionAdminApplication.mlSchema as any,
        selfApplication: entityDefinitionSelfApplicationV1.mlSchema as any,
        applicationVersion: entityDefinitionSelfApplicationVersionV1.mlSchema as any,
        bundle: entityDefinitionBundleV1.mlSchema as any,
        deployment: entityDefinitionDeployment.mlSchema as any,
        entity: entityDefinitionEntity.mlSchema as any,
        entityDefinition: entityDefinitionEntityDefinitionV1.mlSchema as any,
        testCompositeAction: (
          entityDefinitionTest.mlSchema as any
        ).definition.definition.definition.fullTestDefinition.definition.find(
          (e: any) => e.definition.testType.definition == "testCompositeAction",
        ),
        testCompositeActionSuite: (
          entityDefinitionTest.mlSchema as any
        ).definition.definition.definition.fullTestDefinition.definition.find(
          (e: any) => e.definition.testType.definition == "testCompositeActionSuite",
        ),
        testBuildCompositeAction: (
          entityDefinitionTest.mlSchema as any
        ).definition.definition.definition.fullTestDefinition.definition.find(
          (e: any) => e.definition.testType.definition == "testBuildCompositeAction",
        ),
        testBuildCompositeActionSuite: (
          entityDefinitionTest.mlSchema as any
        ).definition.definition.definition.fullTestDefinition.definition.find(
          (e: any) => e.definition.testType.definition == "testBuildCompositeActionSuite",
        ),
        testBuildPlusRuntimeCompositeAction: (
          entityDefinitionTest.mlSchema as any
        ).definition.definition.definition.fullTestDefinition.definition.find(
          (e: any) => e.definition.testType.definition == "testBuildPlusRuntimeCompositeAction",
        ),
        testBuildPlusRuntimeCompositeActionSuite: (
          entityDefinitionTest.mlSchema as any
        ).definition.definition.definition.fullTestDefinition.definition.find(
          (e: any) =>
            e.definition.testType.definition == "testBuildPlusRuntimeCompositeActionSuite",
        ),
        testCompositeActionTemplate: (
          entityDefinitionTest.mlSchema as any
        ).definition.definition.definition.fullTestDefinition.definition.find(
          (e: any) => e.definition.testType.definition == "testCompositeActionTemplate",
        ),
        testCompositeActionTemplateSuite: (
          entityDefinitionTest.mlSchema as any
        ).definition.definition.definition.fullTestDefinition.definition.find(
          (e: any) => e.definition.testType.definition == "testCompositeActionTemplateSuite",
        ),
        testAssertion: (
          entityDefinitionTest.mlSchema as any
        ).definition.definition.definition.fullTestDefinition.definition.find(
          (e: any) => e.definition.testType.definition == "testAssertion",
        ),
        test: entityDefinitionTest.mlSchema as any,
        testCompositeActionParams,
        // deployment:
        //   entityDefinitionSelfApplicationDeploymentConfiguration.mlSchema as any,
        // selfApplication: entityDefinitionSelfApplicationV1.mlSchema as JzodObject,
        // applicationVersion: entityDefinitionSelfApplicationVersionV1.mlSchema as JzodObject,
        // bundle: entityDefinitionBundleV1.mlSchema as JzodObject,
        // deployment: entityDefinitionDeployment.mlSchema as JzodObject,
        // entity: entityDefinitionEntity.mlSchema as JzodObject,
        // entityDefinition: entityDefinitionEntityDefinitionV1.mlSchema as JzodObject,
        ...(entityDefinitionMenu.mlSchema.definition.definition as any).context,
        menu: entityDefinitionMenu.mlSchema as any,
        // menu: entityDefinitionMenu.mlSchema as JzodObject,
        reportDisplayParams: {
          type: "object",
          definition: {
            application: {
              type: "uuid",
              tag: { value: { defaultLabel: "Application", canBeTemplate: true } },
            },
            instance: {
              type: "uuid",
              optional: true,
              tag: { value: { defaultLabel: "Instance", canBeTemplate: true } },
            },
            report: {
              type: "uuid",
              tag: { value: { defaultLabel: "Report", canBeTemplate: true } },
            },
          },
        },
        graphConfig: (entityDefinitionReportV1 as any).mlSchema.definition.definition.context
          .graphReportSection.definition.definition.definition.config,
        ...Object.fromEntries(
          Object.entries(
            (entityDefinitionReportV1 as any).mlSchema.definition.definition.context,
          ).filter((e) =>
            [
              // TODO: remove this filter, this introduces unnecessary coupling
              "accordionReportSection",
              "graphReportSection",
              "gridReportSection",
              "jsonReportSection",
              "listReportSection",
              "markdownReportSection",
              "modelDiagramReportSection",
              "objectInstanceReportSection",
              "objectListReportSection",
              "runnerReportSection",
              "storedReportDisplay",
              "reportSection",
              "rootReport",
              "runStoredQuery",
            ].includes(e[0]),
          ),
        ),
        jzodObjectOrReference: (entityDefinitionJzodSchemaV1 as any).mlSchema.definition.definition
          .context.jzodObjectOrReference,
        mlSchema: entityDefinitionJzodSchemaV1.mlSchema as any,
        // mlSchema: entityDefinitionJzodSchemaV1.mlSchema as JzodObject,
        report: (entityDefinitionReportV1 as any).mlSchema,
        dataSet: {
          type: "object",
          definition: {
            applicationUuid: {
              type: "uuid",
            },
            instances: {
              type: "array",
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: miroirFundamentalJzodSchemaUuid,
                  relativePath: "entityInstance",
                  // relativePath: "entityInstanceCollection",
                },
              },
            },
          },
        },
        metaModel: {
          type: "object",
          definition: {
            applicationUuid: {
              type: "uuid",
            },
            applicationName: {
              type: "string",
            },
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
            applications: {
              type: "array",
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: miroirFundamentalJzodSchemaUuid,
                  relativePath: "selfApplication",
                },
              },
            },
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
            endpoints: {
              type: "array",
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: miroirFundamentalJzodSchemaUuid,
                  relativePath: "endpointDefinition",
                },
              },
            },
            jzodSchemas: {
              type: "array",
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: miroirFundamentalJzodSchemaUuid,
                  // relativePath: "mlSchema",
                  relativePath: "mlSchema",
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
            runners: {
              type: "array",
              definition: {
                type: "any",
                /** runner creates a circular dependency on mlSchemaTemplate
                 * the simpler solution is to not include runner in the metaModel,
                 * MetaModel being used by ancillary tools, not by the user,
                 * the contents of a MetaModel will generally not be viewed directly by the user.
                 * Extra FIX: add the dependency to mlSchemaTemplate as a runtime type.
                 */
                // type: "schemaReference",
                // definition: {
                //   absolutePath: miroirFundamentalJzodSchemaUuid,
                //   relativePath: "runner",
                // },
              },
            },
            themes: {
              type: "array",
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: miroirFundamentalJzodSchemaUuid,
                  relativePath: "storedMiroirTheme",
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
            forceNullOptionalAttributeToUndefined: {
              type: "boolean",
              optional: true,
              tag: {
                value: { defaultLabel: "Force Null Optional Attribute To Undefined" },
                initializeTo: { initializeToType: "value", value: true },
              },
            },
          },
        },
        mongoDbStoreSectionConfiguration: {
          type: "object",
          definition: {
            emulatedServerType: { type: "literal", definition: "mongodb" },
            connectionString: { type: "string" },
            database: { type: "string" },
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
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "mongoDbStoreSectionConfiguration",
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
            ...entityDefinitionCommit.mlSchema.definition,
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
        // ...(makeReferencesAbsolute(entityDefinitionQueryVersionV1.mlSchema.definition.definition,miroirFundamentalJzodSchemaUuid) as any).context,
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
              tag: {
                value: {
                  canBeTemplate: false,
                },
              },
              definition: "localCacheEntityInstancesExtractor",
            },
            definition: {
              type: "object",
              definition: {
                application: {
                  type: "uuid",
                  tag: { value: { defaultLabel: "Uuid", editable: false } },
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
            application: {
              // TODO: REPLACE WITH APPLICATION UUID OR LEAVE IT OPTIONAL
              type: "uuid",
              tag: {
                value: {
                  canBeTemplate: true,
                  defaultLabel: "Application",
                  foreignKeyParams: {
                    targetApplicationUuid: "55af124e-8c05-4bae-a3ef-0933d41daa92",
                    targetEntity: "25d935e7-9e93-42c2-aade-0472b883492b",
                    targetEntityOrderInstancesBy: "name",
                  },
                  initializeTo: {
                    initializeToType: "transformer",
                    transformer: {
                      transformerType: "getFromParameters",
                      referencePath: ["applicationUuid"],
                    },
                  },
                  display: { editable: false },
                },
              },
            },
            pageParams: {
              type: "record",
              optional: true,
              definition: {
                type: "any",
              },
            },
            queryParams: {
              type: "record",
              optional: true,
              definition: {
                type: "any",
              },
            },
            contextResults: {
              type: "record",
              optional: true,
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
              tag: {
                value: {
                  canBeTemplate: false,
                },
              },
              definition: "boxedExtractorOrCombinerReturningObject",
            },
            select: {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "extractorOrCombinerReturningObject", // TODO: is this still an extractor, while it includes extractorTemplateCombinerOneToOne?
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
              tag: {
                value: {
                  canBeTemplate: false,
                },
              },
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
              tag: {
                value: {
                  canBeTemplate: false,
                },
              },
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
                  relativePath: "coreTransformerForBuildPlusRuntime",
                },
              },
            },
          },
        },
        boxedQueryTemplateWithExtractorCombinerTransformer: {
          /**
           *  TODO:REMOVE?
           * seems a duplicate of boxedQueryWithExtractorCombinerTransformer, but with extractorTemplates and combinerTemplates instead of extractors and combiners
           * see "extractorOrCombinerTemplate" in `359f1f9b-7260-4d76-a864-72c839b9711b.json`
           * is this used at all?
           * */

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
              tag: {
                value: {
                  canBeTemplate: false,
                },
              },
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
                  relativePath: "coreTransformerForBuildPlusRuntime",
                },
              },
            },
          },
        },
        miroirQueryTemplate: {
          type: "union",
          discriminator: "queryType",
          definition: [
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
          ],
        },
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        ______________________________________________runners_____________________________________________:
          {
            type: "never",
          },
        runner: entityDefinitionRunner.mlSchema,
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
          (a: any) => a.actionParameters.actionType.definition == "initModel",
        )?.actionParameters.payload.definition.params,
        modelActionCommit: {
          type: "object",
          definition: modelEndpointVersionV1.definition.actions.find(
            (a: any) => a.actionParameters.actionType.definition == "commit",
          )?.actionParameters,
        },
        modelActionRollback: {
          type: "object",
          definition: modelEndpointVersionV1.definition.actions.find(
            (a: any) => a.actionParameters.actionType.definition == "rollback",
          )?.actionParameters,
        },
        modelActionInitModel: {
          type: "object",
          definition: modelEndpointVersionV1.definition.actions.find(
            (a: any) => a.actionParameters.actionType.definition == "initModel",
          )?.actionParameters,
        },
        modelActionResetModel: {
          type: "object",
          definition: modelEndpointVersionV1.definition.actions.find(
            (a: any) => a.actionParameters.actionType.definition == "resetModel",
          )?.actionParameters,
        },
        modelActionResetData: {
          type: "object",
          tag: { value: { display: { displayedAttributeValueWhenFolded: "actionLabel" } } },
          definition: modelEndpointVersionV1.definition.actions.find(
            (a: any) => a.actionParameters.actionType.definition == "resetData",
          )?.actionParameters,
        },
        modelActionAlterEntityAttribute: {
          type: "object",
          tag: { value: { display: { displayedAttributeValueWhenFolded: "actionLabel" } } },
          definition: modelEndpointVersionV1.definition.actions.find(
            (a: any) => a.actionParameters.actionType.definition == "alterEntityAttribute",
          )?.actionParameters,
        },
        modelActionCreateEntity: {
          type: "object",
          tag: { value: { display: { displayedAttributeValueWhenFolded: "actionLabel" } } },
          definition: modelEndpointVersionV1.definition.actions.find(
            (a: any) => a.actionParameters.actionType.definition == "createEntity",
          )?.actionParameters,
        },
        modelActionDropEntity: {
          type: "object",
          tag: { value: { display: { displayedAttributeValueWhenFolded: "actionLabel" } } },
          definition: modelEndpointVersionV1.definition.actions.find(
            (a: any) => a.actionParameters.actionType.definition == "dropEntity",
          )?.actionParameters,
        },
        modelActionRenameEntity: {
          type: "object",
          tag: { value: { display: { displayedAttributeValueWhenFolded: "actionLabel" } } },
          definition: modelEndpointVersionV1.definition.actions.find(
            (a: any) => a.actionParameters.actionType.definition == "renameEntity",
          )?.actionParameters,
        },
        modelAction: {
          type: "union",
          discriminator: "actionType",
          definition: modelEndpointVersionV1.definition.actions.map((e: any) => ({
            type: "object",
            tag: { value: { display: { displayedAttributeValueWhenFolded: "actionLabel" } } },
            definition: e.actionParameters,
          })),
        },
        testAction_runTestCompositeAction: {
          type: "object",
          definition: testEndpointVersionV1.definition.actions.find(
            (a: any) => a.actionParameters.actionType.definition == "runTestCompositeAction",
          )?.actionParameters,
        },
        testAction_runTestCase: {
          type: "object",
          definition: testEndpointVersionV1.definition.actions.find(
            (a: any) => a.actionParameters.actionType.definition == "runTestCase",
          )?.actionParameters,
        },
        instanceCUDAction: {
          type: "union",
          discriminator: "actionType",
          definition: instanceEndpointVersionV1.definition.actions
            .filter((e: any) =>
              ["createInstance", "updateInstance", "deleteInstance"].includes(
                e.actionParameters.actionType.definition,
              ),
            )
            .map((e: any) => ({
              type: "object",
              tag: { value: { display: { displayedAttributeValueWhenFolded: "actionLabel" } } },
              definition: e.actionParameters,
            })),
        },
        instanceAction: {
          type: "union",
          discriminator: "actionType",
          definition: instanceEndpointVersionV1.definition.actions.map((e: any) => ({
            type: "object",
            tag: { value: { display: { displayedAttributeValueWhenFolded: "actionLabel" } } },
            definition: e.actionParameters,
          })),
        },
        undoRedoAction: {
          type: "union",
          discriminator: "actionType",
          definition: undoRedoEndpointVersionV1.definition.actions.map((e: any) => ({
            type: "object",
            tag: { value: { display: { displayedAttributeValueWhenFolded: "actionLabel" } } },
            definition: e.actionParameters,
          })),
        },
        transactionalInstanceAction: {
          type: "object",
          tag: { value: { display: { displayedAttributeValueWhenFolded: "actionLabel" } } },
          definition: domainEndpointVersionV1.definition.actions.find(
            (a: any) =>
              a.actionParameters.actionType &&
              a.actionParameters.actionType.definition == "transactionalInstanceAction",
          )?.actionParameters,
        },
        localCacheAction: {
          type: "union",
          discriminator: "actionType",
          definition: [
            // undoRedoAction
            {
              type: "schemaReference",
              optional: false,
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "undoRedoAction",
              },
            },
            // transactionalInstanceAction
            {
              type: "schemaReference",
              optional: false,
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "transactionalInstanceAction",
              },
            },
            // modelAction
            {
              type: "schemaReference",
              optional: false,
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "modelAction",
              },
            },
            // instanceAction
            {
              type: "schemaReference",
              optional: false,
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "instanceAction",
              },
            },
            ...localCacheEndpointVersionV1.definition.actions.map(
              (e: Record<string, JzodElement>) => ({
                type: "object",
                definition: e.actionParameters,
              }),
            ),
          ],
        },
        storeManagementAction: {
          type: "union",
          discriminator: "actionType",
          definition: storeManagementEndpoint.definition.actions.map((e: any) => ({
            type: "object",
            definition: e.actionParameters,
          })),
        },
        persistenceAction: {
          type: "union",
          discriminator: "actionType",
          definition: [
            // runBoxedQueryAction
            {
              type: "schemaReference",
              optional: false,
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "runBoxedQueryAction",
              },
            },
            // runBoxedQueryTemplateAction
            {
              type: "schemaReference",
              optional: false,
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "runBoxedQueryTemplateAction",
              },
            },
            // bundleAction
            {
              type: "schemaReference",
              optional: false,
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "bundleAction",
              },
            },
            // instanceAction
            {
              type: "schemaReference",
              optional: false,
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "instanceAction",
              },
            },
            // modelAction
            {
              type: "schemaReference",
              optional: false,
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "modelAction",
              },
            },
            // storeManagementAction
            {
              type: "schemaReference",
              optional: false,
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "storeManagementAction",
              },
            },
            ...persistenceEndpointVersionV1.definition.actions.map(
              (e: Record<string, JzodElement>) => ({
                type: "object",
                definition: e.actionParameters,
              }),
            ),
          ],
        },
        localPersistenceAction: {
          type: "union",
          discriminator: "actionType",
          definition: persistenceEndpointVersionV1.definition.actions.slice(0, 3).map((e: any) => ({
            type: "object",
            definition: e.actionParameters,
          })),
        },
        restPersistenceAction: {
          type: "union",
          discriminator: "actionType",
          definition: persistenceEndpointVersionV1.definition.actions.slice(4).map((e: any) => ({
            type: "object",
            definition: e.actionParameters,
          })),
        },
        runBoxedQueryTemplateAction: {
          type: "object",
          definition: queryEndpointVersionV1.definition.actions[0].actionParameters,
        },
        // runBoxedExtractorTemplateAction: {
        //   type: "object",
        //   definition: queryEndpointVersionV1.definition.actions[3].actionParameters,
        // },
        runBoxedQueryAction: {
          type: "object",
          definition: queryEndpointVersionV1.definition.actions[1].actionParameters,
        },
        // ################################################################################
        compositeRunBoxedQueryAction: {
          type: "object",
          definition: domainEndpointVersionV1.definition.actions.find(
            (a: any) =>
              a.actionParameters?.actionType?.definition == "compositeRunBoxedQueryAction",
          )?.actionParameters,
        },
        compositeRunBoxedQueryTemplateAction: {
          type: "object",
          definition: domainEndpointVersionV1.definition.actions.find(
            (a: any) =>
              a.actionParameters?.actionType?.definition == "compositeRunBoxedQueryTemplateAction",
          )?.actionParameters,
        },
        compositeActionDefinition: domainEndpointVersionV1.definition.actions.find(
          (a: any) => a.actionParameters?.actionType?.definition == "compositeActionSequence",
        )?.actionParameters.payload.definition.actionSequence.definition,
        compositeRunTestAssertion: {
          type: "object",
          tag: {
            value: {
              display: {
                displayedAttributeValueWhenFolded: "actionLabel",
              },
            },
          },
          definition: {
            actionType: {
              type: "literal",
              tag: {
                value: {
                  canBeTemplate: false,
                },
              },
              definition: "compositeRunTestAssertion",
            },
            actionLabel: {
              type: "string",
              optional: true,
            },
            nameGivenToResult: {
              type: "string",
            },
            testAssertion: {
              type: "schemaReference",
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "testAssertion",
              },
            },
          },
        },
        compositeAction: {
          type: "union",
          tag: {
            value: {
              canBeTemplate: false,
            },
          },
          discriminator: "actionType",
          definition: [
            {
              type: "schemaReference",
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "domainAction",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "compositeActionSequence",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "compositeRunTestAssertion",
              },
            },
          ],
        },
        compositeActionSequence: {
          type: "object",
          definition: domainEndpointVersionV1.definition.actions.find(
            (a: any) => a.actionParameters?.actionType?.definition == "compositeActionSequence",
          )?.actionParameters,
        },
        // ################################################################################
        // ################################################################################
        // ################################################################################
        // ################################################################################
        // ################################################################################
        // ################################################################################
        // ################################################################################
        // buildCompositeAction: {
        //   type: "object",
        //   definition: {
        //     actionType: { type: "literal", definition: "compositeActionSequence" },
        //     actionName: { type: "literal", definition: "sequence" },
        //     actionLabel: { type: "string", optional: true },
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
        //               relativePath: "buildDomainAction",
        //             },
        //           },
        //           {
        //             type: "schemaReference",
        //             definition: {
        //               absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        //               relativePath: "buildCompositeAction",
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
              // "buildPlusRuntimeDomainAction_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeActionSequence",
              "miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeActionSequence",
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
        domainAction: {
          type: "union",
          discriminator: "actionType",
          definition: [
            // instanceAction
            {
              type: "schemaReference",
              optional: false,
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "instanceAction",
              },
            },
            // modelAction
            {
              type: "schemaReference",
              optional: false,
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "modelAction",
              },
            },
            // undoRedoAction
            {
              type: "schemaReference",
              optional: false,
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "undoRedoAction",
              },
            },
            // storeOrBundleAction
            {
              type: "schemaReference",
              optional: false,
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "storeOrBundleAction",
              },
            },
            ...domainEndpointVersionV1.definition.actions.map((e: Record<string, JzodElement>) => ({
              type: "object",
              definition: e.actionParameters,
            })),
          ],
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
                payload: {
                  type: "object",
                  definition: {
                    application: {
                      type: "uuid",
                      tag: { value: { defaultLabel: "Application", editable: false } },
                    },
                  },
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
                payload: {
                  type: "object",
                  definition: {
                    application: {
                      type: "uuid",
                      tag: { value: { defaultLabel: "Application", editable: false } },
                    },
                  },
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
        ...entityDefinitionEndpointDefinition.mlSchema.definition.definition.definition.actions
          .context,
        // endpointDefinition: entityDefinitionEndpointDefinition.mlSchema.definition.definition,
        endpointDefinition: entityDefinitionEndpointDefinition.mlSchema,
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ########################################################################################
        // ______________________________________________reports_____________________________________________:
        //   {
        //     type: "never",
        //   },
        //   reportDisplayParams: {
        //     type: "object",
        //     definition: {
        //       application: {
        //         type: "uuid",
        //         tag: { value: { defaultLabel: "Application", canBeTemplate: true } },
        //       },
        //       instance: {
        //         type: "uuid",
        //         optional: true,
        //         tag: { value: { defaultLabel: "Instance", canBeTemplate: true } },
        //       },
        //       report: {
        //         type: "uuid",
        //         tag: { value: { defaultLabel: "Report", canBeTemplate: true } },
        //       }
        //     }
        //   }
        ______________________________________________themes_____________________________________________:
          {
            type: "never",
          },
        tableThemeSchema: tableThemeSchemaJson,
        storedMiroirTheme: miroirThemeSchemaJson,
        miroirThemeFull: makeObjectsMandatory(miroirThemeSchemaJson as any),
      },
      definition: {
        absolutePath: miroirFundamentalJzodSchemaUuid,
        relativePath: "miroirAllFundamentalTypesUnion",
      },
    },
  };

  _phaseTimings.push({phase: "miroirFundamentalJzodSchema construction", ms: Date.now() - _t_start});
  let _t_phase = Date.now();
  const nullEntries = Object.entries(miroirFundamentalJzodSchema.definition.context).filter((e) => !e[1]);
  log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
  log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
  log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
  log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
  log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
  log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
  log.info("getMiroirFundamentalJzodSchema nullEntries in miroirFundamentalJzodSchema.definition.context", nullEntries.length, JSON.stringify(nullEntries, null, 2));
  log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
  log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
  log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
  log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
  log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
  log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
  log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
  log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")

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
  _phaseTimings.push({phase: "absoluteMiroirFundamentalJzodSchema", ms: Date.now() - _t_phase});
  _t_phase = Date.now();

  // const addExtraItems: string[] = [
  //   // "reportDisplayParams",
  // ];

  // ##############################################################################
  log.info("getMiroirFundamentalJzodSchema calculating extendedSchemas...");
  const extendedSchemas: string[] = getExtendedSchemas(jzodSchemajzodMiroirBootstrapSchema.definition.context);

  log.info(
    "getMiroirFundamentalJzodSchema extendedSchemas",
    extendedSchemas.length,
    JSON.stringify(extendedSchemas, null, 2)
  );

  // ##############################################################################
  // ##############################################################################
  // ##############################################################################
  // ##############################################################################
  // ##############################################################################
  // ##############################################################################
  // coreTransformerForBuildPlusRuntime + JZOD ELEMENTS
  const jzodElementDependenciesJzodReference = getDependencySet(
    jzodSchemajzodMiroirBootstrapSchema,
    miroirFundamentalJzodSchema.definition,
    absoluteMiroirFundamentalJzodSchema,
    "jzodElement",
  );
  _phaseTimings.push({phase: "jzodElementDependencySet", ms: Date.now() - _t_phase});
  _t_phase = Date.now();

  const coreTransformerForBuildPlusRuntimeCarryOnSchemaReference: JzodReference = {
    type: "schemaReference",
    definition: {
      absolutePath: miroirFundamentalJzodSchemaUuid,
      relativePath: "coreTransformerForBuildPlusRuntime",
    },
  };
  const coreTransformerForBuildPlusRuntimeForArrayCarryOnSchemaReference: JzodReference = {
    type: "schemaReference",
    definition: {
      absolutePath: miroirFundamentalJzodSchemaUuid,
      relativePath: "coreTransformerForBuildPlusRuntimeWithoutArray",
    },
  };

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // //  DomainAction & transformerForBuildPlusRuntime -- computed FIRST so jzodElement can skip duplicates
  const domainAction = (miroirFundamentalJzodSchema as any).definition.context["domainAction"]

  const domainActionDependencySet = jzodTransitiveDependencySet(
    miroirFundamentalJzodSchema.definition,
    "domainAction",
    true, // includeExtend
  );

  // // TODO: HACK!! forcing jzod schema definition into compositeActionDependencySet
  Object.keys((jzodSchemajzodMiroirBootstrapSchema as any).definition.context).forEach((key) => {
    domainActionDependencySet.add(key);
  });

  _phaseTimings.push({phase: "domainActionDependencySet", ms: Date.now() - _t_phase});
  _t_phase = Date.now();

  log.info("########################################## Create buildPlusRuntimeDomainAction templates...");
  const {
    carryOnDomainActionLocalizedInnerResolutionStoreForExtendedSchemas:
      buildPlusRuntimeDomainActionLocalizedInnerResolutionStoreForExtendedSchemas,
    domainActionLocalizedInnerResolutionStorePlainReferences:
      buildPlusRuntimeDomainActionLocalizedInnerResolutionStorePlainReferences,
    carryOnDomainActionSchemaBuilder: buildPlusRuntimeDomainActionSchemaBuilder,
  } = createDomainActionCarryOnSchemaResolver(
    domainAction,
    coreTransformerForBuildPlusRuntimeCarryOnSchemaReference,
    coreTransformerForBuildPlusRuntimeForArrayCarryOnSchemaReference,
    ["transformerType", "interpolation"],
    domainActionDependencySet,
    "miroirTemplate_", // prefix
    false, // alwaysPropagate
    absoluteMiroirFundamentalJzodSchema,
    extendedSchemas
  );
  log.info("########################################## Create buildPlusRuntimeDomainAction templates DONE.");
  _phaseTimings.push({phase: "createDomainActionCarryOnSchemaResolver", ms: Date.now() - _t_phase});
  _t_phase = Date.now();

  // Collect all keys produced by domainAction stores — jzodElement computation will skip them
  // since they are overwritten in the final context spread anyway.
  const domainActionProducedKeys = new Set([
    ...Object.keys(buildPlusRuntimeDomainActionLocalizedInnerResolutionStoreForExtendedSchemas),
    ...Object.keys(buildPlusRuntimeDomainActionLocalizedInnerResolutionStorePlainReferences),
  ]);

  const jzodElementWithCarryOnContext = getJzodElementWithCarryOnContext(
    "miroirTemplate_",
    coreTransformerForBuildPlusRuntimeCarryOnSchemaReference,
    coreTransformerForBuildPlusRuntimeForArrayCarryOnSchemaReference,
    [
      "jzodBaseObject",
      "transformer_inner_label",
      "transformer_orderBy",
      "transformerForBuildPlusRuntime_Abstract",
      "transformerForBuildPlusRuntime_optional_Abstract",
    ],
    jzodElementDependenciesJzodReference,
    domainActionProducedKeys, // skip entries already produced by domainAction stores
  );
  _phaseTimings.push({phase: "getJzodElementWithCarryOnContext", ms: Date.now() - _t_phase});
  _t_phase = Date.now();

  // ##############################################################################################
  const miroirFundamentalJzodSchemaWithActionTemplate: any = {
    ...miroirFundamentalJzodSchema,
    definition: {
      ...miroirFundamentalJzodSchema.definition,
      context: {
        ...((miroirFundamentalJzodSchema.definition as any)?.context ?? {}),
        ______________________________________________jzodElementWithCarryOnContext________________________________________________:
          { type: "any" },
        ...jzodElementWithCarryOnContext,
        ______________________________________________buildPlusRuntimeDomainActionLocalizedInnerResolutionStoreForExtendedSchemas_______________________:
          { type: "any" },
        ...buildPlusRuntimeDomainActionLocalizedInnerResolutionStoreForExtendedSchemas,
        ______________________________________________buildPlusRuntimeDomainActionLocalizedInnerResolutionStorePlainReferences_______________________:
          { type: "any" },
        ...buildPlusRuntimeDomainActionLocalizedInnerResolutionStorePlainReferences,
        ______________________________________________buildPlusRuntimeDomainAction_______________________:
          { type: "any" },
        buildPlusRuntimeDomainAction: buildPlusRuntimeDomainActionSchemaBuilder.resultSchema,
        compositeActionTemplate: {
          type: "schemaReference",
          definition: {
            absolutePath: miroirFundamentalJzodSchemaUuid,
            relativePath: "buildPlusRuntimeCompositeAction",
          },
        }, // compositeActionTemplate: THAT's THE RESULT OF THE WHOLE MOVEMENT!
        mlSchemaTemplate: {
          type: "schemaReference",
          definition: {
            absolutePath: miroirFundamentalJzodSchemaUuid,
            relativePath: "miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement",
          },
        },
      } as Record<string, any /**JzodElement */>,
    } as any /** JzodObjectOrReference */,
  };
  // log.info("entityDefinitionQueryVersionV1WithAbsoluteReferences=",JSON.stringify(entityDefinitionQueryVersionV1WithAbsoluteReferences))
  _phaseTimings.push({phase: "final context assembly", ms: Date.now() - _t_phase});
  const _t_total = Date.now() - _t_start;
  const _phaseSummary = _phaseTimings
    .map((p) => `  ${p.phase}: ${p.ms}ms (${_t_total > 0 ? Math.round(100 * p.ms / _t_total) : 0}%)`)
    .join("\n");
  log.info(
    `getMiroirFundamentalJzodSchema phase timings (total ${_t_total}ms):\n${_phaseSummary}`
  );

  return miroirFundamentalJzodSchemaWithActionTemplate;

}
