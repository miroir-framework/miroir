import {getLocalCacheIndexDeploymentSection, getLocalCacheIndexDeploymentUuid, getLocalCacheIndexEntityUuid, getLocalCacheKeysDeploymentSectionEntitiesList, getLocalCacheKeysDeploymentSectionList, getLocalCacheKeysDeploymentUuidList, getLocalCacheKeysForDeploymentSection, getLocalCacheKeysForDeploymentUuid, localCacheStateToDomainState} from "../src/4_services/localStore/LocalCacheSlice";
import { LocalCacheDeploymentSectionEntitySliceState } from "../src/4_services/localStore/localStoreInterface";

const exampleSliceState:LocalCacheDeploymentSectionEntitySliceState = {
    '10ff36f2-50a3-48d8-b80f-e48e5d13af8e_model_16dbfe28-e1d7-4f20-9ba4-c1a9873202ad': {
      ids: [
        '16dbfe28-e1d7-4f20-9ba4-c1a9873202ad',
        '35c5608a-7678-4f07-a4ec-76fc5bc35424',
        '3f2baa83-3ef7-45ce-82ea-6a43f7a8c916',
        '54b9c72f-d4f3-4db9-9e0e-0dc840b530bd',
        '5e81e1b9-38be-487c-b3e5-53796c57fccf',
        '7990c0c9-86c3-40a1-a121-036c91b55ed7',
        '8bec933d-6287-4de7-8a88-5c24216de9f4',
        'a659d350-dd97-4da9-91de-524fa01745dc',
        'c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24',
        'cdb0aec6-b848-43ac-a058-fe2dbe5811f1'
      ],
      entities: {
        '16dbfe28-e1d7-4f20-9ba4-c1a9873202ad': {
          uuid: '16dbfe28-e1d7-4f20-9ba4-c1a9873202ad',
          parentName: 'Entity',
          parentUuid: '16dbfe28-e1d7-4f20-9ba4-c1a9873202ad',
          name: 'Entity',
          application: '360fcf1f-f0d4-4f8a-9262-07886e70fa15',
          conceptLevel: 'MetaModel',
          description: 'The Metaclass for entities.'
        },
        '35c5608a-7678-4f07-a4ec-76fc5bc35424': {
          uuid: '35c5608a-7678-4f07-a4ec-76fc5bc35424',
          parentName: 'Entity',
          parentUuid: '16dbfe28-e1d7-4f20-9ba4-c1a9873202ad',
          name: 'ApplicationDeployment',
          application: '360fcf1f-f0d4-4f8a-9262-07886e70fa15',
          conceptLevel: 'Model',
          description: 'An Application Deployment'
        },
        '3f2baa83-3ef7-45ce-82ea-6a43f7a8c916': {
          uuid: '3f2baa83-3ef7-45ce-82ea-6a43f7a8c916',
          parentName: 'Entity',
          parentUuid: '16dbfe28-e1d7-4f20-9ba4-c1a9873202ad',
          name: 'Report',
          application: '360fcf1f-f0d4-4f8a-9262-07886e70fa15',
          conceptLevel: 'Model',
          description: 'Report, allowing to display model instances'
        },
        '54b9c72f-d4f3-4db9-9e0e-0dc840b530bd': {
          uuid: '54b9c72f-d4f3-4db9-9e0e-0dc840b530bd',
          parentName: 'Entity',
          parentUuid: '16dbfe28-e1d7-4f20-9ba4-c1a9873202ad',
          name: 'EntityDefinition',
          application: '360fcf1f-f0d4-4f8a-9262-07886e70fa15',
          conceptLevel: 'MetaModel',
          description: 'The Metaclass for the definition of entities.'
        },
        '5e81e1b9-38be-487c-b3e5-53796c57fccf': {
          uuid: '5e81e1b9-38be-487c-b3e5-53796c57fccf',
          parentName: 'Entity',
          parentUuid: '16dbfe28-e1d7-4f20-9ba4-c1a9873202ad',
          name: 'JzodSchema',
          application: '360fcf1f-f0d4-4f8a-9262-07886e70fa15',
          conceptLevel: 'Model',
          description: 'Common Jzod Schema definitions, available to all Entity definitions'
        },
        '7990c0c9-86c3-40a1-a121-036c91b55ed7': {
          uuid: '7990c0c9-86c3-40a1-a121-036c91b55ed7',
          parentName: 'Entity',
          parentUuid: '16dbfe28-e1d7-4f20-9ba4-c1a9873202ad',
          name: 'StoreBasedConfiguration',
          application: '360fcf1f-f0d4-4f8a-9262-07886e70fa15',
          conceptLevel: 'Model',
          description: 'A configuration of storage-related aspects of a Model.'
        },
        '8bec933d-6287-4de7-8a88-5c24216de9f4': {
          uuid: '8bec933d-6287-4de7-8a88-5c24216de9f4',
          parentName: 'Entity',
          parentUuid: '16dbfe28-e1d7-4f20-9ba4-c1a9873202ad',
          name: 'ApplicationVersionCrossEntityDefinition',
          application: '360fcf1f-f0d4-4f8a-9262-07886e70fa15',
          conceptLevel: 'Model',
          description: 'The (many-to-many) sssociation among ApplicationVersions and EntityDefinitions.'
        },
        'a659d350-dd97-4da9-91de-524fa01745dc': {
          uuid: 'a659d350-dd97-4da9-91de-524fa01745dc',
          parentName: 'Entity',
          parentUuid: '16dbfe28-e1d7-4f20-9ba4-c1a9873202ad',
          name: 'Application',
          application: '360fcf1f-f0d4-4f8a-9262-07886e70fa15',
          conceptLevel: 'Model',
          description: 'An Application'
        },
        'c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24': {
          uuid: 'c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24',
          parentName: 'Entity',
          parentUuid: '16dbfe28-e1d7-4f20-9ba4-c1a9873202ad',
          name: 'ApplicationVersion',
          application: '360fcf1f-f0d4-4f8a-9262-07886e70fa15',
          conceptLevel: 'Model',
          description: 'A Version of an Application'
        },
        'cdb0aec6-b848-43ac-a058-fe2dbe5811f1': {
          uuid: 'cdb0aec6-b848-43ac-a058-fe2dbe5811f1',
          parentName: 'Entity',
          parentUuid: '16dbfe28-e1d7-4f20-9ba4-c1a9873202ad',
          name: 'ApplicationModelBranch',
          application: '360fcf1f-f0d4-4f8a-9262-07886e70fa15',
          conceptLevel: 'Model',
          description: 'A Branch of an Application Model'
        }
      }
    },
    '10ff36f2-50a3-48d8-b80f-e48e5d13af8e_model_54b9c72f-d4f3-4db9-9e0e-0dc840b530bd': {
      ids: [
        '15407b85-f2c8-4a34-bfa7-89f044ba2407',
        '27046fce-742f-4cc4-bb95-76b271f490a5',
        '381ab1be-337f-4198-b1d3-f686867fc1dd',
        '69bf7c03-a1df-4d1c-88c1-44363feeea87',
        '9460420b-f176-4918-bd45-894ab195ffe9',
        '952d2c65-4da2-45c2-9394-a0920ceedfb6',
        'bd303ae8-6bce-4b44-a63c-815b9ebf728b',
        'bdd7ad43-f0fc-4716-90c1-87454c40dd95',
        'c0b71083-8cc8-43db-bf52-572f1f03bbb5',
        'f93af951-ea13-4815-a2e3-ec0cab1fadd2'
      ],
      entities: {
        '15407b85-f2c8-4a34-bfa7-89f044ba2407': {
          uuid: '15407b85-f2c8-4a34-bfa7-89f044ba2407',
          parentName: 'EntityDefinition',
          parentUuid: '54b9c72f-d4f3-4db9-9e0e-0dc840b530bd',
          entityUuid: '5e81e1b9-38be-487c-b3e5-53796c57fccf',
          conceptLevel: 'Model',
          name: 'JzodSchema',
          icon: 'Interests',
          jzodSchema: {
            type: 'object',
            definition: {
              jzodArraySchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    type: 'record',
                    definition: {
                      type: 'simpleType',
                      definition: 'any'
                    },
                    optional: true
                  },
                  type: {
                    type: 'literal',
                    definition: 'array'
                  },
                  definition: {
                    type: 'schemaReference',
                    relativePath: 'jzodElementSchema'
                  }
                }
              },
              jzodAttributeSchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    type: 'record',
                    definition: {
                      type: 'simpleType',
                      definition: 'any'
                    },
                    optional: true
                  },
                  type: {
                    type: 'literal',
                    definition: 'simpleType'
                  },
                  definition: {
                    type: 'schemaReference',
                    relativePath: 'jzodEnumTypesSchema'
                  }
                }
              },
              jzodAttributeStringWithValidationsSchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    type: 'record',
                    definition: {
                      type: 'simpleType',
                      definition: 'any'
                    },
                    optional: true
                  },
                  type: {
                    type: 'literal',
                    definition: 'simpleType'
                  },
                  definition: {
                    type: 'literal',
                    definition: 'string'
                  },
                  validations: {
                    type: 'array',
                    definition: {
                      type: 'schemaReference',
                      relativePath: 'jzodAttributeStringValidationsSchema'
                    }
                  }
                }
              },
              jzodAttributeStringValidationsSchema: {
                type: 'object',
                definition: {
                  extra: {
                    optional: true,
                    type: 'object',
                    definition: {
                      id: {
                        type: 'simpleType',
                        definition: 'number'
                      },
                      defaultLabel: {
                        type: 'simpleType',
                        definition: 'string'
                      },
                      editable: {
                        type: 'simpleType',
                        definition: 'boolean'
                      }
                    }
                  },
                  type: {
                    type: 'enum',
                    definition: [
                      'max',
                      'min',
                      'length',
                      'email',
                      'url',
                      'emoji',
                      'uuid',
                      'cuid',
                      'cuid2',
                      'ulid',
                      'regex',
                      'includes',
                      'startsWith',
                      'endsWith',
                      'datetime',
                      'ip'
                    ]
                  },
                  parameter: {
                    type: 'simpleType',
                    definition: 'any'
                  }
                }
              },
              jzodElementSchema: {
                type: 'union',
                definition: [
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodArraySchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodAttributeSchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodAttributeStringWithValidationsSchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodEnumSchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodFunctionSchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodLazySchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodLiteralSchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodObjectSchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodRecordSchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodReferenceSchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodUnionSchema'
                  }
                ]
              },
              jzodElementSetSchema: {
                type: 'record',
                definition: {
                  type: 'schemaReference',
                  relativePath: 'jzodElementSchema'
                }
              },
              jzodEnumSchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    type: 'record',
                    definition: {
                      type: 'simpleType',
                      definition: 'any'
                    },
                    optional: true
                  },
                  type: {
                    type: 'literal',
                    definition: 'enum'
                  },
                  definition: {
                    type: 'array',
                    definition: {
                      type: 'simpleType',
                      definition: 'string'
                    }
                  }
                }
              },
              jzodEnumTypesSchema: {
                type: 'enum',
                definition: [
                  'any',
                  'boolean',
                  'number',
                  'string',
                  'uuid'
                ]
              },
              jzodFunctionSchema: {
                type: 'object',
                definition: {
                  type: {
                    type: 'literal',
                    definition: 'function'
                  },
                  args: {
                    type: 'array',
                    definition: {
                      type: 'schemaReference',
                      relativePath: 'jzodAttributeSchema'
                    }
                  },
                  returns: {
                    type: 'schemaReference',
                    relativePath: 'jzodAttributeSchema',
                    optional: true
                  }
                }
              },
              jzodLazySchema: {
                type: 'object',
                definition: {
                  type: {
                    type: 'literal',
                    definition: 'lazy'
                  },
                  definition: {
                    type: 'schemaReference',
                    relativePath: 'jzodFunctionSchema'
                  }
                }
              },
              jzodLiteralSchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    type: 'record',
                    definition: {
                      type: 'simpleType',
                      definition: 'any'
                    },
                    optional: true
                  },
                  type: {
                    type: 'literal',
                    definition: 'literal'
                  },
                  definition: {
                    type: 'simpleType',
                    definition: 'string'
                  }
                }
              },
              jzodObjectSchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    type: 'record',
                    definition: {
                      type: 'simpleType',
                      definition: 'any'
                    },
                    optional: true
                  },
                  type: {
                    type: 'literal',
                    definition: 'object'
                  },
                  definition: {
                    type: 'record',
                    definition: {
                      type: 'schemaReference',
                      relativePath: 'jzodElementSchema'
                    }
                  }
                }
              },
              jzodRecordSchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    type: 'record',
                    definition: {
                      type: 'simpleType',
                      definition: 'any'
                    },
                    optional: true
                  },
                  type: {
                    type: 'literal',
                    definition: 'record'
                  },
                  definition: {
                    type: 'schemaReference',
                    relativePath: 'jzodElementSchema'
                  }
                }
              },
              jzodReferenceSchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    type: 'record',
                    definition: {
                      type: 'simpleType',
                      definition: 'any'
                    },
                    optional: true
                  },
                  type: {
                    type: 'literal',
                    definition: 'schemaReference'
                  },
                  definition: {
                    type: 'simpleType',
                    definition: 'string',
                    optional: true
                  },
                  relativePath: {
                    type: 'simpleType',
                    definition: 'string',
                    optional: true
                  },
                  absolutePath: {
                    type: 'simpleType',
                    definition: 'string',
                    optional: true
                  }
                }
              },
              jzodUnionSchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    type: 'record',
                    definition: {
                      type: 'simpleType',
                      definition: 'any'
                    },
                    optional: true
                  },
                  type: {
                    type: 'literal',
                    definition: 'union'
                  },
                  definition: {
                    type: 'array',
                    definition: {
                      type: 'schemaReference',
                      relativePath: 'jzodElementSchema'
                    }
                  }
                }
              }
            }
          },
          attributes: [
            {
              id: 1,
              name: 'jzodSchema',
              defaultLabel: 'Jzod Schema',
              type: 'OBJECT',
              nullable: false,
              editable: false
            }
          ],
          attributesNew: [
            {
              id: 1,
              name: 'jzodSchema',
              defaultLabel: 'Jzod Schema',
              jzodSchema: {
                type: 'schemaReference',
                definition: 'jzodObjectSchema'
              },
              nullable: false,
              editable: false
            }
          ]
        },
        '27046fce-742f-4cc4-bb95-76b271f490a5': {
          uuid: '27046fce-742f-4cc4-bb95-76b271f490a5',
          parentName: 'EntityDefinition',
          parentUuid: '54b9c72f-d4f3-4db9-9e0e-0dc840b530bd',
          entityUuid: 'c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24',
          conceptLevel: 'Model',
          name: 'ApplicationVersion',
          icon: 'Interests',
          jzodSchema: {
            type: 'object',
            definition: {
              uuid: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 1,
                  defaultLabel: 'Uuid',
                  editable: false
                }
              },
              parentName: {
                type: 'simpleType',
                definition: 'string',
                optional: true,
                extra: {
                  id: 2,
                  defaultLabel: 'Entity Name',
                  editable: false
                }
              },
              parentUuid: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 3,
                  defaultLabel: 'Entity Uuid',
                  editable: false
                }
              },
              name: {
                type: 'simpleType',
                definition: 'string',
                extra: {
                  id: 4,
                  defaultLabel: 'Name',
                  editable: true
                }
              },
              defaultLabel: {
                type: 'simpleType',
                definition: 'string',
                extra: {
                  id: 5,
                  defaultLabel: 'Default Label',
                  editable: true
                }
              },
              description: {
                type: 'simpleType',
                definition: 'string',
                optional: true,
                extra: {
                  id: 6,
                  defaultLabel: 'Description',
                  editable: true
                }
              },
              type: {
                type: 'simpleType',
                definition: 'string',
                optional: true,
                extra: {
                  id: 7,
                  defaultLabel: 'Type of Report',
                  editable: true
                }
              },
              application: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 8,
                  defaultLabel: 'Application',
                  targetEntity: 'a659d350-dd97-4da9-91de-524fa01745dc',
                  editable: false
                }
              },
              branch: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 9,
                  defaultLabel: 'Branch',
                  description: 'The Branch of this Application Version',
                  targetEntity: 'cdb0aec6-b848-43ac-a058-fe2dbe5811f1',
                  editable: false
                }
              },
              previousVersion: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 10,
                  defaultLabel: 'Previous Application Version',
                  description: 'Previous version of the application on this Branch.',
                  targetEntity: 'c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24',
                  editable: false
                }
              },
              modelStructureMigration: {
                type: 'schemaReference',
                optional: true,
                extra: {
                  id: 11,
                  defaultLabel: 'Structure Migration from Previous Version',
                  editable: true
                },
                relativePath: 'jzodObjectSchema'
              },
              modelCUDMigration: {
                type: 'schemaReference',
                optional: true,
                extra: {
                  id: 12,
                  defaultLabel: 'Create-Update-Delete Migration from Previous Version',
                  editable: true
                },
                relativePath: 'jzodObjectSchema'
              }
            }
          }
        },
        '381ab1be-337f-4198-b1d3-f686867fc1dd': {
          uuid: '381ab1be-337f-4198-b1d3-f686867fc1dd',
          parentName: 'EntityDefinition',
          parentUuid: '54b9c72f-d4f3-4db9-9e0e-0dc840b530bd',
          entityUuid: '16dbfe28-e1d7-4f20-9ba4-c1a9873202ad',
          name: 'Entity',
          conceptLevel: 'MetaModel',
          description: 'Entities',
          jzodSchema: {
            type: 'object',
            definition: {
              uuid: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 1,
                  defaultLabel: 'Uuid',
                  editable: false
                }
              },
              parentName: {
                type: 'simpleType',
                definition: 'string',
                optional: true,
                extra: {
                  id: 2,
                  defaultLabel: 'Entity Name',
                  editable: false
                }
              },
              parentUuid: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 3,
                  defaultLabel: 'Entity Uuid',
                  editable: false
                }
              },
              conceptLevel: {
                type: 'enum',
                definition: [
                  'MetaModel',
                  'Model',
                  'Data'
                ],
                optional: true,
                extra: {
                  id: 4,
                  defaultLabel: 'Concept Level',
                  editable: false
                }
              },
              name: {
                type: 'simpleType',
                definition: 'string',
                extra: {
                  id: 5,
                  defaultLabel: 'Name',
                  editable: true
                }
              },
              author: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                optional: true,
                extra: {
                  id: 6,
                  defaultLabel: 'Application',
                  targetEntity: 'a659d350-dd97-4da9-91de-524fa01745dc',
                  editable: true
                }
              },
              description: {
                type: 'simpleType',
                definition: 'string',
                optional: true,
                extra: {
                  id: 7,
                  defaultLabel: 'Description',
                  editable: true
                }
              }
            }
          }
        },
        '69bf7c03-a1df-4d1c-88c1-44363feeea87': {
          uuid: '69bf7c03-a1df-4d1c-88c1-44363feeea87',
          parentName: 'EntityDefinition',
          parentUuid: '54b9c72f-d4f3-4db9-9e0e-0dc840b530bd',
          entityUuid: 'cdb0aec6-b848-43ac-a058-fe2dbe5811f1',
          conceptLevel: 'Model',
          name: 'ApplicationModelBranch',
          icon: 'Interests',
          jzodSchema: {
            type: 'object',
            definition: {
              uuid: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 1,
                  defaultLabel: 'Uuid',
                  editable: false
                }
              },
              parentName: {
                type: 'simpleType',
                definition: 'string',
                optional: true,
                extra: {
                  id: 2,
                  defaultLabel: 'Entity Name',
                  editable: false
                }
              },
              parentUuid: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 3,
                  defaultLabel: 'Entity Uuid',
                  targetEntityApplicationSection: 'model',
                  targetEntity: '16dbfe28-e1d7-4f20-9ba4-c1a9873202ad',
                  editable: false
                }
              },
              conceptLevel: {
                type: 'enum',
                definition: [
                  'MetaModel',
                  'Model',
                  'Data'
                ],
                optional: true,
                extra: {
                  id: 4,
                  defaultLabel: 'Concept Level',
                  editable: false
                }
              },
              name: {
                type: 'simpleType',
                definition: 'string',
                extra: {
                  id: 5,
                  defaultLabel: 'Name',
                  editable: true
                }
              },
              defaultLabel: {
                type: 'simpleType',
                definition: 'string',
                extra: {
                  id: 6,
                  defaultLabel: 'Name',
                  editable: true
                }
              },
              application: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 7,
                  defaultLabel: 'Application',
                  targetEntity: 'a659d350-dd97-4da9-91de-524fa01745dc',
                  editable: false
                }
              },
              headVersion: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                optional: true,
                extra: {
                  id: 8,
                  defaultLabel: 'Head Version',
                  targetEntity: 'c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24',
                  editable: true
                }
              },
              description: {
                type: 'simpleType',
                definition: 'string',
                optional: true,
                extra: {
                  id: 9,
                  defaultLabel: 'Description',
                  editable: true
                }
              }
            }
          }
        },
        '9460420b-f176-4918-bd45-894ab195ffe9': {
          uuid: '9460420b-f176-4918-bd45-894ab195ffe9',
          parentName: 'EntityDefinition',
          parentUuid: '54b9c72f-d4f3-4db9-9e0e-0dc840b530bd',
          entityUuid: 'a659d350-dd97-4da9-91de-524fa01745dc',
          conceptLevel: 'Model',
          name: 'Application',
          icon: 'Interests',
          jzodSchema: {
            type: 'object',
            definition: {
              uuid: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 1,
                  defaultLabel: 'Uuid',
                  editable: false
                }
              },
              parentName: {
                type: 'simpleType',
                definition: 'string',
                optional: true,
                extra: {
                  id: 2,
                  defaultLabel: 'Entity Name',
                  editable: false
                }
              },
              parentUuid: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 3,
                  defaultLabel: 'Entity Uuid',
                  editable: false
                }
              },
              name: {
                type: 'simpleType',
                definition: 'string',
                extra: {
                  id: 4,
                  defaultLabel: 'Name',
                  editable: true
                }
              },
              defaultLabel: {
                type: 'simpleType',
                definition: 'string',
                extra: {
                  id: 5,
                  defaultLabel: 'Default Label',
                  editable: true
                }
              },
              description: {
                type: 'simpleType',
                definition: 'string',
                optional: true,
                extra: {
                  id: 6,
                  defaultLabel: 'Description',
                  editable: true
                }
              }
            }
          }
        },
        '952d2c65-4da2-45c2-9394-a0920ceedfb6': {
          uuid: '952d2c65-4da2-45c2-9394-a0920ceedfb6',
          parentName: 'EntityDefinition',
          parentUuid: '54b9c72f-d4f3-4db9-9e0e-0dc840b530bd',
          entityUuid: '3f2baa83-3ef7-45ce-82ea-6a43f7a8c916',
          conceptLevel: 'Model',
          name: 'Report',
          icon: 'Interests',
          jzodSchema: {
            type: 'object',
            definition: {
              uuid: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 1,
                  defaultLabel: 'Uuid',
                  editable: false
                }
              },
              parentName: {
                type: 'simpleType',
                definition: 'string',
                optional: true,
                extra: {
                  id: 2,
                  defaultLabel: 'Entity Name',
                  editable: false
                }
              },
              parentUuid: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 3,
                  defaultLabel: 'Entity Uuid',
                  editable: false
                }
              },
              conceptLevel: {
                type: 'enum',
                definition: [
                  'MetaModel',
                  'Model',
                  'Data'
                ],
                optional: true,
                extra: {
                  id: 4,
                  defaultLabel: 'Concept Level',
                  editable: false
                }
              },
              name: {
                type: 'simpleType',
                definition: 'string',
                extra: {
                  id: 5,
                  defaultLabel: 'Name',
                  editable: true
                }
              },
              defaultLabel: {
                type: 'simpleType',
                definition: 'string',
                extra: {
                  id: 6,
                  defaultLabel: 'Default Label',
                  editable: true
                }
              },
              type: {
                type: 'simpleType',
                definition: 'string',
                optional: true,
                extra: {
                  id: 7,
                  defaultLabel: 'Type of Report',
                  editable: true
                }
              },
              application: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                optional: true,
                extra: {
                  id: 8,
                  defaultLabel: 'Application',
                  targetEntity: 'a659d350-dd97-4da9-91de-524fa01745dc',
                  editable: true
                }
              },
              definition: {
                type: 'simpleType',
                definition: 'string',
                extra: {
                  id: 9,
                  defaultLabel: 'Definition',
                  editable: true
                }
              }
            }
          }
        },
        'bd303ae8-6bce-4b44-a63c-815b9ebf728b': {
          uuid: 'bd303ae8-6bce-4b44-a63c-815b9ebf728b',
          parentName: 'EntityDefinition',
          parentUuid: '54b9c72f-d4f3-4db9-9e0e-0dc840b530bd',
          entityUuid: '35c5608a-7678-4f07-a4ec-76fc5bc35424',
          conceptLevel: 'Model',
          name: 'ApplicationDeployment',
          icon: 'Interests',
          jzodSchema: {
            type: 'object',
            definition: {
              uuid: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 1,
                  defaultLabel: 'Uuid',
                  editable: false
                }
              },
              parentName: {
                type: 'simpleType',
                definition: 'string',
                optional: true,
                extra: {
                  id: 2,
                  defaultLabel: 'Entity Name',
                  editable: false
                }
              },
              parentUuid: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 3,
                  defaultLabel: 'Entity Uuid',
                  editable: false
                }
              },
              name: {
                type: 'simpleType',
                definition: 'string',
                extra: {
                  id: 4,
                  defaultLabel: 'Name',
                  editable: true
                }
              },
              defaultLabel: {
                type: 'simpleType',
                definition: 'string',
                extra: {
                  id: 5,
                  defaultLabel: 'Default Label',
                  editable: true
                }
              },
              description: {
                type: 'simpleType',
                definition: 'string',
                optional: true,
                extra: {
                  id: 6,
                  defaultLabel: 'Description',
                  editable: true
                }
              },
              application: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 7,
                  defaultLabel: 'Application',
                  description: 'The Application of the Branch.',
                  targetEntity: 'a659d350-dd97-4da9-91de-524fa01745dc',
                  editable: false
                }
              },
              model: {
                type: 'schemaReference',
                optional: true,
                extra: {
                  id: 8,
                  defaultLabel: 'Application Deployment Model',
                  editable: true
                },
                relativePath: 'jzodObjectSchema'
              },
              data: {
                type: 'schemaReference',
                optional: true,
                extra: {
                  id: 9,
                  defaultLabel: 'Application Deployment Data',
                  editable: true
                },
                relativePath: 'jzodObjectSchema'
              }
            }
          }
        },
        'bdd7ad43-f0fc-4716-90c1-87454c40dd95': {
          uuid: 'bdd7ad43-f0fc-4716-90c1-87454c40dd95',
          parentName: 'EntityDefinition',
          parentUuid: '54b9c72f-d4f3-4db9-9e0e-0dc840b530bd',
          entityUuid: '54b9c72f-d4f3-4db9-9e0e-0dc840b530bd',
          name: 'EntityDefinition',
          conceptLevel: 'MetaModel',
          description: 'definition of an entity',
          jzodSchema: {
            type: 'object',
            definition: {
              uuid: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 1,
                  defaultLabel: 'Uuid',
                  editable: false
                }
              },
              parentName: {
                type: 'simpleType',
                definition: 'string',
                extra: {
                  id: 2,
                  defaultLabel: 'Entity Name',
                  editable: false
                }
              },
              parentUuid: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 1,
                  defaultLabel: 'Entity Uuid',
                  editable: false
                }
              },
              name: {
                type: 'simpleType',
                definition: 'string',
                extra: {
                  id: 1,
                  defaultLabel: 'Name',
                  editable: false
                }
              },
              conceptLevel: {
                type: 'enum',
                definition: [
                  'MetaModel',
                  'Model',
                  'Data'
                ],
                optional: true,
                extra: {
                  id: 1,
                  defaultLabel: 'Concept Level',
                  editable: false
                }
              },
              description: {
                type: 'simpleType',
                definition: 'string',
                optional: true,
                extra: {
                  id: 1,
                  defaultLabel: 'Description',
                  editable: true
                }
              },
              jzodSchema: {
                type: 'schemaReference',
                absolutePath: '1e8dab4b-65a3-4686-922e-ce89a2d62aa9',
                relativePath: 'jzodObjectSchema',
                optional: true
              }
            }
          }
        },
        'c0b71083-8cc8-43db-bf52-572f1f03bbb5': {
          uuid: 'c0b71083-8cc8-43db-bf52-572f1f03bbb5',
          parentName: 'EntityDefinition',
          parentUuid: '54b9c72f-d4f3-4db9-9e0e-0dc840b530bd',
          entityUuid: 'c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24',
          conceptLevel: 'Model',
          name: 'ApplicationVersionCrossEntityDefinition',
          description: 'The mapping among Application Versions and Entity Definitions',
          icon: 'Interests',
          jzodSchema: {
            type: 'object',
            definition: {
              uuid: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 1,
                  defaultLabel: 'Uuid',
                  editable: false
                }
              },
              parentName: {
                type: 'simpleType',
                definition: 'string',
                optional: true,
                extra: {
                  id: 2,
                  defaultLabel: 'Entity Name',
                  editable: false
                }
              },
              parentUuid: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 3,
                  defaultLabel: 'Entity Uuid',
                  description: 'The Parent Entity of this Instance',
                  targetEntity: '16dbfe28-e1d7-4f20-9ba4-c1a9873202ad',
                  editable: false
                }
              },
              name: {
                type: 'simpleType',
                definition: 'string',
                extra: {
                  id: 4,
                  defaultLabel: 'Name',
                  editable: true
                }
              },
              defaultLabel: {
                type: 'simpleType',
                definition: 'string',
                extra: {
                  id: 5,
                  defaultLabel: 'Default Label',
                  editable: true
                }
              },
              description: {
                type: 'simpleType',
                definition: 'string',
                optional: true,
                extra: {
                  id: 6,
                  defaultLabel: 'Description',
                  editable: true
                }
              },
              application: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 7,
                  defaultLabel: 'Application',
                  description: 'The Application of the Branch.',
                  targetEntity: 'a659d350-dd97-4da9-91de-524fa01745dc',
                  editable: false
                }
              },
              applicationVersion: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 7,
                  defaultLabel: 'Application Version',
                  description: 'The Application Version of this mapping.',
                  targetEntity: 'c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24',
                  editable: false
                }
              },
              entity: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 7,
                  defaultLabel: 'Entity',
                  description: 'The Entity definition of this mapping.',
                  targetEntity: '54b9c72f-d4f3-4db9-9e0e-0dc840b530bd',
                  editable: false
                }
              }
            }
          }
        },
        'f93af951-ea13-4815-a2e3-ec0cab1fadd2': {
          uuid: 'f93af951-ea13-4815-a2e3-ec0cab1fadd2',
          parentName: 'EntityDefinition',
          parentUuid: '54b9c72f-d4f3-4db9-9e0e-0dc840b530bd',
          entityUuid: '7990c0c9-86c3-40a1-a121-036c91b55ed7',
          conceptLevel: 'Model',
          name: 'StoreBasedConfiguration',
          icon: 'Interests',
          jzodSchema: {
            type: 'object',
            definition: {
              uuid: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 1,
                  defaultLabel: 'Uuid',
                  editable: false
                }
              },
              parentName: {
                type: 'simpleType',
                definition: 'string',
                optional: true,
                extra: {
                  id: 2,
                  defaultLabel: 'Entity Name',
                  editable: false
                }
              },
              parentUuid: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 3,
                  defaultLabel: 'Entity Uuid',
                  editable: false
                }
              },
              name: {
                type: 'simpleType',
                definition: 'string',
                extra: {
                  id: 4,
                  defaultLabel: 'Name',
                  editable: true
                }
              },
              defaultLabel: {
                type: 'simpleType',
                definition: 'string',
                extra: {
                  id: 5,
                  defaultLabel: 'Default Label',
                  editable: true
                }
              },
              definition: {
                type: 'schemaReference',
                optional: true,
                extra: {
                  id: 8,
                  defaultLabel: 'The configuration itself',
                  editable: true
                },
                relativePath: 'jzodObjectSchema'
              }
            }
          }
        }
      }
    },
    '10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_35c5608a-7678-4f07-a4ec-76fc5bc35424': {
      ids: [
        '10ff36f2-50a3-48d8-b80f-e48e5d13af8e'
      ],
      entities: {
        '10ff36f2-50a3-48d8-b80f-e48e5d13af8e': {
          uuid: '10ff36f2-50a3-48d8-b80f-e48e5d13af8e',
          parentName: 'ApplicationDeployment',
          parentUuid: '35c5608a-7678-4f07-a4ec-76fc5bc35424',
          name: 'DefaultMiroirApplicationDeployment',
          application: '360fcf1f-f0d4-4f8a-9262-07886e70fa15',
          applicationModelLevel: 'metamodel',
          description: 'The default Deployment for Application Miroir',
          model: {
            location: {
              type: 'sql',
              side: 'server',
              connectionString: 'postgres://postgres:postgres@localhost:5432/postgres',
              schema: 'miroir'
            }
          },
          data: {
            location: {
              type: 'sql',
              side: 'server',
              connectionString: 'postgres://postgres:postgres@localhost:5432/postgres',
              schema: 'miroir'
            }
          }
        }
      }
    },
    '10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_3f2baa83-3ef7-45ce-82ea-6a43f7a8c916': {
      ids: [
        '0810de28-fdab-4baf-8935-7e04a8f779a9',
        '0e4cf674-3a26-422a-8618-09e32302ac0c',
        '1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855',
        '43f04807-8f96-43f9-876f-9a0210f7b99c',
        '60648b22-e2c6-4b74-8031-53884f597d63',
        '8b22e84e-9374-4121-b2a7-d13d947a0ba2',
        'c9ea3359-690c-4620-9603-b5b402e4a2b9',
        'df0a9a8f-e0f6-4f9f-8635-c8460e638e1b',
        'f9aff35d-8636-4519-8361-c7648e0ddc68'
      ],
      entities: {
        '0810de28-fdab-4baf-8935-7e04a8f779a9': {
          uuid: '0810de28-fdab-4baf-8935-7e04a8f779a9',
          parentName: 'Report',
          parentUuid: '3f2baa83-3ef7-45ce-82ea-6a43f7a8c916',
          name: 'ApplicationVersionList',
          defaultLabel: 'List of Aplication Versions',
          type: 'list',
          definition: [
            {
              type: 'objectList',
              definition: {
                parentName: 'ApplicationVersion',
                parentUuid: 'c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24'
              }
            }
          ]
        },
        '0e4cf674-3a26-422a-8618-09e32302ac0c': {
          uuid: '0e4cf674-3a26-422a-8618-09e32302ac0c',
          parentName: 'Report',
          parentUuid: '3f2baa83-3ef7-45ce-82ea-6a43f7a8c916',
          name: 'ApplicationList',
          defaultLabel: 'List of Applications',
          type: 'list',
          definition: [
            {
              type: 'objectList',
              definition: {
                parentName: 'Application',
                parentUuid: 'a659d350-dd97-4da9-91de-524fa01745dc'
              }
            }
          ]
        },
        '1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855': {
          uuid: '1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855',
          parentName: 'Report',
          parentUuid: '3f2baa83-3ef7-45ce-82ea-6a43f7a8c916',
          name: 'ReportList',
          defaultLabel: 'List of Reports',
          type: 'list',
          definition: [
            {
              type: 'objectList',
              definition: {
                parentName: 'Report',
                parentUuid: '3f2baa83-3ef7-45ce-82ea-6a43f7a8c916'
              }
            }
          ]
        },
        '43f04807-8f96-43f9-876f-9a0210f7b99c': {
          uuid: '43f04807-8f96-43f9-876f-9a0210f7b99c',
          parentName: 'Report',
          parentUuid: '3f2baa83-3ef7-45ce-82ea-6a43f7a8c916',
          name: 'StoreBasedConfigurationList',
          defaultLabel: 'Store-based Configuration',
          type: 'list',
          definition: [
            {
              type: 'objectList',
              definition: {
                parentName: 'StoreBasedConfiguration',
                parentUuid: '7990c0c9-86c3-40a1-a121-036c91b55ed7'
              }
            }
          ]
        },
        '60648b22-e2c6-4b74-8031-53884f597d63': {
          uuid: '60648b22-e2c6-4b74-8031-53884f597d63',
          parentName: 'Report',
          parentUuid: '3f2baa83-3ef7-45ce-82ea-6a43f7a8c916',
          name: 'ApplicationModelBranchList',
          defaultLabel: 'List of Application Model Branches',
          type: 'list',
          definition: [
            {
              type: 'objectList',
              definition: {
                parentName: 'ApplicationModelBranch',
                parentUuid: 'cdb0aec6-b848-43ac-a058-fe2dbe5811f1'
              }
            }
          ]
        },
        '8b22e84e-9374-4121-b2a7-d13d947a0ba2': {
          uuid: '8b22e84e-9374-4121-b2a7-d13d947a0ba2',
          parentName: 'Report',
          parentUuid: '3f2baa83-3ef7-45ce-82ea-6a43f7a8c916',
          name: 'JzodSchemaList',
          defaultLabel: 'List of Jzod Schemas',
          type: 'list',
          definition: [
            {
              type: 'objectList',
              definition: {
                parentName: 'JzodSchema',
                parentUuid: '5e81e1b9-38be-487c-b3e5-53796c57fccf'
              }
            }
          ]
        },
        'c9ea3359-690c-4620-9603-b5b402e4a2b9': {
          uuid: 'c9ea3359-690c-4620-9603-b5b402e4a2b9',
          parentName: 'Report',
          parentUuid: '3f2baa83-3ef7-45ce-82ea-6a43f7a8c916',
          name: 'EntityList',
          defaultLabel: 'List of Entities',
          type: 'list',
          definition: [
            {
              type: 'objectList',
              definition: {
                parentName: 'Entity',
                parentUuid: '16dbfe28-e1d7-4f20-9ba4-c1a9873202ad'
              }
            }
          ]
        },
        'df0a9a8f-e0f6-4f9f-8635-c8460e638e1b': {
          uuid: 'df0a9a8f-e0f6-4f9f-8635-c8460e638e1b',
          parentName: 'Report',
          parentUuid: '3f2baa83-3ef7-45ce-82ea-6a43f7a8c916',
          name: 'ApplicationDeploymentList',
          defaultLabel: 'List of Application Deployments',
          type: 'list',
          definition: [
            {
              type: 'objectList',
              definition: {
                parentName: 'ApplicationDeployment',
                parentUuid: '35c5608a-7678-4f07-a4ec-76fc5bc35424'
              }
            }
          ]
        },
        'f9aff35d-8636-4519-8361-c7648e0ddc68': {
          uuid: 'f9aff35d-8636-4519-8361-c7648e0ddc68',
          parentName: 'Report',
          parentUuid: '3f2baa83-3ef7-45ce-82ea-6a43f7a8c916',
          name: 'EntityDefinitionList',
          defaultLabel: 'List of Entity Definitions',
          type: 'list',
          definition: [
            {
              type: 'objectList',
              definition: {
                parentName: 'Entity',
                parentUuid: '54b9c72f-d4f3-4db9-9e0e-0dc840b530bd'
              }
            }
          ]
        }
      }
    },
    '10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_5e81e1b9-38be-487c-b3e5-53796c57fccf': {
      ids: [
        '04f8773e-1c9d-4e5a-853e-1f94982f2e94',
        '1e8dab4b-65a3-4686-922e-ce89a2d62aa9'
      ],
      entities: {
        '04f8773e-1c9d-4e5a-853e-1f94982f2e94': {
          uuid: '04f8773e-1c9d-4e5a-853e-1f94982f2e94',
          parentName: 'JzodSchema',
          parentUuid: '5e81e1b9-38be-487c-b3e5-53796c57fccf',
          name: 'jzodBootstrapSchema',
          defaultLabel: 'The Jzod Schema of all Jzod Schemas. Comes from the @miroir-framework/jzod library. Parses itself.',
          definition: {
            type: 'object',
            definition: {
              jzodArraySchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    type: 'record',
                    definition: {
                      type: 'simpleType',
                      definition: 'any'
                    },
                    optional: true
                  },
                  type: {
                    type: 'literal',
                    definition: 'array'
                  },
                  definition: {
                    type: 'schemaReference',
                    relativePath: 'jzodElementSchema'
                  }
                }
              },
              jzodAttributeSchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    type: 'record',
                    definition: {
                      type: 'simpleType',
                      definition: 'any'
                    },
                    optional: true
                  },
                  type: {
                    type: 'literal',
                    definition: 'simpleType'
                  },
                  definition: {
                    type: 'schemaReference',
                    relativePath: 'jzodEnumTypesSchema'
                  }
                }
              },
              jzodAttributeStringWithValidationsSchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    type: 'record',
                    definition: {
                      type: 'simpleType',
                      definition: 'any'
                    },
                    optional: true
                  },
                  type: {
                    type: 'literal',
                    definition: 'simpleType'
                  },
                  definition: {
                    type: 'literal',
                    definition: 'string'
                  },
                  validations: {
                    type: 'array',
                    definition: {
                      type: 'schemaReference',
                      relativePath: 'jzodAttributeStringValidationsSchema'
                    }
                  }
                }
              },
              jzodAttributeStringValidationsSchema: {
                type: 'object',
                definition: {
                  extra: {
                    type: 'record',
                    definition: {
                      type: 'simpleType',
                      definition: 'any'
                    },
                    optional: true
                  },
                  type: {
                    type: 'enum',
                    definition: [
                      'max',
                      'min',
                      'length',
                      'email',
                      'url',
                      'emoji',
                      'uuid',
                      'cuid',
                      'cuid2',
                      'ulid',
                      'regex',
                      'includes',
                      'startsWith',
                      'endsWith',
                      'datetime',
                      'ip'
                    ]
                  },
                  parameter: {
                    type: 'simpleType',
                    definition: 'any'
                  }
                }
              },
              jzodElementSchema: {
                type: 'union',
                definition: [
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodArraySchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodAttributeSchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodAttributeStringWithValidationsSchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodEnumSchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodFunctionSchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodLazySchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodLiteralSchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodObjectSchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodRecordSchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodReferenceSchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodUnionSchema'
                  }
                ]
              },
              jzodElementSetSchema: {
                type: 'record',
                definition: {
                  type: 'schemaReference',
                  relativePath: 'jzodElementSchema'
                }
              },
              jzodEnumSchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    type: 'record',
                    definition: {
                      type: 'simpleType',
                      definition: 'any'
                    },
                    optional: true
                  },
                  type: {
                    type: 'literal',
                    definition: 'enum'
                  },
                  definition: {
                    type: 'array',
                    definition: {
                      type: 'simpleType',
                      definition: 'string'
                    }
                  }
                }
              },
              jzodEnumTypesSchema: {
                type: 'enum',
                definition: [
                  'any',
                  'boolean',
                  'number',
                  'string',
                  'uuid'
                ]
              },
              jzodFunctionSchema: {
                type: 'object',
                definition: {
                  type: {
                    type: 'literal',
                    definition: 'function'
                  },
                  args: {
                    type: 'array',
                    definition: {
                      type: 'schemaReference',
                      relativePath: 'jzodAttributeSchema'
                    }
                  },
                  returns: {
                    type: 'schemaReference',
                    relativePath: 'jzodAttributeSchema',
                    optional: true
                  }
                }
              },
              jzodLazySchema: {
                type: 'object',
                definition: {
                  type: {
                    type: 'literal',
                    definition: 'lazy'
                  },
                  definition: {
                    type: 'schemaReference',
                    relativePath: 'jzodFunctionSchema'
                  }
                }
              },
              jzodLiteralSchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    type: 'record',
                    definition: {
                      type: 'simpleType',
                      definition: 'any'
                    },
                    optional: true
                  },
                  type: {
                    type: 'literal',
                    definition: 'literal'
                  },
                  definition: {
                    type: 'simpleType',
                    definition: 'string'
                  }
                }
              },
              jzodObjectSchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    type: 'record',
                    definition: {
                      type: 'simpleType',
                      definition: 'any'
                    },
                    optional: true
                  },
                  type: {
                    type: 'literal',
                    definition: 'object'
                  },
                  definition: {
                    type: 'record',
                    definition: {
                      type: 'schemaReference',
                      relativePath: 'jzodElementSchema'
                    }
                  }
                }
              },
              jzodRecordSchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    type: 'record',
                    definition: {
                      type: 'simpleType',
                      definition: 'any'
                    },
                    optional: true
                  },
                  type: {
                    type: 'literal',
                    definition: 'record'
                  },
                  definition: {
                    type: 'schemaReference',
                    relativePath: 'jzodElementSchema'
                  }
                }
              },
              jzodReferenceSchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    type: 'record',
                    definition: {
                      type: 'simpleType',
                      definition: 'any'
                    },
                    optional: true
                  },
                  type: {
                    type: 'literal',
                    definition: 'schemaReference'
                  },
                  definition: {
                    type: 'simpleType',
                    definition: 'string'
                  }
                }
              },
              jzodUnionSchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    type: 'record',
                    definition: {
                      type: 'simpleType',
                      definition: 'any'
                    },
                    optional: true
                  },
                  type: {
                    type: 'literal',
                    definition: 'union'
                  },
                  definition: {
                    type: 'array',
                    definition: {
                      type: 'schemaReference',
                      relativePath: 'jzodElementSchema'
                    }
                  }
                }
              }
            }
          }
        },
        '1e8dab4b-65a3-4686-922e-ce89a2d62aa9': {
          uuid: '1e8dab4b-65a3-4686-922e-ce89a2d62aa9',
          parentName: 'JzodSchema',
          parentUuid: '5e81e1b9-38be-487c-b3e5-53796c57fccf',
          name: 'jzodMiroirBootstrapSchema',
          defaultLabel: 'The Jzod Schema for Miroir Jzod Schemas. Parses itself.',
          definition: {
            type: 'object',
            definition: {
              jzodBasicExtraSchema: {
                optional: true,
                type: 'object',
                definition: {
                  id: {
                    type: 'simpleType',
                    definition: 'number'
                  },
                  defaultLabel: {
                    type: 'simpleType',
                    definition: 'string'
                  },
                  editable: {
                    type: 'simpleType',
                    definition: 'boolean'
                  }
                }
              },
              jzodArraySchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    type: 'schemaReference',
                    relativePath: 'jzodBasicExtraSchema'
                  },
                  type: {
                    type: 'literal',
                    definition: 'array'
                  },
                  definition: {
                    type: 'schemaReference',
                    relativePath: 'jzodElementSchema'
                  }
                }
              },
              jzodAttributeSchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    optional: true,
                    type: 'object',
                    definition: {
                      id: {
                        type: 'simpleType',
                        definition: 'number'
                      },
                      defaultLabel: {
                        type: 'simpleType',
                        definition: 'string'
                      },
                      description: {
                        type: 'simpleType',
                        definition: 'string',
                        optional: true
                      },
                      editable: {
                        type: 'simpleType',
                        definition: 'boolean'
                      },
                      targetEntityApplicationSection: {
                        type: 'enum',
                        definition: [
                          'model',
                          'data'
                        ],
                        optional: true
                      },
                      targetEntity: {
                        type: 'simpleType',
                        definition: 'string',
                        validations: [
                          {
                            type: 'uuid'
                          }
                        ],
                        optional: true
                      }
                    }
                  },
                  type: {
                    type: 'literal',
                    definition: 'simpleType'
                  },
                  definition: {
                    type: 'schemaReference',
                    relativePath: 'jzodEnumTypesSchema'
                  }
                }
              },
              jzodAttributeStringWithValidationsSchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    optional: true,
                    type: 'object',
                    definition: {
                      id: {
                        type: 'simpleType',
                        definition: 'number'
                      },
                      defaultLabel: {
                        type: 'simpleType',
                        definition: 'string'
                      },
                      editable: {
                        type: 'simpleType',
                        definition: 'boolean'
                      },
                      targetEntity: {
                        type: 'simpleType',
                        definition: 'string',
                        validations: [
                          {
                            type: 'uuid'
                          }
                        ]
                      }
                    }
                  },
                  type: {
                    type: 'literal',
                    definition: 'simpleType'
                  },
                  definition: {
                    type: 'literal',
                    definition: 'string'
                  },
                  validations: {
                    type: 'array',
                    definition: {
                      type: 'schemaReference',
                      relativePath: 'jzodAttributeStringValidationsSchema'
                    }
                  }
                }
              },
              jzodAttributeStringValidationsSchema: {
                type: 'object',
                definition: {
                  extra: {
                    optional: true,
                    type: 'object',
                    definition: {
                      id: {
                        type: 'simpleType',
                        definition: 'number'
                      },
                      defaultLabel: {
                        type: 'simpleType',
                        definition: 'string'
                      },
                      editable: {
                        type: 'simpleType',
                        definition: 'boolean'
                      }
                    }
                  },
                  type: {
                    type: 'enum',
                    definition: [
                      'max',
                      'min',
                      'length',
                      'email',
                      'url',
                      'emoji',
                      'uuid',
                      'cuid',
                      'cuid2',
                      'ulid',
                      'regex',
                      'includes',
                      'startsWith',
                      'endsWith',
                      'datetime',
                      'ip'
                    ]
                  },
                  parameter: {
                    type: 'simpleType',
                    definition: 'any'
                  }
                }
              },
              jzodElementSchema: {
                type: 'union',
                definition: [
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodArraySchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodAttributeSchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodAttributeStringWithValidationsSchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodEnumSchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodFunctionSchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodLazySchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodLiteralSchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodObjectSchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodRecordSchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodReferenceSchema'
                  },
                  {
                    type: 'schemaReference',
                    relativePath: 'jzodUnionSchema'
                  }
                ]
              },
              jzodElementSetSchema: {
                type: 'record',
                definition: {
                  type: 'schemaReference',
                  relativePath: 'jzodElementSchema'
                }
              },
              jzodEnumSchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    optional: true,
                    type: 'object',
                    definition: {
                      id: {
                        type: 'simpleType',
                        definition: 'number'
                      },
                      defaultLabel: {
                        type: 'simpleType',
                        definition: 'string'
                      },
                      editable: {
                        type: 'simpleType',
                        definition: 'boolean'
                      }
                    }
                  },
                  type: {
                    type: 'literal',
                    definition: 'enum'
                  },
                  definition: {
                    type: 'array',
                    definition: {
                      type: 'simpleType',
                      definition: 'string'
                    }
                  }
                }
              },
              jzodEnumTypesSchema: {
                type: 'enum',
                definition: [
                  'any',
                  'boolean',
                  'number',
                  'string',
                  'uuid'
                ]
              },
              jzodFunctionSchema: {
                type: 'object',
                definition: {
                  type: {
                    type: 'literal',
                    definition: 'function'
                  },
                  args: {
                    type: 'array',
                    definition: {
                      type: 'schemaReference',
                      relativePath: 'jzodAttributeSchema'
                    }
                  },
                  returns: {
                    type: 'schemaReference',
                    relativePath: 'jzodAttributeSchema',
                    optional: true
                  }
                }
              },
              jzodLazySchema: {
                type: 'object',
                definition: {
                  type: {
                    type: 'literal',
                    definition: 'lazy'
                  },
                  definition: {
                    type: 'schemaReference',
                    relativePath: 'jzodFunctionSchema'
                  }
                }
              },
              jzodLiteralSchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    optional: true,
                    type: 'object',
                    definition: {
                      id: {
                        type: 'simpleType',
                        definition: 'number'
                      },
                      defaultLabel: {
                        type: 'simpleType',
                        definition: 'string'
                      },
                      editable: {
                        type: 'simpleType',
                        definition: 'boolean'
                      }
                    }
                  },
                  type: {
                    type: 'literal',
                    definition: 'literal'
                  },
                  definition: {
                    type: 'simpleType',
                    definition: 'string'
                  }
                }
              },
              jzodObjectSchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    optional: true,
                    type: 'object',
                    definition: {
                      id: {
                        type: 'simpleType',
                        definition: 'number'
                      },
                      defaultLabel: {
                        type: 'simpleType',
                        definition: 'string'
                      },
                      editable: {
                        type: 'simpleType',
                        definition: 'boolean'
                      }
                    }
                  },
                  type: {
                    type: 'literal',
                    definition: 'object'
                  },
                  definition: {
                    type: 'record',
                    definition: {
                      type: 'schemaReference',
                      relativePath: 'jzodElementSchema'
                    }
                  }
                }
              },
              jzodRecordSchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    optional: true,
                    type: 'object',
                    definition: {
                      id: {
                        type: 'simpleType',
                        definition: 'number'
                      },
                      defaultLabel: {
                        type: 'simpleType',
                        definition: 'string'
                      },
                      editable: {
                        type: 'simpleType',
                        definition: 'boolean'
                      }
                    }
                  },
                  type: {
                    type: 'literal',
                    definition: 'record'
                  },
                  definition: {
                    type: 'schemaReference',
                    relativePath: 'jzodElementSchema'
                  }
                }
              },
              jzodReferenceSchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    optional: true,
                    type: 'object',
                    definition: {
                      id: {
                        type: 'simpleType',
                        definition: 'number'
                      },
                      defaultLabel: {
                        type: 'simpleType',
                        definition: 'string'
                      },
                      editable: {
                        type: 'simpleType',
                        definition: 'boolean'
                      }
                    }
                  },
                  type: {
                    type: 'literal',
                    definition: 'schemaReference'
                  },
                  definition: {
                    type: 'simpleType',
                    definition: 'string',
                    optional: true
                  },
                  relativePath: {
                    type: 'simpleType',
                    definition: 'string',
                    optional: true
                  },
                  absolutePath: {
                    type: 'simpleType',
                    definition: 'string',
                    optional: true
                  }
                }
              },
              jzodUnionSchema: {
                type: 'object',
                definition: {
                  optional: {
                    type: 'simpleType',
                    definition: 'boolean',
                    optional: true
                  },
                  extra: {
                    optional: true,
                    type: 'object',
                    definition: {
                      id: {
                        type: 'simpleType',
                        definition: 'number'
                      },
                      defaultLabel: {
                        type: 'simpleType',
                        definition: 'string'
                      },
                      editable: {
                        type: 'simpleType',
                        definition: 'boolean'
                      }
                    }
                  },
                  type: {
                    type: 'literal',
                    definition: 'union'
                  },
                  definition: {
                    type: 'array',
                    definition: {
                      type: 'schemaReference',
                      relativePath: 'jzodElementSchema'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_7990c0c9-86c3-40a1-a121-036c91b55ed7': {
      ids: [
        '360fcf1f-f0d4-4f8a-9262-07886e70fa15'
      ],
      entities: {
        '360fcf1f-f0d4-4f8a-9262-07886e70fa15': {
          uuid: '360fcf1f-f0d4-4f8a-9262-07886e70fa15',
          parentName: 'Configuration',
          parentUuid: '7990c0c9-86c3-40a1-a121-036c91b55ed7',
          name: 'Reference',
          defaultLabel: 'The reference configuration for the database.',
          definition: {
            currentModelVersion: '695826c2-aefa-4f5f-a131-dee46fe21c13'
          }
        }
      }
    },
    '10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_8bec933d-6287-4de7-8a88-5c24216de9f4': {
      ids: [
        '17adb534-1dcb-4874-a4ef-6c1e03b31c4e',
        '48644159-66d4-426d-b38d-d083fd455e7b',
        '4aaba993-f0a1-4a26-b1ea-13b0ad532685',
        '9086f49a-0e81-4902-81f3-560186dee334',
        'ba38669e-ac6f-40ea-af14-bb200db251d8',
        'dc47438c-166a-4d19-aeba-ad70281afdf4',
        'ede7e794-5ae7-48a8-81c9-d1f82df11829'
      ],
      entities: {
        '17adb534-1dcb-4874-a4ef-6c1e03b31c4e': {
          uuid: '17adb534-1dcb-4874-a4ef-6c1e03b31c4e',
          parentName: 'ApplicationVersionCrossEntityDefinition',
          parentUuid: '8bec933d-6287-4de7-8a88-5c24216de9f4',
          applicationVersion: '695826c2-aefa-4f5f-a131-dee46fe21c13',
          entityDefinition: '381ab1be-337f-4198-b1d3-f686867fc1dd'
        },
        '48644159-66d4-426d-b38d-d083fd455e7b': {
          uuid: '48644159-66d4-426d-b38d-d083fd455e7b',
          parentName: 'ApplicationVersionCrossEntityDefinition',
          parentUuid: '8bec933d-6287-4de7-8a88-5c24216de9f4',
          applicationVersion: '695826c2-aefa-4f5f-a131-dee46fe21c13',
          entityDefinition: 'bdd7ad43-f0fc-4716-90c1-87454c40dd95'
        },
        '4aaba993-f0a1-4a26-b1ea-13b0ad532685': {
          uuid: '4aaba993-f0a1-4a26-b1ea-13b0ad532685',
          parentName: 'ApplicationVersionCrossEntityDefinition',
          parentUuid: '8bec933d-6287-4de7-8a88-5c24216de9f4',
          applicationVersion: '695826c2-aefa-4f5f-a131-dee46fe21c13',
          entityDefinition: '69bf7c03-a1df-4d1c-88c1-44363feeea87'
        },
        '9086f49a-0e81-4902-81f3-560186dee334': {
          uuid: '9086f49a-0e81-4902-81f3-560186dee334',
          parentName: 'ApplicationVersionCrossEntityDefinition',
          parentUuid: '8bec933d-6287-4de7-8a88-5c24216de9f4',
          applicationVersion: '695826c2-aefa-4f5f-a131-dee46fe21c13',
          entityDefinition: '27046fce-742f-4cc4-bb95-76b271f490a5'
        },
        'ba38669e-ac6f-40ea-af14-bb200db251d8': {
          uuid: 'ba38669e-ac6f-40ea-af14-bb200db251d8',
          parentName: 'ApplicationVersionCrossEntityDefinition',
          parentUuid: '8bec933d-6287-4de7-8a88-5c24216de9f4',
          applicationVersion: '695826c2-aefa-4f5f-a131-dee46fe21c13',
          entityDefinition: 'f93af951-ea13-4815-a2e3-ec0cab1fadd2'
        },
        'dc47438c-166a-4d19-aeba-ad70281afdf4': {
          uuid: 'dc47438c-166a-4d19-aeba-ad70281afdf4',
          parentName: 'ApplicationVersionCrossEntityDefinition',
          parentUuid: '8bec933d-6287-4de7-8a88-5c24216de9f4',
          applicationVersion: '695826c2-aefa-4f5f-a131-dee46fe21c13',
          entityDefinition: '9460420b-f176-4918-bd45-894ab195ffe9'
        },
        'ede7e794-5ae7-48a8-81c9-d1f82df11829': {
          uuid: 'ede7e794-5ae7-48a8-81c9-d1f82df11829',
          parentName: 'ApplicationVersionCrossEntityDefinition',
          parentUuid: '8bec933d-6287-4de7-8a88-5c24216de9f4',
          applicationVersion: '695826c2-aefa-4f5f-a131-dee46fe21c13',
          entityDefinition: '952d2c65-4da2-45c2-9394-a0920ceedfb6'
        }
      }
    },
    '10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_a659d350-dd97-4da9-91de-524fa01745dc': {
      ids: [
        '360fcf1f-f0d4-4f8a-9262-07886e70fa15'
      ],
      entities: {
        '360fcf1f-f0d4-4f8a-9262-07886e70fa15': {
          uuid: '360fcf1f-f0d4-4f8a-9262-07886e70fa15',
          parentName: 'Application',
          parentUuid: 'a659d350-dd97-4da9-91de-524fa01745dc',
          name: 'Miroir',
          defaultLabel: 'The Miroir application.',
          description: 'This application contaies the Miroir meta-model, and the elements needed to perform the most fundamental application-editing tasks.'
        }
      }
    },
    '10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24': {
      ids: [
        '695826c2-aefa-4f5f-a131-dee46fe21c13'
      ],
      entities: {
        '695826c2-aefa-4f5f-a131-dee46fe21c13': {
          uuid: '695826c2-aefa-4f5f-a131-dee46fe21c13',
          parentName: 'ApplicationVersion',
          parentUuid: 'c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24',
          name: 'Initial',
          application: '360fcf1f-f0d4-4f8a-9262-07886e70fa15',
          branch: 'ad1ddc4e-556e-4598-9cff-706a2bde0be7',
          description: 'Initial datastore Miroir application version',
          previousVersion: '',
          modelStructureMigration: [],
          modelCUDMigration: []
        }
      }
    },
    '10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_cdb0aec6-b848-43ac-a058-fe2dbe5811f1': {
      ids: [
        'ad1ddc4e-556e-4598-9cff-706a2bde0be7'
      ],
      entities: {
        'ad1ddc4e-556e-4598-9cff-706a2bde0be7': {
          uuid: 'ad1ddc4e-556e-4598-9cff-706a2bde0be7',
          parentName: 'ApplicationModelBranch',
          parentUuid: 'cdb0aec6-b848-43ac-a058-fe2dbe5811f1',
          name: 'master',
          application: '360fcf1f-f0d4-4f8a-9262-07886e70fa15',
          headVersion: '695826c2-aefa-4f5f-a131-dee46fe21c13',
          description: 'The master Branch of the Miroir Application'
        }
      }
    },
    'f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_a659d350-dd97-4da9-91de-524fa01745dc': {
      ids: [
        '5af03c98-fe5e-490b-b08f-e1230971c57f'
      ],
      entities: {
        '5af03c98-fe5e-490b-b08f-e1230971c57f': {
          uuid: '5af03c98-fe5e-490b-b08f-e1230971c57f',
          parentName: 'Application',
          parentUuid: 'a659d350-dd97-4da9-91de-524fa01745dc',
          name: 'Library',
          defaultLabel: 'The Library application.',
          description: 'The model and data of the Library application.'
        }
      }
    },
    'f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_35c5608a-7678-4f07-a4ec-76fc5bc35424': {
      ids: [],
      entities: {}
    },
    'f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_cdb0aec6-b848-43ac-a058-fe2dbe5811f1': {
      ids: [
        '9034141b-0d0d-4beb-82af-dfc02be15c2d'
      ],
      entities: {
        '9034141b-0d0d-4beb-82af-dfc02be15c2d': {
          uuid: '9034141b-0d0d-4beb-82af-dfc02be15c2d',
          parentName: 'ApplicationModelBranch',
          parentUuid: 'cdb0aec6-b848-43ac-a058-fe2dbe5811f1',
          application: '5af03c98-fe5e-490b-b08f-e1230971c57f',
          headVersion: '419773b4-a73c-46ca-8913-0ee27fb2ce0a',
          name: 'master',
          description: 'The master Branch of the Library Application'
        }
      }
    },
    'f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24': {
      ids: [
        '419773b4-a73c-46ca-8913-0ee27fb2ce0a'
      ],
      entities: {
        '419773b4-a73c-46ca-8913-0ee27fb2ce0a': {
          uuid: '419773b4-a73c-46ca-8913-0ee27fb2ce0a',
          parentName: 'ApplicationVersion',
          parentUuid: 'c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24',
          name: 'Initial',
          application: '5af03c98-fe5e-490b-b08f-e1230971c57f',
          branch: '9034141b-0d0d-4beb-82af-dfc02be15c2d',
          description: 'Initial Library application version',
          previousVersion: '',
          modelStructureMigration: [],
          modelCUDMigration: []
        }
      }
    },
    'f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_16dbfe28-e1d7-4f20-9ba4-c1a9873202ad': {
      ids: [
        'a027c379-8468-43a5-ba4d-bf618be25cab',
        'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
        'e8ba151b-d68e-4cc3-9a83-3459d309ccf5'
      ],
      entities: {
        'a027c379-8468-43a5-ba4d-bf618be25cab': {
          uuid: 'a027c379-8468-43a5-ba4d-bf618be25cab',
          parentName: 'Entity',
          parentUuid: '16dbfe28-e1d7-4f20-9ba4-c1a9873202ad',
          name: 'Publisher',
          conceptLevel: 'Model',
          description: 'The publisher of a book.'
        },
        'd7a144ff-d1b9-4135-800c-a7cfc1f38733': {
          uuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
          parentName: 'Entity',
          parentUuid: '16dbfe28-e1d7-4f20-9ba4-c1a9873202ad',
          name: 'Author',
          conceptLevel: 'Model',
          description: 'The Author of a book.'
        },
        'e8ba151b-d68e-4cc3-9a83-3459d309ccf5': {
          uuid: 'e8ba151b-d68e-4cc3-9a83-3459d309ccf5',
          parentName: 'Entity',
          parentUuid: '16dbfe28-e1d7-4f20-9ba4-c1a9873202ad',
          name: 'Book',
          conceptLevel: 'Model',
          description: 'A book.'
        }
      }
    },
    'f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_54b9c72f-d4f3-4db9-9e0e-0dc840b530bd': {
      ids: [
        '797dd185-0155-43fd-b23f-f6d0af8cae06',
        '7a939fe8-d119-4e7f-ab94-95b2aae30db9',
        'b30b7180-f7dc-4cca-b4e8-e476b77fe61d'
      ],
      entities: {
        '797dd185-0155-43fd-b23f-f6d0af8cae06': {
          uuid: '797dd185-0155-43fd-b23f-f6d0af8cae06',
          parentName: 'EntityDefinition',
          parentUuid: '54b9c72f-d4f3-4db9-9e0e-0dc840b530bd',
          entityUuid: 'e8ba151b-d68e-4cc3-9a83-3459d309ccf5',
          conceptLevel: 'Model',
          name: 'Book',
          icon: 'Book',
          jzodSchema: {
            type: 'object',
            definition: {
              uuid: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 1,
                  defaultLabel: 'Uuid',
                  editable: false
                }
              },
              parentName: {
                type: 'simpleType',
                definition: 'string',
                optional: true,
                extra: {
                  id: 2,
                  defaultLabel: 'Entity Name',
                  editable: false
                }
              },
              parentUuid: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 3,
                  defaultLabel: 'Entity Uuid',
                  editable: false
                }
              },
              name: {
                type: 'simpleType',
                definition: 'string',
                extra: {
                  id: 4,
                  defaultLabel: 'Name',
                  editable: true
                }
              },
              author: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                optional: true,
                extra: {
                  id: 5,
                  defaultLabel: 'Author',
                  targetEntity: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
                  editable: true
                }
              },
              publisher: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                optional: true,
                extra: {
                  id: 5,
                  defaultLabel: 'Publisher',
                  targetEntity: 'a027c379-8468-43a5-ba4d-bf618be25cab',
                  editable: true
                }
              }
            }
          }
        },
        '7a939fe8-d119-4e7f-ab94-95b2aae30db9': {
          uuid: '7a939fe8-d119-4e7f-ab94-95b2aae30db9',
          parentName: 'EntityDefinition',
          parentUuid: '54b9c72f-d4f3-4db9-9e0e-0dc840b530bd',
          entityUuid: 'a027c379-8468-43a5-ba4d-bf618be25cab',
          conceptLevel: 'Model',
          name: 'Publisher',
          description: 'Publisher',
          icon: 'building',
          jzodSchema: {
            type: 'object',
            definition: {
              uuid: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 1,
                  defaultLabel: 'Uuid',
                  editable: false
                }
              },
              parentName: {
                type: 'simpleType',
                definition: 'string',
                optional: true,
                extra: {
                  id: 2,
                  defaultLabel: 'Entity Name',
                  editable: false
                }
              },
              parentUuid: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 3,
                  defaultLabel: 'Entity Uuid',
                  editable: false
                }
              },
              name: {
                type: 'simpleType',
                definition: 'string',
                extra: {
                  id: 4,
                  defaultLabel: 'Name',
                  editable: true
                }
              },
              icon: {
                id: 5,
                type: 'simpleType',
                definition: 'string',
                extra: {
                  defaultLabel: 'Icon',
                  editable: true
                }
              }
            }
          }
        },
        'b30b7180-f7dc-4cca-b4e8-e476b77fe61d': {
          uuid: 'b30b7180-f7dc-4cca-b4e8-e476b77fe61d',
          parentName: 'EntityDefinition',
          parentUuid: '54b9c72f-d4f3-4db9-9e0e-0dc840b530bd',
          entityUuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
          conceptLevel: 'Model',
          name: 'Author',
          description: 'author',
          icon: 'Person',
          jzodSchema: {
            type: 'object',
            definition: {
              uuid: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 1,
                  defaultLabel: 'Uuid',
                  editable: false
                }
              },
              parentName: {
                type: 'simpleType',
                definition: 'string',
                optional: true,
                extra: {
                  id: 2,
                  defaultLabel: 'Entity Name',
                  editable: false
                }
              },
              parentUuid: {
                type: 'simpleType',
                definition: 'string',
                validations: [
                  {
                    type: 'uuid'
                  }
                ],
                extra: {
                  id: 3,
                  defaultLabel: 'Entity Uuid',
                  editable: false
                }
              },
              name: {
                type: 'simpleType',
                definition: 'string',
                extra: {
                  id: 4,
                  defaultLabel: 'Name',
                  editable: true
                }
              },
              icon: {
                id: 5,
                type: 'simpleType',
                definition: 'string',
                extra: {
                  defaultLabel: 'Gender (narrow-minded)',
                  editable: true
                }
              }
            }
          }
        }
      }
    },
    'f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_3f2baa83-3ef7-45ce-82ea-6a43f7a8c916': {
      ids: [
        '66a09068-52c3-48bc-b8dd-76575bbc8e72',
        '74b010b6-afee-44e7-8590-5f0849e4a5c9',
        'a77aa662-006d-46cd-9176-01f02a1a12dc'
      ],
      entities: {
        '66a09068-52c3-48bc-b8dd-76575bbc8e72': {
          uuid: '66a09068-52c3-48bc-b8dd-76575bbc8e72',
          parentName: 'Report',
          parentUuid: '3f2baa83-3ef7-45ce-82ea-6a43f7a8c916',
          conceptLevel: 'Model',
          name: 'AuthorList',
          defaultLabel: 'List of Authors',
          type: 'list',
          definition: [
            {
              type: 'objectList',
              definition: {
                parentName: 'Author',
                parentUuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733'
              }
            }
          ]
        },
        '74b010b6-afee-44e7-8590-5f0849e4a5c9': {
          uuid: '74b010b6-afee-44e7-8590-5f0849e4a5c9',
          parentName: 'Report',
          parentUuid: '3f2baa83-3ef7-45ce-82ea-6a43f7a8c916',
          conceptLevel: 'Model',
          name: 'BookList',
          defaultLabel: 'List of Books',
          type: 'list',
          definition: [
            {
              type: 'objectList',
              definition: {
                parentName: 'Book',
                parentUuid: 'e8ba151b-d68e-4cc3-9a83-3459d309ccf5'
              }
            }
          ]
        },
        'a77aa662-006d-46cd-9176-01f02a1a12dc': {
          uuid: 'a77aa662-006d-46cd-9176-01f02a1a12dc',
          parentName: 'Report',
          parentUuid: '3f2baa83-3ef7-45ce-82ea-6a43f7a8c916',
          conceptLevel: 'Model',
          name: 'PubliserList',
          defaultLabel: 'List of Publishers',
          type: 'list',
          definition: [
            {
              type: 'objectList',
              definition: {
                parentName: 'Book',
                parentUuid: 'a027c379-8468-43a5-ba4d-bf618be25cab'
              }
            }
          ]
        }
      }
    },
    'f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_7990c0c9-86c3-40a1-a121-036c91b55ed7': {
      ids: [
        '2e5b7948-ff33-4917-acac-6ae6e1ef364f'
      ],
      entities: {
        '2e5b7948-ff33-4917-acac-6ae6e1ef364f': {
          uuid: '2e5b7948-ff33-4917-acac-6ae6e1ef364f',
          parentName: 'Configuration',
          parentUuid: '7990c0c9-86c3-40a1-a121-036c91b55ed7',
          name: 'Reference',
          defaultLabel: 'The reference configuration for the Library application database schemas.',
          definition: {
            currentModelVersion: 'TBD'
          }
        }
      }
    },
    'f714bb2f-a12d-4e71-a03b-74dcedea6eb4_data_a027c379-8468-43a5-ba4d-bf618be25cab': {
      ids: [
        '1f550a2a-33f5-4a56-83ee-302701039494',
        '516a7366-39e7-4998-82cb-80199a7fa667',
        'c1c97d54-aba8-4599-883a-7fe8f3874095'
      ],
      entities: {
        '1f550a2a-33f5-4a56-83ee-302701039494': {
          uuid: '1f550a2a-33f5-4a56-83ee-302701039494',
          parentName: 'Publisher',
          parentUuid: 'a027c379-8468-43a5-ba4d-bf618be25cab',
          name: 'Penguin',
          icon: ''
        },
        '516a7366-39e7-4998-82cb-80199a7fa667': {
          uuid: '516a7366-39e7-4998-82cb-80199a7fa667',
          parentName: 'Publisher',
          parentUuid: 'a027c379-8468-43a5-ba4d-bf618be25cab',
          name: 'Folio'
        },
        'c1c97d54-aba8-4599-883a-7fe8f3874095': {
          uuid: 'c1c97d54-aba8-4599-883a-7fe8f3874095',
          parentName: 'Publisher',
          parentUuid: 'a027c379-8468-43a5-ba4d-bf618be25cab',
          name: 'Springer'
        }
      }
    },
    'f714bb2f-a12d-4e71-a03b-74dcedea6eb4_data_d7a144ff-d1b9-4135-800c-a7cfc1f38733': {
      ids: [
        '4441169e-0c22-4fbc-81b2-28c87cf48ab2',
        'ce7b601d-be5f-4bc6-a5af-14091594046a',
        'd14c1c0c-eb2e-42d1-8ac1-2d58f5143c17',
        'e4376314-d197-457c-aa5e-d2da5f8d5977'
      ],
      entities: {
        '4441169e-0c22-4fbc-81b2-28c87cf48ab2': {
          uuid: '4441169e-0c22-4fbc-81b2-28c87cf48ab2',
          parentName: 'Author',
          parentUuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
          name: 'Don Norman'
        },
        'ce7b601d-be5f-4bc6-a5af-14091594046a': {
          uuid: 'ce7b601d-be5f-4bc6-a5af-14091594046a',
          parentName: 'Author',
          parentUuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
          name: 'Paul Veyne'
        },
        'd14c1c0c-eb2e-42d1-8ac1-2d58f5143c17': {
          uuid: 'd14c1c0c-eb2e-42d1-8ac1-2d58f5143c17',
          parentName: 'Author',
          parentUuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
          conceptLevel: 'Data',
          name: 'Cornell Woolrich'
        },
        'e4376314-d197-457c-aa5e-d2da5f8d5977': {
          uuid: 'e4376314-d197-457c-aa5e-d2da5f8d5977',
          parentName: 'Author',
          parentUuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
          conceptLevel: 'Data',
          name: 'Catherine Guérard'
        }
      }
    },
    'f714bb2f-a12d-4e71-a03b-74dcedea6eb4_data_e8ba151b-d68e-4cc3-9a83-3459d309ccf5': {
      ids: [
        '4cb917b3-3c53-4f9b-b000-b0e4c07a81f7',
        '6fefa647-7ecf-4f83-b617-69d7d5094c37',
        'c97be567-bd70-449f-843e-cd1d64ac1ddd',
        'caef8a59-39eb-48b5-ad59-a7642d3a1e8f',
        'e20e276b-619d-4e16-8816-b7ec37b53439'
      ],
      entities: {
        '4cb917b3-3c53-4f9b-b000-b0e4c07a81f7': {
          uuid: '4cb917b3-3c53-4f9b-b000-b0e4c07a81f7',
          parentName: 'Book',
          parentUuid: 'e8ba151b-d68e-4cc3-9a83-3459d309ccf5',
          name: 'Renata n\'importe quoi',
          author: 'e4376314-d197-457c-aa5e-d2da5f8d5977',
          conceptLevel: '',
          publisher: '516a7366-39e7-4998-82cb-80199a7fa667'
        },
        '6fefa647-7ecf-4f83-b617-69d7d5094c37': {
          uuid: '6fefa647-7ecf-4f83-b617-69d7d5094c37',
          parentName: 'Book',
          parentUuid: 'e8ba151b-d68e-4cc3-9a83-3459d309ccf5',
          name: 'The Bride Wore Black',
          author: 'd14c1c0c-eb2e-42d1-8ac1-2d58f5143c17',
          conceptLevel: '',
          publisher: 'c1c97d54-aba8-4599-883a-7fe8f3874095'
        },
        'c97be567-bd70-449f-843e-cd1d64ac1ddd': {
          uuid: 'c97be567-bd70-449f-843e-cd1d64ac1ddd',
          parentName: 'Book',
          parentUuid: 'e8ba151b-d68e-4cc3-9a83-3459d309ccf5',
          name: 'Rear Window',
          author: 'd14c1c0c-eb2e-42d1-8ac1-2d58f5143c17',
          conceptLevel: '',
          publisher: '1f550a2a-33f5-4a56-83ee-302701039494'
        },
        'caef8a59-39eb-48b5-ad59-a7642d3a1e8f': {
          uuid: 'caef8a59-39eb-48b5-ad59-a7642d3a1e8f',
          parentName: 'Book',
          parentUuid: 'e8ba151b-d68e-4cc3-9a83-3459d309ccf5',
          conceptLevel: 'Data',
          name: 'Et dans l\'éternité je ne m\'ennuierai pas',
          author: 'ce7b601d-be5f-4bc6-a5af-14091594046a',
          publisher: '516a7366-39e7-4998-82cb-80199a7fa667'
        },
        'e20e276b-619d-4e16-8816-b7ec37b53439': {
          uuid: 'e20e276b-619d-4e16-8816-b7ec37b53439',
          parentName: 'Book',
          parentUuid: 'e8ba151b-d68e-4cc3-9a83-3459d309ccf5',
          name: 'The Design of Everyday Things',
          author: '4441169e-0c22-4fbc-81b2-28c87cf48ab2',
          conceptLevel: '',
          publisher: 'c1c97d54-aba8-4599-883a-7fe8f3874095'
        }
      }
    }
} as unknown as LocalCacheDeploymentSectionEntitySliceState;

