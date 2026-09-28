import { cpSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";

import { resolveRepoRoot } from "./integrationTestProfiles.js";

const PACKAGE_MODEL_VERSION_REL =
  "packages/miroir-app-miroir/assets/miroir_modelVersion";

/**
 * Copy git-tracked Miroir Version History assets into the test store's modelVersion section
 * (`modelVersionDirectory`, relative to `filesystemRootDirectory`).
 * Integration tests must never point modelVersion at package assets: resetModel clears
 * the whole section recursively (see PersistenceStoreController.clear).
 */
export function seedMiroirModelVersionFromPackageAssets(
  filesystemRootDirectory: string,
  modelVersionDirectory: string,
): string {
  const sourceDir = join(resolveRepoRoot(), PACKAGE_MODEL_VERSION_REL);
  const targetDir = join(filesystemRootDirectory, modelVersionDirectory);

  if (!existsSync(sourceDir)) {
    throw new Error(
      `seedMiroirModelVersionFromPackageAssets: source missing: ${sourceDir}`,
    );
  }

  if (existsSync(targetDir)) {
    rmSync(targetDir, { recursive: true, force: true });
  }

  cpSync(sourceDir, targetDir, { recursive: true });
  return targetDir;
}
