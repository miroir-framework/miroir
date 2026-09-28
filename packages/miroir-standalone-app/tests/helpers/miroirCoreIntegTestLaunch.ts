import fs from "node:fs";
import path from "node:path";

import {
  listMiroirTestSuiteKeys,
  parseMiroirTestCliArgs,
  resolveApplicationMiroirTestSuiteKey,
  type MiroirTestCliConfig,
} from "miroir-core";
import {
  listCliTransformerIntegrationSuiteKeysFromFolders,
  listCliUnitSuiteKeysFromFolders,
  loadApplicationMiroirTestCatalog,
} from "miroir-core/src/5_tests/loadApplicationMiroirTestsFromFolders.js";

import type { TestSessionForIntegOptions } from "./IntegrationTestSession.js";
import { resolveDefaultFilesystemDeploymentRoot } from "./IntegrationTestSession.js";
import { listIntegrationTestProfileNames } from "./integrationTestProfiles.js";

const VALID_APP_STORE_TYPES = ["sql", "filesystem", "indexedDb", "mongodb"] as const;
const VALID_ADMIN_STORE_TYPES = ["filesystem", "sql", "indexedDb", "mongodb", "bundled"] as const;
const DEFAULT_PROFILE_KEY = "emulatedServer-sql";

export type MiroirCoreIntegTestLaunchContext = {
  env: NodeJS.ProcessEnv;
  argv: string[];
  config: MiroirTestCliConfig;
  testSessionOptions: TestSessionForIntegOptions;
};

function resolveTestAppFilesystemParentDir(
  testSessionOptions: TestSessionForIntegOptions,
): string | undefined {
  if (testSessionOptions.testApplicationStore.emulatedServerType !== "filesystem") {
    return undefined;
  }
  const filesystemRoot =
    testSessionOptions.filesystemDeploymentRootDirectory ??
    resolveDefaultFilesystemDeploymentRoot();
  const appRoot = path.isAbsolute(testSessionOptions.testApplicationStore.applicationRootDirectory)
    ? testSessionOptions.testApplicationStore.applicationRootDirectory
    : path.join(filesystemRoot, testSessionOptions.testApplicationStore.applicationRootDirectory);
  return path.dirname(appRoot);
}

/**
 * #318: create the parent of the filesystem test-app root when absent. The default root
 * (`.miroir/<environment>/testApplication`) is gitignored, so a fresh checkout does not have it
 * and the launch validation would reject an otherwise valid filesystem run.
 */
export function prepareMiroirCoreIntegTestLaunchDirectories(
  testSessionOptions: TestSessionForIntegOptions,
): void {
  const parentDir = resolveTestAppFilesystemParentDir(testSessionOptions);
  if (parentDir) {
    fs.mkdirSync(parentDir, { recursive: true });
  }
}

export function formatProfileLaunchHint(): string {
  return (
    `Tip: run via testMiroir with --profile ${DEFAULT_PROFILE_KEY} to set ` +
    `VITE_MIROIR_* and MIROIR_TEST_* from one preset (profiles: ` +
    `${listIntegrationTestProfileNames().join(", ")}).`
  );
}

