import { applyCarryOnSchema, applyCarryOnSchemaOnLevel, forgeCarryOnReferenceName } from "@miroir-framework/jzod";
/**
 * BEWARE: since this file is involved in generating
 * "../preprocessor-generated/miroirFundamentalType.js"
 * it CAN NOT use types from it, for the sake of circularity avoidance!
 *  */

// import {
//   EntityDefinition,
//   JzodElement,
//   JzodObject,
//   JzodObjectOrReference,
//   JzodReference,
//   JzodSchema,
//   JzodUnion,
//   miroirCrossJoinQuery,
//   extractorOrCombinerTemplateRecord,
// } from "../preprocessor-generated/miroirFundamentalType";
import { cleanLevel } from "../../../1_core/constants";
import { MiroirLoggerFactory } from "../../../4_services/Logger";
import { packageName } from "../../../constants";
import { getLoggerName } from "../../../tools";
import { LoggerInterface } from "../../4-services/LoggerInterface";
import {
  extractorOrCombinerReturningObject,
  boxedQueryWithExtractorCombinerTransformer,
  JzodElement,
  transformerForBuild_list_pickElement,
  transformerForRuntime_list_pickElement,
} from "../preprocessor-generated/miroirFundamentalType";
import { optional } from "zod";
// import { Endpoint } from "../../../3_controllers/Endpoint";

