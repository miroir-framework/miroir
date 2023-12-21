import { readFileSync } from "fs";
import { array, z } from "zod";

import { JzodObject, jzodReference } from "@miroir-framework/jzod-ts";

// import entityDefinitionEntity from 'assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json';

const entityDefinitionEntity = JSON.parse(readFileSync(new URL('../../../../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json', import.meta.url)).toString());
const entityDefinitionEntityDefinition = JSON.parse(readFileSync(new URL('../../../../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json', import.meta.url)).toString());
const entityDefinitionCommit = JSON.parse(readFileSync(new URL('../../../../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b17d5e9e-12f2-4ed8-abdb-2576c01514a4.json', import.meta.url)).toString());
// const entityDefinitionActionVersion = JSON.parse(readFileSync(new URL('../../../../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/e3c1cc69-066d-4f52-beeb-b659dc7a88b9.json', import.meta.url)).toString());
const modelEndpointVersionV1 = JSON.parse(readFileSync(new URL('../../../../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/7947ae40-eb34-4149-887b-15a9021e714e.json', import.meta.url)).toString());
const instanceEndpointVersionV1 = JSON.parse(readFileSync(new URL('../../../../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/ed520de4-55a9-4550-ac50-b1b713b72a89.json', import.meta.url)).toString());
const deploymentEndpointVersionV1 = JSON.parse(readFileSync(new URL('../../../../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/bbd08cbb-79ff-4539-b91f-7a14f15ac55f.json', import.meta.url)).toString());
// const configFileContents = await import(configFilePath);
const jzodSchemajzodMiroirBootstrapSchema = JSON.parse(readFileSync(new URL("../../../../assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/1e8dab4b-65a3-4686-922e-ce89a2d62aa9.json", import.meta.url)).toString());

// console.log("###################### action version:",actionModelerVersionV1.definition.definition);

// redeclaring to avoir any circurlarities
const entityInstanceSchema = z.object({
  uuid: z.string(),
  parentName: z.string().optional(),

  parentUuid: z.string(),
  conceptLevel: z.enum(["MetaModel", "Model", "Data"]).optional(),
  name: z.string(),
  description: z.string().optional(),
  defaultLabel: z.string().optional(),
  definition: jzodReference,
})
export const miroirFundamentalJzodSchema:z.infer<typeof entityInstanceSchema> = {
  "uuid": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  "parentName": "JzodSchema",
  "parentUuid": "5e81e1b9-38be-487c-b3e5-53796c57fccf",
  "name": "miroirFundamentalJzodSchema",
  "defaultLabel": "The Jzod Schema of fundamental Miroir Datatypes. Those are fundamental Jzod schemas that are needed before further Jzod Schemas can be loaded from the datastore.",
  "definition": {
    "type": "schemaReference",
    "context": {
      ...jzodSchemajzodMiroirBootstrapSchema.definition.context,
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
      "instanceCUDAction": {
        "type": "union",
        "definition": [
          {
            "type": "object",
            "definition": {
              "actionType": {"type": "literal", "definition":"InstanceCUDAction"},
              "actionName": {"type": "literal", "definition":"create"},
              "includeInTransaction": { "type": "simpleType", "definition": "boolean", "optional": true},
              "applicationSection": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "applicationSection"
                }
              },
              "objects": {
                "type": "array",
                "extra": { "id":2, "defaultLabel": "Entity Instances to create", "editable": true },
                "definition": {
                  "type": "schemaReference",
                  "optional": false,
                  "definition": {
                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    "relativePath": "entityInstanceCollection"
                  }
                }
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "actionType": {"type": "literal", "definition":"InstanceCUDAction"},
              "actionName": {"type": "literal", "definition":"update"},
              "applicationSection": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "applicationSection"
                }
              },
              "includeInTransaction": { "type": "simpleType", "definition": "boolean", "optional": true},
              "objects": {
                "type": "array",
                "extra": { "id":2, "defaultLabel": "Entity Instances to update", "editable": true },
                "definition": {
                  "type": "schemaReference",
                  "optional": false,
                  "definition": {
                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    "relativePath": "entityInstanceCollection"
                  }
                }
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "actionType": {"type": "literal", "definition":"InstanceCUDAction"},
              "actionName": {"type": "literal", "definition":"delete"},
              "applicationSection": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "applicationSection"
                }
              },
              "includeInTransaction": { "type": "simpleType", "definition": "boolean", "optional": true},
              "objects": {
                "type": "array",
                "extra": { "id":2, "defaultLabel": "Entity Instances to delete", "editable": true },
                "definition": {
                  "type": "schemaReference",
                  "optional": false,
                  "definition": {
                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    "relativePath": "entityInstanceCollection"
                  }
                }
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "actionType": {"type": "literal", "definition":"InstanceCUDAction"},
              "actionName": {"type": "literal", "definition":"replaceLocalCache"},
              "objects": {
                "type": "array",
                "extra": { "id":2, "defaultLabel": "Entity Instances to place in the local cache", "editable": true },
                "definition": {
                  "type": "schemaReference",
                  "optional": false,
                  "definition": {
                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    "relativePath": "entityInstanceCollection"
                  }
                }
              }
            }
          }
        ]
      },
      "localCacheAction": {
        "type": "object",
        "definition": {
          "actionType": {"type": "literal", "definition":"InstanceCUDAction"},
          "actionName": {"type": "literal", "definition":"replaceLocalCache"},
          "objects": {
            "type": "array",
            "extra": { "id":2, "defaultLabel": "Entity Instances to place in the local cache", "editable": true },
            "definition": {
              "type": "schemaReference",
              "optional": false,
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "entityInstanceCollection"
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
      "entity":entityDefinitionEntity.jzodSchema as JzodObject,
      "entityDefinition": entityDefinitionEntityDefinition.jzodSchema as JzodObject,
      "modelAction": modelEndpointVersionV1.definition.definition.actionParameter as JzodObject,
      "instanceAction": instanceEndpointVersionV1.definition.definition.actionParameter as JzodObject,
      "indexedDbStoreConfiguration": {
        "type": "object",
        "definition": {
          "emulatedServerType": { "type":"literal", "definition": "indexedDb" },
          "indexedDbName": { "type": "simpleType", "definition": "string" }
        }
      },
      "filesystemDbStoreConfiguration": {
        "type": "object",
        "definition": {
          "emulatedServerType": { "type":"literal", "definition": "filesystem" },
          "directory": { "type": "simpleType", "definition": "string" }
        }
      },
      "sqlDbStoreConfiguration": {
        "type": "object",
        "definition": {
          "emulatedServerType": { "type":"literal", "definition": "sql" },
          "connectionString": { "type": "simpleType", "definition": "string" },
          "schema": { "type": "simpleType", "definition": "string" }
        }
      },
      "storeConfiguration": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "indexedDbStoreConfiguration"}
          },
          {
            "type": "schemaReference",
            "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "filesystemDbStoreConfiguration"}
          },
          {
            "type": "schemaReference",
            "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "sqlDbStoreConfiguration"}
          },
        ]
      },
      "storeAction": deploymentEndpointVersionV1.definition.definition.actionParameter as JzodObject,
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
      "commit": {
        "type": "object",
        "definition": {
          ...entityDefinitionCommit.jzodSchema.definition,
          "actions": {
            "type": "array",
            "definition": {
              "type": "object",
              "definition": {
                "endpointVersion": {
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
              "relativePath": "instanceCUDAction"
            }
          }
        ]
      }
    },
    "definition": {
      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
      "relativePath": "miroirAllFundamentalTypesUnion"
    }
  }
}