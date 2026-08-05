import type {
  ApplicationEntitiesAndInstances,
  Entity,
  EntityInstance,
  EntityVersion,
  InitApplicationParameters,
  MetaModel,
  MiroirTestDefinition,
  SelfApplication,
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
  Country1,
  Country2,
  Country3,
  entityAuthor,
  entityBook,
  entityCountry,
  entityDefinitionPublisher,
  entityPublisher,
  entityVersionCountry,
  entityVersionPublisher,
  folio as publisher1,
  penguin as publisher2,
  springer as publisher3,
  selfApplicationLibrary,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationVersionLibraryInitialVersion
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
  miroirTest_evolutionTraceWP1
} from "miroir-test-app_deployment-miroir";


import { defaultMiroirMetaModel } from "miroir-test-app_deployment-miroir";


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

/**
 * Seed payload for `RunnerTestSessionOptions.libraryPlayfieldSeed` /
 * `resetIntegTestbed` (Action Data.CRUD playfield).
 */
export type TestbedSetupParameters = {
  testbedEntitiesAndInstances: ApplicationEntitiesAndInstances;
  testbedInitApplicationParameters: InitApplicationParameters;
  testbedModel: MetaModel;
};

/** Composite-PK test entity — PK is `["region", "code"]` (matches legacy integ file). */
export const ENTITY_COMPOSITE_PK_UUID = "44691d2c-d7c1-48e0-8363-71c51195e104";
export const ENTITY_DEFINITION_COMPOSITE_PK_UUID = "fbec9082-5cdf-4877-bd78-66a434a8eebf";

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

export const entityDefinitionCompositePK: EntityVersion = {
  uuid: ENTITY_DEFINITION_COMPOSITE_PK_UUID,
  parentName: "EntityVersion",
  parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
  parentDefinitionVersionUuid: "bdd7ad43-f0fc-4716-90c1-87454c40dd95",
  entityUuid: ENTITY_COMPOSITE_PK_UUID,
  conceptLevel: "Model",
  name: "TestEntityCompositePK",
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
} as any as EntityVersion;

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

/**
 * MetaModel for composite-PK Action seed — only TestEntityCompositePK
 * (matches legacy filterEntities=[entityCompositePKUuid]).
 */
export const compositePKTestMetaModel: MetaModel = {
  applicationUuid: selfApplicationLibrary.uuid,
  applicationName: selfApplicationLibrary.name,
  entities: [entityCompositePK],
  entityVersions: [entityDefinitionCompositePK],
  endpoints: [],
  jzodSchemas: [],
  menus: [],
  runners: [],
  themes: [],
  applicationVersions: [],
  reports: [],
  storedQueries: [],
  applicationVersionCrossEntityVersion: [],
  applicationVersionCrossQueryVersion: [],
  queryVersions: [],
  applicationVersionCrossReportVersion: [],
  reportVersions: [],
  applicationVersionCrossMenuVersion: [],
  menuVersions: [],
  applicationVersionCrossEndpointVersion: [],
  endpointVersions: [],
  applications: [],
  tests: [],
};

export const libraryEntitiesAndInstancesCompositePK: ApplicationEntitiesAndInstances = [
  {
    entity: entityCompositePK,
    instances: [compositeItem1, compositeItem2, compositeItem3],
  },
];

/** Non-UUID number PK test entity — `idAttribute: "code"` (matches legacy integ file). */
export const ENTITY_CODE_NUMBER_UUID = "4bbf4d19-7ac5-4fff-88ee-63ee49c7802f";
export const ENTITY_DEFINITION_CODE_NUMBER_UUID = "dceae8f8-c657-49df-9967-64ac3e52f5b4";

export const entityCodeNumber: Entity = {
  uuid: ENTITY_CODE_NUMBER_UUID,
  parentName: "Entity",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
  selfApplication: selfApplicationLibrary.uuid,
  name: "TestEntityCodeNumber",
  conceptLevel: "Model",
  description: "Test entity with a non-UUID number primary key.",
  // #220 — present-model on Entity for Entity-only create
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
} as Entity;

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
} as any as EntityVersion;