const domainStateForSliceState = {
  "10ff36f2-50a3-48d8-b80f-e48e5d13af8e": {
    model: {
      "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad": {
        "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad": {
          uuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          name: "Entity",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "MetaModel",
          description: "The Metaclass for entities.",
        },
        "35c5608a-7678-4f07-a4ec-76fc5bc35424": {
          uuid: "35c5608a-7678-4f07-a4ec-76fc5bc35424",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          name: "ApplicationDeployment",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "An Application Deployment",
        },
        "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916": {
          uuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          name: "Report",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "Report, allowing to display model instances",
        },
        "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd": {
          uuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          name: "EntityDefinition",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "MetaModel",
          description: "The Metaclass for the definition of entities.",
        },
        "5e81e1b9-38be-487c-b3e5-53796c57fccf": {
          uuid: "5e81e1b9-38be-487c-b3e5-53796c57fccf",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          name: "JzodSchema",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "Common Jzod Schema definitions, available to all Entity definitions",
        },
        "7990c0c9-86c3-40a1-a121-036c91b55ed7": {
          uuid: "7990c0c9-86c3-40a1-a121-036c91b55ed7",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          name: "StoreBasedConfiguration",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "A configuration of storage-related aspects of a Model.",
        },
        "8bec933d-6287-4de7-8a88-5c24216de9f4": {
          uuid: "8bec933d-6287-4de7-8a88-5c24216de9f4",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          name: "ApplicationVersionCrossEntityDefinition",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "The (many-to-many) sssociation among ApplicationVersions and EntityDefinitions.",
        },
        "a659d350-dd97-4da9-91de-524fa01745dc": {
          uuid: "a659d350-dd97-4da9-91de-524fa01745dc",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          name: "Application",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "An Application",
        },
        "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24": {
          uuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          name: "ApplicationVersion",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "A Version of an Application",
        },
        "cdb0aec6-b848-43ac-a058-fe2dbe5811f1": {
          uuid: "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          name: "ApplicationModelBranch",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "A Branch of an Application Model",
        },
      },
      "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd": {
        "15407b85-f2c8-4a34-bfa7-89f044ba2407": {
          uuid: "15407b85-f2c8-4a34-bfa7-89f044ba2407",
          parentName: "EntityDefinition",
          parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
          entityUuid: "5e81e1b9-38be-487c-b3e5-53796c57fccf",
          conceptLevel: "Model",
          name: "JzodSchema",
          icon: "Interests",
          jzodSchema: {
            type: "object",
            definition: {
              jzodArraySchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: { type: "record", definition: { type: "simpleType", definition: "any" }, optional: true },
                  type: { type: "literal", definition: "array" },
                  definition: { type: "schemaReference", relativePath: "jzodElementSchema" },
                },
              },
              jzodAttributeSchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: { type: "record", definition: { type: "simpleType", definition: "any" }, optional: true },
                  type: { type: "literal", definition: "simpleType" },
                  definition: { type: "schemaReference", relativePath: "jzodEnumTypesSchema" },
                },
              },
              jzodAttributeStringWithValidationsSchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: { type: "record", definition: { type: "simpleType", definition: "any" }, optional: true },
                  type: { type: "literal", definition: "simpleType" },
                  definition: { type: "literal", definition: "string" },
                  validations: {
                    type: "array",
                    definition: { type: "schemaReference", relativePath: "jzodAttributeStringValidationsSchema" },
                  },
                },
              },
              jzodAttributeStringValidationsSchema: {
                type: "object",
                definition: {
                  extra: {
                    optional: true,
                    type: "object",
                    definition: {
                      id: { type: "simpleType", definition: "number" },
                      defaultLabel: { type: "simpleType", definition: "string" },
                      editable: { type: "simpleType", definition: "boolean" },
                    },
                  },
                  type: {
                    type: "enum",
                    definition: [
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
                      "ip",
                    ],
                  },
                  parameter: { type: "simpleType", definition: "any" },
                },
              },
              jzodElementSchema: {
                type: "union",
                definition: [
                  { type: "schemaReference", relativePath: "jzodArraySchema" },
                  { type: "schemaReference", relativePath: "jzodAttributeSchema" },
                  { type: "schemaReference", relativePath: "jzodAttributeStringWithValidationsSchema" },
                  { type: "schemaReference", relativePath: "jzodEnumSchema" },
                  { type: "schemaReference", relativePath: "jzodFunctionSchema" },
                  { type: "schemaReference", relativePath: "jzodLazySchema" },
                  { type: "schemaReference", relativePath: "jzodLiteralSchema" },
                  { type: "schemaReference", relativePath: "jzodObjectSchema" },
                  { type: "schemaReference", relativePath: "jzodRecordSchema" },
                  { type: "schemaReference", relativePath: "jzodReferenceSchema" },
                  { type: "schemaReference", relativePath: "jzodUnionSchema" },
                ],
              },
              jzodElementSetSchema: {
                type: "record",
                definition: { type: "schemaReference", relativePath: "jzodElementSchema" },
              },
              jzodEnumSchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: { type: "record", definition: { type: "simpleType", definition: "any" }, optional: true },
                  type: { type: "literal", definition: "enum" },
                  definition: { type: "array", definition: { type: "simpleType", definition: "string" } },
                },
              },
              jzodEnumTypesSchema: { type: "enum", definition: ["any", "boolean", "number", "string", "uuid"] },
              jzodFunctionSchema: {
                type: "object",
                definition: {
                  type: { type: "literal", definition: "function" },
                  args: { type: "array", definition: { type: "schemaReference", relativePath: "jzodAttributeSchema" } },
                  returns: { type: "schemaReference", relativePath: "jzodAttributeSchema", optional: true },
                },
              },
              jzodLazySchema: {
                type: "object",
                definition: {
                  type: { type: "literal", definition: "lazy" },
                  definition: { type: "schemaReference", relativePath: "jzodFunctionSchema" },
                },
              },
              jzodLiteralSchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: { type: "record", definition: { type: "simpleType", definition: "any" }, optional: true },
                  type: { type: "literal", definition: "literal" },
                  definition: { type: "simpleType", definition: "string" },
                },
              },
              jzodObjectSchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: { type: "record", definition: { type: "simpleType", definition: "any" }, optional: true },
                  type: { type: "literal", definition: "object" },
                  definition: {
                    type: "record",
                    definition: { type: "schemaReference", relativePath: "jzodElementSchema" },
                  },
                },
              },
              jzodRecordSchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: { type: "record", definition: { type: "simpleType", definition: "any" }, optional: true },
                  type: { type: "literal", definition: "record" },
                  definition: { type: "schemaReference", relativePath: "jzodElementSchema" },
                },
              },
              jzodReferenceSchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: { type: "record", definition: { type: "simpleType", definition: "any" }, optional: true },
                  type: { type: "literal", definition: "schemaReference" },
                  definition: { type: "simpleType", definition: "string", optional: true },
                  relativePath: { type: "simpleType", definition: "string", optional: true },
                  absolutePath: { type: "simpleType", definition: "string", optional: true },
                },
              },
              jzodUnionSchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: { type: "record", definition: { type: "simpleType", definition: "any" }, optional: true },
                  type: { type: "literal", definition: "union" },
                  definition: {
                    type: "array",
                    definition: { type: "schemaReference", relativePath: "jzodElementSchema" },
                  },
                },
              },
            },
          },
          attributes: [
            {
              id: 1,
              name: "jzodSchema",
              defaultLabel: "Jzod Schema",
              type: "OBJECT",
              nullable: false,
              editable: false,
            },
          ],
          attributesNew: [
            {
              id: 1,
              name: "jzodSchema",
              defaultLabel: "Jzod Schema",
              jzodSchema: { type: "schemaReference", definition: "jzodObjectSchema" },
              nullable: false,
              editable: false,
            },
          ],
        },
        "27046fce-742f-4cc4-bb95-76b271f490a5": {
          uuid: "27046fce-742f-4cc4-bb95-76b271f490a5",
          parentName: "EntityDefinition",
          parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
          entityUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
          conceptLevel: "Model",
          name: "ApplicationVersion",
          icon: "Interests",
          jzodSchema: {
            type: "object",
            definition: {
              uuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: { id: 1, defaultLabel: "Uuid", editable: false },
              },
              parentName: {
                type: "simpleType",
                definition: "string",
                optional: true,
                extra: { id: 2, defaultLabel: "Entity Name", editable: false },
              },
              parentUuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: { id: 3, defaultLabel: "Entity Uuid", editable: false },
              },
              name: {
                type: "simpleType",
                definition: "string",
                extra: { id: 4, defaultLabel: "Name", editable: true },
              },
              defaultLabel: {
                type: "simpleType",
                definition: "string",
                extra: { id: 5, defaultLabel: "Default Label", editable: true },
              },
              description: {
                type: "simpleType",
                definition: "string",
                optional: true,
                extra: { id: 6, defaultLabel: "Description", editable: true },
              },
              type: {
                type: "simpleType",
                definition: "string",
                optional: true,
                extra: { id: 7, defaultLabel: "Type of Report", editable: true },
              },
              application: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: {
                  id: 8,
                  defaultLabel: "Application",
                  targetEntity: "a659d350-dd97-4da9-91de-524fa01745dc",
                  editable: false,
                },
              },
              branch: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: {
                  id: 9,
                  defaultLabel: "Branch",
                  description: "The Branch of this Application Version",
                  targetEntity: "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
                  editable: false,
                },
              },
              previousVersion: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: {
                  id: 10,
                  defaultLabel: "Previous Application Version",
                  description: "Previous version of the application on this Branch.",
                  targetEntity: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
                  editable: false,
                },
              },
              modelStructureMigration: {
                type: "schemaReference",
                optional: true,
                extra: { id: 11, defaultLabel: "Structure Migration from Previous Version", editable: true },
                relativePath: "jzodObjectSchema",
              },
              modelCUDMigration: {
                type: "schemaReference",
                optional: true,
                extra: { id: 12, defaultLabel: "Create-Update-Delete Migration from Previous Version", editable: true },
                relativePath: "jzodObjectSchema",
              },
            },
          },
        },
        "381ab1be-337f-4198-b1d3-f686867fc1dd": {
          uuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          parentName: "EntityDefinition",
          parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
          entityUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          name: "Entity",
          conceptLevel: "MetaModel",
          description: "Entities",
          jzodSchema: {
            type: "object",
            definition: {
              uuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: { id: 1, defaultLabel: "Uuid", editable: false },
              },
              parentName: {
                type: "simpleType",
                definition: "string",
                optional: true,
                extra: { id: 2, defaultLabel: "Entity Name", editable: false },
              },
              parentUuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: { id: 3, defaultLabel: "Entity Uuid", editable: false },
              },
              conceptLevel: {
                type: "enum",
                definition: ["MetaModel", "Model", "Data"],
                optional: true,
                extra: { id: 4, defaultLabel: "Concept Level", editable: false },
              },
              name: {
                type: "simpleType",
                definition: "string",
                extra: { id: 5, defaultLabel: "Name", editable: true },
              },
              author: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                optional: true,
                extra: {
                  id: 6,
                  defaultLabel: "Application",
                  targetEntity: "a659d350-dd97-4da9-91de-524fa01745dc",
                  editable: true,
                },
              },
              description: {
                type: "simpleType",
                definition: "string",
                optional: true,
                extra: { id: 7, defaultLabel: "Description", editable: true },
              },
            },
          },
        },
        "69bf7c03-a1df-4d1c-88c1-44363feeea87": {
          uuid: "69bf7c03-a1df-4d1c-88c1-44363feeea87",
          parentName: "EntityDefinition",
          parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
          entityUuid: "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
          conceptLevel: "Model",
          name: "ApplicationModelBranch",
          icon: "Interests",
          jzodSchema: {
            type: "object",
            definition: {
              uuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: { id: 1, defaultLabel: "Uuid", editable: false },
              },
              parentName: {
                type: "simpleType",
                definition: "string",
                optional: true,
                extra: { id: 2, defaultLabel: "Entity Name", editable: false },
              },
              parentUuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: {
                  id: 3,
                  defaultLabel: "Entity Uuid",
                  targetEntityApplicationSection: "model",
                  targetEntity: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                  editable: false,
                },
              },
              conceptLevel: {
                type: "enum",
                definition: ["MetaModel", "Model", "Data"],
                optional: true,
                extra: { id: 4, defaultLabel: "Concept Level", editable: false },
              },
              name: {
                type: "simpleType",
                definition: "string",
                extra: { id: 5, defaultLabel: "Name", editable: true },
              },
              defaultLabel: {
                type: "simpleType",
                definition: "string",
                extra: { id: 6, defaultLabel: "Name", editable: true },
              },
              application: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: {
                  id: 7,
                  defaultLabel: "Application",
                  targetEntity: "a659d350-dd97-4da9-91de-524fa01745dc",
                  editable: false,
                },
              },
              headVersion: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                optional: true,
                extra: {
                  id: 8,
                  defaultLabel: "Head Version",
                  targetEntity: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
                  editable: true,
                },
              },
              description: {
                type: "simpleType",
                definition: "string",
                optional: true,
                extra: { id: 9, defaultLabel: "Description", editable: true },
              },
            },
          },
        },
        "9460420b-f176-4918-bd45-894ab195ffe9": {
          uuid: "9460420b-f176-4918-bd45-894ab195ffe9",
          parentName: "EntityDefinition",
          parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
          entityUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
          conceptLevel: "Model",
          name: "Application",
          icon: "Interests",
          jzodSchema: {
            type: "object",
            definition: {
              uuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: { id: 1, defaultLabel: "Uuid", editable: false },
              },
              parentName: {
                type: "simpleType",
                definition: "string",
                optional: true,
                extra: { id: 2, defaultLabel: "Entity Name", editable: false },
              },
              parentUuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: { id: 3, defaultLabel: "Entity Uuid", editable: false },
              },
              name: {
                type: "simpleType",
                definition: "string",
                extra: { id: 4, defaultLabel: "Name", editable: true },
              },
              defaultLabel: {
                type: "simpleType",
                definition: "string",
                extra: { id: 5, defaultLabel: "Default Label", editable: true },
              },
              description: {
                type: "simpleType",
                definition: "string",
                optional: true,
                extra: { id: 6, defaultLabel: "Description", editable: true },
              },
            },
          },
        },
        "952d2c65-4da2-45c2-9394-a0920ceedfb6": {
          uuid: "952d2c65-4da2-45c2-9394-a0920ceedfb6",
          parentName: "EntityDefinition",
          parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
          entityUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
          conceptLevel: "Model",
          name: "Report",
          icon: "Interests",
          jzodSchema: {
            type: "object",
            definition: {
              uuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: { id: 1, defaultLabel: "Uuid", editable: false },
              },
              parentName: {
                type: "simpleType",
                definition: "string",
                optional: true,
                extra: { id: 2, defaultLabel: "Entity Name", editable: false },
              },
              parentUuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: { id: 3, defaultLabel: "Entity Uuid", editable: false },
              },
              conceptLevel: {
                type: "enum",
                definition: ["MetaModel", "Model", "Data"],
                optional: true,
                extra: { id: 4, defaultLabel: "Concept Level", editable: false },
              },
              name: {
                type: "simpleType",
                definition: "string",
                extra: { id: 5, defaultLabel: "Name", editable: true },
              },
              defaultLabel: {
                type: "simpleType",
                definition: "string",
                extra: { id: 6, defaultLabel: "Default Label", editable: true },
              },
              type: {
                type: "simpleType",
                definition: "string",
                optional: true,
                extra: { id: 7, defaultLabel: "Type of Report", editable: true },
              },
              application: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                optional: true,
                extra: {
                  id: 8,
                  defaultLabel: "Application",
                  targetEntity: "a659d350-dd97-4da9-91de-524fa01745dc",
                  editable: true,
                },
              },
              definition: {
                type: "simpleType",
                definition: "string",
                extra: { id: 9, defaultLabel: "Definition", editable: true },
              },
            },
          },
        },
        "bd303ae8-6bce-4b44-a63c-815b9ebf728b": {
          uuid: "bd303ae8-6bce-4b44-a63c-815b9ebf728b",
          parentName: "EntityDefinition",
          parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
          entityUuid: "35c5608a-7678-4f07-a4ec-76fc5bc35424",
          conceptLevel: "Model",
          name: "ApplicationDeployment",
          icon: "Interests",
          jzodSchema: {
            type: "object",
            definition: {
              uuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: { id: 1, defaultLabel: "Uuid", editable: false },
              },
              parentName: {
                type: "simpleType",
                definition: "string",
                optional: true,
                extra: { id: 2, defaultLabel: "Entity Name", editable: false },
              },
              parentUuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: { id: 3, defaultLabel: "Entity Uuid", editable: false },
              },
              name: {
                type: "simpleType",
                definition: "string",
                extra: { id: 4, defaultLabel: "Name", editable: true },
              },
              defaultLabel: {
                type: "simpleType",
                definition: "string",
                extra: { id: 5, defaultLabel: "Default Label", editable: true },
              },
              description: {
                type: "simpleType",
                definition: "string",
                optional: true,
                extra: { id: 6, defaultLabel: "Description", editable: true },
              },
              application: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: {
                  id: 7,
                  defaultLabel: "Application",
                  description: "The Application of the Branch.",
                  targetEntity: "a659d350-dd97-4da9-91de-524fa01745dc",
                  editable: false,
                },
              },
              model: {
                type: "schemaReference",
                optional: true,
                extra: { id: 8, defaultLabel: "Application Deployment Model", editable: true },
                relativePath: "jzodObjectSchema",
              },
              data: {
                type: "schemaReference",
                optional: true,
                extra: { id: 9, defaultLabel: "Application Deployment Data", editable: true },
                relativePath: "jzodObjectSchema",
              },
            },
          },
        },
        "bdd7ad43-f0fc-4716-90c1-87454c40dd95": {
          uuid: "bdd7ad43-f0fc-4716-90c1-87454c40dd95",
          parentName: "EntityDefinition",
          parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
          entityUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
          name: "EntityDefinition",
          conceptLevel: "MetaModel",
          description: "definition of an entity",
          jzodSchema: {
            type: "object",
            definition: {
              uuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: { id: 1, defaultLabel: "Uuid", editable: false },
              },
              parentName: {
                type: "simpleType",
                definition: "string",
                extra: { id: 2, defaultLabel: "Entity Name", editable: false },
              },
              parentUuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: { id: 1, defaultLabel: "Entity Uuid", editable: false },
              },
              name: {
                type: "simpleType",
                definition: "string",
                extra: { id: 1, defaultLabel: "Name", editable: false },
              },
              conceptLevel: {
                type: "enum",
                definition: ["MetaModel", "Model", "Data"],
                optional: true,
                extra: { id: 1, defaultLabel: "Concept Level", editable: false },
              },
              description: {
                type: "simpleType",
                definition: "string",
                optional: true,
                extra: { id: 1, defaultLabel: "Description", editable: true },
              },
              jzodSchema: {
                type: "schemaReference",
                absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                relativePath: "jzodObjectSchema",
                optional: true,
              },
            },
          },
        },
        "c0b71083-8cc8-43db-bf52-572f1f03bbb5": {
          uuid: "c0b71083-8cc8-43db-bf52-572f1f03bbb5",
          parentName: "EntityDefinition",
          parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
          entityUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
          conceptLevel: "Model",
          name: "ApplicationVersionCrossEntityDefinition",
          description: "The mapping among Application Versions and Entity Definitions",
          icon: "Interests",
          jzodSchema: {
            type: "object",
            definition: {
              uuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: { id: 1, defaultLabel: "Uuid", editable: false },
              },
              parentName: {
                type: "simpleType",
                definition: "string",
                optional: true,
                extra: { id: 2, defaultLabel: "Entity Name", editable: false },
              },
              parentUuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: {
                  id: 3,
                  defaultLabel: "Entity Uuid",
                  description: "The Parent Entity of this Instance",
                  targetEntity: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                  editable: false,
                },
              },
              name: {
                type: "simpleType",
                definition: "string",
                extra: { id: 4, defaultLabel: "Name", editable: true },
              },
              defaultLabel: {
                type: "simpleType",
                definition: "string",
                extra: { id: 5, defaultLabel: "Default Label", editable: true },
              },
              description: {
                type: "simpleType",
                definition: "string",
                optional: true,
                extra: { id: 6, defaultLabel: "Description", editable: true },
              },
              application: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: {
                  id: 7,
                  defaultLabel: "Application",
                  description: "The Application of the Branch.",
                  targetEntity: "a659d350-dd97-4da9-91de-524fa01745dc",
                  editable: false,
                },
              },
              applicationVersion: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: {
                  id: 7,
                  defaultLabel: "Application Version",
                  description: "The Application Version of this mapping.",
                  targetEntity: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
                  editable: false,
                },
              },
              entity: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: {
                  id: 7,
                  defaultLabel: "Entity",
                  description: "The Entity definition of this mapping.",
                  targetEntity: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
                  editable: false,
                },
              },
            },
          },
        },
        "f93af951-ea13-4815-a2e3-ec0cab1fadd2": {
          uuid: "f93af951-ea13-4815-a2e3-ec0cab1fadd2",
          parentName: "EntityDefinition",
          parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
          entityUuid: "7990c0c9-86c3-40a1-a121-036c91b55ed7",
          conceptLevel: "Model",
          name: "StoreBasedConfiguration",
          icon: "Interests",
          jzodSchema: {
            type: "object",
            definition: {
              uuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: { id: 1, defaultLabel: "Uuid", editable: false },
              },
              parentName: {
                type: "simpleType",
                definition: "string",
                optional: true,
                extra: { id: 2, defaultLabel: "Entity Name", editable: false },
              },
              parentUuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: { id: 3, defaultLabel: "Entity Uuid", editable: false },
              },
              name: {
                type: "simpleType",
                definition: "string",
                extra: { id: 4, defaultLabel: "Name", editable: true },
              },
              defaultLabel: {
                type: "simpleType",
                definition: "string",
                extra: { id: 5, defaultLabel: "Default Label", editable: true },
              },
              definition: {
                type: "schemaReference",
                optional: true,
                extra: { id: 8, defaultLabel: "The configuration itself", editable: true },
                relativePath: "jzodObjectSchema",
              },
            },
          },
        },
      },
    },
    data: {
      "35c5608a-7678-4f07-a4ec-76fc5bc35424": {
        "10ff36f2-50a3-48d8-b80f-e48e5d13af8e": {
          uuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
          parentName: "ApplicationDeployment",
          parentUuid: "35c5608a-7678-4f07-a4ec-76fc5bc35424",
          name: "DefaultMiroirApplicationDeployment",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          applicationModelLevel: "metamodel",
          description: "The default Deployment for Application Miroir",
          model: {
            location: {
              type: "sql",
              side: "server",
              connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
              schema: "miroir",
            },
          },
          data: {
            location: {
              type: "sql",
              side: "server",
              connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
              schema: "miroir",
            },
          },
        },
      },
      "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916": {
        "0810de28-fdab-4baf-8935-7e04a8f779a9": {
          uuid: "0810de28-fdab-4baf-8935-7e04a8f779a9",
          parentName: "Report",
          parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
          name: "ApplicationVersionList",
          defaultLabel: "List of Aplication Versions",
          type: "list",
          definition: [
            {
              type: "objectList",
              definition: { parentName: "ApplicationVersion", parentUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24" },
            },
          ],
        },
        "0e4cf674-3a26-422a-8618-09e32302ac0c": {
          uuid: "0e4cf674-3a26-422a-8618-09e32302ac0c",
          parentName: "Report",
          parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
          name: "ApplicationList",
          defaultLabel: "List of Applications",
          type: "list",
          definition: [
            {
              type: "objectList",
              definition: { parentName: "Application", parentUuid: "a659d350-dd97-4da9-91de-524fa01745dc" },
            },
          ],
        },
        "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855": {
          uuid: "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855",
          parentName: "Report",
          parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
          name: "ReportList",
          defaultLabel: "List of Reports",
          type: "list",
          definition: [
            {
              type: "objectList",
              definition: { parentName: "Report", parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916" },
            },
          ],
        },
        "43f04807-8f96-43f9-876f-9a0210f7b99c": {
          uuid: "43f04807-8f96-43f9-876f-9a0210f7b99c",
          parentName: "Report",
          parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
          name: "StoreBasedConfigurationList",
          defaultLabel: "Store-based Configuration",
          type: "list",
          definition: [
            {
              type: "objectList",
              definition: { parentName: "StoreBasedConfiguration", parentUuid: "7990c0c9-86c3-40a1-a121-036c91b55ed7" },
            },
          ],
        },
        "60648b22-e2c6-4b74-8031-53884f597d63": {
          uuid: "60648b22-e2c6-4b74-8031-53884f597d63",
          parentName: "Report",
          parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
          name: "ApplicationModelBranchList",
          defaultLabel: "List of Application Model Branches",
          type: "list",
          definition: [
            {
              type: "objectList",
              definition: { parentName: "ApplicationModelBranch", parentUuid: "cdb0aec6-b848-43ac-a058-fe2dbe5811f1" },
            },
          ],
        },
        "8b22e84e-9374-4121-b2a7-d13d947a0ba2": {
          uuid: "8b22e84e-9374-4121-b2a7-d13d947a0ba2",
          parentName: "Report",
          parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
          name: "JzodSchemaList",
          defaultLabel: "List of Jzod Schemas",
          type: "list",
          definition: [
            {
              type: "objectList",
              definition: { parentName: "JzodSchema", parentUuid: "5e81e1b9-38be-487c-b3e5-53796c57fccf" },
            },
          ],
        },
        "c9ea3359-690c-4620-9603-b5b402e4a2b9": {
          uuid: "c9ea3359-690c-4620-9603-b5b402e4a2b9",
          parentName: "Report",
          parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
          name: "EntityList",
          defaultLabel: "List of Entities",
          type: "list",
          definition: [
            {
              type: "objectList",
              definition: { parentName: "Entity", parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad" },
            },
          ],
        },
        "df0a9a8f-e0f6-4f9f-8635-c8460e638e1b": {
          uuid: "df0a9a8f-e0f6-4f9f-8635-c8460e638e1b",
          parentName: "Report",
          parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
          name: "ApplicationDeploymentList",
          defaultLabel: "List of Application Deployments",
          type: "list",
          definition: [
            {
              type: "objectList",
              definition: { parentName: "ApplicationDeployment", parentUuid: "35c5608a-7678-4f07-a4ec-76fc5bc35424" },
            },
          ],
        },
        "f9aff35d-8636-4519-8361-c7648e0ddc68": {
          uuid: "f9aff35d-8636-4519-8361-c7648e0ddc68",
          parentName: "Report",
          parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
          name: "EntityDefinitionList",
          defaultLabel: "List of Entity Definitions",
          type: "list",
          definition: [
            {
              type: "objectList",
              definition: { parentName: "Entity", parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd" },
            },
          ],
        },
      },
      "5e81e1b9-38be-487c-b3e5-53796c57fccf": {
        "04f8773e-1c9d-4e5a-853e-1f94982f2e94": {
          uuid: "04f8773e-1c9d-4e5a-853e-1f94982f2e94",
          parentName: "JzodSchema",
          parentUuid: "5e81e1b9-38be-487c-b3e5-53796c57fccf",
          name: "jzodBootstrapSchema",
          defaultLabel:
            "The Jzod Schema of all Jzod Schemas. Comes from the @miroir-framework/jzod library. Parses itself.",
          definition: {
            type: "object",
            definition: {
              jzodArraySchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: { type: "record", definition: { type: "simpleType", definition: "any" }, optional: true },
                  type: { type: "literal", definition: "array" },
                  definition: { type: "schemaReference", relativePath: "jzodElementSchema" },
                },
              },
              jzodAttributeSchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: { type: "record", definition: { type: "simpleType", definition: "any" }, optional: true },
                  type: { type: "literal", definition: "simpleType" },
                  definition: { type: "schemaReference", relativePath: "jzodEnumTypesSchema" },
                },
              },
              jzodAttributeStringWithValidationsSchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: { type: "record", definition: { type: "simpleType", definition: "any" }, optional: true },
                  type: { type: "literal", definition: "simpleType" },
                  definition: { type: "literal", definition: "string" },
                  validations: {
                    type: "array",
                    definition: { type: "schemaReference", relativePath: "jzodAttributeStringValidationsSchema" },
                  },
                },
              },
              jzodAttributeStringValidationsSchema: {
                type: "object",
                definition: {
                  extra: { type: "record", definition: { type: "simpleType", definition: "any" }, optional: true },
                  type: {
                    type: "enum",
                    definition: [
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
                      "ip",
                    ],
                  },
                  parameter: { type: "simpleType", definition: "any" },
                },
              },
              jzodElementSchema: {
                type: "union",
                definition: [
                  { type: "schemaReference", relativePath: "jzodArraySchema" },
                  { type: "schemaReference", relativePath: "jzodAttributeSchema" },
                  { type: "schemaReference", relativePath: "jzodAttributeStringWithValidationsSchema" },
                  { type: "schemaReference", relativePath: "jzodEnumSchema" },
                  { type: "schemaReference", relativePath: "jzodFunctionSchema" },
                  { type: "schemaReference", relativePath: "jzodLazySchema" },
                  { type: "schemaReference", relativePath: "jzodLiteralSchema" },
                  { type: "schemaReference", relativePath: "jzodObjectSchema" },
                  { type: "schemaReference", relativePath: "jzodRecordSchema" },
                  { type: "schemaReference", relativePath: "jzodReferenceSchema" },
                  { type: "schemaReference", relativePath: "jzodUnionSchema" },
                ],
              },
              jzodElementSetSchema: {
                type: "record",
                definition: { type: "schemaReference", relativePath: "jzodElementSchema" },
              },
              jzodEnumSchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: { type: "record", definition: { type: "simpleType", definition: "any" }, optional: true },
                  type: { type: "literal", definition: "enum" },
                  definition: { type: "array", definition: { type: "simpleType", definition: "string" } },
                },
              },
              jzodEnumTypesSchema: { type: "enum", definition: ["any", "boolean", "number", "string", "uuid"] },
              jzodFunctionSchema: {
                type: "object",
                definition: {
                  type: { type: "literal", definition: "function" },
                  args: { type: "array", definition: { type: "schemaReference", relativePath: "jzodAttributeSchema" } },
                  returns: { type: "schemaReference", relativePath: "jzodAttributeSchema", optional: true },
                },
              },
              jzodLazySchema: {
                type: "object",
                definition: {
                  type: { type: "literal", definition: "lazy" },
                  definition: { type: "schemaReference", relativePath: "jzodFunctionSchema" },
                },
              },
              jzodLiteralSchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: { type: "record", definition: { type: "simpleType", definition: "any" }, optional: true },
                  type: { type: "literal", definition: "literal" },
                  definition: { type: "simpleType", definition: "string" },
                },
              },
              jzodObjectSchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: { type: "record", definition: { type: "simpleType", definition: "any" }, optional: true },
                  type: { type: "literal", definition: "object" },
                  definition: {
                    type: "record",
                    definition: { type: "schemaReference", relativePath: "jzodElementSchema" },
                  },
                },
              },
              jzodRecordSchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: { type: "record", definition: { type: "simpleType", definition: "any" }, optional: true },
                  type: { type: "literal", definition: "record" },
                  definition: { type: "schemaReference", relativePath: "jzodElementSchema" },
                },
              },
              jzodReferenceSchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: { type: "record", definition: { type: "simpleType", definition: "any" }, optional: true },
                  type: { type: "literal", definition: "schemaReference" },
                  definition: { type: "simpleType", definition: "string" },
                },
              },
              jzodUnionSchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: { type: "record", definition: { type: "simpleType", definition: "any" }, optional: true },
                  type: { type: "literal", definition: "union" },
                  definition: {
                    type: "array",
                    definition: { type: "schemaReference", relativePath: "jzodElementSchema" },
                  },
                },
              },
            },
          },
        },
        "1e8dab4b-65a3-4686-922e-ce89a2d62aa9": {
          uuid: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
          parentName: "JzodSchema",
          parentUuid: "5e81e1b9-38be-487c-b3e5-53796c57fccf",
          name: "jzodMiroirBootstrapSchema",
          defaultLabel: "The Jzod Schema for Miroir Jzod Schemas. Parses itself.",
          definition: {
            type: "object",
            definition: {
              jzodBasicExtraSchema: {
                optional: true,
                type: "object",
                definition: {
                  id: { type: "simpleType", definition: "number" },
                  defaultLabel: { type: "simpleType", definition: "string" },
                  editable: { type: "simpleType", definition: "boolean" },
                },
              },
              jzodArraySchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: { type: "schemaReference", relativePath: "jzodBasicExtraSchema" },
                  type: { type: "literal", definition: "array" },
                  definition: { type: "schemaReference", relativePath: "jzodElementSchema" },
                },
              },
              jzodAttributeSchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: {
                    optional: true,
                    type: "object",
                    definition: {
                      id: { type: "simpleType", definition: "number" },
                      defaultLabel: { type: "simpleType", definition: "string" },
                      description: { type: "simpleType", definition: "string", optional: true },
                      editable: { type: "simpleType", definition: "boolean" },
                      targetEntityApplicationSection: { type: "enum", definition: ["model", "data"], optional: true },
                      targetEntity: {
                        type: "simpleType",
                        definition: "string",
                        validations: [{ type: "uuid" }],
                        optional: true,
                      },
                    },
                  },
                  type: { type: "literal", definition: "simpleType" },
                  definition: { type: "schemaReference", relativePath: "jzodEnumTypesSchema" },
                },
              },
              jzodAttributeStringWithValidationsSchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: {
                    optional: true,
                    type: "object",
                    definition: {
                      id: { type: "simpleType", definition: "number" },
                      defaultLabel: { type: "simpleType", definition: "string" },
                      editable: { type: "simpleType", definition: "boolean" },
                      targetEntity: { type: "simpleType", definition: "string", validations: [{ type: "uuid" }] },
                    },
                  },
                  type: { type: "literal", definition: "simpleType" },
                  definition: { type: "literal", definition: "string" },
                  validations: {
                    type: "array",
                    definition: { type: "schemaReference", relativePath: "jzodAttributeStringValidationsSchema" },
                  },
                },
              },
              jzodAttributeStringValidationsSchema: {
                type: "object",
                definition: {
                  extra: {
                    optional: true,
                    type: "object",
                    definition: {
                      id: { type: "simpleType", definition: "number" },
                      defaultLabel: { type: "simpleType", definition: "string" },
                      editable: { type: "simpleType", definition: "boolean" },
                    },
                  },
                  type: {
                    type: "enum",
                    definition: [
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
                      "ip",
                    ],
                  },
                  parameter: { type: "simpleType", definition: "any" },
                },
              },
              jzodElementSchema: {
                type: "union",
                definition: [
                  { type: "schemaReference", relativePath: "jzodArraySchema" },
                  { type: "schemaReference", relativePath: "jzodAttributeSchema" },
                  { type: "schemaReference", relativePath: "jzodAttributeStringWithValidationsSchema" },
                  { type: "schemaReference", relativePath: "jzodEnumSchema" },
                  { type: "schemaReference", relativePath: "jzodFunctionSchema" },
                  { type: "schemaReference", relativePath: "jzodLazySchema" },
                  { type: "schemaReference", relativePath: "jzodLiteralSchema" },
                  { type: "schemaReference", relativePath: "jzodObjectSchema" },
                  { type: "schemaReference", relativePath: "jzodRecordSchema" },
                  { type: "schemaReference", relativePath: "jzodReferenceSchema" },
                  { type: "schemaReference", relativePath: "jzodUnionSchema" },
                ],
              },
              jzodElementSetSchema: {
                type: "record",
                definition: { type: "schemaReference", relativePath: "jzodElementSchema" },
              },
              jzodEnumSchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: {
                    optional: true,
                    type: "object",
                    definition: {
                      id: { type: "simpleType", definition: "number" },
                      defaultLabel: { type: "simpleType", definition: "string" },
                      editable: { type: "simpleType", definition: "boolean" },
                    },
                  },
                  type: { type: "literal", definition: "enum" },
                  definition: { type: "array", definition: { type: "simpleType", definition: "string" } },
                },
              },
              jzodEnumTypesSchema: { type: "enum", definition: ["any", "boolean", "number", "string", "uuid"] },
              jzodFunctionSchema: {
                type: "object",
                definition: {
                  type: { type: "literal", definition: "function" },
                  args: { type: "array", definition: { type: "schemaReference", relativePath: "jzodAttributeSchema" } },
                  returns: { type: "schemaReference", relativePath: "jzodAttributeSchema", optional: true },
                },
              },
              jzodLazySchema: {
                type: "object",
                definition: {
                  type: { type: "literal", definition: "lazy" },
                  definition: { type: "schemaReference", relativePath: "jzodFunctionSchema" },
                },
              },
              jzodLiteralSchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: {
                    optional: true,
                    type: "object",
                    definition: {
                      id: { type: "simpleType", definition: "number" },
                      defaultLabel: { type: "simpleType", definition: "string" },
                      editable: { type: "simpleType", definition: "boolean" },
                    },
                  },
                  type: { type: "literal", definition: "literal" },
                  definition: { type: "simpleType", definition: "string" },
                },
              },
              jzodObjectSchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: {
                    optional: true,
                    type: "object",
                    definition: {
                      id: { type: "simpleType", definition: "number" },
                      defaultLabel: { type: "simpleType", definition: "string" },
                      editable: { type: "simpleType", definition: "boolean" },
                    },
                  },
                  type: { type: "literal", definition: "object" },
                  definition: {
                    type: "record",
                    definition: { type: "schemaReference", relativePath: "jzodElementSchema" },
                  },
                },
              },
              jzodRecordSchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: {
                    optional: true,
                    type: "object",
                    definition: {
                      id: { type: "simpleType", definition: "number" },
                      defaultLabel: { type: "simpleType", definition: "string" },
                      editable: { type: "simpleType", definition: "boolean" },
                    },
                  },
                  type: { type: "literal", definition: "record" },
                  definition: { type: "schemaReference", relativePath: "jzodElementSchema" },
                },
              },
              jzodReferenceSchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: {
                    optional: true,
                    type: "object",
                    definition: {
                      id: { type: "simpleType", definition: "number" },
                      defaultLabel: { type: "simpleType", definition: "string" },
                      editable: { type: "simpleType", definition: "boolean" },
                    },
                  },
                  type: { type: "literal", definition: "schemaReference" },
                  definition: { type: "simpleType", definition: "string", optional: true },
                  relativePath: { type: "simpleType", definition: "string", optional: true },
                  absolutePath: { type: "simpleType", definition: "string", optional: true },
                },
              },
              jzodUnionSchema: {
                type: "object",
                definition: {
                  optional: { type: "simpleType", definition: "boolean", optional: true },
                  extra: {
                    optional: true,
                    type: "object",
                    definition: {
                      id: { type: "simpleType", definition: "number" },
                      defaultLabel: { type: "simpleType", definition: "string" },
                      editable: { type: "simpleType", definition: "boolean" },
                    },
                  },
                  type: { type: "literal", definition: "union" },
                  definition: {
                    type: "array",
                    definition: { type: "schemaReference", relativePath: "jzodElementSchema" },
                  },
                },
              },
            },
          },
        },
      },
      "7990c0c9-86c3-40a1-a121-036c91b55ed7": {
        "360fcf1f-f0d4-4f8a-9262-07886e70fa15": {
          uuid: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          parentName: "Configuration",
          parentUuid: "7990c0c9-86c3-40a1-a121-036c91b55ed7",
          name: "Reference",
          defaultLabel: "The reference configuration for the database.",
          definition: { currentModelVersion: "695826c2-aefa-4f5f-a131-dee46fe21c13" },
        },
      },
      "8bec933d-6287-4de7-8a88-5c24216de9f4": {
        "17adb534-1dcb-4874-a4ef-6c1e03b31c4e": {
          uuid: "17adb534-1dcb-4874-a4ef-6c1e03b31c4e",
          parentName: "ApplicationVersionCrossEntityDefinition",
          parentUuid: "8bec933d-6287-4de7-8a88-5c24216de9f4",
          applicationVersion: "695826c2-aefa-4f5f-a131-dee46fe21c13",
          entityDefinition: "381ab1be-337f-4198-b1d3-f686867fc1dd",
        },
        "48644159-66d4-426d-b38d-d083fd455e7b": {
          uuid: "48644159-66d4-426d-b38d-d083fd455e7b",
          parentName: "ApplicationVersionCrossEntityDefinition",
          parentUuid: "8bec933d-6287-4de7-8a88-5c24216de9f4",
          applicationVersion: "695826c2-aefa-4f5f-a131-dee46fe21c13",
          entityDefinition: "bdd7ad43-f0fc-4716-90c1-87454c40dd95",
        },
        "4aaba993-f0a1-4a26-b1ea-13b0ad532685": {
          uuid: "4aaba993-f0a1-4a26-b1ea-13b0ad532685",
          parentName: "ApplicationVersionCrossEntityDefinition",
          parentUuid: "8bec933d-6287-4de7-8a88-5c24216de9f4",
          applicationVersion: "695826c2-aefa-4f5f-a131-dee46fe21c13",
          entityDefinition: "69bf7c03-a1df-4d1c-88c1-44363feeea87",
        },
        "9086f49a-0e81-4902-81f3-560186dee334": {
          uuid: "9086f49a-0e81-4902-81f3-560186dee334",
          parentName: "ApplicationVersionCrossEntityDefinition",
          parentUuid: "8bec933d-6287-4de7-8a88-5c24216de9f4",
          applicationVersion: "695826c2-aefa-4f5f-a131-dee46fe21c13",
          entityDefinition: "27046fce-742f-4cc4-bb95-76b271f490a5",
        },
        "ba38669e-ac6f-40ea-af14-bb200db251d8": {
          uuid: "ba38669e-ac6f-40ea-af14-bb200db251d8",
          parentName: "ApplicationVersionCrossEntityDefinition",
          parentUuid: "8bec933d-6287-4de7-8a88-5c24216de9f4",
          applicationVersion: "695826c2-aefa-4f5f-a131-dee46fe21c13",
          entityDefinition: "f93af951-ea13-4815-a2e3-ec0cab1fadd2",
        },
        "dc47438c-166a-4d19-aeba-ad70281afdf4": {
          uuid: "dc47438c-166a-4d19-aeba-ad70281afdf4",
          parentName: "ApplicationVersionCrossEntityDefinition",
          parentUuid: "8bec933d-6287-4de7-8a88-5c24216de9f4",
          applicationVersion: "695826c2-aefa-4f5f-a131-dee46fe21c13",
          entityDefinition: "9460420b-f176-4918-bd45-894ab195ffe9",
        },
        "ede7e794-5ae7-48a8-81c9-d1f82df11829": {
          uuid: "ede7e794-5ae7-48a8-81c9-d1f82df11829",
          parentName: "ApplicationVersionCrossEntityDefinition",
          parentUuid: "8bec933d-6287-4de7-8a88-5c24216de9f4",
          applicationVersion: "695826c2-aefa-4f5f-a131-dee46fe21c13",
          entityDefinition: "952d2c65-4da2-45c2-9394-a0920ceedfb6",
        },
      },
      "a659d350-dd97-4da9-91de-524fa01745dc": {
        "360fcf1f-f0d4-4f8a-9262-07886e70fa15": {
          uuid: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          parentName: "Application",
          parentUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
          name: "Miroir",
          defaultLabel: "The Miroir application.",
          description:
            "This application contaies the Miroir meta-model, and the elements needed to perform the most fundamental application-editing tasks.",
        },
      },
      "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24": {
        "695826c2-aefa-4f5f-a131-dee46fe21c13": {
          uuid: "695826c2-aefa-4f5f-a131-dee46fe21c13",
          parentName: "ApplicationVersion",
          parentUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
          name: "Initial",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          branch: "ad1ddc4e-556e-4598-9cff-706a2bde0be7",
          description: "Initial datastore Miroir application version",
          previousVersion: "",
          modelStructureMigration: [],
          modelCUDMigration: [],
        },
      },
      "cdb0aec6-b848-43ac-a058-fe2dbe5811f1": {
        "ad1ddc4e-556e-4598-9cff-706a2bde0be7": {
          uuid: "ad1ddc4e-556e-4598-9cff-706a2bde0be7",
          parentName: "ApplicationModelBranch",
          parentUuid: "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
          name: "master",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          headVersion: "695826c2-aefa-4f5f-a131-dee46fe21c13",
          description: "The master Branch of the Miroir Application",
        },
      },
    },
  },
  "f714bb2f-a12d-4e71-a03b-74dcedea6eb4": {
    model: {
      "a659d350-dd97-4da9-91de-524fa01745dc": {
        "5af03c98-fe5e-490b-b08f-e1230971c57f": {
          uuid: "5af03c98-fe5e-490b-b08f-e1230971c57f",
          parentName: "Application",
          parentUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
          name: "Library",
          defaultLabel: "The Library application.",
          description: "The model and data of the Library application.",
        },
      },
      "35c5608a-7678-4f07-a4ec-76fc5bc35424": {},
      "cdb0aec6-b848-43ac-a058-fe2dbe5811f1": {
        "9034141b-0d0d-4beb-82af-dfc02be15c2d": {
          uuid: "9034141b-0d0d-4beb-82af-dfc02be15c2d",
          parentName: "ApplicationModelBranch",
          parentUuid: "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
          application: "5af03c98-fe5e-490b-b08f-e1230971c57f",
          headVersion: "419773b4-a73c-46ca-8913-0ee27fb2ce0a",
          name: "master",
          description: "The master Branch of the Library Application",
        },
      },
      "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24": {
        "419773b4-a73c-46ca-8913-0ee27fb2ce0a": {
          uuid: "419773b4-a73c-46ca-8913-0ee27fb2ce0a",
          parentName: "ApplicationVersion",
          parentUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
          name: "Initial",
          application: "5af03c98-fe5e-490b-b08f-e1230971c57f",
          branch: "9034141b-0d0d-4beb-82af-dfc02be15c2d",
          description: "Initial Library application version",
          previousVersion: "",
          modelStructureMigration: [],
          modelCUDMigration: [],
        },
      },
      "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad": {
        "a027c379-8468-43a5-ba4d-bf618be25cab": {
          uuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          name: "Publisher",
          conceptLevel: "Model",
          description: "The publisher of a book.",
        },
        "d7a144ff-d1b9-4135-800c-a7cfc1f38733": {
          uuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          name: "Author",
          conceptLevel: "Model",
          description: "The Author of a book.",
        },
        "e8ba151b-d68e-4cc3-9a83-3459d309ccf5": {
          uuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          name: "Book",
          conceptLevel: "Model",
          description: "A book.",
        },
      },
      "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd": {
        "797dd185-0155-43fd-b23f-f6d0af8cae06": {
          uuid: "797dd185-0155-43fd-b23f-f6d0af8cae06",
          parentName: "EntityDefinition",
          parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
          entityUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          conceptLevel: "Model",
          name: "Book",
          icon: "Book",
          jzodSchema: {
            type: "object",
            definition: {
              uuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: { id: 1, defaultLabel: "Uuid", editable: false },
              },
              parentName: {
                type: "simpleType",
                definition: "string",
                optional: true,
                extra: { id: 2, defaultLabel: "Entity Name", editable: false },
              },
              parentUuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: { id: 3, defaultLabel: "Entity Uuid", editable: false },
              },
              name: {
                type: "simpleType",
                definition: "string",
                extra: { id: 4, defaultLabel: "Name", editable: true },
              },
              author: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                optional: true,
                extra: {
                  id: 5,
                  defaultLabel: "Author",
                  targetEntity: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
                  editable: true,
                },
              },
              publisher: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                optional: true,
                extra: {
                  id: 5,
                  defaultLabel: "Publisher",
                  targetEntity: "a027c379-8468-43a5-ba4d-bf618be25cab",
                  editable: true,
                },
              },
            },
          },
        },
        "7a939fe8-d119-4e7f-ab94-95b2aae30db9": {
          uuid: "7a939fe8-d119-4e7f-ab94-95b2aae30db9",
          parentName: "EntityDefinition",
          parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
          entityUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
          conceptLevel: "Model",
          name: "Publisher",
          description: "Publisher",
          icon: "building",
          jzodSchema: {
            type: "object",
            definition: {
              uuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: { id: 1, defaultLabel: "Uuid", editable: false },
              },
              parentName: {
                type: "simpleType",
                definition: "string",
                optional: true,
                extra: { id: 2, defaultLabel: "Entity Name", editable: false },
              },
              parentUuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: { id: 3, defaultLabel: "Entity Uuid", editable: false },
              },
              name: {
                type: "simpleType",
                definition: "string",
                extra: { id: 4, defaultLabel: "Name", editable: true },
              },
              icon: {
                id: 5,
                type: "simpleType",
                definition: "string",
                extra: { defaultLabel: "Icon", editable: true },
              },
            },
          },
        },
        "b30b7180-f7dc-4cca-b4e8-e476b77fe61d": {
          uuid: "b30b7180-f7dc-4cca-b4e8-e476b77fe61d",
          parentName: "EntityDefinition",
          parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
          entityUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
          conceptLevel: "Model",
          name: "Author",
          description: "author",
          icon: "Person",
          jzodSchema: {
            type: "object",
            definition: {
              uuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: { id: 1, defaultLabel: "Uuid", editable: false },
              },
              parentName: {
                type: "simpleType",
                definition: "string",
                optional: true,
                extra: { id: 2, defaultLabel: "Entity Name", editable: false },
              },
              parentUuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                extra: { id: 3, defaultLabel: "Entity Uuid", editable: false },
              },
              name: {
                type: "simpleType",
                definition: "string",
                extra: { id: 4, defaultLabel: "Name", editable: true },
              },
              icon: {
                id: 5,
                type: "simpleType",
                definition: "string",
                extra: { defaultLabel: "Gender (narrow-minded)", editable: true },
              },
            },
          },
        },
      },
      "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916": {
        "66a09068-52c3-48bc-b8dd-76575bbc8e72": {
          uuid: "66a09068-52c3-48bc-b8dd-76575bbc8e72",
          parentName: "Report",
          parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
          conceptLevel: "Model",
          name: "AuthorList",
          defaultLabel: "List of Authors",
          type: "list",
          definition: [
            {
              type: "objectList",
              definition: { parentName: "Author", parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733" },
            },
          ],
        },
        "74b010b6-afee-44e7-8590-5f0849e4a5c9": {
          uuid: "74b010b6-afee-44e7-8590-5f0849e4a5c9",
          parentName: "Report",
          parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
          conceptLevel: "Model",
          name: "BookList",
          defaultLabel: "List of Books",
          type: "list",
          definition: [
            {
              type: "objectList",
              definition: { parentName: "Book", parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5" },
            },
          ],
        },
        "a77aa662-006d-46cd-9176-01f02a1a12dc": {
          uuid: "a77aa662-006d-46cd-9176-01f02a1a12dc",
          parentName: "Report",
          parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
          conceptLevel: "Model",
          name: "PubliserList",
          defaultLabel: "List of Publishers",
          type: "list",
          definition: [
            {
              type: "objectList",
              definition: { parentName: "Book", parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab" },
            },
          ],
        },
      },
      "7990c0c9-86c3-40a1-a121-036c91b55ed7": {
        "2e5b7948-ff33-4917-acac-6ae6e1ef364f": {
          uuid: "2e5b7948-ff33-4917-acac-6ae6e1ef364f",
          parentName: "Configuration",
          parentUuid: "7990c0c9-86c3-40a1-a121-036c91b55ed7",
          name: "Reference",
          defaultLabel: "The reference configuration for the Library application database schemas.",
          definition: { currentModelVersion: "TBD" },
        },
      },
    },
    data: {
      "a027c379-8468-43a5-ba4d-bf618be25cab": {
        "1f550a2a-33f5-4a56-83ee-302701039494": {
          uuid: "1f550a2a-33f5-4a56-83ee-302701039494",
          parentName: "Publisher",
          parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
          name: "Penguin",
          icon: "",
        },
        "516a7366-39e7-4998-82cb-80199a7fa667": {
          uuid: "516a7366-39e7-4998-82cb-80199a7fa667",
          parentName: "Publisher",
          parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
          name: "Folio",
        },
        "c1c97d54-aba8-4599-883a-7fe8f3874095": {
          uuid: "c1c97d54-aba8-4599-883a-7fe8f3874095",
          parentName: "Publisher",
          parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
          name: "Springer",
        },
      },
      "d7a144ff-d1b9-4135-800c-a7cfc1f38733": {
        "4441169e-0c22-4fbc-81b2-28c87cf48ab2": {
          uuid: "4441169e-0c22-4fbc-81b2-28c87cf48ab2",
          parentName: "Author",
          parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
          name: "Don Norman",
        },
        "ce7b601d-be5f-4bc6-a5af-14091594046a": {
          uuid: "ce7b601d-be5f-4bc6-a5af-14091594046a",
          parentName: "Author",
          parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
          name: "Paul Veyne",
        },
        "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17": {
          uuid: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17",
          parentName: "Author",
          parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
          conceptLevel: "Data",
          name: "Cornell Woolrich",
        },
        "e4376314-d197-457c-aa5e-d2da5f8d5977": {
          uuid: "e4376314-d197-457c-aa5e-d2da5f8d5977",
          parentName: "Author",
          parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
          conceptLevel: "Data",
          name: "Catherine Guérard",
        },
      },
      "e8ba151b-d68e-4cc3-9a83-3459d309ccf5": {
        "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7": {
          uuid: "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          name: "Renata n'importe quoi",
          author: "e4376314-d197-457c-aa5e-d2da5f8d5977",
          conceptLevel: "",
          publisher: "516a7366-39e7-4998-82cb-80199a7fa667",
        },
        "6fefa647-7ecf-4f83-b617-69d7d5094c37": {
          uuid: "6fefa647-7ecf-4f83-b617-69d7d5094c37",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          name: "The Bride Wore Black",
          author: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17",
          conceptLevel: "",
          publisher: "c1c97d54-aba8-4599-883a-7fe8f3874095",
        },
        "c97be567-bd70-449f-843e-cd1d64ac1ddd": {
          uuid: "c97be567-bd70-449f-843e-cd1d64ac1ddd",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          name: "Rear Window",
          author: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17",
          conceptLevel: "",
          publisher: "1f550a2a-33f5-4a56-83ee-302701039494",
        },
        "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": {
          uuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          conceptLevel: "Data",
          name: "Et dans l'éternité je ne m'ennuierai pas",
          author: "ce7b601d-be5f-4bc6-a5af-14091594046a",
          publisher: "516a7366-39e7-4998-82cb-80199a7fa667",
        },
        "e20e276b-619d-4e16-8816-b7ec37b53439": {
          uuid: "e20e276b-619d-4e16-8816-b7ec37b53439",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          name: "The Design of Everyday Things",
          author: "4441169e-0c22-4fbc-81b2-28c87cf48ab2",
          conceptLevel: "",
          publisher: "c1c97d54-aba8-4599-883a-7fe8f3874095",
        },
      },
    },
  },
};

