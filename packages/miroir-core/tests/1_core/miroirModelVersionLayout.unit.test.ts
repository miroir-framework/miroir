/**
 * Miroir model-version layout: EntityVersion instances live under
 * miroir_modelVersion/, the live model bootstrap is Entity-only, and
 * present-model data stays on Entity rows.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  getApplicationSection,
  metaMetaModelEntities,
  metaMetaModelEntityUuids,
  miroirModelEntities,
} from "../../src/1_core/Model.js";
import {
  entityEntity,
  entityEntityVersion,
  entityMenu,
  entityQueryVersion,
  entityReport,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";
import type { Entity } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

/** Miroir EntityVersion instance UUIDs (stable across relocation). */
const MIROIR_ENTITY_VERSION_INSTANCE_UUIDS = [
  "0f421b2f-2fdc-47ee-8232-62121ea46350",
  "15407b85-f2c8-4a34-bfa7-89f044ba2407",
  "20e86585-e18f-4995-a141-486369acd4f8",
  "27046fce-742f-4cc4-bb95-76b271f490a5",
  "31b88b03-f301-44f9-a6bf-934ed0576ee0",
  "359f1f9b-7260-4d76-a864-72c839b9711b",
  "381ab1be-337f-4198-b1d3-f686867fc1dd",
  "45491bf9-a923-4a9c-a0da-6b0c3df2f296",
  "51c647fe-07ec-411c-89cc-02689dc66d6a",
  "54a16d69-c1f0-4dd7-aba4-a2cda883586c",
  "69bf7c03-a1df-4d1c-88c1-44363feeea87",
  "9460420b-f176-4918-bd45-894ab195ffe9",
  "952d2c65-4da2-45c2-9394-a0920ceedfb6",
  "a3b4c5d6-e7f8-4123-a4b5-c6d7e8f9a0d2",
  "b17d5e9e-12f2-4ed8-abdb-2576c01514a4",
  "b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e",
  "b4c5d6e7-f8a9-4123-a4b5-c6d7e8f9a0d3",
  "bdd7ad43-f0fc-4716-90c1-87454c40dd95",
  "c0b71083-8cc8-43db-bf52-572f1f03bbb5",
  "c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f",
  "c3179f1d-10bd-4b0f-9a6b-f118d8eb2312",
  "c3d4e5f6-a7b8-4901-a2b3-c4d5e6f7a8b9",
  "c9d0e1f2-a3b4-4123-a4b5-c6d7e8f9a0b1",
  "c9d0e1f2-a3b4-4123-a4b5-c6d7e8f9a0c2",
  "d0e1f2a3-b4c5-4123-a4b5-c6d7e8f9a0b2",
  "d0e1f2a3-b4c5-4123-a4b5-c6d7e8f9a0c3",
  "d2842a84-3e66-43ee-ac58-7e13b95b01e8",
  "d3e4f5a6-b7c8-4901-a2e3-f4a5b6c7d8e9",
  "d4e5f6a7-b8c9-4012-a3b4-c5d6e7f8a9b0",
  "daa38a5f-f1b5-4d4f-94b7-54e97fe6782e",
  "e3c1cc69-066d-4f52-beeb-b659dc7a88b9",
  "e4f5a6b7-c8d9-4012-a2b3-f4a5b6c7d8e9",
  "e4f5a6b7-c8d9-4012-a3f4-a5b6c7d8e9f0",
  "f5a6b7c8-d9e0-4123-a3b4-a5b6c7d8e9f0",
] as const;

const REPO_ROOT = join(import.meta.dirname, "../../../..");
const ENTITY_VERSION_MODEL_VERSION_DIR = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_modelVersion",
  "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
);
const ENTITY_VERSION_DATA_DIR = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data",
  "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
);
const ENTITY_VERSION_MODEL_DIR = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_model",
  "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
);
const ENTITY_MODEL_DIR = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_model",
  "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
);
const ENTITY_ENTITY_ASSET = join(ENTITY_MODEL_DIR, "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json");
const DEPLOYMENT_INDEX = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/index.ts",
);

const MIROIR = selfApplicationMiroir.uuid as string;
const LIBRARY = selfApplicationLibrary.uuid as string;

const SELF_ENTITY_VERSION_UUID = "bdd7ad43-f0fc-4716-90c1-87454c40dd95";
const COMMIT_ENTITY_UUID = "73bb0c69-e636-4e3b-a230-51f25469c089";

