import type {
  ApplicationEntitiesAndInstances,
  Entity,
  EntityInstance,
  EntityVersion,
  MiroirTestDefinition,
  Uuid,
} from "miroir-core";

import {
  author1,
  author2,
  author3,
  book1,
  book2,
  book3,
  book4,
  book5,
  book6,
  defaultLibraryAppModel,
  entityAuthor,
  entityBook,
  entityCountry,
  entityPublisher,
  folio as publisher1,
  penguin as publisher2,
  springer as publisher3,
} from "miroir-test-app_deployment-library";

import {
  miroirTest_domain_controller_application_version_freeze,
  miroirTest_domain_controller_composite_pk_crud,
  miroirTest_domain_controller_data_crud,
  miroirTest_domain_controller_model_crud,
  miroirTest_domain_controller_model_undo_redo,
  miroirTest_domain_controller_no_parent_uuid_crud,
  miroirTest_domain_controller_non_uuid_pk_data_crud,
  miroirTest_domain_controller_non_uuid_pk_model_crud,
  miroirTest_evolutionTraceWP1,
} from "miroir-test-app_deployment-miroir";

export * from "../../src/miroir-fwk/4-tests/uiIntegrationPlayfieldSeeds.js";

import {
  compositeItem1,
  compositeItem2,
  compositeItem3,
  emptyLibraryPlayfieldMetaModel,
  entityCompositePK,
  libraryTestbedInitParams,
  type TestbedSetupParameters,
} from "../../src/miroir-fwk/4-tests/uiIntegrationPlayfieldSeeds.js";

export const ENTITY_COMPOSITE_PK_UUID = "44691d2c-d7c1-48e0-8363-71c51195e104";
export const ENTITY_DEFINITION_COMPOSITE_PK_UUID = "fbec9082-5cdf-4877-bd78-66a434a8eebf";

export const domainControllerIntegTests: MiroirTestDefinition[] = [
  miroirTest_domain_controller_data_crud,
  miroirTest_domain_controller_model_crud,
  miroirTest_domain_controller_composite_pk_crud,
  miroirTest_domain_controller_non_uuid_pk_model_crud,
  miroirTest_domain_controller_non_uuid_pk_data_crud,
  miroirTest_domain_controller_no_parent_uuid_crud,
  miroirTest_domain_controller_model_undo_redo,
  miroirTest_domain_controller_application_version_freeze,
  miroirTest_evolutionTraceWP1,
];

export const domainControllerIntegTestNames: string[] = domainControllerIntegTests.map((test) => {
  if (!test.name) throw new Error(`Test ${test.uuid} has no name`);
  return test.name;
});

export const entityDefinitionCompositePK: EntityVersion = {
  uuid: ENTITY_DEFINITION_COMPOSITE_PK_UUID,
  parentName: "EntityVersion",
  parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
  parentDefinitionVersionUuid: "bdd7ad43-f0fc-4716-90c1-87454c40dd95",
  entityUuid: ENTITY_COMPOSITE_PK_UUID,
  conceptLevel: "Model",
  name: "TestEntityCompositePK",
  idAttribute: ["region", "code"],
  mlSchema: entityCompositePK.mlSchema,
} as EntityVersion;

export const libraryEntitiesAndInstancesCompositePK: ApplicationEntitiesAndInstances = [
  {
    entity: entityCompositePK,
    instances: [compositeItem1, compositeItem2, compositeItem3],
  },
];

export const ENTITY_CODE_NUMBER_UUID = "4bbf4d19-7ac5-4fff-88ee-63ee49c7802f";
export const ENTITY_DEFINITION_CODE_NUMBER_UUID = "dceae8f8-c657-49df-9967-64ac3e52f5b4";

export const entityDefinitionCodeNumber: EntityVersion = {
  uuid: ENTITY_DEFINITION_CODE_NUMBER_UUID,
  parentName: "EntityVersion",
  parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
  parentDefinitionVersionUuid: "bdd7ad43-f0fc-4716-90c1-87454c40dd95",
  entityUuid: ENTITY_CODE_NUMBER_UUID,
  conceptLevel: "Model",
  name: "TestEntityCodeNumber",
  idAttribute: "code",
  mlSchema: {
    type: "object",
    definition: {
      code: {
        type: "number",
        tag: { value: { id: 1, defaultLabel: "Code" } },
      },
      parentName: {
        type: "string",
        optional: true,
        tag: { value: { id: 2, defaultLabel: "Entity Name" } },
      },
      parentUuid: {
        type: "uuid",
        tag: { value: { id: 3, defaultLabel: "Entity Uuid" } },
      },
      name: {
        type: "string",
        tag: { value: { id: 4, defaultLabel: "Name" } },
      },
    },
  },
} as EntityVersion;

