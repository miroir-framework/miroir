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
  createLocalizedInnerResolutionStoreForExtendedSchemas,
  getCarryOnSchemaBuilder,
  getExtendedSchemas,
  makeReferencesAbsolute,
  miroirFundamentalJzodSchemaUuid,
  resolveReferencesWithCarryOn,
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

export const entityDefinitionRoot = {
  type: "object",
  definition: {
    uuid: {
      type: "uuid",
      tag: {
        value: {
          id: 1,
          defaultLabel: "Uuid",
          display: { editable: false },
        },
      },
    },
    parentName: {
      type: "string",
      "optional": true,
      tag: {
        value: {
          id: 2,
          defaultLabel: "Entity Name",
          display: { editable: false },
        },
      },
    },
    parentUuid: {
      type: "uuid",
      tag: {
        value: {
          id: 3,
          defaultLabel: "Entity Uuid",
          display: { editable: false },
          // targetApplicationUuid: {
          //   transformerType: "ifThenElse",
          //   interpolation: "build",
          //   if: {
          //     transformerType: "boolExpr",
          //     interpolation: "build",
          //     operator: "==",
          //     left: {
          //       transformerType: "getFromParameters",
          //       interpolation: "build",
          //       safe: true,
          //       referencePath: ["dropEntity", "application"],
          //     },
          //     right: {
          //       transformerType: "returnValue",
          //       interpolation: "build",
          //       value: true,
          //     },
          //   },
          //   then: {
          //     transformerType: "getFromParameters",
          //     interpolation: "build",
          //     safe: true,
          //     referencePath: ["dropEntity", "application"],
          //   },
          //   else: {
          //     transformerType: "returnValue",
          //     interpolation: "build",
          //     value: "31f3a03a-f150-416d-9315-d3a752cb4eb4",
          //   },
          // },
          foreignKeyParams: {
            targetEntityApplicationSection: "model",
            targetEntity: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
            targetEntityOrderInstancesBy: "name",
          },
          initializeTo: {
            initializeToType: "value",
            value: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
          },
        },
      },
    },
    parentDefinitionVersionUuid: {
      type: "uuid",
      optional: true,
      tag: {
        value: {
          id: 4,
          defaultLabel: "Entity Definition Version Uuid",
          display: { editable: false },
          foreignKeyParams: {
            targetEntityApplicationSection: "model",
            targetEntity: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
            targetEntityOrderInstancesBy: "name",
          },
        },
      },
    },
    conceptLevel: {
      tag: {
        value: {
          display: {
            editable: false,
          },
          defaultLabel: "Concept Level",
          id: 5,
        },
      },
      type: "enum",
      optional: true,
      definition: ["MetaModel", "Model", "Data", "External"],
    },
  },
};

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
  // entityDefinitionSelfApplicationDeploymentConfiguration: any,
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
  const extraQueryElements: Record<string, any /*JzodElement*/> = {
    // localCacheExtractor: {
    //   type: "object",
    //   definition: {
    //     queryType: {
    //       type: "literal",
    //       tag: {
    //         value: {
    //           canBeTemplate: false,
    //         },
    //       },
    //       definition: "localCacheEntityInstancesExtractor",
    //     },
    //     definition: {
    //       type: "object",
    //       definition: {
    //         application: {
    //           type: "uuid",
    //           tag: { value: { defaultLabel: "Uuid", editable: false } },
    //         },
    //         applicationSection: {
    //           type: "schemaReference",
    //           optional: true,
    //           definition: {
    //             absolutePath: miroirFundamentalJzodSchemaUuid,
    //             relativePath: "applicationSection",
    //           },
    //         },
    //         entityUuid: {
    //           type: "uuid",
    //           optional: true,
    //           tag: { value: { id: 1, defaultLabel: "Entity", editable: false } },
    //         },
    //         instanceUuid: {
    //           type: "uuid",
    //           optional: true,
    //           tag: { value: { id: 1, defaultLabel: "Instance", editable: false } },
    //         },
    //       },
    //     },
    //   },
    // },
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
  };
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
        ______________________________________________bootstrap_____________________________________________:
          {
            type: "never",
          },
        ...(
          makeReferencesAbsolute(
            // jzodSchemajzodMiroirBootstrapSchema.definition as JzodElement,
            jzodSchemajzodMiroirBootstrapSchema.definition as any,
            miroirFundamentalJzodSchemaUuid,
            true,
          ) as any
        ).context,
        ______________________________________________basic_____________________________________________:
          {
            type: "never",
          },
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
        reportLink: {
          type: "object",
          tag: {
            value: {
              defaultLabel: "ReportLink",
            },
          },
          definition: {
            label: {
              type: "string",
            },
            section: {
              type: "schemaReference",
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "applicationSection",
              },
            },
            selfApplication: {
              type: "string",
              validations: [
                {
                  type: "uuid",
                },
              ],
              tag: {
                value: {
                  id: 1,
                  defaultLabel: "SelfApplication",
                  display: { editable: false },
                },
              },
            },
            reportUuid: {
              type: "string",
              optional: true,
              validations: [
                {
                  type: "uuid",
                },
              ],
              tag: {
                value: {
                  id: 1,
                  defaultLabel: "Report",
                },
              },
            },
            instanceUuid: {
              type: "string",
              optional: true,
              validations: [
                {
                  type: "uuid",
                },
              ],
              tag: {
                value: {
                  id: 1,
                  defaultLabel: "Instance",
                },
              },
            },
            icon: {
              type: "schemaReference",
              optional: true,
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "miroirIcon",
              },
            },
          },
        },
        entityDefinitionRoot,
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
            miroirCoreTransformersForBuildPlusRuntime[
              key as keyof typeof miroirCoreTransformersForBuildPlusRuntime
            ],
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
        coreTransformerForBuildPlusRuntime: {
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
        // // ########################################################################################
        // // ########################################################################################
        // // WRONG!!!! (???)
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
        conceptLevel: entityDefinitionRoot.definition.conceptLevel,
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
        ...(entityDefinitionMenu.mlSchema.definition.definition as any).context,
        menu: entityDefinitionMenu.mlSchema as any,
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
              "inputReportSection",
              "jsonReportSection",
              "listReportSection",
              "markdownReportSection",
              "modelDiagramReportSection",
              "objectInstanceReportSection",
              "objectListReportSection",
              "runnerReportSection",
              "transformerRunnerReportSection",
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
                  relativePath: "entityInstance"
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
        // ########################################################################################
        // QUERIES    #############################################################################
        // ########################################################################################
        ______________________________________________queries_____________________________________________:
          {
            type: "never",
          },
        /**
         * HACK:
         * extractorOrCombinerTemplate / extractorOrCombinerTemplateRecord are used in entityDefinitionQueryVersionV1WithAbsoluteReferences
         * although they require to have passed the template generation phase
         * this works only because the template generation phase ignores references starting by "miroirTemplate_" and
         * reproduces them as is in the generated schema, allowing to break the circular dependency
         *
         * TODO: we need a CLEAN solution to enable template-producing Entity definition,
         * or should this remain absolutely local, because it does not make sense in the general case
         * TODO: this seema to induce a display problem in the Jzod element editor, with the "extractorWrapperReturningObject" case
         *  (it should display an error if incorrect, in this case `itemsOrder= []`).
         */
        extractorOrCombinerTemplate: {
          type: "schemaReference",
          definition: {
            // reference starting by "miroirTemplate_" will be reproduced as is by template generation
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombiner",
          },
        },
        extractorOrCombinerTemplateRecord: {
          type: "record",
          definition: {
            type: "schemaReference",
            definition: {
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "extractorOrCombinerTemplate",
            },
          },
        },
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
        ...extraQueryElements,
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
        // buildPlusRuntimeCompositeAction: {
        //   type: "schemaReference",
        //   definition: {
        //     absolutePath: miroirFundamentalJzodSchemaUuid,
        //     relativePath:
        //       // "buildPlusRuntimeDomainAction_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeActionSequence",
        //       "miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeActionSequence",
        //   },
        // },
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
        ___________________________________applicative_transformers______________________________________:
          {
            type: "never",
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
        transformerForBuildPlusRuntime_duplicateApplicationModel:
          miroirTransformersForBuildPlusRuntime.transformer_duplicateApplicationModel,

        transformerForBuildPlusRuntime_menu_addItem:
          miroirTransformersForBuildPlusRuntime.transformer_menu_addItem,
        //
        transformerForBuildPlusRuntime_ansiColumnsToJzodSchema:
          miroirTransformersForBuildPlusRuntime.transformer_ansiColumnsToJzodSchema,
        // MLS
        ...Object.fromEntries(
          Object.entries(mlsTransformers).map(([key, value]) => [
            key.replace("transformer_", "transformerForBuildPlusRuntime_"),
            miroirTransformersForBuildPlusRuntime[
              key as keyof typeof miroirTransformersForBuildPlusRuntime
            ],
          ]),
        ),
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
  // EXTENDED SCHEMAS RESOLUTION STORE
  const localizedInnerResolutionStoreForExtendedSchemas = createLocalizedInnerResolutionStoreForExtendedSchemas(
    absoluteMiroirFundamentalJzodSchema.definition, //domainActiondependenciesJzodReference,
    extendedSchemas,
    coreTransformerForBuildPlusRuntimeCarryOnSchemaReference,
    coreTransformerForBuildPlusRuntimeForArrayCarryOnSchemaReference,
    ["transformerType", "interpolation"],
    resolveReferencesWithCarryOn.bind(
      undefined,
      {
        // [miroirFundamentalJzodSchemaUuid]: domainActiondependenciesJzodReference
        [miroirFundamentalJzodSchemaUuid]: absoluteMiroirFundamentalJzodSchema.definition
      }
    ),
    "miroirTemplate_", // prefix
    false, // alwaysPropagate
  );

  console.log(
    "getMiroirFundamentalJzodSchema - extendedSchemasResolutionStore - localizedInnerResolutionStoreForExtendedSchemas",
    JSON.stringify(Object.keys(localizedInnerResolutionStoreForExtendedSchemas), null, 2),
  );
  const absoluteMiroirFundamentalJzodSchemaWithExtendedSchemas = {
    ...absoluteMiroirFundamentalJzodSchema,
    definition: {
      ...absoluteMiroirFundamentalJzodSchema.definition,
      context: {
        ...absoluteMiroirFundamentalJzodSchema.definition.context,
        ...localizedInnerResolutionStoreForExtendedSchemas,
      },
    },
  }

  // console.log(
  //   "getMiroirFundamentalJzodSchema - extendedSchemasResolutionStore - absoluteMiroirFundamentalJzodSchemaWithExtendedSchemas",
  //   JSON.stringify(Object.keys(absoluteMiroirFundamentalJzodSchemaWithExtendedSchemas.definition.context), null, 2),
  // );
  _phaseTimings.push({phase: "extendedSchemasResolutionStore", ms: Date.now() - _t_phase});

  // ##############################################################################################
  _t_phase = Date.now();


  console.log("getMiroirFundamentalJzodSchema - extractorOrCombiner templates START");
  const extractorOrCombiner = (miroirFundamentalJzodSchema as any).definition.context["extractorOrCombiner"]

  const queriesDependencySet = jzodTransitiveDependencySet(
    miroirFundamentalJzodSchema.definition,
    "extractorOrCombinerRecord",
    true, // includeExtend
  );
  console.log(
    "getMiroirFundamentalJzodSchema - extractorOrCombiner templates - queriesDependencySet",
    JSON.stringify(Array.from(queriesDependencySet), null, 2),
  );
  const {
    localizedInnerResolutionStorePlainReferences:
      queriesLocalizedInnerResolutionStorePlainReferences,
    carryOnDomainActionSchemaBuilder: queriesSchemaBuilder,
  } = getCarryOnSchemaBuilder(
    extractorOrCombiner,
    queriesDependencySet,
    absoluteMiroirFundamentalJzodSchemaWithExtendedSchemas, // absoluteMiroirFundamentalJzodSchema,
    coreTransformerForBuildPlusRuntimeCarryOnSchemaReference,
    coreTransformerForBuildPlusRuntimeForArrayCarryOnSchemaReference,
    ["transformerType", "interpolation"],
    "miroirTemplate_", // prefix
    false, // alwaysPropagate,
    localizedInnerResolutionStoreForExtendedSchemas, // skip already converted extended schemas
  );

  console.log(
    "getMiroirFundamentalJzodSchema - extractorOrCombiner templates - queriesLocalizedInnerResolutionStorePlainReferences",
    JSON.stringify(Object.keys(queriesLocalizedInnerResolutionStorePlainReferences), null, 2),
  );
  const absoluteMiroirFundamentalJzodSchemaWithQueriesTemplates = {
    ...absoluteMiroirFundamentalJzodSchema,
    definition: {
      ...absoluteMiroirFundamentalJzodSchema.definition,
      context: {
        ...absoluteMiroirFundamentalJzodSchema.definition.context,
        ...localizedInnerResolutionStoreForExtendedSchemas,
        ...queriesLocalizedInnerResolutionStorePlainReferences,
      },
    },
  }
  const convertedJzodSchemaWithQueriesTemplates = {
    ...localizedInnerResolutionStoreForExtendedSchemas,
    ...queriesLocalizedInnerResolutionStorePlainReferences,
  };
  console.log(
    "getMiroirFundamentalJzodSchema - extractorOrCombiner templates - absoluteMiroirFundamentalJzodSchemaWithQueriesTemplates",
    JSON.stringify(Object.keys(absoluteMiroirFundamentalJzodSchemaWithQueriesTemplates.definition.context), null, 2),
  );
  console.log("getMiroirFundamentalJzodSchema - extractorOrCombiner templates END");
  _phaseTimings.push({phase: "queriesWithCarryOnContext", ms: Date.now() - _t_phase});

  // ##############################################################################################
  _t_phase = Date.now();

  log.info("########################################## Create buildPlusRuntimeDomainAction templates...");
    const domainAction = (absoluteMiroirFundamentalJzodSchemaWithQueriesTemplates as any).definition.context["domainAction"]

  const domainActionDependencySet = jzodTransitiveDependencySet(
    // miroirFundamentalJzodSchema.definition,
    absoluteMiroirFundamentalJzodSchemaWithQueriesTemplates.definition,
    "domainAction",
    true, // includeExtend
  );
  console.log(
    "getMiroirFundamentalJzodSchema - domainAction templates - domainActionDependencySet",
    JSON.stringify(Array.from(domainActionDependencySet), null, 2),
  );

  // // // TODO: HACK!! forcing jzod schema definition into compositeActionDependencySet
  // Object.keys((jzodSchemajzodMiroirBootstrapSchema as any).definition.context).forEach((key) => {
  //   domainActionDependencySet.add(key);
  // });

  const {
    localizedInnerResolutionStorePlainReferences:
      buildPlusRuntimeDomainActionLocalizedInnerResolutionStorePlainReferences,
    carryOnDomainActionSchemaBuilder: buildPlusRuntimeDomainActionSchemaBuilder,
  } = getCarryOnSchemaBuilder(
    domainAction,
    domainActionDependencySet,
    absoluteMiroirFundamentalJzodSchemaWithQueriesTemplates, //absoluteMiroirFundamentalJzodSchema,
    coreTransformerForBuildPlusRuntimeCarryOnSchemaReference,
    coreTransformerForBuildPlusRuntimeForArrayCarryOnSchemaReference,
    ["transformerType", "interpolation"],
    "miroirTemplate_", // prefix
    false, // alwaysPropagate
    // queriesConvertedReferences, // already converted references to avoid converting them twice since they are shared between extractorOrCombiner and domainAction
    // absoluteMiroirFundamentalJzodSchemaWithQueriesTemplates.definition.context
    convertedJzodSchemaWithQueriesTemplates,
  );
  log.info("getMiroirFundamentalJzodSchema - domainAction templates - buildPlusRuntimeDomainActionLocalizedInnerResolutionStorePlainReferences",
    JSON.stringify(Object.keys(buildPlusRuntimeDomainActionLocalizedInnerResolutionStorePlainReferences), null, 2),
  );
  log.info("########################################## Create buildPlusRuntimeDomainAction templates DONE.");
  _phaseTimings.push({phase: "getCarryOnScemaBuilder", ms: Date.now() - _t_phase});


  // ##############################################################################################
  _t_phase = Date.now();
  const miroirFundamentalJzodSchemaWithActionTemplate: any = {
    ...miroirFundamentalJzodSchema,
    definition: {
      ...miroirFundamentalJzodSchema.definition,
      context: {
        ...((miroirFundamentalJzodSchema.definition as any)?.context ?? {}),
        // ______________________________________________jzodElementWithCarryOnContext________________________________________________:
        //   { type: "any" },
        // ...jzodElementWithCarryOnContext,
        ______________________________________________localizedInnerResolutionStoreForExtendedSchemas_______________________:
          { type: "any" },
        ...localizedInnerResolutionStoreForExtendedSchemas,
        ______________________________________________queriesLocalizedInnerResolutionStorePlainReferences_______________________:
          { type: "any" },
        ...queriesLocalizedInnerResolutionStorePlainReferences,
        ______________________________________________queries_______________________:
          { type: "any" },
        buildPlusRuntimeQuery: queriesSchemaBuilder.resultSchema,
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
        extractorTemplateCombinerOneToOne: {
          "type": "schemaReference",
          "definition": {
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerOneToOne",
          }
          // type: "object",
          // extend: {
          //   type: "schemaReference",
          //   definition: {
          //     eager: true,
          //     relativePath: "extractorOrCombinerRoot",
          //   },
          // },
          // definition: {
          //   extractorOrCombinerType: {
          //     type: "literal",
          //     definition: "combinerOneToOne",
          //   },
          //   objectReference: {
          //     type: "schemaReference",
          //     definition: {
          //       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //       relativePath: "coreTransformerForBuildPlusRuntime_InnerReference",
          //     },
          //   },
          //   AttributeOfObjectToCompareToReferenceUuid: {
          //     type: "union",
          //     definition: [{ type: "string" }, { type: "array", definition: { type: "string" } }],
          //   },
          //   applyTransformer: {
          //     type: "schemaReference",
          //     optional: true,
          //     definition: {
          //       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //       relativePath: "coreTransformerForBuildPlusRuntime",
          //     },
          //   },
          // },
        },
        extractorTemplateExtractorByPrimaryKey: {
          "type": "schemaReference",
          "definition": {
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorByPrimaryKey",
          }
          // type: "object",
          // extend: {
          //   type: "schemaReference",
          //   definition: {
          //     eager: true,
          //     relativePath: "extractorOrCombinerRoot",
          //   },
          // },
          // definition: {
          //   extractorOrCombinerType: {
          //     type: "literal",
          //     definition: "extractorByPrimaryKey",
          //   },
          //   instanceUuid: {
          //     type: "schemaReference",
          //     definition: {
          //       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //       relativePath: "coreTransformerForBuildPlusRuntime",
          //     },
          //   },
          //   foreignKeysForTransformer: {
          //     type: "array",
          //     optional: true,
          //     definition: {
          //       type: "string",
          //     },
          //   },
          //   applyTransformer: {
          //     type: "schemaReference",
          //     optional: true,
          //     definition: {
          //       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //       relativePath: "coreTransformerForBuildPlusRuntime",
          //     },
          //   },
          // },
        },
        extractorTemplateReturningObject: {
          type: "union",
          discriminator: "extractorOrCombinerType",
          definition: [
            {
              type: "schemaReference",
              definition: {
                relativePath: "extractorTemplateCombinerOneToOne",
              },
            },
            {
              type: "schemaReference",
              definition: {
                relativePath: "extractorTemplateExtractorByPrimaryKey",
              },
            },
          ],
        },
        extractorTemplateInstancesByEntity: {
          type: "schemaReference",
          definition: {
            absolutePath: miroirFundamentalJzodSchemaUuid,
            relativePath: "miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorInstancesByEntity",
          },
        },
        extractorTemplateReturningObjectList: {
          type: "union",
          discriminator: "extractorOrCombinerType",
          definition: [
            {
              type: "schemaReference",
              definition: {
                relativePath: "extractorTemplateInstancesByEntity",
              },
            },
            {
              type: "schemaReference",
              definition: {
                relativePath: "combinerTemplateOneToMany",
              },
            },
            {
              type: "schemaReference",
              definition: {
                relativePath: "combinerTemplateManyToMany",
              },
            },
          ],
        },
        extractorTemplateReturningObjectOrObjectList: {
          type: "union",
          discriminator: "extractorOrCombinerType",
          definition: [
            {
              type: "schemaReference",
              definition: {
                relativePath: "extractorTemplateReturningObject",
              },
            },
            {
              type: "schemaReference",
              definition: {
                relativePath: "extractorTemplateReturningObjectList",
              },
            },
          ],
        },
        combinerTemplateOneToMany: {
          "type": "schemaReference",
          "definition": {
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerOneToMany",
          }
          // type: "object",
          // extend: {
          //   type: "schemaReference",
          //   definition: {
          //     eager: true,
          //     relativePath: "extractorOrCombinerRoot",
          //   },
          // },
          // definition: {
          //   extractorOrCombinerType: {
          //     type: "literal",
          //     definition: "combinerOneToMany",
          //   },
          //   orderBy: {
          //     type: "object",
          //     optional: true,
          //     definition: {
          //       attributeName: {
          //         type: "string",
          //       },
          //       direction: {
          //         type: "enum",
          //         optional: true,
          //         definition: ["ASC", "DESC"],
          //       },
          //     },
          //   },
          //   objectReference: {
          //     type: "schemaReference",
          //     definition: {
          //       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //       relativePath: "coreTransformerForBuildPlusRuntime",
          //     },
          //   },
          //   objectReferenceAttribute: {
          //     type: "string",
          //     optional: true,
          //   },
          //   AttributeOfListObjectToCompareToReferenceUuid: {
          //     type: "union",
          //     definition: [{ type: "string" }, { type: "array", definition: { type: "string" } }],
          //   },
          //   applyTransformer: {
          //     type: "schemaReference",
          //     optional: true,
          //     definition: {
          //       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //       relativePath: "coreTransformerForBuildPlusRuntime",
          //     },
          //   },
          // },
        },
        combinerTemplateManyToMany: {
          "type": "schemaReference",
          "definition": {
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerManyToMany",
          }
          // type: "object",
          // extend: {
          //   type: "schemaReference",
          //   definition: {
          //     eager: true,
          //     relativePath: "extractorOrCombinerRoot",
          //   },
          // },
          // definition: {
          //   extractorOrCombinerType: {
          //     type: "literal",
          //     definition: "combinerManyToMany",
          //   },
          //   orderBy: {
          //     type: "object",
          //     optional: true,
          //     definition: {
          //       attributeName: {
          //         type: "string",
          //       },
          //       direction: {
          //         type: "enum",
          //         optional: true,
          //         definition: ["ASC", "DESC"],
          //       },
          //     },
          //   },
          //   objectListReference: {
          //     type: "schemaReference",
          //     definition: {
          //       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //       relativePath: "coreTransformerForBuildPlusRuntime_getFromContext",
          //     },
          //   },
          //   objectListReferenceAttribute: {
          //     type: "string",
          //     optional: true,
          //   },
          //   AttributeOfRootListObjectToCompareToListReferenceUuid: {
          //     type: "string",
          //     optional: true,
          //   },
          //   applyTransformer: {
          //     type: "schemaReference",
          //     optional: true,
          //     definition: {
          //       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //       relativePath: "coreTransformerForBuildPlusRuntime",
          //     },
          //   },
          // },
        },
        combinerTemplateByHeteronomousManyToMany: {
          "type": "schemaReference",
          "definition": {
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerByHeteronomousManyToMany",
          }
          // type: "object",
          // definition: {
          //   extractorOrCombinerType: {
          //     type: "literal",
          //     definition: "combinerByHeteronomousManyToMany",
          //   },
          //   rootExtractorOrReference: {
          //     type: "union",
          //     discriminator: "extractorOrCombinerType",
          //     definition: [
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "extractorOrCombiner",
          //         },
          //       },
          //       {
          //         type: "string",
          //       },
          //     ],
          //   },
          //   subQueryTemplate: {
          //     type: "object",
          //     definition: {
          //       query: {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "extractorOrCombiner",
          //         },
          //       },
          //       rootQueryObjectTransformer: {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "recordOfTransformers",
          //         },
          //       },
          //     },
          //   },
          // },
        },
        extractorTemplateByExtractorWrapperReturningObject: {
          "type": "schemaReference",
          "definition": {
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningObject"
          }
        },
        extractorTemplateByExtractorWrapperReturningList: {
          "type": "schemaReference",
          "definition": {
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningList"
          }
        },
        extractorTemplateByExtractorWrapper: {
          type: "union",
          discriminator: "extractorOrCombinerType",
          definition: [
            {
              type: "schemaReference",
              definition: {
                relativePath: "extractorTemplateByExtractorWrapperReturningObject",
              },
            },
            {
              type: "schemaReference",
              definition: {
                relativePath: "extractorTemplateByExtractorWrapperReturningList",
              },
            },
          ],
        },
        // extractorOrCombinerTemplate: {
        //   "type": "schemaReference",
        //   "definition": {
        //     "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        //     "relativePath": "miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombiner"
        //   }
        // },
        // extractorOrCombinerTemplateRecord: {
        //   type: "record",
        //   definition: {
        //     type: "schemaReference",
        //     definition: {
        //       relativePath: "extractorOrCombinerTemplate",
        //     },
        //   },
        // },
        buildPlusRuntimeCompositeAction: {
          type: "schemaReference",
          definition: {
            absolutePath: miroirFundamentalJzodSchemaUuid,
            relativePath:
              "miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeActionSequence",
          },
        },
      } as Record<string, any /**JzodElement */>,
    } as any /** JzodObjectOrReference */,
  };
  log.info(
    "entityDefinitionQueryVersionV1WithAbsoluteReferences=",
    JSON.stringify(
      Object.keys(miroirFundamentalJzodSchemaWithActionTemplate.definition.context),
      null,
      2,
    ),
  );
  _phaseTimings.push({phase: "final context assembly", ms: Date.now() - _t_phase});
  const _t_total = Date.now() - _t_start;
  const _phaseSummary = _phaseTimings
    .map((p) => `  ${p.phase}: ${p.ms}ms (${_t_total > 0 ? Math.round(100 * p.ms / _t_total) : 0}%)`)
    .join("\n");
  log.info(
    `getMiroirFundamentalJzodSchema phase timings (total ${_t_total}ms):\n${_phaseSummary}`
  );
  log.info("####################################################################################");
  log.info("####################################################################################");
  log.info("####################################################################################");
  log.info("####################################################################################");
  log.info("####################################################################################");
  log.info("####################################################################################");
  log.info("####################################################################################");
  log.info("####################################################################################");
  log.info("####################################################################################");
  log.info("####################################################################################");
  log.info("####################################################################################");

  return miroirFundamentalJzodSchemaWithActionTemplate;

}
