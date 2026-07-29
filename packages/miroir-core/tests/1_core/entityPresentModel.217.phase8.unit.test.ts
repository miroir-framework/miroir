import { describe, expect, it } from "vitest";

import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";

import { findEntityFromUuid } from "../../src/1_core/entityPresentModel.js";

const bookEntity = defaultLibraryAppModel.entities.find(
  (entity) => entity.uuid === "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
)!;

describe("217 Phase 8 — findEntityFromUuid", () => {
  it("returns the Entity present model from MetaModel.entities", () => {
    const present = findEntityFromUuid(defaultLibraryAppModel, bookEntity.uuid);
    expect(present).toBe(bookEntity);
  });

  it("returns undefined when entityUuid is unknown", () => {
    expect(
      findEntityFromUuid(defaultLibraryAppModel, "00000000-0000-4000-8000-000000000099"),
    ).toBeUndefined();
  });

});
