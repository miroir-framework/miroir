import { describe, expect, it } from "vitest";

import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";

import type {
  Entity,
  EntityVersion,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { assembleLivePresentModelEntities } from "../../src/1_core/entityPresentModel.js";

const bookEntity = defaultLibraryAppModel.entities.find(
  (entity) => entity.uuid === "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
)!;
const bookDefinition = defaultLibraryAppModel.entityVersions.find(
  (definition) => definition.entityUuid === bookEntity.uuid,
)!;

describe("217 Phase 7 — assembleLivePresentModelEntities", () => {
  it("returns complete Entities as identity (present-model already on Entity)", () => {
    const assembled = assembleLivePresentModelEntities(
      defaultLibraryAppModel.entities as Entity[],
      defaultLibraryAppModel.entityVersions as EntityVersion[],
    );
    expect(assembled).toHaveLength(defaultLibraryAppModel.entities.length);
    const book = assembled.find((entity) => entity.uuid === bookEntity.uuid);
    expect(book?.mlSchema).toEqual(bookEntity.mlSchema);
    expect(book?.viewAttributes).toEqual(bookEntity.viewAttributes);
  });

  it("enriches incomplete legacy Entity from EntityVersion", () => {
    const legacyEntity: Entity = {
      uuid: bookEntity.uuid,
      name: bookEntity.name,
      parentUuid: bookEntity.parentUuid,
      parentName: bookEntity.parentName,
    };
    const [assembled] = assembleLivePresentModelEntities(
      [legacyEntity],
      [bookDefinition],
    );
    expect(assembled.mlSchema).toEqual(bookDefinition.mlSchema);
    expect(assembled.viewAttributes).toEqual(bookDefinition.viewAttributes);
  });
});
