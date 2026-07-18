import type {
  ApplicationEntitiesAndInstances,
  Entity,
  EntityDefinition,
  EntityInstance,
  InitApplicationParameters,
  MetaModel,
  SelfApplication,
  Uuid,
} from "miroir-core";
import { defaultMiroirMetaModel } from "miroir-core";
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
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionPublisher,
  entityPublisher,
  folio as publisher1,
  penguin as publisher2,
  springer as publisher3,
  selfApplicationLibrary,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationVersionLibraryInitialVersion,
} from "miroir-test-app_deployment-library";

/** Suite registry key for DomainController Data CRUD action MiroirTest. */
export const DOMAIN_CONTROLLER_DATA_CRUD_SUITE_KEY = "domain_controller_data_crud";

/**
 * Seed payload for `RunnerTestSessionOptions.libraryPlayfieldSeed` /
 * `resetLibraryPlayfield` (Action Data.CRUD playfield).
 */
export type LibraryPlayfieldSeed = {
  libraryEntitiesAndInstances: ApplicationEntitiesAndInstances;
  librarySeedInitParams: InitApplicationParameters;
  librarySeedMetaModel: MetaModel;
};

export const libraryPlayfieldSeedInitParams: InitApplicationParameters = {
  dataStoreType: "app",
  metaModel: defaultMiroirMetaModel,
  selfApplication: selfApplicationLibrary as SelfApplication,
  applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
  applicationVersion: selfApplicationVersionLibraryInitialVersion,
};

/** Full library seed used by `4_storage` playfield resets (includes `book3`). */
export const libraryEntitiesAndInstances: ApplicationEntitiesAndInstances = [
  {
    entity: entityAuthor as Entity,
    entityDefinition: entityDefinitionAuthor as EntityDefinition,
    instances: [author1, author2, author3 as EntityInstance],
  },
  {
    entity: entityBook as Entity,
    entityDefinition: entityDefinitionBook as EntityDefinition,
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
    entityDefinition: entityDefinitionPublisher as EntityDefinition,
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
    entityDefinition: entityDefinitionAuthor as EntityDefinition,
    instances: [author1, author2, author3 as EntityInstance],
  },
  {
    entity: entityBook as Entity,
    entityDefinition: entityDefinitionBook as EntityDefinition,
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
    entityDefinition: entityDefinitionPublisher as EntityDefinition,
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

/**
 * Session playfield seed for `domain_controller_data_crud` (MiroirTest path).
 * Library app model — not Miroir meta-model — matches Extractor / Data.CRUD seed.
 * Imperative Data.CRUD still builds hooks inline until Phase 4; both share
 * `libraryEntitiesAndInstancesWithoutBook3` + `libraryPlayfieldSeedInitParams`.
 */
export const domainControllerDataCrudLibraryPlayfieldSeed: LibraryPlayfieldSeed = {
  libraryEntitiesAndInstances: libraryEntitiesAndInstancesWithoutBook3,
  librarySeedInitParams: libraryPlayfieldSeedInitParams,
  librarySeedMetaModel: defaultLibraryAppModel as MetaModel,
};

export function isDomainControllerDataCrudSuite(suiteKey: string): boolean {
  return suiteKey === DOMAIN_CONTROLLER_DATA_CRUD_SUITE_KEY;
}
