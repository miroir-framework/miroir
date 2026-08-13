/**
 * #234 Slice 3.1 — deployment package exposes modelVersion assets for store bootstrap.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  MIROIR_DEPLOYMENT_INDEX,
  MIROIR_MODEL_VERSION_ASSETS_DIR,
  MIROIR_MODEL_VERSION_PACKAGES_RELATIVE,
  MIROIR_VERSION_HISTORY_PARENTS_SLICE0,
  REPO_ROOT,
} from "./versioningModes.234.slice0-inventory.js";

function countJsonInDir(dir: string): number {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((name) => name.endsWith(".json")).length;
}

describe("234 Slice 3.1 — deployment modelVersion assets discoverability", () => {
  it("miroir_modelVersion asset tree exists with Slice 2 inventory counts", () => {
    const assetsDir = join(REPO_ROOT, MIROIR_MODEL_VERSION_ASSETS_DIR);
    expect(existsSync(assetsDir)).toBe(true);
    for (const [parentUuid, expectedCount] of Object.entries(MIROIR_VERSION_HISTORY_PARENTS_SLICE0)) {
      const dir = join(assetsDir, parentUuid);
      expect(existsSync(dir), parentUuid).toBe(true);
      expect(countJsonInDir(dir), parentUuid).toBe(expectedCount);
    }
  });

  it("deployment index imports Version History JSON from miroir_modelVersion/", () => {
    const src = readFileSync(join(REPO_ROOT, MIROIR_DEPLOYMENT_INDEX), "utf8");
    expect(src).toContain("./assets/miroir_modelVersion/");
    expect(src).not.toMatch(
      /from\s+"\.\/assets\/miroir_data\/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd\//,
    );
  });

  it("filesystem bootstrap can resolve modelVersion path relative to packages root", () => {
    const assetsDir = join(REPO_ROOT, "packages", MIROIR_MODEL_VERSION_PACKAGES_RELATIVE);
    expect(existsSync(assetsDir)).toBe(true);
    expect(countJsonInDir(join(assetsDir, "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd"))).toBe(34);
  });
});
