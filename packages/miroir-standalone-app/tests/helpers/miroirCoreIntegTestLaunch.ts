import fs from "node:fs";
import path from "node:path";

import {
  listMiroirTestSuiteKeys,
  parseMiroirTestCliArgs,
  type MiroirTestCliConfig,
} from "miroir-core";

import type { TestSessionForIntegOptions } from "./TestSessionForInteg.js";

const VALID_APP_STORE_TYPES = ["sql", "filesystem", "indexedDb", "mongodb"] as const;
const VALID_ADMIN_STORE_TYPES = ["filesystem", "sql", "indexedDb", "mongodb", "bundled"] as const;

export type MiroirCoreIntegTestLaunchContext = {
  env: NodeJS.ProcessEnv;
  argv: string[];
  config: MiroirTestCliConfig;
  testSessionOptions: TestSessionForIntegOptions;
};

export function formatMiroirCoreIntegTestUsage(): string {
  return [
    "Usage: MIROIR_TEST_SUITES=<suite>[,<suite>...] MIROIR_TEST_MODE=integ npm run testMiroir -w miroir-standalone-app",
    "   or: npm run testMiroir -w miroir-standalone-app -- --suites <suite> --mode integ",
    "",
    "Required when running suites:",
    "  MIROIR_TEST_MODE=integ|integration     Integration mode (unit is invalid for this entry)",
    "  MIROIR_TEST_SUITES=<keys>              Comma-separated suite keys, or * for all",
    "",
    "Store backends (independent):",
    "  MIROIR_TEST_APP_STORE_TYPE             sql | filesystem | indexedDb | mongodb  (default: sql)",
    "  MIROIR_TEST_ADMIN_STORE_TYPE           filesystem | sql | indexedDb | mongodb | bundled  (default: filesystem)",
    "",
    "When MIROIR_TEST_APP_STORE_TYPE=sql or MIROIR_TEST_ADMIN_STORE_TYPE=sql:",
    "  MIROIR_TEST_POSTGRES_HOST              Postgres host (default: 192.168.1.160)",
    "  MIROIR_TEST_ADMIN_SQL_SCHEMA           Admin schema when admin is sql (default: miroirAdmin)",
    "",
    "When either store uses mongodb:",
    "  MIROIR_TEST_MONGODB_CONNECTION_STRING  e.g. mongodb://localhost:27017",
    "  MIROIR_TEST_APP_MONGODB_DATABASE       Test app database (default: testApplication)",
    "  MIROIR_TEST_ADMIN_MONGODB_DATABASE     Admin database (default: miroirAdmin)",
    "",
    "When MIROIR_TEST_ADMIN_STORE_TYPE=filesystem:",
    "  MIROIR_TEST_FILESYSTEM_ROOT            Package root for relative paths",
    "  MIROIR_TEST_ADMIN_ASSETS_ROOT          Base dir with admin/, admin_model/, admin_data/",
    "",
    "When MIROIR_TEST_APP_STORE_TYPE=filesystem:",
    "  MIROIR_TEST_APP_FILESYSTEM_ROOT        Writable app root (default: tests/tmp/testApplication)",
    "",
    "When MIROIR_TEST_APP_STORE_TYPE=indexedDb:",
    "  MIROIR_TEST_APP_INDEXEDDB_NAME         IndexedDB name prefix (default: testApplication)",
    "",
    "When MIROIR_TEST_ADMIN_STORE_TYPE=indexedDb:",
    "  MIROIR_TEST_ADMIN_INDEXEDDB_NAME     IndexedDB name prefix (default: miroirAdmin)",
    "",
    "When MIROIR_TEST_ADMIN_STORE_TYPE=bundled:",
    "  (programmatic) bundledDeploymentData   Required on TestSessionForInteg options; not settable via env alone",
    "",
    "Optional:",
    "  MIROIR_TEST_FILTER='{\"suite\":[\"label\"]}'   JSON filter passed to runMiroirCoreTestsFromCLI",
    "",
    "Example (default: sql test app + filesystem admin):",
    "  MIROIR_TEST_SUITES=miroirCoreTransformers MIROIR_TEST_MODE=integ \\",
    "    MIROIR_TEST_POSTGRES_HOST=192.168.1.160 npm run testMiroir -w miroir-standalone-app",
  ].join("\n");
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

  const knownSuiteKeys = new Set(listMiroirTestSuiteKeys());
  const unknownSuiteKeys = config.suiteKeys.filter((key) => !knownSuiteKeys.has(key));
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
  if (usesMongodb && !env.MIROIR_TEST_MONGODB_CONNECTION_STRING?.trim()) {
    errors.push(
      "MIROIR_TEST_MONGODB_CONNECTION_STRING is required when app or admin store type is mongodb",
    );
  }

  if (testSessionOptions.adminStore.emulatedServerType === "bundled") {
    const bundledData = testSessionOptions.bundledDeploymentData;
    if (!bundledData || Object.keys(bundledData).length === 0) {
      errors.push(
        "MIROIR_TEST_ADMIN_STORE_TYPE=bundled requires bundledDeploymentData on TestSessionForInteg (not available via env alone)",
      );
    }
  }

  if (testSessionOptions.adminStore.emulatedServerType === "filesystem") {
    const adminRoot = testSessionOptions.adminStore.adminAssetsRootDirectory;
    for (const subdir of ["admin", "admin_model", "admin_data"]) {
      const target = path.join(adminRoot, subdir);
      if (!fs.existsSync(target)) {
        errors.push(`Admin assets directory missing: ${target}`);
      }
    }
  }

  if (testSessionOptions.testApplicationStore.emulatedServerType === "filesystem") {
    const appRoot = testSessionOptions.testApplicationStore.applicationRootDirectory;
    const parentDir = path.dirname(appRoot);
    if (!fs.existsSync(parentDir)) {
      errors.push(`Parent directory for test app filesystem root does not exist: ${parentDir}`);
    }
  }

  if (config.filter) {
    const filterSuiteKeys = Object.keys(config.filter);
    const unknownFilterKeys = filterSuiteKeys.filter((key) => !config.suiteKeys.includes(key));
    if (unknownFilterKeys.length > 0) {
      errors.push(
        `MIROIR_TEST_FILTER references suite(s) not in the current run: ${unknownFilterKeys.join(", ")}`,
      );
    }
  }

  return errors;
}

export function formatMiroirCoreIntegTestLaunchFailure(errors: string[]): string {
  return [
    formatMiroirCoreIntegTestUsage(),
    "",
    "Configuration error(s):",
    ...errors.map((error) => `  - ${error}`),
  ].join("\n");
}

export function assertMiroirCoreIntegTestLaunchReady(context: MiroirCoreIntegTestLaunchContext): void {
  const errors = validateMiroirCoreIntegTestLaunch(context);
  if (errors.length > 0) {
    throw new Error(formatMiroirCoreIntegTestLaunchFailure(errors));
  }
}
