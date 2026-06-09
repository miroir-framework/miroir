import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MODULE = "miroir-core/1_core/model/ModelUpdate";
const LIBRARY_APPLICATION_UUID = "5af03c98-fe5e-490b-b08f-e1230971c57f";

const entityDefinitionBook = {
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
            display: { editable: false },
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
            display: { editable: false },
          },
        },
      },
      parentUuid: {
        type: "uuid",
        tag: {
          value: {
            id: 3,
            defaultLabel: "Entity Uuid",
            display: { editable: false },
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
            display: { editable: false },
          },
        },
      },
      name: {
        type: "string",
        tag: {
          value: {
            id: 4,
            defaultLabel: "Name",
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
          },
        },
      },
      author: {
        type: "uuid",
        optional: true,
        tag: {
          value: {
            id: 6,
            defaultLabel: "Author",
            foreignKeyParams: {
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
            defaultLabel: "Publisher",
            foreignKeyParams: {
              targetEntity: "a027c379-8468-43a5-ba4d-bf618be25cab",
              targetEntityOrderInstancesBy: "name",
            },
          },
        },
      },
    },
  },
};

const { publisher, ...bookMlSchemaWithoutPublisher } = entityDefinitionBook.mlSchema.definition;

function fn(unitTestLabel, before, after, expectedValue, extra = {}) {
  return {
    unitTestType: "functionCallTest",
    unitTestLabel,
    functionRef: { module: MODULE, export: "getModelUpdate" },
    arguments: [LIBRARY_APPLICATION_UUID, before, after],
    ...(expectedValue !== undefined ? { expectedValue } : {}),
    ...extra,
  };
}

const unitTests = [
  fn(
    "should return null when entityDefinitionBefore equals entityDefinitionAfter",
    entityDefinitionBook,
    entityDefinitionBook,
    null,
  ),
  fn(
    "should throw error when entityDefinitionBefore and entityDefinitionAfter have different UUIDs",
    entityDefinitionBook,
    { ...entityDefinitionBook, uuid: "different-uuid-1234" },
    undefined,
    {
      expectedError: "EntityDefinitions must have the same UUID to compute a ModelUpdate.",
    },
  ),
  fn(
    "should return ModelAction for adding a single string attribute to mlSchema",
    entityDefinitionBook,
    {
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
              },
            },
          },
        },
      },
    },
    {
      actionType: "alterEntityAttribute",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: LIBRARY_APPLICATION_UUID,
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
                },
              },
            },
          },
        ],
      },
    },
  ),
  fn(
    "should return null when only the tag of an attribute is changed",
    entityDefinitionBook,
    {
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
                defaultLabel: "Book Title",
              },
            },
          },
        },
      },
    },
    null,
  ),
  fn(
    "should return ModelAction for removing a single attribute from mlSchema",
    entityDefinitionBook,
    {
      ...entityDefinitionBook,
      mlSchema: {
        ...entityDefinitionBook.mlSchema,
        definition: bookMlSchemaWithoutPublisher,
      },
    },
    {
      actionType: "alterEntityAttribute",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: LIBRARY_APPLICATION_UUID,
        entityName: entityDefinitionBook.name,
        entityUuid: entityDefinitionBook.entityUuid,
        entityDefinitionUuid: entityDefinitionBook.uuid,
        removeColumns: ["publisher"],
      },
    },
  ),
  fn(
    "should return ModelAction for adding and removing attributes in the same change",
    entityDefinitionBook,
    {
      ...entityDefinitionBook,
      mlSchema: {
        ...entityDefinitionBook.mlSchema,
        definition: {
          ...bookMlSchemaWithoutPublisher,
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
    {
      actionType: "alterEntityAttribute",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: LIBRARY_APPLICATION_UUID,
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
    },
  ),
];

const entity = {
  uuid: "f74cd323-fe3f-426f-913a-6ca9cb353c08",
  parentName: "UnitTest",
  parentUuid: "a1bc5288-c982-4ff3-8316-4a2400fe9323",
  selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  branch: "ad1ddc4e-556e-4598-9cff-706a2bde0be7",
  name: "modelUpdates",
  description: "Phase 5c — getModelUpdate from modelUpdates.unit.test.ts",
  definition: {
    unitTestType: "unitTestSuite",
    unitTestLabel: "modelUpdates.getModelUpdate",
    unitTests,
  },
};

const outPath = path.resolve(
  __dirname,
  "../../../miroir-test-app_deployment-miroir/assets/miroir_data/a1bc5288-c982-4ff3-8316-4a2400fe9323/f74cd323-fe3f-426f-913a-6ca9cb353c08.json",
);
fs.writeFileSync(outPath, JSON.stringify(entity, null, 2));
console.log(`Wrote ${unitTests.length} cases to ${outPath}`);
