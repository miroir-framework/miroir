/**
 * #234 Slice 0.1 / Slice 2 — deployment Version History inventory (post-relocation for Miroir).
 */
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { versionHistoryEntityUuids } from "../../../../src/1_core/Model.js";
import {
  DEPLOYMENT_INVENTORY_MD,
  DEPLOYMENT_PACKAGE_GLOB,
  DEPLOYMENT_PACKAGE_NAMES,
  MIROIR_VERSION_HISTORY_PARENTS_SLICE0,
  REPO_ROOT,
} from "./versioningModes.234.slice0-inventory.js";

type VersionHistoryFolderHit = {
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

function scanVersionHistoryFoldersInSection(
  sectionPath: string,
  packageName: string,
  sectionName: string,
): VersionHistoryFolderHit[] {
  if (!existsSync(sectionPath) || !statSync(sectionPath).isDirectory()) return [];
  const hits: VersionHistoryFolderHit[] = [];
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

function scanPackage(packageName: string): VersionHistoryFolderHit[] {
  const assetsRoot = join(REPO_ROOT, "packages", packageName, "assets");
  if (!existsSync(assetsRoot)) return [];
  const hits: VersionHistoryFolderHit[] = [];
  for (const sectionName of readdirSync(assetsRoot)) {
    const sectionPath = join(assetsRoot, sectionName);
    if (!statSync(sectionPath).isDirectory()) continue;
    if (sectionName.endsWith("_modelVersion") || sectionName === "deployment") continue;
    if (!sectionName.endsWith("_model") && !sectionName.endsWith("_data")) continue;
    hits.push(...scanVersionHistoryFoldersInSection(sectionPath, packageName, sectionName));
  }
  return hits;
}

describe("234 Slice 0.1 — deployment Version History inventory", () => {
  it("versionHistoryEntityUuids registry is non-empty", () => {
    expect(versionHistoryEntityUuids.size).toBeGreaterThanOrEqual(17);
  });

  it("Miroir deployment package has assets/miroir_modelVersion/ after Slice 2", () => {
    const miroirModelVersion = join(
      REPO_ROOT,
      "packages/miroir-test-app_deployment-miroir/assets/miroir_modelVersion",
    );
    expect(existsSync(miroirModelVersion)).toBe(true);
    for (const packageName of listDeploymentPackages()) {
      if (packageName === "miroir-test-app_deployment-miroir") continue;
      const assetsRoot = join(REPO_ROOT, "packages", packageName, "assets");
      if (!existsSync(assetsRoot)) continue;
      const modelVersionDirs = readdirSync(assetsRoot).filter((name) => name.endsWith("_modelVersion"));
      expect(modelVersionDirs, packageName).toEqual([]);
    }
  });

  it("Miroir Version History instance JSON lives under miroir_modelVersion/ (Slice 2 layout)", () => {
    const miroirModelVersion = join(
      REPO_ROOT,
      "packages/miroir-test-app_deployment-miroir/assets/miroir_modelVersion",
    );
    for (const [parentUuid, expectedCount] of Object.entries(MIROIR_VERSION_HISTORY_PARENTS_SLICE0)) {
      const dir = join(miroirModelVersion, parentUuid);
      expect(existsSync(dir), parentUuid).toBe(true);
      expect(countJsonFiles(dir), parentUuid).toBe(expectedCount);
    }
  });

  it("records Version History folders under model/data across all deployment packages", () => {
    const allHits: VersionHistoryFolderHit[] = [];
    for (const packageName of listDeploymentPackages()) {
      allHits.push(...scanPackage(packageName));
    }

    const miroirHits = allHits.filter((h) => h.packageName === "miroir-test-app_deployment-miroir");
    expect(miroirHits.length).toBe(0);

    const byKey = Object.fromEntries(
      allHits.map((h) => [`${h.packageName}:${h.sectionDir}:${h.parentUuid}`, h.fileCount]),
    );
    expect(byKey).toMatchObject({
      "miroir-test-app_deployment-admin:admin_model:54b9c72f-d4f3-4db9-9e0e-0dc840b530bd": 8,
      "miroir-test-app_deployment-library:library_model:54b9c72f-d4f3-4db9-9e0e-0dc840b530bd": 6,
    });
  });

  it("5.2 — deployment-inventory.md exists and lists all five deployment packages", () => {
    const inventoryPath = join(REPO_ROOT, DEPLOYMENT_INVENTORY_MD);
    expect(existsSync(inventoryPath)).toBe(true);
    const content = readFileSync(inventoryPath, "utf8");
    for (const packageName of DEPLOYMENT_PACKAGE_NAMES) {
      expect(content, packageName).toContain(packageName);
    }
  });
});