export const codeItem1: EntityInstance = {
  code: 1,
  parentUuid: ENTITY_CODE_NUMBER_UUID,
  parentName: "TestEntityCodeNumber",
  name: "first item",
} as EntityInstance;

export const codeItem2: EntityInstance = {
  code: 2,
  parentUuid: ENTITY_CODE_NUMBER_UUID,
  parentName: "TestEntityCodeNumber",
  name: "second item",
} as EntityInstance;

export const codeItem3: EntityInstance = {
  code: 3,
  parentUuid: ENTITY_CODE_NUMBER_UUID,
  parentName: "TestEntityCodeNumber",
  name: "third item",
} as EntityInstance;

/** MetaModel for non-UUID PK Data seed — TestEntityCodeNumber only. */
export const codeNumberTestMetaModel: MetaModel = {
  applicationUuid: selfApplicationLibrary.uuid,
  applicationName: selfApplicationLibrary.name,
  entities: [entityCodeNumber],
  entityVersions: [entityDefinitionCodeNumber],
  endpoints: [],
  jzodSchemas: [],
  menus: [],
  runners: [],
  themes: [],
  applicationVersions: [],
  reports: [],
  storedQueries: [],
  applicationVersionCrossEntityVersion: [],
  applicationVersionCrossQueryVersion: [],
  queryVersions: [],
  applicationVersionCrossReportVersion: [],
  reportVersions: [],
  applicationVersionCrossMenuVersion: [],
  menuVersions: [],
  applicationVersionCrossEndpointVersion: [],
  endpointVersions: [],
  applications: [],
  tests: [],
};

// ###############################################################################
export const publisherOnlyTestMetaModel: MetaModel = {
  applicationUuid: selfApplicationLibrary.uuid,
  applicationName: selfApplicationLibrary.name,
  entities: [entityPublisher as Entity],
  entityVersions: [entityDefinitionPublisher as EntityVersion],
  endpoints: [],
  jzodSchemas: [],
  menus: [],
  runners: [],
  themes: [],
  applicationVersions: [],
  reports: [],
  storedQueries: [],
  applicationVersionCrossEntityVersion: [],
  applicationVersionCrossQueryVersion: [],
  queryVersions: [],
  applicationVersionCrossReportVersion: [],
  reportVersions: [],
  applicationVersionCrossMenuVersion: [],
  menuVersions: [],
  applicationVersionCrossEndpointVersion: [],
  endpointVersions: [],
  applications: [],
  tests: [],
};

/** Entity whose instances omit `parentUuid` — standard UUID PK (legacy noParentUuid integ). */
export const ENTITY_NO_PARENT_UUID_UUID = "803b81ad-fda4-4206-8860-cc86f37c7a6e";
export const ENTITY_DEFINITION_NO_PARENT_UUID_UUID = "0057f84b-64d8-4395-8841-b264e3f9473a";

export const entityNoParentUuid: Entity = {
  uuid: ENTITY_NO_PARENT_UUID_UUID,
  parentName: "Entity",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
  selfApplication: selfApplicationLibrary.uuid,
  name: "TestEntityNoParentUuid",
  conceptLevel: "Model",
  description: "Test entity whose instances do not bear a parentUuid attribute.",
  // #220 — present-model on Entity for Entity-only create
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
} as Entity;

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

export const noParentItem1: EntityInstance = {
  uuid: "4476e12d-e822-44db-bd06-aadb81b74d60",
  name: "item one",
} as EntityInstance;

export const noParentItem2: EntityInstance = {
  uuid: "63e87f77-30d8-4044-a8de-0e7af286060c",
  name: "item two",
} as EntityInstance;

export const noParentItem3: EntityInstance = {
  uuid: "ada284e0-f3bb-4da8-8041-671a8ee39b8d",
  name: "item three",
} as EntityInstance;

/**
 * MetaModel for no-parentUuid suite — Publisher + TestEntityNoParentUuid
 * (Model leaf expects count 2 after recreate; Data leaves use NoParentUuid instances).
 */
