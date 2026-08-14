import { cpSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const PACKAGE_MODEL_VERSION_REL =
  "miroir-test-app_deployment-miroir/assets/miroir_modelVersion";
const TMP_MODEL_VERSION_REL = "miroir-standalone-app/tests/tmp/miroir_modelVersion";

/**
 * Copy git-tracked Miroir Version History assets into the emulated-server tmp store.
 * Integration tests must never point modelVersion at package assets: resetModel clears
 * the whole section recursively (see PersistenceStoreController.clear).
 */
export function seedMiroirModelVersionTmpFromPackageAssets(
  packagesRootDirectory: string,
): string {
  const sourceDir = join(packagesRootDirectory, PACKAGE_MODEL_VERSION_REL);
  const targetDir = join(packagesRootDirectory, TMP_MODEL_VERSION_REL);

  if (!existsSync(sourceDir)) {
    throw new Error(
      `seedMiroirModelVersionTmpFromPackageAssets: source missing: ${sourceDir}`,
    );
  }

  if (existsSync(targetDir)) {
    rmSync(targetDir, { recursive: true, force: true });
  }

  cpSync(sourceDir, targetDir, { recursive: true });
  return targetDir;
}
