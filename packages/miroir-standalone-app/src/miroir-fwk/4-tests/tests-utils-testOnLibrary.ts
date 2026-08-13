import {
  CompositeActionSequence,
  EntityInstance,
  Entity,
  MiroirConfigClient,
  Uuid,
  type ApplicationEntitiesAndInstances
} from "miroir-core";
import { adminSelfApplication, entityDeployment } from "miroir-test-app_deployment-admin";
import {
  entityAuthor,
  author1,
  author2,
  author3,
  entityBook,
  book1,
  book2,
  book4,
  book5,
  book6,
  folio as publisher1,
  penguin as publisher2,
  springer as publisher3,
  entityPublisher,
} from "miroir-test-app_deployment-library";

export const libraryEntitesAndInstancesWithoutBook3: ApplicationEntitiesAndInstances  = [
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
    instances: [publisher1 as EntityInstance, publisher2 as EntityInstance, publisher3 as EntityInstance],
  },
];
