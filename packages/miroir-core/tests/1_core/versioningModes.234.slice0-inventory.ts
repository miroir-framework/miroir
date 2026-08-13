/**
 * #234 Slice 0 — shared Version History asset inventory constants (not a test file).
 */
import { join } from "node:path";

export const REPO_ROOT = join(import.meta.dirname, "../../../..");

/** Deployment packages under packages/miroir-test-app_deployment-* */
export const DEPLOYMENT_PACKAGE_GLOB = "miroir-test-app_deployment-";

/** Miroir Version History parent folders under assets/miroir_modelVersion/ (Slice 2 layout). */
export const MIROIR_VERSION_HISTORY_PARENTS_SLICE0: Readonly<Record<string, number>> = {
  "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd": 34,
  "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24": 2,
  "8bec933d-6287-4de7-8a88-5c24216de9f4": 7,
};

export const MIROIR_ENTITY_VERSION_METACLASS_PATH =
  "packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json";

export const MIROIR_DEPLOYMENT_INDEX =
  "packages/miroir-test-app_deployment-miroir/index.ts";

export const MIROIR_MODEL_VERSION_ASSETS_DIR =
  "packages/miroir-test-app_deployment-miroir/assets/miroir_modelVersion";

/** Relative to `filesystemDeploymentRootDirectory` (monorepo `packages/`). */
export const MIROIR_MODEL_VERSION_PACKAGES_RELATIVE =
  "miroir-test-app_deployment-miroir/assets/miroir_modelVersion";
