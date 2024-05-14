import { JzodObject } from "@miroir-framework/jzod-ts";
import {
  EntityDefinition,
  JzodElement,
  JzodSchema
} from "../preprocessor-generated/miroirFundamentalType";
// import { Endpoint } from "../../../3_controllers/Endpoint";

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
    case "simpleType":
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
          "type": "simpleType",
          "definition": "never"
  
  
  
  
  
  
  
  
  
  
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
            "id": { "type": "simpleType", "definition": "number" },
            "name": { "type": "simpleType", "definition": "string" },
            "defaultLabel": { "type": "simpleType", "definition": "string" },
            "description": { "type": "simpleType", "optional": true, "definition": "string" },
            "editable": { "type": "simpleType", "definition": "boolean" },
            "nullable": { "type": "simpleType", "definition": "boolean" }
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
              "type": "simpleType",
              "definition": "string",
              "validations": [{ "type": "uuid" }],
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
              "type": "simpleType",
              "definition": "string",
              "validations": [{ "type": "uuid" }],
              "extra": { "id":1, "defaultLabel": "Uuid", "editable": false }
            },
            "parentName": {
              "type": "simpleType",
              "definition": "string",
              "optional": true,
              "extra": { "id":2, "defaultLabel": "Entity Name", "editable": false }
            },
            "parentUuid": {
              "type": "simpleType",
              "definition": "string",
              "validations": [{ "type": "uuid" }],
              "extra": { "id":3, "defaultLabel": "Entity Uuid", "editable": false }
            },
            "conceptLevel": {
              "type": "enum",
              "definition": ["MetaModel", "Model", "Data"],
              "optional": true,
              "extra": { "id": 4, "defaultLabel": "Concept Level", "editable": false }
            },
            "defaultLabel": {
              "type": "simpleType",
              "definition": "string",
              "validations": [{ "type": "uuid" }],
              "extra": { "id":3, "defaultLabel": "Entity Uuid", "editable": false }
            },
            "definition": {
              "type": "object",
              "definition": {
                "currentApplicationVersion": {
                  "type": "simpleType",
                  "definition": "string",
                  "validations": [{ "type": "uuid" }],
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
              "type": "simpleType",
              "definition": "string",
              "validations": [{ "type": "uuid" }],
              "extra": { "id":1, "defaultLabel": "Uuid", "editable": false }
            },
            "parentName": {
              "type": "simpleType",
              "definition": "string",
              "optional": true,
              "extra": { "id":2, "defaultLabel": "Entity Name", "editable": false }
            },
            "parentUuid": {
              "type": "simpleType",
              "definition": "string",
              "validations": [{ "type": "uuid" }],
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
              "type": "simpleType",
              "definition": "string",
              "optional": true
            },
            "parentUuid": {
              "type": "simpleType",
              "definition": "string"
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
          "type": "simpleType",
          "definition": "string"
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
          "type": "simpleType",
          "definition": "never"
  
  
  
  
  
  
  
  
  
  
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
                    "type": "simpleType",
                    "definition": "string",
                    "validations": [{ "type": "uuid" }],
                    "extra": { "id":1, "defaultLabel": "Uuid", "editable": false }
                  },
                  "parentName": {
                    "type": "simpleType",
                    "definition": "string",
                    "optional": true,
                    "extra": { "id":2, "defaultLabel": "Entity Name", "editable": false }
                  },
                  "parentUuid": {
                    "type": "simpleType",
                    "definition": "string",
                    "validations": [{ "type": "uuid" }],
                    "extra": { "id":3, "defaultLabel": "Entity Uuid", "editable": false }
                  },
                  "conceptLevel": {
                    "type": "enum",
                    "definition": ["MetaModel", "Model", "Data"],
                    "optional": true,
                    "extra": { "id": 4, "defaultLabel": "Concept Level", "editable": false }
                  },
                  "applicationVersion": {
                    "type": "simpleType",
                    "definition": "string",
                    "validations": [{ "type": "uuid" }],
                    "extra": { "id":1, "defaultLabel": "Application Version", "editable": false }
                  },
                  "entityDefinition": {
                    "type": "simpleType",
                    "definition": "string",
                    "validations": [{ "type": "uuid" }],
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
          "type": "simpleType",
          "definition": "never"
  
  
  
  
  
  
  
  
  
  
        },
        "indexedDbStoreSectionConfiguration": {
          "type": "object",
          "definition": {
            "emulatedServerType": { "type":"literal", "definition": "indexedDb" },
            "indexedDbName": { "type": "simpleType", "definition": "string" }
          }
        },
        "filesystemDbStoreSectionConfiguration": {
          "type": "object",
          "definition": {
            "emulatedServerType": { "type":"literal", "definition": "filesystem" },
            "directory": { "type": "simpleType", "definition": "string" }
          }
        },
        "sqlDbStoreSectionConfiguration": {
          "type": "object",
          "definition": {
            "emulatedServerType": { "type":"literal", "definition": "sql" },
            "connectionString": { "type": "simpleType", "definition": "string" },
            "schema": { "type": "simpleType", "definition": "string" }
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
              "type": "simpleType",
              "definition": "string",
            },
            "dataflowConfiguration": {
              "type": "simpleType",
              "definition": "any",
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
              "type": "simpleType",
              "definition": "string",
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
                  "type": "simpleType",
                  "definition": "string",
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
                    "type": "simpleType",
                    "definition": "string",
                    "validations": [{ "type": "uuid" }],
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
                "type": "simpleType",
                "definition": "any"
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
          "type": "simpleType",
          "definition": "never"
  
  
  
  
  
  
  
  
  
  
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
              "type": "simpleType",
              "definition": "void"
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
                  "type": "simpleType",
                  "definition": "string"
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
                  "type": "simpleType",
                  "definition": "string"
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
              "type": "simpleType",
              "definition": "string"
            }
          }
        },
        "localCacheEntityInstancesSelectorParams": {
          "type": "object",
          "definition": {
            "deploymentUuid": {
              "type": "simpleType",
              "definition": "string",
              "optional": true,
              "validations": [{ "type": "uuid" }],
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
              "type": "simpleType",
              "definition": "string",
              "optional": true,
              "validations": [{ "type": "uuid" }],
              "extra": { "id":1, "defaultLabel": "Uuid", "editable": false }
            },
            "instanceUuid": {
              "type": "simpleType",
              "definition": "string",
              "optional": true,
              "validations": [{ "type": "uuid" }],
              "extra": { "id":1, "defaultLabel": "Uuid", "editable": false }
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
              "type": "simpleType",
              "definition": "string",
              "validations": [{ "type": "uuid" }],
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
              "type": "simpleType",
              "definition": "string",
              "validations": [{ "type": "uuid" }],
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
              "type": "simpleType",
              "definition": "string",
              "validations": [{ "type": "uuid" }],
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
              "type": "simpleType",
              "definition": "string",
              "validations": [{ "type": "uuid" }],
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
              "type": "simpleType",
              "definition": "string",
              "validations": [{ "type": "uuid" }],
              "extra": { "id":1, "defaultLabel": "Uuid", "editable": false }
            },
            "entityUuid": {
              "type": "simpleType",
              "definition": "string",
              "validations": [{ "type": "uuid" }],
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
          "type": "simpleType",
          "definition": "never"
  
  
  
  
  
  
  
  
  
  
  
  
  
  
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
                "errorMessage": { "type": "simpleType", "optional": true, "definition": "string" },
                "error": { "type": "object", "optional": true, "definition": {
                  "errorMessage": { "type": "simpleType", "optional": true, "definition": "string" },
                  "stack": {
                    "type": "array",
                    "definition": { "type": "simpleType", "optional": true, "definition": "string" }
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
        "domainAction": { "type": "union", "definition": domainEndpointVersionV1.definition.actions.map((e: any)=>e.actionParameters)},
        "localCacheAction": { "type": "union", "definition": localCacheEndpointVersionV1.definition.actions.map((e: any)=>e.actionParameters)},
        "storeManagementAction": { "type": "union", "definition": storeManagementEndpoint.definition.actions.map((e: any)=>e.actionParameters)},
        "persistenceAction": { "type": "union", "definition": persistenceEndpointVersionV1.definition.actions.map((e: any)=>e.actionParameters)},
        "restPersistenceAction": persistenceEndpointVersionV1.definition.actions[0].actionParameters,
        "queryAction": queryEndpointVersionV1.definition.actions[0].actionParameters,
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
                  "type": "simpleType",
                  "definition": "string",
                  "validations": [{ "type": "uuid" }],
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
                  "type": "simpleType",
                  "definition": "string",
                  "validations": [{ "type": "uuid" }],
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
