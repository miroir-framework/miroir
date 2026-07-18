import { describe, expect, it } from "vitest";
import { defaultLibraryAppModel, entityAuthor, entityBook, entityPublisher } from "miroir-test-app_deployment-library";

import {
  DOMAIN_CONTROLLER_DATA_CRUD_SUITE_KEY,
  domainControllerDataCrudFilterEntities,
  domainControllerDataCrudLibraryPlayfieldSeed,
  isDomainControllerDataCrudSuite,
  libraryEntitiesAndInstancesWithoutBook3,
  libraryPlayfieldSeedInitParams,
} from "./libraryPlayfieldSeeds.js";

describe("libraryPlayfieldSeeds (Phase 3 Action Data.CRUD)", () => {
  it("domainControllerDataCrudLibraryPlayfieldSeed uses without-book3 entities + library app model", () => {
    const seed = domainControllerDataCrudLibraryPlayfieldSeed;
    expect(seed.libraryEntitiesAndInstances).toBe(libraryEntitiesAndInstancesWithoutBook3);
    expect(seed.librarySeedInitParams).toBe(libraryPlayfieldSeedInitParams);
    expect(seed.librarySeedMetaModel).toBe(defaultLibraryAppModel);
    const bookBucket = seed.libraryEntitiesAndInstances.find(
      (b) => b.entity.uuid === entityBook.uuid,
    );
    expect(bookBucket?.instances).toHaveLength(5);
  });

  it("domainControllerDataCrudFilterEntities matches Author/Book/Publisher", () => {
    expect(domainControllerDataCrudFilterEntities).toEqual([
      entityAuthor.uuid,
      entityBook.uuid,
      entityPublisher.uuid,
    ]);
  });

  it("isDomainControllerDataCrudSuite matches registry key only", () => {
    expect(isDomainControllerDataCrudSuite(DOMAIN_CONTROLLER_DATA_CRUD_SUITE_KEY)).toBe(true);
    expect(isDomainControllerDataCrudSuite("runner_library")).toBe(false);
  });
});
