/**
 * #222 Phase 4.2 — Explicit non-goals / non-criteria locks (issue §E + plan).
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { metaMetaModelEntities, metaMetaModelEntityUuids, getApplicationSection } from "../../../../src/1_core/Model.js";
import {
  FREEZE_APPLICATION_VERSION_ACTION_TYPE,
  snapshotEntitiesAsHistoricalEntityVersions,
} from "../../../../src/1_core/versioning/applicationVersionFreeze.js";
import {
  entityEntity,
  entityEntityVersion,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import type { Entity } from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { MIROIR_ENTITY_VERSION_INSTANCE_UUIDS_SLICE0 } from "./222.slice0-inventory.js";

const REPO_ROOT = join(import.meta.dirname, "../../../../../..");
const EV_MODEL_VERSION_DIR = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_modelVersion",
  "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
);
const FREEZE_SRC = join(
  REPO_ROOT,
  "packages/miroir-core/src/1_core/versioning/applicationVersionFreeze.ts",
);

describe("222 Phase 4 — non-goals (relocate ≠ purge; no freeze required)", () => {
  it("redundant live EntityVersion rows still present under modelVersion (count ≥ Slice 0)", () => {
    const count = readdirSync(EV_MODEL_VERSION_DIR).filter((n) => n.endsWith(".json")).length;
    expect(count).toBeGreaterThanOrEqual(MIROIR_ENTITY_VERSION_INSTANCE_UUIDS_SLICE0.length);
    expect(count).toBe(MIROIR_ENTITY_VERSION_INSTANCE_UUIDS_SLICE0.length);
  });

  it("Commit is not forced into metaMetaModelEntities (Entity-only)", () => {
    expect(metaMetaModelEntities).toHaveLength(1);
    expect(metaMetaModelEntityUuids).toEqual([entityEntity.uuid]);
    expect(metaMetaModelEntities.map((e: Entity) => e.name)).not.toContain("Commit");
  });

  it("freeze historical mint uses new UUIDs (not live Entity uuid reuse)", () => {
    const src = readFileSync(FREEZE_SRC, "utf8");
    expect(src).toMatch(/Do \*\*not\*\* use UUID-reuse|new UUID|mintUuid/);
    const entity = entityEntity as Entity;
    const snaps = snapshotEntitiesAsHistoricalEntityVersions([entity], {
      newUuid: () => "11111111-1111-4111-8111-111111111111",
    });
    expect(snaps).toHaveLength(1);
    expect(snaps[0].uuid).toBe("11111111-1111-4111-8111-111111111111");
    expect(snaps[0].uuid).not.toBe(entity.uuid);
    expect(snaps[0].entityUuid).toBe(entity.uuid);
  });

  it("E: EntityVersion freeze section is modelVersion after #232 (getApplicationSection is the single source)", () => {
    expect(FREEZE_APPLICATION_VERSION_ACTION_TYPE).toBe("freezeApplicationVersion");
    expect(getApplicationSection(selfApplicationMiroir.uuid as string, entityEntityVersion.uuid!)).toBe("modelVersion");
  });
});