export function formatMiroirCoreIntegTestUsage(): string {
  return [
    "Usage: MIROIR_TEST_SUITES=<suite>[,<suite>...] MIROIR_TEST_MODE=integ npm run testMiroir -w miroir-standalone-app",
    "   or: npm run testMiroir -w miroir-standalone-app -- --suites <suite> --mode integ",
    "   or: npm run testMiroir -w miroir-standalone-app -- --profile <profile> --suites <suite> --mode integ",
    "",
    "Required when running suites:",
    "  MIROIR_TEST_MODE=integ|integration     Integration mode (unit is invalid for this entry)",
    "  MIROIR_TEST_SUITES=<keys>              Comma-separated suite keys, or * for all",
    "",
    "Profile (recommended — launcher sets VITE_MIROIR_* + MIROIR_TEST_* when unset):",
    `  --profile ${DEFAULT_PROFILE_KEY}                   Local default (admin filesystem, miroir + library Postgres)`,
    `  --profile <name>                         ${listIntegrationTestProfileNames().join(" | ")}`,
    "",
    "Test environment (#321): MIROIR_ENV=test-<store> (set by --profile; default: test-sql) gives the",
    "Admin copy and the store defaults below; a MIROIR_ENV that is not test-* is ignored.",
    "",
    "Store backends (independent; the environment supplies defaults, explicit env overrides):",
    "  MIROIR_TEST_APP_STORE_TYPE             sql | filesystem | indexedDb | mongodb  (default: the environment's Miroir store)",
    "  MIROIR_TEST_ADMIN_STORE_TYPE           filesystem | sql | indexedDb | mongodb | bundled  (default: the environment's Admin store)",
    "",
    "When MIROIR_TEST_APP_STORE_TYPE=sql or MIROIR_TEST_ADMIN_STORE_TYPE=sql:",
    "  MIROIR_TEST_POSTGRES_HOST              Postgres host (default: localhost; a profile sets it from its environment)",
    "  MIROIR_TEST_ADMIN_SQL_SCHEMA           Admin schema when admin is sql (default: miroirAdmin)",
    "",
    "When either store uses mongodb:",
    "  MIROIR_TEST_MONGODB_CONNECTION_STRING  e.g. mongodb://localhost:27017",
    "  MIROIR_TEST_APP_MONGODB_DATABASE       Test app database (default: testApplication)",
    "  MIROIR_TEST_ADMIN_MONGODB_DATABASE     Admin database (default: miroirAdmin)",
    "",
    "When MIROIR_TEST_ADMIN_STORE_TYPE=filesystem (default):",
    "  the Admin copy of the test environment, in .miroir/<environment>/admin",
    "",
    "When MIROIR_TEST_APP_STORE_TYPE=filesystem:",
    "  MIROIR_TEST_APP_FILESYSTEM_ROOT        Writable app root (default: .miroir/<environment>/testApplication)",
    "",
    "When MIROIR_TEST_APP_STORE_TYPE=indexedDb:",
    "  MIROIR_TEST_APP_INDEXEDDB_NAME         IndexedDB name prefix (default: .miroir/<environment>/testApplication/indexedDb)",
    "",
    "When MIROIR_TEST_ADMIN_STORE_TYPE=indexedDb:",
    "  MIROIR_TEST_ADMIN_INDEXEDDB_NAME     IndexedDB name prefix (default: miroirAdmin)",
    "",
    "When MIROIR_TEST_ADMIN_STORE_TYPE=bundled:",
    "  (programmatic) bundledDeploymentData   Required on IntegrationTestSession options; not settable via env alone",
    "",
    "Optional:",
    "  MIROIR_TEST_FILTER='{\"<suite name>\":[\"<leaf miroirTestLabel>\"]}'   JSON filter (see testing.md#filtering-miroirtest-cases)",
    "",
    "Example with profile (no manual MIROIR_TEST_POSTGRES_HOST):",
    `  npm run testMiroir -w miroir-standalone-app -- --profile ${DEFAULT_PROFILE_KEY} --suites tr.core --mode integ`,
    "",
    "Example (explicit env — sql test app + filesystem admin):",
    "  MIROIR_TEST_SUITES=tr.core MIROIR_TEST_MODE=integ \\",
    "    MIROIR_TEST_POSTGRES_HOST=db.example npm run testMiroir -w miroir-standalone-app",
  ].join("\n");
}

function validateCiSqlBackendConfiguration(
  env: NodeJS.ProcessEnv,
  testSessionOptions: TestSessionForIntegOptions,
): string | undefined {
  if (!env.CI) {
    return undefined;
  }

  const usesSql =
    testSessionOptions.testApplicationStore.emulatedServerType === "sql" ||
    testSessionOptions.adminStore.emulatedServerType === "sql";
  if (!usesSql) {
    return undefined;
  }

  const hasPostgresHost = Boolean(env.MIROIR_TEST_POSTGRES_HOST?.trim());
  // #321: a profile selects its test environment through MIROIR_ENV
  const hasProfileConfig = Boolean(env.MIROIR_ENV?.trim());
  if (!hasPostgresHost && !hasProfileConfig) {
    return (
      `CI requires MIROIR_TEST_POSTGRES_HOST or testMiroir --profile ${DEFAULT_PROFILE_KEY} ` +
      "when using sql store backends"
    );
  }

  return undefined;
}

