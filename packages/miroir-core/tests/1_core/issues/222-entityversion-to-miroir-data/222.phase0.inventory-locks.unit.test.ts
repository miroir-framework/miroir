/**
 * #222 Phase 0.2 — UUID inventory & non-goals (paths retargeted to miroir_modelVersion / #234).
 *
 * Inventory lives under miroir_modelVersion; UUID set remains the Slice 0 snapshot.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  metaMetaModelEntities,
  metaMetaModelEntityUuids,
} from "../../../../src/1_core/Model.js";
import {
  entityEntity,
  entityEntityVersion,
} from "miroir-test-app_deployment-miroir";
import type { Entity } from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

import { MIROIR_ENTITY_VERSION_INSTANCE_UUIDS_SLICE0 } from "./222.slice0-inventory.js";

const REPO_ROOT = join(import.meta.dirname, "../../../../../..");
const ENTITY_VERSION_MODEL_VERSION_DIR = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_modelVersion",
  "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
);
const ENTITY_ENTITY_ASSET = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_model",
  "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json",
);

export { MIROIR_ENTITY_VERSION_INSTANCE_UUIDS_SLICE0 };

const SELF_ENTITY_VERSION_UUID = "bdd7ad43-f0fc-4716-90c1-87454c40dd95";
const COMMIT_ENTITY_UUID = "73bb0c69-e636-4e3b-a230-51f25469c089";

describe("222 Phase 0 — UUID inventory & non-goals (post–Slice 1)", () => {
  it("Miroir EntityVersion instance UUID set under miroir_modelVersion/54b9c72f is stable", () => {
    const onDisk = readdirSync(ENTITY_VERSION_MODEL_VERSION_DIR)
      .filter((name) => name.endsWith(".json"))
      .map((name) => name.replace(/\.json$/, ""))
      .sort();
    expect(onDisk).toEqual([...MIROIR_ENTITY_VERSION_INSTANCE_UUIDS_SLICE0]);
    expect(onDisk).toHaveLength(MIROIR_ENTITY_VERSION_INSTANCE_UUIDS_SLICE0.length);
  });

  it("self-describing EntityVersion-of-EntityVersion (bdd7ad43) is in the inventory", () => {
    expect(MIROIR_ENTITY_VERSION_INSTANCE_UUIDS_SLICE0).toContain(SELF_ENTITY_VERSION_UUID);
    const selfEvPath = join(ENTITY_VERSION_MODEL_VERSION_DIR, `${SELF_ENTITY_VERSION_UUID}.json`);
    const selfEv = JSON.parse(readFileSync(selfEvPath, "utf8"));
    expect(selfEv.uuid).toBe(SELF_ENTITY_VERSION_UUID);
    expect(selfEv.entityUuid).toBe(entityEntityVersion.uuid);
    expect(selfEv.parentUuid).toBe(entityEntityVersion.uuid);
  });

  it("Commit is not in metaMetaModelEntities (P12 baseline)", () => {
    expect(metaMetaModelEntityUuids).not.toContain(COMMIT_ENTITY_UUID);
    expect(metaMetaModelEntities.map((e: Entity) => e.uuid)).not.toContain(COMMIT_ENTITY_UUID);
  });

  it("Entity present-model fields live on Entity (#217 invariant)", () => {
    const fromExport = entityEntity as Entity;
    expect(fromExport.uuid).toBe("16dbfe28-e1d7-4f20-9ba4-c1a9873202ad");
    expect(fromExport.mlSchema).toBeDefined();
    expect(fromExport.mlSchema).toEqual(expect.objectContaining({ type: expect.any(String) }));

    const fromDisk = JSON.parse(readFileSync(ENTITY_ENTITY_ASSET, "utf8")) as Entity;
    expect(fromDisk.mlSchema).toBeDefined();
    expect(fromDisk.uuid).toBe(fromExport.uuid);
  });
});
