// import { describe, it, expect } from 'vitest';

import type { EntityDefinition } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { getModelUpdate } from "../../src/1_core/ModelUpdate.js";

const entityDefinitionBook: EntityDefinition = {
  uuid: "797dd185-0155-43fd-b23f-f6d0af8cae06",
  parentName: "EntityDefinition",
  parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
  parentDefinitionVersionUuid: "bdd7ad43-f0fc-4716-90c1-87454c40dd95",
  entityUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  conceptLevel: "Model",
  name: "Book",
  icon: "Book",
  defaultInstanceDetailsReportUuid: "c3503412-3d8a-43ef-a168-aa36e975e606",
  cache: {
    cacheAllInstancesOnRefresh: true,
  },
  viewAttributes: ["name", "author", "year", "publisher", "uuid"],
  mlSchema: {
    type: "object",
    definition: {
      uuid: {
        type: "uuid",
        tag: {
          value: {
            id: 1,
            defaultLabel: "Uuid",
            editable: false,
          },
        },
      },
      parentName: {
        type: "string",
        optional: true,
        tag: {
          value: {
            id: 2,
            defaultLabel: "Entity Name",
            editable: false,
          },
        },
      },
      parentUuid: {
        type: "uuid",
        tag: {
          value: {
            id: 3,
            defaultLabel: "Entity Uuid",
            editable: false,
          },
        },
      },
      conceptLevel: {
        type: "enum",
        definition: ["MetaModel", "Model", "Data"],
        optional: true,
        tag: {
          value: {
            id: 5,
            defaultLabel: "Concept Level",
            editable: false,
          },
        },
      },
      name: {
        type: "string",
        tag: {
          value: {
            id: 4,
            defaultLabel: "Name",
            editable: true,
          },
        },
      },
      year: {
        type: "number",
        optional: true,
        tag: {
          value: {
            id: 5,
            defaultLabel: "Year of Publication",
            editable: true,
          },
        },
      },
      author: {
        type: "uuid",
        optional: true,
        tag: {
          value: {
            id: 6,
            editable: true,
            defaultLabel: "Author",
            targetEntity: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
            selectorParams: {
              targetEntity: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
              targetEntityOrderInstancesBy: "name",
            },
          },
        },
      },
      publisher: {
        type: "uuid",
        optional: true,
        tag: {
          value: {
            id: 7,
            editable: true,
            defaultLabel: "Publisher",
            targetEntity: "a027c379-8468-43a5-ba4d-bf618be25cab",
            selectorParams: {
              targetEntity: "a027c379-8468-43a5-ba4d-bf618be25cab",
              targetEntityOrderInstancesBy: "name",
            },
          },
        },
      },
    },
  },
};

export type getModelUpdateTest = {
  testLabel?: string;
  entityDefinitionBefore: EntityDefinition,
  entityDefinitionAfter: EntityDefinition,
  expectedModelUpdate: null | any
};