export const ENTITY_NO_PARENT_UUID_UUID = "803b81ad-fda4-4206-8860-cc86f37c7a6e";
export const ENTITY_DEFINITION_NO_PARENT_UUID_UUID = "0057f84b-64d8-4395-8841-b264e3f9473a";

export const entityDefinitionNoParentUuid: EntityVersion = {
  uuid: ENTITY_DEFINITION_NO_PARENT_UUID_UUID,
  parentName: "EntityVersion",
  parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
  parentDefinitionVersionUuid: "bdd7ad43-f0fc-4716-90c1-87454c40dd95",
  entityUuid: ENTITY_NO_PARENT_UUID_UUID,
  conceptLevel: "Model",
  name: "TestEntityNoParentUuid",
  mlSchema: {
    type: "object",
    definition: {
      uuid: {
        type: "uuid",
        tag: { value: { id: 1, defaultLabel: "Uuid", editable: false } },
      },
      name: {
        type: "string",
        tag: { value: { id: 2, defaultLabel: "Name" } },
      },
      description: {
        type: "string",
        optional: true,
        tag: { value: { id: 3, defaultLabel: "Description" } },
      },
    },
  },
} as EntityVersion;

/** Library seed with all seeded books — used by ExtractorPersistenceStoreRunner integ. */
export const libraryEntitiesAndInstances: ApplicationEntitiesAndInstances = [
  {
    entity: entityAuthor as Entity,
    instances: [author1, author2, author3 as EntityInstance],
  },
  {
    entity: entityBook as Entity,
    instances: [
      book1 as EntityInstance,
      book2 as EntityInstance,
      book3 as EntityInstance,
      book4 as EntityInstance,
      book5 as EntityInstance,
      book6 as EntityInstance,
    ],
  },
  {
    entity: entityPublisher as Entity,
    instances: [
      publisher1 as EntityInstance,
      publisher2 as EntityInstance,
      publisher3 as EntityInstance,
    ],
  },
];

/** Library seed without `book3` — used by DomainController Data CRUD composite-action hooks. */
export const libraryEntitiesAndInstancesWithoutBook3: ApplicationEntitiesAndInstances = [
  {
    entity: entityAuthor as Entity,
    instances: [author1, author2, author3 as EntityInstance],
  },
  {
    entity: entityBook as Entity,
    instances: [
      book1 as EntityInstance,
      book2 as EntityInstance,
      book4 as EntityInstance,
      book5 as EntityInstance,
      book6 as EntityInstance,
    ],
  },
  {
    entity: entityPublisher as Entity,
    instances: [
      publisher1 as EntityInstance,
      publisher2 as EntityInstance,
      publisher3 as EntityInstance,
    ],
  },
];

/**
 * Entity filter used by imperative Data.CRUD `beforeEach`
 * (`resetAndinitializeDeploymentCompositeAction` 6th arg).
 */
export const domainControllerDataCrudFilterEntities: Uuid[] = [
  entityAuthor.uuid,
  entityBook.uuid,
  entityPublisher.uuid,
];

export const domainControllerModelCrudFilterEntities: Uuid[] = [
  entityPublisher.uuid,
  entityCountry.uuid,
];

export const domainControllerDataCrudLibraryPlayfieldSeed: TestbedSetupParameters = {
  testbedEntitiesAndInstances: libraryEntitiesAndInstancesWithoutBook3,
  testbedInitApplicationParameters: libraryTestbedInitParams,
  testbedModel: defaultLibraryAppModel,
};

export const domainControllerModelUndoRedoLibraryPlayfieldSeed: TestbedSetupParameters = {
  testbedEntitiesAndInstances: [],
  testbedInitApplicationParameters: libraryTestbedInitParams,
  testbedModel: emptyLibraryPlayfieldMetaModel,
};

export function isDomainControllerActionCrudSuite(suiteKey: string): boolean {
  return domainControllerIntegTestNames.includes(suiteKey);
}
