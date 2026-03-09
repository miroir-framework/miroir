import {
  CompositeActionSequence,
  EntityDefinition,
  EntityInstance,
  Entity,
  MiroirConfigClient,
  Uuid,
  type ApplicationEntitiesAndInstances
} from "miroir-core";
import { adminSelfApplication, entityDeployment } from "miroir-test-app_deployment-admin";
import {
  entityAuthor,
  entityDefinitionAuthor,
  author1,
  author2,
  author3,
  entityBook,
  entityDefinitionBook,
  book1,
  book2,
  book4,
  book5,
  book6,
  folio as publisher1,
  penguin as publisher2,
  springer as publisher3,
  entityPublisher,
  entityDefinitionPublisher,
  selfApplicationDeploymentLibrary,
} from "miroir-test-app_deployment-library";

export const libraryEntitesAndInstancesWithoutBook3: ApplicationEntitiesAndInstances  = [
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
      // book3 as EntityInstance,
      book4 as EntityInstance,
      book5 as EntityInstance,
      book6 as EntityInstance,
    ],
  },
  {
    entity: entityPublisher as Entity,
    entityDefinition: entityDefinitionPublisher as EntityDefinition,
    instances: [publisher1 as EntityInstance, publisher2 as EntityInstance, publisher3 as EntityInstance],
  },
];

