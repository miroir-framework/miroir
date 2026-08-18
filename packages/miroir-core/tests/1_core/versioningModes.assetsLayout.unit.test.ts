/**
 * Miroir Version History assets live in miroir_modelVersion/ and are exposed for store bootstrap.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { entityEntityVersion } from "miroir-test-app_deployment-miroir";
import type { Entity } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { versionHistoryEntityUuids } from "../../src/1_core/Model.js";
import {
  MIROIR_DEPLOYMENT_INDEX,
  MIROIR_ENTITY_VERSION_METACLASS_PATH,
  MIROIR_MODEL_VERSION_ASSETS_DIR,
  MIROIR_MODEL_VERSION_PACKAGES_RELATIVE,
  MIROIR_VERSION_HISTORY_PARENTS,
  REPO_ROOT,
} from "./versioningModes.testData.js";

const MIROIR_DATA = join(REPO_ROOT, "packages/miroir-test-app_deployment-miroir/assets/miroir_data");
const MIROIR_MODEL_VERSION = join(REPO_ROOT, MIROIR_MODEL_VERSION_ASSETS_DIR);
const ENTITY_VERSION_METACLASS = join(REPO_ROOT, MIROIR_ENTITY_VERSION_METACLASS_PATH);
const DEPLOYMENT_INDEX = join(REPO_ROOT, MIROIR_DEPLOYMENT_INDEX);

function countJsonInDir(dir: string): number {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((name) => name.endsWith(".json")).length;
}

describe("Miroir modelVersion assets layout", () => {
  it("assets/miroir_modelVersion/ exists with expected Version History parent folder counts", () => {
    expect(existsSync(MIROIR_MODEL_VERSION)).toBe(true);
    for (const [parentUuid, expectedCount] of Object.entries(MIROIR_VERSION_HISTORY_PARENTS)) {
      const dir = join(MIROIR_MODEL_VERSION, parentUuid);
      expect(existsSync(dir), parentUuid).toBe(true);
      expect(countJsonInDir(dir), parentUuid).toBe(expectedCount);
    }
  });

  it("no Version History instance JSON remains under miroir_data/ for versionHistoryEntityUuids parents", () => {
    if (!existsSync(MIROIR_DATA)) return;
    for (const entry of readdirSync(MIROIR_DATA)) {
      if (!versionHistoryEntityUuids.has(entry)) continue;
      const dir = join(MIROIR_DATA, entry);
      const jsonCount = countJsonInDir(dir);
      expect(jsonCount, `miroir_data/${entry}`).toBe(0);
    }
  });

  it("EntityVersion metaclass Entity row remains under miroir_model/", () => {
    expect(existsSync(ENTITY_VERSION_METACLASS)).toBe(true);
    const row = JSON.parse(readFileSync(ENTITY_VERSION_METACLASS, "utf8"));
    expect(row.uuid).toBe("54b9c72f-d4f3-4db9-9e0e-0dc840b530bd");
    expect(row.scope).toBe("versioning");
    expect((entityEntityVersion as Entity).mlSchema).toBeDefined();
  });

  it("deployment index imports Version History instances from miroir_modelVersion/, not miroir_data/", () => {
    const src = readFileSync(DEPLOYMENT_INDEX, "utf8");
    expect(src).toMatch(/from\s+"\.\/assets\/miroir_modelVersion\//);
    expect(src).not.toMatch(
      /from\s+"\.\/assets\/miroir_data\/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd\//,
    );
    expect(src).not.toMatch(
      /from\s+"\.\/assets\/miroir_data\/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24\//,
    );
    expect(src).not.toMatch(
      /from\s+"\.\/assets\/miroir_data\/8bec933d-6287-4de7-8a88-5c24216de9f4\//,
    );
  });

  it("filesystem bootstrap can resolve modelVersion path relative to packages root", () => {
    const assetsDir = join(REPO_ROOT, "packages", MIROIR_MODEL_VERSION_PACKAGES_RELATIVE);
    expect(existsSync(assetsDir)).toBe(true);
    expect(countJsonInDir(join(assetsDir, "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd"))).toBe(34);
  });
});
