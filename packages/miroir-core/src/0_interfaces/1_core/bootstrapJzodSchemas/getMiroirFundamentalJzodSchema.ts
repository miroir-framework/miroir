import {
  applyCarryOnSchema,
  applyCarryOnSchemaOnLevel,
  forgeCarryOnReferenceName,
  JzodReferenceResolutionFunction,
} from "@miroir-framework/jzod";
import { JzodElement, JzodReference } from "@miroir-framework/jzod-ts";
import { cleanLevel } from "../../../1_core/constants";
import {
  miroirTransformersForBuild,
  miroirTransformersForRuntime
} from "../../../2_domain/Transformers";
import { MiroirLoggerFactory } from "../../../4_services/LoggerFactory";
import { packageName } from "../../../constants";
import { LoggerInterface } from "../../4-services/LoggerInterface";
import { transformerForBuild_dataflowObject, transformerForBuild_freeObjectTemplate, transformerForRuntime_dataflowObject, transformerForRuntime_freeObjectTemplate } from "../preprocessor-generated/miroirFundamentalType";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "getMiroirFundamentalJzodSchema")
).then((logger: LoggerInterface) => {
  log = logger;
});

export const miroirFundamentalJzodSchemaUuid = "fe9b7d99-f216-44de-bb6e-60e1a1ebb739";
/**
 *
 * @param jzodSchema
 * @param absolutePath
 * @param force
 * @returns
 */