const loggerName: string = getLoggerName(packageName, cleanLevel, "getMiroirFundamentalJzodSchema");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
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
            throw new Error("makeReferencesAbsolute schemaReference: context jzodSchema is undefined for " + e[0]);
            // throw new Error("makeReferencesAbsolute schemaReference: context jzodSchema is undefined for " + e[0] + " context " + JSON.stringify(Object.keys(jzodSchema.context)));
          }
          return [
          // Object.entries(jzodSchema.context ?? {}).map((e: [string, JzodElement]) => [
            e[0],
            makeReferencesAbsolute(e[1], absolutePath, force),
        ]})
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
        ? makeReferencesAbsolute(jzodSchema.extend, absolutePath, force)
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
        throw new Error("makeReferencesAbsolute set: jzodSchema.definition is undefined " + JSON.stringify(jzodSchema));
      }
      return {
        ...jzodSchema,
        definition: makeReferencesAbsolute(jzodSchema.definition, absolutePath, force) as any,
      };
      break;
    }
    case "map": {
      if (!jzodSchema.definition[0]) {
        throw new Error("makeReferencesAbsolute map: jzodSchema.definition[0] is undefined " + JSON.stringify(jzodSchema));
      }
      if (!jzodSchema.definition[1]) {
        throw new Error("makeReferencesAbsolute map: jzodSchema.definition[0] is undefined " + JSON.stringify(jzodSchema));
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
        throw new Error("makeReferencesAbsolute: jzodSchema.definition is undefined " + JSON.stringify(jzodSchema));
      }

      return {
        ...jzodSchema,
        definition: {
          args: jzodSchema.definition.args.map((e: any) => makeReferencesAbsolute(e, absolutePath, force)),
          returns: jzodSchema.definition.returns
            ? makeReferencesAbsolute(jzodSchema.definition.returns, absolutePath, force)
            : undefined,
        },
      };
      break;
    }
    case "intersection": {
      if (!jzodSchema.definition.left) {
        throw new Error("makeReferencesAbsolute intersection: jzodSchema.definition.left is undefined " + JSON.stringify(jzodSchema));
      }
      if (!jzodSchema.definition.right) {
        throw new Error("makeReferencesAbsolute intersection: jzodSchema.definition.left is undefined " + JSON.stringify(jzodSchema));
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
        definition: jzodSchema.definition.map((e: any) => makeReferencesAbsolute(e, absolutePath, force)),
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
  jzodSchemajzodMiroirBootstrapSchema: any,
  transformerJzodSchema: any,
  dynamicTransformersJzodSchema: any[], // TransformerDefinition[]
  entityDefinitionApplicationV1: any,
  entityDefinitionApplicationVersionV1: any,
  entityDefinitionDeployment: any,
  entityDefinitionEntity: any,
  entityDefinitionEntityDefinitionV1: any,
  entityDefinitionJzodSchemaV1: any,
  entityDefinitionMenu: any,
  entityDefinitionQueryVersionV1: any,
  entityDefinitionReportV1: any
): any {
  // ): JzodSchema {
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

  // log.info("domainActionDefinitions", domainActionDefinitions)
  log.info("dynamicTransformersJzodSchema", JSON.stringify(dynamicTransformersJzodSchema, null, 2));

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
        ______________________________________________transformers_____________________________________________: {
          type: "never",
        },
        // ...(transformerJzodSchema as any).definition.context, // gives "transformer_InnerReference", "transformerForBuild", "actionHandler"
        ...makeReferencesAbsolute(
          (transformerJzodSchema as any).definition,
          miroirFundamentalJzodSchemaUuid,
          true
        ).context, // gives "transformer_InnerReference", "transformerForBuild", "actionHandler"
        ...Object.fromEntries(
          dynamicTransformersJzodSchema.map((e: any) => [
            e.name,
            { type: "object", definition: e.transformerInterface.transformerParameterSchema },
          ])
        ),
        extendedTransformerForRuntime: {
          "type": "union",
          definition: [
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": miroirFundamentalJzodSchemaUuid,
                "relativePath": "transformerForRuntime"
              }
            },
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": miroirFundamentalJzodSchemaUuid,
                "relativePath": "transformer_menu_addItem"
              }
            }
          ]
        },
        ______________________________________________miroirMetaModel_____________________________________________: {
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
                  tag: { value: { id: 1, defaultLabel: "Current Application Version", editable: false } },
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
        ______________________________________________entities_____________________________________________: {
          type: "never",
        },
        application: entityDefinitionApplicationV1.jzodSchema as any,
        applicationVersion: entityDefinitionApplicationVersionV1.jzodSchema as any,
        bundle: entityDefinitionBundleV1.jzodSchema as any,
        deployment: entityDefinitionDeployment.jzodSchema as any,
        entity: entityDefinitionEntity.jzodSchema as any,
        entityDefinition: entityDefinitionEntityDefinitionV1.jzodSchema as any,
        // application: entityDefinitionApplicationV1.jzodSchema as JzodObject,
        // applicationVersion: entityDefinitionApplicationVersionV1.jzodSchema as JzodObject,
        // bundle: entityDefinitionBundleV1.jzodSchema as JzodObject,
        // deployment: entityDefinitionDeployment.jzodSchema as JzodObject,
        // entity: entityDefinitionEntity.jzodSchema as JzodObject,
        // entityDefinition: entityDefinitionEntityDefinitionV1.jzodSchema as JzodObject,
        ...(entityDefinitionMenu.jzodSchema.definition.definition as any).context,
        menu: entityDefinitionMenu.jzodSchema as any,
        // menu: entityDefinitionMenu.jzodSchema as JzodObject,
        ...Object.fromEntries(
          Object.entries((entityDefinitionReportV1 as any).jzodSchema.definition.definition.context).filter((e) =>
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
        jzodObjectOrReference: (entityDefinitionJzodSchemaV1 as any).jzodSchema.definition.definition.context
          .jzodObjectOrReference,
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
                    tag: { value: { id: 1, defaultLabel: "Application Version", editable: false } },
                  },
                  entityDefinition: {
                    type: "uuid",
                    tag: { value: { id: 1, defaultLabel: "Entity Definition", editable: false } },
                  },
                },
              },
            },
            configuration: {
              type: "array",
              definition: {
                type: "schemaReference",
                definition: {
                  absolutePath: miroirFundamentalJzodSchemaUuid,
                  relativePath: "storeBasedConfiguration",
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
        _________________________________configuration_and_bundles_________________________________: {
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
        miroirConfigForMswClient: {
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
            client: {
              type: "union",
              definition: [
                {
                  type: "schemaReference",
                  definition: {
                    absolutePath: miroirFundamentalJzodSchemaUuid,
                    relativePath: "miroirConfigForMswClient",
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
        ______________________________________________queries_____________________________________________: {
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
          ],
        },
        domainElement: {
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
                relativePath: "domainElementFailed",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementObjectOrFailed",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementInstanceUuidIndexOrFailed",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementEntityInstanceCollectionOrFailed",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementInstanceArrayOrFailed",
              },
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: miroirFundamentalJzodSchemaUuid,
                relativePath: "domainElementEntityInstanceOrFailed",
              },
            },
            {
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
            {
              type: "object",
              definition: {
                elementType: {
                  type: "literal",
                  definition: "instanceUuidIndexUuidIndex",
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
            {
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
            {
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
            {
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
            deploymentUuid: { // TODO: REPLACE WITH APPLICATION UUID OR LEAVE IT OPTIONAL
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
        ______________________________________________actions_____________________________________________: {
          type: "never",
        },
        actionError: {
          type: "object",
          definition: {
            status: { type: "literal", definition: "error" },
            error: {
              type: "object",
              definition: {
                errorType: {
                  type: "union",
                  definition: [
                    ...(storeManagementEndpoint as any).definition.actions
                      .filter((e: any) => !!e.actionErrors)
                      .map((e: any) => e.actionErrors),
                    ...(instanceEndpointVersionV1 as any).definition.actions
                      .filter((e: any) => !!e.actionErrors)
                      .map((e: any) => e.actionErrors),
                  ],
                },
                errorMessage: { type: "string", optional: true },
                error: {
                  type: "object",
                  optional: true,
                  definition: {
                    errorMessage: { type: "string", optional: true },
                    stack: {
                      type: "array",
                      definition: { type: "string", optional: true },
                    },
                  },
                },
              },
            },
          },
        },
        actionVoidSuccess: {
          type: "object",
          definition: {
            status: { type: "literal", definition: "ok" },
            returnedDomainElement: {
              type: "schemaReference",
              definition: { absolutePath: miroirFundamentalJzodSchemaUuid, relativePath: "domainElementVoid" },
            },
          },
        },
        actionVoidReturnType: {
          type: "union",
          definition: [
            {
              type: "schemaReference",
              definition: { absolutePath: miroirFundamentalJzodSchemaUuid, relativePath: "actionError" },
            },
            {
              type: "schemaReference",
              definition: { absolutePath: miroirFundamentalJzodSchemaUuid, relativePath: "actionVoidSuccess" },
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
              definition: { absolutePath: miroirFundamentalJzodSchemaUuid, relativePath: "actionError" },
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
              definition: { absolutePath: miroirFundamentalJzodSchemaUuid, relativePath: "actionError" },
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
              definition: { absolutePath: miroirFundamentalJzodSchemaUuid, relativePath: "domainElement" },
            },
          },
        },
        actionReturnType: {
          type: "union",
          definition: [
            {
              type: "schemaReference",
              definition: { absolutePath: miroirFundamentalJzodSchemaUuid, relativePath: "actionError" },
            },
            {
              type: "schemaReference",
              definition: { absolutePath: miroirFundamentalJzodSchemaUuid, relativePath: "actionSuccess" },
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
          definition: instanceEndpointVersionV1.definition.actions.map((e: any) => e.actionParameters),
        },
        undoRedoAction: {
          type: "union",
          definition: undoRedoEndpointVersionV1.definition.actions.map((e: any) => e.actionParameters),
        },
        transactionalInstanceAction: domainEndpointVersionV1.definition.actions.find(
          (a: any) =>
            a.actionParameters.definition.actionType &&
            a.actionParameters.definition.actionType.definition == "transactionalInstanceAction"
        )?.actionParameters,
        localCacheAction: {
          type: "union",
          definition: localCacheEndpointVersionV1.definition.actions.map((e: any) => e.actionParameters),
        },
        storeManagementAction: {
          type: "union",
          definition: storeManagementEndpoint.definition.actions.map((e: any) => e.actionParameters),
        },
        persistenceAction: {
          type: "union",
          definition: persistenceEndpointVersionV1.definition.actions.map((e: any) => e.actionParameters),
        },
        localPersistenceAction: persistenceEndpointVersionV1.definition.actions[0].actionParameters,
        restPersistenceAction: persistenceEndpointVersionV1.definition.actions[1].actionParameters,
        runBoxedQueryTemplateOrBoxedExtractorTemplateAction: queryEndpointVersionV1.definition.actions[0].actionParameters,
        runBoxedExtractorOrQueryAction: queryEndpointVersionV1.definition.actions[1].actionParameters,
        runBoxedQueryTemplateAction: queryEndpointVersionV1.definition.actions[2].actionParameters,
        runBoxedExtractorTemplateAction: queryEndpointVersionV1.definition.actions[3].actionParameters,
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
        domainAction: {
          type: "union",
          definition: domainEndpointVersionV1.definition.actions.map((e: any) => e.actionParameters),
        },
        // ...(transformerJzodSchema as any).definition.context, // gives "transformer_InnerReference", "transformerForBuild", "actionHandler"
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
      },
      definition: {
        absolutePath: miroirFundamentalJzodSchemaUuid,
        relativePath: "miroirAllFundamentalTypesUnion",
      },
    },
  };

  const domainActionDefinitions = {
    undoRedoAction: (miroirFundamentalJzodSchema.definition as any).context?.undoRedoAction as any,
    storeOrBundleAction: (miroirFundamentalJzodSchema.definition as any).context?.storeOrBundleAction as any,
    modelAction: (miroirFundamentalJzodSchema.definition as any).context?.modelAction as any,
    instanceAction: (miroirFundamentalJzodSchema.definition as any).context?.instanceAction as any,
    storeManagementAction: (miroirFundamentalJzodSchema.definition as any).context?.storeManagementAction as any,
    // undoRedoAction: (miroirFundamentalJzodSchema.definition as JzodReference).context?.undoRedoAction as JzodElement,
    // storeOrBundleAction: (miroirFundamentalJzodSchema.definition as JzodReference).context
    //   ?.storeOrBundleAction as JzodElement,
    // modelAction: (miroirFundamentalJzodSchema.definition as JzodReference).context?.modelAction as JzodElement,
    // instanceAction: (miroirFundamentalJzodSchema.definition as JzodReference).context?.instanceAction as JzodElement,
    // storeManagementAction: (miroirFundamentalJzodSchema.definition as JzodReference).context
    //   ?.storeManagementAction as JzodElement,
    transactionalInstanceAction: domainEndpointVersionV1.definition.actions.find(
      (a: any) =>
        a.actionParameters.definition.actionType &&
        a.actionParameters.definition.actionType.definition == "transactionalInstanceAction"
    ).actionParameters,
  };

  // console.log("################## domainActionDefinitions", JSON.stringify(domainActionDefinitions, null, 2))
  console.log("################## miroirFundamentalJzodSchema", JSON.stringify(Object.keys(miroirFundamentalJzodSchema.definition.context), null, 2))

  // const innerResolutionStore: Record<string, JzodReference> = {
  const innerResolutionStore: Record<string, any> = {
    // TODO: transform all inner references in jzodSchemajzodMiroirBootstrapSchema into innerResolutionStoreReferences
    [miroirFundamentalJzodSchemaUuid]: {
      type: "schemaReference",
      context: {
        // ...(jzodSchemajzodMiroirBootstrapSchema.definition as JzodReference).context,
        ...(jzodSchemajzodMiroirBootstrapSchema.definition as any).context,
        dataStoreType: (miroirFundamentalJzodSchema as any).definition.context.dataStoreType,
        application: (miroirFundamentalJzodSchema as any).definition.context.application,
        applicationVersion: (miroirFundamentalJzodSchema as any).definition.context.applicationVersion,
        menu: (miroirFundamentalJzodSchema as any).definition.context.menu,
        menuDefinition: (miroirFundamentalJzodSchema as any).definition.context.menuDefinition,
        entity: (miroirFundamentalJzodSchema as any).definition.context.entity,
        entityDefinition: (miroirFundamentalJzodSchema as any).definition.context.entityDefinition,
        applicationSection: (miroirFundamentalJzodSchema as any).definition.context.applicationSection,
        entityInstance: (miroirFundamentalJzodSchema as any).definition.context.entityInstance,
        entityInstanceUuid: (miroirFundamentalJzodSchema as any).definition.context.entityInstanceUuid,
        // instanceUuidIndexUuidIndex: (miroirFundamentalJzodSchema as any).definition.context.instanceUuidIndexUuidIndex,
        entityInstancesUuidIndex: (miroirFundamentalJzodSchema as any).definition.context.entityInstancesUuidIndex,
        deployment: (miroirFundamentalJzodSchema as any).definition.context.deployment,
        // domain elements  ###########################################################
        // definition: [
        //   },
        //   {
        //     type: "object",
        //     definition: {
        //       elementType: {
        //         type: "literal",
        //         definition: "instanceUuidIndexUuidIndex",
        //       },
        //       elementValue: {
        //         type: "schemaReference",
        //         definition: {
        //           absolutePath: miroirFundamentalJzodSchemaUuid,
        //           relativePath: "entityInstancesUuidIndex",
        //         },
        //       },
        //     },
        //   },
        //   {
        //     type: "object",
        //     definition: {
        //       elementType: {
        //         type: "literal",
        //         definition: "failure",
        //       },
        //       elementValue: {
        //         type: "schemaReference",
        //         definition: {
        //           absolutePath: miroirFundamentalJzodSchemaUuid,
        //           relativePath: "queryFailed",
        //         },
        //       },
        //     },
        //   },
        //   {
        //     type: "object",
        //     definition: {
        //       elementType: {
        //         type: "literal",
        //         definition: "string",
        //       },
        //       elementValue: {
        //         type: "string",
        //       },
        //     },
        //   },
        //   {
        //     type: "object",
        //     definition: {
        //       elementType: {
        //         type: "literal",
        //         definition: "array",
        //       },
        //       elementValue: {
        //         type: "array",
        //         definition: {
        //           type: "schemaReference",
        //           definition: {
        //             relativePath: "domainElement",
        //           },
        //         },
        //       },
        //     },
        //   },
        // ],
        domainElementVoid: (miroirFundamentalJzodSchema as any).definition.context.domainElementVoid,
        domainElementAny: (miroirFundamentalJzodSchema as any).definition.context.domainElementAny,
        domainElementFailed: (miroirFundamentalJzodSchema as any).definition.context.domainElementFailed,
        domainElementObject: (miroirFundamentalJzodSchema as any).definition.context.domainElementObject,
        domainElementObjectOrFailed: (miroirFundamentalJzodSchema as any).definition.context
          .domainElementObjectOrFailed,
        domainElementInstanceUuidIndex: (miroirFundamentalJzodSchema as any).definition.context
          .domainElementInstanceUuidIndex,
        domainElementInstanceUuidIndexOrFailed: (miroirFundamentalJzodSchema as any).definition.context
          .domainElementInstanceUuidIndexOrFailed,
        domainElementEntityInstanceCollection: (miroirFundamentalJzodSchema as any).definition.context
          .domainElementEntityInstanceCollection,
        domainElementEntityInstanceCollectionOrFailed: (miroirFundamentalJzodSchema as any).definition.context
          .domainElementEntityInstanceCollectionOrFailed,
        domainElementInstanceArray: (miroirFundamentalJzodSchema as any).definition.context.domainElementInstanceArray,
        domainElementInstanceArrayOrFailed: (miroirFundamentalJzodSchema as any).definition.context
          .domainElementInstanceArrayOrFailed,
        domainElementEntityInstance: (miroirFundamentalJzodSchema as any).definition.context
          .domainElementEntityInstance,
        domainElementEntityInstanceOrFailed: (miroirFundamentalJzodSchema as any).definition.context
          .domainElementEntityInstanceOrFailed,
        domainElement: (miroirFundamentalJzodSchema as any).definition.context.domainElement,
        entityInstanceCollection: (miroirFundamentalJzodSchema as any).definition.context.entityInstanceCollection,
        jzodSchema: (miroirFundamentalJzodSchema as any).definition.context.jzodSchema,
        ...(miroirFundamentalJzodSchema as any).definition.context.menu.definition.definition.context,
        jzodObjectOrReference: (miroirFundamentalJzodSchema as any).definition.context.jzodObjectOrReference,
        objectInstanceReportSection: (miroirFundamentalJzodSchema as any).definition.context
          .objectInstanceReportSection,
        objectListReportSection: (miroirFundamentalJzodSchema as any).definition.context.objectListReportSection,
        gridReportSection: (miroirFundamentalJzodSchema as any).definition.context.gridReportSection,
        listReportSection: (miroirFundamentalJzodSchema as any).definition.context.listReportSection,
        reportSection: (miroirFundamentalJzodSchema as any).definition.context.reportSection,
        rootReport: (miroirFundamentalJzodSchema as any).definition.context.rootReport,
        report: (miroirFundamentalJzodSchema as any).definition.context.report,
        transformer: (miroirFundamentalJzodSchema as any).definition.context.transformer,
        recordOfTransformers: (miroirFundamentalJzodSchema as any).definition.context.recordOfTransformers,
        metaModel: (miroirFundamentalJzodSchema as any).definition.context.metaModel,
        indexedDbStoreSectionConfiguration: (miroirFundamentalJzodSchema as any).definition.context
          .indexedDbStoreSectionConfiguration,
        filesystemDbStoreSectionConfiguration: (miroirFundamentalJzodSchema as any).definition.context
          .filesystemDbStoreSectionConfiguration,
        sqlDbStoreSectionConfiguration: (miroirFundamentalJzodSchema as any).definition.context
          .sqlDbStoreSectionConfiguration,
        storeBasedConfiguration: (miroirFundamentalJzodSchema as any).definition.context.storeBasedConfiguration,
        storeUnitConfiguration: (miroirFundamentalJzodSchema as any).definition.context.storeUnitConfiguration,
        storeSectionConfiguration: (miroirFundamentalJzodSchema as any).definition.context.storeSectionConfiguration,
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
          definition: domainEndpointVersionV1.definition.actions.map((e: any) => e.actionParameters),
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
        shippingBox: (miroirFundamentalJzodSchema as any).definition.context.shippingBox,
        boxedExtractorOrCombinerReturningObject: (miroirFundamentalJzodSchema as any).definition.context.boxedExtractorOrCombinerReturningObject,
        boxedExtractorOrCombinerReturningObjectList: (miroirFundamentalJzodSchema as any).definition.context.boxedExtractorOrCombinerReturningObjectList,
        boxedQueryWithExtractorCombinerTransformer: (miroirFundamentalJzodSchema as any).definition.context.boxedQueryWithExtractorCombinerTransformer,
        boxedExtractorOrCombinerReturningObjectOrObjectList: (miroirFundamentalJzodSchema as any).definition.context.boxedExtractorOrCombinerReturningObjectOrObjectList,
        extractor: (miroirFundamentalJzodSchema as any).definition.context.extractor,
        extractorWrapperReturningList: (miroirFundamentalJzodSchema as any).definition.context.extractorWrapperReturningList,
        extractorWrapperReturningObject: (miroirFundamentalJzodSchema as any).definition.context.extractorWrapperReturningObject,
        extractorByEntityReturningObjectList: (miroirFundamentalJzodSchema as any).definition.context.extractorByEntityReturningObjectList,
        extractorOrCombinerContextReference: (miroirFundamentalJzodSchema as any).definition.context.extractorOrCombinerContextReference,
        extractorForObjectByDirectReference: (miroirFundamentalJzodSchema as any).definition.context.extractorForObjectByDirectReference,
        extractorWrapper: (miroirFundamentalJzodSchema as any).definition.context.extractorWrapper,
        extractorCombinerByHeteronomousManyToManyReturningListOfObjectList: (miroirFundamentalJzodSchema as any).definition.context.extractorCombinerByHeteronomousManyToManyReturningListOfObjectList,
        extractorOrCombiner: (miroirFundamentalJzodSchema as any).definition.context.extractorOrCombiner,
        extractorOrCombinerRoot: (miroirFundamentalJzodSchema as any).definition.context.extractorOrCombinerRoot,
        extractorOrCombinerReturningObject: (miroirFundamentalJzodSchema as any).definition.context.extractorOrCombinerReturningObject,
        extractorOrCombinerReturningObjectList: (miroirFundamentalJzodSchema as any).definition.context.extractorOrCombinerReturningObjectList,
        extractorOrCombinerReturningObjectOrObjectList: (miroirFundamentalJzodSchema as any).definition.context.extractorOrCombinerReturningObjectOrObjectList,
        combinerForObjectByRelation: (miroirFundamentalJzodSchema as any).definition.context.combinerForObjectByRelation,
        combinerByRelationReturningObjectList: (miroirFundamentalJzodSchema as any).definition.context.combinerByRelationReturningObjectList,
        combinerByManyToManyRelationReturningObjectList: (miroirFundamentalJzodSchema as any).definition.context.combinerByManyToManyRelationReturningObjectList,
        extractorOrCombinerRecord: (miroirFundamentalJzodSchema as any).definition.context.extractorOrCombinerRecord,
        runBoxedExtractorOrQueryAction: (miroirFundamentalJzodSchema as any).definition.context.runBoxedExtractorOrQueryAction,
        runBoxedQueryTemplateOrBoxedExtractorTemplateAction: (miroirFundamentalJzodSchema as any).definition.context.runBoxedQueryTemplateOrBoxedExtractorTemplateAction,
        runBoxedQueryAction: (miroirFundamentalJzodSchema as any).definition.context.runBoxedQueryAction,
        runBoxedQueryTemplateAction: (miroirFundamentalJzodSchema as any).definition.context.runBoxedQueryTemplateAction,
        runBoxedExtractorAction: (miroirFundamentalJzodSchema as any).definition.context.runBoxedExtractorAction,
        runBoxedExtractorTemplateAction: (miroirFundamentalJzodSchema as any).definition.context.runBoxedExtractorTemplateAction,
        // runBoxedQueryTemplateOrBoxedExtractorTemplateAction: queryEndpointVersionV1.definition.actions[0].actionParameters,
        // queries
        extractorTemplateRoot: (miroirFundamentalJzodSchema as any).definition.context.extractorTemplateRoot,
        queryFailed: (miroirFundamentalJzodSchema as any).definition.context.queryFailed,
        extractorTemplateByManyToManyRelationReturningObjectList: (miroirFundamentalJzodSchema as any).definition.context
          .extractorTemplateByManyToManyRelationReturningObjectList,
        extractorTemplateForObjectListByEntity: (miroirFundamentalJzodSchema as any).definition.context
          .extractorTemplateForObjectListByEntity,
        extractorTemplateByRelationReturningObjectList: (miroirFundamentalJzodSchema as any).definition.context
          .extractorTemplateByRelationReturningObjectList,
        extractorTemplateCombinerForObjectByRelation: (miroirFundamentalJzodSchema as any).definition.context
          .extractorTemplateCombinerForObjectByRelation,
        extractorTemplateExtractorForObjectByDirectReference: (miroirFundamentalJzodSchema as any).definition.context
          .extractorTemplateExtractorForObjectByDirectReference,
        extractorTemplateByExtractorWrapperReturningObject: (miroirFundamentalJzodSchema as any).definition.context.extractorTemplateByExtractorWrapperReturningObject,
        extractorTemplateByExtractorWrapperReturningList: (miroirFundamentalJzodSchema as any).definition.context.extractorTemplateByExtractorWrapperReturningList,
        extractorTemplateByExtractorWrapper: (miroirFundamentalJzodSchema as any).definition.context.extractorTemplateByExtractorWrapper,
        extractorTemplateReturningObject: (miroirFundamentalJzodSchema as any).definition.context.extractorTemplateReturningObject,
        extractorTemplateReturningObjectList: (miroirFundamentalJzodSchema as any).definition.context.extractorTemplateReturningObjectList,
        extractorTemplateReturningObjectOrObjectList: (miroirFundamentalJzodSchema as any).definition.context.extractorTemplateReturningObjectOrObjectList,
        extractorTemplateByExtractorCombiner: (miroirFundamentalJzodSchema as any).definition.context.extractorTemplateByExtractorCombiner,
        extractorOrCombinerTemplate: (miroirFundamentalJzodSchema as any).definition.context.extractorOrCombinerTemplate,
        extractorOrCombinerTemplateRecord: (miroirFundamentalJzodSchema as any).definition.context.extractorOrCombinerTemplateRecord,
        transformer_mustacheStringTemplate: (transformerJzodSchema as any).definition.context.transformer_mustacheStringTemplate,
        transformer_constantUuid: (transformerJzodSchema as any).definition.context.transformer_constantUuid,
        transformer_constantObject: (transformerJzodSchema as any).definition.context.transformer_constantObject,
        transformer_constantString: (transformerJzodSchema as any).definition.context.transformer_constantString,
        transformer_newUuid: (transformerJzodSchema as any).definition.context.transformer_newUuid,
        transformer_parameterReference: (transformerJzodSchema as any).definition.context.transformer_parameterReference,
        transformer_contextReference: (transformerJzodSchema as any).definition.context.transformer_contextReference,
        transformer_contextOrParameterReference: (transformerJzodSchema as any).definition.context.transformer_contextOrParameterReference,
        transformer_objectDynamicAccess: (transformerJzodSchema as any).definition.context.transformer_objectDynamicAccess,
        transformer_InnerReference: (transformerJzodSchema as any).definition.context.transformer_InnerReference,
        transformerForBuild: (transformerJzodSchema as any).definition.context.transformerForBuild,
        transformerForBuild_mustacheStringTemplate: (miroirFundamentalJzodSchema as any).definition.context.transformerForBuild_mustacheStringTemplate,
        transformerForBuild_orderBy: (miroirFundamentalJzodSchema as any).definition.context.transformerForBuild_orderBy,
        transformerForBuild_unique: (miroirFundamentalJzodSchema as any).definition.context.transformerForBuild_unique,
        transformerForBuild_count: (miroirFundamentalJzodSchema as any).definition.context.transformerForBuild_count,
        transformerForBuild_list_pickElement: (miroirFundamentalJzodSchema as any).definition.context.transformerForBuild_list_pickElement,
        transformerForBuild_innerFullObjectTemplate: (miroirFundamentalJzodSchema as any).definition.context.transformerForBuild_innerFullObjectTemplate,
        transformerForBuild_fullObjectTemplate: (miroirFundamentalJzodSchema as any).definition.context.transformerForBuild_fullObjectTemplate,
        transformerForBuild_freeObjectTemplate: (transformerJzodSchema as any).definition.context.transformerForBuild_freeObjectTemplate,
        transformerForBuild_inner_object_alter: (transformerJzodSchema as any).definition.context.transformerForBuild_inner_object_alter,
        transformerForBuild_mapper_listToList: (miroirFundamentalJzodSchema as any).definition.context.transformerForBuild_mapper_listToList,
        transformerForBuild_mapper_listToObject: (miroirFundamentalJzodSchema as any).definition.context.transformerForBuild_mapper_listToObject,
        transformerForRuntime_Abstract: (miroirFundamentalJzodSchema as any).definition.context.transformerForRuntime_Abstract,
        transformerForRuntime_orderedTransformer: (miroirFundamentalJzodSchema as any).definition.context.transformerForRuntime_orderedTransformer,
        transformerForRuntime_mustacheStringTemplate: (transformerJzodSchema as any).definition.context.transformer_mustacheStringTemplate,
        transformerForRuntime_constantUuid: (transformerJzodSchema as any).definition.context.transformer_constantUuid,
        transformerForRuntime_constantObject: (transformerJzodSchema as any).definition.context.transformer_constantObject,
        transformerForRuntime_constantString: (transformerJzodSchema as any).definition.context.transformer_constantString,
        transformerForRuntime_newUuid: (transformerJzodSchema as any).definition.context.transformer_newUuid,
        transformerForRuntime_parameterReference: (transformerJzodSchema as any).definition.context.transformer_parameterReference,
        transformerForRuntime_contextReference: (transformerJzodSchema as any).definition.context.transformer_contextReference,
        transformerForRuntime_contextOrParameterReference: (transformerJzodSchema as any).definition.context.transformer_contextOrParameterReference,
        transformerForRuntime_objectDynamicAccess: (transformerJzodSchema as any).definition.context.transformer_objectDynamicAccess,
        transformerForRuntime_referencingTransformer: (miroirFundamentalJzodSchema as any).definition.context.transformerForRuntime_referencingTransformer,
        // transformerForRuntime_mustacheStringTemplate: (miroirFundamentalJzodSchema as any).definition.context.transformerForRuntime_mustacheStringTemplate,
        transformerForRuntime_count: (transformerJzodSchema as any).definition.context.transformerForRuntime_count,
        transformerForRuntime_fullObjectTemplate: (transformerJzodSchema as any).definition.context.transformerForRuntime_fullObjectTemplate,
        transformerForRuntime_innerFullObjectTemplate: (transformerJzodSchema as any).definition.context.transformerForRuntime_innerFullObjectTemplate,
        transformerForRuntime_InnerReference: (transformerJzodSchema as any).definition.context.transformerForRuntime_InnerReference,
        transformerForRuntime_unique: (transformerJzodSchema as any).definition.context.transformerForRuntime_unique,
        transformerForRuntime_mapper_listToList: (transformerJzodSchema as any).definition.context.transformerForRuntime_mapper_listToList,
        transformerForRuntime_mapper_listToObject: (transformerJzodSchema as any).definition.context.transformerForRuntime_mapper_listToObject,
        transformerForRuntime_objectValues: (transformerJzodSchema as any).definition.context.transformerForRuntime_objectValues,
        transformerForRuntime_list_pickElement: (transformerJzodSchema as any).definition.context.transformerForRuntime_list_pickElement,
        transformerForRuntime_freeObjectTemplate: (transformerJzodSchema as any).definition.context.transformerForRuntime_freeObjectTemplate,
        transformerForRuntime_object_alter: (transformerJzodSchema as any).definition.context.transformerForRuntime_object_alter,
        transformerForRuntime: (transformerJzodSchema as any).definition.context.transformerForRuntime,
        transformer_menu_addItem: (miroirFundamentalJzodSchema as any).definition.context.transformer_menu_addItem,
        transformerForBuildOrRuntime: (transformerJzodSchema as any).definition.context.transformerForBuildOrRuntime,
        extendedTransformerForRuntime: (miroirFundamentalJzodSchema as any).definition.context.extendedTransformerForRuntime,
        boxedExtractorTemplateReturningObject: (miroirFundamentalJzodSchema as any).definition.context.boxedExtractorTemplateReturningObject,
        boxedExtractorTemplateReturningObjectList: (miroirFundamentalJzodSchema as any).definition.context.boxedExtractorTemplateReturningObjectList,
        boxedExtractorTemplateReturningObjectOrObjectList: (miroirFundamentalJzodSchema as any).definition.context.boxedExtractorTemplateReturningObjectOrObjectList,
        boxedQueryTemplateWithExtractorCombinerTransformer: (miroirFundamentalJzodSchema as any).definition.context.boxedQueryTemplateWithExtractorCombinerTransformer,
      },
      definition: {
        relativePath: "jzodElement",
      },
    },
  };

  // log.info("innerResolutionStore", innerResolutionStore);

  // log.info("innerResolutionStore baseObject", JSON.stringify((innerResolutionStore[miroirFundamentalJzodSchemaUuid] as any).context["jzodBaseObject"], null, 2));
  // log.info("innerResolutionStore array", JSON.stringify((innerResolutionStore[miroirFundamentalJzodSchemaUuid] as any).context["jzodArray"], null, 2));

  const localizedResolutionStore: Record<string, any> = Object.fromEntries(
    // const localizedResolutionStore: Record<string, JzodReference> = Object.fromEntries(
    Object.entries(innerResolutionStore).map((e) => [
      e[0],
      makeReferencesAbsolute(e[1], miroirFundamentalJzodSchemaUuid, true) as any,
      // makeReferencesAbsolute(e[1], miroirFundamentalJzodSchemaUuid, true) as JzodReference,
    ])
  );

  // log.info("localizedResolutionStore", JSON.stringify(localizedResolutionStore, null, 2));

  // const carryOnSchema: any = transformerJzodSchema.definition.context.transformerForBuild as any;
  const carryOnSchema: any = transformerJzodSchema.definition.context.transformerForBuildOrRuntime as any;

  // const carryOnSchemaReference: JzodReference = {
  const carryOnSchemaReference: any = {
    type: "schemaReference",
    definition: {
      relativePath: "carryOnObject",
    },
  };

  const resolveReferencesWithCarryOn = ((ref: any): any | undefined => {
    // const resolveReferencesWithCarryOn = ((ref: JzodReference): JzodElement | undefined => {
    // const resolvedAbsolutePath = innerResolutionStore[ref.definition?.absolutePath??""]
    const resolvedAbsolutePath = localizedResolutionStore[ref.definition?.absolutePath ?? ""];
    const result =
      resolvedAbsolutePath && resolvedAbsolutePath.context
        ? resolvedAbsolutePath.context[ref.definition?.relativePath ?? ""]
        : undefined;
    const resultWithAbsoluteReferences = result
      ? (makeReferencesAbsolute(result, miroirFundamentalJzodSchemaUuid) as any)
      : result;
    // console.log(
    //   "getMiroirFundamentalJzodSchema applyCarryOnSchema resolving reference " +
    //     JSON.stringify(ref, null, 2) +
    //     " in " +
    //     Object.keys(innerResolutionStore)
    // );
    // console.log(
    //   "getMiroirFundamentalJzodSchema applyCarryOnSchema for reference " +
    //     JSON.stringify(ref, null, 2) +
    //     " result " +
    //     JSON.stringify(resultWithAbsoluteReferences, null, 2)
    // );
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

  // console.log("getMiroirFundamentalJzodSchema #######################################################")
  // console.log("getMiroirFundamentalJzodSchema", "localizedResolutionStore", JSON.stringify(localizedResolutionStore, null, 2))
  // console.log("getMiroirFundamentalJzodSchema #######################################################")
  // const localizedInnerResolutionStoreReferences: Record<string, JzodReference> = Object.fromEntries(
  const extendedSchemas = [
    "jzodBaseObject",
    "shippingBox",
    "extractorTemplateRoot",
    "extractorOrCombinerRoot",
    "transformer_Abstract",
    "transformerForBuild_orderBy",
    "transformerForBuild_count",
    "transformerForBuild_unique",
    "transformerForBuild_list_pickElement",
    "transformerForRuntime_Abstract",
    "transformerForRuntime_orderedTransformer",
    "transformerForRuntime_referencingTransformer",
  ];

  const localizedInnerResolutionStoreExtendedReferences = Object.fromEntries(
    Object.entries(localizedResolutionStore).flatMap((e) =>
      Object.entries(e[1].context ?? {})
        .filter((e) => extendedSchemas.includes(e[0]))
        .map((f) => [
          forgeCarryOnReferenceName(e[0], f[0], "extend"),
          // TODO: add inner references to environment!!!!
          // applyCarryOnSchema(f[1] as any, carryOnSchema as any, undefined, resolveReferencesWithCarryOn).resultSchema,
          applyCarryOnSchemaOnLevel(
            f[1] as any,
            carryOnSchemaReference as any,
            false /** applyOnFirstLevel */,
            undefined,
            resolveReferencesWithCarryOn
          ).resultSchema,
        ])
    )
  );

  // console.log(
  //   "localizedInnerResolutionStoreExtendedReferences",
  //   JSON.stringify(localizedInnerResolutionStoreExtendedReferences, null, 2)
  // );

  const localizedInnerResolutionStorePlainReferences = Object.fromEntries(
    Object.entries(localizedResolutionStore).flatMap((e) =>
      Object.entries(e[1].context ?? {}).map((f) => [
        forgeCarryOnReferenceName(e[0], f[0]),
        // TODO: add inner references to environment!!!!
        // applyCarryOnSchema(f[1] as any, carryOnSchema as any, undefined, resolveReferencesWithCarryOn).resultSchema,
        applyCarryOnSchema(f[1] as any, carryOnSchemaReference as any, undefined, resolveReferencesWithCarryOn)
          .resultSchema,
      ])
    )
  );

  // console.log("localizedInnerResolutionStorePlainReferences", JSON.stringify(localizedInnerResolutionStorePlainReferences, null, 2))

  const localizedInnerResolutionStoreReferences = Object.assign(
    {},
    localizedInnerResolutionStoreExtendedReferences,
    localizedInnerResolutionStorePlainReferences
  );

  // console.log("localizedInnerResolutionStoreReferences", localizedInnerResolutionStoreReferences)

  const miroirFundamentalJzodSchemaWithActionTemplate: any = {
    // const miroirFundamentalJzodSchemaWithActionTemplate: JzodSchema = {
    ...miroirFundamentalJzodSchema,
    definition: {
      ...miroirFundamentalJzodSchema.definition,
      context: {
        ...((miroirFundamentalJzodSchema.definition as any)?.context ?? {}),
        // ...((miroirFundamentalJzodSchema.definition as JzodReference)?.context ?? {}),
        ...localizedInnerResolutionStoreReferences,
        carryOnObject: carryOnSchema,
        ...(() => {
          // defining a function, which is called immediately (just one time)
          const compositeActionSchemaBuilder = applyCarryOnSchema(
            {
              type: "schemaReference",
              definition: {
                relativePath: forgeCarryOnReferenceName(miroirFundamentalJzodSchemaUuid, "compositeAction"),
              },
            },
            carryOnSchemaReference as any,
            undefined,
            resolveReferencesWithCarryOn
          );
          // const extendedCompositeActionSchemaBuilder = applyCarryOnSchema(
          //   {
          //     type: "schemaReference",
          //     definition: {
          //       relativePath: forgeCarryOnReferenceName(miroirFundamentalJzodSchemaUuid, "extendedCompositeAction"),
          //     },
          //   },
          //   carryOnSchemaReference as any,
          //   undefined,
          //   resolveReferencesWithCarryOn
          // );
          return {
            ...compositeActionSchemaBuilder.resolvedReferences,
            // TODO: use / define replayableActionTemplate (ModelAction + InstanceCUDAction) & Non-transactionalActionTemplate
            // non-transactional action templates can be used wich queries, they do not need to be replayable post-mortem.
            compositeActionTemplate: compositeActionSchemaBuilder.resultSchema, // compositeActionTemplate: THAT's THE RESULT OF THE WHOLE MOVEMENT!
            // extendedCompositeActionTemplate: extendedCompositeActionSchemaBuilder.resultSchema, // compositeActionTemplate: THAT's THE RESULT OF THE WHOLE MOVEMENT!
          };
        })(),
      } as Record<string, any /**JzodElement */>,
    } as any /** JzodObjectOrReference */,
  };
  // console.log("entityDefinitionQueryVersionV1WithAbsoluteReferences=",JSON.stringify(entityDefinitionQueryVersionV1WithAbsoluteReferences))

  return miroirFundamentalJzodSchemaWithActionTemplate;
}
