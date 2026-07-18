import { describe, expect, it } from "vitest";
import { defaultLibraryAppModel, entityAuthor, entityBook, entityPublisher } from "miroir-test-app_deployment-library";

import {
  DOMAIN_CONTROLLER_COMPOSITE_PK_CRUD_SUITE_KEY,
  DOMAIN_CONTROLLER_DATA_CRUD_SUITE_KEY,
  DOMAIN_CONTROLLER_MODEL_CRUD_SUITE_KEY,
  DOMAIN_CONTROLLER_NO_PARENT_UUID_CRUD_SUITE_KEY,
  DOMAIN_CONTROLLER_NON_UUID_PK_DATA_CRUD_SUITE_KEY,
  DOMAIN_CONTROLLER_NON_UUID_PK_MODEL_CRUD_SUITE_KEY,
  domainControllerDataCrudFilterEntities,
  domainControllerDataCrudLibraryPlayfieldSeed,
  domainControllerModelCrudLibraryPlayfieldSeed,
  domainControllerCompositePkCrudLibraryPlayfieldSeed,
  domainControllerNoParentUuidCrudLibraryPlayfieldSeed,
  domainControllerNonUuidPkDataCrudLibraryPlayfieldSeed,
  domainControllerNonUuidPkModelCrudLibraryPlayfieldSeed,
  ENTITY_CODE_NUMBER_UUID,
  ENTITY_COMPOSITE_PK_UUID,
  ENTITY_NO_PARENT_UUID_UUID,
  isDomainControllerCompositePkCrudSuite,
  isDomainControllerDataCrudSuite,
  isDomainControllerModelCrudSuite,
  libraryEntitiesAndInstancesWithoutBook3,
  libraryPlayfieldSeedForActionSuite,
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

  it("domainControllerModelCrudLibraryPlayfieldSeed uses Publisher+Country only", () => {
    const seed = domainControllerModelCrudLibraryPlayfieldSeed;
    expect(seed.libraryEntitiesAndInstances).toHaveLength(2);
    expect(seed.libraryEntitiesAndInstances.map((b) => b.entity.name).sort()).toEqual([
      "Country",
      "Publisher",
    ]);
    expect(isDomainControllerModelCrudSuite(DOMAIN_CONTROLLER_MODEL_CRUD_SUITE_KEY)).toBe(true);
    expect(libraryPlayfieldSeedForActionSuite(DOMAIN_CONTROLLER_MODEL_CRUD_SUITE_KEY)).toBe(seed);
  });

  it("domainControllerCompositePkCrudLibraryPlayfieldSeed seeds TestEntityCompositePK only", () => {
    const seed = domainControllerCompositePkCrudLibraryPlayfieldSeed;
    expect(seed.libraryEntitiesAndInstances).toHaveLength(1);
    expect(seed.libraryEntitiesAndInstances[0].entity.uuid).toBe(ENTITY_COMPOSITE_PK_UUID);
    expect(seed.libraryEntitiesAndInstances[0].instances).toHaveLength(3);
    expect(seed.librarySeedMetaModel.entities.map((e) => e.uuid)).toEqual([
      ENTITY_COMPOSITE_PK_UUID,
    ]);
    expect(
      isDomainControllerCompositePkCrudSuite(DOMAIN_CONTROLLER_COMPOSITE_PK_CRUD_SUITE_KEY),
    ).toBe(true);
    expect(
      libraryPlayfieldSeedForActionSuite(DOMAIN_CONTROLLER_COMPOSITE_PK_CRUD_SUITE_KEY),
    ).toBe(seed);
  });

  it("nonUuidPK model/data seeds use Publisher-only vs CodeNumber playfields", () => {
    const modelSeed = domainControllerNonUuidPkModelCrudLibraryPlayfieldSeed;
    expect(modelSeed.libraryEntitiesAndInstances).toHaveLength(1);
    expect(modelSeed.libraryEntitiesAndInstances[0].entity.name).toBe("Publisher");
    expect(
      libraryPlayfieldSeedForActionSuite(DOMAIN_CONTROLLER_NON_UUID_PK_MODEL_CRUD_SUITE_KEY),
    ).toBe(modelSeed);

    const dataSeed = domainControllerNonUuidPkDataCrudLibraryPlayfieldSeed;
    expect(dataSeed.libraryEntitiesAndInstances[0].entity.uuid).toBe(ENTITY_CODE_NUMBER_UUID);
    expect(dataSeed.libraryEntitiesAndInstances[0].instances).toHaveLength(3);
    expect(
      libraryPlayfieldSeedForActionSuite(DOMAIN_CONTROLLER_NON_UUID_PK_DATA_CRUD_SUITE_KEY),
    ).toBe(dataSeed);
  });

  it("domainControllerNoParentUuidCrudLibraryPlayfieldSeed seeds Publisher + NoParentUuid", () => {
    const seed = domainControllerNoParentUuidCrudLibraryPlayfieldSeed;
    expect(seed.libraryEntitiesAndInstances.map((b) => b.entity.name).sort()).toEqual([
      "Publisher",
      "TestEntityNoParentUuid",
    ]);
    const noParent = seed.libraryEntitiesAndInstances.find(
      (b) => b.entity.uuid === ENTITY_NO_PARENT_UUID_UUID,
    );
    expect(noParent?.instances).toHaveLength(3);
    expect(
      libraryPlayfieldSeedForActionSuite(DOMAIN_CONTROLLER_NO_PARENT_UUID_CRUD_SUITE_KEY),
    ).toBe(seed);
  });
});