function makeReferencesAbsolute(jzodSchema: any, absolutePath: string, force?: boolean): any {
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
      // console.log("makeReferencesAbsolute schemaReference received", JSON.stringify(jzodSchema));
      // console.log("makeReferencesAbsolute schemaReference returns", JSON.stringify(result));
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

// export const extendedSchemas = [
export function getExtendedSchemas(jzodSchemajzodMiroirBootstrapSchema: any) {
  const result = [
    ...Object.keys(jzodSchemajzodMiroirBootstrapSchema.definition.context),
    "applicationSection",
    "shippingBox",
    "entityAttributeUntypedCore",
    "extractorTemplateRoot",
    "extractorOrCombinerRoot",
    "transformer_constantAsExtractor",
    // "transformer_constantArray",
    "transformer_constantBigint",
    "transformer_constantBoolean",
    "transformer_constantNumber",
    "transformer_constantUuid",
    "transformer_constantObject",
    "transformer_constantString",
    "transformer_newUuid",
    "transformer_constant",
    "transformer_parameterReference",
    "transformerForBuild_objectDynamicAccess",
    "transformer_inner_label",
    "transformer_Abstract",
    "transformer_orderBy",
    "transformer_constantListAsExtractor",
    "transformer_extractors",
    "transformer_mustacheStringTemplate",
    "transformerForBuild_constant",
    "transformerForBuild_parameterReference",
    "transformerForBuild_Abstract",
    "transformerForRuntime_Abstract",
    "transformerForRuntime_orderedTransformer",
    "transformerForRuntime_contextReference",
    "transformer_contextOrParameterReferenceTO_REMOVE",
  ];
  // console.log("getExtendedSchemas result", JSON.stringify(result, null, 2));
  return result;
}

export function getExtendedSchemasWithCarryOn(
  jzodSchemajzodMiroirBootstrapSchema: any,
  absolutePath: string
) {
  const result = getExtendedSchemas(jzodSchemajzodMiroirBootstrapSchema).map(
    (relativePath: string) => forgeCarryOnReferenceName(absolutePath, relativePath, "extend")
  );
  // console.log("getExtendedSchemasWithCarryOn result", JSON.stringify(result, null, 2));
  return result;
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
  miroirTransformersJzodSchemas: any[], // TransformerDefinition[]
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
  entityDefinitionTransformerDefinition: any
  // ): any {
): JzodReference {
  // TODO: not really a JzodReference!!
  const entityDefinitionQueryVersionV1WithAbsoluteReferences = makeReferencesAbsolute(
    entityDefinitionQueryVersionV1.jzodSchema.definition.definition,
    miroirFundamentalJzodSchemaUuid
  ) as any;

  // const domainActionDefinitions = Object.fromEntries(
  //   domainEndpointVersionV1.definition.actions
  //     .filter((a: any) => !["compositeAction", "transactionalInstanceAction"].includes(a.actionParameters?.definition?.actionType?.definition))
  //     .map((a: any) => [a.actionParameters?.definition?.relativePath, a.actionParameters])
  //     .concat([
  //       domainEndpointVersionV1.definition.actions.find(
  //         (a: any) => a.actionParameters.definition.actionType && a.actionParameters.definition.actionType.definition == "transactionalInstanceAction"
  //       )
  //     ].map(a => [a.actionParameters.definition.actionType.definition, a.actionParameters])
  //     )
  // );

  // log.info("miroirTransformersJzodSchemas", JSON.stringify(miroirTransformersJzodSchemas, null, 2));
  // const localCompositeActionDefinition = domainEndpointVersionV1.definition.actions.find(
  //   (a: any) => a.actionParameters?.definition?.actionType?.definition == "compositeAction"
  // )?.actionParameters.definition;
  // const localRunTestCaseAction = localCompositeActionDefinition.definition.definition.definition.find(
  //   (a: any) => a.definition?.actionType?.definition == "compositeRunTestAssertion"
  // );
  // log.info("localCompositeActionDefinition", JSON.stringify(localCompositeActionDefinition, null, 2));
  // log.info("localRunTestCaseAction", JSON.stringify(localRunTestCaseAction, null, 2));
  // log.info("getMiroirFundamentalJzodSchema miroirTransformersForBuild", JSON.stringify(miroirTransformersForBuild, null, 2));
  log.info(
    "getMiroirFundamentalJzodSchema miroirTransformersForBuild.transformer_unique",
    JSON.stringify(miroirTransformersForBuild.transformer_unique, null, 2)
  );

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
        ______________________________________________transformers_____________________________________________:
          {
            type: "never",
          },
        // ...(transformerJzodSchema as any).definition.context, // gives "transformerForBuild_InnerReference", "transformerForBuild", "actionHandler"
        ...makeReferencesAbsolute(
          (transformerJzodSchema as any).definition,
          miroirFundamentalJzodSchemaUuid,
          true
        ).context, // gives "transformerForBuild_InnerReference", "transformerForBuild", "actionHandler"
        ...Object.fromEntries(
          miroirTransformersJzodSchemas.map((e: any) => [
            e.name,
            { type: "object", definition: e.transformerInterface.transformerParameterSchema },
          ])
        ),
        transformerForBuild_constantArray: miroirTransformersForBuild.transformer_constantArray,
        transformerForBuild_count: miroirTransformersForBuild.transformer_count,
        transformerForBuild_dataflowObject: miroirTransformersForBuild.transformer_dataflowObject,
        transformerForBuild_list_listMapperToList: miroirTransformersForBuild.transformer_mapperListToList,
        transformerForBuild_freeObjectTemplate: miroirTransformersForBuild.transformer_freeObjectTemplate,
        transformerForBuild_objectAlter: miroirTransformersForBuild.transformer_objectAlter,
        transformerForBuild_objectEntries: miroirTransformersForBuild.transformer_objectEntries,
        transformerForBuild_objectValues: miroirTransformersForBuild.transformer_objectValues,
        transformerForBuild_object_listPickElement: miroirTransformersForBuild.transformer_listPickElement,
        transformerForBuild_object_listReducerToIndexObject: miroirTransformersForBuild.transformer_listReducerToIndexObject,
        transformerForBuild_object_listReducerToSpreadObject: miroirTransformersForBuild.transformer_listReducerToSpreadObject,
        transformerForBuild_object_fullTemplate: miroirTransformersForBuild.transformer_object_fullTemplate,
        transformerForBuild_unique: miroirTransformersForBuild.transformer_unique,
        transformerForRuntime_count: miroirTransformersForRuntime.transformer_count,
        transformerForRuntime_constantArray: miroirTransformersForRuntime.transformer_constantArray,
        transformerForRuntime_dataflowObject: miroirTransformersForRuntime.transformer_dataflowObject,
        transformerForRuntime_freeObjectTemplate: miroirTransformersForRuntime.transformer_freeObjectTemplate,
        transformerForRuntime_list_listMapperToList: miroirTransformersForRuntime.transformer_mapperListToList,
        transformerForRuntime_list_listPickElement: miroirTransformersForRuntime.transformer_listPickElement,
        transformerForRuntime_object_listReducerToIndexObject: miroirTransformersForRuntime.transformer_listReducerToIndexObject,
        transformerForRuntime_object_listReducerToSpreadObject: miroirTransformersForRuntime.transformer_listReducerToSpreadObject,
        transformerForRuntime_objectAlter: miroirTransformersForRuntime.transformer_objectAlter,
        transformerForRuntime_objectEntries: miroirTransformersForRuntime.transformer_objectEntries,
        transformerForRuntime_objectValues: miroirTransformersForRuntime.transformer_objectValues,
        transformerForRuntime_object_fullTemplate: miroirTransformersForRuntime.transformer_object_fullTemplate,
        transformerForRuntime_unique: miroirTransformersForRuntime.transformer_unique,
        extendedTransformerForRuntime: {
          type: "union",
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
                relativePath: "transformer_menu_addItem",
              },
            },
          ],
        },
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
          type: "union",
          definition: [
            {
              type: "literal",
              definition: "model",
            },
            {
              type: "literal",
              definition: "data",
            },
          ],
        },
        dataStoreApplicationType: {
          type: "union",
          definition: [
            {
              type: "literal",
              definition: "miroir",
            },
            {
              type: "literal",
              definition: "app",
            },
          ],
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
          },
        },
        entityInstanceCollection: {
          type: "object",
          definition: {
            parentName: {
              type: "string",
              optional: true,
            },
            parentUuid: {
              type: "string",
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
                definition: {
                  absolutePath: miroirFundamentalJzodSchemaUuid,
                  relativePath: "entityInstance",
                },
              },
            },
          },
        },
        conceptLevel: {
          type: "enum",
          definition: ["MetaModel", "Model", "Data"],
        },
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
        ).definition.definition.definition.find(
          (e: any) => e.definition.testType.definition == "testCompositeAction"
        ),
        testCompositeActionSuite: (
          entityDefinitionTest.jzodSchema as any
        ).definition.definition.definition.find(
          (e: any) => e.definition.testType.definition == "testCompositeActionSuite"
        ),
        testCompositeActionTemplate: (
          entityDefinitionTest.jzodSchema as any
        ).definition.definition.definition.find(
          (e: any) => e.definition.testType.definition == "testCompositeActionTemplate"
        ),
        testCompositeActionTemplateSuite: (
          entityDefinitionTest.jzodSchema as any
        ).definition.definition.definition.find(
          (e: any) => e.definition.testType.definition == "testCompositeActionTemplateSuite"
        ),
        testAssertion: (
          entityDefinitionTest.jzodSchema as any
        ).definition.definition.definition.find(
          (e: any) => e.definition.testType.definition == "testAssertion"
        ),
        test: entityDefinitionTest.jzodSchema as any,
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
        ...Object.fromEntries(
          Object.entries(
            (entityDefinitionReportV1 as any).jzodSchema.definition.definition.context
          ).filter((e) =>
            [
              "objectInstanceReportSection",
              "objectListReportSection",
              "gridReportSection",
              "listReportSection",
              "reportSection",
              "rootReport",
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
              tag: { value: { id: 1, defaultLabel: "Uuid", editable: false } },
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
                  relativePath: "extendedTransformerForRuntime",
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
                  relativePath: "extendedTransformerForRuntime",
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
          (a: any) => a.actionParameters.definition.actionName.definition == "initModel"
        )?.actionParameters.definition.params,
        modelActionCommit: modelEndpointVersionV1.definition.actions.find(
          (a: any) => a.actionParameters.definition.actionName.definition == "commit"
        )?.actionParameters,
        modelActionRollback: modelEndpointVersionV1.definition.actions.find(
          (a: any) => a.actionParameters.definition.actionName.definition == "rollback"
        )?.actionParameters,
        modelActionInitModel: modelEndpointVersionV1.definition.actions.find(
          (a: any) => a.actionParameters.definition.actionName.definition == "initModel"
        )?.actionParameters,
        modelActionResetModel: modelEndpointVersionV1.definition.actions.find(
          (a: any) => a.actionParameters.definition.actionName.definition == "resetModel"
        )?.actionParameters,
        modelActionResetData: modelEndpointVersionV1.definition.actions.find(
          (a: any) => a.actionParameters.definition.actionName.definition == "resetData"
        )?.actionParameters,
        modelActionAlterEntityAttribute: modelEndpointVersionV1.definition.actions.find(
          (a: any) => a.actionParameters.definition.actionName.definition == "alterEntityAttribute"
        )?.actionParameters,
        modelActionCreateEntity: modelEndpointVersionV1.definition.actions.find(
          (a: any) => a.actionParameters.definition.actionName.definition == "createEntity"
        )?.actionParameters,
        modelActionDropEntity: modelEndpointVersionV1.definition.actions.find(
          (a: any) => a.actionParameters.definition.actionName.definition == "dropEntity"
        )?.actionParameters,
        modelActionRenameEntity: modelEndpointVersionV1.definition.actions.find(
          (a: any) => a.actionParameters.definition.actionName.definition == "renameEntity"
        )?.actionParameters,
        modelAction: {
          type: "union",
          definition: modelEndpointVersionV1.definition.actions.map((e: any) => e.actionParameters),
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
          definition: instanceEndpointVersionV1.definition.actions
            .filter((e: any) =>
              ["createInstance", "updateInstance", "deleteInstance"].includes(
                e.actionParameters.definition.actionName.definition
              )
            )
            .map((e: any) => e.actionParameters),
        },
        instanceAction: {
          type: "union",
          definition: instanceEndpointVersionV1.definition.actions.map(
            (e: any) => e.actionParameters
          ),
        },
        undoRedoAction: {
          type: "union",
          definition: undoRedoEndpointVersionV1.definition.actions.map(
            (e: any) => e.actionParameters
          ),
        },
        transactionalInstanceAction: domainEndpointVersionV1.definition.actions.find(
          (a: any) =>
            a.actionParameters.definition.actionType &&
            a.actionParameters.definition.actionType.definition == "transactionalInstanceAction"
        )?.actionParameters,
        localCacheAction: {
          type: "union",
          definition: localCacheEndpointVersionV1.definition.actions.map(
            (e: any) => e.actionParameters
          ),
        },
        storeManagementAction: {
          type: "union",
          definition: storeManagementEndpoint.definition.actions.map(
            (e: any) => e.actionParameters
          ),
        },
        persistenceAction: {
          type: "union",
          definition: persistenceEndpointVersionV1.definition.actions.map(
            (e: any) => e.actionParameters
          ),
        },
        localPersistenceAction: persistenceEndpointVersionV1.definition.actions[0].actionParameters,
        restPersistenceAction: persistenceEndpointVersionV1.definition.actions[1].actionParameters,
        runBoxedQueryTemplateOrBoxedExtractorTemplateAction:
          queryEndpointVersionV1.definition.actions[0].actionParameters,
        runBoxedExtractorOrQueryAction:
          queryEndpointVersionV1.definition.actions[1].actionParameters,
        runBoxedQueryTemplateAction: queryEndpointVersionV1.definition.actions[2].actionParameters,
        runBoxedExtractorTemplateAction:
          queryEndpointVersionV1.definition.actions[3].actionParameters,
        runBoxedQueryAction: queryEndpointVersionV1.definition.actions[4].actionParameters,
        runBoxedExtractorAction: queryEndpointVersionV1.definition.actions[5].actionParameters,
        compositeActionDefinition: domainEndpointVersionV1.definition.actions.find(
          (a: any) => a.actionParameters?.definition?.actionType?.definition == "compositeAction"
        )?.actionParameters.definition.definition,
        compositeAction: domainEndpointVersionV1.definition.actions.find(
          (a: any) => a.actionParameters?.definition?.actionType?.definition == "compositeAction"
        )?.actionParameters,
        // extendedCompositeAction: domainEndpointVersionV1.definition.actions.find(
        //   (a: any) => a.actionParameters?.definition?.actionType?.definition == "extendedCompositeAction"
        // )?.actionParameters,
        compositeRunTestAssertion: domainEndpointVersionV1.definition.actions
          .find(
            (a: any) => a.actionParameters?.definition?.actionType?.definition == "compositeAction"
          )
          ?.actionParameters.definition.definition.definition.definition.find(
            (a: any) => a.definition?.actionType?.definition == "compositeRunTestAssertion"
          ),
        domainAction: {
          type: "union",
          definition: domainEndpointVersionV1.definition.actions.map(
            (e: any) => e.actionParameters
          ),
        },
        // ...(transformerJzodSchema as any).definition.context, // gives "transformerForBuild_InnerReference", "transformerForBuild", "actionHandler"
        modelActionReplayableAction: {
          type: "union",
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
      },
      definition: {
        absolutePath: miroirFundamentalJzodSchemaUuid,
        relativePath: "miroirAllFundamentalTypesUnion",
      },
    },
  };

  const domainActionDefinitions = {
    undoRedoAction: (miroirFundamentalJzodSchema.definition as any).context?.undoRedoAction as any,
    storeOrBundleAction: (miroirFundamentalJzodSchema.definition as any).context
      ?.storeOrBundleAction as any,
    modelAction: (miroirFundamentalJzodSchema.definition as any).context?.modelAction as any,
    instanceAction: (miroirFundamentalJzodSchema.definition as any).context?.instanceAction as any,
    storeManagementAction: (miroirFundamentalJzodSchema.definition as any).context
      ?.storeManagementAction as any,
    transactionalInstanceAction: domainEndpointVersionV1.definition.actions.find(
      (a: any) =>
        a.actionParameters.definition.actionType &&
        a.actionParameters.definition.actionType.definition == "transactionalInstanceAction"
    ).actionParameters,
  };

  // console.log("################## miroirFundamentalJzodSchema", JSON.stringify(Object.keys(miroirFundamentalJzodSchema.definition.context), null, 2))

  const innerResolutionStore: Record<string, any> = {
    // TODO: transform all inner references in jzodSchemajzodMiroirBootstrapSchema into innerResolutionStoreReferences
    [miroirFundamentalJzodSchemaUuid]: {
      type: "schemaReference",
      context: {
        // ...(jzodSchemajzodMiroirBootstrapSchema.definition as JzodReference).context,
        ...(jzodSchemajzodMiroirBootstrapSchema.definition as any).context,
        dataStoreType: (miroirFundamentalJzodSchema as any).definition.context.dataStoreType,
        selfApplication: (miroirFundamentalJzodSchema as any).definition.context.selfApplication,
        applicationVersion: (miroirFundamentalJzodSchema as any).definition.context
          .applicationVersion,
        menu: (miroirFundamentalJzodSchema as any).definition.context.menu,
        menuDefinition: (miroirFundamentalJzodSchema as any).definition.context.menuDefinition,
        entity: (miroirFundamentalJzodSchema as any).definition.context.entity,
        entityDefinition: (miroirFundamentalJzodSchema as any).definition.context.entityDefinition,
        applicationSection: (miroirFundamentalJzodSchema as any).definition.context
          .applicationSection,
        entityInstance: (miroirFundamentalJzodSchema as any).definition.context.entityInstance,
        entityInstanceUuid: (miroirFundamentalJzodSchema as any).definition.context
          .entityInstanceUuid,
        // instanceUuidIndexUuidIndex: (miroirFundamentalJzodSchema as any).definition.context.instanceUuidIndexUuidIndex,
        entityInstancesUuidIndex: (miroirFundamentalJzodSchema as any).definition.context
          .entityInstancesUuidIndex,
        deployment: (miroirFundamentalJzodSchema as any).definition.context.deployment,
        selfApplicationDeploymentConfiguration: (miroirFundamentalJzodSchema as any).definition
          .context.selfApplicationDeploymentConfiguration,
        // domain elements  ###########################################################
        domainElementSuccess: (miroirFundamentalJzodSchema as any).definition.context
          .domainElementSuccess,
        domainElementVoid: (miroirFundamentalJzodSchema as any).definition.context
          .domainElementVoid,
        domainElementAny: (miroirFundamentalJzodSchema as any).definition.context.domainElementAny,
        domainElementArray: (miroirFundamentalJzodSchema as any).definition.context
          .domainElementArray,
        domainElementInstanceUuid: (miroirFundamentalJzodSchema as any).definition.context
          .domainElementInstanceUuid,
        domainElementNumber: (miroirFundamentalJzodSchema as any).definition.context
          .domainElementNumber,
        domainElementString: (miroirFundamentalJzodSchema as any).definition.context
          .domainElementString,
        domainElementFailed: (miroirFundamentalJzodSchema as any).definition.context
          .domainElementFailed,
        domainElementObject: (miroirFundamentalJzodSchema as any).definition.context
          .domainElementObject,
        domainElementObjectOrFailed: (miroirFundamentalJzodSchema as any).definition.context
          .domainElementObjectOrFailed,
        domainElementInstanceUuidIndex: (miroirFundamentalJzodSchema as any).definition.context
          .domainElementInstanceUuidIndex,
        domainElementInstanceUuidIndexOrFailed: (miroirFundamentalJzodSchema as any).definition
          .context.domainElementInstanceUuidIndexOrFailed,
        domainElementEntityInstanceCollection: (miroirFundamentalJzodSchema as any).definition
          .context.domainElementEntityInstanceCollection,
        domainElementEntityInstanceCollectionOrFailed: (miroirFundamentalJzodSchema as any)
          .definition.context.domainElementEntityInstanceCollectionOrFailed,
        domainElementInstanceArray: (miroirFundamentalJzodSchema as any).definition.context
          .domainElementInstanceArray,
        domainElementInstanceArrayOrFailed: (miroirFundamentalJzodSchema as any).definition.context
          .domainElementInstanceArrayOrFailed,
        domainElementEntityInstance: (miroirFundamentalJzodSchema as any).definition.context
          .domainElementEntityInstance,
        domainElementEntityInstanceOrFailed: (miroirFundamentalJzodSchema as any).definition.context
          .domainElementEntityInstanceOrFailed,
        domainElement: (miroirFundamentalJzodSchema as any).definition.context.domainElement,
        entityInstanceCollection: (miroirFundamentalJzodSchema as any).definition.context
          .entityInstanceCollection,
        jzodSchema: (miroirFundamentalJzodSchema as any).definition.context.jzodSchema,
        ...(miroirFundamentalJzodSchema as any).definition.context.menu.definition.definition
          .context,
        jzodObjectOrReference: (miroirFundamentalJzodSchema as any).definition.context
          .jzodObjectOrReference,
        objectInstanceReportSection: (miroirFundamentalJzodSchema as any).definition.context
          .objectInstanceReportSection,
        objectListReportSection: (miroirFundamentalJzodSchema as any).definition.context
          .objectListReportSection,
        gridReportSection: (miroirFundamentalJzodSchema as any).definition.context
          .gridReportSection,
        listReportSection: (miroirFundamentalJzodSchema as any).definition.context
          .listReportSection,
        reportSection: (miroirFundamentalJzodSchema as any).definition.context.reportSection,
        rootReport: (miroirFundamentalJzodSchema as any).definition.context.rootReport,
        report: (miroirFundamentalJzodSchema as any).definition.context.report,
        transformer: (miroirFundamentalJzodSchema as any).definition.context.transformer,
        recordOfTransformers: (miroirFundamentalJzodSchema as any).definition.context
          .recordOfTransformers,
        metaModel: (miroirFundamentalJzodSchema as any).definition.context.metaModel,
        indexedDbStoreSectionConfiguration: (miroirFundamentalJzodSchema as any).definition.context
          .indexedDbStoreSectionConfiguration,
        filesystemDbStoreSectionConfiguration: (miroirFundamentalJzodSchema as any).definition
          .context.filesystemDbStoreSectionConfiguration,
        sqlDbStoreSectionConfiguration: (miroirFundamentalJzodSchema as any).definition.context
          .sqlDbStoreSectionConfiguration,
        storeBasedConfiguration: (miroirFundamentalJzodSchema as any).definition.context
          .storeBasedConfiguration,
        storeUnitConfiguration: (miroirFundamentalJzodSchema as any).definition.context
          .storeUnitConfiguration,
        storeSectionConfiguration: (miroirFundamentalJzodSchema as any).definition.context
          .storeSectionConfiguration,
        instanceCUDAction: {
          type: "union",
          definition: instanceEndpointVersionV1.definition.actions
            .filter((e: any) =>
              ["createInstance", "updateInstance", "deleteInstance"].includes(
                e.actionParameters.definition.actionName.definition
              )
            )
            .map((e: any) => e.actionParameters),
        },
        ...domainActionDefinitions,
        bundleAction: (miroirFundamentalJzodSchema as any).definition.context.bundleAction,
        domainAction: {
          type: "union",
          definition: domainEndpointVersionV1.definition.actions.map(
            (e: any) => e.actionParameters
          ),
        },
        compositeActionDefinition: domainEndpointVersionV1.definition.actions.find(
          (a: any) => a.actionParameters?.definition?.actionType?.definition == "compositeAction"
        )?.actionParameters.definition.definition,
        compositeAction: domainEndpointVersionV1.definition.actions.find(
          (a: any) => a.actionParameters?.definition?.actionType?.definition == "compositeAction"
        )?.actionParameters,
        // extendedCompositeAction: domainEndpointVersionV1.definition.actions.find(
        //   (a: any) => a.actionParameters?.definition?.actionType?.definition == "extendedCompositeAction"
        // )?.actionParameters,
        // domain elements
        // domainElementObject: (miroirFundamentalJzodSchema as any).definition.context.domainElementObject,
        // root elements
        testAssertion: (miroirFundamentalJzodSchema as any).definition.context.testAssertion,
        testAction_runTestCase: (miroirFundamentalJzodSchema as any).definition.context
          .testAction_runTestCase,
        shippingBox: (miroirFundamentalJzodSchema as any).definition.context.shippingBox,
        boxedExtractorOrCombinerReturningObject: (miroirFundamentalJzodSchema as any).definition
          .context.boxedExtractorOrCombinerReturningObject,
        boxedExtractorOrCombinerReturningObjectList: (miroirFundamentalJzodSchema as any).definition
          .context.boxedExtractorOrCombinerReturningObjectList,
        boxedQueryWithExtractorCombinerTransformer: (miroirFundamentalJzodSchema as any).definition
          .context.boxedQueryWithExtractorCombinerTransformer,
        boxedExtractorOrCombinerReturningObjectOrObjectList: (miroirFundamentalJzodSchema as any)
          .definition.context.boxedExtractorOrCombinerReturningObjectOrObjectList,
        extractorOrCombinerRoot: (miroirFundamentalJzodSchema as any).definition.context
          .extractorOrCombinerRoot,
        extractorByEntityReturningObjectList: (miroirFundamentalJzodSchema as any).definition
          .context.extractorByEntityReturningObjectList,
        extractorWrapperReturningList: (miroirFundamentalJzodSchema as any).definition.context
          .extractorWrapperReturningList,
        extractorWrapperReturningObject: (miroirFundamentalJzodSchema as any).definition.context
          .extractorWrapperReturningObject,
        extractorForObjectByDirectReference: (miroirFundamentalJzodSchema as any).definition.context
          .extractorForObjectByDirectReference,
        extractorOrCombinerContextReference: (miroirFundamentalJzodSchema as any).definition.context
          .extractorOrCombinerContextReference,
        extractorCombinerByHeteronomousManyToManyReturningListOfObjectList: (
          miroirFundamentalJzodSchema as any
        ).definition.context.extractorCombinerByHeteronomousManyToManyReturningListOfObjectList,
        extractorOrCombiner: (miroirFundamentalJzodSchema as any).definition.context
          .extractorOrCombiner,
        extractorOrCombinerReturningObject: (miroirFundamentalJzodSchema as any).definition.context
          .extractorOrCombinerReturningObject,
        extractorOrCombinerReturningObjectList: (miroirFundamentalJzodSchema as any).definition
          .context.extractorOrCombinerReturningObjectList,
        extractorOrCombinerReturningObjectOrObjectList: (miroirFundamentalJzodSchema as any)
          .definition.context.extractorOrCombinerReturningObjectOrObjectList,
        extractorWrapper: (miroirFundamentalJzodSchema as any).definition.context.extractorWrapper,
        extractor: (miroirFundamentalJzodSchema as any).definition.context.extractor,
        combinerForObjectByRelation: (miroirFundamentalJzodSchema as any).definition.context
          .combinerForObjectByRelation,
        combinerByRelationReturningObjectList: (miroirFundamentalJzodSchema as any).definition
          .context.combinerByRelationReturningObjectList,
        combinerByManyToManyRelationReturningObjectList: (miroirFundamentalJzodSchema as any)
          .definition.context.combinerByManyToManyRelationReturningObjectList,
        extractorOrCombinerRecord: (miroirFundamentalJzodSchema as any).definition.context
          .extractorOrCombinerRecord,
        runBoxedExtractorOrQueryAction: (miroirFundamentalJzodSchema as any).definition.context
          .runBoxedExtractorOrQueryAction,
        runBoxedQueryTemplateOrBoxedExtractorTemplateAction: (miroirFundamentalJzodSchema as any)
          .definition.context.runBoxedQueryTemplateOrBoxedExtractorTemplateAction,
        runBoxedQueryAction: (miroirFundamentalJzodSchema as any).definition.context
          .runBoxedQueryAction,
        runBoxedQueryTemplateAction: (miroirFundamentalJzodSchema as any).definition.context
          .runBoxedQueryTemplateAction,
        runBoxedExtractorAction: (miroirFundamentalJzodSchema as any).definition.context
          .runBoxedExtractorAction,
        runBoxedExtractorTemplateAction: (miroirFundamentalJzodSchema as any).definition.context
          .runBoxedExtractorTemplateAction,
        // runBoxedQueryTemplateOrBoxedExtractorTemplateAction: queryEndpointVersionV1.definition.actions[0].actionParameters,
        // queries
        // Transformer constants and references
        transformer_inner_referenced_extractor: (miroirFundamentalJzodSchema as any).definition.context
        .transformer_inner_referenced_extractor,
        transformer_inner_referenced_transformerForBuild: (miroirFundamentalJzodSchema as any).definition.context
          .transformer_inner_referenced_transformerForBuild,
        transformer_inner_referenced_transformerForRuntime: (miroirFundamentalJzodSchema as any).definition.context
          .transformer_inner_referenced_transformerForRuntime,
        transformer_inner_elementTransformer_transformerForBuild: (miroirFundamentalJzodSchema as any).definition.context
          .transformer_inner_elementTransformer_transformerForBuild,
        transformer_inner_elementTransformer_transformerForRuntime: (miroirFundamentalJzodSchema as any).definition.context
          .transformer_inner_elementTransformer_transformerForRuntime,
        transformer_inner_label: (miroirFundamentalJzodSchema as any).definition.context
          .transformer_inner_label,
        transformer_orderBy: (miroirFundamentalJzodSchema as any).definition.context
          .transformer_orderBy,
        transformer_constant: (transformerJzodSchema as any).definition.context
          .transformer_constant,
        transformer_constantAsExtractor: (transformerJzodSchema as any).definition.context
          .transformer_constantAsExtractor,
        transformer_constantBoolean: (transformerJzodSchema as any).definition.context
          .transformer_constantBoolean,
        transformer_constantBigint: (transformerJzodSchema as any).definition.context
          .transformer_constantBigint,
        transformer_constantObject: (transformerJzodSchema as any).definition.context
          .transformer_constantObject,
        transformer_constantNumber: (transformerJzodSchema as any).definition.context
          .transformer_constantNumber,
        transformer_constantString: (transformerJzodSchema as any).definition.context
          .transformer_constantString,
        transformer_constantUuid: (transformerJzodSchema as any).definition.context
          .transformer_constantUuid,
        transformerForRuntime_constantArray: (miroirFundamentalJzodSchema as any).definition.context
          .transformerForRuntime_constantArray,
        transformerForRuntime_constants: (transformerJzodSchema as any).definition.context
          .transformerForRuntime_constants,
        transformer_constantListAsExtractor: (transformerJzodSchema as any).definition.context
          .transformer_constantListAsExtractor,
        transformer_extractors: (transformerJzodSchema as any).definition.context
          .transformer_extractors,
        transformer_newUuid: (transformerJzodSchema as any).definition.context.transformer_newUuid,
        transformer_parameterReference: (transformerJzodSchema as any).definition.context
          .transformer_parameterReference,
        transformerForBuild_objectDynamicAccess: (transformerJzodSchema as any).definition.context
          .transformerForBuild_objectDynamicAccess,
        transformerForBuild_InnerReference: (transformerJzodSchema as any).definition.context
          .transformerForBuild_InnerReference,
        transformer_mustacheStringTemplate: (transformerJzodSchema as any).definition.context
          .transformer_mustacheStringTemplate,
        // Extractor Templates
        extractorTemplateRoot: (miroirFundamentalJzodSchema as any).definition.context
          .extractorTemplateRoot,
        queryFailed: (miroirFundamentalJzodSchema as any).definition.context.queryFailed,
        extractorTemplateByManyToManyRelationReturningObjectList: (
          miroirFundamentalJzodSchema as any
        ).definition.context.extractorTemplateByManyToManyRelationReturningObjectList,
        extractorTemplateForObjectListByEntity: (miroirFundamentalJzodSchema as any).definition
          .context.extractorTemplateForObjectListByEntity,
        extractorTemplateByRelationReturningObjectList: (miroirFundamentalJzodSchema as any)
          .definition.context.extractorTemplateByRelationReturningObjectList,
        extractorTemplateCombinerForObjectByRelation: (miroirFundamentalJzodSchema as any)
          .definition.context.extractorTemplateCombinerForObjectByRelation,
        extractorTemplateExtractorForObjectByDirectReference: (miroirFundamentalJzodSchema as any)
          .definition.context.extractorTemplateExtractorForObjectByDirectReference,
        extractorTemplateByExtractorWrapperReturningObject: (miroirFundamentalJzodSchema as any)
          .definition.context.extractorTemplateByExtractorWrapperReturningObject,
        extractorTemplateByExtractorWrapperReturningList: (miroirFundamentalJzodSchema as any)
          .definition.context.extractorTemplateByExtractorWrapperReturningList,
        extractorTemplateByExtractorWrapper: (miroirFundamentalJzodSchema as any).definition.context
          .extractorTemplateByExtractorWrapper,
        extractorTemplateReturningObject: (miroirFundamentalJzodSchema as any).definition.context
          .extractorTemplateReturningObject,
        extractorTemplateReturningObjectList: (miroirFundamentalJzodSchema as any).definition
          .context.extractorTemplateReturningObjectList,
        extractorTemplateReturningObjectOrObjectList: (miroirFundamentalJzodSchema as any)
          .definition.context.extractorTemplateReturningObjectOrObjectList,
        extractorTemplateByExtractorCombiner: (miroirFundamentalJzodSchema as any).definition
          .context.extractorTemplateByExtractorCombiner,
        extractorOrCombinerTemplate: (miroirFundamentalJzodSchema as any).definition.context
          .extractorOrCombinerTemplate,
        extractorOrCombinerTemplateRecord: (miroirFundamentalJzodSchema as any).definition.context
          .extractorOrCombinerTemplateRecord,
        transformerForBuild_Abstract: (miroirFundamentalJzodSchema as any).definition.context
          .transformerForBuild_Abstract,
        transformerForBuild_parameterReference: (transformerJzodSchema as any).definition.context
          .transformerForBuild_parameterReference,
        transformerForBuild_constant: (miroirFundamentalJzodSchema as any).definition.context
          .transformerForBuild_constant,
        transformerForBuild_constantArray: (miroirFundamentalJzodSchema as any).definition.context
          .transformerForBuild_constantArray,
        transformerForBuild_constantBigint: (miroirFundamentalJzodSchema as any).definition.context
          .transformerForBuild_constantBigint,
        transformerForBuild_constantBoolean: (miroirFundamentalJzodSchema as any).definition.context
          .transformerForBuild_constantBoolean,
        transformerForBuild_constantNumber: (miroirFundamentalJzodSchema as any).definition.context
          .transformerForBuild_constantNumber,
        transformerForBuild_constantObject: (miroirFundamentalJzodSchema as any).definition.context
          .transformerForBuild_constantObject,
        transformerForBuild_constantString: (miroirFundamentalJzodSchema as any).definition.context
          .transformerForBuild_constantString,
        transformerForBuild_constantUuid: (miroirFundamentalJzodSchema as any).definition.context
          .transformerForBuild_constantUuid,
        transformerForBuild_constants: (miroirFundamentalJzodSchema as any).definition.context
          .transformerForBuild_constants,
        transformerForBuild: (transformerJzodSchema as any).definition.context.transformerForBuild,
        transformerForBuild_count: (miroirFundamentalJzodSchema as any).definition.context.transformerForBuild_count,
        transformerForBuild_unique: (miroirFundamentalJzodSchema as any).definition.context.transformerForBuild_unique,
        transformerForBuild_dataflowObject: (miroirFundamentalJzodSchema as any).definition.context
          .transformerForBuild_dataflowObject,
        transformerForBuild_dataflowSequence: (transformerJzodSchema as any).definition.context
          .transformerForBuild_dataflowSequence,
        transformerForBuild_freeObjectTemplate: (miroirFundamentalJzodSchema as any).definition.context
          .transformerForBuild_freeObjectTemplate,
        transformerForBuild_objectAlter: (miroirFundamentalJzodSchema as any).definition.context
          .transformerForBuild_objectAlter,
        transformerForBuild_list: (transformerJzodSchema as any).definition.context
          .transformerForBuild_list,
        transformerForBuild_mustacheStringTemplate: (miroirFundamentalJzodSchema as any).definition
          .context.transformerForBuild_mustacheStringTemplate,
        transformerForBuild_list_listMapperToList: (miroirFundamentalJzodSchema as any).definition
          .context.transformerForBuild_list_listMapperToList,
        transformerForBuild_object_listReducerToIndexObject: (miroirFundamentalJzodSchema as any)
          .definition.context.transformerForBuild_object_listReducerToIndexObject,
        transformerForRuntime_object_listReducerToIndexObject: (miroirFundamentalJzodSchema as any)
          .definition.context.transformerForRuntime_object_listReducerToIndexObject,
        transformerForBuild_object_listReducerToSpreadObject: (miroirFundamentalJzodSchema as any)
          .definition.context.transformerForBuild_object_listReducerToSpreadObject,
        transformerForBuild_object: (transformerJzodSchema as any).definition.context
          .transformerForBuild_object,
        // transformerForBuild_object_fullTemplate_root: (miroirFundamentalJzodSchema as any)
        //   .definition.context.transformerForBuild_object_fullTemplate_root,
        transformerForBuild_object_fullTemplate: (miroirFundamentalJzodSchema as any).definition
          .context.transformerForBuild_object_fullTemplate,
        transformerForBuild_object_listPickElement: (miroirFundamentalJzodSchema as any).definition
          .context.transformerForBuild_object_listPickElement,
        // transformerForBuild_objectEntries_root: (transformerJzodSchema as any).definition.context
        //   .transformerForBuild_objectEntries_root,
        transformerForBuild_objectEntries: (miroirFundamentalJzodSchema as any).definition.context
          .transformerForBuild_objectEntries,
        // transformerForBuild_objectValues_root: (transformerJzodSchema as any).definition.context
        //   .transformerForBuild_objectValues_root,
        transformerForBuild_objectValues: (miroirFundamentalJzodSchema as any).definition.context
          .transformerForBuild_objectValues,
        transformerForBuild_string: (transformerJzodSchema as any).definition.context
          .transformerForBuild_string,
        transformerForRuntime_Abstract: (miroirFundamentalJzodSchema as any).definition.context
          .transformerForRuntime_Abstract,
        transformerForRuntime_count: (miroirFundamentalJzodSchema as any).definition.context
            .transformerForRuntime_count,
        transformerForRuntime_unique: (miroirFundamentalJzodSchema as any).definition.context
              .transformerForRuntime_unique,
        transformerForRuntime_contextReference: (transformerJzodSchema as any).definition.context
          .transformerForRuntime_contextReference,
        transformer_contextOrParameterReferenceTO_REMOVE: (transformerJzodSchema as any).definition.context
          .transformer_contextOrParameterReferenceTO_REMOVE,
        transformerForRuntime_dataflowObject: (miroirFundamentalJzodSchema as any).definition.context
          .transformerForRuntime_dataflowObject,
        transformerForRuntime_dataflowSequence: (transformerJzodSchema as any).definition.context
          .transformerForRuntime_dataflowSequence,
        transformerForRuntime_freeObjectTemplate: (miroirFundamentalJzodSchema as any).definition.context
          .transformerForRuntime_freeObjectTemplate,
        transformerForRuntime_orderedTransformer: (miroirFundamentalJzodSchema as any).definition
          .context.transformerForRuntime_orderedTransformer,
        transformerForRuntime_innerFullObjectTemplate: (transformerJzodSchema as any).definition
          .context.transformerForRuntime_innerFullObjectTemplate,
        transformerForRuntime_InnerReference: (transformerJzodSchema as any).definition.context
          .transformerForRuntime_InnerReference,
        transformerForRuntime_object_fullTemplate: (miroirFundamentalJzodSchema as any).definition
          .context.transformerForRuntime_object_fullTemplate,
        transformerForRuntime_objectDynamicAccess: (transformerJzodSchema as any).definition.context
          .transformerForBuild_objectDynamicAccess,
        transformerForRuntime_objectEntries: (miroirFundamentalJzodSchema as any).definition.context
          .transformerForRuntime_objectEntries,
        transformerForRuntime_objectValues: (miroirFundamentalJzodSchema as any).definition.context
          .transformerForRuntime_objectValues,
        transformerForRuntime_list_listPickElement: (miroirFundamentalJzodSchema as any).definition
          .context.transformerForRuntime_list_listPickElement,
        transformerForRuntime_object_alter: (transformerJzodSchema as any).definition.context
          .transformerForRuntime_object_alter,
        transformerForRuntime_list_listMapperToList: (miroirFundamentalJzodSchema as any).definition
          .context.transformerForRuntime_list_listMapperToList,
        transformerForRuntime_object_listReducerToSpreadObject: (miroirFundamentalJzodSchema as any)
          .definition.context.transformerForRuntime_object_listReducerToSpreadObject,
        // transformerForRuntime_mapper_listToObject: (transformerJzodSchema as any).definition.context
        //   .transformerForRuntime_mapper_listToObject,
        transformerForRuntime_mustacheStringTemplate_NOT_IMPLEMENTED: (transformerJzodSchema as any).definition
          .context.transformer_mustacheStringTemplate,
        transformerForRuntime_newUuid: (transformerJzodSchema as any).definition.context
          .transformer_newUuid,
        // transformerForRuntime_mustacheStringTemplate_NOT_IMPLEMENTED: (miroirFundamentalJzodSchema as any).definition.context.transformerForRuntime_mustacheStringTemplate_NOT_IMPLEMENTED,
        transformerForRuntime: (transformerJzodSchema as any).definition.context
          .transformerForRuntime,
        transformer_menu_addItem: (miroirFundamentalJzodSchema as any).definition.context
          .transformer_menu_addItem,
        transformerForBuildOrRuntime: (transformerJzodSchema as any).definition.context
          .transformerForBuildOrRuntime,
        extendedTransformerForRuntime: (miroirFundamentalJzodSchema as any).definition.context
          .extendedTransformerForRuntime,
        boxedExtractorTemplateReturningObject: (miroirFundamentalJzodSchema as any).definition
          .context.boxedExtractorTemplateReturningObject,
        boxedExtractorTemplateReturningObjectList: (miroirFundamentalJzodSchema as any).definition
          .context.boxedExtractorTemplateReturningObjectList,
        boxedExtractorTemplateReturningObjectOrObjectList: (miroirFundamentalJzodSchema as any)
          .definition.context.boxedExtractorTemplateReturningObjectOrObjectList,
        boxedQueryTemplateWithExtractorCombinerTransformer: (miroirFundamentalJzodSchema as any)
          .definition.context.boxedQueryTemplateWithExtractorCombinerTransformer,
      },
      definition: {
        relativePath: "jzodElement",
      },
    },
  };

  // log.info("innerResolutionStore", innerResolutionStore);

  const localizedResolutionStore: Record<string, any> = Object.fromEntries(
    Object.entries(innerResolutionStore).map((e) => [
      e[0],
      makeReferencesAbsolute(e[1], miroirFundamentalJzodSchemaUuid, true) as any,
    ])
  );

  // log.info("localizedResolutionStore", JSON.stringify(localizedResolutionStore, null, 2));

  // const carryOnSchema: any = transformerJzodSchema.definition.context.transformerForBuild as any;
  const carryOnSchema: any = transformerJzodSchema.definition.context
    .transformerForBuild as any;

  // const carryOnSchemaReference: JzodReference = {
  const carryOnSchemaReference: any = {
    type: "schemaReference",
    definition: {
      relativePath: "carryOnObject",
    },
  };

  // console.log("getMiroirFundamentalJzodSchema #######################################################")
  // console.log("getMiroirFundamentalJzodSchema", "localizedResolutionStore", JSON.stringify(localizedResolutionStore, null, 2))
  // console.log("getMiroirFundamentalJzodSchema #######################################################")
  // const localizedInnerResolutionStoreReferences: Record<string, JzodReference> = Object.fromEntries(

  const resolveReferencesWithCarryOn: JzodReferenceResolutionFunction = ((
    ref: any
  ): any | undefined => {
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
        "getMiroirFundamentalJzodSchema applyCarryOnSchema resolve reference could not find reference " +
          JSON.stringify(ref) +
          " in " +
          Object.keys(innerResolutionStore)
      );
    }
  }) as any;

  const extendedSchemas = getExtendedSchemas(jzodSchemajzodMiroirBootstrapSchema);

  // pre-converts extended schemas to carryOnSchema, since extended schemas have "eager" references to the carryOnSchema
  const localizedInnerResolutionStoreExtendedReferences: Record<string, JzodElement> =
    Object.fromEntries(
      Object.entries(localizedResolutionStore).flatMap((e) =>
        Object.entries(e[1].context ?? {})
          .filter((e) => extendedSchemas.includes(e[0]))
          .map((f) => [
            forgeCarryOnReferenceName(e[0], f[0], "extend"),
            // TODO: add inner references to environment!!!!
            applyCarryOnSchemaOnLevel(
              f[1] as any,
              carryOnSchemaReference as any,
              false /** applyOnFirstLevel is false, since the result will be an object that is used in an "extend" clause */,
              undefined,
              "extend",
              resolveReferencesWithCarryOn
            ).resultSchema,
          ])
      )
    );

  // console.log(
  //   "getMiroirFundamentalJzodSchema localizedInnerResolutionStoreExtendedReferences",
  //   JSON.stringify(Object.keys(localizedInnerResolutionStoreExtendedReferences), null, 2)
  // );

  const localizedInnerResolutionStorePlainReferences = Object.fromEntries(
    Object.entries(localizedResolutionStore).flatMap((e) =>
      Object.entries(e[1].context ?? {}).map((f) => [
        forgeCarryOnReferenceName(e[0], f[0]),
        // TODO: add inner references to environment!!!!
        applyCarryOnSchemaOnLevel(
          f[1] as any,
          carryOnSchemaReference as any,
          true, // applyOnFirstLevel
          undefined,
          undefined,
          resolveReferencesWithCarryOn
        ).resultSchema,
      ])
    )
  );

  // console.log("localizedInnerResolutionStorePlainReferences", JSON.stringify(localizedInnerResolutionStorePlainReferences, null, 2))
  // console.log(
  //   "getMiroirFundamentalJzodSchema localizedInnerResolutionStorePlainReferences",
  //   JSON.stringify(Object.keys(localizedInnerResolutionStorePlainReferences), null, 2)
  // );

  const localizedInnerResolutionStoreReferences = Object.assign(
    {},
    localizedInnerResolutionStoreExtendedReferences,
    localizedInnerResolutionStorePlainReferences
  );

  // console.log("localizedInnerResolutionStoreReferences", JSON.stringify(localizedInnerResolutionStoreReferences.keys, null, 2));

  const miroirFundamentalJzodSchemaWithActionTemplate: any = {
    ...miroirFundamentalJzodSchema,
    definition: {
      ...miroirFundamentalJzodSchema.definition,
      context: {
        ...((miroirFundamentalJzodSchema.definition as any)?.context ?? {}),
        ...localizedInnerResolutionStoreReferences,
        carryOnObject: carryOnSchema,
        ...(() => {
          // defining a function, which is called immediately (just one time)
          const compositeActionSchemaBuilder = applyCarryOnSchema(
            {
              type: "schemaReference",
              definition: {
                relativePath: forgeCarryOnReferenceName(
                  miroirFundamentalJzodSchemaUuid,
                  "compositeAction"
                ),
              },
            },
            carryOnSchemaReference as any,
            undefined, // reference prefix
            undefined, // reference suffix
            resolveReferencesWithCarryOn
          );
          return {
            ...compositeActionSchemaBuilder.resolvedReferences,
            // TODO: use / define replayableActionTemplate (ModelAction + InstanceCUDAction) & Non-transactionalActionTemplate
            // non-transactional action templates can be used wich queries, they do not need to be replayable post-mortem.
            compositeActionTemplate: compositeActionSchemaBuilder.resultSchema, // compositeActionTemplate: THAT's THE RESULT OF THE WHOLE MOVEMENT!
          };
        })(),
      } as Record<string, any /**JzodElement */>,
    } as any /** JzodObjectOrReference */,
  };
  // console.log("entityDefinitionQueryVersionV1WithAbsoluteReferences=",JSON.stringify(entityDefinitionQueryVersionV1WithAbsoluteReferences))

  return miroirFundamentalJzodSchemaWithActionTemplate;
}
