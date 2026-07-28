/**
 * #221 Slice 1 / Group C — resolvePresentEntityFromModel MetaModel keys.
 *
 * Call sites must pass `entityVersions` (not legacy `entityDefinitions`).
 * Wrong-key objects are a no-op for version fallback.
 */
import { describe, expect, it } from "vitest";

import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";

import type {
  Entity,
  EntityVersion,
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { resolvePresentEntityFromModel } from "../../../src/1_core/entityPresentModel.js";

const bookEntity = defaultLibraryAppModel.entities.find(
  (entity) => entity.uuid === "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
)!;
const bookDefinition = defaultLibraryAppModel.entityVersions.find(
  (definition) => definition.entityUuid === bookEntity.uuid,
)! as EntityVersion;

const incompleteBook: Entity = {
  uuid: bookEntity.uuid,
  name: bookEntity.name,
  parentUuid: bookEntity.parentUuid,
  parentName: bookEntity.parentName,
};

describe("221 Phase 1 — resolvePresentEntityFromModel keys", () => {
  it("enriches incomplete Entity when entityVersions key is used", () => {
    const present = resolvePresentEntityFromModel(
      {
        entities: [incompleteBook],
        entityVersions: [bookDefinition],
      },
      bookEntity.uuid,
    );
    expect(present?.mlSchema).toEqual(bookDefinition.mlSchema);
  });

  it("ignores EntityVersion array passed under wrong entityDefinitions key", () => {
    const present = resolvePresentEntityFromModel(
      {
        entities: [incompleteBook],
        // @ts-expect-error intentional wrong key — must not be read by the hub
        entityDefinitions: [bookDefinition],
      },
      bookEntity.uuid,
    );
    expect(present?.mlSchema).toBeUndefined();
  });
});
