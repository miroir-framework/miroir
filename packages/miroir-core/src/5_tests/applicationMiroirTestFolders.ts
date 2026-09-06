/**
 * Application asset folders that store MiroirTest / Runner instances.
 * Miroir app: data section. Other apps: model section (same pattern as Report / Query).
 *
 * Live CLI discovery scans each `miroir-test-app_deployment-<app>` package
 * under `assets/<section>/<entityUuid>`.
 * The array below is the last hardcoded snapshot.
 */

import type { Runner } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

export const ENTITY_MIROIR_TEST_UUID = "a311f363-e238-4203-bdfc-29e8c160c26b";
export const ENTITY_RUNNER_UUID = "e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd";

export const DEPLOYMENT_PACKAGE_PREFIX = "miroir-test-app_deployment-";

export type ApplicationMiroirTestSourceFolder = {
  applicationKey: string;
  /** Path relative to the monorepo root. */
  relativePath: string;
};

/**
 * @deprecated Last hardcoded snapshot. CLI uses `discoverApplicationMiroirTestSourceFolders()`.
 */
export const APPLICATION_MIROIR_TEST_SOURCE_FOLDERS_LEGACY: readonly ApplicationMiroirTestSourceFolder[] =
  [
    {
      applicationKey: "miroir",
      relativePath: `packages/miroir-test-app_deployment-miroir/assets/miroir_data/${ENTITY_MIROIR_TEST_UUID}`,
    },
    {
      applicationKey: "library",
      relativePath: `packages/miroir-test-app_deployment-library/assets/library_model/${ENTITY_MIROIR_TEST_UUID}`,
    },
  ];

/** @deprecated Alias of {@link APPLICATION_MIROIR_TEST_SOURCE_FOLDERS_LEGACY}. */
export const APPLICATION_MIROIR_TEST_SOURCE_FOLDERS =
  APPLICATION_MIROIR_TEST_SOURCE_FOLDERS_LEGACY;

/** Sibling Runner entity folder for a MiroirTest source folder (same store section). */
export function runnerEntityFolderRelativePath(miroirTestFolderRelativePath: string): string {
  const parts = miroirTestFolderRelativePath.replace(/\\/g, "/").split("/");
  parts[parts.length - 1] = ENTITY_RUNNER_UUID;
  return parts.join("/");
}

export function isRunnerInstance(value: unknown): value is Runner {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    record.parentUuid === ENTITY_RUNNER_UUID &&
    typeof record.uuid === "string" &&
    record.uuid.length > 0 &&
    typeof record.name === "string" &&
    record.definition !== null &&
    typeof record.definition === "object"
  );
}

export function buildRunnerUuidIndex(runners: Runner[]): Record<string, Runner> {
  return Object.fromEntries(runners.map((runner) => [runner.uuid, runner]));
}
