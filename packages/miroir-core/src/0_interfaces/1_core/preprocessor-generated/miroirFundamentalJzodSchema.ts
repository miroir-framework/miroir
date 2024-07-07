export const miroirFundamentalJzodSchema = {
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
            "type": "boolean",
            "optional": true
          },
          "nullable": {
            "type": "boolean",
            "optional": true
          },
          "extra": {
            "type": "object",
            "definition": {
              "id": {
                "type": "number",
                "optional": true
              },
              "defaultLabel": {
                "type": "string",
                "optional": true
              },
              "initializeTo": {
                "type": "any",
                "optional": true
              },
              "targetEntity": {
                "type": "string",
                "optional": true
              },
              "editable": {
                "type": "boolean",
                "optional": true
              }
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
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "array"
          },
          "definition": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodElement"
            },
            "context": {}
          }
        }
      },
      "jzodPlainAttribute": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": {
          "type": {
            "type": "enum",
            "definition": [
              "any",
              "bigint",
              "boolean",
              "never",
              "null",
              "uuid",
              "undefined",
              "unknown",
              "void"
            ]
          },
          "coerce": {
            "type": "boolean",
            "optional": true
          }
        }
      },
      "jzodAttributeDateValidations": {
        "type": "object",
        "definition": {
          "extra": {
            "type": "record",
            "definition": {
              "type": "any"
            },
            "optional": true
          },
          "type": {
            "type": "enum",
            "definition": [
              "min",
              "max"
            ]
          },
          "parameter": {
            "type": "any"
          }
        }
      },
      "jzodAttributePlainDateWithValidations": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "date"
          },
          "coerce": {
            "type": "boolean",
            "optional": true
          },
          "validations": {
            "type": "array",
            "optional": true,
            "definition": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "jzodAttributeDateValidations"
              },
              "context": {}
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
              "type": "any"
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
            "type": "any"
          }
        }
      },
      "jzodAttributePlainNumberWithValidations": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "number"
          },
          "coerce": {
            "type": "boolean",
            "optional": true
          },
          "validations": {
            "type": "array",
            "optional": true,
            "definition": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "jzodAttributeNumberValidations"
              },
              "context": {}
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
              "type": "any"
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
            "type": "any"
          }
        }
      },
      "jzodAttributePlainStringWithValidations": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "string"
          },
          "coerce": {
            "type": "boolean",
            "optional": true
          },
          "validations": {
            "type": "array",
            "optional": true,
            "definition": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "jzodAttributeStringValidations"
              },
              "context": {}
            }
          }
        }
      },
      "jzodElement": {
        "type": "union",
        "discriminator": "type",
        "extra": {
          "initializeTo": {
            "type": "string"
          }
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodArray"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodPlainAttribute"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodAttributePlainDateWithValidations"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodAttributePlainNumberWithValidations"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodAttributePlainStringWithValidations"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodEnum"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodFunction"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodLazy"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodLiteral"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodIntersection"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodMap"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodObject"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodPromise"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodRecord"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodReference"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodSet"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodTuple"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodUnion"
            },
            "context": {}
          }
        ]
      },
      "jzodEnum": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "enum"
          },
          "definition": {
            "type": "array",
            "definition": {
              "type": "string"
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
          "date",
          "enum",
          "function",
          "lazy",
          "literal",
          "intersection",
          "map",
          "number",
          "object",
          "promise",
          "record",
          "schemaReference",
          "set",
          "string",
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
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
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
                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    "relativePath": "jzodElement"
                  },
                  "context": {}
                }
              },
              "returns": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "jzodElement"
                },
                "optional": true,
                "context": {}
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
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "lazy"
          },
          "definition": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodFunction"
            },
            "context": {}
          }
        }
      },
      "jzodLiteral": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "literal"
          },
          "definition": {
            "type": "union",
            "definition": [
              {
                "type": "string"
              },
              {
                "type": "number"
              },
              {
                "type": "bigint"
              },
              {
                "type": "boolean"
              }
            ]
          }
        }
      },
      "jzodIntersection": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
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
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "jzodElement"
                },
                "context": {}
              },
              "right": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "jzodElement"
                },
                "context": {}
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
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
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
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "jzodElement"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "jzodElement"
                },
                "context": {}
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
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": {
          "extend": {
            "type": "schemaReference",
            "optional": true,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodReference"
            },
            "context": {}
          },
          "type": {
            "type": "literal",
            "definition": "object"
          },
          "nonStrict": {
            "type": "boolean",
            "optional": true
          },
          "partial": {
            "type": "boolean",
            "optional": true
          },
          "carryOn": {
            "type": "union",
            "optional": true,
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "jzodObject",
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "jzodUnion",
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
                },
                "context": {}
              }
            ]
          },
          "definition": {
            "type": "record",
            "definition": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "jzodElement"
              },
              "context": {}
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
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "promise"
          },
          "definition": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodElement"
            },
            "context": {}
          }
        }
      },
      "jzodRecord": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "record"
          },
          "definition": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodElement"
            },
            "context": {}
          }
        }
      },
      "jzodReference": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
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
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "jzodElement"
              },
              "context": {}
            }
          },
          "carryOn": {
            "type": "union",
            "optional": true,
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "jzodObject",
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "jzodUnion",
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
                },
                "context": {}
              }
            ]
          },
          "definition": {
            "type": "object",
            "definition": {
              "eager": {
                "type": "boolean",
                "optional": true
              },
              "partial": {
                "type": "boolean",
                "optional": true
              },
              "relativePath": {
                "type": "string",
                "optional": true
              },
              "absolutePath": {
                "type": "string",
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
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "set"
          },
          "definition": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodElement"
            },
            "context": {}
          }
        }
      },
      "jzodTuple": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
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
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "jzodElement"
              },
              "context": {}
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
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": {
          "type": {
            "type": "literal",
            "definition": "union"
          },
          "discriminator": {
            "type": "string",
            "optional": true
          },
          "discriminatorNew": {
            "type": "union",
            "optional": true,
            "definition": [
              {
                "type": "object",
                "definition": {
                  "discriminatorType": {
                    "type": "literal",
                    "definition": "string"
                  },
                  "value": {
                    "type": "string"
                  }
                }
              },
              {
                "type": "object",
                "definition": {
                  "discriminatorType": {
                    "type": "literal",
                    "definition": "array"
                  },
                  "value": {
                    "type": "array",
                    "definition": {
                      "type": "string"
                    }
                  }
                }
              }
            ]
          },
          "carryOn": {
            "optional": true,
            "type": "schemaReference",
            "definition": {
              "relativePath": "jzodObject",
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
            },
            "context": {}
          },
          "definition": {
            "type": "array",
            "definition": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "jzodElement"
              },
              "context": {}
            }
          }
        }
      },
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
          "id": {
            "type": "number"
          },
          "name": {
            "type": "string"
          },
          "defaultLabel": {
            "type": "string"
          },
          "description": {
            "type": "string",
            "optional": true
          },
          "editable": {
            "type": "boolean"
          },
          "nullable": {
            "type": "boolean"
          }
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
            "extra": {
              "id": 1,
              "defaultLabel": "Entity Uuid",
              "editable": false
            }
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
            "extra": {
              "id": 1,
              "defaultLabel": "Uuid",
              "editable": false
            }
          },
          "parentName": {
            "type": "string",
            "optional": true,
            "extra": {
              "id": 2,
              "defaultLabel": "Entity Name",
              "editable": false
            }
          },
          "parentUuid": {
            "type": "uuid",
            "extra": {
              "id": 3,
              "defaultLabel": "Entity Uuid",
              "editable": false
            }
          },
          "conceptLevel": {
            "type": "enum",
            "definition": [
              "MetaModel",
              "Model",
              "Data"
            ],
            "optional": true,
            "extra": {
              "id": 4,
              "defaultLabel": "Concept Level",
              "editable": false
            }
          },
          "defaultLabel": {
            "type": "uuid",
            "extra": {
              "id": 3,
              "defaultLabel": "Entity Uuid",
              "editable": false
            }
          },
          "definition": {
            "type": "object",
            "definition": {
              "currentApplicationVersion": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Current Application Version",
                  "editable": false
                }
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
            "extra": {
              "id": 1,
              "defaultLabel": "Uuid",
              "editable": false
            }
          },
          "parentName": {
            "type": "string",
            "optional": true,
            "extra": {
              "id": 2,
              "defaultLabel": "Entity Name",
              "editable": false
            }
          },
          "parentUuid": {
            "type": "uuid",
            "extra": {
              "id": 3,
              "defaultLabel": "Entity Uuid",
              "editable": false
            }
          },
          "conceptLevel": {
            "type": "enum",
            "definition": [
              "MetaModel",
              "Model",
              "Data"
            ],
            "optional": true,
            "extra": {
              "id": 4,
              "defaultLabel": "Concept Level",
              "editable": false
            }
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
      "application": {
        "type": "object",
        "definition": {
          "uuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Uuid",
              "editable": false
            }
          },
          "parentName": {
            "type": "string",
            "optional": true,
            "extra": {
              "id": 2,
              "defaultLabel": "Entity Name",
              "editable": false
            }
          },
          "parentUuid": {
            "type": "uuid",
            "extra": {
              "id": 3,
              "defaultLabel": "Entity Uuid",
              "editable": false
            }
          },
          "parentDefinitionVersionUuid": {
            "type": "uuid",
            "optional": true,
            "extra": {
              "id": 4,
              "defaultLabel": "Entity Definition Version Uuid",
              "editable": false
            }
          },
          "name": {
            "type": "string",
            "extra": {
              "id": 5,
              "defaultLabel": "Name",
              "editable": true
            }
          },
          "defaultLabel": {
            "type": "string",
            "extra": {
              "id": 6,
              "defaultLabel": "Default Label",
              "editable": true
            }
          },
          "description": {
            "type": "string",
            "optional": true,
            "extra": {
              "id": 7,
              "defaultLabel": "Description",
              "editable": true
            }
          },
          "selfApplication": {
            "type": "uuid",
            "extra": {
              "id": 8,
              "defaultLabel": "Self Application",
              "editable": true
            }
          }
        }
      },
      "applicationVersion": {
        "type": "object",
        "definition": {
          "uuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Uuid",
              "editable": false
            }
          },
          "parentName": {
            "type": "string",
            "optional": true,
            "extra": {
              "id": 2,
              "defaultLabel": "Entity Name",
              "editable": false
            }
          },
          "parentUuid": {
            "type": "uuid",
            "extra": {
              "id": 3,
              "defaultLabel": "Entity Uuid",
              "editable": false
            }
          },
          "parentDefinitionVersionUuid": {
            "type": "uuid",
            "optional": true,
            "extra": {
              "id": 4,
              "defaultLabel": "Entity Definition Version Uuid",
              "editable": false
            }
          },
          "name": {
            "type": "string",
            "extra": {
              "id": 5,
              "defaultLabel": "Name",
              "editable": true
            }
          },
          "defaultLabel": {
            "type": "string",
            "optional": true,
            "extra": {
              "id": 6,
              "defaultLabel": "Default Label",
              "editable": true
            }
          },
          "description": {
            "type": "string",
            "optional": true,
            "extra": {
              "id": 7,
              "defaultLabel": "Description",
              "editable": true
            }
          },
          "type": {
            "type": "string",
            "optional": true,
            "extra": {
              "id": 8,
              "defaultLabel": "Type of Report",
              "editable": true
            }
          },
          "application": {
            "type": "uuid",
            "extra": {
              "id": 9,
              "defaultLabel": "Application",
              "targetEntity": "a659d350-dd97-4da9-91de-524fa01745dc",
              "editable": false
            }
          },
          "branch": {
            "type": "uuid",
            "extra": {
              "id": 10,
              "defaultLabel": "Branch",
              "description": "The Branch of this Application Version",
              "targetEntity": "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
              "editable": false
            }
          },
          "previousVersion": {
            "type": "uuid",
            "optional": true,
            "extra": {
              "id": 11,
              "defaultLabel": "Previous Application Version",
              "description": "Previous version of the application on this Branch.",
              "targetEntity": "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
              "editable": false
            }
          },
          "modelStructureMigration": {
            "type": "array",
            "optional": true,
            "extra": {
              "id": 12,
              "defaultLabel": "Structure Migration from Previous Version",
              "editable": true
            },
            "definition": {
              "type": "record",
              "definition": {
                "type": "any"
              }
            }
          },
          "modelCUDMigration": {
            "type": "array",
            "optional": true,
            "extra": {
              "id": 13,
              "defaultLabel": "Create-Update-Delete Migration from Previous Version",
              "editable": true
            },
            "definition": {
              "type": "record",
              "definition": {
                "type": "any"
              }
            }
          }
        }
      },
      "bundle": {
        "type": "object",
        "definition": {
          "uuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Uuid",
              "editable": false
            }
          },
          "parentName": {
            "type": "string",
            "optional": true,
            "extra": {
              "id": 2,
              "defaultLabel": "Entity Name",
              "editable": false
            }
          },
          "parentUuid": {
            "type": "uuid",
            "extra": {
              "id": 3,
              "defaultLabel": "Entity Uuid",
              "editable": false
            }
          },
          "parentDefinitionVersionUuid": {
            "type": "uuid",
            "extra": {
              "id": 4,
              "defaultLabel": "Entity Definition Version Uuid",
              "editable": false
            }
          },
          "name": {
            "type": "string",
            "extra": {
              "id": 5,
              "defaultLabel": "Name",
              "editable": true
            }
          },
          "contents": {
            "type": "union",
            "extra": {
              "id": 6,
              "defaultLabel": "Contents of the bundle",
              "editable": true
            },
            "definition": [
              {
                "type": "object",
                "definition": {
                  "type": {
                    "type": "literal",
                    "definition": "runtime"
                  }
                }
              },
              {
                "type": "object",
                "definition": {
                  "type": {
                    "type": "literal",
                    "definition": "development"
                  },
                  "applicationVersion": {
                    "type": "schemaReference",
                    "optional": false,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "applicationVersion"
                    }
                  }
                }
              }
            ]
          }
        }
      },
      "deployment": {
        "type": "object",
        "definition": {
          "uuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Uuid",
              "editable": false
            }
          },
          "parentName": {
            "type": "string",
            "optional": true,
            "extra": {
              "id": 2,
              "defaultLabel": "Entity Name",
              "editable": false
            }
          },
          "parentUuid": {
            "type": "uuid",
            "extra": {
              "id": 3,
              "defaultLabel": "Entity Uuid",
              "editable": false
            }
          },
          "parentDefinitionVersionUuid": {
            "type": "uuid",
            "optional": true,
            "extra": {
              "id": 4,
              "defaultLabel": "Entity Definition Version Uuid",
              "editable": false
            }
          },
          "name": {
            "type": "string",
            "extra": {
              "id": 5,
              "defaultLabel": "Name",
              "editable": true
            }
          },
          "defaultLabel": {
            "type": "string",
            "extra": {
              "id": 6,
              "defaultLabel": "Default Label",
              "editable": true
            }
          },
          "description": {
            "type": "string",
            "optional": true,
            "extra": {
              "id": 7,
              "defaultLabel": "Description",
              "editable": true
            }
          },
          "application": {
            "type": "uuid",
            "extra": {
              "id": 8,
              "defaultLabel": "Application",
              "description": "The Application of the Branch.",
              "targetEntity": "25d935e7-9e93-42c2-aade-0472b883492b",
              "editable": false
            }
          },
          "bundle": {
            "type": "uuid",
            "extra": {
              "id": 8,
              "defaultLabel": "Bundle",
              "description": "The deployed bundle.",
              "targetEntity": "",
              "editable": false
            }
          },
          "configuration": {
            "type": "schemaReference",
            "optional": true,
            "extra": {
              "id": 9,
              "defaultLabel": "Deployment Configuration",
              "editable": true
            },
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "storeUnitConfiguration"
            }
          },
          "model": {
            "type": "schemaReference",
            "optional": true,
            "extra": {
              "id": 9,
              "defaultLabel": "Application Deployment Model",
              "editable": true
            },
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodObject"
            }
          },
          "data": {
            "type": "schemaReference",
            "optional": true,
            "extra": {
              "id": 10,
              "defaultLabel": "Application Deployment Data",
              "editable": true
            },
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodObject"
            }
          }
        }
      },
      "entity": {
        "type": "object",
        "definition": {
          "uuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Uuid",
              "editable": false
            }
          },
          "parentName": {
            "type": "string",
            "optional": true,
            "extra": {
              "id": 2,
              "defaultLabel": "Entity Name",
              "editable": false
            }
          },
          "parentUuid": {
            "type": "uuid",
            "extra": {
              "id": 3,
              "defaultLabel": "Entity Uuid",
              "editable": false
            }
          },
          "parentDefinitionVersionUuid": {
            "type": "uuid",
            "optional": true,
            "extra": {
              "id": 4,
              "defaultLabel": "Entity Definition Version Uuid",
              "editable": false
            }
          },
          "conceptLevel": {
            "type": "enum",
            "definition": [
              "MetaModel",
              "Model",
              "Data"
            ],
            "optional": true,
            "extra": {
              "id": 5,
              "defaultLabel": "Concept Level",
              "editable": false
            }
          },
          "application": {
            "type": "uuid",
            "optional": true,
            "extra": {
              "id": 6,
              "defaultLabel": "Application",
              "targetEntity": "a659d350-dd97-4da9-91de-524fa01745dc",
              "editable": false
            }
          },
          "name": {
            "type": "string",
            "extra": {
              "id": 7,
              "defaultLabel": "Name",
              "editable": true
            }
          },
          "author": {
            "type": "uuid",
            "optional": true,
            "extra": {
              "id": 8,
              "defaultLabel": "Application",
              "editable": true
            }
          },
          "description": {
            "type": "string",
            "optional": true,
            "extra": {
              "id": 9,
              "defaultLabel": "Description",
              "editable": true
            }
          }
        }
      },
      "entityDefinition": {
        "type": "object",
        "definition": {
          "uuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Uuid",
              "editable": false
            }
          },
          "parentName": {
            "type": "string",
            "extra": {
              "id": 2,
              "defaultLabel": "Entity Name",
              "editable": false
            }
          },
          "parentUuid": {
            "type": "uuid",
            "extra": {
              "id": 3,
              "defaultLabel": "Entity Uuid",
              "editable": false
            }
          },
          "parentDefinitionVersionUuid": {
            "type": "uuid",
            "optional": true,
            "extra": {
              "id": 4,
              "defaultLabel": "Entity Definition Version Uuid",
              "editable": false
            }
          },
          "name": {
            "type": "string",
            "extra": {
              "id": 5,
              "defaultLabel": "Name",
              "editable": false
            }
          },
          "entityUuid": {
            "type": "uuid",
            "extra": {
              "id": 6,
              "defaultLabel": "Entity Uuid of the Entity which this definition is the definition",
              "editable": false
            }
          },
          "conceptLevel": {
            "type": "enum",
            "definition": [
              "MetaModel",
              "Model",
              "Data"
            ],
            "optional": true,
            "extra": {
              "id": 7,
              "defaultLabel": "Concept Level",
              "editable": false
            }
          },
          "description": {
            "type": "string",
            "optional": true,
            "extra": {
              "id": 8,
              "defaultLabel": "Description",
              "editable": true
            }
          },
          "defaultInstanceDetailsReportUuid": {
            "type": "uuid",
            "optional": true,
            "extra": {
              "id": 9,
              "defaultLabel": "Default Report used to display instances of this Entity",
              "editable": false
            }
          },
          "viewAttributes": {
            "type": "array",
            "optional": true,
            "definition": {
              "type": "string"
            }
          },
          "jzodSchema": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              "relativePath": "jzodObject"
            },
            "extra": {
              "id": 11,
              "defaultLabel": "Jzod Schema",
              "editable": true
            }
          }
        }
      },
      "miroirMenuItem": {
        "type": "object",
        "definition": {
          "label": {
            "type": "string"
          },
          "section": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "applicationSection"
            }
          },
          "application": {
            "type": "string",
            "validations": [
              {
                "type": "uuid"
              }
            ],
            "extra": {
              "id": 1,
              "defaultLabel": "Application",
              "editable": false
            }
          },
          "reportUuid": {
            "type": "string",
            "validations": [
              {
                "type": "uuid"
              }
            ],
            "extra": {
              "id": 1,
              "defaultLabel": "Report",
              "editable": false
            }
          },
          "instanceUuid": {
            "type": "string",
            "optional": true,
            "validations": [
              {
                "type": "uuid"
              }
            ],
            "extra": {
              "id": 1,
              "defaultLabel": "Instance",
              "editable": false
            }
          },
          "icon": {
            "type": "string",
            "validations": [
              {
                "type": "uuid"
              }
            ]
          }
        }
      },
      "menuItemArray": {
        "type": "array",
        "definition": {
          "type": "schemaReference",
          "definition": {
            "relativePath": "miroirMenuItem"
          }
        }
      },
      "sectionOfMenu": {
        "type": "object",
        "definition": {
          "title": {
            "type": "string"
          },
          "label": {
            "type": "string"
          },
          "items": {
            "type": "schemaReference",
            "definition": {
              "relativePath": "menuItemArray"
            }
          }
        }
      },
      "simpleMenu": {
        "type": "object",
        "definition": {
          "menuType": {
            "type": "literal",
            "definition": "simpleMenu"
          },
          "definition": {
            "type": "schemaReference",
            "definition": {
              "relativePath": "menuItemArray"
            }
          }
        }
      },
      "complexMenu": {
        "type": "object",
        "definition": {
          "menuType": {
            "type": "literal",
            "definition": "complexMenu"
          },
          "definition": {
            "type": "array",
            "definition": {
              "type": "schemaReference",
              "definition": {
                "relativePath": "sectionOfMenu"
              }
            }
          }
        }
      },
      "menuDefinition": {
        "type": "union",
        "discriminator": "menuType",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "simpleMenu"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "complexMenu"
            }
          }
        ]
      },
      "menu": {
        "type": "object",
        "definition": {
          "uuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Uuid",
              "editable": false
            }
          },
          "parentName": {
            "type": "string",
            "optional": true,
            "extra": {
              "id": 2,
              "defaultLabel": "Entity Name",
              "editable": false
            }
          },
          "parentUuid": {
            "type": "uuid",
            "extra": {
              "id": 3,
              "defaultLabel": "Entity Uuid",
              "editable": false
            }
          },
          "parentDefinitionVersionUuid": {
            "type": "uuid",
            "optional": true,
            "extra": {
              "id": 4,
              "defaultLabel": "Entity Definition Version Uuid",
              "editable": false
            }
          },
          "name": {
            "type": "string",
            "extra": {
              "id": 5,
              "defaultLabel": "Name",
              "editable": true
            }
          },
          "defaultLabel": {
            "type": "string",
            "extra": {
              "id": 6,
              "defaultLabel": "Default Label",
              "editable": true
            }
          },
          "description": {
            "type": "string",
            "optional": true,
            "extra": {
              "id": 7,
              "defaultLabel": "Description",
              "editable": true
            }
          },
          "definition": {
            "type": "schemaReference",
            "context": {
              "miroirMenuItem": {
                "type": "object",
                "definition": {
                  "label": {
                    "type": "string"
                  },
                  "section": {
                    "type": "schemaReference",
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "applicationSection"
                    }
                  },
                  "application": {
                    "type": "string",
                    "validations": [
                      {
                        "type": "uuid"
                      }
                    ],
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Application",
                      "editable": false
                    }
                  },
                  "reportUuid": {
                    "type": "string",
                    "validations": [
                      {
                        "type": "uuid"
                      }
                    ],
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Report",
                      "editable": false
                    }
                  },
                  "instanceUuid": {
                    "type": "string",
                    "optional": true,
                    "validations": [
                      {
                        "type": "uuid"
                      }
                    ],
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Instance",
                      "editable": false
                    }
                  },
                  "icon": {
                    "type": "string",
                    "validations": [
                      {
                        "type": "uuid"
                      }
                    ]
                  }
                }
              },
              "menuItemArray": {
                "type": "array",
                "definition": {
                  "type": "schemaReference",
                  "definition": {
                    "relativePath": "miroirMenuItem"
                  }
                }
              },
              "sectionOfMenu": {
                "type": "object",
                "definition": {
                  "title": {
                    "type": "string"
                  },
                  "label": {
                    "type": "string"
                  },
                  "items": {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "menuItemArray"
                    }
                  }
                }
              },
              "simpleMenu": {
                "type": "object",
                "definition": {
                  "menuType": {
                    "type": "literal",
                    "definition": "simpleMenu"
                  },
                  "definition": {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "menuItemArray"
                    }
                  }
                }
              },
              "complexMenu": {
                "type": "object",
                "definition": {
                  "menuType": {
                    "type": "literal",
                    "definition": "complexMenu"
                  },
                  "definition": {
                    "type": "array",
                    "definition": {
                      "type": "schemaReference",
                      "definition": {
                        "relativePath": "sectionOfMenu"
                      }
                    }
                  }
                }
              },
              "menuDefinition": {
                "type": "union",
                "discriminator": "menuType",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "simpleMenu"
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "complexMenu"
                    }
                  }
                ]
              }
            },
            "definition": {
              "relativePath": "menuDefinition"
            }
          }
        }
      },
      "objectInstanceReportSection": {
        "type": "object",
        "definition": {
          "type": {
            "type": "literal",
            "definition": "objectInstanceReportSection"
          },
          "fetchQuery": {
            "type": "schemaReference",
            "optional": true,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "miroirFetchQuery"
            }
          },
          "definition": {
            "type": "object",
            "definition": {
              "label": {
                "type": "string",
                "optional": true,
                "extra": {
                  "id": 1,
                  "defaultLabel": "Label",
                  "editable": false
                }
              },
              "parentUuid": {
                "type": "string",
                "validations": [
                  {
                    "type": "uuid"
                  }
                ],
                "extra": {
                  "id": 2,
                  "defaultLabel": "Entity Uuid",
                  "editable": false
                }
              },
              "fetchedDataReference": {
                "type": "string",
                "optional": true,
                "extra": {
                  "id": 3,
                  "defaultLabel": "Fetched Data Reference",
                  "editable": false
                }
              },
              "query": {
                "type": "schemaReference",
                "optional": true,
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "selectObjectQuery"
                }
              }
            }
          }
        }
      },
      "objectListReportSection": {
        "type": "object",
        "definition": {
          "type": {
            "type": "literal",
            "definition": "objectListReportSection"
          },
          "definition": {
            "type": "object",
            "definition": {
              "label": {
                "type": "string",
                "optional": true,
                "extra": {
                  "id": 1,
                  "defaultLabel": "Label",
                  "editable": false
                }
              },
              "parentName": {
                "type": "string",
                "optional": true,
                "extra": {
                  "id": 2,
                  "defaultLabel": "Entity Name",
                  "editable": false
                }
              },
              "parentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 2,
                  "defaultLabel": "Entity Uuid",
                  "targetEntity": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                  "editable": false
                }
              },
              "fetchedDataReference": {
                "type": "string",
                "optional": true,
                "extra": {
                  "id": 3,
                  "defaultLabel": "Fetched Data Reference",
                  "editable": false
                }
              },
              "query": {
                "type": "schemaReference",
                "optional": true,
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "selectObjectQuery"
                }
              },
              "sortByAttribute": {
                "type": "string",
                "optional": true
              }
            }
          }
        }
      },
      "gridReportSection": {
        "type": "object",
        "definition": {
          "type": {
            "type": "literal",
            "definition": "grid"
          },
          "fetchQuery": {
            "type": "schemaReference",
            "optional": true,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "miroirFetchQuery"
            }
          },
          "selectData": {
            "type": "schemaReference",
            "optional": true,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "miroirSelectQueriesRecord"
            }
          },
          "combineData": {
            "type": "schemaReference",
            "optional": true,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "miroirCrossJoinQuery"
            }
          },
          "definition": {
            "type": "array",
            "definition": {
              "type": "array",
              "definition": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "reportSection"
                }
              }
            }
          }
        }
      },
      "listReportSection": {
        "type": "object",
        "definition": {
          "type": {
            "type": "literal",
            "definition": "list"
          },
          "fetchQuery": {
            "type": "schemaReference",
            "optional": true,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "miroirFetchQuery"
            }
          },
          "selectData": {
            "type": "schemaReference",
            "optional": true,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "miroirSelectQueriesRecord"
            }
          },
          "combineData": {
            "type": "schemaReference",
            "optional": true,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "miroirCrossJoinQuery"
            }
          },
          "definition": {
            "type": "array",
            "definition": {
              "type": "union",
              "discriminator": "type",
              "definition": [
                {
                  "type": "schemaReference",
                  "definition": {
                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    "relativePath": "objectInstanceReportSection"
                  }
                },
                {
                  "type": "schemaReference",
                  "definition": {
                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    "relativePath": "objectListReportSection"
                  }
                }
              ]
            }
          }
        }
      },
      "reportSection": {
        "type": "union",
        "discriminator": "type",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "gridReportSection"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "listReportSection"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "objectListReportSection"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "objectInstanceReportSection"
            }
          }
        ]
      },
      "rootReportSection": {
        "type": "object",
        "definition": {
          "reportParametersToFetchQueryParametersTransformer": {
            "type": "record",
            "optional": true,
            "definition": {
              "type": "string"
            }
          },
          "reportParameters": {
            "type": "record",
            "optional": true,
            "definition": {
              "type": "string"
            }
          },
          "fetchQuery": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "miroirFetchQuery"
            }
          },
          "section": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "reportSection"
            }
          }
        }
      },
      "jzodObjectOrReference": {
        "type": "union",
        "definition": [
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
              "relativePath": "jzodObject"
            }
          }
        ]
      },
      "jzodSchema": {
        "type": "object",
        "definition": {
          "uuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Uuid",
              "editable": false
            }
          },
          "parentName": {
            "type": "string",
            "extra": {
              "id": 2,
              "defaultLabel": "Entity Name",
              "editable": false
            }
          },
          "parentUuid": {
            "type": "uuid",
            "extra": {
              "id": 3,
              "defaultLabel": "Entity Uuid",
              "editable": false
            }
          },
          "parentDefinitionVersionUuid": {
            "type": "uuid",
            "optional": true,
            "extra": {
              "id": 4,
              "defaultLabel": "Entity Definition Version Uuid",
              "editable": false
            }
          },
          "name": {
            "type": "string",
            "extra": {
              "id": 5,
              "defaultLabel": "Name",
              "editable": false
            }
          },
          "conceptLevel": {
            "type": "enum",
            "definition": [
              "MetaModel",
              "Model",
              "Data"
            ],
            "optional": true,
            "extra": {
              "id": 6,
              "defaultLabel": "Concept Level",
              "editable": false
            }
          },
          "defaultLabel": {
            "type": "string",
            "optional": true,
            "extra": {
              "id": 7,
              "defaultLabel": "Default Label",
              "editable": true
            }
          },
          "description": {
            "type": "string",
            "optional": true,
            "extra": {
              "id": 8,
              "defaultLabel": "Description",
              "editable": true
            }
          },
          "definition": {
            "type": "schemaReference",
            "context": {
              "jzodObjectOrReference": {
                "type": "union",
                "definition": [
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
                      "relativePath": "jzodObject"
                    }
                  }
                ]
              }
            },
            "definition": {
              "relativePath": "jzodObjectOrReference"
            },
            "optional": true,
            "extra": {
              "id": 9,
              "defaultLabel": "Definition",
              "editable": true
            }
          }
        }
      },
      "report": {
        "type": "object",
        "definition": {
          "uuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Uuid",
              "editable": false
            }
          },
          "parentName": {
            "type": "string",
            "optional": true,
            "extra": {
              "id": 2,
              "defaultLabel": "Entity Name",
              "editable": false
            }
          },
          "parentUuid": {
            "type": "uuid",
            "extra": {
              "id": 3,
              "defaultLabel": "Entity Uuid",
              "editable": false
            }
          },
          "parentDefinitionVersionUuid": {
            "type": "uuid",
            "optional": true,
            "extra": {
              "id": 4,
              "defaultLabel": "Entity Definition Version Uuid",
              "editable": false
            }
          },
          "conceptLevel": {
            "type": "enum",
            "definition": [
              "MetaModel",
              "Model",
              "Data"
            ],
            "optional": true,
            "extra": {
              "id": 5,
              "defaultLabel": "Concept Level",
              "editable": false
            }
          },
          "name": {
            "type": "string",
            "extra": {
              "id": 6,
              "defaultLabel": "Name",
              "editable": true
            }
          },
          "defaultLabel": {
            "type": "string",
            "extra": {
              "id": 7,
              "defaultLabel": "Default Label",
              "editable": true
            }
          },
          "type": {
            "type": "enum",
            "definition": [
              "list",
              "grid"
            ],
            "optional": true,
            "extra": {
              "id": 8,
              "defaultLabel": "Type of Report",
              "editable": true
            }
          },
          "application": {
            "type": "uuid",
            "optional": true,
            "extra": {
              "id": 9,
              "defaultLabel": "Application",
              "targetEntity": "a659d350-dd97-4da9-91de-524fa01745dc",
              "editable": true
            }
          },
          "definition": {
            "type": "schemaReference",
            "context": {
              "objectInstanceReportSection": {
                "type": "object",
                "definition": {
                  "type": {
                    "type": "literal",
                    "definition": "objectInstanceReportSection"
                  },
                  "fetchQuery": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "miroirFetchQuery"
                    }
                  },
                  "definition": {
                    "type": "object",
                    "definition": {
                      "label": {
                        "type": "string",
                        "optional": true,
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Label",
                          "editable": false
                        }
                      },
                      "parentUuid": {
                        "type": "string",
                        "validations": [
                          {
                            "type": "uuid"
                          }
                        ],
                        "extra": {
                          "id": 2,
                          "defaultLabel": "Entity Uuid",
                          "editable": false
                        }
                      },
                      "fetchedDataReference": {
                        "type": "string",
                        "optional": true,
                        "extra": {
                          "id": 3,
                          "defaultLabel": "Fetched Data Reference",
                          "editable": false
                        }
                      },
                      "query": {
                        "type": "schemaReference",
                        "optional": true,
                        "definition": {
                          "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                          "relativePath": "selectObjectQuery"
                        }
                      }
                    }
                  }
                }
              },
              "objectListReportSection": {
                "type": "object",
                "definition": {
                  "type": {
                    "type": "literal",
                    "definition": "objectListReportSection"
                  },
                  "definition": {
                    "type": "object",
                    "definition": {
                      "label": {
                        "type": "string",
                        "optional": true,
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Label",
                          "editable": false
                        }
                      },
                      "parentName": {
                        "type": "string",
                        "optional": true,
                        "extra": {
                          "id": 2,
                          "defaultLabel": "Entity Name",
                          "editable": false
                        }
                      },
                      "parentUuid": {
                        "type": "uuid",
                        "extra": {
                          "id": 2,
                          "defaultLabel": "Entity Uuid",
                          "targetEntity": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                          "editable": false
                        }
                      },
                      "fetchedDataReference": {
                        "type": "string",
                        "optional": true,
                        "extra": {
                          "id": 3,
                          "defaultLabel": "Fetched Data Reference",
                          "editable": false
                        }
                      },
                      "query": {
                        "type": "schemaReference",
                        "optional": true,
                        "definition": {
                          "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                          "relativePath": "selectObjectQuery"
                        }
                      },
                      "sortByAttribute": {
                        "type": "string",
                        "optional": true
                      }
                    }
                  }
                }
              },
              "gridReportSection": {
                "type": "object",
                "definition": {
                  "type": {
                    "type": "literal",
                    "definition": "grid"
                  },
                  "fetchQuery": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "miroirFetchQuery"
                    }
                  },
                  "selectData": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "miroirSelectQueriesRecord"
                    }
                  },
                  "combineData": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "miroirCrossJoinQuery"
                    }
                  },
                  "definition": {
                    "type": "array",
                    "definition": {
                      "type": "array",
                      "definition": {
                        "type": "schemaReference",
                        "definition": {
                          "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                          "relativePath": "reportSection"
                        }
                      }
                    }
                  }
                }
              },
              "listReportSection": {
                "type": "object",
                "definition": {
                  "type": {
                    "type": "literal",
                    "definition": "list"
                  },
                  "fetchQuery": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "miroirFetchQuery"
                    }
                  },
                  "selectData": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "miroirSelectQueriesRecord"
                    }
                  },
                  "combineData": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "miroirCrossJoinQuery"
                    }
                  },
                  "definition": {
                    "type": "array",
                    "definition": {
                      "type": "union",
                      "discriminator": "type",
                      "definition": [
                        {
                          "type": "schemaReference",
                          "definition": {
                            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                            "relativePath": "objectInstanceReportSection"
                          }
                        },
                        {
                          "type": "schemaReference",
                          "definition": {
                            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                            "relativePath": "objectListReportSection"
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "reportSection": {
                "type": "union",
                "discriminator": "type",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "gridReportSection"
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "listReportSection"
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "objectListReportSection"
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "objectInstanceReportSection"
                    }
                  }
                ]
              },
              "parameterTransformer": {
                "type": "string"
              },
              "rootReportSection": {
                "type": "object",
                "definition": {
                  "reportParametersToFetchQueryParametersTransformer": {
                    "type": "record",
                    "optional": true,
                    "definition": {
                      "type": "string"
                    }
                  },
                  "reportParameters": {
                    "type": "record",
                    "optional": true,
                    "definition": {
                      "type": "string"
                    }
                  },
                  "fetchQuery": {
                    "type": "schemaReference",
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "miroirFetchQuery"
                    }
                  },
                  "section": {
                    "type": "schemaReference",
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "reportSection"
                    }
                  }
                }
              }
            },
            "definition": {
              "eager": true,
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "rootReportSection"
            },
            "extra": {
              "id": 9,
              "defaultLabel": "Definition",
              "editable": true
            }
          }
        }
      },
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
                  "extra": {
                    "id": 1,
                    "defaultLabel": "Uuid",
                    "editable": false
                  }
                },
                "parentName": {
                  "type": "string",
                  "optional": true,
                  "extra": {
                    "id": 2,
                    "defaultLabel": "Entity Name",
                    "editable": false
                  }
                },
                "parentUuid": {
                  "type": "uuid",
                  "extra": {
                    "id": 3,
                    "defaultLabel": "Entity Uuid",
                    "editable": false
                  }
                },
                "conceptLevel": {
                  "type": "enum",
                  "definition": [
                    "MetaModel",
                    "Model",
                    "Data"
                  ],
                  "optional": true,
                  "extra": {
                    "id": 4,
                    "defaultLabel": "Concept Level",
                    "editable": false
                  }
                },
                "applicationVersion": {
                  "type": "uuid",
                  "extra": {
                    "id": 1,
                    "defaultLabel": "Application Version",
                    "editable": false
                  }
                },
                "entityDefinition": {
                  "type": "uuid",
                  "extra": {
                    "id": 1,
                    "defaultLabel": "Entity Definition",
                    "editable": false
                  }
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
          "emulatedServerType": {
            "type": "literal",
            "definition": "indexedDb"
          },
          "indexedDbName": {
            "type": "string"
          }
        }
      },
      "filesystemDbStoreSectionConfiguration": {
        "type": "object",
        "definition": {
          "emulatedServerType": {
            "type": "literal",
            "definition": "filesystem"
          },
          "directory": {
            "type": "string"
          }
        }
      },
      "sqlDbStoreSectionConfiguration": {
        "type": "object",
        "definition": {
          "emulatedServerType": {
            "type": "literal",
            "definition": "sql"
          },
          "connectionString": {
            "type": "string"
          },
          "schema": {
            "type": "string"
          }
        }
      },
      "storeSectionConfiguration": {
        "type": "union",
        "discriminator": "emulatedServerType",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "indexedDbStoreSectionConfiguration"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "filesystemDbStoreSectionConfiguration"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "sqlDbStoreSectionConfiguration"
            }
          }
        ]
      },
      "storeUnitConfiguration": {
        "type": "object",
        "definition": {
          "admin": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "storeSectionConfiguration"
            }
          },
          "model": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "storeSectionConfiguration"
            }
          },
          "data": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "storeSectionConfiguration"
            }
          }
        }
      },
      "deploymentStorageConfig": {
        "type": "record",
        "definition": {
          "type": "schemaReference",
          "definition": {
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "storeUnitConfiguration"
          }
        }
      },
      "serverConfigForClientConfig": {
        "type": "object",
        "definition": {
          "rootApiUrl": {
            "type": "string"
          },
          "dataflowConfiguration": {
            "type": "any"
          },
          "storeSectionConfiguration": {
            "type": "record",
            "definition": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "storeUnitConfiguration"
              }
            }
          }
        }
      },
      "miroirConfigForMswClient": {
        "type": "object",
        "definition": {
          "emulateServer": {
            "type": "literal",
            "definition": true
          },
          "rootApiUrl": {
            "type": "string"
          },
          "deploymentStorageConfig": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "deploymentStorageConfig"
            }
          }
        }
      },
      "miroirConfigForRestClient": {
        "type": "object",
        "definition": {
          "emulateServer": {
            "type": "literal",
            "definition": false
          },
          "serverConfig": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "serverConfigForClientConfig"
            }
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
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "miroirConfigForMswClient"
                }
              },
              {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "miroirConfigForRestClient"
                }
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
                "type": "string"
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
          "uuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Uuid",
              "editable": false
            }
          },
          "parentName": {
            "type": "string",
            "optional": true,
            "extra": {
              "id": 2,
              "defaultLabel": "Entity Name",
              "editable": false
            }
          },
          "parentUuid": {
            "type": "uuid",
            "extra": {
              "id": 3,
              "defaultLabel": "Entity Uuid",
              "editable": false
            }
          },
          "parentDefinitionVersionUuid": {
            "type": "uuid",
            "optional": true,
            "extra": {
              "id": 4,
              "defaultLabel": "Entity Definition Version Uuid",
              "editable": false
            }
          },
          "date": {
            "type": "date",
            "extra": {
              "id": 5,
              "defaultLabel": "Date",
              "editable": false
            }
          },
          "application": {
            "type": "uuid",
            "optional": true,
            "extra": {
              "id": 6,
              "defaultLabel": "Application",
              "editable": false
            }
          },
          "name": {
            "type": "string",
            "extra": {
              "id": 7,
              "defaultLabel": "Name",
              "editable": true
            }
          },
          "preceding": {
            "type": "uuid",
            "optional": true,
            "extra": {
              "id": 8,
              "defaultLabel": "Previous Commit",
              "targetEntity": "73bb0c69-e636-4e3b-a230-51f25469c089",
              "editable": false
            }
          },
          "branch": {
            "type": "uuid",
            "optional": true,
            "extra": {
              "id": 9,
              "defaultLabel": "Author",
              "targetEntity": "",
              "editable": true
            }
          },
          "author": {
            "type": "uuid",
            "optional": true,
            "extra": {
              "id": 10,
              "defaultLabel": "Author",
              "targetEntity": "",
              "editable": true
            }
          },
          "description": {
            "type": "string",
            "optional": true,
            "extra": {
              "id": 11,
              "defaultLabel": "Description",
              "editable": true
            }
          },
          "actions": {
            "type": "array",
            "definition": {
              "type": "object",
              "definition": {
                "endpoint": {
                  "type": "uuid",
                  "extra": {
                    "id": 1,
                    "defaultLabel": "Uuid",
                    "editable": false
                  }
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
          }
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
      "queryFailed": {
        "type": "object",
        "definition": {
          "queryFailure": {
            "type": "enum",
            "definition": [
              "QueryNotExecutable",
              "DomainStateNotLoaded",
              "IncorrectParameters",
              "DeploymentNotFound",
              "ApplicationSectionNotFound",
              "EntityNotFound",
              "InstanceNotFound",
              "ReferenceNotFound",
              "ReferenceFoundButUndefined",
              "ReferenceFoundButAttributeUndefinedOnFoundObject"
            ]
          },
          "query": {
            "type": "string",
            "optional": true
          },
          "queryReference": {
            "type": "string",
            "optional": true
          },
          "queryParameters": {
            "type": "string",
            "optional": true
          },
          "queryContext": {
            "type": "string",
            "optional": true
          },
          "deploymentUuid": {
            "type": "string",
            "optional": true
          },
          "applicationSection": {
            "type": "schemaReference",
            "optional": true,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "applicationSection"
            },
            "context": {}
          },
          "entityUuid": {
            "type": "string",
            "optional": true
          },
          "instanceUuid": {
            "type": "string",
            "optional": true
          }
        }
      },
      "queryObjectReference": {
        "type": "union",
        "discriminator": "referenceType",
        "definition": [
          {
            "type": "object",
            "definition": {
              "referenceType": {
                "type": "literal",
                "definition": "constant"
              },
              "referenceUuid": {
                "type": "uuid",
                "extra": {
                  "targetEntity": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad"
                }
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "referenceType": {
                "type": "literal",
                "definition": "queryContextReference"
              },
              "referenceName": {
                "type": "string"
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "referenceType": {
                "type": "literal",
                "definition": "queryParameterReference"
              },
              "referenceName": {
                "type": "string"
              }
            }
          }
        ]
      },
      "selectRootQuery": {
        "type": "object",
        "definition": {
          "label": {
            "type": "string",
            "optional": true,
            "extra": {
              "id": 1,
              "defaultLabel": "Label",
              "editable": false
            }
          },
          "applicationSection": {
            "type": "schemaReference",
            "optional": true,
            "extra": {
              "id": 2,
              "defaultLabel": "Parent Uuid",
              "editable": false
            },
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "applicationSection"
            },
            "context": {}
          },
          "parentName": {
            "type": "string",
            "optional": true,
            "extra": {
              "id": 3,
              "defaultLabel": "Parent Name",
              "editable": false
            }
          },
          "parentUuid": {
            "type": "schemaReference",
            "extra": {
              "id": 4,
              "defaultLabel": "Parent Uuid",
              "editable": false
            },
            "definition": {
              "relativePath": "queryObjectReference",
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
            },
            "context": {}
          }
        }
      },
      "selectObjectByRelationQuery": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "relativePath": "selectRootQuery",
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
          },
          "context": {}
        },
        "definition": {
          "queryType": {
            "type": "literal",
            "definition": "selectObjectByRelation"
          },
          "objectReference": {
            "type": "schemaReference",
            "definition": {
              "relativePath": "queryObjectReference",
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
            },
            "context": {}
          },
          "AttributeOfObjectToCompareToReferenceUuid": {
            "type": "string"
          }
        }
      },
      "selectObjectByDirectReferenceQuery": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "relativePath": "selectRootQuery",
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
          },
          "context": {}
        },
        "definition": {
          "queryType": {
            "type": "literal",
            "definition": "selectObjectByDirectReference"
          },
          "instanceUuid": {
            "type": "schemaReference",
            "definition": {
              "relativePath": "queryObjectReference",
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
            },
            "context": {}
          }
        }
      },
      "selectObjectQuery": {
        "type": "union",
        "discriminator": "queryType",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "selectObjectByRelationQuery",
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "selectObjectByDirectReferenceQuery",
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
            },
            "context": {}
          }
        ]
      },
      "selectObjectListByEntityQuery": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "relativePath": "selectRootQuery",
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
          },
          "context": {}
        },
        "definition": {
          "queryType": {
            "type": "literal",
            "definition": "selectObjectListByEntity"
          }
        }
      },
      "selectObjectListByRelationQuery": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "relativePath": "selectRootQuery",
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
          },
          "context": {}
        },
        "definition": {
          "queryType": {
            "type": "literal",
            "definition": "selectObjectListByRelation"
          },
          "objectReference": {
            "type": "schemaReference",
            "definition": {
              "relativePath": "queryObjectReference",
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
            },
            "context": {}
          },
          "objectReferenceAttribute": {
            "type": "string",
            "optional": true
          },
          "AttributeOfListObjectToCompareToReferenceUuid": {
            "type": "string"
          }
        }
      },
      "selectObjectListByManyToManyRelationQuery": {
        "type": "object",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "relativePath": "selectRootQuery",
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
          },
          "context": {}
        },
        "definition": {
          "queryType": {
            "type": "literal",
            "definition": "selectObjectListByManyToManyRelation"
          },
          "objectListReference": {
            "type": "schemaReference",
            "definition": {
              "relativePath": "queryObjectReference",
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
            },
            "context": {}
          },
          "objectListReferenceAttribute": {
            "type": "string",
            "optional": true
          },
          "AttributeOfRootListObjectToCompareToListReferenceUuid": {
            "type": "string",
            "optional": true
          }
        }
      },
      "selectQueryCombinerQuery": {
        "type": "object",
        "definition": {
          "queryType": {
            "type": "literal",
            "definition": "queryCombiner"
          },
          "rootQuery": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "miroirSelectQuery"
            },
            "context": {}
          },
          "subQuery": {
            "type": "object",
            "definition": {
              "query": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "miroirSelectQuery"
                },
                "context": {}
              },
              "parameter": {
                "type": "object",
                "definition": {
                  "transformerType": {
                    "type": "literal",
                    "definition": "recordOfTransformers"
                  },
                  "definition": {
                    "type": "record",
                    "definition": {
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
                    }
                  }
                }
              }
            }
          }
        }
      },
      "selectObjectListQuery": {
        "type": "union",
        "discriminator": "queryType",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "selectObjectListByEntityQuery",
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "selectObjectListByRelationQuery",
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "selectObjectListByManyToManyRelationQuery",
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
            },
            "context": {}
          }
        ]
      },
      "miroirSelectQuery": {
        "type": "union",
        "discriminator": "queryType",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "selectObjectListByEntityQuery",
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "selectObjectListByRelationQuery",
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "selectObjectListByManyToManyRelationQuery",
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "selectQueryCombinerQuery",
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "selectObjectByRelationQuery",
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "selectObjectByDirectReferenceQuery",
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
            },
            "context": {}
          },
          {
            "type": "object",
            "definition": {
              "queryType": {
                "type": "literal",
                "definition": "literal"
              },
              "definition": {
                "type": "string"
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "queryType": {
                "type": "literal",
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "definition": "queryContextReference"
              },
              "queryReference": {
                "type": "string"
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "queryType": {
                "type": "literal",
                "definition": "wrapperReturningObject"
              },
              "definition": {
                "type": "record",
                "definition": {
                  "type": "schemaReference",
                  "definition": {
                    "relativePath": "miroirSelectQuery",
                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
                  },
                  "context": {}
                }
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "queryType": {
                "type": "literal",
                "definition": "wrapperReturningList"
              },
              "definition": {
                "type": "array",
                "definition": {
                  "type": "schemaReference",
                  "definition": {
                    "relativePath": "miroirSelectQuery",
                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
                  },
                  "context": {}
                }
              }
            }
          }
        ]
      },
      "miroirSelectQueriesRecord": {
        "type": "record",
        "definition": {
          "type": "schemaReference",
          "definition": {
            "relativePath": "miroirSelectQuery",
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
          },
          "context": {}
        }
      },
      "miroirCrossJoinQuery": {
        "type": "object",
        "definition": {
          "queryType": {
            "type": "literal",
            "definition": "combineQuery"
          },
          "a": {
            "type": "string"
          },
          "b": {
            "type": "string"
          }
        }
      },
      "miroirFetchQuery": {
        "type": "object",
        "definition": {
          "parameterSchema": {
            "type": "schemaReference",
            "optional": true,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodObject"
            },
            "context": {}
          },
          "select": {
            "type": "schemaReference",
            "definition": {
              "relativePath": "miroirSelectQueriesRecord",
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
            },
            "context": {}
          },
          "crossJoin": {
            "type": "schemaReference",
            "optional": true,
            "definition": {
              "relativePath": "miroirCrossJoinQuery",
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
            },
            "context": {}
          }
        }
      },
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
          "elementValue": {
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
          "elementValue": {
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
          "elementValue": {
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
          "elementValue": {
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
          "elementValue": {
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
          "object",
          "instanceUuidIndex",
          "entityInstanceCollection",
          "instanceArray",
          "instance",
          "instanceUuid",
          "instanceUuidIndexUuidIndex"
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
              "elementValue": {
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
              "elementValue": {
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
              "elementValue": {
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
              "elementValue": {
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
      "recordOfTransformers": {
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
            "extra": {
              "id": 1,
              "defaultLabel": "Uuid",
              "editable": false
            }
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
            "extra": {
              "id": 1,
              "defaultLabel": "Entity",
              "editable": false
            }
          },
          "instanceUuid": {
            "type": "uuid",
            "optional": true,
            "extra": {
              "id": 1,
              "defaultLabel": "Instance",
              "editable": false
            }
          }
        }
      },
      "localCacheQueryParams": {
        "type": "object",
        "definition": {
          "queryType": {
            "type": "literal",
            "definition": "LocalCacheEntityInstancesSelectorParams"
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
            "definition": "domainSingleSelectQueryWithDeployment"
          },
          "deploymentUuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Uuid",
              "editable": false
            }
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
            "definition": "domainSingleSelectQueryWithDeployment"
          },
          "deploymentUuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Uuid",
              "editable": false
            }
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
            "definition": "domainSingleSelectQueryWithDeployment"
          },
          "deploymentUuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Uuid",
              "editable": false
            }
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
            "definition": "getSingleSelectQuery"
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
            "definition": "getSingleSelectQuery"
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
            "definition": "getSingleSelectQuery"
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
            "definition": "DomainManyQueries"
          },
          "deploymentUuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Uuid",
              "editable": false
            }
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
            "definition": "getEntityDefinition"
          },
          "deploymentUuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Uuid",
              "editable": false
            }
          },
          "entityUuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Uuid",
              "editable": false
            }
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
            "definition": "getFetchParamsJzodSchema"
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
            "definition": "getSingleSelectQueryJzodSchema"
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
          "status": {
            "type": "literal",
            "definition": "error"
          },
          "error": {
            "type": "object",
            "definition": {
              "errorType": {
                "type": "union",
                "definition": [
                  {
                    "type": "enum",
                    "definition": [
                      "FailedToCreateStore",
                      "FailedToDeployModule"
                    ]
                  },
                  {
                    "type": "literal",
                    "definition": "FailedToDeleteStore"
                  },
                  {
                    "type": "literal",
                    "definition": "FailedToResetAndInitMiroirAndApplicationDatabase"
                  },
                  {
                    "type": "literal",
                    "definition": "FailedToOpenStore"
                  },
                  {
                    "type": "literal",
                    "definition": "FailedToCloseStore"
                  },
                  {
                    "type": "literal",
                    "definition": "FailedToCreateInstance"
                  },
                  {
                    "type": "literal",
                    "definition": "FailedToGetInstance"
                  },
                  {
                    "type": "literal",
                    "definition": "FailedToGetInstances"
                  }
                ]
              },
              "errorMessage": {
                "type": "string",
                "optional": true
              },
              "error": {
                "type": "object",
                "optional": true,
                "definition": {
                  "errorMessage": {
                    "type": "string",
                    "optional": true
                  },
                  "stack": {
                    "type": "array",
                    "definition": {
                      "type": "string",
                      "optional": true
                    }
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
          "status": {
            "type": "literal",
            "definition": "ok"
          },
          "returnedDomainElement": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "domainElementVoid"
            }
          }
        }
      },
      "actionVoidReturnType": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "actionError"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "actionVoidSuccess"
            }
          }
        ]
      },
      "actionEntityInstanceSuccess": {
        "type": "object",
        "definition": {
          "status": {
            "type": "literal",
            "definition": "ok"
          },
          "returnedDomainElement": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "domainElementEntityInstance"
            }
          }
        }
      },
      "actionEntityInstanceReturnType": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "actionError"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "actionEntityInstanceSuccess"
            }
          }
        ]
      },
      "actionEntityInstanceCollectionSuccess": {
        "type": "object",
        "definition": {
          "status": {
            "type": "literal",
            "definition": "ok"
          },
          "returnedDomainElement": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "domainElementEntityInstanceCollection"
            }
          }
        }
      },
      "actionEntityInstanceCollectionReturnType": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "actionError"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "actionEntityInstanceCollectionSuccess"
            }
          }
        ]
      },
      "actionSuccess": {
        "type": "object",
        "definition": {
          "status": {
            "type": "literal",
            "definition": "ok"
          },
          "returnedDomainElement": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "domainElement"
            }
          }
        }
      },
      "actionReturnType": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "actionError"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "actionSuccess"
            }
          }
        ]
      },
      "modelActionInitModelParams": {
        "type": "object",
        "definition": {
          "metaModel": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "metaModel"
            }
          },
          "dataStoreType": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "dataStoreType"
            }
          },
          "application": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "application"
            }
          },
          "applicationDeploymentConfiguration": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "entityInstance"
            }
          },
          "applicationModelBranch": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "entityInstance"
            }
          },
          "applicationVersion": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "entityInstance"
            }
          },
          "applicationStoreBasedConfiguration": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "entityInstance"
            }
          }
        }
      },
      "modelActionCommit": {
        "type": "object",
        "definition": {
          "actionType": {
            "type": "literal",
            "definition": "modelAction"
          },
          "actionName": {
            "type": "literal",
            "definition": "commit"
          },
          "endpoint": {
            "type": "literal",
            "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
          },
          "deploymentUuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Deployment",
              "editable": false
            }
          }
        }
      },
      "modelActionRollback": {
        "type": "object",
        "definition": {
          "actionType": {
            "type": "literal",
            "definition": "modelAction"
          },
          "actionName": {
            "type": "literal",
            "definition": "rollback"
          },
          "endpoint": {
            "type": "literal",
            "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
          },
          "deploymentUuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Deployment",
              "editable": false
            }
          }
        }
      },
      "modelActionInitModel": {
        "type": "object",
        "definition": {
          "actionType": {
            "type": "literal",
            "definition": "modelAction"
          },
          "actionName": {
            "type": "literal",
            "definition": "initModel"
          },
          "endpoint": {
            "type": "literal",
            "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
          },
          "deploymentUuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Deployment",
              "editable": false
            }
          },
          "params": {
            "type": "object",
            "definition": {
              "metaModel": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "metaModel"
                }
              },
              "dataStoreType": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "dataStoreType"
                }
              },
              "application": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "application"
                }
              },
              "applicationDeploymentConfiguration": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "entityInstance"
                }
              },
              "applicationModelBranch": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "entityInstance"
                }
              },
              "applicationVersion": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "entityInstance"
                }
              },
              "applicationStoreBasedConfiguration": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "entityInstance"
                }
              }
            }
          }
        }
      },
      "modelActionResetModel": {
        "type": "object",
        "definition": {
          "actionType": {
            "type": "literal",
            "definition": "modelAction"
          },
          "actionName": {
            "type": "literal",
            "definition": "resetModel"
          },
          "endpoint": {
            "type": "literal",
            "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
          },
          "deploymentUuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Deployment",
              "editable": false
            }
          }
        }
      },
      "modelActionResetData": {
        "type": "object",
        "definition": {
          "actionType": {
            "type": "literal",
            "definition": "modelAction"
          },
          "actionName": {
            "type": "literal",
            "definition": "resetData"
          },
          "endpoint": {
            "type": "literal",
            "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
          },
          "deploymentUuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Deployment",
              "editable": false
            }
          }
        }
      },
      "modelActionAlterEntityAttribute": {
        "type": "object",
        "definition": {
          "actionType": {
            "type": "literal",
            "definition": "modelAction"
          },
          "actionName": {
            "type": "literal",
            "definition": "alterEntityAttribute"
          },
          "endpoint": {
            "type": "literal",
            "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
          },
          "transactional": {
            "type": "boolean",
            "optional": true
          },
          "deploymentUuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Deployment",
              "editable": false
            }
          },
          "entityName": {
            "type": "string"
          },
          "entityUuid": {
            "type": "string",
            "validations": [
              {
                "type": "uuid"
              }
            ]
          },
          "entityDefinitionUuid": {
            "type": "string",
            "validations": [
              {
                "type": "uuid"
              }
            ]
          },
          "addColumns": {
            "type": "array",
            "optional": true,
            "definition": {
              "type": "object",
              "definition": {
                "name": {
                  "type": "string"
                },
                "definition": {
                  "type": "schemaReference",
                  "definition": {
                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    "relativePath": "jzodElement"
                  }
                }
              }
            }
          },
          "removeColumns": {
            "type": "array",
            "optional": true,
            "definition": {
              "type": "string"
            }
          },
          "update": {
            "type": "schemaReference",
            "optional": true,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodElement"
            }
          }
        }
      },
      "modelActionCreateEntity": {
        "type": "object",
        "definition": {
          "actionType": {
            "type": "literal",
            "definition": "modelAction"
          },
          "actionName": {
            "type": "literal",
            "definition": "createEntity"
          },
          "endpoint": {
            "type": "literal",
            "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
          },
          "transactional": {
            "type": "boolean",
            "optional": true
          },
          "deploymentUuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Deployment",
              "editable": false
            }
          },
          "entities": {
            "type": "array",
            "definition": {
              "type": "object",
              "definition": {
                "entity": {
                  "type": "schemaReference",
                  "definition": {
                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    "relativePath": "entity"
                  }
                },
                "entityDefinition": {
                  "type": "schemaReference",
                  "definition": {
                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    "relativePath": "entityDefinition"
                  }
                }
              }
            }
          }
        }
      },
      "modelActionDropEntity": {
        "type": "object",
        "definition": {
          "actionType": {
            "type": "literal",
            "definition": "modelAction"
          },
          "actionName": {
            "type": "literal",
            "definition": "dropEntity"
          },
          "transactional": {
            "type": "boolean",
            "optional": true
          },
          "deploymentUuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Deployment",
              "editable": false
            }
          },
          "endpoint": {
            "type": "literal",
            "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
          },
          "entityUuid": {
            "type": "string"
          },
          "entityDefinitionUuid": {
            "type": "string"
          }
        }
      },
      "modelActionRenameEntity": {
        "type": "object",
        "definition": {
          "actionType": {
            "type": "literal",
            "definition": "modelAction"
          },
          "actionName": {
            "type": "literal",
            "definition": "renameEntity"
          },
          "endpoint": {
            "type": "literal",
            "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
          },
          "transactional": {
            "type": "boolean",
            "optional": true
          },
          "deploymentUuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Deployment",
              "editable": false
            }
          },
          "entityName": {
            "type": "string",
            "optional": true
          },
          "entityUuid": {
            "type": "string",
            "validations": [
              {
                "type": "uuid"
              }
            ]
          },
          "entityDefinitionUuid": {
            "type": "string",
            "validations": [
              {
                "type": "uuid"
              }
            ]
          },
          "targetValue": {
            "type": "string"
          }
        }
      },
      "modelAction": {
        "type": "union",
        "definition": [
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "literal",
                "definition": "modelAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "initModel"
              },
              "endpoint": {
                "type": "literal",
                "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Deployment",
                  "editable": false
                }
              },
              "params": {
                "type": "object",
                "definition": {
                  "metaModel": {
                    "type": "schemaReference",
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "metaModel"
                    }
                  },
                  "dataStoreType": {
                    "type": "schemaReference",
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "dataStoreType"
                    }
                  },
                  "application": {
                    "type": "schemaReference",
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "application"
                    }
                  },
                  "applicationDeploymentConfiguration": {
                    "type": "schemaReference",
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "entityInstance"
                    }
                  },
                  "applicationModelBranch": {
                    "type": "schemaReference",
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "entityInstance"
                    }
                  },
                  "applicationVersion": {
                    "type": "schemaReference",
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "entityInstance"
                    }
                  },
                  "applicationStoreBasedConfiguration": {
                    "type": "schemaReference",
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "entityInstance"
                    }
                  }
                }
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "literal",
                "definition": "modelAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "commit"
              },
              "endpoint": {
                "type": "literal",
                "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Deployment",
                  "editable": false
                }
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "literal",
                "definition": "modelAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "rollback"
              },
              "endpoint": {
                "type": "literal",
                "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Deployment",
                  "editable": false
                }
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "literal",
                "definition": "modelAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "remoteLocalCacheRollback"
              },
              "endpoint": {
                "type": "literal",
                "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Deployment",
                  "editable": false
                }
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "literal",
                "definition": "modelAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "resetModel"
              },
              "endpoint": {
                "type": "literal",
                "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Deployment",
                  "editable": false
                }
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "literal",
                "definition": "modelAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "resetData"
              },
              "endpoint": {
                "type": "literal",
                "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Deployment",
                  "editable": false
                }
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "literal",
                "definition": "modelAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "alterEntityAttribute"
              },
              "endpoint": {
                "type": "literal",
                "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
              },
              "transactional": {
                "type": "boolean",
                "optional": true
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Deployment",
                  "editable": false
                }
              },
              "entityName": {
                "type": "string"
              },
              "entityUuid": {
                "type": "string",
                "validations": [
                  {
                    "type": "uuid"
                  }
                ]
              },
              "entityDefinitionUuid": {
                "type": "string",
                "validations": [
                  {
                    "type": "uuid"
                  }
                ]
              },
              "addColumns": {
                "type": "array",
                "optional": true,
                "definition": {
                  "type": "object",
                  "definition": {
                    "name": {
                      "type": "string"
                    },
                    "definition": {
                      "type": "schemaReference",
                      "definition": {
                        "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        "relativePath": "jzodElement"
                      }
                    }
                  }
                }
              },
              "removeColumns": {
                "type": "array",
                "optional": true,
                "definition": {
                  "type": "string"
                }
              },
              "update": {
                "type": "schemaReference",
                "optional": true,
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "jzodElement"
                }
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "literal",
                "definition": "modelAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "renameEntity"
              },
              "endpoint": {
                "type": "literal",
                "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
              },
              "transactional": {
                "type": "boolean",
                "optional": true
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Deployment",
                  "editable": false
                }
              },
              "entityName": {
                "type": "string",
                "optional": true
              },
              "entityUuid": {
                "type": "string",
                "validations": [
                  {
                    "type": "uuid"
                  }
                ]
              },
              "entityDefinitionUuid": {
                "type": "string",
                "validations": [
                  {
                    "type": "uuid"
                  }
                ]
              },
              "targetValue": {
                "type": "string"
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "literal",
                "definition": "modelAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "createEntity"
              },
              "endpoint": {
                "type": "literal",
                "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
              },
              "transactional": {
                "type": "boolean",
                "optional": true
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Deployment",
                  "editable": false
                }
              },
              "entities": {
                "type": "array",
                "definition": {
                  "type": "object",
                  "definition": {
                    "entity": {
                      "type": "schemaReference",
                      "definition": {
                        "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        "relativePath": "entity"
                      }
                    },
                    "entityDefinition": {
                      "type": "schemaReference",
                      "definition": {
                        "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        "relativePath": "entityDefinition"
                      }
                    }
                  }
                }
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "literal",
                "definition": "modelAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "dropEntity"
              },
              "transactional": {
                "type": "boolean",
                "optional": true
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Deployment",
                  "editable": false
                }
              },
              "endpoint": {
                "type": "literal",
                "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
              },
              "entityUuid": {
                "type": "string"
              },
              "entityDefinitionUuid": {
                "type": "string"
              }
            }
          }
        ]
      },
      "instanceCUDAction": {
        "type": "union",
        "definition": [
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "literal",
                "definition": "instanceAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "createInstance"
              },
              "endpoint": {
                "type": "literal",
                "definition": "ed520de4-55a9-4550-ac50-b1b713b72a89"
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                }
              },
              "applicationSection": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "applicationSection"
                }
              },
              "objects": {
                "type": "array",
                "extra": {
                  "id": 2,
                  "defaultLabel": "Entity Instances to create",
                  "editable": true
                },
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
              "actionType": {
                "type": "literal",
                "definition": "instanceAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "deleteInstance"
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                }
              },
              "endpoint": {
                "type": "literal",
                "definition": "ed520de4-55a9-4550-ac50-b1b713b72a89"
              },
              "applicationSection": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "applicationSection"
                }
              },
              "includeInTransaction": {
                "type": "boolean",
                "optional": true
              },
              "objects": {
                "type": "array",
                "extra": {
                  "id": 2,
                  "defaultLabel": "Entity Instances to delete",
                  "editable": true
                },
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
              "actionType": {
                "type": "literal",
                "definition": "instanceAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "updateInstance"
              },
              "endpoint": {
                "type": "literal",
                "definition": "ed520de4-55a9-4550-ac50-b1b713b72a89"
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                }
              },
              "applicationSection": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "applicationSection"
                }
              },
              "includeInTransaction": {
                "type": "boolean",
                "optional": true
              },
              "objects": {
                "type": "array",
                "extra": {
                  "id": 2,
                  "defaultLabel": "Entity Instances to update",
                  "editable": true
                },
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
      "instanceAction": {
        "type": "union",
        "definition": [
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "literal",
                "definition": "instanceAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "createInstance"
              },
              "endpoint": {
                "type": "literal",
                "definition": "ed520de4-55a9-4550-ac50-b1b713b72a89"
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                }
              },
              "applicationSection": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "applicationSection"
                }
              },
              "objects": {
                "type": "array",
                "extra": {
                  "id": 2,
                  "defaultLabel": "Entity Instances to create",
                  "editable": true
                },
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
              "actionType": {
                "type": "literal",
                "definition": "instanceAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "deleteInstance"
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                }
              },
              "endpoint": {
                "type": "literal",
                "definition": "ed520de4-55a9-4550-ac50-b1b713b72a89"
              },
              "applicationSection": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "applicationSection"
                }
              },
              "includeInTransaction": {
                "type": "boolean",
                "optional": true
              },
              "objects": {
                "type": "array",
                "extra": {
                  "id": 2,
                  "defaultLabel": "Entity Instances to delete",
                  "editable": true
                },
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
              "actionType": {
                "type": "literal",
                "definition": "instanceAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "deleteInstanceWithCascade"
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                }
              },
              "endpoint": {
                "type": "literal",
                "definition": "ed520de4-55a9-4550-ac50-b1b713b72a89"
              },
              "applicationSection": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "applicationSection"
                }
              },
              "includeInTransaction": {
                "type": "boolean",
                "optional": true
              },
              "objects": {
                "type": "array",
                "extra": {
                  "id": 2,
                  "defaultLabel": "Entity Instances to delete",
                  "editable": true
                },
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
              "actionType": {
                "type": "literal",
                "definition": "instanceAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "updateInstance"
              },
              "endpoint": {
                "type": "literal",
                "definition": "ed520de4-55a9-4550-ac50-b1b713b72a89"
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                }
              },
              "applicationSection": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "applicationSection"
                }
              },
              "includeInTransaction": {
                "type": "boolean",
                "optional": true
              },
              "objects": {
                "type": "array",
                "extra": {
                  "id": 2,
                  "defaultLabel": "Entity Instances to update",
                  "editable": true
                },
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
              "actionType": {
                "type": "literal",
                "definition": "instanceAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "loadNewInstancesInLocalCache"
              },
              "endpoint": {
                "type": "literal",
                "definition": "ed520de4-55a9-4550-ac50-b1b713b72a89"
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                }
              },
              "objects": {
                "type": "array",
                "extra": {
                  "id": 2,
                  "defaultLabel": "Entity Instances to place in the local cache",
                  "editable": true
                },
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
              "actionType": {
                "type": "literal",
                "definition": "instanceAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "getInstance"
              },
              "endpoint": {
                "type": "literal",
                "definition": "ed520de4-55a9-4550-ac50-b1b713b72a89"
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                }
              },
              "applicationSection": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "applicationSection"
                }
              },
              "parentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                }
              },
              "uuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                }
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "literal",
                "definition": "instanceAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "getInstances"
              },
              "endpoint": {
                "type": "literal",
                "definition": "ed520de4-55a9-4550-ac50-b1b713b72a89"
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                }
              },
              "applicationSection": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "applicationSection"
                }
              },
              "parentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                }
              }
            }
          }
        ]
      },
      "undoRedoAction": {
        "type": "union",
        "definition": [
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "literal",
                "definition": "undoRedoAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "undo"
              },
              "endpoint": {
                "type": "literal",
                "definition": "71c04f8e-c687-4ea7-9a19-bc98d796c389"
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                }
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "literal",
                "definition": "undoRedoAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "redo"
              },
              "endpoint": {
                "type": "literal",
                "definition": "71c04f8e-c687-4ea7-9a19-bc98d796c389"
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                }
              }
            }
          }
        ]
      },
      "transactionalInstanceAction": {
        "type": "object",
        "definition": {
          "actionType": {
            "type": "literal",
            "definition": "transactionalInstanceAction"
          },
          "deploymentUuid": {
            "type": "uuid",
            "optional": true,
            "extra": {
              "defaultLabel": "Module Deployment Uuid",
              "editable": false
            }
          },
          "instanceAction": {
            "type": "schemaReference",
            "optional": false,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "instanceCUDAction"
            }
          }
        }
      },
      "localCacheAction": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "optional": false,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "undoRedoAction"
            }
          },
          {
            "type": "schemaReference",
            "optional": false,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "modelAction"
            }
          },
          {
            "type": "schemaReference",
            "optional": false,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "instanceAction"
            }
          },
          {
            "type": "schemaReference",
            "optional": false,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "transactionalInstanceAction"
            }
          }
        ]
      },
      "storeManagementAction": {
        "type": "union",
        "definition": [
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "literal",
                "definition": "storeManagementAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "createStore"
              },
              "endpoint": {
                "type": "literal",
                "definition": "bbd08cbb-79ff-4539-b91f-7a14f15ac55f"
              },
              "configuration": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "storeUnitConfiguration"
                }
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "defaultLabel": "Module Deployment Uuid",
                  "editable": false
                }
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "literal",
                "definition": "storeManagementAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "deleteStore"
              },
              "endpoint": {
                "type": "literal",
                "definition": "bbd08cbb-79ff-4539-b91f-7a14f15ac55f"
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "defaultLabel": "Module Deployment Uuid",
                  "editable": false
                }
              },
              "configuration": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "storeUnitConfiguration"
                }
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "literal",
                "definition": "storeManagementAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "resetAndInitMiroirAndApplicationDatabase"
              },
              "endpoint": {
                "type": "literal",
                "definition": "bbd08cbb-79ff-4539-b91f-7a14f15ac55f"
              },
              "deployments": {
                "type": "array",
                "definition": {
                  "type": "schemaReference",
                  "definition": {
                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    "relativePath": "deployment"
                  }
                }
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "defaultLabel": "Module Deployment Uuid",
                  "editable": false
                }
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "literal",
                "definition": "storeManagementAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "openStore"
              },
              "endpoint": {
                "type": "literal",
                "definition": "bbd08cbb-79ff-4539-b91f-7a14f15ac55f"
              },
              "configuration": {
                "type": "record",
                "definition": {
                  "type": "schemaReference",
                  "definition": {
                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    "relativePath": "storeUnitConfiguration"
                  }
                }
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "defaultLabel": "Module Deployment Uuid",
                  "editable": false
                }
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "literal",
                "definition": "storeManagementAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "closeStore"
              },
              "endpoint": {
                "type": "literal",
                "definition": "bbd08cbb-79ff-4539-b91f-7a14f15ac55f"
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "defaultLabel": "Module Deployment Uuid",
                  "editable": false
                }
              }
            }
          }
        ]
      },
      "persistenceAction": {
        "type": "union",
        "definition": [
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "literal",
                "definition": "RestPersistenceAction"
              },
              "actionName": {
                "type": "enum",
                "definition": [
                  "create",
                  "read",
                  "update",
                  "delete"
                ]
              },
              "endpoint": {
                "type": "literal",
                "definition": "a93598b3-19b6-42e8-828c-f02042d212d4"
              },
              "section": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "applicationSection"
                }
              },
              "deploymentUuid": {
                "type": "uuid",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                }
              },
              "parentName": {
                "type": "string",
                "optional": true,
                "extra": {
                  "id": 1,
                  "defaultLabel": "Parent Name",
                  "editable": false
                }
              },
              "parentUuid": {
                "type": "string",
                "optional": true,
                "validations": [
                  {
                    "type": "uuid"
                  }
                ],
                "extra": {
                  "id": 1,
                  "defaultLabel": "Parent Uuid",
                  "editable": false
                }
              },
              "uuid": {
                "type": "string",
                "optional": true,
                "validations": [
                  {
                    "type": "uuid"
                  }
                ],
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                }
              },
              "objects": {
                "type": "array",
                "optional": true,
                "definition": {
                  "type": "schemaReference",
                  "optional": true,
                  "definition": {
                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    "relativePath": "entityInstance"
                  }
                }
              }
            }
          },
          {
            "type": "schemaReference",
            "optional": false,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "queryAction"
            }
          },
          {
            "type": "schemaReference",
            "optional": false,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "bundleAction"
            }
          },
          {
            "type": "schemaReference",
            "optional": false,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "instanceAction"
            }
          },
          {
            "type": "schemaReference",
            "optional": false,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "modelAction"
            }
          },
          {
            "type": "schemaReference",
            "optional": false,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "storeManagementAction"
            }
          }
        ]
      },
      "restPersistenceAction": {
        "type": "object",
        "definition": {
          "actionType": {
            "type": "literal",
            "definition": "RestPersistenceAction"
          },
          "actionName": {
            "type": "enum",
            "definition": [
              "create",
              "read",
              "update",
              "delete"
            ]
          },
          "endpoint": {
            "type": "literal",
            "definition": "a93598b3-19b6-42e8-828c-f02042d212d4"
          },
          "section": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "applicationSection"
            }
          },
          "deploymentUuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Uuid",
              "editable": false
            }
          },
          "parentName": {
            "type": "string",
            "optional": true,
            "extra": {
              "id": 1,
              "defaultLabel": "Parent Name",
              "editable": false
            }
          },
          "parentUuid": {
            "type": "string",
            "optional": true,
            "validations": [
              {
                "type": "uuid"
              }
            ],
            "extra": {
              "id": 1,
              "defaultLabel": "Parent Uuid",
              "editable": false
            }
          },
          "uuid": {
            "type": "string",
            "optional": true,
            "validations": [
              {
                "type": "uuid"
              }
            ],
            "extra": {
              "id": 1,
              "defaultLabel": "Uuid",
              "editable": false
            }
          },
          "objects": {
            "type": "array",
            "optional": true,
            "definition": {
              "type": "schemaReference",
              "optional": true,
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "entityInstance"
              }
            }
          }
        }
      },
      "queryAction": {
        "type": "object",
        "definition": {
          "actionType": {
            "type": "literal",
            "definition": "queryAction"
          },
          "actionName": {
            "type": "literal",
            "definition": "runQuery"
          },
          "endpoint": {
            "type": "literal",
            "definition": "9e404b3c-368c-40cb-be8b-e3c28550c25e"
          },
          "deploymentUuid": {
            "type": "uuid",
            "extra": {
              "id": 1,
              "defaultLabel": "Uuid",
              "editable": false
            }
          },
          "query": {
            "type": "schemaReference",
            "optional": false,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "domainManyQueriesWithDeploymentUuid"
            }
          }
        }
      },
      "compositeAction": {
        "type": "object",
        "definition": {
          "actionType": {
            "type": "literal",
            "definition": "compositeAction"
          },
          "actionName": {
            "type": "literal",
            "definition": "sequence"
          },
          "deploymentUuid": {
            "type": "uuid",
            "optional": true,
            "extra": {
              "defaultLabel": "Module Deployment Uuid",
              "editable": false
            }
          },
          "definition": {
            "type": "array",
            "definition": {
              "type": "union",
              "discriminator": "compositeActionType",
              "definition": [
                {
                  "type": "object",
                  "definition": {
                    "compositeActionType": {
                      "type": "literal",
                      "definition": "action"
                    },
                    "action": {
                      "type": "schemaReference",
                      "definition": {
                        "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        "relativePath": "domainAction"
                      }
                    }
                  }
                },
                {
                  "type": "object",
                  "definition": {
                    "compositeActionType": {
                      "type": "literal",
                      "definition": "query"
                    },
                    "query": {
                      "type": "schemaReference",
                      "definition": {
                        "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        "relativePath": "queryAction"
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      },
      "domainAction": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "optional": false,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "undoRedoAction"
            }
          },
          {
            "type": "schemaReference",
            "optional": false,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "storeOrBundleAction"
            }
          },
          {
            "type": "schemaReference",
            "optional": false,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "modelAction"
            }
          },
          {
            "type": "schemaReference",
            "optional": false,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "instanceAction"
            }
          },
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "literal",
                "definition": "transactionalInstanceAction"
              },
              "deploymentUuid": {
                "type": "uuid",
                "optional": true,
                "extra": {
                  "defaultLabel": "Module Deployment Uuid",
                  "editable": false
                }
              },
              "instanceAction": {
                "type": "schemaReference",
                "optional": false,
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "instanceCUDAction"
                }
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "literal",
                "definition": "compositeAction"
              },
              "actionName": {
                "type": "literal",
                "definition": "sequence"
              },
              "deploymentUuid": {
                "type": "uuid",
                "optional": true,
                "extra": {
                  "defaultLabel": "Module Deployment Uuid",
                  "editable": false
                }
              },
              "definition": {
                "type": "array",
                "definition": {
                  "type": "union",
                  "discriminator": "compositeActionType",
                  "definition": [
                    {
                      "type": "object",
                      "definition": {
                        "compositeActionType": {
                          "type": "literal",
                          "definition": "action"
                        },
                        "action": {
                          "type": "schemaReference",
                          "definition": {
                            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                            "relativePath": "domainAction"
                          }
                        }
                      }
                    },
                    {
                      "type": "object",
                      "definition": {
                        "compositeActionType": {
                          "type": "literal",
                          "definition": "query"
                        },
                        "query": {
                          "type": "schemaReference",
                          "definition": {
                            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                            "relativePath": "queryAction"
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        ]
      },
      "objectTemplateInnerReference": {
        "type": "union",
        "discriminator": "templateType",
        "definition": [
          {
            "type": "object",
            "definition": {
              "templateType": {
                "type": "literal",
                "definition": "constant"
              },
              "referenceUuid": {
                "type": "string"
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "templateType": {
                "type": "literal",
                "definition": "contextReference"
              },
              "referenceName": {
                "type": "string"
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "templateType": {
                "type": "literal",
                "definition": "parameterReference"
              },
              "referenceName": {
                "type": "string"
              }
            }
          }
        ]
      },
      "objectTemplate": {
        "type": "union",
        "discriminator": "templateType",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "objectTemplateInnerReference"
            }
          },
          {
            "type": "object",
            "definition": {
              "templateType": {
                "type": "literal",
                "definition": "mustacheStringTemplate"
              },
              "definition": {
                "type": "string"
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "templateType": {
                "type": "literal",
                "definition": "fullObjectTemplate"
              },
              "definition": {
                "type": "array",
                "definition": {
                  "type": "tuple",
                  "definition": [
                    {
                      "type": "schemaReference",
                      "definition": {
                        "relativePath": "objectTemplateInnerReference"
                      }
                    },
                    {
                      "type": "schemaReference",
                      "definition": {
                        "relativePath": "objectTemplate"
                      }
                    }
                  ]
                }
              }
            }
          }
        ]
      },
      "actionHandler": {
        "type": "object",
        "definition": {
          "interface": {
            "type": "object",
            "definition": {
              "actionJzodObjectSchema": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "jzodObject"
                }
              }
            }
          },
          "implementation": {
            "type": "object",
            "definition": {
              "templates": {
                "type": "record",
                "optional": true,
                "definition": {
                  "type": "any"
                }
              },
              "compositeActionTemplate": {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "compositeActionTemplate"
                }
              }
            }
          }
        }
      },
      "modelActionReplayableAction": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "modelActionAlterEntityAttribute"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "modelActionCreateEntity"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "modelActionDropEntity"
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "modelActionRenameEntity"
            }
          }
        ]
      },
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
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                }
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
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                }
              }
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
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodBaseObject": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "optional": {
                "type": "union",
                "optional": true,
                "definition": [
                  {
                    "type": "boolean",
                    "optional": true
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "nullable": {
                "type": "union",
                "optional": true,
                "definition": [
                  {
                    "type": "boolean",
                    "optional": true
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "extra": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  },
                  {
                    "type": "object",
                    "definition": {
                      "id": {
                        "type": "union",
                        "optional": true,
                        "definition": [
                          {
                            "type": "number",
                            "optional": true
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      },
                      "defaultLabel": {
                        "type": "union",
                        "optional": true,
                        "definition": [
                          {
                            "type": "string",
                            "optional": true
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      },
                      "initializeTo": {
                        "type": "union",
                        "optional": true,
                        "definition": [
                          {
                            "type": "any",
                            "optional": true
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      },
                      "targetEntity": {
                        "type": "union",
                        "optional": true,
                        "definition": [
                          {
                            "type": "string",
                            "optional": true
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      },
                      "editable": {
                        "type": "union",
                        "optional": true,
                        "definition": [
                          {
                            "type": "boolean",
                            "optional": true
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      }
                    }
                  }
                ],
                "optional": true
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodArray": {
        "type": "union",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "type": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "array"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodPlainAttribute": {
        "type": "union",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "type": {
                "type": "union",
                "definition": [
                  {
                    "type": "enum",
                    "definition": [
                      "any",
                      "bigint",
                      "boolean",
                      "never",
                      "null",
                      "uuid",
                      "undefined",
                      "unknown",
                      "void"
                    ]
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "coerce": {
                "type": "union",
                "optional": true,
                "definition": [
                  {
                    "type": "boolean",
                    "optional": true
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeDateValidations": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "extra": {
                "type": "union",
                "definition": [
                  {
                    "type": "record",
                    "definition": {
                      "type": "any"
                    },
                    "optional": true
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ],
                "optional": true
              },
              "type": {
                "type": "union",
                "definition": [
                  {
                    "type": "enum",
                    "definition": [
                      "min",
                      "max"
                    ]
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parameter": {
                "type": "union",
                "definition": [
                  {
                    "type": "any"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainDateWithValidations": {
        "type": "union",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "type": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "date"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "coerce": {
                "type": "union",
                "optional": true,
                "definition": [
                  {
                    "type": "boolean",
                    "optional": true
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "validations": {
                "type": "union",
                "optional": true,
                "definition": [
                  {
                    "type": "array",
                    "optional": true,
                    "definition": {
                      "type": "union",
                      "definition": [
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeDateValidations"
                          },
                          "context": {}
                        },
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOnObject"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeNumberValidations": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "extra": {
                "type": "union",
                "definition": [
                  {
                    "type": "record",
                    "definition": {
                      "type": "any"
                    },
                    "optional": true
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ],
                "optional": true
              },
              "type": {
                "type": "union",
                "definition": [
                  {
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
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parameter": {
                "type": "union",
                "definition": [
                  {
                    "type": "any"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainNumberWithValidations": {
        "type": "union",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "type": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "number"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "coerce": {
                "type": "union",
                "optional": true,
                "definition": [
                  {
                    "type": "boolean",
                    "optional": true
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "validations": {
                "type": "union",
                "optional": true,
                "definition": [
                  {
                    "type": "array",
                    "optional": true,
                    "definition": {
                      "type": "union",
                      "definition": [
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeNumberValidations"
                          },
                          "context": {}
                        },
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOnObject"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeStringValidations": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "extra": {
                "type": "union",
                "definition": [
                  {
                    "type": "record",
                    "definition": {
                      "type": "any"
                    },
                    "optional": true
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ],
                "optional": true
              },
              "type": {
                "type": "union",
                "definition": [
                  {
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
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parameter": {
                "type": "union",
                "definition": [
                  {
                    "type": "any"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainStringWithValidations": {
        "type": "union",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "type": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "string"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "coerce": {
                "type": "union",
                "optional": true,
                "definition": [
                  {
                    "type": "boolean",
                    "optional": true
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "validations": {
                "type": "union",
                "optional": true,
                "definition": [
                  {
                    "type": "array",
                    "optional": true,
                    "definition": {
                      "type": "union",
                      "definition": [
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeStringValidations"
                          },
                          "context": {}
                        },
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOnObject"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement": {
        "type": "union",
        "discriminator": "type",
        "extra": {
          "initializeTo": {
            "type": "string"
          }
        },
        "definition": [
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodArray"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodPlainAttribute"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainDateWithValidations"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainNumberWithValidations"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainStringWithValidations"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnum"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodFunction"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodLazy"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodLiteral"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodIntersection"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodMap"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodPromise"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodRecord"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodReference"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodSet"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodTuple"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodUnion"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnum": {
        "type": "union",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "type": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "enum"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "type": "union",
                "definition": [
                  {
                    "type": "array",
                    "definition": {
                      "type": "union",
                      "definition": [
                        {
                          "type": "string"
                        },
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOnObject"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnumAttributeTypes": {
        "type": "union",
        "definition": [
          {
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
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnumElementTypes": {
        "type": "union",
        "definition": [
          {
            "type": "enum",
            "definition": [
              "array",
              "date",
              "enum",
              "function",
              "lazy",
              "literal",
              "intersection",
              "map",
              "number",
              "object",
              "promise",
              "record",
              "schemaReference",
              "set",
              "string",
              "tuple",
              "union"
            ]
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodFunction": {
        "type": "union",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "type": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "function"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  },
                  {
                    "type": "object",
                    "definition": {
                      "args": {
                        "type": "union",
                        "definition": [
                          {
                            "type": "array",
                            "definition": {
                              "type": "union",
                              "definition": [
                                {
                                  "type": "schemaReference",
                                  "definition": {
                                    "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement"
                                  },
                                  "context": {}
                                },
                                {
                                  "type": "schemaReference",
                                  "definition": {
                                    "relativePath": "carryOnObject"
                                  }
                                }
                              ]
                            }
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      },
                      "returns": {
                        "optional": true,
                        "type": "union",
                        "definition": [
                          {
                            "type": "schemaReference",
                            "definition": {
                              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                              "relativePath": "jzodElement"
                            },
                            "optional": true,
                            "context": {}
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      }
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodLazy": {
        "type": "union",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "type": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "lazy"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodFunction"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodLiteral": {
        "type": "union",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "type": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "literal"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "type": "union",
                "definition": [
                  {
                    "type": "union",
                    "definition": [
                      {
                        "type": "string"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  {
                    "type": "union",
                    "definition": [
                      {
                        "type": "number"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  {
                    "type": "union",
                    "definition": [
                      {
                        "type": "bigint"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  {
                    "type": "union",
                    "definition": [
                      {
                        "type": "boolean"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodIntersection": {
        "type": "union",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "type": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "intersection"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  },
                  {
                    "type": "object",
                    "definition": {
                      "left": {
                        "type": "union",
                        "definition": [
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement"
                            },
                            "context": {}
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      },
                      "right": {
                        "type": "union",
                        "definition": [
                          {
                            "type": "schemaReference",
                            "definition": {
                              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                              "relativePath": "jzodElement"
                            },
                            "context": {}
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      }
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodMap": {
        "type": "union",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "type": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "map"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "type": "union",
                "definition": [
                  {
                    "type": "union",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement"
                        },
                        "context": {}
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  {
                    "type": "union",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "definition": {
                          "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                          "relativePath": "jzodElement"
                        },
                        "context": {}
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject": {
        "type": "union",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "extend": {
                "optional": true,
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodReference"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "type": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "object"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "nonStrict": {
                "type": "union",
                "optional": true,
                "definition": [
                  {
                    "type": "boolean",
                    "optional": true
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "partial": {
                "type": "union",
                "optional": true,
                "definition": [
                  {
                    "type": "boolean",
                    "optional": true
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "carryOn": {
                "type": "union",
                "optional": true,
                "definition": [
                  {
                    "type": "union",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject"
                        },
                        "context": {}
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  {
                    "type": "union",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodUnion"
                        },
                        "context": {}
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "type": "union",
                "definition": [
                  {
                    "type": "record",
                    "definition": {
                      "type": "schemaReference",
                      "definition": {
                        "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        "relativePath": "jzodElement"
                      },
                      "context": {}
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodPromise": {
        "type": "union",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "type": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "promise"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodRecord": {
        "type": "union",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "type": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "record"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodReference": {
        "type": "union",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "type": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "schemaReference"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "context": {
                "type": "union",
                "optional": true,
                "definition": [
                  {
                    "type": "record",
                    "optional": true,
                    "definition": {
                      "type": "schemaReference",
                      "definition": {
                        "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        "relativePath": "jzodElement"
                      },
                      "context": {}
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "carryOn": {
                "type": "union",
                "optional": true,
                "definition": [
                  {
                    "type": "union",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject"
                        },
                        "context": {}
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  {
                    "type": "union",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodUnion"
                        },
                        "context": {}
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  },
                  {
                    "type": "object",
                    "definition": {
                      "eager": {
                        "type": "union",
                        "optional": true,
                        "definition": [
                          {
                            "type": "boolean",
                            "optional": true
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      },
                      "partial": {
                        "type": "union",
                        "optional": true,
                        "definition": [
                          {
                            "type": "boolean",
                            "optional": true
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      },
                      "relativePath": {
                        "type": "union",
                        "optional": true,
                        "definition": [
                          {
                            "type": "string",
                            "optional": true
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      },
                      "absolutePath": {
                        "type": "union",
                        "optional": true,
                        "definition": [
                          {
                            "type": "string",
                            "optional": true
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      }
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodSet": {
        "type": "union",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "type": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "set"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodTuple": {
        "type": "union",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "type": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "tuple"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "type": "union",
                "definition": [
                  {
                    "type": "array",
                    "definition": {
                      "type": "union",
                      "definition": [
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement"
                          },
                          "context": {}
                        },
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOnObject"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodUnion": {
        "type": "union",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "jzodBaseObject"
          },
          "context": {}
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "type": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "union"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "discriminator": {
                "type": "union",
                "optional": true,
                "definition": [
                  {
                    "type": "string",
                    "optional": true
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "discriminatorNew": {
                "type": "union",
                "optional": true,
                "definition": [
                  {
                    "type": "union",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      },
                      {
                        "type": "object",
                        "definition": {
                          "discriminatorType": {
                            "type": "union",
                            "definition": [
                              {
                                "type": "literal",
                                "definition": "string"
                              },
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOnObject"
                                }
                              }
                            ]
                          },
                          "value": {
                            "type": "union",
                            "definition": [
                              {
                                "type": "string"
                              },
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOnObject"
                                }
                              }
                            ]
                          }
                        }
                      }
                    ]
                  },
                  {
                    "type": "union",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      },
                      {
                        "type": "object",
                        "definition": {
                          "discriminatorType": {
                            "type": "union",
                            "definition": [
                              {
                                "type": "literal",
                                "definition": "array"
                              },
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOnObject"
                                }
                              }
                            ]
                          },
                          "value": {
                            "type": "union",
                            "definition": [
                              {
                                "type": "array",
                                "definition": {
                                  "type": "union",
                                  "definition": [
                                    {
                                      "type": "string"
                                    },
                                    {
                                      "type": "schemaReference",
                                      "definition": {
                                        "relativePath": "carryOnObject"
                                      }
                                    }
                                  ]
                                }
                              },
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOnObject"
                                }
                              }
                            ]
                          }
                        }
                      }
                    ]
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "carryOn": {
                "optional": true,
                "type": "union",
                "definition": [
                  {
                    "optional": true,
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "type": "union",
                "definition": [
                  {
                    "type": "array",
                    "definition": {
                      "type": "union",
                      "definition": [
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement"
                          },
                          "context": {}
                        },
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOnObject"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_dataStoreType": {
        "type": "union",
        "definition": [
          {
            "type": "enum",
            "definition": [
              "miroir",
              "app"
            ]
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_application": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "uuid": {
                "type": "union",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentName": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 2,
                  "defaultLabel": "Entity Name",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "string",
                    "optional": true,
                    "extra": {
                      "id": 2,
                      "defaultLabel": "Entity Name",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentUuid": {
                "type": "union",
                "extra": {
                  "id": 3,
                  "defaultLabel": "Entity Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 3,
                      "defaultLabel": "Entity Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentDefinitionVersionUuid": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 4,
                  "defaultLabel": "Entity Definition Version Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "optional": true,
                    "extra": {
                      "id": 4,
                      "defaultLabel": "Entity Definition Version Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "name": {
                "type": "union",
                "extra": {
                  "id": 5,
                  "defaultLabel": "Name",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "string",
                    "extra": {
                      "id": 5,
                      "defaultLabel": "Name",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "defaultLabel": {
                "type": "union",
                "extra": {
                  "id": 6,
                  "defaultLabel": "Default Label",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "string",
                    "extra": {
                      "id": 6,
                      "defaultLabel": "Default Label",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "description": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 7,
                  "defaultLabel": "Description",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "string",
                    "optional": true,
                    "extra": {
                      "id": 7,
                      "defaultLabel": "Description",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "selfApplication": {
                "type": "union",
                "extra": {
                  "id": 8,
                  "defaultLabel": "Self Application",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 8,
                      "defaultLabel": "Self Application",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationVersion": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "uuid": {
                "type": "union",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentName": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 2,
                  "defaultLabel": "Entity Name",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "string",
                    "optional": true,
                    "extra": {
                      "id": 2,
                      "defaultLabel": "Entity Name",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentUuid": {
                "type": "union",
                "extra": {
                  "id": 3,
                  "defaultLabel": "Entity Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 3,
                      "defaultLabel": "Entity Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentDefinitionVersionUuid": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 4,
                  "defaultLabel": "Entity Definition Version Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "optional": true,
                    "extra": {
                      "id": 4,
                      "defaultLabel": "Entity Definition Version Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "name": {
                "type": "union",
                "extra": {
                  "id": 5,
                  "defaultLabel": "Name",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "string",
                    "extra": {
                      "id": 5,
                      "defaultLabel": "Name",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "defaultLabel": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 6,
                  "defaultLabel": "Default Label",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "string",
                    "optional": true,
                    "extra": {
                      "id": 6,
                      "defaultLabel": "Default Label",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "description": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 7,
                  "defaultLabel": "Description",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "string",
                    "optional": true,
                    "extra": {
                      "id": 7,
                      "defaultLabel": "Description",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "type": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 8,
                  "defaultLabel": "Type of Report",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "string",
                    "optional": true,
                    "extra": {
                      "id": 8,
                      "defaultLabel": "Type of Report",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "application": {
                "type": "union",
                "extra": {
                  "id": 9,
                  "defaultLabel": "Application",
                  "targetEntity": "a659d350-dd97-4da9-91de-524fa01745dc",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 9,
                      "defaultLabel": "Application",
                      "targetEntity": "a659d350-dd97-4da9-91de-524fa01745dc",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "branch": {
                "type": "union",
                "extra": {
                  "id": 10,
                  "defaultLabel": "Branch",
                  "description": "The Branch of this Application Version",
                  "targetEntity": "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 10,
                      "defaultLabel": "Branch",
                      "description": "The Branch of this Application Version",
                      "targetEntity": "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "previousVersion": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 11,
                  "defaultLabel": "Previous Application Version",
                  "description": "Previous version of the application on this Branch.",
                  "targetEntity": "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "optional": true,
                    "extra": {
                      "id": 11,
                      "defaultLabel": "Previous Application Version",
                      "description": "Previous version of the application on this Branch.",
                      "targetEntity": "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "modelStructureMigration": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 12,
                  "defaultLabel": "Structure Migration from Previous Version",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "array",
                    "optional": true,
                    "extra": {
                      "id": 12,
                      "defaultLabel": "Structure Migration from Previous Version",
                      "editable": true
                    },
                    "definition": {
                      "type": "union",
                      "definition": [
                        {
                          "type": "record",
                          "definition": {
                            "type": "any"
                          }
                        },
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOnObject"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "modelCUDMigration": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 13,
                  "defaultLabel": "Create-Update-Delete Migration from Previous Version",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "array",
                    "optional": true,
                    "extra": {
                      "id": 13,
                      "defaultLabel": "Create-Update-Delete Migration from Previous Version",
                      "editable": true
                    },
                    "definition": {
                      "type": "union",
                      "definition": [
                        {
                          "type": "record",
                          "definition": {
                            "type": "any"
                          }
                        },
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOnObject"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menu": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "uuid": {
                "type": "union",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentName": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 2,
                  "defaultLabel": "Entity Name",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "string",
                    "optional": true,
                    "extra": {
                      "id": 2,
                      "defaultLabel": "Entity Name",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentUuid": {
                "type": "union",
                "extra": {
                  "id": 3,
                  "defaultLabel": "Entity Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 3,
                      "defaultLabel": "Entity Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentDefinitionVersionUuid": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 4,
                  "defaultLabel": "Entity Definition Version Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "optional": true,
                    "extra": {
                      "id": 4,
                      "defaultLabel": "Entity Definition Version Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "name": {
                "type": "union",
                "extra": {
                  "id": 5,
                  "defaultLabel": "Name",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "string",
                    "extra": {
                      "id": 5,
                      "defaultLabel": "Name",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "defaultLabel": {
                "type": "union",
                "extra": {
                  "id": 6,
                  "defaultLabel": "Default Label",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "string",
                    "extra": {
                      "id": 6,
                      "defaultLabel": "Default Label",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "description": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 7,
                  "defaultLabel": "Description",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "string",
                    "optional": true,
                    "extra": {
                      "id": 7,
                      "defaultLabel": "Description",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "context": {
                      "miroirMenuItem": {
                        "type": "union",
                        "definition": [
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          },
                          {
                            "type": "object",
                            "definition": {
                              "label": {
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "string"
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              },
                              "section": {
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection"
                                    },
                                    "context": {}
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              },
                              "application": {
                                "type": "union",
                                "validations": [
                                  {
                                    "type": "uuid"
                                  }
                                ],
                                "extra": {
                                  "id": 1,
                                  "defaultLabel": "Application",
                                  "editable": false
                                },
                                "definition": [
                                  {
                                    "type": "string",
                                    "validations": [
                                      {
                                        "type": "uuid"
                                      }
                                    ],
                                    "extra": {
                                      "id": 1,
                                      "defaultLabel": "Application",
                                      "editable": false
                                    }
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              },
                              "reportUuid": {
                                "type": "union",
                                "validations": [
                                  {
                                    "type": "uuid"
                                  }
                                ],
                                "extra": {
                                  "id": 1,
                                  "defaultLabel": "Report",
                                  "editable": false
                                },
                                "definition": [
                                  {
                                    "type": "string",
                                    "validations": [
                                      {
                                        "type": "uuid"
                                      }
                                    ],
                                    "extra": {
                                      "id": 1,
                                      "defaultLabel": "Report",
                                      "editable": false
                                    }
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              },
                              "instanceUuid": {
                                "type": "union",
                                "optional": true,
                                "validations": [
                                  {
                                    "type": "uuid"
                                  }
                                ],
                                "extra": {
                                  "id": 1,
                                  "defaultLabel": "Instance",
                                  "editable": false
                                },
                                "definition": [
                                  {
                                    "type": "string",
                                    "optional": true,
                                    "validations": [
                                      {
                                        "type": "uuid"
                                      }
                                    ],
                                    "extra": {
                                      "id": 1,
                                      "defaultLabel": "Instance",
                                      "editable": false
                                    }
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              },
                              "icon": {
                                "type": "union",
                                "validations": [
                                  {
                                    "type": "uuid"
                                  }
                                ],
                                "definition": [
                                  {
                                    "type": "string",
                                    "validations": [
                                      {
                                        "type": "uuid"
                                      }
                                    ]
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              }
                            }
                          }
                        ]
                      },
                      "menuItemArray": {
                        "type": "union",
                        "definition": [
                          {
                            "type": "array",
                            "definition": {
                              "type": "union",
                              "definition": [
                                {
                                  "type": "schemaReference",
                                  "definition": {
                                    "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirMenuItem"
                                  },
                                  "context": {}
                                },
                                {
                                  "type": "schemaReference",
                                  "definition": {
                                    "relativePath": "carryOnObject"
                                  }
                                }
                              ]
                            }
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      },
                      "sectionOfMenu": {
                        "type": "union",
                        "definition": [
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          },
                          {
                            "type": "object",
                            "definition": {
                              "title": {
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "string"
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              },
                              "label": {
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "string"
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              },
                              "items": {
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuItemArray"
                                    },
                                    "context": {}
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              }
                            }
                          }
                        ]
                      },
                      "simpleMenu": {
                        "type": "union",
                        "definition": [
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          },
                          {
                            "type": "object",
                            "definition": {
                              "menuType": {
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "literal",
                                    "definition": "simpleMenu"
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              },
                              "definition": {
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "menuItemArray",
                                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
                                    },
                                    "context": {}
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              }
                            }
                          }
                        ]
                      },
                      "complexMenu": {
                        "type": "union",
                        "definition": [
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          },
                          {
                            "type": "object",
                            "definition": {
                              "menuType": {
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "literal",
                                    "definition": "complexMenu"
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              },
                              "definition": {
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "array",
                                    "definition": {
                                      "type": "union",
                                      "definition": [
                                        {
                                          "type": "schemaReference",
                                          "definition": {
                                            "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_sectionOfMenu"
                                          },
                                          "context": {}
                                        },
                                        {
                                          "type": "schemaReference",
                                          "definition": {
                                            "relativePath": "carryOnObject"
                                          }
                                        }
                                      ]
                                    }
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              }
                            }
                          }
                        ]
                      },
                      "menuDefinition": {
                        "type": "union",
                        "discriminator": "menuType",
                        "definition": [
                          {
                            "type": "union",
                            "definition": [
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_simpleMenu"
                                },
                                "context": {}
                              },
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOnObject"
                                }
                              }
                            ]
                          },
                          {
                            "type": "union",
                            "definition": [
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_complexMenu"
                                },
                                "context": {}
                              },
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOnObject"
                                }
                              }
                            ]
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      }
                    },
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuDefinition"
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuDefinition": {
        "type": "union",
        "discriminator": "menuType",
        "definition": [
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_simpleMenu"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_complexMenu"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entity": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "uuid": {
                "type": "union",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentName": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 2,
                  "defaultLabel": "Entity Name",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "string",
                    "optional": true,
                    "extra": {
                      "id": 2,
                      "defaultLabel": "Entity Name",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentUuid": {
                "type": "union",
                "extra": {
                  "id": 3,
                  "defaultLabel": "Entity Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 3,
                      "defaultLabel": "Entity Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentDefinitionVersionUuid": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 4,
                  "defaultLabel": "Entity Definition Version Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "optional": true,
                    "extra": {
                      "id": 4,
                      "defaultLabel": "Entity Definition Version Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "conceptLevel": {
                "type": "union",
                "definition": [
                  {
                    "type": "enum",
                    "definition": [
                      "MetaModel",
                      "Model",
                      "Data"
                    ],
                    "optional": true,
                    "extra": {
                      "id": 5,
                      "defaultLabel": "Concept Level",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ],
                "optional": true,
                "extra": {
                  "id": 5,
                  "defaultLabel": "Concept Level",
                  "editable": false
                }
              },
              "application": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 6,
                  "defaultLabel": "Application",
                  "targetEntity": "a659d350-dd97-4da9-91de-524fa01745dc",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "optional": true,
                    "extra": {
                      "id": 6,
                      "defaultLabel": "Application",
                      "targetEntity": "a659d350-dd97-4da9-91de-524fa01745dc",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "name": {
                "type": "union",
                "extra": {
                  "id": 7,
                  "defaultLabel": "Name",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "string",
                    "extra": {
                      "id": 7,
                      "defaultLabel": "Name",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "author": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 8,
                  "defaultLabel": "Application",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "uuid",
                    "optional": true,
                    "extra": {
                      "id": 8,
                      "defaultLabel": "Application",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "description": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 9,
                  "defaultLabel": "Description",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "string",
                    "optional": true,
                    "extra": {
                      "id": 9,
                      "defaultLabel": "Description",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityDefinition": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "uuid": {
                "type": "union",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentName": {
                "type": "union",
                "extra": {
                  "id": 2,
                  "defaultLabel": "Entity Name",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "string",
                    "extra": {
                      "id": 2,
                      "defaultLabel": "Entity Name",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentUuid": {
                "type": "union",
                "extra": {
                  "id": 3,
                  "defaultLabel": "Entity Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 3,
                      "defaultLabel": "Entity Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentDefinitionVersionUuid": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 4,
                  "defaultLabel": "Entity Definition Version Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "optional": true,
                    "extra": {
                      "id": 4,
                      "defaultLabel": "Entity Definition Version Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "name": {
                "type": "union",
                "extra": {
                  "id": 5,
                  "defaultLabel": "Name",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "string",
                    "extra": {
                      "id": 5,
                      "defaultLabel": "Name",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "entityUuid": {
                "type": "union",
                "extra": {
                  "id": 6,
                  "defaultLabel": "Entity Uuid of the Entity which this definition is the definition",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 6,
                      "defaultLabel": "Entity Uuid of the Entity which this definition is the definition",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "conceptLevel": {
                "type": "union",
                "definition": [
                  {
                    "type": "enum",
                    "definition": [
                      "MetaModel",
                      "Model",
                      "Data"
                    ],
                    "optional": true,
                    "extra": {
                      "id": 7,
                      "defaultLabel": "Concept Level",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ],
                "optional": true,
                "extra": {
                  "id": 7,
                  "defaultLabel": "Concept Level",
                  "editable": false
                }
              },
              "description": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 8,
                  "defaultLabel": "Description",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "string",
                    "optional": true,
                    "extra": {
                      "id": 8,
                      "defaultLabel": "Description",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "defaultInstanceDetailsReportUuid": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 9,
                  "defaultLabel": "Default Report used to display instances of this Entity",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "optional": true,
                    "extra": {
                      "id": 9,
                      "defaultLabel": "Default Report used to display instances of this Entity",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "viewAttributes": {
                "type": "union",
                "optional": true,
                "definition": [
                  {
                    "type": "array",
                    "optional": true,
                    "definition": {
                      "type": "union",
                      "definition": [
                        {
                          "type": "string"
                        },
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOnObject"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "jzodSchema": {
                "extra": {
                  "id": 11,
                  "defaultLabel": "Jzod Schema",
                  "editable": true
                },
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject"
                    },
                    "extra": {
                      "id": 11,
                      "defaultLabel": "Jzod Schema",
                      "editable": true
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection": {
        "type": "union",
        "definition": [
          {
            "type": "union",
            "definition": [
              {
                "type": "literal",
                "definition": "model"
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "literal",
                "definition": "data"
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance": {
        "type": "union",
        "nonStrict": true,
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "uuid": {
                "type": "union",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentName": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 2,
                  "defaultLabel": "Entity Name",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "string",
                    "optional": true,
                    "extra": {
                      "id": 2,
                      "defaultLabel": "Entity Name",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentUuid": {
                "type": "union",
                "extra": {
                  "id": 3,
                  "defaultLabel": "Entity Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 3,
                      "defaultLabel": "Entity Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "conceptLevel": {
                "type": "union",
                "definition": [
                  {
                    "type": "enum",
                    "definition": [
                      "MetaModel",
                      "Model",
                      "Data"
                    ],
                    "optional": true,
                    "extra": {
                      "id": 4,
                      "defaultLabel": "Concept Level",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ],
                "optional": true,
                "extra": {
                  "id": 4,
                  "defaultLabel": "Concept Level",
                  "editable": false
                }
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_deployment": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "uuid": {
                "type": "union",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentName": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 2,
                  "defaultLabel": "Entity Name",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "string",
                    "optional": true,
                    "extra": {
                      "id": 2,
                      "defaultLabel": "Entity Name",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentUuid": {
                "type": "union",
                "extra": {
                  "id": 3,
                  "defaultLabel": "Entity Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 3,
                      "defaultLabel": "Entity Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentDefinitionVersionUuid": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 4,
                  "defaultLabel": "Entity Definition Version Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "optional": true,
                    "extra": {
                      "id": 4,
                      "defaultLabel": "Entity Definition Version Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "name": {
                "type": "union",
                "extra": {
                  "id": 5,
                  "defaultLabel": "Name",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "string",
                    "extra": {
                      "id": 5,
                      "defaultLabel": "Name",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "defaultLabel": {
                "type": "union",
                "extra": {
                  "id": 6,
                  "defaultLabel": "Default Label",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "string",
                    "extra": {
                      "id": 6,
                      "defaultLabel": "Default Label",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "description": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 7,
                  "defaultLabel": "Description",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "string",
                    "optional": true,
                    "extra": {
                      "id": 7,
                      "defaultLabel": "Description",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "application": {
                "type": "union",
                "extra": {
                  "id": 8,
                  "defaultLabel": "Application",
                  "description": "The Application of the Branch.",
                  "targetEntity": "25d935e7-9e93-42c2-aade-0472b883492b",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 8,
                      "defaultLabel": "Application",
                      "description": "The Application of the Branch.",
                      "targetEntity": "25d935e7-9e93-42c2-aade-0472b883492b",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "bundle": {
                "type": "union",
                "extra": {
                  "id": 8,
                  "defaultLabel": "Bundle",
                  "description": "The deployed bundle.",
                  "targetEntity": "",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 8,
                      "defaultLabel": "Bundle",
                      "description": "The deployed bundle.",
                      "targetEntity": "",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "configuration": {
                "optional": true,
                "extra": {
                  "id": 9,
                  "defaultLabel": "Deployment Configuration",
                  "editable": true
                },
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "optional": true,
                    "extra": {
                      "id": 9,
                      "defaultLabel": "Deployment Configuration",
                      "editable": true
                    },
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "model": {
                "optional": true,
                "extra": {
                  "id": 9,
                  "defaultLabel": "Application Deployment Model",
                  "editable": true
                },
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "optional": true,
                    "extra": {
                      "id": 9,
                      "defaultLabel": "Application Deployment Model",
                      "editable": true
                    },
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "data": {
                "optional": true,
                "extra": {
                  "id": 10,
                  "defaultLabel": "Application Deployment Data",
                  "editable": true
                },
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "optional": true,
                    "extra": {
                      "id": 10,
                      "defaultLabel": "Application Deployment Data",
                      "editable": true
                    },
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "jzodObject"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "parentName": {
                "type": "union",
                "optional": true,
                "definition": [
                  {
                    "type": "string",
                    "optional": true
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentUuid": {
                "type": "union",
                "definition": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "applicationSection": {
                "optional": false,
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "optional": false,
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "instances": {
                "type": "union",
                "definition": [
                  {
                    "type": "array",
                    "definition": {
                      "type": "union",
                      "definition": [
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance"
                          },
                          "context": {}
                        },
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOnObject"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodSchema": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "uuid": {
                "type": "union",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentName": {
                "type": "union",
                "extra": {
                  "id": 2,
                  "defaultLabel": "Entity Name",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "string",
                    "extra": {
                      "id": 2,
                      "defaultLabel": "Entity Name",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentUuid": {
                "type": "union",
                "extra": {
                  "id": 3,
                  "defaultLabel": "Entity Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 3,
                      "defaultLabel": "Entity Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentDefinitionVersionUuid": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 4,
                  "defaultLabel": "Entity Definition Version Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "optional": true,
                    "extra": {
                      "id": 4,
                      "defaultLabel": "Entity Definition Version Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "name": {
                "type": "union",
                "extra": {
                  "id": 5,
                  "defaultLabel": "Name",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "string",
                    "extra": {
                      "id": 5,
                      "defaultLabel": "Name",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "conceptLevel": {
                "type": "union",
                "definition": [
                  {
                    "type": "enum",
                    "definition": [
                      "MetaModel",
                      "Model",
                      "Data"
                    ],
                    "optional": true,
                    "extra": {
                      "id": 6,
                      "defaultLabel": "Concept Level",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ],
                "optional": true,
                "extra": {
                  "id": 6,
                  "defaultLabel": "Concept Level",
                  "editable": false
                }
              },
              "defaultLabel": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 7,
                  "defaultLabel": "Default Label",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "string",
                    "optional": true,
                    "extra": {
                      "id": 7,
                      "defaultLabel": "Default Label",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "description": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 8,
                  "defaultLabel": "Description",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "string",
                    "optional": true,
                    "extra": {
                      "id": 8,
                      "defaultLabel": "Description",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "optional": true,
                "extra": {
                  "id": 9,
                  "defaultLabel": "Definition",
                  "editable": true
                },
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "context": {
                      "jzodObjectOrReference": {
                        "type": "union",
                        "definition": [
                          {
                            "type": "union",
                            "definition": [
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodReference"
                                },
                                "context": {}
                              },
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOnObject"
                                }
                              }
                            ]
                          },
                          {
                            "type": "union",
                            "definition": [
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject"
                                },
                                "context": {}
                              },
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOnObject"
                                }
                              }
                            ]
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      }
                    },
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObjectOrReference"
                    },
                    "optional": true,
                    "extra": {
                      "id": 9,
                      "defaultLabel": "Definition",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirMenuItem": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "label": {
                "type": "union",
                "definition": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "section": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "application": {
                "type": "union",
                "validations": [
                  {
                    "type": "uuid"
                  }
                ],
                "extra": {
                  "id": 1,
                  "defaultLabel": "Application",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "string",
                    "validations": [
                      {
                        "type": "uuid"
                      }
                    ],
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Application",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "reportUuid": {
                "type": "union",
                "validations": [
                  {
                    "type": "uuid"
                  }
                ],
                "extra": {
                  "id": 1,
                  "defaultLabel": "Report",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "string",
                    "validations": [
                      {
                        "type": "uuid"
                      }
                    ],
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Report",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "instanceUuid": {
                "type": "union",
                "optional": true,
                "validations": [
                  {
                    "type": "uuid"
                  }
                ],
                "extra": {
                  "id": 1,
                  "defaultLabel": "Instance",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "string",
                    "optional": true,
                    "validations": [
                      {
                        "type": "uuid"
                      }
                    ],
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Instance",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "icon": {
                "type": "union",
                "validations": [
                  {
                    "type": "uuid"
                  }
                ],
                "definition": [
                  {
                    "type": "string",
                    "validations": [
                      {
                        "type": "uuid"
                      }
                    ]
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuItemArray": {
        "type": "union",
        "definition": [
          {
            "type": "array",
            "definition": {
              "type": "union",
              "definition": [
                {
                  "type": "schemaReference",
                  "definition": {
                    "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirMenuItem"
                  },
                  "context": {}
                },
                {
                  "type": "schemaReference",
                  "definition": {
                    "relativePath": "carryOnObject"
                  }
                }
              ]
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_sectionOfMenu": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "title": {
                "type": "union",
                "definition": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "label": {
                "type": "union",
                "definition": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "items": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuItemArray"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_simpleMenu": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "menuType": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "simpleMenu"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuItemArray"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_complexMenu": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "menuType": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "complexMenu"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "type": "union",
                "definition": [
                  {
                    "type": "array",
                    "definition": {
                      "type": "union",
                      "definition": [
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_sectionOfMenu"
                          },
                          "context": {}
                        },
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOnObject"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObjectOrReference": {
        "type": "union",
        "definition": [
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodReference"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectInstanceReportSection": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "type": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "objectInstanceReportSection"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "fetchQuery": {
                "optional": true,
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirFetchQuery"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  },
                  {
                    "type": "object",
                    "definition": {
                      "label": {
                        "type": "union",
                        "optional": true,
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Label",
                          "editable": false
                        },
                        "definition": [
                          {
                            "type": "string",
                            "optional": true,
                            "extra": {
                              "id": 1,
                              "defaultLabel": "Label",
                              "editable": false
                            }
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      },
                      "parentUuid": {
                        "type": "union",
                        "validations": [
                          {
                            "type": "uuid"
                          }
                        ],
                        "extra": {
                          "id": 2,
                          "defaultLabel": "Entity Uuid",
                          "editable": false
                        },
                        "definition": [
                          {
                            "type": "string",
                            "validations": [
                              {
                                "type": "uuid"
                              }
                            ],
                            "extra": {
                              "id": 2,
                              "defaultLabel": "Entity Uuid",
                              "editable": false
                            }
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      },
                      "fetchedDataReference": {
                        "type": "union",
                        "optional": true,
                        "extra": {
                          "id": 3,
                          "defaultLabel": "Fetched Data Reference",
                          "editable": false
                        },
                        "definition": [
                          {
                            "type": "string",
                            "optional": true,
                            "extra": {
                              "id": 3,
                              "defaultLabel": "Fetched Data Reference",
                              "editable": false
                            }
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      },
                      "query": {
                        "optional": true,
                        "type": "union",
                        "definition": [
                          {
                            "type": "schemaReference",
                            "optional": true,
                            "definition": {
                              "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selectObjectQuery"
                            },
                            "context": {}
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      }
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectListReportSection": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "type": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "objectListReportSection"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  },
                  {
                    "type": "object",
                    "definition": {
                      "label": {
                        "type": "union",
                        "optional": true,
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Label",
                          "editable": false
                        },
                        "definition": [
                          {
                            "type": "string",
                            "optional": true,
                            "extra": {
                              "id": 1,
                              "defaultLabel": "Label",
                              "editable": false
                            }
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      },
                      "parentName": {
                        "type": "union",
                        "optional": true,
                        "extra": {
                          "id": 2,
                          "defaultLabel": "Entity Name",
                          "editable": false
                        },
                        "definition": [
                          {
                            "type": "string",
                            "optional": true,
                            "extra": {
                              "id": 2,
                              "defaultLabel": "Entity Name",
                              "editable": false
                            }
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      },
                      "parentUuid": {
                        "type": "union",
                        "extra": {
                          "id": 2,
                          "defaultLabel": "Entity Uuid",
                          "targetEntity": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                          "editable": false
                        },
                        "definition": [
                          {
                            "type": "uuid",
                            "extra": {
                              "id": 2,
                              "defaultLabel": "Entity Uuid",
                              "targetEntity": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                              "editable": false
                            }
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      },
                      "fetchedDataReference": {
                        "type": "union",
                        "optional": true,
                        "extra": {
                          "id": 3,
                          "defaultLabel": "Fetched Data Reference",
                          "editable": false
                        },
                        "definition": [
                          {
                            "type": "string",
                            "optional": true,
                            "extra": {
                              "id": 3,
                              "defaultLabel": "Fetched Data Reference",
                              "editable": false
                            }
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      },
                      "query": {
                        "optional": true,
                        "type": "union",
                        "definition": [
                          {
                            "type": "schemaReference",
                            "optional": true,
                            "definition": {
                              "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selectObjectQuery"
                            },
                            "context": {}
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      },
                      "sortByAttribute": {
                        "type": "union",
                        "optional": true,
                        "definition": [
                          {
                            "type": "string",
                            "optional": true
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      }
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_gridReportSection": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "type": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "grid"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "fetchQuery": {
                "optional": true,
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirFetchQuery"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "selectData": {
                "optional": true,
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirSelectQueriesRecord"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "combineData": {
                "optional": true,
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirCrossJoinQuery"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "type": "union",
                "definition": [
                  {
                    "type": "array",
                    "definition": {
                      "type": "union",
                      "definition": [
                        {
                          "type": "array",
                          "definition": {
                            "type": "union",
                            "definition": [
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_reportSection"
                                },
                                "context": {}
                              },
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOnObject"
                                }
                              }
                            ]
                          }
                        },
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOnObject"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_listReportSection": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "type": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "list"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "fetchQuery": {
                "optional": true,
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirFetchQuery"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "selectData": {
                "optional": true,
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirSelectQueriesRecord"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "combineData": {
                "optional": true,
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirCrossJoinQuery"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "type": "union",
                "definition": [
                  {
                    "type": "array",
                    "definition": {
                      "type": "union",
                      "discriminator": "type",
                      "definition": [
                        {
                          "type": "union",
                          "definition": [
                            {
                              "type": "schemaReference",
                              "definition": {
                                "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectInstanceReportSection"
                              },
                              "context": {}
                            },
                            {
                              "type": "schemaReference",
                              "definition": {
                                "relativePath": "carryOnObject"
                              }
                            }
                          ]
                        },
                        {
                          "type": "union",
                          "definition": [
                            {
                              "type": "schemaReference",
                              "definition": {
                                "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectListReportSection"
                              },
                              "context": {}
                            },
                            {
                              "type": "schemaReference",
                              "definition": {
                                "relativePath": "carryOnObject"
                              }
                            }
                          ]
                        },
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOnObject"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_reportSection": {
        "type": "union",
        "discriminator": "type",
        "definition": [
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_gridReportSection"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_listReportSection"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectListReportSection"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectInstanceReportSection"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_rootReportSection": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "reportParametersToFetchQueryParametersTransformer": {
                "type": "union",
                "optional": true,
                "definition": [
                  {
                    "type": "record",
                    "optional": true,
                    "definition": {
                      "type": "string"
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "reportParameters": {
                "type": "union",
                "optional": true,
                "definition": [
                  {
                    "type": "record",
                    "optional": true,
                    "definition": {
                      "type": "string"
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "fetchQuery": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirFetchQuery"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "section": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_reportSection"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_report": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "uuid": {
                "type": "union",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentName": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 2,
                  "defaultLabel": "Entity Name",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "string",
                    "optional": true,
                    "extra": {
                      "id": 2,
                      "defaultLabel": "Entity Name",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentUuid": {
                "type": "union",
                "extra": {
                  "id": 3,
                  "defaultLabel": "Entity Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 3,
                      "defaultLabel": "Entity Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentDefinitionVersionUuid": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 4,
                  "defaultLabel": "Entity Definition Version Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "optional": true,
                    "extra": {
                      "id": 4,
                      "defaultLabel": "Entity Definition Version Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "conceptLevel": {
                "type": "union",
                "definition": [
                  {
                    "type": "enum",
                    "definition": [
                      "MetaModel",
                      "Model",
                      "Data"
                    ],
                    "optional": true,
                    "extra": {
                      "id": 5,
                      "defaultLabel": "Concept Level",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ],
                "optional": true,
                "extra": {
                  "id": 5,
                  "defaultLabel": "Concept Level",
                  "editable": false
                }
              },
              "name": {
                "type": "union",
                "extra": {
                  "id": 6,
                  "defaultLabel": "Name",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "string",
                    "extra": {
                      "id": 6,
                      "defaultLabel": "Name",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "defaultLabel": {
                "type": "union",
                "extra": {
                  "id": 7,
                  "defaultLabel": "Default Label",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "string",
                    "extra": {
                      "id": 7,
                      "defaultLabel": "Default Label",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "type": {
                "type": "union",
                "definition": [
                  {
                    "type": "enum",
                    "definition": [
                      "list",
                      "grid"
                    ],
                    "optional": true,
                    "extra": {
                      "id": 8,
                      "defaultLabel": "Type of Report",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ],
                "optional": true,
                "extra": {
                  "id": 8,
                  "defaultLabel": "Type of Report",
                  "editable": true
                }
              },
              "application": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 9,
                  "defaultLabel": "Application",
                  "targetEntity": "a659d350-dd97-4da9-91de-524fa01745dc",
                  "editable": true
                },
                "definition": [
                  {
                    "type": "uuid",
                    "optional": true,
                    "extra": {
                      "id": 9,
                      "defaultLabel": "Application",
                      "targetEntity": "a659d350-dd97-4da9-91de-524fa01745dc",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "extra": {
                  "id": 9,
                  "defaultLabel": "Definition",
                  "editable": true
                },
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "context": {
                      "objectInstanceReportSection": {
                        "type": "union",
                        "definition": [
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          },
                          {
                            "type": "object",
                            "definition": {
                              "type": {
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "literal",
                                    "definition": "objectInstanceReportSection"
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              },
                              "fetchQuery": {
                                "optional": true,
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "schemaReference",
                                    "optional": true,
                                    "definition": {
                                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirFetchQuery"
                                    },
                                    "context": {}
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              },
                              "definition": {
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  },
                                  {
                                    "type": "object",
                                    "definition": {
                                      "label": {
                                        "type": "union",
                                        "optional": true,
                                        "extra": {
                                          "id": 1,
                                          "defaultLabel": "Label",
                                          "editable": false
                                        },
                                        "definition": [
                                          {
                                            "type": "string",
                                            "optional": true,
                                            "extra": {
                                              "id": 1,
                                              "defaultLabel": "Label",
                                              "editable": false
                                            }
                                          },
                                          {
                                            "type": "schemaReference",
                                            "definition": {
                                              "relativePath": "carryOnObject"
                                            }
                                          }
                                        ]
                                      },
                                      "parentUuid": {
                                        "type": "union",
                                        "validations": [
                                          {
                                            "type": "uuid"
                                          }
                                        ],
                                        "extra": {
                                          "id": 2,
                                          "defaultLabel": "Entity Uuid",
                                          "editable": false
                                        },
                                        "definition": [
                                          {
                                            "type": "string",
                                            "validations": [
                                              {
                                                "type": "uuid"
                                              }
                                            ],
                                            "extra": {
                                              "id": 2,
                                              "defaultLabel": "Entity Uuid",
                                              "editable": false
                                            }
                                          },
                                          {
                                            "type": "schemaReference",
                                            "definition": {
                                              "relativePath": "carryOnObject"
                                            }
                                          }
                                        ]
                                      },
                                      "fetchedDataReference": {
                                        "type": "union",
                                        "optional": true,
                                        "extra": {
                                          "id": 3,
                                          "defaultLabel": "Fetched Data Reference",
                                          "editable": false
                                        },
                                        "definition": [
                                          {
                                            "type": "string",
                                            "optional": true,
                                            "extra": {
                                              "id": 3,
                                              "defaultLabel": "Fetched Data Reference",
                                              "editable": false
                                            }
                                          },
                                          {
                                            "type": "schemaReference",
                                            "definition": {
                                              "relativePath": "carryOnObject"
                                            }
                                          }
                                        ]
                                      },
                                      "query": {
                                        "optional": true,
                                        "type": "union",
                                        "definition": [
                                          {
                                            "type": "schemaReference",
                                            "optional": true,
                                            "definition": {
                                              "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selectObjectQuery"
                                            },
                                            "context": {}
                                          },
                                          {
                                            "type": "schemaReference",
                                            "definition": {
                                              "relativePath": "carryOnObject"
                                            }
                                          }
                                        ]
                                      }
                                    }
                                  }
                                ]
                              }
                            }
                          }
                        ]
                      },
                      "objectListReportSection": {
                        "type": "union",
                        "definition": [
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          },
                          {
                            "type": "object",
                            "definition": {
                              "type": {
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "literal",
                                    "definition": "objectListReportSection"
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              },
                              "definition": {
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  },
                                  {
                                    "type": "object",
                                    "definition": {
                                      "label": {
                                        "type": "union",
                                        "optional": true,
                                        "extra": {
                                          "id": 1,
                                          "defaultLabel": "Label",
                                          "editable": false
                                        },
                                        "definition": [
                                          {
                                            "type": "string",
                                            "optional": true,
                                            "extra": {
                                              "id": 1,
                                              "defaultLabel": "Label",
                                              "editable": false
                                            }
                                          },
                                          {
                                            "type": "schemaReference",
                                            "definition": {
                                              "relativePath": "carryOnObject"
                                            }
                                          }
                                        ]
                                      },
                                      "parentName": {
                                        "type": "union",
                                        "optional": true,
                                        "extra": {
                                          "id": 2,
                                          "defaultLabel": "Entity Name",
                                          "editable": false
                                        },
                                        "definition": [
                                          {
                                            "type": "string",
                                            "optional": true,
                                            "extra": {
                                              "id": 2,
                                              "defaultLabel": "Entity Name",
                                              "editable": false
                                            }
                                          },
                                          {
                                            "type": "schemaReference",
                                            "definition": {
                                              "relativePath": "carryOnObject"
                                            }
                                          }
                                        ]
                                      },
                                      "parentUuid": {
                                        "type": "union",
                                        "extra": {
                                          "id": 2,
                                          "defaultLabel": "Entity Uuid",
                                          "targetEntity": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                                          "editable": false
                                        },
                                        "definition": [
                                          {
                                            "type": "uuid",
                                            "extra": {
                                              "id": 2,
                                              "defaultLabel": "Entity Uuid",
                                              "targetEntity": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                                              "editable": false
                                            }
                                          },
                                          {
                                            "type": "schemaReference",
                                            "definition": {
                                              "relativePath": "carryOnObject"
                                            }
                                          }
                                        ]
                                      },
                                      "fetchedDataReference": {
                                        "type": "union",
                                        "optional": true,
                                        "extra": {
                                          "id": 3,
                                          "defaultLabel": "Fetched Data Reference",
                                          "editable": false
                                        },
                                        "definition": [
                                          {
                                            "type": "string",
                                            "optional": true,
                                            "extra": {
                                              "id": 3,
                                              "defaultLabel": "Fetched Data Reference",
                                              "editable": false
                                            }
                                          },
                                          {
                                            "type": "schemaReference",
                                            "definition": {
                                              "relativePath": "carryOnObject"
                                            }
                                          }
                                        ]
                                      },
                                      "query": {
                                        "optional": true,
                                        "type": "union",
                                        "definition": [
                                          {
                                            "type": "schemaReference",
                                            "optional": true,
                                            "definition": {
                                              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                              "relativePath": "selectObjectQuery"
                                            },
                                            "context": {}
                                          },
                                          {
                                            "type": "schemaReference",
                                            "definition": {
                                              "relativePath": "carryOnObject"
                                            }
                                          }
                                        ]
                                      },
                                      "sortByAttribute": {
                                        "type": "union",
                                        "optional": true,
                                        "definition": [
                                          {
                                            "type": "string",
                                            "optional": true
                                          },
                                          {
                                            "type": "schemaReference",
                                            "definition": {
                                              "relativePath": "carryOnObject"
                                            }
                                          }
                                        ]
                                      }
                                    }
                                  }
                                ]
                              }
                            }
                          }
                        ]
                      },
                      "gridReportSection": {
                        "type": "union",
                        "definition": [
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          },
                          {
                            "type": "object",
                            "definition": {
                              "type": {
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "literal",
                                    "definition": "grid"
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              },
                              "fetchQuery": {
                                "optional": true,
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "schemaReference",
                                    "optional": true,
                                    "definition": {
                                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                      "relativePath": "miroirFetchQuery"
                                    },
                                    "context": {}
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              },
                              "selectData": {
                                "optional": true,
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "schemaReference",
                                    "optional": true,
                                    "definition": {
                                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirSelectQueriesRecord"
                                    },
                                    "context": {}
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              },
                              "combineData": {
                                "optional": true,
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "schemaReference",
                                    "optional": true,
                                    "definition": {
                                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirCrossJoinQuery"
                                    },
                                    "context": {}
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              },
                              "definition": {
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "array",
                                    "definition": {
                                      "type": "union",
                                      "definition": [
                                        {
                                          "type": "array",
                                          "definition": {
                                            "type": "union",
                                            "definition": [
                                              {
                                                "type": "schemaReference",
                                                "definition": {
                                                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_reportSection"
                                                },
                                                "context": {}
                                              },
                                              {
                                                "type": "schemaReference",
                                                "definition": {
                                                  "relativePath": "carryOnObject"
                                                }
                                              }
                                            ]
                                          }
                                        },
                                        {
                                          "type": "schemaReference",
                                          "definition": {
                                            "relativePath": "carryOnObject"
                                          }
                                        }
                                      ]
                                    }
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              }
                            }
                          }
                        ]
                      },
                      "listReportSection": {
                        "type": "union",
                        "definition": [
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          },
                          {
                            "type": "object",
                            "definition": {
                              "type": {
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "literal",
                                    "definition": "list"
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              },
                              "fetchQuery": {
                                "optional": true,
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "schemaReference",
                                    "optional": true,
                                    "definition": {
                                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                      "relativePath": "miroirFetchQuery"
                                    },
                                    "context": {}
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              },
                              "selectData": {
                                "optional": true,
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "schemaReference",
                                    "optional": true,
                                    "definition": {
                                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                      "relativePath": "miroirSelectQueriesRecord"
                                    },
                                    "context": {}
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              },
                              "combineData": {
                                "optional": true,
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "schemaReference",
                                    "optional": true,
                                    "definition": {
                                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                      "relativePath": "miroirCrossJoinQuery"
                                    },
                                    "context": {}
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              },
                              "definition": {
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "array",
                                    "definition": {
                                      "type": "union",
                                      "discriminator": "type",
                                      "definition": [
                                        {
                                          "type": "union",
                                          "definition": [
                                            {
                                              "type": "schemaReference",
                                              "definition": {
                                                "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectInstanceReportSection"
                                              },
                                              "context": {}
                                            },
                                            {
                                              "type": "schemaReference",
                                              "definition": {
                                                "relativePath": "carryOnObject"
                                              }
                                            }
                                          ]
                                        },
                                        {
                                          "type": "union",
                                          "definition": [
                                            {
                                              "type": "schemaReference",
                                              "definition": {
                                                "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectListReportSection"
                                              },
                                              "context": {}
                                            },
                                            {
                                              "type": "schemaReference",
                                              "definition": {
                                                "relativePath": "carryOnObject"
                                              }
                                            }
                                          ]
                                        },
                                        {
                                          "type": "schemaReference",
                                          "definition": {
                                            "relativePath": "carryOnObject"
                                          }
                                        }
                                      ]
                                    }
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              }
                            }
                          }
                        ]
                      },
                      "reportSection": {
                        "type": "union",
                        "discriminator": "type",
                        "definition": [
                          {
                            "type": "union",
                            "definition": [
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_gridReportSection"
                                },
                                "context": {}
                              },
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOnObject"
                                }
                              }
                            ]
                          },
                          {
                            "type": "union",
                            "definition": [
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_listReportSection"
                                },
                                "context": {}
                              },
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOnObject"
                                }
                              }
                            ]
                          },
                          {
                            "type": "union",
                            "definition": [
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                  "relativePath": "objectListReportSection"
                                },
                                "context": {}
                              },
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOnObject"
                                }
                              }
                            ]
                          },
                          {
                            "type": "union",
                            "definition": [
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                  "relativePath": "objectInstanceReportSection"
                                },
                                "context": {}
                              },
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOnObject"
                                }
                              }
                            ]
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      },
                      "parameterTransformer": {
                        "type": "union",
                        "definition": [
                          {
                            "type": "string"
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      },
                      "rootReportSection": {
                        "type": "union",
                        "definition": [
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          },
                          {
                            "type": "object",
                            "definition": {
                              "reportParametersToFetchQueryParametersTransformer": {
                                "type": "union",
                                "optional": true,
                                "definition": [
                                  {
                                    "type": "record",
                                    "optional": true,
                                    "definition": {
                                      "type": "string"
                                    }
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              },
                              "reportParameters": {
                                "type": "union",
                                "optional": true,
                                "definition": [
                                  {
                                    "type": "record",
                                    "optional": true,
                                    "definition": {
                                      "type": "string"
                                    }
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              },
                              "fetchQuery": {
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                      "relativePath": "miroirFetchQuery"
                                    },
                                    "context": {}
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              },
                              "section": {
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                      "relativePath": "reportSection"
                                    },
                                    "context": {}
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              }
                            }
                          }
                        ]
                      }
                    },
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_rootReportSection"
                    },
                    "extra": {
                      "id": 9,
                      "defaultLabel": "Definition",
                      "editable": true
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_metaModel": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "applicationVersions": {
                "type": "union",
                "definition": [
                  {
                    "type": "array",
                    "definition": {
                      "type": "union",
                      "definition": [
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationVersion"
                          },
                          "context": {}
                        },
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOnObject"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "applicationVersionCrossEntityDefinition": {
                "type": "union",
                "definition": [
                  {
                    "type": "array",
                    "definition": {
                      "type": "union",
                      "definition": [
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOnObject"
                          }
                        },
                        {
                          "type": "object",
                          "definition": {
                            "uuid": {
                              "type": "union",
                              "extra": {
                                "id": 1,
                                "defaultLabel": "Uuid",
                                "editable": false
                              },
                              "definition": [
                                {
                                  "type": "uuid",
                                  "extra": {
                                    "id": 1,
                                    "defaultLabel": "Uuid",
                                    "editable": false
                                  }
                                },
                                {
                                  "type": "schemaReference",
                                  "definition": {
                                    "relativePath": "carryOnObject"
                                  }
                                }
                              ]
                            },
                            "parentName": {
                              "type": "union",
                              "optional": true,
                              "extra": {
                                "id": 2,
                                "defaultLabel": "Entity Name",
                                "editable": false
                              },
                              "definition": [
                                {
                                  "type": "string",
                                  "optional": true,
                                  "extra": {
                                    "id": 2,
                                    "defaultLabel": "Entity Name",
                                    "editable": false
                                  }
                                },
                                {
                                  "type": "schemaReference",
                                  "definition": {
                                    "relativePath": "carryOnObject"
                                  }
                                }
                              ]
                            },
                            "parentUuid": {
                              "type": "union",
                              "extra": {
                                "id": 3,
                                "defaultLabel": "Entity Uuid",
                                "editable": false
                              },
                              "definition": [
                                {
                                  "type": "uuid",
                                  "extra": {
                                    "id": 3,
                                    "defaultLabel": "Entity Uuid",
                                    "editable": false
                                  }
                                },
                                {
                                  "type": "schemaReference",
                                  "definition": {
                                    "relativePath": "carryOnObject"
                                  }
                                }
                              ]
                            },
                            "conceptLevel": {
                              "type": "union",
                              "definition": [
                                {
                                  "type": "enum",
                                  "definition": [
                                    "MetaModel",
                                    "Model",
                                    "Data"
                                  ],
                                  "optional": true,
                                  "extra": {
                                    "id": 4,
                                    "defaultLabel": "Concept Level",
                                    "editable": false
                                  }
                                },
                                {
                                  "type": "schemaReference",
                                  "definition": {
                                    "relativePath": "carryOnObject"
                                  }
                                }
                              ],
                              "optional": true,
                              "extra": {
                                "id": 4,
                                "defaultLabel": "Concept Level",
                                "editable": false
                              }
                            },
                            "applicationVersion": {
                              "type": "union",
                              "extra": {
                                "id": 1,
                                "defaultLabel": "Application Version",
                                "editable": false
                              },
                              "definition": [
                                {
                                  "type": "uuid",
                                  "extra": {
                                    "id": 1,
                                    "defaultLabel": "Application Version",
                                    "editable": false
                                  }
                                },
                                {
                                  "type": "schemaReference",
                                  "definition": {
                                    "relativePath": "carryOnObject"
                                  }
                                }
                              ]
                            },
                            "entityDefinition": {
                              "type": "union",
                              "extra": {
                                "id": 1,
                                "defaultLabel": "Entity Definition",
                                "editable": false
                              },
                              "definition": [
                                {
                                  "type": "uuid",
                                  "extra": {
                                    "id": 1,
                                    "defaultLabel": "Entity Definition",
                                    "editable": false
                                  }
                                },
                                {
                                  "type": "schemaReference",
                                  "definition": {
                                    "relativePath": "carryOnObject"
                                  }
                                }
                              ]
                            }
                          }
                        }
                      ]
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "configuration": {
                "type": "union",
                "definition": [
                  {
                    "type": "array",
                    "definition": {
                      "type": "union",
                      "definition": [
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeBasedConfiguration"
                          },
                          "context": {}
                        },
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOnObject"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "entities": {
                "type": "union",
                "definition": [
                  {
                    "type": "array",
                    "definition": {
                      "type": "union",
                      "definition": [
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entity"
                          },
                          "context": {}
                        },
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOnObject"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "entityDefinitions": {
                "type": "union",
                "definition": [
                  {
                    "type": "array",
                    "definition": {
                      "type": "union",
                      "definition": [
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityDefinition"
                          },
                          "context": {}
                        },
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOnObject"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "jzodSchemas": {
                "type": "union",
                "definition": [
                  {
                    "type": "array",
                    "definition": {
                      "type": "union",
                      "definition": [
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodSchema"
                          },
                          "context": {}
                        },
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOnObject"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "menus": {
                "type": "union",
                "definition": [
                  {
                    "type": "array",
                    "definition": {
                      "type": "union",
                      "definition": [
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menu"
                          },
                          "context": {}
                        },
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOnObject"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "reports": {
                "type": "union",
                "definition": [
                  {
                    "type": "array",
                    "definition": {
                      "type": "union",
                      "definition": [
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_report"
                          },
                          "context": {}
                        },
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOnObject"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectTemplateInnerReference": {
        "type": "union",
        "discriminator": "templateType",
        "definition": [
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "templateType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "constant"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "referenceUuid": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "string"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "templateType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "contextReference"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "referenceName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "string"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "templateType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "parameterReference"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "referenceName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "string"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectTemplate": {
        "type": "union",
        "discriminator": "templateType",
        "definition": [
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectTemplateInnerReference"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "templateType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "mustacheStringTemplate"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "definition": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "string"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "templateType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "fullObjectTemplate"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "definition": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "array",
                        "definition": {
                          "type": "union",
                          "definition": [
                            {
                              "type": "union",
                              "definition": [
                                {
                                  "type": "schemaReference",
                                  "definition": {
                                    "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectTemplateInnerReference"
                                  },
                                  "context": {}
                                },
                                {
                                  "type": "schemaReference",
                                  "definition": {
                                    "relativePath": "carryOnObject"
                                  }
                                }
                              ]
                            },
                            {
                              "type": "union",
                              "definition": [
                                {
                                  "type": "schemaReference",
                                  "definition": {
                                    "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectTemplate"
                                  },
                                  "context": {}
                                },
                                {
                                  "type": "schemaReference",
                                  "definition": {
                                    "relativePath": "carryOnObject"
                                  }
                                }
                              ]
                            }
                          ]
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_indexedDbStoreSectionConfiguration": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "emulatedServerType": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "indexedDb"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "indexedDbName": {
                "type": "union",
                "definition": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_filesystemDbStoreSectionConfiguration": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "emulatedServerType": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "filesystem"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "directory": {
                "type": "union",
                "definition": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_sqlDbStoreSectionConfiguration": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "emulatedServerType": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "sql"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "connectionString": {
                "type": "union",
                "definition": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "schema": {
                "type": "union",
                "definition": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeBasedConfiguration": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "uuid": {
                "type": "union",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentName": {
                "type": "union",
                "optional": true,
                "extra": {
                  "id": 2,
                  "defaultLabel": "Entity Name",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "string",
                    "optional": true,
                    "extra": {
                      "id": 2,
                      "defaultLabel": "Entity Name",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "parentUuid": {
                "type": "union",
                "extra": {
                  "id": 3,
                  "defaultLabel": "Entity Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 3,
                      "defaultLabel": "Entity Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "conceptLevel": {
                "type": "union",
                "definition": [
                  {
                    "type": "enum",
                    "definition": [
                      "MetaModel",
                      "Model",
                      "Data"
                    ],
                    "optional": true,
                    "extra": {
                      "id": 4,
                      "defaultLabel": "Concept Level",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ],
                "optional": true,
                "extra": {
                  "id": 4,
                  "defaultLabel": "Concept Level",
                  "editable": false
                }
              },
              "defaultLabel": {
                "type": "union",
                "extra": {
                  "id": 3,
                  "defaultLabel": "Entity Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 3,
                      "defaultLabel": "Entity Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  },
                  {
                    "type": "object",
                    "definition": {
                      "currentApplicationVersion": {
                        "type": "union",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Current Application Version",
                          "editable": false
                        },
                        "definition": [
                          {
                            "type": "uuid",
                            "extra": {
                              "id": 1,
                              "defaultLabel": "Current Application Version",
                              "editable": false
                            }
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      }
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "admin": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeSectionConfiguration"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "model": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "storeSectionConfiguration"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "data": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "storeSectionConfiguration"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeSectionConfiguration": {
        "type": "union",
        "discriminator": "emulatedServerType",
        "definition": [
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_indexedDbStoreSectionConfiguration"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_filesystemDbStoreSectionConfiguration"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_sqlDbStoreSectionConfiguration"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceCUDAction": {
        "type": "union",
        "definition": [
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "instanceAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "createInstance"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "ed520de4-55a9-4550-ac50-b1b713b72a89"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Uuid",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "applicationSection": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection"
                        },
                        "context": {}
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "objects": {
                    "type": "union",
                    "extra": {
                      "id": 2,
                      "defaultLabel": "Entity Instances to create",
                      "editable": true
                    },
                    "definition": [
                      {
                        "type": "array",
                        "extra": {
                          "id": 2,
                          "defaultLabel": "Entity Instances to create",
                          "editable": true
                        },
                        "definition": {
                          "optional": false,
                          "type": "union",
                          "definition": [
                            {
                              "type": "schemaReference",
                              "optional": false,
                              "definition": {
                                "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection"
                              },
                              "context": {}
                            },
                            {
                              "type": "schemaReference",
                              "definition": {
                                "relativePath": "carryOnObject"
                              }
                            }
                          ]
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "instanceAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "deleteInstance"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Uuid",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "ed520de4-55a9-4550-ac50-b1b713b72a89"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "applicationSection": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection"
                        },
                        "context": {}
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "includeInTransaction": {
                    "type": "union",
                    "optional": true,
                    "definition": [
                      {
                        "type": "boolean",
                        "optional": true
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "objects": {
                    "type": "union",
                    "extra": {
                      "id": 2,
                      "defaultLabel": "Entity Instances to delete",
                      "editable": true
                    },
                    "definition": [
                      {
                        "type": "array",
                        "extra": {
                          "id": 2,
                          "defaultLabel": "Entity Instances to delete",
                          "editable": true
                        },
                        "definition": {
                          "optional": false,
                          "type": "union",
                          "definition": [
                            {
                              "type": "schemaReference",
                              "optional": false,
                              "definition": {
                                "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection"
                              },
                              "context": {}
                            },
                            {
                              "type": "schemaReference",
                              "definition": {
                                "relativePath": "carryOnObject"
                              }
                            }
                          ]
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "instanceAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "updateInstance"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "ed520de4-55a9-4550-ac50-b1b713b72a89"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Uuid",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "applicationSection": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection"
                        },
                        "context": {}
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "includeInTransaction": {
                    "type": "union",
                    "optional": true,
                    "definition": [
                      {
                        "type": "boolean",
                        "optional": true
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "objects": {
                    "type": "union",
                    "extra": {
                      "id": 2,
                      "defaultLabel": "Entity Instances to update",
                      "editable": true
                    },
                    "definition": [
                      {
                        "type": "array",
                        "extra": {
                          "id": 2,
                          "defaultLabel": "Entity Instances to update",
                          "editable": true
                        },
                        "definition": {
                          "optional": false,
                          "type": "union",
                          "definition": [
                            {
                              "type": "schemaReference",
                              "optional": false,
                              "definition": {
                                "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection"
                              },
                              "context": {}
                            },
                            {
                              "type": "schemaReference",
                              "definition": {
                                "relativePath": "carryOnObject"
                              }
                            }
                          ]
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_undoRedoAction": {
        "type": "union",
        "definition": [
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "undoRedoAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "undo"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "71c04f8e-c687-4ea7-9a19-bc98d796c389"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Uuid",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "undoRedoAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "redo"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "71c04f8e-c687-4ea7-9a19-bc98d796c389"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Uuid",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeOrBundleAction": {
        "type": "union",
        "definition": [
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeManagementAction"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_bundleAction"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_modelAction": {
        "type": "union",
        "definition": [
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "modelAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "initModel"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Deployment",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Deployment",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "params": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      },
                      {
                        "type": "object",
                        "definition": {
                          "metaModel": {
                            "type": "union",
                            "definition": [
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_metaModel"
                                },
                                "context": {}
                              },
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOnObject"
                                }
                              }
                            ]
                          },
                          "dataStoreType": {
                            "type": "union",
                            "definition": [
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_dataStoreType"
                                },
                                "context": {}
                              },
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOnObject"
                                }
                              }
                            ]
                          },
                          "application": {
                            "type": "union",
                            "definition": [
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_application"
                                },
                                "context": {}
                              },
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOnObject"
                                }
                              }
                            ]
                          },
                          "applicationDeploymentConfiguration": {
                            "type": "union",
                            "definition": [
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance"
                                },
                                "context": {}
                              },
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOnObject"
                                }
                              }
                            ]
                          },
                          "applicationModelBranch": {
                            "type": "union",
                            "definition": [
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                  "relativePath": "entityInstance"
                                },
                                "context": {}
                              },
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOnObject"
                                }
                              }
                            ]
                          },
                          "applicationVersion": {
                            "type": "union",
                            "definition": [
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                  "relativePath": "entityInstance"
                                },
                                "context": {}
                              },
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOnObject"
                                }
                              }
                            ]
                          },
                          "applicationStoreBasedConfiguration": {
                            "type": "union",
                            "definition": [
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                  "relativePath": "entityInstance"
                                },
                                "context": {}
                              },
                              {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "carryOnObject"
                                }
                              }
                            ]
                          }
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "modelAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "commit"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Deployment",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Deployment",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "modelAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "rollback"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Deployment",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Deployment",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "modelAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "remoteLocalCacheRollback"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Deployment",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Deployment",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "modelAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "resetModel"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Deployment",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Deployment",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "modelAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "resetData"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Deployment",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Deployment",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "modelAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "alterEntityAttribute"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "transactional": {
                    "type": "union",
                    "optional": true,
                    "definition": [
                      {
                        "type": "boolean",
                        "optional": true
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Deployment",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Deployment",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "entityName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "string"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "entityUuid": {
                    "type": "union",
                    "validations": [
                      {
                        "type": "uuid"
                      }
                    ],
                    "definition": [
                      {
                        "type": "string",
                        "validations": [
                          {
                            "type": "uuid"
                          }
                        ]
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "entityDefinitionUuid": {
                    "type": "union",
                    "validations": [
                      {
                        "type": "uuid"
                      }
                    ],
                    "definition": [
                      {
                        "type": "string",
                        "validations": [
                          {
                            "type": "uuid"
                          }
                        ]
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "addColumns": {
                    "type": "union",
                    "optional": true,
                    "definition": [
                      {
                        "type": "array",
                        "optional": true,
                        "definition": {
                          "type": "union",
                          "definition": [
                            {
                              "type": "schemaReference",
                              "definition": {
                                "relativePath": "carryOnObject"
                              }
                            },
                            {
                              "type": "object",
                              "definition": {
                                "name": {
                                  "type": "union",
                                  "definition": [
                                    {
                                      "type": "string"
                                    },
                                    {
                                      "type": "schemaReference",
                                      "definition": {
                                        "relativePath": "carryOnObject"
                                      }
                                    }
                                  ]
                                },
                                "definition": {
                                  "type": "union",
                                  "definition": [
                                    {
                                      "type": "schemaReference",
                                      "definition": {
                                        "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement"
                                      },
                                      "context": {}
                                    },
                                    {
                                      "type": "schemaReference",
                                      "definition": {
                                        "relativePath": "carryOnObject"
                                      }
                                    }
                                  ]
                                }
                              }
                            }
                          ]
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "removeColumns": {
                    "type": "union",
                    "optional": true,
                    "definition": [
                      {
                        "type": "array",
                        "optional": true,
                        "definition": {
                          "type": "union",
                          "definition": [
                            {
                              "type": "string"
                            },
                            {
                              "type": "schemaReference",
                              "definition": {
                                "relativePath": "carryOnObject"
                              }
                            }
                          ]
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "update": {
                    "optional": true,
                    "type": "union",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "optional": true,
                        "definition": {
                          "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                          "relativePath": "jzodElement"
                        },
                        "context": {}
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "modelAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "renameEntity"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "transactional": {
                    "type": "union",
                    "optional": true,
                    "definition": [
                      {
                        "type": "boolean",
                        "optional": true
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Deployment",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Deployment",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "entityName": {
                    "type": "union",
                    "optional": true,
                    "definition": [
                      {
                        "type": "string",
                        "optional": true
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "entityUuid": {
                    "type": "union",
                    "validations": [
                      {
                        "type": "uuid"
                      }
                    ],
                    "definition": [
                      {
                        "type": "string",
                        "validations": [
                          {
                            "type": "uuid"
                          }
                        ]
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "entityDefinitionUuid": {
                    "type": "union",
                    "validations": [
                      {
                        "type": "uuid"
                      }
                    ],
                    "definition": [
                      {
                        "type": "string",
                        "validations": [
                          {
                            "type": "uuid"
                          }
                        ]
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "targetValue": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "string"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "modelAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "createEntity"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "transactional": {
                    "type": "union",
                    "optional": true,
                    "definition": [
                      {
                        "type": "boolean",
                        "optional": true
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Deployment",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Deployment",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "entities": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "array",
                        "definition": {
                          "type": "union",
                          "definition": [
                            {
                              "type": "schemaReference",
                              "definition": {
                                "relativePath": "carryOnObject"
                              }
                            },
                            {
                              "type": "object",
                              "definition": {
                                "entity": {
                                  "type": "union",
                                  "definition": [
                                    {
                                      "type": "schemaReference",
                                      "definition": {
                                        "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entity"
                                      },
                                      "context": {}
                                    },
                                    {
                                      "type": "schemaReference",
                                      "definition": {
                                        "relativePath": "carryOnObject"
                                      }
                                    }
                                  ]
                                },
                                "entityDefinition": {
                                  "type": "union",
                                  "definition": [
                                    {
                                      "type": "schemaReference",
                                      "definition": {
                                        "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityDefinition"
                                      },
                                      "context": {}
                                    },
                                    {
                                      "type": "schemaReference",
                                      "definition": {
                                        "relativePath": "carryOnObject"
                                      }
                                    }
                                  ]
                                }
                              }
                            }
                          ]
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "modelAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "dropEntity"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "transactional": {
                    "type": "union",
                    "optional": true,
                    "definition": [
                      {
                        "type": "boolean",
                        "optional": true
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Deployment",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Deployment",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "7947ae40-eb34-4149-887b-15a9021e714e"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "entityUuid": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "string"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "entityDefinitionUuid": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "string"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceAction": {
        "type": "union",
        "definition": [
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "instanceAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "createInstance"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "ed520de4-55a9-4550-ac50-b1b713b72a89"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Uuid",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "applicationSection": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection"
                        },
                        "context": {}
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "objects": {
                    "type": "union",
                    "extra": {
                      "id": 2,
                      "defaultLabel": "Entity Instances to create",
                      "editable": true
                    },
                    "definition": [
                      {
                        "type": "array",
                        "extra": {
                          "id": 2,
                          "defaultLabel": "Entity Instances to create",
                          "editable": true
                        },
                        "definition": {
                          "optional": false,
                          "type": "union",
                          "definition": [
                            {
                              "type": "schemaReference",
                              "optional": false,
                              "definition": {
                                "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection"
                              },
                              "context": {}
                            },
                            {
                              "type": "schemaReference",
                              "definition": {
                                "relativePath": "carryOnObject"
                              }
                            }
                          ]
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "instanceAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "deleteInstance"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Uuid",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "ed520de4-55a9-4550-ac50-b1b713b72a89"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "applicationSection": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection"
                        },
                        "context": {}
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "includeInTransaction": {
                    "type": "union",
                    "optional": true,
                    "definition": [
                      {
                        "type": "boolean",
                        "optional": true
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "objects": {
                    "type": "union",
                    "extra": {
                      "id": 2,
                      "defaultLabel": "Entity Instances to delete",
                      "editable": true
                    },
                    "definition": [
                      {
                        "type": "array",
                        "extra": {
                          "id": 2,
                          "defaultLabel": "Entity Instances to delete",
                          "editable": true
                        },
                        "definition": {
                          "optional": false,
                          "type": "union",
                          "definition": [
                            {
                              "type": "schemaReference",
                              "optional": false,
                              "definition": {
                                "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection"
                              },
                              "context": {}
                            },
                            {
                              "type": "schemaReference",
                              "definition": {
                                "relativePath": "carryOnObject"
                              }
                            }
                          ]
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "instanceAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "deleteInstanceWithCascade"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Uuid",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "ed520de4-55a9-4550-ac50-b1b713b72a89"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "applicationSection": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection"
                        },
                        "context": {}
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "includeInTransaction": {
                    "type": "union",
                    "optional": true,
                    "definition": [
                      {
                        "type": "boolean",
                        "optional": true
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "objects": {
                    "type": "union",
                    "extra": {
                      "id": 2,
                      "defaultLabel": "Entity Instances to delete",
                      "editable": true
                    },
                    "definition": [
                      {
                        "type": "array",
                        "extra": {
                          "id": 2,
                          "defaultLabel": "Entity Instances to delete",
                          "editable": true
                        },
                        "definition": {
                          "optional": false,
                          "type": "union",
                          "definition": [
                            {
                              "type": "schemaReference",
                              "optional": false,
                              "definition": {
                                "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection"
                              },
                              "context": {}
                            },
                            {
                              "type": "schemaReference",
                              "definition": {
                                "relativePath": "carryOnObject"
                              }
                            }
                          ]
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "instanceAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "updateInstance"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "ed520de4-55a9-4550-ac50-b1b713b72a89"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Uuid",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "applicationSection": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection"
                        },
                        "context": {}
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "includeInTransaction": {
                    "type": "union",
                    "optional": true,
                    "definition": [
                      {
                        "type": "boolean",
                        "optional": true
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "objects": {
                    "type": "union",
                    "extra": {
                      "id": 2,
                      "defaultLabel": "Entity Instances to update",
                      "editable": true
                    },
                    "definition": [
                      {
                        "type": "array",
                        "extra": {
                          "id": 2,
                          "defaultLabel": "Entity Instances to update",
                          "editable": true
                        },
                        "definition": {
                          "optional": false,
                          "type": "union",
                          "definition": [
                            {
                              "type": "schemaReference",
                              "optional": false,
                              "definition": {
                                "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection"
                              },
                              "context": {}
                            },
                            {
                              "type": "schemaReference",
                              "definition": {
                                "relativePath": "carryOnObject"
                              }
                            }
                          ]
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "instanceAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "loadNewInstancesInLocalCache"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "ed520de4-55a9-4550-ac50-b1b713b72a89"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Uuid",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "objects": {
                    "type": "union",
                    "extra": {
                      "id": 2,
                      "defaultLabel": "Entity Instances to place in the local cache",
                      "editable": true
                    },
                    "definition": [
                      {
                        "type": "array",
                        "extra": {
                          "id": 2,
                          "defaultLabel": "Entity Instances to place in the local cache",
                          "editable": true
                        },
                        "definition": {
                          "optional": false,
                          "type": "union",
                          "definition": [
                            {
                              "type": "schemaReference",
                              "optional": false,
                              "definition": {
                                "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection"
                              },
                              "context": {}
                            },
                            {
                              "type": "schemaReference",
                              "definition": {
                                "relativePath": "carryOnObject"
                              }
                            }
                          ]
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "instanceAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "getInstance"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "ed520de4-55a9-4550-ac50-b1b713b72a89"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Uuid",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "applicationSection": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection"
                        },
                        "context": {}
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "parentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Uuid",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "uuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Uuid",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "instanceAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "getInstances"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "ed520de4-55a9-4550-ac50-b1b713b72a89"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Uuid",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "applicationSection": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection"
                        },
                        "context": {}
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "parentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Uuid",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeManagementAction": {
        "type": "union",
        "definition": [
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "storeManagementAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "createStore"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "bbd08cbb-79ff-4539-b91f-7a14f15ac55f"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "configuration": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration"
                        },
                        "context": {}
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "defaultLabel": "Module Deployment Uuid",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "defaultLabel": "Module Deployment Uuid",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "storeManagementAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "deleteStore"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "bbd08cbb-79ff-4539-b91f-7a14f15ac55f"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "defaultLabel": "Module Deployment Uuid",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "defaultLabel": "Module Deployment Uuid",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "configuration": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration"
                        },
                        "context": {}
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "storeManagementAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "resetAndInitMiroirAndApplicationDatabase"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "bbd08cbb-79ff-4539-b91f-7a14f15ac55f"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deployments": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "array",
                        "definition": {
                          "type": "union",
                          "definition": [
                            {
                              "type": "schemaReference",
                              "definition": {
                                "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_deployment"
                              },
                              "context": {}
                            },
                            {
                              "type": "schemaReference",
                              "definition": {
                                "relativePath": "carryOnObject"
                              }
                            }
                          ]
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "defaultLabel": "Module Deployment Uuid",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "defaultLabel": "Module Deployment Uuid",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "storeManagementAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "openStore"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "bbd08cbb-79ff-4539-b91f-7a14f15ac55f"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "configuration": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "record",
                        "definition": {
                          "type": "schemaReference",
                          "definition": {
                            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                            "relativePath": "storeUnitConfiguration"
                          },
                          "context": {}
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "defaultLabel": "Module Deployment Uuid",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "defaultLabel": "Module Deployment Uuid",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "storeManagementAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "closeStore"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "endpoint": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "bbd08cbb-79ff-4539-b91f-7a14f15ac55f"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "defaultLabel": "Module Deployment Uuid",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "defaultLabel": "Module Deployment Uuid",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transactionalInstanceAction": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "transactionalInstanceAction"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "deploymentUuid": {
                "type": "union",
                "optional": true,
                "extra": {
                  "defaultLabel": "Module Deployment Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "optional": true,
                    "extra": {
                      "defaultLabel": "Module Deployment Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "instanceAction": {
                "optional": false,
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "optional": false,
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceCUDAction"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_bundleAction": {
        "type": "union",
        "definition": [
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "bundleAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "createBundle"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Uuid",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "bundleAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "deleteBundle"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "id": 1,
                          "defaultLabel": "Uuid",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction": {
        "type": "union",
        "definition": [
          {
            "optional": false,
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "optional": false,
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_undoRedoAction"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "optional": false,
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "optional": false,
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeOrBundleAction"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "optional": false,
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "optional": false,
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_modelAction"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "optional": false,
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "optional": false,
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceAction"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "transactionalInstanceAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "optional": true,
                    "extra": {
                      "defaultLabel": "Module Deployment Uuid",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "optional": true,
                        "extra": {
                          "defaultLabel": "Module Deployment Uuid",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "instanceAction": {
                    "optional": false,
                    "type": "union",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "optional": false,
                        "definition": {
                          "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceCUDAction"
                        },
                        "context": {}
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "actionType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "compositeAction"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "actionName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "sequence"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "deploymentUuid": {
                    "type": "union",
                    "optional": true,
                    "extra": {
                      "defaultLabel": "Module Deployment Uuid",
                      "editable": false
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "optional": true,
                        "extra": {
                          "defaultLabel": "Module Deployment Uuid",
                          "editable": false
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "definition": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "array",
                        "definition": {
                          "type": "union",
                          "discriminator": "compositeActionType",
                          "definition": [
                            {
                              "type": "union",
                              "definition": [
                                {
                                  "type": "schemaReference",
                                  "definition": {
                                    "relativePath": "carryOnObject"
                                  }
                                },
                                {
                                  "type": "object",
                                  "definition": {
                                    "compositeActionType": {
                                      "type": "union",
                                      "definition": [
                                        {
                                          "type": "literal",
                                          "definition": "action"
                                        },
                                        {
                                          "type": "schemaReference",
                                          "definition": {
                                            "relativePath": "carryOnObject"
                                          }
                                        }
                                      ]
                                    },
                                    "action": {
                                      "type": "union",
                                      "definition": [
                                        {
                                          "type": "schemaReference",
                                          "definition": {
                                            "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction"
                                          },
                                          "context": {}
                                        },
                                        {
                                          "type": "schemaReference",
                                          "definition": {
                                            "relativePath": "carryOnObject"
                                          }
                                        }
                                      ]
                                    }
                                  }
                                }
                              ]
                            },
                            {
                              "type": "union",
                              "definition": [
                                {
                                  "type": "schemaReference",
                                  "definition": {
                                    "relativePath": "carryOnObject"
                                  }
                                },
                                {
                                  "type": "object",
                                  "definition": {
                                    "compositeActionType": {
                                      "type": "union",
                                      "definition": [
                                        {
                                          "type": "literal",
                                          "definition": "query"
                                        },
                                        {
                                          "type": "schemaReference",
                                          "definition": {
                                            "relativePath": "carryOnObject"
                                          }
                                        }
                                      ]
                                    },
                                    "query": {
                                      "type": "union",
                                      "definition": [
                                        {
                                          "type": "schemaReference",
                                          "definition": {
                                            "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryAction"
                                          },
                                          "context": {}
                                        },
                                        {
                                          "type": "schemaReference",
                                          "definition": {
                                            "relativePath": "carryOnObject"
                                          }
                                        }
                                      ]
                                    }
                                  }
                                }
                              ]
                            },
                            {
                              "type": "schemaReference",
                              "definition": {
                                "relativePath": "carryOnObject"
                              }
                            }
                          ]
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "compositeAction"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "actionName": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "sequence"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "deploymentUuid": {
                "type": "union",
                "optional": true,
                "extra": {
                  "defaultLabel": "Module Deployment Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "optional": true,
                    "extra": {
                      "defaultLabel": "Module Deployment Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "definition": {
                "type": "union",
                "definition": [
                  {
                    "type": "array",
                    "definition": {
                      "type": "union",
                      "discriminator": "compositeActionType",
                      "definition": [
                        {
                          "type": "union",
                          "definition": [
                            {
                              "type": "schemaReference",
                              "definition": {
                                "relativePath": "carryOnObject"
                              }
                            },
                            {
                              "type": "object",
                              "definition": {
                                "compositeActionType": {
                                  "type": "union",
                                  "definition": [
                                    {
                                      "type": "literal",
                                      "definition": "action"
                                    },
                                    {
                                      "type": "schemaReference",
                                      "definition": {
                                        "relativePath": "carryOnObject"
                                      }
                                    }
                                  ]
                                },
                                "action": {
                                  "type": "union",
                                  "definition": [
                                    {
                                      "type": "schemaReference",
                                      "definition": {
                                        "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction"
                                      },
                                      "context": {}
                                    },
                                    {
                                      "type": "schemaReference",
                                      "definition": {
                                        "relativePath": "carryOnObject"
                                      }
                                    }
                                  ]
                                }
                              }
                            }
                          ]
                        },
                        {
                          "type": "union",
                          "definition": [
                            {
                              "type": "schemaReference",
                              "definition": {
                                "relativePath": "carryOnObject"
                              }
                            },
                            {
                              "type": "object",
                              "definition": {
                                "compositeActionType": {
                                  "type": "union",
                                  "definition": [
                                    {
                                      "type": "literal",
                                      "definition": "query"
                                    },
                                    {
                                      "type": "schemaReference",
                                      "definition": {
                                        "relativePath": "carryOnObject"
                                      }
                                    }
                                  ]
                                },
                                "query": {
                                  "type": "union",
                                  "definition": [
                                    {
                                      "type": "schemaReference",
                                      "definition": {
                                        "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryAction"
                                      },
                                      "context": {}
                                    },
                                    {
                                      "type": "schemaReference",
                                      "definition": {
                                        "relativePath": "carryOnObject"
                                      }
                                    }
                                  ]
                                }
                              }
                            }
                          ]
                        },
                        {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "carryOnObject"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryObjectReference": {
        "type": "union",
        "discriminator": "referenceType",
        "definition": [
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "referenceType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "constant"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "referenceUuid": {
                    "type": "union",
                    "extra": {
                      "targetEntity": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad"
                    },
                    "definition": [
                      {
                        "type": "uuid",
                        "extra": {
                          "targetEntity": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad"
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "referenceType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "queryContextReference"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "referenceName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "string"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "referenceType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "queryParameterReference"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "referenceName": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "string"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selectObjectListByManyToManyRelationQuery": {
        "type": "union",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "relativePath": "selectRootQuery",
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
          },
          "context": {}
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "queryType": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "selectObjectListByManyToManyRelation"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "objectListReference": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryObjectReference"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "objectListReferenceAttribute": {
                "type": "union",
                "optional": true,
                "definition": [
                  {
                    "type": "string",
                    "optional": true
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "AttributeOfRootListObjectToCompareToListReferenceUuid": {
                "type": "union",
                "optional": true,
                "definition": [
                  {
                    "type": "string",
                    "optional": true
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selectObjectListByEntityQuery": {
        "type": "union",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "relativePath": "selectRootQuery",
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
          },
          "context": {}
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "queryType": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "selectObjectListByEntity"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selectObjectListByRelationQuery": {
        "type": "union",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "relativePath": "selectRootQuery",
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
          },
          "context": {}
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "queryType": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "selectObjectListByRelation"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "objectReference": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryObjectReference"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "objectReferenceAttribute": {
                "type": "union",
                "optional": true,
                "definition": [
                  {
                    "type": "string",
                    "optional": true
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "AttributeOfListObjectToCompareToReferenceUuid": {
                "type": "union",
                "definition": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selectObjectByRelationQuery": {
        "type": "union",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "relativePath": "selectRootQuery",
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
          },
          "context": {}
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "queryType": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "selectObjectByRelation"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "objectReference": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryObjectReference"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "AttributeOfObjectToCompareToReferenceUuid": {
                "type": "union",
                "definition": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selectObjectByDirectReferenceQuery": {
        "type": "union",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "relativePath": "selectRootQuery",
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
          },
          "context": {}
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "queryType": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "selectObjectByDirectReference"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "instanceUuid": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryObjectReference"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selectObjectQuery": {
        "type": "union",
        "discriminator": "queryType",
        "definition": [
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selectObjectByRelationQuery"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selectObjectByDirectReferenceQuery"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selectQueryCombinerQuery": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "queryType": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "queryCombiner"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "rootQuery": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirSelectQuery"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "subQuery": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  },
                  {
                    "type": "object",
                    "definition": {
                      "query": {
                        "type": "union",
                        "definition": [
                          {
                            "type": "schemaReference",
                            "definition": {
                              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                              "relativePath": "miroirSelectQuery"
                            },
                            "context": {}
                          },
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          }
                        ]
                      },
                      "parameter": {
                        "type": "union",
                        "definition": [
                          {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "carryOnObject"
                            }
                          },
                          {
                            "type": "object",
                            "definition": {
                              "transformerType": {
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "literal",
                                    "definition": "recordOfTransformers"
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              },
                              "definition": {
                                "type": "union",
                                "definition": [
                                  {
                                    "type": "record",
                                    "definition": {
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
                                    }
                                  },
                                  {
                                    "type": "schemaReference",
                                    "definition": {
                                      "relativePath": "carryOnObject"
                                    }
                                  }
                                ]
                              }
                            }
                          }
                        ]
                      }
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirSelectQuery": {
        "type": "union",
        "discriminator": "queryType",
        "definition": [
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selectObjectListByEntityQuery"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selectObjectListByRelationQuery"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selectObjectListByManyToManyRelationQuery"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selectQueryCombinerQuery"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selectObjectByRelationQuery"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selectObjectByDirectReferenceQuery"
                },
                "context": {}
              },
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "queryType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "literal"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "definition": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "string"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "queryType": {
                    "type": "union",
                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    "definition": [
                      {
                        "type": "literal",
                        "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        "definition": "queryContextReference"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "queryReference": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "string"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "queryType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "wrapperReturningObject"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "definition": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "record",
                        "definition": {
                          "type": "schemaReference",
                          "definition": {
                            "relativePath": "miroirSelectQuery",
                            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
                          },
                          "context": {}
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "relativePath": "carryOnObject"
                }
              },
              {
                "type": "object",
                "definition": {
                  "queryType": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "literal",
                        "definition": "wrapperReturningList"
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  },
                  "definition": {
                    "type": "union",
                    "definition": [
                      {
                        "type": "array",
                        "definition": {
                          "type": "union",
                          "definition": [
                            {
                              "type": "schemaReference",
                              "definition": {
                                "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirSelectQuery"
                              },
                              "context": {}
                            },
                            {
                              "type": "schemaReference",
                              "definition": {
                                "relativePath": "carryOnObject"
                              }
                            }
                          ]
                        }
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "carryOnObject"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirSelectQueriesRecord": {
        "type": "union",
        "definition": [
          {
            "type": "record",
            "definition": {
              "type": "schemaReference",
              "definition": {
                "relativePath": "miroirSelectQuery",
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
              },
              "context": {}
            }
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirCrossJoinQuery": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "queryType": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "combineQuery"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "a": {
                "type": "union",
                "definition": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "b": {
                "type": "union",
                "definition": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirFetchQuery": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "parameterSchema": {
                "optional": true,
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "select": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirSelectQueriesRecord"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "crossJoin": {
                "optional": true,
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirCrossJoinQuery"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainManyQueriesWithDeploymentUuid": {
        "type": "union",
        "extend": {
          "type": "schemaReference",
          "definition": {
            "eager": true,
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "domainModelRootQuery"
          },
          "context": {}
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "queryType": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "DomainManyQueries"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "deploymentUuid": {
                "type": "union",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "fetchQuery": {
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirFetchQuery"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryAction": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
            }
          },
          {
            "type": "object",
            "definition": {
              "actionType": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "queryAction"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "actionName": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "runQuery"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "endpoint": {
                "type": "union",
                "definition": [
                  {
                    "type": "literal",
                    "definition": "9e404b3c-368c-40cb-be8b-e3c28550c25e"
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "deploymentUuid": {
                "type": "union",
                "extra": {
                  "id": 1,
                  "defaultLabel": "Uuid",
                  "editable": false
                },
                "definition": [
                  {
                    "type": "uuid",
                    "extra": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    }
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              },
              "query": {
                "optional": false,
                "type": "union",
                "definition": [
                  {
                    "type": "schemaReference",
                    "optional": false,
                    "definition": {
                      "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainManyQueriesWithDeploymentUuid"
                    },
                    "context": {}
                  },
                  {
                    "type": "schemaReference",
                    "definition": {
                      "relativePath": "carryOnObject"
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      "carryOnObject": {
        "type": "union",
        "discriminator": "templateType",
        "discriminatorNew": {
          "discriminatorType": "string",
          "value": "templateType"
        },
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "objectTemplateInnerReference"
            }
          },
          {
            "type": "object",
            "definition": {
              "templateType": {
                "type": "literal",
                "definition": "mustacheStringTemplate"
              },
              "definition": {
                "type": "string"
              }
            }
          },
          {
            "type": "object",
            "definition": {
              "templateType": {
                "type": "literal",
                "definition": "fullObjectTemplate"
              },
              "definition": {
                "type": "array",
                "definition": {
                  "type": "tuple",
                  "definition": [
                    {
                      "type": "schemaReference",
                      "definition": {
                        "relativePath": "objectTemplateInnerReference"
                      }
                    },
                    {
                      "type": "schemaReference",
                      "definition": {
                        "relativePath": "objectTemplate"
                      }
                    }
                  ]
                }
              }
            }
          }
        ]
      },
      "compositeActionTemplate": {
        "type": "union",
        "definition": [
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction"
            },
            "context": {}
          },
          {
            "type": "schemaReference",
            "definition": {
              "relativePath": "carryOnObject"
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