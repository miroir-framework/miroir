import { describe, expect, it } from "vitest";

import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";

import type {
  Entity,
  EntityVersion,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { resolvePresentEntityFromModel } from "../../src/1_core/entityPresentModel.js";
import { presentEntityAsRedundantEntityDefinition } from "../../src/1_core/entityDefinitionCompatibility.js";

const bookEntity = defaultLibraryAppModel.entities.find(
  (entity) => entity.uuid === "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
)!;
const bookDefinition = defaultLibraryAppModel.entityVersions.find(
  (definition) => definition.entityUuid === bookEntity.uuid,
)!;

describe("217 Phase 9 — UI boundary presentEntityAsRedundantEntityDefinition", () => {
  it("aligns existing EntityVersion to present Entity fields", () => {
    const present = resolvePresentEntityFromModel(defaultLibraryAppModel, bookEntity.uuid)!;
    const edShaped = presentEntityAsRedundantEntityDefinition(
      present,
      defaultLibraryAppModel.entityVersions,
    );
    expect(edShaped.entityUuid).toBe(bookEntity.uuid);
    expect(edShaped.mlSchema).toEqual(present.mlSchema);
    expect(edShaped.viewAttributes).toEqual(present.viewAttributes);
    expect(edShaped.defaultInstanceDetailsReportUuid).toEqual(
      present.defaultInstanceDetailsReportUuid,
    );
    // Prefer existing ED instance uuid when dual-write row is present
    expect(edShaped.uuid).toBe(bookDefinition.uuid);
  });

  it("synthesizes ED-shaped carrier when no dual-write EntityVersion exists", () => {
    const orphan: Entity = {
      ...bookEntity,
      uuid: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      name: "OrphanBook",
    };
    const edShaped = presentEntityAsRedundantEntityDefinition(orphan, []);
    expect(edShaped.uuid).toBe(orphan.uuid);
    expect(edShaped.entityUuid).toBe(orphan.uuid);
    expect(edShaped.mlSchema).toEqual(orphan.mlSchema);
    expect(edShaped.parentName).toBe("EntityVersion");
  });

  it("Entity-shaped and ED-shaped carriers expose the same present-model mlSchema", () => {
    const present = resolvePresentEntityFromModel(defaultLibraryAppModel, bookEntity.uuid)!;
    const edShaped: EntityVersion = presentEntityAsRedundantEntityDefinition(
      present,
      [bookDefinition],
    );
    expect(edShaped.mlSchema).toEqual(present.mlSchema);
    expect(edShaped.entityUuid).toBe(present.uuid);
  });
});
