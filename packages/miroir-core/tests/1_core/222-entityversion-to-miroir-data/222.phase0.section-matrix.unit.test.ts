/**
 * #222 Phase 0.1 — section matrix locks.
 * #232 — EntityVersion now routes to modelVersion for all applications.
 */
import { describe, expect, it } from "vitest";

import {
  getApplicationSection,
  metaMetaModelEntities,
  metaMetaModelEntityUuids,
} from "../../../src/1_core/Model.js";
import {
  entityEntity,
  entityEntityVersion,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";
import type { Entity } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

const ENTITY_UUID = entityEntity.uuid as string;
const ENTITY_VERSION_ENTITY_UUID = entityEntityVersion.uuid as string;
const MIROIR_APP_UUID = selfApplicationMiroir.uuid as string;
const LIBRARY_APP_UUID = selfApplicationLibrary.uuid as string;

describe("222 Phase 0 — section matrix (post–Slice 1 locks)", () => {
  it("Miroir + Entity → model", () => {
    expect(getApplicationSection(MIROIR_APP_UUID, ENTITY_UUID)).toBe("model");
  });

  it("#232 Miroir + EntityVersion → modelVersion (was data in #222)", () => {
    expect(getApplicationSection(MIROIR_APP_UUID, ENTITY_VERSION_ENTITY_UUID)).toBe("modelVersion");
  });

  it("#232 Library (non-Miroir) + EntityVersion → modelVersion (was model in #222)", () => {
    expect(getApplicationSection(LIBRARY_APP_UUID, ENTITY_VERSION_ENTITY_UUID)).toBe("modelVersion");
  });

  it("metaMetaModelEntities is Entity-only", () => {
    expect(metaMetaModelEntityUuids).toEqual([ENTITY_UUID]);
    expect(metaMetaModelEntities).toHaveLength(1);
  });

  it("EntityVersion Entity asset conceptLevel is Model", () => {
    expect((entityEntityVersion as Entity).conceptLevel).toBe("Model");
    expect((entityEntityVersion as Entity).uuid).toBe(ENTITY_VERSION_ENTITY_UUID);
    expect((entityEntityVersion as Entity).name).toBe("EntityVersion");
  });
});
