import { readFileSync } from "fs";
import { array, z } from "zod";

import { JzodObject, jzodReference } from "@miroir-framework/jzod-ts";

// import entityDefinitionEntity from 'assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json';

const entityDefinitionEntity = JSON.parse(readFileSync(new URL('../../../../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json', import.meta.url)).toString());
const entityDefinitionEntityDefinition = JSON.parse(readFileSync(new URL('../../../../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json', import.meta.url)).toString());
const entityDefinitionCommit = JSON.parse(readFileSync(new URL('../../../../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b17d5e9e-12f2-4ed8-abdb-2576c01514a4.json', import.meta.url)).toString());
// const entityDefinitionActionVersion = JSON.parse(readFileSync(new URL('../../../../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/e3c1cc69-066d-4f52-beeb-b659dc7a88b9.json', import.meta.url)).toString());
const actionModelerVersionV1 = JSON.parse(readFileSync(new URL('../../../../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/7947ae40-eb34-4149-887b-15a9021e714e.json', import.meta.url)).toString());
// const configFileContents = await import(configFilePath);

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
      "jzodBaseObject": {
        "type": "object",
        "definition": {
          "optional": {
            "type": "simpleType",
            "definition": "boolean",
            "optional": true
          },
          "nullable": {
            "type": "simpleType",
            "definition": "boolean",
            "optional": true
          },
          "extra": {
            "type": "object",
            "definition": {
              "id": { "type": "simpleType", "definition": "number" },
              "defaultLabel": { "type": "simpleType", "definition": "string" },
              "editable": { "type": "simpleType", "definition": "boolean" }
            },
            "optional": true
          }
        }
      },
      "jzodArray": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
            "relativePath": "jzodBaseObject"
          }
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "array"
          },
          "definition": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodElement"
            }
          }
        }
      },
      "jzodAttribute": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
            "relativePath": "jzodBaseObject"
          }
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "simpleType"
          },
          "coerce": {
            "type": "simpleType",
            "definition": "boolean",
            "optional": true
          },
          "definition": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodEnumAttributeTypes"
            }
          }
        }
      },
      "jzodAttributeDateValidations": {
        "type": "object",
        "definition": {
          "extra": {
            "type": "record",
            "definition": {
              "type": "simpleType",
              "definition": "any"
            },
            "optional": true
          },
          "type": {
            "type": "enum",
            "definition": ["min", "max"]
          },
          "parameter": {
            "type": "simpleType",
            "definition": "any"
          }
        }
      },
      "jzodAttributeDateWithValidations": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
            "relativePath": "jzodBaseObject"
          }
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "simpleType"
          },
          "definition": {
            "type": "literal",
            "definition": "date"
          },
          "validations": {
            "type": "array",
            "optional": true,
            "definition": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                "relativePath": "jzodAttributeDateValidations"
              }
            }
          }
        }
      },
      "jzodAttributeNumberValidations": {
        "type": "object",
        "definition": {
          "extra": {
            "type": "record",
            "definition": {
              "type": "simpleType",
              "definition": "any"
            },
            "optional": true
          },
          "type": {
            "type": "enum",
            "definition": [
              "gt",
              "gte",
              "lt",
              "lte",
              "int",
              "positive",
              "nonpositive",
              "negative",
              "nonnegative",
              "multipleOf",
              "finite",
              "safe"
            ]
          },
          "parameter": {
            "type": "simpleType",
            "definition": "any"
          }
        }
      },
      "jzodAttributeNumberWithValidations": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
            "relativePath": "jzodBaseObject"
          }
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "simpleType"
          },
          "definition": {
            "type": "literal",
            "definition": "number"
          },
          "validations": {
            "type": "array",
            "optional": true,
            "definition": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                "relativePath": "jzodAttributeNumberValidations"
              }
            }
          }
        }
      },
      "jzodAttributeStringValidations": {
        "type": "object",
        "definition": {
          "extra": {
            "type": "record",
            "definition": {
              "type": "simpleType",
              "definition": "any"
            },
            "optional": true
          },
          "type": {
            "type": "enum",
            "definition": [
              "max",
              "min",
              "length",
              "email",
              "url",
              "emoji",
              "uuid",
              "cuid",
              "cuid2",
              "ulid",
              "regex",
              "includes",
              "startsWith",
              "endsWith",
              "datetime",
              "ip"
            ]
          },
          "parameter": {
            "type": "simpleType",
            "definition": "any"
          }
        }
      },
      "jzodAttributeStringWithValidations": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
            "relativePath": "jzodBaseObject"
          }
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "simpleType"
          },
          "definition": {
            "type": "literal",
            "definition": "string"
          },
          "validations": {
            "type": "array",
            "optional": true,
            "definition": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                "relativePath": "jzodAttributeStringValidations"
              }
            }
          }
        }
      },
      "jzodElement": {
        "type": "union",
        "discriminator": "type",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodArray"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodAttribute"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodAttributeDateWithValidations"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodAttributeNumberWithValidations"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodAttributeStringWithValidations"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodEnum"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodFunction"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodLazy"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodLiteral"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodIntersection"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodMap"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodObject"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodPromise"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodRecord"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodReference"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodSet"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodTuple"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodUnion"
            }
          }
        ]
      },
      "jzodEnum": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
            "relativePath": "jzodBaseObject"
          }
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "enum"
          },
          "definition": {
            "type": "array",
            "definition": {
              "type": "simpleType",
              "definition": "string"
            }
          }
        }
      },
      "jzodEnumAttributeTypes": {
        "type": "enum",
        "definition": [
          "any",
          "bigint",
          "boolean",
          "date",
          "never",
          "null",
          "number",
          "string",
          "uuid",
          "undefined",
          "unknown",
          "void"
        ]
      },
      "jzodEnumElementTypes": {
        "type": "enum",
        "definition": [
          "array",
          "enum",
          "function",
          "lazy",
          "literal",
          "intersection",
          "map",
          "object",
          "promise",
          "record",
          "schemaReference",
          "set",
          "simpleType",
          "tuple",
          "union"
        ]
      },
      "jzodFunction": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
            "relativePath": "jzodBaseObject"
          }
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "function"
          },
          "definition": {
            "type": "object",
            "definition": {
              "args": {
                "type": "array",
                "definition": {
                  "type": "schemaReference",
                  "definition": {
                    "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                    "relativePath": "jzodElement"
                  }
                }
              },
              "returns": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  "relativePath": "jzodElement"
                },
                "optional": true
              }
            }
          }
        }
      },
      "jzodLazy": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
            "relativePath": "jzodBaseObject"
          }
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "lazy"
          },
          "definition": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodFunction"
            }
          }
        }
      },
      "jzodLiteral": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
            "relativePath": "jzodBaseObject"
          }
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "literal"
          },
          "definition": {
            "type": "simpleType",
            "definition": "string"
          }
        }
      },
      "jzodIntersection": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
            "relativePath": "jzodBaseObject"
          }
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "intersection"
          },
          "definition": {
            "type": "object",
            "definition": {
              "left": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  "relativePath": "jzodElement"
                }
              },
              "right": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  "relativePath": "jzodElement"
                }
              }
            }
          }
        }
      },
      "jzodMap": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
            "relativePath": "jzodBaseObject"
          }
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "map"
          },
          "definition": {
            "type": "tuple",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  "relativePath": "jzodElement"
                }
              },
              {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  "relativePath": "jzodElement"
                }
              }
            ]
          }
        }
      },
      "jzodObject": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
            "relativePath": "jzodBaseObject"
          }
        },
        "definition": {
          "extend": {
            "type": "schemaReference",
            "optional": true,
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodReference"
            }
          },
          "type": {
            "type": "literal",
            "definition": "object"
          },
          "nonStrict": {
            "type": "simpleType",
            "definition": "boolean",
            "optional": true
          },
          "definition": {
            "type": "record",
            "definition": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                "relativePath": "jzodElement"
              }
            }
          }
        }
      },
      "jzodPromise": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
            "relativePath": "jzodBaseObject"
          }
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "promise"
          },
          "definition": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodElement"
            }
          }
        }
      },
      "jzodRecord": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
            "relativePath": "jzodBaseObject"
          }
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "record"
          },
          "definition": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodElement"
            }
          }
        }
      },
      "jzodReference": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
            "relativePath": "jzodBaseObject"
          }
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "schemaReference"
          },
          "context": {
            "type": "record",
            "optional": true,
            "definition": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                "relativePath": "jzodElement"
              }
            }
          },
          "definition": {
            "type": "object",
            "definition": {
              "eager": {
                "type": "simpleType",
                "definition": "boolean",
                "optional": true
              },
              "relativePath": {
                "type": "simpleType",
                "definition": "string",
                "optional": true
              },
              "absolutePath": {
                "type": "simpleType",
                "definition": "string",
                "optional": true
              }
            }
          }
        }
      },
      "jzodSet": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
            "relativePath": "jzodBaseObject"
          }
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "set"
          },
          "definition": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodElement"
            }
          }
        }
      },
      "jzodTuple": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "relativePath": "jzodBaseObject"
          }
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "tuple"
          },
          "definition": {
            "type": "array",
            "definition": {
              "type": "schemaReference",
              "definition": {
                "relativePath": "jzodElement"
              }
            }
          }
        }
      },
      "jzodUnion": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
            "relativePath": "jzodBaseObject"
          }
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "union"
          },
          "discriminator": {
            "type": "simpleType",
            "definition": "string",
            "optional": true
          },
          "definition": {
            "type": "array",
            "definition": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                "relativePath": "jzodElement"
              }
            }
          }
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
      // "createEntityAction": {
      //   "type": "object",
      //   "definition": {
      //     "actionType": {"type": "literal", "definition":"entityAction"},
      //     "actionName": {"type": "literal", "definition":"createEntity"},
      //     "entity": {
      //       "type": "schemaReference",
      //       "definition": {
      //         "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
      //         "relativePath": "entity"
      //       }
      //     },
      //     "entityDefinition": {
      //       "type": "schemaReference",
      //       "definition": {
      //         "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
      //         "relativePath": "entityDefinition"
      //       }
      //     }
      //   }
      // },
      "actionModelerParams": actionModelerVersionV1.definition.definition.actionParameter as JzodObject,
      // "entityAction": {
      //   "type": "schemaReference",
      //   "definition": {
      //     "relativePath": "createEntityAction"
      //   }
      // },
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
                "actionVersion": {
                  "type": "simpleType",
                  "definition": "string",
                  "validations": [{ "type": "uuid" }],
                  "extra": { "id": 1, "defaultLabel": "Uuid", "editable": false }
                },
                "actionArguments": {
                  "type": "schemaReference",
                  "definition": {
                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    "relativePath": "actionModelerParams"
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