export function validateMiroirCoreIntegTestLaunch(
  context: MiroirCoreIntegTestLaunchContext,
): string[] {
  const { env, argv, config, testSessionOptions } = context;
  const errors: string[] = [];

  if (config.suiteKeys.length === 0) {
    return errors;
  }

  if (config.executionMode !== "integration") {
    errors.push(
      `MIROIR_TEST_MODE must be integ or integration for miroir-core-tests.integ.test (got "${env.MIROIR_TEST_MODE ?? config.executionMode}")`,
    );
  }

  const catalog = loadApplicationMiroirTestCatalog();
  // Every suite testMiroirLauncher routes to this entry (unit and transformer integration).
  const knownSuiteKeys = new Set([
    ...listCliUnitSuiteKeysFromFolders(),
    ...listCliTransformerIntegrationSuiteKeysFromFolders(),
    ...listMiroirTestSuiteKeys(),
  ]);
  const unknownSuiteKeys = config.suiteKeys.filter((key) => {
    const resolved = resolveApplicationMiroirTestSuiteKey(catalog, key) ?? key;
    return !knownSuiteKeys.has(resolved) && !knownSuiteKeys.has(key);
  });
  if (unknownSuiteKeys.length > 0) {
    errors.push(`Unknown MIROIR_TEST_SUITES key(s): ${unknownSuiteKeys.join(", ")}`);
  }

  const cliArgs = parseMiroirTestCliArgs(argv, { integModeAlias: true });
  if (cliArgs.executionMode === "unit") {
    errors.push('CLI --mode unit is inconsistent with miroir-core-tests.integ.test (use --mode integ)');
  }

  const rawAppStoreType = env.MIROIR_TEST_APP_STORE_TYPE ?? "sql";
  if (!VALID_APP_STORE_TYPES.includes(rawAppStoreType as (typeof VALID_APP_STORE_TYPES)[number])) {
    errors.push(
      `Invalid MIROIR_TEST_APP_STORE_TYPE "${rawAppStoreType}" (expected ${VALID_APP_STORE_TYPES.join(", ")})`,
    );
  }

  const rawAdminStoreType = env.MIROIR_TEST_ADMIN_STORE_TYPE ?? "filesystem";
  if (!VALID_ADMIN_STORE_TYPES.includes(rawAdminStoreType as (typeof VALID_ADMIN_STORE_TYPES)[number])) {
    errors.push(
      `Invalid MIROIR_TEST_ADMIN_STORE_TYPE "${rawAdminStoreType}" (expected ${VALID_ADMIN_STORE_TYPES.join(", ")})`,
    );
  }

  const usesMongodb =
    testSessionOptions.testApplicationStore.emulatedServerType === "mongodb" ||
    testSessionOptions.adminStore.emulatedServerType === "mongodb";
  const mongodbConnectionStrings = [testSessionOptions.testApplicationStore, testSessionOptions.adminStore]
    .filter((store) => store.emulatedServerType === "mongodb")
    .map((store) => ("connectionString" in store ? store.connectionString : undefined));
  if (usesMongodb && mongodbConnectionStrings.some((connectionString) => !connectionString?.trim())) {
    errors.push(
      "MIROIR_TEST_MONGODB_CONNECTION_STRING is required when a mongodb store has no connection from the test environment",
    );
  }

  if (testSessionOptions.adminStore.emulatedServerType === "bundled") {
    const bundledData = testSessionOptions.bundledDeploymentData;
    if (!bundledData || Object.keys(bundledData).length === 0) {
      errors.push(
        "MIROIR_TEST_ADMIN_STORE_TYPE=bundled requires bundledDeploymentData on IntegrationTestSession (not available via env alone)",
      );
    }
  }

  if (testSessionOptions.adminStore.emulatedServerType === "filesystem") {
    const { directories, filesystemDeploymentRootDirectory } = testSessionOptions.adminStore;
    for (const directory of [directories.admin, directories.model, directories.data]) {
      const target = path.resolve(filesystemDeploymentRootDirectory, directory);
      if (!fs.existsSync(target)) {
        errors.push(`Admin store directory missing: ${target}`);
      }
    }
  }

  const parentDir = resolveTestAppFilesystemParentDir(testSessionOptions);
  if (parentDir && !fs.existsSync(parentDir)) {
    errors.push(`Parent directory for test app filesystem root does not exist: ${parentDir}`);
  }

  const ciSqlError = validateCiSqlBackendConfiguration(env, testSessionOptions);
  if (ciSqlError) {
    errors.push(ciSqlError);
  }

  return errors;
}

export function formatMiroirCoreIntegTestLaunchFailure(errors: string[]): string {
  return [
    formatMiroirCoreIntegTestUsage(),
    "",
    "Configuration error(s):",
    ...errors.map((error) => `  - ${error}`),
    "",
    formatProfileLaunchHint(),
  ].join("\n");
}

export function assertMiroirCoreIntegTestLaunchReady(context: MiroirCoreIntegTestLaunchContext): void {
  const errors = validateMiroirCoreIntegTestLaunch(context);
  if (errors.length > 0) {
    throw new Error(formatMiroirCoreIntegTestLaunchFailure(errors));
  }
}
