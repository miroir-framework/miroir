/**
 * #234 Slice 0.1 — deployment VH inventory characterization (current wrong state).
 */
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { versionHistoryEntityUuids } from "../../src/1_core/Model.js";
import {
  DEPLOYMENT_PACKAGE_GLOB,
  MIROIR_VH_DATA_PARENTS_SLICE0,
  REPO_ROOT,
} from "./versioningModes.234.slice0-inventory.js";

type VhFolderHit = {
  packageName: string;
  sectionDir: string;
  parentUuid: string;
  fileCount: number;
};

function listDeploymentPackages(): string[] {
  return readdirSync(join(REPO_ROOT, "packages"))
    .filter((name) => name.startsWith(DEPLOYMENT_PACKAGE_GLOB))
    .sort();
}

function countJsonFiles(dir: string): number {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((name) => name.endsWith(".json")).length;
}

function scanVhFoldersInSection(sectionPath: string, packageName: string, sectionName: string): VhFolderHit[] {
  if (!existsSync(sectionPath) || !statSync(sectionPath).isDirectory()) return [];
  const hits: VhFolderHit[] = [];
  for (const entry of readdirSync(sectionPath)) {
    const entryPath = join(sectionPath, entry);
    if (!statSync(entryPath).isDirectory()) continue;
    if (!versionHistoryEntityUuids.has(entry)) continue;
    const fileCount = countJsonFiles(entryPath);
    if (fileCount > 0) {
      hits.push({ packageName, sectionDir: sectionName, parentUuid: entry, fileCount });
    }
  }
  return hits;
}

function scanPackage(packageName: string): VhFolderHit[] {
  const assetsRoot = join(REPO_ROOT, "packages", packageName, "assets");
  if (!existsSync(assetsRoot)) return [];
  const hits: VhFolderHit[] = [];
  for (const sectionName of readdirSync(assetsRoot)) {
    const sectionPath = join(assetsRoot, sectionName);
    if (!statSync(sectionPath).isDirectory()) continue;
    if (sectionName.endsWith("_modelVersion") || sectionName === "deployment") continue;
    if (!sectionName.endsWith("_model") && !sectionName.endsWith("_data")) continue;
    hits.push(...scanVhFoldersInSection(sectionPath, packageName, sectionName));
  }
  return hits;
}

describe("234 Slice 0.1 — deployment VH inventory", () => {
  it("versionHistoryEntityUuids registry is non-empty", () => {
    expect(versionHistoryEntityUuids.size).toBeGreaterThanOrEqual(17);
  });

  it("no deployment package has assets/*_modelVersion/ yet", () => {
    for (const packageName of listDeploymentPackages()) {
      const assetsRoot = join(REPO_ROOT, "packages", packageName, "assets");
      if (!existsSync(assetsRoot)) continue;
      const modelVersionDirs = readdirSync(assetsRoot).filter((name) => name.endsWith("_modelVersion"));
      expect(modelVersionDirs, packageName).toEqual([]);
    }
  });

  it("Miroir package still has VH instance JSON under miroir_data/ (pre-Slice-2 baseline)", () => {
    const miroirData = join(
      REPO_ROOT,
      "packages/miroir-test-app_deployment-miroir/assets/miroir_data",
    );
    for (const [parentUuid, expectedCount] of Object.entries(MIROIR_VH_DATA_PARENTS_SLICE0)) {
      const dir = join(miroirData, parentUuid);
      expect(existsSync(dir), parentUuid).toBe(true);
      expect(countJsonFiles(dir), parentUuid).toBe(expectedCount);
    }
  });

  it("records VH folders under model/data across all deployment packages", () => {
    const allHits: VhFolderHit[] = [];
    for (const packageName of listDeploymentPackages()) {
      allHits.push(...scanPackage(packageName));
    }

    const miroirHits = allHits.filter((h) => h.packageName === "miroir-test-app_deployment-miroir");
    expect(miroirHits.length).toBeGreaterThan(0);
    expect(miroirHits.every((h) => h.sectionDir === "miroir_data")).toBe(true);

    const byKey = Object.fromEntries(
      allHits.map((h) => [`${h.packageName}:${h.sectionDir}:${h.parentUuid}`, h.fileCount]),
    );
    expect(byKey).toMatchObject({
      "miroir-test-app_deployment-miroir:miroir_data:54b9c72f-d4f3-4db9-9e0e-0dc840b530bd": 34,
      "miroir-test-app_deployment-miroir:miroir_data:c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24": 2,
      "miroir-test-app_deployment-admin:admin_model:54b9c72f-d4f3-4db9-9e0e-0dc840b530bd": 8,
      "miroir-test-app_deployment-library:library_model:54b9c72f-d4f3-4db9-9e0e-0dc840b530bd": 6,
    });
  });
});