describe("Miroir EntityVersion asset layout", () => {
  it("EntityVersion instances live under miroir_modelVersion with a stable UUID set", () => {
    expect(existsSync(ENTITY_VERSION_MODEL_VERSION_DIR)).toBe(true);
    const onDisk = readdirSync(ENTITY_VERSION_MODEL_VERSION_DIR)
      .filter((name) => name.endsWith(".json"))
      .map((name) => name.replace(/\.json$/, ""))
      .sort();
    expect(onDisk).toEqual([...MIROIR_ENTITY_VERSION_INSTANCE_UUIDS]);
    expect(onDisk).toHaveLength(MIROIR_ENTITY_VERSION_INSTANCE_UUIDS.length);
    if (existsSync(ENTITY_VERSION_MODEL_DIR)) {
      expect(readdirSync(ENTITY_VERSION_MODEL_DIR).filter((n) => n.endsWith(".json"))).toEqual([]);
    }
    if (existsSync(ENTITY_VERSION_DATA_DIR)) {
      expect(readdirSync(ENTITY_VERSION_DATA_DIR).filter((n) => n.endsWith(".json"))).toEqual([]);
    }
  });

  it("self-describing EntityVersion-of-EntityVersion is in the inventory", () => {
    expect(MIROIR_ENTITY_VERSION_INSTANCE_UUIDS).toContain(SELF_ENTITY_VERSION_UUID);
    const selfEvPath = join(
      ENTITY_VERSION_MODEL_VERSION_DIR,
      `${SELF_ENTITY_VERSION_UUID}.json`,
    );
    const selfEv = JSON.parse(readFileSync(selfEvPath, "utf8"));
    expect(selfEv.uuid).toBe(SELF_ENTITY_VERSION_UUID);
    expect(selfEv.entityUuid).toBe(entityEntityVersion.uuid);
    expect(selfEv.parentUuid).toBe(entityEntityVersion.uuid);
  });

  it("deployment index imports EntityVersion instances from miroir_modelVersion, not miroir_data", () => {
    const src = readFileSync(DEPLOYMENT_INDEX, "utf8");
    expect(src).not.toMatch(
      /from\s+"\.\/assets\/miroir_model\/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd\//,
    );
    expect(src).toMatch(
      /from\s+"\.\/assets\/miroir_modelVersion\/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd\//,
    );
    expect(src).not.toMatch(
      /from\s+"\.\/assets\/miroir_data\/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd\//,
    );
  });

  it("Report / Menu / Query entity assets remain under miroir_model", () => {
    for (const entity of [entityReport, entityMenu, entityQueryVersion] as Entity[]) {
      const path = join(ENTITY_MODEL_DIR, `${entity.uuid}.json`);
      expect(existsSync(path), path).toBe(true);
      const row = JSON.parse(readFileSync(path, "utf8"));
      expect(row.uuid).toBe(entity.uuid);
      expect(row.name).toBe(entity.name);
    }
  });
});

describe("Miroir meta-model bootstrap composition", () => {
  it("EntityVersion entity conceptLevel is Model", () => {
    expect((entityEntityVersion as Entity).conceptLevel).toBe("Model");
  });

  it("meta-model bootstrap is Entity-only (no EntityVersion)", () => {
    expect(metaMetaModelEntityUuids).toEqual([entityEntity.uuid]);
    expect(metaMetaModelEntities).toHaveLength(1);
    expect(miroirModelEntities.map((e: Entity) => e.uuid)).not.toContain(entityEntityVersion.uuid);
    expect(miroirModelEntities.map((e: Entity) => e.uuid)).toContain(entityEntity.uuid);
  });

  it("Commit is not part of the meta-meta-model", () => {
    expect(metaMetaModelEntityUuids).not.toContain(COMMIT_ENTITY_UUID);
    expect(metaMetaModelEntities.map((e: Entity) => e.uuid)).not.toContain(COMMIT_ENTITY_UUID);
  });

  it("EntityVersion resolves to the modelVersion section for Miroir and Library", () => {
    expect(getApplicationSection(MIROIR, entityEntityVersion.uuid as string)).toBe("modelVersion");
    expect(getApplicationSection(LIBRARY, entityEntityVersion.uuid as string)).toBe("modelVersion");
  });

  it("Entity present-model mlSchema lives on the Entity row; section model", () => {
    const fromExport = entityEntity as Entity;
    expect(fromExport.uuid).toBe("16dbfe28-e1d7-4f20-9ba4-c1a9873202ad");
    expect(fromExport.mlSchema).toBeDefined();
    expect(fromExport.mlSchema).toEqual(expect.objectContaining({ type: expect.any(String) }));

    const fromDisk = JSON.parse(readFileSync(ENTITY_ENTITY_ASSET, "utf8")) as Entity;
    expect(fromDisk.mlSchema).toBeDefined();
    expect(fromDisk.uuid).toBe(fromExport.uuid);

    expect(getApplicationSection(MIROIR, entityEntity.uuid as string)).toBe("model");
  });

  it("present-model paths do not require EntityVersion in model fetch", () => {
    // Miroir bootstrap model set has Entity but not EntityVersion — live schema uses Entity.
    expect(miroirModelEntities.some((e: Entity) => e.uuid === entityEntity.uuid)).toBe(true);
    expect(miroirModelEntities.some((e: Entity) => e.uuid === entityEntityVersion.uuid)).toBe(
      false,
    );
    expect((entityEntity as Entity).mlSchema).toBeDefined();
  });
});