export const noParentUuidTestMetaModel: MetaModel = {
  applicationUuid: selfApplicationLibrary.uuid,
  applicationName: selfApplicationLibrary.name,
  entities: [entityPublisher as Entity, entityNoParentUuid],
  entityVersions: [
    entityVersionPublisher as EntityVersion,
    entityDefinitionNoParentUuid,
  ],
  endpoints: [],
  jzodSchemas: [],
  menus: [],
  runners: [],
  themes: [],
  applicationVersions: [],
  reports: [],
  storedQueries: [],
  applicationVersionCrossEntityVersion: [],
  applicationVersionCrossQueryVersion: [],
  queryVersions: [],
  applicationVersionCrossReportVersion: [],
  reportVersions: [],
  applicationVersionCrossMenuVersion: [],
  menuVersions: [],
  applicationVersionCrossEndpointVersion: [],
  endpointVersions: [],
  applications: [],
  tests: [],
};

// ###############################################################################
export const libraryTestbedInitParams: InitApplicationParameters = {
  dataStoreType: "app",
  metaModel: defaultMiroirMetaModel,
  selfApplication: selfApplicationLibrary as SelfApplication,
  applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
  applicationVersion: selfApplicationVersionLibraryInitialVersion,
};

/** Library seed without `book3` — used by DomainController Data CRUD composite-action hooks. */
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
 * (`resetAndinitializeDeploymentCompositeAction` 6th arg). Shared for Phase 4 cutover.
 */
export const domainControllerDataCrudFilterEntities: Uuid[] = [
  entityAuthor.uuid,
  entityBook.uuid,
  entityPublisher.uuid,
];



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

export const domainControllerModelCrudFilterEntities: Uuid[] = [
  entityPublisher.uuid,
  entityCountry.uuid,
];

/** MetaModel for Model.CRUD — Publisher + Country only (legacy filterEntities). */
export const publisherAndCountryTestMetaModel: MetaModel = {
  applicationUuid: selfApplicationLibrary.uuid,
  applicationName: selfApplicationLibrary.name,
  entities: [entityPublisher as Entity, entityCountry as Entity],
  entityVersions: [
    entityVersionPublisher as EntityVersion,
    entityVersionCountry as EntityVersion,
  ],
  endpoints: [],
  jzodSchemas: [],
  menus: [],
  runners: [],
  themes: [],
  applicationVersions: [],
  reports: [],
  storedQueries: [],
  applicationVersionCrossEntityVersion: [],
  applicationVersionCrossQueryVersion: [],
  queryVersions: [],
  applicationVersionCrossReportVersion: [],
  reportVersions: [],
  applicationVersionCrossMenuVersion: [],
  menuVersions: [],
  applicationVersionCrossEndpointVersion: [],
  endpointVersions: [],
  applications: [],
  tests: [],
};

/**
 * Empty Library playfield — Model undo/redo starts with no Author/Book entities
 * (matches imperative undo-redo `resetIntegTestbed` without seed instances).
 */
export const emptyLibraryPlayfieldMetaModel: MetaModel = {
  applicationUuid: selfApplicationLibrary.uuid,
  applicationName: selfApplicationLibrary.name,
  entities: [],
  entityVersions: [],
  endpoints: [],
  jzodSchemas: [],
  menus: [],
  runners: [],
  themes: [],
  applicationVersions: [],
  reports: [],
  storedQueries: [],
  applicationVersionCrossEntityVersion: [],
  applicationVersionCrossQueryVersion: [],
  queryVersions: [],
  applicationVersionCrossReportVersion: [],
  reportVersions: [],
  applicationVersionCrossMenuVersion: [],
  menuVersions: [],
  applicationVersionCrossEndpointVersion: [],
  endpointVersions: [],
  applications: [],
  tests: [],
};

export const domainControllerModelUndoRedoLibraryPlayfieldSeed: TestbedSetupParameters = {
  testbedEntitiesAndInstances: [],
  testbedInitApplicationParameters: libraryTestbedInitParams,
  testbedModel: emptyLibraryPlayfieldMetaModel,
};

export function isDomainControllerActionCrudSuite(suiteKey: string): boolean {
  return domainControllerIntegTestNames.includes(suiteKey);
}