describe(
  'LocalCacheSlice',
  () => {
    it(
      "getLocalCacheIndexEntityUuid",
      () => {
        expect(getLocalCacheIndexEntityUuid("10ff36f2-50a3-48d8-b80f-e48e5d13af8e_model_16dbfe28-e1d7-4f20-9ba4-c1a9873202ad")).toEqual("16dbfe28-e1d7-4f20-9ba4-c1a9873202ad");
      }
    )
    it(
      "getLocalCacheIndexDeploymentUuid",
      () => {
        expect(getLocalCacheIndexDeploymentUuid("10ff36f2-50a3-48d8-b80f-e48e5d13af8e_model_16dbfe28-e1d7-4f20-9ba4-c1a9873202ad")).toEqual("10ff36f2-50a3-48d8-b80f-e48e5d13af8e");
      }
    )
    it(
      "getLocalCacheIndexDeploymentSection",
      () => {
        expect(getLocalCacheIndexDeploymentSection("10ff36f2-50a3-48d8-b80f-e48e5d13af8e_model_16dbfe28-e1d7-4f20-9ba4-c1a9873202ad")).toEqual("model");
      }
    )
    it(
      "getLocalCacheKeysForDeploymentUuid",
      () => {
        const result = getLocalCacheKeysForDeploymentUuid(Object.keys(exampleSliceState),"10ff36f2-50a3-48d8-b80f-e48e5d13af8e");
        // console.log("keys",Object.keys(exampleSliceState));
        // console.log("result",result);
        
        expect(result).toEqual([
          '10ff36f2-50a3-48d8-b80f-e48e5d13af8e_model_16dbfe28-e1d7-4f20-9ba4-c1a9873202ad',
          '10ff36f2-50a3-48d8-b80f-e48e5d13af8e_model_54b9c72f-d4f3-4db9-9e0e-0dc840b530bd',
          '10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_35c5608a-7678-4f07-a4ec-76fc5bc35424',
          '10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_3f2baa83-3ef7-45ce-82ea-6a43f7a8c916',
          '10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_5e81e1b9-38be-487c-b3e5-53796c57fccf',
          '10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_7990c0c9-86c3-40a1-a121-036c91b55ed7',
          '10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_8bec933d-6287-4de7-8a88-5c24216de9f4',
          '10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_a659d350-dd97-4da9-91de-524fa01745dc',
          '10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24',
          '10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_cdb0aec6-b848-43ac-a058-fe2dbe5811f1'
        ]);
      }
    )
    it(
      "getLocalCacheKeysForDeploymentSection",
      () => {
        const result = getLocalCacheKeysForDeploymentSection(Object.keys(exampleSliceState),"model");
        // console.log("keys",Object.keys(exampleSliceState));
        // console.log("result",result);
        
        expect(result).toEqual([
          '10ff36f2-50a3-48d8-b80f-e48e5d13af8e_model_16dbfe28-e1d7-4f20-9ba4-c1a9873202ad',
          '10ff36f2-50a3-48d8-b80f-e48e5d13af8e_model_54b9c72f-d4f3-4db9-9e0e-0dc840b530bd',
          'f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_a659d350-dd97-4da9-91de-524fa01745dc',
          'f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_35c5608a-7678-4f07-a4ec-76fc5bc35424',
          'f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_cdb0aec6-b848-43ac-a058-fe2dbe5811f1',
          'f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24',
          'f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_16dbfe28-e1d7-4f20-9ba4-c1a9873202ad',
          'f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_54b9c72f-d4f3-4db9-9e0e-0dc840b530bd',
          'f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_3f2baa83-3ef7-45ce-82ea-6a43f7a8c916',
          'f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_7990c0c9-86c3-40a1-a121-036c91b55ed7'
        ]);
      }
    )
    it(
      "getLocalCacheKeysDeploymentUuidList",
      () => {
        const result = getLocalCacheKeysDeploymentUuidList(Object.keys(exampleSliceState));
        // console.log("keys",Object.keys(exampleSliceState));
        // console.log("result",result);
        
        expect(result).toEqual([
          '10ff36f2-50a3-48d8-b80f-e48e5d13af8e',
          'f714bb2f-a12d-4e71-a03b-74dcedea6eb4',
        ]);
      }
    )
    it(
      "getLocalCacheKeysDeploymentSectionList",
      () => {
        const result = getLocalCacheKeysDeploymentSectionList(Object.keys(exampleSliceState),"f714bb2f-a12d-4e71-a03b-74dcedea6eb4");
        // console.log("keys",Object.keys(exampleSliceState));
        // console.log("result",result);
        
        expect(result).toEqual([
          'model',
          'data',
        ]);
      }
    )
    it(
      "getLocalCacheKeysDeploymentSectionEntitiesList",
      () => {
        const result = getLocalCacheKeysDeploymentSectionEntitiesList(Object.keys(exampleSliceState),"f714bb2f-a12d-4e71-a03b-74dcedea6eb4","model");
        // console.log("keys",Object.keys(exampleSliceState));
        console.log("result",result);
        
        expect(result).toEqual([
          'a659d350-dd97-4da9-91de-524fa01745dc',
          '35c5608a-7678-4f07-a4ec-76fc5bc35424',
          'cdb0aec6-b848-43ac-a058-fe2dbe5811f1',
          'c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24',
          '16dbfe28-e1d7-4f20-9ba4-c1a9873202ad',
          '54b9c72f-d4f3-4db9-9e0e-0dc840b530bd',
          '3f2baa83-3ef7-45ce-82ea-6a43f7a8c916',
          '7990c0c9-86c3-40a1-a121-036c91b55ed7'
        ]);
      }
    )
    it(
      "localCacheStateToDomainState",
      () => {
        const result = localCacheStateToDomainState(exampleSliceState);
        // console.log("keys",Object.keys(exampleSliceState));
        // console.log("result",JSON.stringify(result));
        
        expect(result).toEqual(domainStateForSliceState);
      }
    )
  }
)