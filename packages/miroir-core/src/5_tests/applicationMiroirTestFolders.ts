/**
 * Central list of application folders that store MiroirTest instances.
 * Miroir app: data section. Other apps: model section (same pattern as Report / Query).
 *
 * CLI discovery reads these folders. Adding a JSON file under a listed folder
 * is enough for the suite to appear in CLI catalogs — no hardcoded suite-key list.
 */

export const ENTITY_MIROIR_TEST_UUID = "a311f363-e238-4203-bdfc-29e8c160c26b";

export type ApplicationMiroirTestSourceFolder = {
  applicationKey: string;
  /** Path relative to the monorepo root. */
  relativePath: string;
};

export const APPLICATION_MIROIR_TEST_SOURCE_FOLDERS: readonly ApplicationMiroirTestSourceFolder[] =
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
