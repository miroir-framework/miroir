import { applyCarryOnSchema, forgeCarryOnReferenceName } from "@miroir-framework/jzod";
import {
  EntityDefinition,
  JzodElement,
  JzodObject,
  JzodReference,
  JzodSchema,
} from "../preprocessor-generated/miroirFundamentalType.js";
// import { Endpoint } from "../../../3_controllers/Endpoint.js";

function makeReferencesAbsolute(jzodSchema:JzodElement, absolutePath: string):JzodElement {
  switch (jzodSchema.type) {
    case "schemaReference": {
      const convertedContext = Object.fromEntries(
        Object.entries(jzodSchema.context??{}).map(
          (e: [string, JzodElement]) => [e[0], makeReferencesAbsolute(e[1], absolutePath)]
        )
      );

      const result = jzodSchema.definition.absolutePath
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
      const convertedExtend = jzodSchema.extend?makeReferencesAbsolute(jzodSchema.extend, absolutePath): undefined as any;
      const convertedDefinition = Object.fromEntries(
        Object.entries(jzodSchema.definition).map(
          (e: [string, JzodElement]) => [e[0], makeReferencesAbsolute(e[1], absolutePath)]
        )
      );
      return convertedExtend?{
        ...jzodSchema,
        extend: convertedExtend,
        definition: convertedDefinition
      }:{
        ...jzodSchema,
        definition: convertedDefinition
      }
      break;
    }
    case "array":
    case "lazy":
    case "record": 
    case "promise":
    case "set": {
      return {
        ...jzodSchema,
        definition: makeReferencesAbsolute(jzodSchema.definition, absolutePath) as any
      }
      break;
    }
    case "map": {
      return {
        ...jzodSchema,
        definition: [
          makeReferencesAbsolute(jzodSchema.definition[0], absolutePath),
          makeReferencesAbsolute(jzodSchema.definition[1], absolutePath)
        ]
      }
    }
    case "function": {
      return {
        ...jzodSchema,
        definition: {
          args: jzodSchema.definition.args.map(e => makeReferencesAbsolute(e,absolutePath)),
          returns: jzodSchema.definition.returns?makeReferencesAbsolute(jzodSchema.definition.returns,absolutePath):undefined,
        }
      }
      break;
    }
    case "intersection": {
      return {
        ...jzodSchema,
        definition: {
          left: makeReferencesAbsolute(jzodSchema.definition.left, absolutePath),
          right: makeReferencesAbsolute(jzodSchema.definition.right, absolutePath),
        }
      }
      break;
    }
    case "union":
    case "tuple": {
      return {
        ...jzodSchema,
        definition: jzodSchema.definition.map(e => makeReferencesAbsolute(e,absolutePath)),
      }
      break;
    }
    // case "simpleType":
    case "enum":
    case "literal":
    default: {
      return jzodSchema
      break;
    }
  }
}

