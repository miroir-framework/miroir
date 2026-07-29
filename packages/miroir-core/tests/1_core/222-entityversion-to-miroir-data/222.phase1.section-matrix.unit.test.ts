/**
 * #222 Phase 1.1 — target section matrix after Miroir EntityVersion → data.
 */
import { describe, expect, it } from "vitest";

import {
  getApplicationSection,
  metaMetaModelEntities,
  metaMetaModelEntityUuids,
  miroirModelEntities,
} from "../../../src/1_core/Model.js";
import {
  entityEntity,
  entityEntityDefinition,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";
import type { Entity } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

const ENTITY_UUID = entityEntity.uuid as string;
const ENTITY_VERSION_ENTITY_UUID = entityEntityDefinition.uuid as string;
const MIROIR_APP_UUID = selfApplicationMiroir.uuid as string;
const LIBRARY_APP_UUID = selfApplicationLibrary.uuid as string;

describe("222 Phase 1 — section matrix (target)", () => {
  it("Miroir + Entity → model", () => {
    expect(getApplicationSection(MIROIR_APP_UUID, ENTITY_UUID)).toBe("model");
  });

  it("Miroir + EntityVersion → data", () => {
    expect(getApplicationSection(MIROIR_APP_UUID, ENTITY_VERSION_ENTITY_UUID)).toBe("data");
  });

  it("Library (non-Miroir) + EntityVersion → model", () => {
    expect(getApplicationSection(LIBRARY_APP_UUID, ENTITY_VERSION_ENTITY_UUID)).toBe("model");
  });

  it("metaMetaModelEntities is Entity-only", () => {
    expect(metaMetaModelEntityUuids).toEqual([ENTITY_UUID]);
    expect(metaMetaModelEntities).toHaveLength(1);
    expect(metaMetaModelEntities[0]?.uuid).toBe(ENTITY_UUID);
  });

  it("EntityVersion Entity conceptLevel is Model", () => {
    expect((entityEntityDefinition as Entity).conceptLevel).toBe("Model");
    expect((entityEntityDefinition as Entity).name).toBe("EntityVersion");
  });

  it("miroirModelEntities does not include EntityVersion", () => {
    expect(miroirModelEntities.map((e: Entity) => e.uuid)).not.toContain(ENTITY_VERSION_ENTITY_UUID);
    expect(miroirModelEntities.map((e: Entity) => e.uuid)).toContain(ENTITY_UUID);
  });
});
