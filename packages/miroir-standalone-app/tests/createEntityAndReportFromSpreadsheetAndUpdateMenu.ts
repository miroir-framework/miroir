const createEntityAndReportFromSpreadsheetAndUpdateMenu = {
  "uuid": "ffe6ab3c-8296-4293-8aaf-ebbad1f0ac9a",
  "parentName": "Test",
  "parentUuid": "c37625c7-0b35-4d6a-811d-8181eb978301",
  "name": "createEntityAndReportFromSpreadsheetAndUpdateMenu",
  "selfApplication": "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  "branch": "ad1ddc4e-556e-4598-9cff-706a2bde0be7",
  "description": "First Test",
  "definition": {
    "testCompositeActions": {
      "create new Entity and reports from spreadsheet": {
        "testType": "testBuildPlusRuntimeCompositeAction",
        "testLabel": "createEntityAndReportFromSpreadsheetAndUpdateMenu",
        "compositeActionSequence": {
          "actionType": "compositeActionSequence",
          "actionLabel": "createEntityAndReportFromSpreadsheetAndUpdateMenu",
          "endpoint": "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
          "payload": {
            "templates": {
              "createEntity_newEntity": {
                "transformerType": "createObject",
                "definition": {
                  "uuid": {
                    "transformerType": "getFromParameters",
                    "referenceName": "newEntityUuid"
                  },
                  "parentUuid": {
                    "transformerType": "getFromParameters",
                    "referencePath": ["entityEntity", "uuid"]
                  },
                  "selfApplication": {
                    "transformerType": "getFromParameters",
                    "referenceName": "testSelfApplicationUuid"
                  },
                  "description": {
                    "transformerType": "getFromParameters",
                    "referenceName": "createEntity_newEntityDescription"
                  },
                  "name": {
                    "transformerType": "getFromParameters",
                    "referenceName": "newEntityName"
                  }
                }
              },
              "createEntity_newEntityDefinition": {
                "transformerType": "createObject",
                "definition": {
                  "name": {
                    "transformerType": "getFromParameters",
                    "referenceName": "newEntityName"
                  },
                  "uuid": {
                    "transformerType": "getFromParameters",
                    "referenceName": "newEntityDefinitionUuid"
                  },
                  "parentName": "EntityDefinition",
                  "parentUuid": {
                    "transformerType": "getFromParameters",
                    "referencePath": ["entityEntityDefinition", "uuid"]
                  },
                  "entityUuid": {
                    "transformerType": "getFromParameters",
                    "referencePath": ["createEntity_newEntity", "uuid"]
                  },
                  "conceptLevel": "Model",
                  "defaultInstanceDetailsReportUuid": {
                    "transformerType": "getFromParameters",
                    "referenceName": "defaultInstanceDetailsReportUuid"
                  },
                  "mlSchema": {
                    "transformerType": "getFromParameters",
                    "referenceName": "newEntityJzodSchema"
                  }
                }
              },
              "newEntityListReport": {
                "transformerType": "createObject",
                "definition": {
                  "uuid": {
                    "transformerType": "getFromParameters",
                    "referenceName": "createEntity_newEntityListReportUuid"
                  },
                  "selfApplication": {
                    "transformerType": "getFromParameters",
                    "referenceName": "testSelfApplicationUuid"
                  },
                  "parentName": {
                    "transformerType": "returnValue",
                    "value": "Report"
                  },
                  "parentUuid": {
                    "transformerType": "mustacheStringTemplate",
                    "definition": "{{entityReport.uuid}}"
                  },
                  "conceptLevel": "model",
                  "name": {
                    "transformerType": "mustacheStringTemplate",
                    "definition": "{{newEntityName}}List"
                  },
                  "defaultLabel": {
                    "transformerType": "mustacheStringTemplate",
                    "definition": "List of {{newEntityName}}s"
                  },
                  "type": "list",
                  "definition": {
                    "transformerType": "createObject",
                    "definition": {
                      "extractors": {
                        "transformerType": "createObject",
                        "definition": {
                          "instanceList": {
                            "extractorOrCombinerType": "extractorInstancesByEntity",
                            "parentName": {
                              "transformerType": "getFromParameters",
                              "referenceName": "newEntityName"
                            },
                            "parentUuid": {
                              "transformerType": "mustacheStringTemplate",
                              "definition": "{{createEntity_newEntity.uuid}}"
                            }
                          }
                        }
                      },
                      "section": {
                        "transformerType": "createObject",
                        "definition": {
                          "type": {
                            "transformerType": "returnValue",
                            "value": "objectListReportSection"
                          },
                          "definition": {
                            "label": {
                              "transformerType": "mustacheStringTemplate",
                              "definition": "{{newEntityName}}s"
                            },
                            "parentUuid": {
                              "transformerType": "mustacheStringTemplate",
                              "definition": "{{createEntity_newEntity.uuid}}"
                            },
                            "fetchedDataReference": {
                              "transformerType": "returnValue",
                              "value": "instanceList"
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              "newEntityDetailsReport": {
                "transformerType": "createObject",
                "definition": {
                  "uuid": {
                    "transformerType": "getFromParameters",
                    "referenceName": "createEntity_newEntityDetailsReportUuid"
                  },
                  "selfApplication": {
                    "transformerType": "getFromParameters",
                    "referenceName": "testSelfApplicationUuid"
                  },
                  "parentName": {
                    "transformerType": "mustacheStringTemplate",
                    "definition": "{{entityReport.name}}"
                  },
                  "parentUuid": {
                    "transformerType": "mustacheStringTemplate",
                    "definition": "{{entityReport.uuid}}"
                  },
                  "conceptLevel": "Model",
                  "name": {
                    "transformerType": "mustacheStringTemplate",
                    "definition": "{{newEntityName}}Details"
                  },
                  "defaultLabel": {
                    "transformerType": "mustacheStringTemplate",
                    "definition": "Details of {{newEntityName}}"
                  },
                  "definition": {
                    "extractorTemplates": {
                      "elementToDisplay": {
                        "transformerType": "returnValue",
                        "value": {
                          "extractorOrCombinerType": "extractorByPrimaryKey",
                          "parentName": {
                            "transformerType": "getFromContext",
                            "referenceName": "newEntityName"
                          },
                          "parentUuid": {
                            "transformerType": "mustacheStringTemplate",
                            "definition": "{{newEntityUuid}}"
                          },
                          "instanceUuid": {
                            "transformerType": "returnValue",
                            "interpolation": "runtime",
                            "value": {
                              "transformerType": "getFromContext",
                              "interpolation": "runtime",
                              "referenceName": "instanceUuid"
                            }
                          }
                        }
                      }
                    },
                    "section": {
                      "type": "list",
                      "definition": [
                        {
                          "type": "objectInstanceReportSection",
                          "definition": {
                            "label": {
                              "transformerType": "mustacheStringTemplate",
                              "definition": "My {{newEntityName}}"
                            },
                            "parentUuid": {
                              "transformerType": "mustacheStringTemplate",
                              "definition": "{{newEntityUuid}}"
                            },
                            "fetchedDataReference": "elementToDisplay"
                          }
                        }
                      ]
                    }
                  }
                }
              }
            },
            "actionSequence": [
              {
                "actionType": "createEntity",
                "actionLabel": "createEntity",
                "endpoint": "7947ae40-eb34-4149-887b-15a9021e714e",
                "payload": {
                  "application": {
                    "transformerType": "getFromParameters",
                    "referenceName": "testApplicationUuid"
                  },
                  "entities": [
                    {
                      "entity": {
                        "transformerType": "getFromParameters",
                        "referenceName": "createEntity_newEntity"
                      },
                      "entityDefinition": {
                        "transformerType": "getFromParameters",
                        "referenceName": "createEntity_newEntityDefinition"
                      }
                    }
                  ]
                }
              },
              {
                "actionType": "transactionalInstanceAction",
                "endpoint": "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
                "actionLabel": "createReports",
                "payload": {
                  "application": {
                    "transformerType": "getFromParameters",
                    "referenceName": "testApplicationUuid"
                  },
                  "instanceAction": {
                    "actionType": "createInstance",
                    "endpoint": "ed520de4-55a9-4550-ac50-b1b713b72a89",
                    "payload": {
                      "application": {
                        "transformerType": "getFromParameters",
                        "referenceName": "testApplicationUuid"
                      },
                      "applicationSection": "model",
                      "objects": [
                        {
                          "transformerType": "getFromParameters",
                          "referenceName": "newEntityListReport"
                        },
                        {
                          "transformerType": "getFromParameters",
                          "referenceName": "newEntityDetailsReport"
                        }
                      ]
                    }
                  }
                }
              },
              {
                "actionType": "commit",
                "actionLabel": "commit",
                "endpoint": "7947ae40-eb34-4149-887b-15a9021e714e",
                "payload": {
                  "application": {
                    "transformerType": "getFromParameters",
                    "referenceName": "testApplicationUuid"
                  }
                }
              },
              {
                "actionType": "compositeRunBoxedQueryAction",
                "endpoint": "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
                "actionLabel": "getListOfEntityDefinitions",
                "nameGivenToResult": "newApplicationEntityDefinitionList",
                "payload": {
                  "actionType": "runBoxedQueryAction",
                  "endpoint": "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  "payload": {
                    "application": {
                      "transformerType": "getFromParameters",
                      "referenceName": "testApplicationUuid"
                    },
                    "applicationSection": "model",
                    "query": {
                      "queryType": "boxedQueryWithExtractorCombinerTransformer",
                      "application": {
                        "transformerType": "getFromParameters",
                        "referenceName": "testApplicationUuid"
                      },
                      "pageParams": {
                        "currentDeploymentUuid": {
                          "transformerType": "getFromParameters",
                          "referenceName": "testDeploymentUuid"
                        }
                      },
                      "queryParams": {},
                      "contextResults": {},
                      "extractors": {
                        "entityDefinitions": {
                          "extractorOrCombinerType": "extractorInstancesByEntity",
                          "applicationSection": "model",
                          "parentName": {
                            "transformerType": "getFromParameters",
                            "referencePath": ["entityEntityDefinition", "name"]
                          },
                          "parentUuid": {
                            "transformerType": "getFromParameters",
                            "referencePath": ["entityEntityDefinition", "uuid"]
                          },
                          "orderBy": {
                            "attributeName": "name",
                            "direction": "ASC"
                          }
                        }
                      }
                    }
                  }
                }
              },
              {
                "actionType": "compositeRunBoxedQueryAction",
                "endpoint": "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
                "actionLabel": "getListOfEntities",
                "nameGivenToResult": "newApplicationEntityList",
                "payload": {
                  "actionType": "runBoxedQueryAction",
                  "endpoint": "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  "payload": {
                    "application": {
                      "transformerType": "getFromParameters",
                      "referenceName": "testApplicationUuid"
                    },
                    "applicationSection": "model",
                    "query": {
                      "queryType": "boxedQueryWithExtractorCombinerTransformer",
                      "application": {
                        "transformerType": "getFromParameters",
                        "referenceName": "testApplicationUuid"
                      },
                      "pageParams": {
                        "currentApplicationUuid": {
                          "transformerType": "getFromParameters",
                          "referenceName": "testApplicationUuid"
                        }
                      },
                      "queryParams": {},
                      "contextResults": {},
                      "extractors": {
                        "entities": {
                          "extractorOrCombinerType": "extractorInstancesByEntity",
                          "applicationSection": "model",
                          "parentName": {
                            "transformerType": "getFromParameters",
                            "referencePath": ["entityEntity", "name"]
                          },
                          "parentUuid": {
                            "transformerType": "getFromParameters",
                            "referencePath": ["entityEntity", "uuid"]
                          },
                          "orderBy": {
                            "attributeName": "name",
                            "direction": "ASC"
                          }
                        }
                      }
                    }
                  }
                }
              },
              {
                "actionType": "compositeRunBoxedQueryAction",
                "endpoint": "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
                "actionLabel": "getListOfReports",
                "nameGivenToResult": "newApplicationReportList",
                "payload": {
                  "actionType": "runBoxedQueryAction",
                  "endpoint": "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  "payload": {
                    "application": {
                      "transformerType": "getFromParameters",
                      "referenceName": "testApplicationUuid"
                    },
                    "applicationSection": "model",
                    "query": {
                      "queryType": "boxedQueryWithExtractorCombinerTransformer",
                      "application": {
                        "transformerType": "getFromParameters",
                        "referenceName": "testApplicationUuid"
                      },
                      "pageParams": {
                        "currentApplicationUuid": {
                          "transformerType": "getFromParameters",
                          "referenceName": "testApplicationUuid"
                        }
                      },
                      "runAsSql": true,
                      "queryParams": {},
                      "contextResults": {},
                      "extractors": {
                        "reports": {
                          "extractorOrCombinerType": "extractorInstancesByEntity",
                          "applicationSection": "model",
                          "parentName": {
                            "transformerType": "getFromParameters",
                            "referencePath": ["entityReport", "name"]
                          },
                          "parentUuid": {
                            "transformerType": "getFromParameters",
                            "referencePath": ["entityReport", "uuid"]
                          },
                          "orderBy": {
                            "attributeName": "name",
                            "direction": "ASC"
                          }
                        }
                      }
                    }
                  }
                }
              },
              {
                "actionType": "compositeRunBoxedQueryAction",
                "endpoint": "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
                "actionLabel": "getMenu",
                "nameGivenToResult": "menuUpdateQueryResult",
                "payload": {
                  "actionType": "runBoxedQueryAction",
                  "endpoint": "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  "payload": {
                    "application": {
                      "transformerType": "getFromParameters",
                      "referenceName": "testApplicationUuid"
                    },
                    "applicationSection": "model",
                    "query": {
                      "queryType": "boxedQueryWithExtractorCombinerTransformer",
                      "application": {
                        "transformerType": "getFromParameters",
                        "referenceName": "testApplicationUuid"
                      },
                      "pageParams": {},
                      "queryParams": {},
                      "contextResults": {},
                      "extractors": {
                        "menuList": {
                          "extractorOrCombinerType": "extractorInstancesByEntity",
                          "applicationSection": "model",
                          "parentName": {
                            "transformerType": "getFromParameters",
                            "referencePath": ["entityMenu", "name"]
                          },
                          "parentUuid": {
                            "transformerType": "getFromParameters",
                            "referencePath": ["entityMenu", "uuid"]
                          }
                        }
                      },
                      "runtimeTransformers": {
                        "menu": {
                          "transformerType": "pickFromList",
                          "interpolation": "runtime",
                          "applyTo": {
                            "transformerType": "getFromContext",
                            "interpolation": "runtime",
                            "referenceName": "menuList"
                          },
                          "index": 0
                        },
                        "menuItem": {
                          "transformerType": "createObject",
                          "interpolation": "runtime",
                          "definition": {
                            "reportUuid": {
                              "transformerType": "getFromParameters",
                              "referenceName": "createEntity_newEntityListReportUuid"
                            },
                            "label": {
                              "transformerType": "mustacheStringTemplate",
                              "definition": "List of {{newEntityName}}s"
                            },
                            "section": "data",
                            "selfApplication": {
                              "transformerType": "getFromParameters",
                              "referencePath": ["adminConfigurationDeploymentParis", "uuid"]
                            },
                            "icon": "local_drink"
                          }
                        },
                        "updatedMenu": {
                          "transformerType": "transformer_menu_addItem",
                          "interpolation": "runtime",
                          "menuItemReference": {
                            "transformerType": "getFromContext",
                            "interpolation": "runtime",
                            "referenceName": "menuItem"
                          },
                          "menuReference": {
                            "transformerType": "getFromContext",
                            "interpolation": "runtime",
                            "referenceName": "menu"
                          },
                          "menuSectionItemInsertionIndex": -1
                        }
                      }
                    }
                  }
                }
              },
              {
                "actionType": "transactionalInstanceAction",
                "endpoint": "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
                "actionLabel": "updateMenu",
                "payload": {
                  "application": {
                    "transformerType": "getFromParameters",
                    "referenceName": "testApplicationUuid"
                  },
                  "instanceAction": {
                    "actionType": "updateInstance",
                    "endpoint": "ed520de4-55a9-4550-ac50-b1b713b72a89",
                    "payload": {
                      "application": {
                        "transformerType": "getFromParameters",
                        "referenceName": "testApplicationUuid"
                      },
                      "applicationSection": "model",
                      "objects": [
                        {
                          "parentName": {
                            "transformerType": "getFromParameters",
                            "referencePath": ["entityMenu", "name"]
                          },
                          "parentUuid": {
                            "transformerType": "getFromParameters",
                            "referencePath": ["entityMenu", "uuid"]
                          },
                          "applicationSection": "model",
                          "instances": [
                            {
                              "transformerType": "getFromContext",
                              "interpolation": "runtime",
                              "referencePath": ["menuUpdateQueryResult", "updatedMenu"]
                            }
                          ]
                        }
                      ]
                    }
                  }
                }
              },
              {
                "actionType": "commit",
                "actionLabel": "commit",
                "endpoint": "7947ae40-eb34-4149-887b-15a9021e714e",
                "payload": {
                  "application": {
                    "transformerType": "getFromParameters",
                    "referenceName": "testApplicationUuid"
                  }
                }
              },
              {
                "actionType": "compositeRunBoxedQueryAction",
                "endpoint": "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
                "actionLabel": "getNewMenuList",
                "nameGivenToResult": "newMenuList",
                "payload": {
                  "actionType": "runBoxedQueryAction",
                  "endpoint": "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  "payload": {
                    "application": {
                      "transformerType": "getFromParameters",
                      "referenceName": "testApplicationUuid"
                    },
                    "applicationSection": "model",
                    "query": {
                      "queryType": "boxedQueryWithExtractorCombinerTransformer",
                      "application": {
                        "transformerType": "getFromParameters",
                        "referenceName": "testApplicationUuid"
                      },
                      "pageParams": {},
                      "queryParams": {},
                      "contextResults": {},
                      "extractors": {
                        "menuList": {
                          "extractorOrCombinerType": "extractorInstancesByEntity",
                          "applicationSection": "model",
                          "parentName": "Menu",
                          "parentUuid": {
                            "transformerType": "getFromParameters",
                            "referencePath": ["entityMenu", "uuid"]
                          }
                        }
                      }
                    }
                  }
                }
              }
            ]
          }
        },
        "testCompositeActionAssertions": [
          {
            "actionType": "compositeRunTestAssertion",
            "actionLabel": "checkEntities",
            "nameGivenToResult": "checkEntityList",
            "testAssertion": {
              "testType": "testAssertion",
              "testLabel": "checkEntities",
              "definition": {
                "resultAccessPath": ["newApplicationEntityList", "entities"],
                "ignoreAttributes": [
                  "author",
                  "conceptLevel",
                  "parentDefinitionVersionUuid",
                  "parentName"
                ],
                "expectedValue": [
                  {
                    "uuid": {
                      "transformerType": "getFromParameters",
                      "referenceName": "newEntityUuid"
                    },
                    "parentUuid": {
                      "transformerType": "getFromParameters",
                      "referencePath": ["entityEntity", "uuid"]
                    },
                    "selfApplication": {
                      "transformerType": "getFromParameters",
                      "referenceName": "testSelfApplicationUuid"
                    },
                    "description": {
                      "transformerType": "getFromParameters",
                      "referenceName": "createEntity_newEntityDescription"
                    },
                    "name": {
                      "transformerType": "getFromParameters",
                      "referenceName": "newEntityName"
                    }
                  }
                ]
              }
            }
          },
          {
            "actionType": "compositeRunTestAssertion",
            "actionLabel": "checkEntityDefinitions",
            "nameGivenToResult": "checkEntityDefinitionList",
            "testAssertion": {
              "testType": "testAssertion",
              "testLabel": "checkEntityDefinitions",
              "definition": {
                "resultAccessPath": ["newApplicationEntityDefinitionList", "entityDefinitions"],
                "ignoreAttributes": [
                  "author",
                  "conceptLevel",
                  "description",
                  "icon",
                  "parentDefinitionVersionUuid",
                  "parentName",
                  "viewAttributes"
                ],
                "expectedValue": [
                  {
                    "name": {
                      "transformerType": "getFromParameters",
                      "referenceName": "newEntityName"
                    },
                    "uuid": {
                      "transformerType": "getFromParameters",
                      "referenceName": "newEntityDefinitionUuid"
                    },
                    "parentName": "EntityDefinition",
                    "parentUuid": {
                      "transformerType": "getFromParameters",
                      "referencePath": ["entityEntityDefinition", "uuid"]
                    },
                    "entityUuid": {
                      "transformerType": "getFromParameters",
                      "referencePath": ["newEntityUuid"]
                    },
                    "conceptLevel": "Model",
                    "defaultInstanceDetailsReportUuid": {
                      "transformerType": "getFromParameters",
                      "referenceName": "defaultInstanceDetailsReportUuid"
                    },
                    "mlSchema": {
                      "transformerType": "getFromParameters",
                      "referenceName": "newEntityJzodSchema"
                    }
                  }
                ]
              }
            }
          },
          {
            "actionType": "compositeRunTestAssertion",
            "actionLabel": "checkReports",
            "nameGivenToResult": "checkReportList",
            "testAssertion": {
              "testType": "testAssertion",
              "testLabel": "checkReports",
              "definition": {
                "resultAccessPath": ["newApplicationReportList", "reports"],
                "ignoreAttributes": ["author", "parentDefinitionVersionUuid", "type"],
                "expectedValue": [
                  {
                    "transformerType": "getFromParameters",
                    "referenceName": "newEntityListReport"
                  },
                  {
                    "transformerType": "getFromParameters",
                    "referenceName": "newEntityDetailsReport"
                  }
                ]
              }
            }
          },
          {
            "actionType": "compositeRunTestAssertion",
            "actionLabel": "checkMenus",
            "nameGivenToResult": "checkMenuList",
            "testAssertion": {
              "testType": "testAssertion",
              "testLabel": "checkMenus",
              "definition": {
                "resultAccessPath": ["newMenuList", "menuList"],
                "ignoreAttributes": ["author"],
                "expectedValue": [
                  {
                    "uuid": "dd168e5a-2a21-4d2d-a443-032c6d15eb22",
                    "parentName": "Menu",
                    "parentUuid": "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
                    "parentDefinitionVersionUuid": null,
                    "name": "LibraryMenu",
                    "defaultLabel": "Meta-Model",
                    "description": "This is the default menu allowing to explore the Library SelfApplication.",
                    "definition": {
                      "menuType": "complexMenu",
                      "definition": [
                        {
                          "items": [
                            {
                              "icon": "category",
                              "label": "Library Entities",
                              "section": "model",
                              "reportUuid": "c9ea3359-690c-4620-9603-b5b402e4a2b9",
                              "selfApplication": "f714bb2f-a12d-4e71-a03b-74dcedea6eb4"
                            },
                            {
                              "icon": "category",
                              "label": "Library Entity Definitions",
                              "section": "model",
                              "reportUuid": "f9aff35d-8636-4519-8361-c7648e0ddc68",
                              "selfApplication": "f714bb2f-a12d-4e71-a03b-74dcedea6eb4"
                            },
                            {
                              "icon": "list",
                              "label": "Library Reports",
                              "section": "model",
                              "reportUuid": "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855",
                              "selfApplication": "f714bb2f-a12d-4e71-a03b-74dcedea6eb4"
                            },
                            {
                              "icon": "auto_stories",
                              "label": "Library Books",
                              "section": "data",
                              "reportUuid": "74b010b6-afee-44e7-8590-5f0849e4a5c9",
                              "selfApplication": "f714bb2f-a12d-4e71-a03b-74dcedea6eb4"
                            },
                            {
                              "icon": "star",
                              "label": "Library Authors",
                              "section": "data",
                              "reportUuid": "66a09068-52c3-48bc-b8dd-76575bbc8e72",
                              "selfApplication": "f714bb2f-a12d-4e71-a03b-74dcedea6eb4"
                            },
                            {
                              "icon": "account_balance",
                              "label": "Library Publishers",
                              "section": "data",
                              "reportUuid": "a77aa662-006d-46cd-9176-01f02a1a12dc",
                              "selfApplication": "f714bb2f-a12d-4e71-a03b-74dcedea6eb4"
                            },
                            {
                              "icon": "flag",
                              "label": "Library countries",
                              "section": "data",
                              "reportUuid": "08176cc7-43ae-4fca-91b7-bf869d19e4b9",
                              "selfApplication": "f714bb2f-a12d-4e71-a03b-74dcedea6eb4"
                            },
                            {
                              "icon": "person",
                              "label": "Library Users",
                              "section": "data",
                              "reportUuid": "3df9413d-5050-4357-910c-f764aacae7e6",
                              "selfApplication": "f714bb2f-a12d-4e71-a03b-74dcedea6eb4"
                            },
                            {
                              "reportUuid": {
                                "transformerType": "getFromParameters",
                                "referenceName": "createEntity_newEntityListReportUuid"
                              },
                              "label": {
                                "transformerType": "mustacheStringTemplate",
                                "definition": "List of {{newEntityName}}s"
                              },
                              "section": "data",
                              "selfApplication": {
                                "transformerType": "getFromParameters",
                                "referencePath": ["adminConfigurationDeploymentParis", "uuid"]
                              },
                              "icon": "local_drink"
                            }
                          ],
                          "label": "library",
                          "title": "Library"
                        }
                      ]
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
}


const entityDefinition = {
  "parentName": "EntityDefinition",
  "name": "Test",
  "uuid": "d2842a84-3e66-43ee-ac58-7e13b95b01e8",
  "parentUuid": "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
  "entityUuid": "c37625c7-0b35-4d6a-811d-8181eb978301",
  "conceptLevel": "Model",
  "defaultInstanceDetailsReportUuid": "d65d8dc8-2a7f-4111-81b1-0324e816c1a8",
  "cache": {
    "cacheAllInstancesOnRefresh": true
  },
  "mlSchema": {
    "type": "object",
    "extend": {
      "type": "schemaReference",
       "definition": {
        "eager": true,
        "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        "relativePath": "entityDefinitionRoot"
       }
    },
    "definition": {
      "selfApplication": {
        "type": "uuid",
        "tag": {
          "value": {
            "id": 9,
            "defaultLabel": "SelfApplication",
              "description": "The SelfApplication this Test belongs to",
              "display": { "editable": false },
              "foreignKeyParams": {
                "targetEntity": "a659d350-dd97-4da9-91de-524fa01745dc",
                "targetEntityOrderInstancesBy": "name"
              }
            }
          }
      },
      "branch": {
        "type": "uuid",
        "tag": {
          "value": {
            "id": 10,
            "defaultLabel": "Branch",
            "description": "The Branch of the SelfApplication",
            "display": { "editable": false }
          }
        }
      },
      "name": {
        "type": "string",
        "optional": true,
        "tag": {
          "value": {
            "id": 1,
            "defaultLabel": "Name",
            "display": { "editable": true }
          }
        }
      },
      "description": {
        "type": "string",
        "optional": true,
        "tag": {
          "value": {
            "id": 1,
            "defaultLabel": "Name",
            "display": { "editable": true }
          }
        }
      },
      "definition": {
        "type": "object",
        "definition": {
          "testCompositeActions": {
            "type": "record",
            "optional": true,
            "definition": {
              "type": "schemaReference",
              "definition": {
                "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                "relativePath": "testBuildPlusRuntimeCompositeAction"
              }
            }
          },
          "fullTestDefinition": {
            "type": "union",
            "optional": true,
            "discriminator": "testType",
            "definition": [
              {
                "type": "object",
                "definition": {
                  "testType": {
                    "type": "literal",
                    "definition": "testCompositeAction"
                  },
                  "testLabel": {
                    "type": "string"
                  },
                  "beforeTestSetupAction": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionSequence"
                    }
                  },
                  "afterTestCleanupAction": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionSequence"
                    }
                  },
                  "compositeActionSequence": {
                    "type": "schemaReference",
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionSequence"
                    }
                  },
                  "testCompositeActionAssertions": {
                    "type": "array",
                    "definition": {
                      "type": "schemaReference",
                      "definition": {
                        "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        "relativePath": "compositeRunTestAssertion"
                      }
                    }
                  }
                }
              },
              {
                "type": "object",
                "definition": {
                  "testType": {
                    "type": "literal",
                    "definition": "testCompositeActionSuite"
                  },
                  "testLabel": {
                    "type": "string"
                  },
                  "beforeAll": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionSequence"
                    }
                  },
                  "beforeEach": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionSequence"
                    }
                  },
                  "afterEach": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionSequence"
                    }
                  },
                  "afterAll": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionSequence"
                    }
                  },
                  "testCompositeActions": {
                    "type": "record",
                    "definition": {
                      "type": "schemaReference",
                      "definition": {
                        "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        "relativePath": "testCompositeAction"
                      }
                    }
                  }
                }
              },
              {
                "type": "object",
                "definition": {
                  "testType": {
                    "type": "literal",
                    "definition": "testBuildCompositeAction"
                  },
                  "testLabel": {
                    "type": "string"
                  },
                  "beforeTestSetupAction": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionSequence"
                    }
                  },
                  "afterTestCleanupAction": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionSequence"
                    }
                  },
                  "compositeActionSequence": {
                    "type": "schemaReference",
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionSequenceTemplate"
                    }
                  },
                  "testCompositeActionAssertions": {
                    "type": "array",
                    "definition": {
                      "type": "schemaReference",
                      "definition": {
                        "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        "relativePath": "compositeRunTestAssertion"
                      }
                    }
                  }
                }
              },
              {
                "type": "object",
                "definition": {
                  "testType": {
                    "type": "literal",
                    "definition": "testBuildCompositeActionSuite"
                  },
                  "testLabel": {
                    "type": "string"
                  },
                  "beforeAll": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionSequence"
                    }
                  },
                  "beforeEach": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionSequence"
                    }
                  },
                  "afterEach": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionSequence"
                    }
                  },
                  "afterAll": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionSequence"
                    }
                  },
                  "testCompositeActions": {
                    "type": "record",
                    "definition": {
                      "type": "schemaReference",
                      "definition": {
                        "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        "relativePath": "testBuildCompositeAction"
                      }
                    }
                  }
                }
              },
              {
                "type": "object",
                "definition": {
                  "testType": {
                    "type": "literal",
                    "definition": "testBuildPlusRuntimeCompositeAction"
                  },
                  "testLabel": {
                    "type": "string"
                  },
                  "testParams": {
                    "type": "record",
                    "optional": true,
                    "definition": {
                      "type": "any"
                    }
                  },
                  "beforeTestSetupAction": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionSequence"
                    }
                  },
                  "afterTestCleanupAction": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionSequence"
                    }
                  },
                  "compositeActionSequence": {
                    "type": "schemaReference",
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionSequenceTemplate"
                    }
                  },
                  "testCompositeActionAssertions": {
                    "type": "array",
                    "definition": {
                      "type": "schemaReference",
                      "definition": {
                        "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        "relativePath": "compositeRunTestAssertion"
                      }
                    }
                  }
                }
              },
              {
                "type": "object",
                "definition": {
                  "testType": {
                    "type": "literal",
                    "definition": "testBuildPlusRuntimeCompositeActionSuite"
                  },
                  "testLabel": {
                    "type": "string"
                  },
                  "testParams": {
                    "type": "record",
                    "optional": true,
                    "definition": {
                      "type": "any"
                    }
                  },
                  "beforeAll": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionSequence"
                    }
                  },
                  "beforeEach": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionSequence"
                    }
                  },
                  "afterEach": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionSequence"
                    }
                  },
                  "afterAll": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionSequence"
                    }
                  },
                  "testCompositeActions": {
                    "type": "record",
                    "definition": {
                      "type": "schemaReference",
                      "definition": {
                        "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        "relativePath": "testBuildPlusRuntimeCompositeAction"
                      }
                    }
                  }
                }
              },
              {
                "type": "object",
                "definition": {
                  "testType": {
                    "type": "literal",
                    "definition": "testCompositeActionTemplate"
                  },
                  "testLabel": {
                    "type": "string"
                  },
                  "beforeTestSetupAction": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionTemplate"
                    }
                  },
                  "afterTestCleanupAction": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionTemplate"
                    }
                  },
                  "compositeActionTemplate": {
                    "type": "schemaReference",
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionTemplate"
                    }
                  },
                  "testCompositeActionAssertions": {
                    "type": "array",
                    "definition": {
                      "type": "schemaReference",
                      "definition": {
                        "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        "relativePath": "compositeRunTestAssertion"
                      }
                    }
                  }
                }
              },
              {
                "type": "object",
                "definition": {
                  "testType": {
                    "type": "literal",
                    "definition": "testCompositeActionTemplateSuite"
                  },
                  "testLabel": {
                    "type": "string"
                  },
                  "testApplication": {
                    "type": "uuid",
                    "tag": {
                      "value": {
                        "canBeTemplate": true,
                        "defaultLabel": "Test Application",
                        "foreignKeyParams": {
                          "targetEntity": "25d935e7-9e93-42c2-aade-0472b883492b",
                          "targetEntityOrderInstancesBy": "name"
                        }
                      }
                    }
                  },
                  "beforeAll": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionTemplate"
                    }
                  },
                  "beforeEach": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionTemplate"
                    }
                  },
                  "afterEach": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionTemplate"
                    }
                  },
                  "afterAll": {
                    "type": "schemaReference",
                    "optional": true,
                    "definition": {
                      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                      "relativePath": "compositeActionTemplate"
                    }
                  },
                  "testCompositeActions": {
                    "type": "record",
                    "definition": {
                      "type": "schemaReference",
                      "definition": {
                        "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        "relativePath": "testCompositeActionTemplate"
                      }
                    }
                  }
                }
              },
              {
                "type": "object",
                "definition": {
                  "testType": {
                    "type": "literal",
                    "definition": "testAssertion"
                  },
                  "testLabel": {
                    "type": "string"
                  },
                  "definition": {
                    "type": "object",
                    "definition": {
                      "resultAccessPath": {
                        "type": "array",
                        "optional": true,
                        "definition": {
                          "type": "string"
                        }
                      },
                      "resultTransformer": {
                        "type": "schemaReference",
                        "optional": true,
                        "definition": {
                          "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                          "relativePath": "coreTransformerForBuildPlusRuntime"
                        }
                      },
                      "ignoreAttributes": {
                        "type": "array",
                        "optional": true,
                        "definition": {
                          "type": "string"
                        }
                      },
                      "expectedValue": {
                        "type": "any"
                      }
                    }
                  }
                }
              }
            ]
          }
        }
      }
    }
  }
}