// ################################################################################################
export function getMiroirFundamentalJzodSchema(
  entityDefinitionBundleV1 : EntityDefinition,
  entityDefinitionCommit : EntityDefinition,
  modelEndpointVersionV1: any,
  storeManagementEndpoint: any,
  instanceEndpointVersionV1: any,
  undoRedoEndpointVersionV1: any,
  localCacheEndpointVersionV1: any,
  domainEndpointVersionV1: any,
  queryEndpointVersionV1: any,
  persistenceEndpointVersionV1: any,
  jzodSchemajzodMiroirBootstrapSchema: JzodSchema,
  templateJzodSchema: JzodSchema,
  entityDefinitionApplicationV1 : EntityDefinition,
  entityDefinitionApplicationVersionV1 : EntityDefinition,
  entityDefinitionDeployment : EntityDefinition,
  entityDefinitionEntity : EntityDefinition,
  entityDefinitionEntityDefinitionV1 : EntityDefinition,
  entityDefinitionJzodSchemaV1 : EntityDefinition,
  entityDefinitionMenu  : EntityDefinition,
  entityDefinitionQueryVersionV1 : EntityDefinition,
  entityDefinitionReportV1 : EntityDefinition,
  ): JzodSchema {
  const entityDefinitionQueryVersionV1WithAbsoluteReferences = makeReferencesAbsolute(
    entityDefinitionQueryVersionV1.jzodSchema.definition.definition,
    "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
  ) as any;

  const innerResolutionStore: Record<string, JzodReference> = {
    // TODO: transform all inner references in jzodSchemajzodMiroirBootstrapSchema into innerResolutionStoreReferences
    "fe9b7d99-f216-44de-bb6e-60e1a1ebb739": {
      type: "schemaReference",
      context: {
        // ...(jzodSchemajzodMiroirBootstrapSchema as any).definition.context,
        "objectTemplateInnerReference": (templateJzodSchema as any).definition.context.objectTemplateInnerReference,
        "objectTemplate": (templateJzodSchema as any).definition.context.objectTemplate,
        "compositeAction": domainEndpointVersionV1.definition.actions.find(
          (a: any) => a.actionParameters?.definition?.actionType?.definition == "compositeAction"
        )?.actionParameters
      },
      definition: {
        relativePath: "jzodElement"
      }
    }
  };
  const innerResolutionStoreReferences = Object.fromEntries(
    Object.entries(innerResolutionStore).flatMap(
      e => Object.entries(e[1].context??{}).map(
        f =>[forgeCarryOnReferenceName(e[0], f[0]),f[1]]
      )
    )
  );

  // console.log("entityDefinitionQueryVersionV1WithAbsoluteReferences=",JSON.stringify(entityDefinitionQueryVersionV1WithAbsoluteReferences))
  return {
    "uuid": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
    "parentName": "JzodSchema",
    "parentUuid": "5e81e1b9-38be-487c-b3e5-53796c57fccf",
    "name": "miroirFundamentalJzodSchema",
    "defaultLabel": "The Jzod Schema of fundamental Miroir Datatypes. Those are fundamental Jzod schemas that are needed before further Jzod Schemas can be loaded from the datastore.",
    "definition": {
      "type": "schemaReference",
      "context": {
        ...(jzodSchemajzodMiroirBootstrapSchema as any).definition.context,
        "______________________________________________miroirMetaModel_____________________________________________": {
          "type": "never"
  
  
  
  
  
  
  
  
  
  
        },
        "entityAttributeExpandedType": {
          "type": "enum",
          "definition": [
            "UUID",
            "STRING",
            "BOOLEAN",
            "OBJECT"
          ]
        },
        "entityAttributeType": {
          "type": "union",
          "definition": [
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "entityInstance"
              }
            },
            {
              "type": "enum",
              "definition": [
                "ENTITY_INSTANCE_UUID",
                "ARRAY"
              ]
            }
          ]
        },
        "entityAttributeUntypedCore": {
          "type": "object",
          "definition": {
            "id": { "type": "number" },
            "name": { "type": "string" },
            "defaultLabel": { "type": "string" },
            "description": { "type": "string", "optional": true },
            "editable": { "type": "boolean" },
            "nullable": { "type": "boolean" }
          }
        },
        "entityAttributeCore": {
          "type": "object",
          "extend": {
            "type": "schemaReference",
            "definition": {
              "eager": true,
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "entityAttributeUntypedCore"
            }
          },
          "definition": {
            "type": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "entityAttributeExpandedType"
              }
            }
          }
        },
        "entityArrayAttribute": {
          "type": "object",
          "extend": {
            "type": "schemaReference",
            "definition": {
              "eager": true,
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "entityAttributeUntypedCore"
            }
          },
          "definition": {
            "type": {
              "type": "literal",
              "definition": "ARRAY"
            },
            "lineFormat": {
              "type": "array",
              "definition": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "entityAttributeCore"
                }
              }
            }
          }
        },
        "entityForeignKeyAttribute": {
          "type": "object",
          "extend": {
            "type": "schemaReference",
            "definition": {
              "eager": true,
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "entityAttributeUntypedCore"
            }
          },
          "definition": {
            "type": {
              "type": "literal",
              "definition": "ENTITY_INSTANCE_UUID"
            },
            "applicationSection": {
              "type": "schemaReference",
              "optional": true,
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "applicationSection"
              }
            },
            "entityUuid": {
              "type": "uuid",
              "extra": { "id": 1, "defaultLabel": "Entity Uuid", "editable": false }
            }
          }
        },
        "entityAttribute": {
          "type": "union",
          "definition": [
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "entityForeignKeyAttribute"
              }
            },
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "entityArrayAttribute"
              }
            }
          ]
        },
        "entityAttributePartial": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "partial": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodElement"
          }
        },
        "applicationSection": {
          "type": "union",
          "definition": [
            {
              "type": "literal",
              "definition": "model"
            },
            {
              "type": "literal",
              "definition": "data"
            }
          ]
        },
        "dataStoreApplicationType": {
          "type": "union",
          "definition": [
            {
              "type": "literal",
              "definition": "miroir"
            },
            {
              "type": "literal",
              "definition": "app"
            }
          ]
        },
        "storeBasedConfiguration": {
          "type": "object",
          "definition": {
            "uuid": {
              "type": "uuid",
              "extra": { "id":1, "defaultLabel": "Uuid", "editable": false }
            },
            "parentName": {
              "type": "string",
              "optional": true,
              "extra": { "id":2, "defaultLabel": "Entity Name", "editable": false }
            },
            "parentUuid": {
              "type": "uuid",
              "extra": { "id":3, "defaultLabel": "Entity Uuid", "editable": false }
            },
            "conceptLevel": {
              "type": "enum",
              "definition": ["MetaModel", "Model", "Data"],
              "optional": true,
              "extra": { "id": 4, "defaultLabel": "Concept Level", "editable": false }
            },
            "defaultLabel": {
              "type": "uuid",
              "extra": { "id":3, "defaultLabel": "Entity Uuid", "editable": false }
            },
            "definition": {
              "type": "object",
              "definition": {
                "currentApplicationVersion": {
                  "type": "uuid",
                  "extra": { "id":1, "defaultLabel": "Current Application Version", "editable": false }
                }
              }
            }
          }
        },
        "entityInstance": {
          "type": "object",
          "nonStrict": true,
          "definition": {
            "uuid": {
              "type": "uuid",
              "extra": { "id":1, "defaultLabel": "Uuid", "editable": false }
            },
            "parentName": {
              "type": "string",
              "optional": true,
              "extra": { "id":2, "defaultLabel": "Entity Name", "editable": false }
            },
            "parentUuid": {
              "type": "uuid",
              "extra": { "id":3, "defaultLabel": "Entity Uuid", "editable": false }
            },
            "conceptLevel": {
              "type": "enum",
              "definition": ["MetaModel", "Model", "Data"],
              "optional": true,
              "extra": { "id": 4, "defaultLabel": "Concept Level", "editable": false }
            }
          }
        },
        "entityInstanceCollection": {
          "type": "object",
          "definition": {
            "parentName": {
              "type": "string",
              "optional": true
            },
            "parentUuid": {
              "type": "string"
            },
            "applicationSection": {
              "type": "schemaReference",
              "optional": false,
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "applicationSection"
              }
            },
            "instances": {
              "type": "array",
              "definition": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "entityInstance"
                }
              }
            }
          }
        },
        "conceptLevel": {
          "type": "enum",
          "definition": [
            "MetaModel",
            "Model",
            "Data"
          ]
        },
        "dataStoreType": {
          "type": "enum",
          "definition": [
            "miroir",
            "app"
          ]
        },
        "entityInstanceUuid": {
          "type": "string"
        },
        "entityInstancesUuidIndex": {
          "type": "record",
          "definition": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "entityInstance"
            }
          }
        },
        "entityInstancesUuidIndexUuidIndex": {
          "type": "record",
          "definition": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "entityInstancesUuidIndex"
            }
          }
        },
        "______________________________________________entities_____________________________________________": {
          "type": "never"
  
  
  
  
  
  
  
  
  
  
        },
        "application": entityDefinitionApplicationV1.jzodSchema as JzodObject,
        "applicationVersion": entityDefinitionApplicationVersionV1.jzodSchema as JzodObject,
        "bundle": entityDefinitionBundleV1.jzodSchema as JzodObject,
        "deployment": entityDefinitionDeployment.jzodSchema as JzodObject,
        "entity": entityDefinitionEntity.jzodSchema as JzodObject,
        "entityDefinition": entityDefinitionEntityDefinitionV1.jzodSchema as JzodObject,
        ...(entityDefinitionMenu.jzodSchema.definition.definition as any).context,
        "menu": entityDefinitionMenu.jzodSchema as JzodObject,
        ...Object.fromEntries(
          Object.entries((entityDefinitionReportV1 as any).jzodSchema.definition.definition.context).filter(e => 
            [
              "objectInstanceReportSection",
              "objectListReportSection",
              "gridReportSection",
              "listReportSection",
              "reportSection",
              "rootReportSection",
            ].includes(e[0])
          )
        ),
        "jzodObjectOrReference": (entityDefinitionJzodSchemaV1 as any).jzodSchema.definition.definition.context.jzodObjectOrReference,
        "jzodSchema": entityDefinitionJzodSchemaV1.jzodSchema as JzodObject,
        "report": (entityDefinitionReportV1 as any).jzodSchema,
        "metaModel": {
          "type": "object",
          "definition": {
            "applicationVersions": {
              "type": "array", 
              "definition": { 
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "applicationVersion"
                }
              }
            },
            "applicationVersionCrossEntityDefinition": {
              "type": "array", 
              "definition": { 
                "type": "object",
                "definition": {
                  "uuid": {
                    "type": "uuid",
                    "extra": { "id":1, "defaultLabel": "Uuid", "editable": false }
                  },
                  "parentName": {
                    "type": "string",
                    "optional": true,
                    "extra": { "id":2, "defaultLabel": "Entity Name", "editable": false }
                  },
                  "parentUuid": {
                    "type": "uuid",
                    "extra": { "id":3, "defaultLabel": "Entity Uuid", "editable": false }
                  },
                  "conceptLevel": {
                    "type": "enum",
                    "definition": ["MetaModel", "Model", "Data"],
                    "optional": true,
                    "extra": { "id": 4, "defaultLabel": "Concept Level", "editable": false }
                  },
                  "applicationVersion": {
                    "type": "uuid",
                    "extra": { "id":1, "defaultLabel": "Application Version", "editable": false }
                  },
                  "entityDefinition": {
                    "type": "uuid",
                    "extra": { "id":1, "defaultLabel": "Entity Definition", "editable": false }
                  }
                }
              }
            },
            "configuration": {
              "type": "array", 
              "definition": { 
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "storeBasedConfiguration"
                }
              }
            },
            "entities": {
              "type": "array", 
              "definition": { 
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "entity"
                }
              }
            },
            "entityDefinitions": {
              "type": "array", 
              "definition": { 
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "entityDefinition"
                }
              }
            },
            "jzodSchemas": {
              "type": "array", 
              "definition": { 
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "jzodSchema"
                }
              }
            },
            "menus": {
              "type": "array", 
              "definition": { 
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "menu"
                }
              }
            },
            "reports": {
              "type": "array", 
              "definition": { 
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "report"
                }
              }
            }
          }
        },
        "_________________________________configuration_and_bundles_________________________________": {
          "type": "never"
  
  
  
  
  
  
  
  
  
  
        },
        "indexedDbStoreSectionConfiguration": {
          "type": "object",
          "definition": {
            "emulatedServerType": { "type":"literal", "definition": "indexedDb" },
            "indexedDbName": { "type": "string" }
          }
        },
        "filesystemDbStoreSectionConfiguration": {
          "type": "object",
          "definition": {
            "emulatedServerType": { "type":"literal", "definition": "filesystem" },
            "directory": { "type": "string" }
          }
        },
        "sqlDbStoreSectionConfiguration": {
          "type": "object",
          "definition": {
            "emulatedServerType": { "type":"literal", "definition": "sql" },
            "connectionString": { "type": "string" },
            "schema": { "type": "string" }
          }
        },
        "storeSectionConfiguration": {
          "type": "union",
          "discriminator": "emulatedServerType",
          "definition": [
            {
              "type": "schemaReference",
              "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "indexedDbStoreSectionConfiguration"}
            },
            {
              "type": "schemaReference",
              "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "filesystemDbStoreSectionConfiguration"}
            },
            {
              "type": "schemaReference",
              "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "sqlDbStoreSectionConfiguration"}
            },
          ]
        },
        "storeUnitConfiguration": {
          "type": "object",
          "definition": {
            "admin": {
              "type": "schemaReference",
              "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "storeSectionConfiguration"}
            },
            "model": {
              "type": "schemaReference",
              "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "storeSectionConfiguration"}
            },
            "data": {
              "type": "schemaReference",
              "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "storeSectionConfiguration"}
            }
          }
        },
        "deploymentStorageConfig": {
          "type": "record",
          "definition": {
            "type": "schemaReference",
            "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "storeUnitConfiguration"}
          }
        },
        "serverConfigForClientConfig": {
          "type": "object",
          "definition": {
            "rootApiUrl": {
              "type": "string",
            },
            "dataflowConfiguration": {
              "type": "any",
            },
            "storeSectionConfiguration": {
              "type": "record",
              "definition": {
                "type": "schemaReference",
                "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "storeUnitConfiguration"}
              }
            }
          }
        },
        "miroirConfigForMswClient": {
          "type": "object",
          "definition": {
            "emulateServer": {
              "type": "literal",
              "definition": true,
            },
            "rootApiUrl": {
              "type": "string",
            },
            "deploymentStorageConfig": {
              "type": "schemaReference",
              "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "deploymentStorageConfig"}
            }
          }
        },
        "miroirConfigForRestClient": {
          "type": "object",
          "definition": {
            "emulateServer": {
              "type": "literal",
              "definition": false,
            },
            "serverConfig": {
              "type": "schemaReference",
              "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "serverConfigForClientConfig"}
            }
          }
        },
        "miroirConfigClient": {
          "type": "object",
          "definition": {
            "client": {
              "type": "union",
              "definition": [
                {
                  "type": "schemaReference",
                  "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "miroirConfigForMswClient"}
                },
                {
                  "type": "schemaReference",
                  "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "miroirConfigForRestClient"}
                }
              ]
            }
          }
        },
        "miroirConfigServer": {
          "type": "object",
          "definition": {
            "server": {
              "type": "object",
              "definition": {
                "rootApiUrl": {
                  "type": "string",
                }
              }
            }
          }
        },
        "miroirConfig": {
          "type": "union",
          "definition": [
            {
              "type": "literal",
              "definition": "miroirConfigClient"
            },
            {
              "type": "literal",
              "definition": "miroirConfigServer"
            }
          ]
        },
        "commit": {
          "type": "object",
          "definition": {
            ...entityDefinitionCommit.jzodSchema.definition,
            "actions": {
              "type": "array",
              "definition": {
                "type": "object",
                "definition": {
                  "endpoint": {
                    "type": "uuid",
                    "extra": { "id": 1, "defaultLabel": "Uuid", "editable": false }
                  },
                  "actionArguments": {
                    "type": "schemaReference",
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "modelAction"
                    }
                  }
                }
              }
            },
            "patches": {
              "type": "array", 
              "definition": {
                "type": "any"
              }
            },
          }
        },
        "miroirAllFundamentalTypesUnion": {
          "type": "union",
          "definition": [
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "applicationSection"
              }
            },
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "entityInstance"
              }
            },
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "entityInstanceCollection"
              }
            },
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "instanceAction"
              }
            }
          ]
        },
        "______________________________________________queries_____________________________________________": {
          "type": "never"
  
  
  
  
  
  
  
  
  
  
        },
        // ...(makeReferencesAbsolute(entityDefinitionQueryVersionV1.jzodSchema.definition.definition,"fe9b7d99-f216-44de-bb6e-60e1a1ebb739") as any).context,
        ...entityDefinitionQueryVersionV1WithAbsoluteReferences.context,
        "domainElementVoid": {
          "type": "object",
          "definition": {
            "elementType": {
              "type": "literal",
              "definition": "void"
            },
            "elementValue": {
              "type": "void"
            }
          }
        },
        "domainElementObject": {
          "type": "object",
          "definition": {
            "elementType": {
              "type": "literal",
              "definition": "object"
            },
            "elementValue": 
            {
              "type": "record",
              "definition": {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "domainElement"
                }
              }
            }
          }
        },
        "domainElementUuidIndex": {
          "type": "object",
          "definition": {
            "elementType": {
              "type": "literal",
              "definition": "instanceUuidIndex"
            },
            "elementValue": 
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "entityInstancesUuidIndex"
              }
            }
          }
        },
        "domainElementEntityInstance": {
          "type": "object",
          "definition": {
            "elementType": {
              "type": "literal",
              "definition": "instance"
            },
            "elementValue": 
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "entityInstance"
              }
            }
          }
        },
        "domainElementEntityInstanceCollection": {
          "type": "object",
          "definition": {
            "elementType": {
              "type": "literal",
              "definition": "entityInstanceCollection"
            },
            "elementValue": 
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "entityInstanceCollection"
              }
            }
          }
        },
        "domainElementInstanceArray": {
          "type": "object",
          "definition": {
            "elementType": {
              "type": "literal",
              "definition": "instanceArray"
            },
            "elementValue": 
            {
              "type": "array",
              "definition": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "entityInstance"
                }
              }
            }
          }
        },
        "domainElementType": {
          "type": "enum",
          "definition": [
            "object", "instanceUuidIndex", "entityInstanceCollection", "instanceArray", "instance", "instanceUuid", "instanceUuidIndexUuidIndex"
          ]
        },
        "domainElement": {
          "type": "union",
          "definition": [
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "domainElementVoid"
              }
            },
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "domainElementObject"
              }
            },
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "domainElementUuidIndex"
              }
            },
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "domainElementEntityInstanceCollection"
              }
            },
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "domainElementInstanceArray"
              }
            },
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "domainElementEntityInstance"
              }
            },
            {
              "type": "object",
              "definition": {
                "elementType": {
                  "type": "literal",
                  "definition": "instanceUuid"
                },
                "elementValue": {
                  "type": "schemaReference",
                  "definition": {
                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    "relativePath": "entityInstanceUuid"
                  }
                }
              }
            },
            {
              "type": "object",
              "definition": {
                "elementType": {
                  "type": "literal",
                  "definition": "instanceUuidIndexUuidIndex"
                },
                "elementValue": 
                {
                  "type": "schemaReference",
                  "definition": {
                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    "relativePath": "entityInstancesUuidIndex"
                  }
                }
              }
            },
            {
              "type": "object",
              "definition": {
                "elementType": {
                  "type": "literal",
                  "definition": "failure"
                },
                "elementValue": 
                {
                  "type": "schemaReference",
                  "definition": {
                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    "relativePath": "queryFailed"
                  }
                }
              }
            },
            {
              "type": "object",
              "definition": {
                "elementType": {
                  "type": "literal",
                  "definition": "string"
                },
                "elementValue": 
                {
                  "type": "string"
                }
              }
            },
            {
              "type": "object",
              "definition": {
                "elementType": {
                  "type": "literal",
                  "definition": "array"
                },
                "elementValue": 
                {
                  "type": "array",
                  "definition": {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "domainElement"
                    }
                  }
                }
              }
            }
          ]
        },
        "recordOfTransformers":{
          "type": "object",
          "definition": {
            "transformerType": {
              "type": "literal",
              "definition": "recordOfTransformers"
            },
            "definition": {
              "type": "record",
              "definition": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "transformer"
                }
              }
              
            }
          }
        },
        "transformer": {
          "type": "union",
          "definition": [
            {
              "type": "object",
              "definition": {
                "transformerType": {
                  "type": "literal",
                  "definition": "objectTransformer"
                },
                "attributeName": {
                  "type": "string"
                }
              }
            },
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "recordOfTransformers"
              }
            }
          ]
        },
        "miroirCustomQueryParams": {
          "type": "object",
          "definition": {
            "queryType": {
              "type": "literal",
              "definition": "custom"
            },
            "name": {
              "type": "literal",
              "definition": "jsonata"
            },
            "definition": {
              "type": "string"
            }
          }
        },
        "localCacheEntityInstancesSelectorParams": {
          "type": "object",
          "definition": {
            "deploymentUuid": {
              "type": "uuid",
              "optional": true,
              "extra": { "id":1, "defaultLabel": "Uuid", "editable": false }
            },
            "applicationSection": {
              "type": "schemaReference",
              "optional": true,
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "applicationSection"
              }
            },
            "entityUuid": {
              "type": "uuid",
              "optional": true,
              "extra": { "id":1, "defaultLabel": "Entity", "editable": false }
            },
            "instanceUuid": {
              "type": "uuid",
              "optional": true,
              "extra": { "id":1, "defaultLabel": "Instance", "editable": false }
            }
          }
        },
        "localCacheQueryParams": {
          "type": "object",
          "definition": {
            "queryType": {
              "type": "literal",
              "definition": "LocalCacheEntityInstancesSelectorParams",
            },
            "definition": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "localCacheEntityInstancesSelectorParams"
              }
            }
          }
        },
        "domainSingleSelectObjectQueryWithDeployment": {
          "type": "object",
          "definition": {
            "queryType": {
              "type": "literal",
              "definition": "domainSingleSelectQueryWithDeployment",
            },
            "deploymentUuid": {
              "type": "uuid",
              "extra": { "id":1, "defaultLabel": "Uuid", "editable": false }
            },
            "select": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "selectObjectQuery"
              }
            }
          }
        },
        "domainSingleSelectObjectListQueryWithDeployment": {
          "type": "object",
          "definition": {
            "queryType": {
              "type": "literal",
              "definition": "domainSingleSelectQueryWithDeployment",
            },
            "deploymentUuid": {
              "type": "uuid",
              "extra": { "id":1, "defaultLabel": "Uuid", "editable": false }
            },
            "select": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "selectObjectListQuery"
              }
            }
          }
        },
        "domainSingleSelectQueryWithDeployment": {
          "type": "object",
          "definition": {
            "queryType": {
              "type": "literal",
              "definition": "domainSingleSelectQueryWithDeployment",
            },
            "deploymentUuid": {
              "type": "uuid",
              "extra": { "id":1, "defaultLabel": "Uuid", "editable": false }
            },
            "select": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "miroirSelectQuery"
              }
            }
          }
        },
        "domainModelRootQuery": {
          "type": "object",
          "definition": {
            "pageParams": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "domainElementObject"
              }
            },
            "queryParams": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "domainElementObject"
              }
            },
            "contextResults": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "domainElementObject"
              }
            }
          }
        },
        "domainModelGetSingleSelectObjectQueryQueryParams": {
          "type": "object",
          "extend": {
            "type": "schemaReference",
            "definition": {
              "eager": true,
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "domainModelRootQuery"
            }
          },
          "definition": {
            "queryType": {
              "type": "literal",
              "definition": "getSingleSelectQuery",
            },
            "singleSelectQuery": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "domainSingleSelectObjectQueryWithDeployment"
              }
            }
          }
        },
        "domainModelGetSingleSelectObjectListQueryQueryParams": {
          "type": "object",
          "extend": {
            "type": "schemaReference",
            "definition": {
              "eager": true,
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "domainModelRootQuery"
            }
          },
          "definition": {
            "queryType": {
              "type": "literal",
              "definition": "getSingleSelectQuery",
            },
            "singleSelectQuery": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "domainSingleSelectObjectListQueryWithDeployment"
              }
            }
          }
        },
        "domainModelGetSingleSelectQueryQueryParams": {
          "type": "object",
          "extend": {
            "type": "schemaReference",
            "definition": {
              "eager": true,
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "domainModelRootQuery"
            }
          },
          "definition": {
            "queryType": {
              "type": "literal",
              "definition": "getSingleSelectQuery",
            },
            "singleSelectQuery": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "domainSingleSelectQueryWithDeployment"
              }
            }
          }
        },
        "domainManyQueriesWithDeploymentUuid": {
          "type": "object",
          "extend": {
            "type": "schemaReference",
            "definition": {
              "eager": true,
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "domainModelRootQuery"
            }
          },
          "definition": {
            "queryType": {
              "type": "literal",
              "definition": "DomainManyQueries",
            },
            "deploymentUuid": {
              "type": "uuid",
              "extra": { "id":1, "defaultLabel": "Uuid", "editable": false }
            },
            "fetchQuery": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "miroirFetchQuery"
              }
            }
          }
        },
        "domainModelGetEntityDefinitionQueryParams": {
          "type": "object",
          "extend": {
            "type": "schemaReference",
            "definition": {
              "eager": true,
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "domainModelRootQuery"
            }
          },
          "definition": {
            "queryType": {
              "type": "literal",
              "definition": "getEntityDefinition",
            },
            "deploymentUuid": {
              "type": "uuid",
              "extra": { "id":1, "defaultLabel": "Uuid", "editable": false }
            },
            "entityUuid": {
              "type": "uuid",
              "extra": { "id":1, "defaultLabel": "Uuid", "editable": false }
            }
          }
        },
        "domainModelGetFetchParamJzodSchemaQueryParams": {
          "type": "object",
          "extend": {
            "type": "schemaReference",
            "definition": {
              "eager": true,
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "domainModelRootQuery"
            }
          },
          "definition": {
            "queryType": {
              "type": "literal",
              "definition": "getFetchParamsJzodSchema",
            },
            "fetchParams": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "domainManyQueriesWithDeploymentUuid"
              }
            }
          }
        },
        "domainModelGetSingleSelectQueryJzodSchemaQueryParams": {
          "type": "object",
          "extend": {
            "type": "schemaReference",
            "definition": {
              "eager": true,
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "domainModelRootQuery"
            }
          },
          "definition": {
            "queryType": {
              "type": "literal",
              "definition": "getSingleSelectQueryJzodSchema",
            },
            "singleSelectQuery": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "domainSingleSelectQueryWithDeployment"
              }
            }
          }
        },
        // TODO: THIS IS DUPLICATED BELOW!!!!
        "domainModelQueryJzodSchemaParams": {
          "type": "union",
          "discriminator": "queryType",
          "definition": [
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "domainModelGetEntityDefinitionQueryParams"
              }
            },
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "domainModelGetFetchParamJzodSchemaQueryParams"
              }
            },
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "domainModelGetSingleSelectQueryJzodSchemaQueryParams"
              }
            }
          ]
        },
        "miroirSelectorQueryParams": {
          "type": "union",
          "discriminator": "queryType",
          "definition": [
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "domainSingleSelectQueryWithDeployment"
              }
            },
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "domainModelGetSingleSelectQueryQueryParams"
              }
            },
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "domainModelGetSingleSelectObjectListQueryQueryParams"
              }
            },
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "domainManyQueriesWithDeploymentUuid"
              }
            },
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "localCacheQueryParams"
              }
            },
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "miroirCustomQueryParams"
              }
            },
            // {
            //   "type": "schemaReference",
            //   "definition": {
            //     "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            //     "relativePath": "domainModelQueryJzodSchemaParams"
            //   }
            // }
            // DUPLICATED BELOW
            //   |
            //   |
            //   v
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "domainModelGetEntityDefinitionQueryParams"
              }
            },
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "domainModelGetFetchParamJzodSchemaQueryParams"
              }
            },
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "domainModelGetSingleSelectQueryJzodSchemaQueryParams"
              }
            }
          ]
        },
        "______________________________________________actions_____________________________________________": {
          "type": "never"
  
  
  
  
  
  
  
  
  
  
  
  
  
  
        },
        "actionError": {
          "type": "object",
          "definition": {
            "status": { "type": "literal", "definition": "error" },
            "error": { 
              "type": "object",
              "definition": {
                "errorType": {
                  "type": "union",
                  "definition": [
                    ...((storeManagementEndpoint as any).definition.actions.filter((e:any)=>!!e.actionErrors).map((e: any) =>e.actionErrors)),
                    ...((instanceEndpointVersionV1 as any).definition.actions.filter((e: any)=>!!e.actionErrors).map((e: any) =>e.actionErrors)),
                  ]
                },
                "errorMessage": { "type": "string", "optional": true },
                "error": { "type": "object", "optional": true, "definition": {
                  "errorMessage": { "type": "string", "optional": true },
                  "stack": {
                    "type": "array",
                    "definition": { "type": "string", "optional": true }
                  }
                }
               }
              }
            }
          }
        },
        "actionVoidSuccess": {
          "type": "object",
          "definition": {
            "status": { "type": "literal", "definition": "ok" },
            "returnedDomainElement": { "type": "schemaReference", "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "domainElementVoid" } }
          }
        },
        "actionVoidReturnType": {
          "type": "union",
          "definition": [
            {
              "type": "schemaReference", "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "actionError" }
            },
            {
              "type": "schemaReference", "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "actionVoidSuccess" }
            }
          ]
        },
        "actionEntityInstanceSuccess": {
          "type": "object",
          "definition": {
            "status": { "type": "literal", "definition": "ok" },
            "returnedDomainElement": { "type": "schemaReference", "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "domainElementEntityInstance" } }
          }
        },
        "actionEntityInstanceReturnType": {
          "type": "union",
          "definition": [
            {
              "type": "schemaReference", "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "actionError" }
            },
            {
              "type": "schemaReference", "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "actionEntityInstanceSuccess" }
            }
          ]
        },
        "actionEntityInstanceCollectionSuccess": {
          "type": "object",
          "definition": {
            "status": { "type": "literal", "definition": "ok" },
            "returnedDomainElement": { "type": "schemaReference", "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "domainElementEntityInstanceCollection" } }
          }
        },
        "actionEntityInstanceCollectionReturnType": {
          "type": "union",
          "definition": [
            {
              "type": "schemaReference", "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "actionError" }
            },
            {
              "type": "schemaReference", "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "actionEntityInstanceCollectionSuccess" }
            }
          ]
        },
        "actionSuccess": {
          "type": "object",
          "definition": {
            "status": { "type": "literal", "definition": "ok" },
            "returnedDomainElement": { "type": "schemaReference", "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "domainElement" } }
          }
        },
        "actionReturnType": {
          "type": "union",
          "definition": [
            {
              "type": "schemaReference", "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "actionError" }
            },
            {
              "type": "schemaReference", "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "actionSuccess" }
            }
          ]
        },
        "modelActionInitModelParams": modelEndpointVersionV1.definition.actions.find((a: any) => a.actionParameters.definition.actionName.definition == "initModel")?.actionParameters.definition.params,
        "modelActionCommit": modelEndpointVersionV1.definition.actions.find((a: any) => a.actionParameters.definition.actionName.definition == "commit")?.actionParameters,
        "modelActionRollback": modelEndpointVersionV1.definition.actions.find((a: any) => a.actionParameters.definition.actionName.definition == "rollback")?.actionParameters,
        "modelActionInitModel": modelEndpointVersionV1.definition.actions.find((a: any) => a.actionParameters.definition.actionName.definition == "initModel")?.actionParameters,
        "modelActionResetModel": modelEndpointVersionV1.definition.actions.find((a: any) => a.actionParameters.definition.actionName.definition == "resetModel")?.actionParameters,
        "modelActionResetData": modelEndpointVersionV1.definition.actions.find((a: any) => a.actionParameters.definition.actionName.definition == "resetData")?.actionParameters,
        "modelActionAlterEntityAttribute": modelEndpointVersionV1.definition.actions.find((a: any) => a.actionParameters.definition.actionName.definition == "alterEntityAttribute")?.actionParameters,
        "modelActionCreateEntity": modelEndpointVersionV1.definition.actions.find((a: any) => a.actionParameters.definition.actionName.definition == "createEntity")?.actionParameters,
        "modelActionDropEntity": modelEndpointVersionV1.definition.actions.find((a: any) => a.actionParameters.definition.actionName.definition == "dropEntity")?.actionParameters,
        "modelActionRenameEntity": modelEndpointVersionV1.definition.actions.find((a: any) => a.actionParameters.definition.actionName.definition == "renameEntity")?.actionParameters,
        "modelAction": { "type": "union", "definition": modelEndpointVersionV1.definition.actions.map((e: any)=>e.actionParameters)},
        "instanceCUDAction": { "type": "union", "definition": instanceEndpointVersionV1.definition.actions.filter((e: any)=>["createInstance", "updateInstance", "deleteInstance"].includes(e.actionParameters.definition.actionName.definition)).map((e: any)=>e.actionParameters)},
        "instanceAction": { "type": "union", "definition": instanceEndpointVersionV1.definition.actions.map((e: any)=>e.actionParameters)},
        "undoRedoAction": { "type": "union", "definition": undoRedoEndpointVersionV1.definition.actions.map((e: any)=>e.actionParameters)},
        "transactionalInstanceAction": domainEndpointVersionV1.definition.actions.find((a: any) => a.actionParameters.definition.actionType && a.actionParameters.definition.actionType.definition == "transactionalInstanceAction")?.actionParameters,
        "localCacheAction": { "type": "union", "definition": localCacheEndpointVersionV1.definition.actions.map((e: any)=>e.actionParameters)},
        "storeManagementAction": { "type": "union", "definition": storeManagementEndpoint.definition.actions.map((e: any)=>e.actionParameters)},
        "persistenceAction": { "type": "union", "definition": persistenceEndpointVersionV1.definition.actions.map((e: any)=>e.actionParameters)},
        "restPersistenceAction": persistenceEndpointVersionV1.definition.actions[0].actionParameters,
        "queryAction": queryEndpointVersionV1.definition.actions[0].actionParameters,
        "compositeAction": domainEndpointVersionV1.definition.actions.find(
          (a: any) => a.actionParameters?.definition?.actionType?.definition == "compositeAction"
        )?.actionParameters,
        "domainAction": { "type": "union", "definition": domainEndpointVersionV1.definition.actions.map((e: any)=>e.actionParameters)},
        // "template": { "type": "union", "definition": domainEndpointVersionV1.definition.actions.map((e: any)=>e.actionParameters)},
        ...(templateJzodSchema as any).definition.context,
        ...innerResolutionStoreReferences,
        ...(() => {// defining a function, which is called immediately (just one time)
          const conversionResult = applyCarryOnSchema(
            (templateJzodSchema as any).definition.context.actionTemplateSchema.definition.actionTemplate,
            (templateJzodSchema as any).definition.context.actionTemplateSchema.definition.actionTemplate.carryOn,
            undefined,
            ((ref:JzodReference): JzodElement | undefined => {
              const resolvedAbsolutePath = innerResolutionStore[ref.definition?.absolutePath??""]
              const result = resolvedAbsolutePath && resolvedAbsolutePath.context?resolvedAbsolutePath.context[ref.definition?.relativePath??""]:undefined;
              const resultWithAbsoluteReferences = result?makeReferencesAbsolute(
                result,
                "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
              ) as any:result;
              console.log("getMiroirFundamentalJzodSchema applyCarryOnSchema resolving reference " + JSON.stringify(ref, null, 2) + " in " + Object.keys(innerResolutionStore))
              console.log("getMiroirFundamentalJzodSchema applyCarryOnSchema for reference " + JSON.stringify(ref, null, 2) + " result " + JSON.stringify(resultWithAbsoluteReferences, null, 2))
              if (resultWithAbsoluteReferences) {
                return resultWithAbsoluteReferences
              } else {
                throw new Error("getMiroirFundamentalJzodSchema applyCarryOnSchema resolve reference could not find reference " + JSON.stringify(ref) + " in " + Object.keys(innerResolutionStore));
                
              }
            }) as any
          );
          return {
            ...conversionResult.resolvedReferences,
            actionTemplateSchemaConverted: conversionResult.resultSchema
          }
        })(),
        "modelActionReplayableAction": {
          "type": "union",
          "definition": [
            {
              "type": "schemaReference", "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "modelActionAlterEntityAttribute" }
            },
            {
              "type": "schemaReference", "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "modelActionCreateEntity" }
            },
            {
              "type": "schemaReference", "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "modelActionDropEntity" }
            },
            {
              "type": "schemaReference", "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "modelActionRenameEntity" }
            }
          ]
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
        "bundleAction": {
          "type": "union",
          "definition": [
            {
              "type": "object",
              "definition": {
                "actionType": {
                  "type": "literal",
                  "definition": "bundleAction"
                },
                "actionName": {
                  "type": "literal",
                  "definition": "createBundle"
                },
                "deploymentUuid": {
                  "type": "uuid",
                  "extra": { "id":1, "defaultLabel": "Uuid", "editable": false }
                }
              }
            },
            {
              "type": "object",
              "definition": {
                "actionType": {
                  "type": "literal",
                  "definition": "bundleAction"
                },
                "actionName": {
                  "type": "literal",
                  "definition": "deleteBundle"
                },
                "deploymentUuid": {
                  "type": "uuid",
                  "extra": { "id":1, "defaultLabel": "Uuid", "editable": false }
                },
              }
            }
          ]
        },
        "storeOrBundleAction": {
          "type": "union",
          "definition": [
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "storeManagementAction"
              }
            },
            {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "bundleAction"
              }
            }
          ]
        },
        "actionTransformer": {
          "type": "object",
          "definition": {
            "transformerType": {
              "type": "literal",
              "definition": "actionTransformer"
            }
          }
        },
        "dataTransformer": {
          "type": "object",
          "definition": {
            "transformerType": {
              "type": "literal",
              "definition": "dataTransformer"
            }
          }
        },
      },
      "definition": {
        "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        "relativePath": "miroirAllFundamentalTypesUnion"
      }
    }
  }
}
