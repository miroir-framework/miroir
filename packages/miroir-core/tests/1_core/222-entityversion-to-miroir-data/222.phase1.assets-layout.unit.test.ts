/**
 * #222 Phase 1.2 — Miroir EntityVersion instances live under miroir_data.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { entityEntityDefinition } from "miroir-test-app_deployment-miroir";
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
const DEPLOYMENT_INDEX = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/index.ts",
);
const SELF_EV = "bdd7ad43-f0fc-4716-90c1-87454c40dd95";
const SANDBOX_BUNDLED = join(
  REPO_ROOT,
  "packages/miroir-sandbox/src/bundledData.ts",
);

describe("222 Phase 1 — assets layout", () => {
  it("EntityVersion instances live under miroir_data with Slice 0 UUID set", () => {
    expect(existsSync(EV_DATA_DIR)).toBe(true);
    const onDisk = readdirSync(EV_DATA_DIR)
      .filter((name) => name.endsWith(".json"))
      .map((name) => name.replace(/\.json$/, ""))
      .sort();
    expect(onDisk).toEqual([...MIROIR_ENTITY_VERSION_INSTANCE_UUIDS_SLICE0]);
  });

  it("miroir_model/54b9c72f has no EntityVersion instance files", () => {
    if (!existsSync(EV_MODEL_DIR)) {
      expect(existsSync(EV_MODEL_DIR)).toBe(false);
      return;
    }
    const instanceFiles = readdirSync(EV_MODEL_DIR).filter((name) => name.endsWith(".json"));
    expect(instanceFiles).toEqual([]);
  });

  it("deployment index imports EV instances from miroir_data, not miroir_model/54b9c72f", () => {
    const src = readFileSync(DEPLOYMENT_INDEX, "utf8");
    expect(src).not.toMatch(
      /from\s+"\.\/assets\/miroir_model\/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd\//,
    );
    expect(src).toMatch(
      /from\s+"\.\/assets\/miroir_data\/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd\//,
    );
  });

  it("self-EV and Entity EntityVersion still export with mlSchema", () => {
    const selfPath = join(EV_DATA_DIR, `${SELF_EV}.json`);
    const selfEv = JSON.parse(readFileSync(selfPath, "utf8"));
    expect(selfEv.uuid).toBe(SELF_EV);
    expect(selfEv.mlSchema).toBeDefined();
    expect((entityEntityDefinition as Entity).mlSchema).toBeDefined();
  });

  it("Miroir bundled model parent UUIDs exclude EntityVersion", () => {
    const src = readFileSync(SANDBOX_BUNDLED, "utf8");
    // MIROIR_MODEL_PARENT_UUIDS must include Entity, must not include EntityVersion parent
    expect(src).toMatch(/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/);
    const miroirBlock = src.slice(
      src.indexOf("MIROIR_MODEL_PARENT_UUIDS"),
      src.indexOf("ADMIN_MODEL_PARENT_UUIDS_ARRAY"),
    );
    expect(miroirBlock).not.toContain("54b9c72f-d4f3-4db9-9e0e-0dc840b530bd");
    // Admin still keeps EntityVersion in model parents
    const adminBlock = src.slice(src.indexOf("ADMIN_MODEL_PARENT_UUIDS_ARRAY"));
    expect(adminBlock).toContain("54b9c72f-d4f3-4db9-9e0e-0dc840b530bd");
  });
});