const tests: getModelUpdateTest[] = [
  // "should return null when entityDefinitionBefore equals entityDefinitionAfter"
  {
    testLabel: "should return null when entityDefinitionBefore equals entityDefinitionAfter",
    entityDefinitionBefore: entityDefinitionBook,
    entityDefinitionAfter: entityDefinitionBook,
    expectedModelUpdate: null
  },
  // "should throw error when entityDefinitionBefore and entityDefinitionAfter have different UUIDs"
  {
    testLabel: "should throw error when entityDefinitionBefore and entityDefinitionAfter have different UUIDs",
    entityDefinitionBefore: entityDefinitionBook,
    entityDefinitionAfter: {
      ...entityDefinitionBook,
      uuid: "different-uuid-1234"
    },
    expectedModelUpdate: new Error("EntityDefinitions must have the same UUID to compute a ModelUpdate.")
  },
  // "should return ModelAction for adding a single string attribute to mlSchema"
  {
    testLabel: "should return ModelAction for adding a single string attribute to mlSchema",
    entityDefinitionBefore: entityDefinitionBook,
    entityDefinitionAfter: {
      ...entityDefinitionBook,
      mlSchema: {
        ...entityDefinitionBook.mlSchema,
        definition: {
          ...entityDefinitionBook.mlSchema.definition,
          isbn: {
            type: "string",
            optional: true,
            tag: {
              value: {
                id: 8,
                defaultLabel: "ISBN",
                editable: true,
              },
            },
          },
        },
      },
    },
    expectedModelUpdate: {
      actionType: "alterEntityAttribute",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: entityDefinitionBook.parentUuid,
      payload: {
        entityName: entityDefinitionBook.name,
        entityUuid: entityDefinitionBook.entityUuid,
        entityDefinitionUuid: entityDefinitionBook.uuid,
        addColumns: [
          {
            name: "isbn",
            definition: {
              type: "string",
              optional: true,
              tag: {
                value: {
                  id: 8,
                  defaultLabel: "ISBN",
                  editable: true,
                },
              },
            },
          },
        ],
      },
    }
  },
  // "should return null when only the tag of an attribute is changed"
  {
    testLabel: "should return null when only the tag of an attribute is changed",
    entityDefinitionBefore: entityDefinitionBook,
    entityDefinitionAfter: {
      ...entityDefinitionBook,
      mlSchema: {
        ...entityDefinitionBook.mlSchema,
        definition: {
          ...entityDefinitionBook.mlSchema.definition,
          name: {
            type: "string",
            tag: {
              value: {
                id: 4,
                defaultLabel: "Book Title", // Changed from "Name"
                editable: true,
              },
            },
          },
        },
      },
    },
    expectedModelUpdate: null
  },
  // "should return ModelAction for removing a single attribute from mlSchema"
  {
    testLabel: "should return ModelAction for removing a single attribute from mlSchema",
    entityDefinitionBefore: entityDefinitionBook,
    entityDefinitionAfter: {
      ...entityDefinitionBook,
      mlSchema: {
        ...entityDefinitionBook.mlSchema,
        definition: (() => {
          const { publisher, ...rest } = entityDefinitionBook.mlSchema.definition;
          return rest;
        })(),
      },
    },
    expectedModelUpdate: {
      actionType: "alterEntityAttribute",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: entityDefinitionBook.parentUuid,
      payload: {
        entityName: entityDefinitionBook.name,
        entityUuid: entityDefinitionBook.entityUuid,
        entityDefinitionUuid: entityDefinitionBook.uuid,
        removeColumns: ["publisher"],
      },
    }
  },
  // "should return ModelAction for adding and removing attributes in the same change"
  {
    testLabel: "should return ModelAction for adding and removing attributes in the same change",
    entityDefinitionBefore: entityDefinitionBook,
    entityDefinitionAfter: {
      ...entityDefinitionBook,
      mlSchema: {
        ...entityDefinitionBook.mlSchema,
        definition: (() => {
          const { publisher, ...rest } = entityDefinitionBook.mlSchema.definition;
          return {
            ...rest,
            isbn: {
              type: "string",
              optional: true,
              tag: {
                value: {
                  id: 8,
                  defaultLabel: "ISBN",
                  editable: true,
                },
              },
            },
          };
        })(),
      },
    },
    expectedModelUpdate: {
      actionType: "alterEntityAttribute",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: entityDefinitionBook.parentUuid,
      payload: {
        entityName: entityDefinitionBook.name,
        entityUuid: entityDefinitionBook.entityUuid,
        entityDefinitionUuid: entityDefinitionBook.uuid,
        addColumns: [
          {
            name: "isbn",
            definition: {
              type: "string",
              optional: true,
              tag: {
                value: {
                  id: 8,
                  defaultLabel: "ISBN",
                  editable: true,
                },
              },
            },
          },
        ],
        removeColumns: ["publisher"],
      },
    }
  }
];
describe('modelUpdates.unit', () => {
  it.each(tests)('$testLabel', ({ entityDefinitionBefore, entityDefinitionAfter, expectedModelUpdate }) => {
    if (expectedModelUpdate instanceof Error) {
      expect(() => getModelUpdate(entityDefinitionBefore, entityDefinitionAfter)).toThrow(expectedModelUpdate.message);
    } else {
      const result = getModelUpdate(entityDefinitionBefore, entityDefinitionAfter);
      expect(result).toEqual(expectedModelUpdate);
    }
  });
  // it('should return null when entityDefinitionBefore equals entityDefinitionAfter', () => {
  //   const entityDefinitionBefore = entityDefinitionBook;
  //   const entityDefinitionAfter = entityDefinitionBook;
  //   const result = getModelUpdate(entityDefinitionBefore, entityDefinitionAfter);
  //   expect(result).toEqual(null);
  // });
});