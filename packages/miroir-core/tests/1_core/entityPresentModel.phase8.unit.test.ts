import { describe, expect, it } from "vitest";

import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";

import type {
  Entity,
  EntityDefinition,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { resolvePresentEntityFromModel } from "../../src/1_core/entityPresentModel.js";

const bookEntity = defaultLibraryAppModel.entities.find(
  (entity) => entity.uuid === "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
)!;
const bookDefinition = defaultLibraryAppModel.entityDefinitions.find(
  (definition) => definition.entityUuid === bookEntity.uuid,
)!;
const authorEntityUuid = "d7a144ff-d1b9-4135-800c-a7cfc1f38733";

describe("217 Phase 8 — resolvePresentEntityFromModel", () => {
  it("returns assembled Entity present model from MetaModel.entities", () => {
    const present = resolvePresentEntityFromModel(defaultLibraryAppModel, bookEntity.uuid);
    expect(present?.uuid).toBe(bookEntity.uuid);
    expect(present?.mlSchema).toEqual(bookEntity.mlSchema);
    expect(present?.viewAttributes).toEqual(bookEntity.viewAttributes);
  });

  it("enriches incomplete Entity via EntityDefinition fallback hub", () => {
    const legacyEntity: Entity = {
      uuid: bookEntity.uuid,
      name: bookEntity.name,
      parentUuid: bookEntity.parentUuid,
      parentName: bookEntity.parentName,
    };
    const present = resolvePresentEntityFromModel(
      {
        entities: [legacyEntity],
        entityDefinitions: [bookDefinition],
      },
      bookEntity.uuid,
    );
    expect(present?.mlSchema).toEqual(bookDefinition.mlSchema);
  });

  it("synthesizes present model from EntityDefinition alone when Entity missing", () => {
    const present = resolvePresentEntityFromModel(
      {
        entities: [],
        entityDefinitions: [bookDefinition],
      },
      bookEntity.uuid,
    );
    expect(present?.mlSchema).toEqual(bookDefinition.mlSchema);
    expect(present?.uuid).toBe(bookEntity.uuid);
  });

  it("returns undefined when entityUuid is unknown", () => {
    expect(
      resolvePresentEntityFromModel(defaultLibraryAppModel, "00000000-0000-4000-8000-000000000099"),
    ).toBeUndefined();
  });

  it("Library Author present model matches EntityDefinition mlSchema (equivalence)", () => {
    const present = resolvePresentEntityFromModel(defaultLibraryAppModel, authorEntityUuid);
    const authorDefinition = defaultLibraryAppModel.entityDefinitions.find(
      (definition) => definition.entityUuid === authorEntityUuid,
    ) as EntityDefinition;
    expect(present?.mlSchema).toEqual(authorDefinition.mlSchema);
  });
});
