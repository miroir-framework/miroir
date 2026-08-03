import { describe, expect, it } from "vitest";
import { defaultLibraryAppModel, entityAuthor, entityBook, entityPublisher } from "miroir-test-app_deployment-library";

import {
  DOMAIN_CONTROLLER_COMPOSITE_PK_CRUD_SUITE_KEY,
  DOMAIN_CONTROLLER_DATA_CRUD_SUITE_KEY,
  DOMAIN_CONTROLLER_MODEL_CRUD_SUITE_KEY,
  DOMAIN_CONTROLLER_APPLICATION_VERSION_FREEZE_SUITE_KEY,
  DOMAIN_CONTROLLER_MODEL_UNDO_REDO_SUITE_KEY,
  DOMAIN_CONTROLLER_NO_PARENT_UUID_CRUD_SUITE_KEY,
  DOMAIN_CONTROLLER_NON_UUID_PK_DATA_CRUD_SUITE_KEY,
  DOMAIN_CONTROLLER_NON_UUID_PK_MODEL_CRUD_SUITE_KEY,
  domainControllerDataCrudFilterEntities,
  domainControllerDataCrudLibraryPlayfieldSeed,
  domainControllerModelCrudLibraryPlayfieldSeed,
  domainControllerCompositePkCrudLibraryPlayfieldSeed,
  domainControllerModelUndoRedoLibraryPlayfieldSeed,
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
  libraryTestbedInitParams,
} from "./libraryPlayfieldSeeds.js";

describe("libraryPlayfieldSeeds (Phase 3 Action Data.CRUD)", () => {
  it("domainControllerDataCrudLibraryPlayfieldSeed uses without-book3 entities + library app model", () => {
    const seed = domainControllerDataCrudLibraryPlayfieldSeed;
    expect(seed.testbedEntitiesAndInstances).toBe(libraryEntitiesAndInstancesWithoutBook3);
    expect(seed.testbedInitApplicationParameters).toBe(libraryTestbedInitParams);
    expect(seed.testbedModel).toBe(defaultLibraryAppModel);
    const bookBucket = seed.testbedEntitiesAndInstances.find(
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
    expect(seed.testbedEntitiesAndInstances).toHaveLength(2);
    expect(seed.testbedEntitiesAndInstances.map((b) => b.entity.name).sort()).toEqual([
      "Country",
      "Publisher",
    ]);
    expect(seed.testbedModel.entities.map((e) => e.name).sort()).toEqual([
      "Country",
      "Publisher",
    ]);
    expect(isDomainControllerModelCrudSuite(DOMAIN_CONTROLLER_MODEL_CRUD_SUITE_KEY)).toBe(true);
    expect(libraryPlayfieldSeedForActionSuite(DOMAIN_CONTROLLER_MODEL_CRUD_SUITE_KEY)).toBe(seed);
  });

  it("domainControllerApplicationVersionFreezeLibraryPlayfieldSeed reuses Model.CRUD seed", () => {
    expect(
      libraryPlayfieldSeedForActionSuite(DOMAIN_CONTROLLER_APPLICATION_VERSION_FREEZE_SUITE_KEY),
    ).toBe(domainControllerModelCrudLibraryPlayfieldSeed);
  });

  it("domainControllerCompositePkCrudLibraryPlayfieldSeed seeds TestEntityCompositePK only", () => {
    const seed = domainControllerCompositePkCrudLibraryPlayfieldSeed;
    expect(seed.testbedEntitiesAndInstances).toHaveLength(1);
    expect(seed.testbedEntitiesAndInstances[0].entity.uuid).toBe(ENTITY_COMPOSITE_PK_UUID);
    expect(seed.testbedEntitiesAndInstances[0].instances).toHaveLength(3);
    expect(seed.testbedModel.entities.map((e) => e.uuid)).toEqual([
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
    expect(modelSeed.testbedEntitiesAndInstances).toHaveLength(1);
    expect(modelSeed.testbedEntitiesAndInstances[0].entity.name).toBe("Publisher");
    expect(
      libraryPlayfieldSeedForActionSuite(DOMAIN_CONTROLLER_NON_UUID_PK_MODEL_CRUD_SUITE_KEY),
    ).toBe(modelSeed);

    const dataSeed = domainControllerNonUuidPkDataCrudLibraryPlayfieldSeed;
    expect(dataSeed.testbedEntitiesAndInstances[0].entity.uuid).toBe(ENTITY_CODE_NUMBER_UUID);
    expect(dataSeed.testbedEntitiesAndInstances[0].instances).toHaveLength(3);
    expect(
      libraryPlayfieldSeedForActionSuite(DOMAIN_CONTROLLER_NON_UUID_PK_DATA_CRUD_SUITE_KEY),
    ).toBe(dataSeed);
  });

  it("domainControllerNoParentUuidCrudLibraryPlayfieldSeed seeds Publisher + NoParentUuid", () => {
    const seed = domainControllerNoParentUuidCrudLibraryPlayfieldSeed;
    expect(seed.testbedEntitiesAndInstances.map((b) => b.entity.name).sort()).toEqual([
      "Publisher",
      "TestEntityNoParentUuid",
    ]);
    const noParent = seed.testbedEntitiesAndInstances.find(
      (b) => b.entity.uuid === ENTITY_NO_PARENT_UUID_UUID,
    );
    expect(noParent?.instances).toHaveLength(3);
    expect(
      libraryPlayfieldSeedForActionSuite(DOMAIN_CONTROLLER_NO_PARENT_UUID_CRUD_SUITE_KEY),
    ).toBe(seed);
  });

  it("domainControllerModelUndoRedoLibraryPlayfieldSeed starts empty", () => {
    const seed = domainControllerModelUndoRedoLibraryPlayfieldSeed;
    expect(seed.testbedEntitiesAndInstances).toEqual([]);
    expect(seed.testbedModel.entities).toEqual([]);
    expect(
      libraryPlayfieldSeedForActionSuite(DOMAIN_CONTROLLER_MODEL_UNDO_REDO_SUITE_KEY),
    ).toBe(seed);
  });
});
