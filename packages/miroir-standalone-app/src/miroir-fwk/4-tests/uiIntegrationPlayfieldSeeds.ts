import type {
  ApplicationEntitiesAndInstances,
  Entity,
  EntityInstance,
  InitApplicationParameters,
  MetaModelPartial,
  SelfApplication,
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
  Country1,
  Country2,
  Country3,
  entityAuthor,
  entityBook,
  entityCountry,
  entityPublisher,
  entityUser,
  folio as publisher1,
  penguin as publisher2,
  springer as publisher3,
  selfApplicationLibrary,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationVersionLibraryInitialVersion,
  user1
} from "miroir-test-app_deployment-library";

import { defaultMiroirMetaModel } from "miroir-test-app_deployment-miroir";

/**
 * Session playfield triple (model + instances + init). Not a registry field.
 */
export type TestbedSetupParameters = {
  testbedEntitiesAndInstances: ApplicationEntitiesAndInstances;
  testbedInitApplicationParameters: InitApplicationParameters;
  testbedModel: MetaModelPartial;
};

/** Composite-PK test entity — PK is `["region", "code"]` (matches legacy integ file). */
const ENTITY_COMPOSITE_PK_UUID = "44691d2c-d7c1-48e0-8363-71c51195e104";

export const entityCompositePK: Entity = {
  uuid: ENTITY_COMPOSITE_PK_UUID,
  parentName: "Entity",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
  selfApplication: selfApplicationLibrary.uuid,
  name: "TestEntityCompositePK",
  conceptLevel: "Model",
  description: "Test entity with a composite primary key [region, code].",
  // #220 — present-model on Entity for Entity-only create
  idAttribute: ["region", "code"],
  mlSchema: {
    type: "object",
    definition: {
      region: {
        type: "string",
        tag: { value: { id: 1, defaultLabel: "Region" } },
      },
      code: {
        type: "string",
        tag: { value: { id: 2, defaultLabel: "Code" } },
      },
      parentName: {
        type: "string",
        optional: true,
        tag: { value: { id: 3, defaultLabel: "Entity Name" } },
      },
      parentUuid: {
        type: "uuid",
        tag: { value: { id: 4, defaultLabel: "Entity Uuid" } },
      },
      name: {
        type: "string",
        tag: { value: { id: 5, defaultLabel: "Name" } },
      },
    },
  },
} as Entity;

export const compositeItem1: EntityInstance = {
  region: "EU",
  code: "A1",
  parentUuid: ENTITY_COMPOSITE_PK_UUID,
  parentName: "TestEntityCompositePK",
  name: "EU-A1 item",
} as EntityInstance;

export const compositeItem2: EntityInstance = {
  region: "EU",
  code: "B2",
  parentUuid: ENTITY_COMPOSITE_PK_UUID,
  parentName: "TestEntityCompositePK",
  name: "EU-B2 item",
} as EntityInstance;

export const compositeItem3: EntityInstance = {
  region: "US",
  code: "A1",
  parentUuid: ENTITY_COMPOSITE_PK_UUID,
  parentName: "TestEntityCompositePK",
  name: "US-A1 item",
} as EntityInstance;

export const libraryTestbedInitParams: InitApplicationParameters = {
  dataStoreType: "app",
  metaModel: defaultMiroirMetaModel,
  selfApplication: selfApplicationLibrary as SelfApplication,
  applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
  applicationVersion: selfApplicationVersionLibraryInitialVersion,
};

/** Library seed for lendDocument / returnDocument runner suites (users + catalog data). */
export const runnerLibraryDocumentEntitiesAndInstances: ApplicationEntitiesAndInstances = [
  {
    entity: entityAuthor as Entity,
    instances: [author1 as EntityInstance, author2 as EntityInstance, author3 as EntityInstance],
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
  {
    entity: entityUser as Entity,
    instances: [user1 as EntityInstance],
  },
];

// export const runnerLibraryDocumentPlayfieldSeed: TestbedSetupParameters = {
//   testbedEntitiesAndInstances: runnerLibraryDocumentEntitiesAndInstances,
//   testbedInitApplicationParameters: libraryTestbedInitParams,
//   testbedModel: defaultLibraryAppModel as MetaModel,
// };

/** Publisher + Country only — Model.CRUD beforeEach seed. */
export const libraryEntitiesAndInstancesPublisherAndCountry: ApplicationEntitiesAndInstances = [
  {
    entity: entityPublisher as Entity,
    instances: [
      publisher1 as EntityInstance,
      publisher2 as EntityInstance,
      publisher3 as EntityInstance,
    ],
  },
  {
    entity: entityCountry as Entity,
    instances: [
      Country1 as EntityInstance,
      Country2 as EntityInstance,
      Country3 as EntityInstance,
    ],
  },
];
