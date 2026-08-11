/**
 * #222 Phase 4.1 — Issue acceptance criteria A–D as durable locks.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  getApplicationSection,
  metaMetaModelEntities,
  metaMetaModelEntityUuids,
  miroirModelEntities,
} from "../../../src/1_core/Model.js";
import {
  entityEntity,
  entityEntityVersion,
  entityMenu,
  entityQueryVersion,
  entityReport,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";
import type { Entity } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { MIROIR_ENTITY_VERSION_INSTANCE_UUIDS_SLICE0 } from "./222.slice0-inventory.js";

const REPO_ROOT = join(import.meta.dirname, "../../../../..");
const EV_DATA_DIR = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data",
  "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
);
const EV_MODEL_DIR = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_model",
  "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
);
const ENTITY_MODEL_DIR = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_model",
  "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
);
const DEPLOYMENT_INDEX = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/index.ts",
);

const MIROIR = selfApplicationMiroir.uuid as string;
const LIBRARY = selfApplicationLibrary.uuid as string;

describe("222 Phase 4 — acceptance (A–D)", () => {
  it("A: EntityVersion Entity conceptLevel is Model", () => {
    expect((entityEntityVersion as Entity).conceptLevel).toBe("Model");
  });

  it("A: Miroir EV instances only under miroir_data; model dir empty/absent", () => {
    expect(existsSync(EV_DATA_DIR)).toBe(true);
    const onDisk = readdirSync(EV_DATA_DIR)
      .filter((n) => n.endsWith(".json"))
      .map((n) => n.replace(/\.json$/, ""))
      .sort();
    expect(onDisk).toEqual([...MIROIR_ENTITY_VERSION_INSTANCE_UUIDS_SLICE0]);
    if (existsSync(EV_MODEL_DIR)) {
      expect(readdirSync(EV_MODEL_DIR).filter((n) => n.endsWith(".json"))).toEqual([]);
    }
  });

  it("A: metaMetaModelEntities / miroirModelEntities are Entity-only bootstrap (no EV)", () => {
    expect(metaMetaModelEntityUuids).toEqual([entityEntity.uuid]);
    expect(metaMetaModelEntities).toHaveLength(1);
    expect(miroirModelEntities.map((e: Entity) => e.uuid)).not.toContain(entityEntityVersion.uuid);
    expect(miroirModelEntities.map((e: Entity) => e.uuid)).toContain(entityEntity.uuid);
  });

  it("#232 A: EV section modelVersion for Miroir and Library (was data/model in #222)", () => {
    expect(getApplicationSection(MIROIR, entityEntityVersion.uuid as string)).toBe("modelVersion");
    expect(getApplicationSection(LIBRARY, entityEntityVersion.uuid as string)).toBe("modelVersion");
  });

  it("B: Entity present-model mlSchema on Entity; section model", () => {
    expect((entityEntity as Entity).mlSchema).toBeDefined();
    expect(getApplicationSection(MIROIR, entityEntity.uuid as string)).toBe("model");
  });

  it("B: Slice 0 EV UUID set is a subset of on-disk Miroir data EV instances", () => {
    const onDisk = new Set(
      readdirSync(EV_DATA_DIR)
        .filter((n) => n.endsWith(".json"))
        .map((n) => n.replace(/\.json$/, "")),
    );
    for (const uuid of MIROIR_ENTITY_VERSION_INSTANCE_UUIDS_SLICE0) {
      expect(onDisk.has(uuid)).toBe(true);
    }
  });

  it("B/C operational-role: present-model paths do not require EntityVersion in model fetch", () => {
    // Miroir bootstrap model set has Entity but not EntityVersion — live schema uses Entity.
    expect(miroirModelEntities.some((e: Entity) => e.uuid === entityEntity.uuid)).toBe(true);
    expect(miroirModelEntities.some((e: Entity) => e.uuid === entityEntityVersion.uuid)).toBe(
      false,
    );
    expect((entityEntity as Entity).mlSchema).toBeDefined();
  });

  it("D: deployment index has no miroir_model/54b9c72f EV instance imports", () => {
    const src = readFileSync(DEPLOYMENT_INDEX, "utf8");
    expect(src).not.toMatch(
      /from\s+"\.\/assets\/miroir_model\/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd\//,
    );
    expect(src).toMatch(
      /from\s+"\.\/assets\/miroir_data\/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd\//,
    );
  });

  it("P10: Report / Menu / Query Entity assets remain under miroir_model/16dbfe28-…", () => {
    for (const entity of [entityReport, entityMenu, entityQueryVersion] as Entity[]) {
      const path = join(ENTITY_MODEL_DIR, `${entity.uuid}.json`);
      expect(existsSync(path), path).toBe(true);
      const row = JSON.parse(readFileSync(path, "utf8"));
      expect(row.uuid).toBe(entity.uuid);
      expect(row.name).toBe(entity.name);
    }
  });
});
