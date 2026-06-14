import { expect } from "vitest";
import * as vitest from "vitest";

import {
  ConfigurationService,
  parseMiroirTestCliConfig,
  runMiroirCoreTestsFromCLI,
} from "miroir-core";
import {
  PostgresIntegrationAdapter,
  resolveDefaultAdminAssetsRoot,
  resolveDefaultFilesystemDeploymentRoot,
} from "./helpers/PostgresIntegrationAdapter.js";

ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

// Admin deployment (filesystem) and Postgres test schema are configured independently:
//   MIROIR_TEST_ADMIN_ASSETS_ROOT  — admin/, admin_model/, admin_data/ base dir (default: tests/assets)
//   MIROIR_TEST_FILESYSTEM_ROOT    — package root for relative store paths (default: miroir-standalone-app)
//   MIROIR_TEST_POSTGRES_HOST      — Postgres host for testApplication schema (default: 192.168.1.160)
const config = parseMiroirTestCliConfig(process.env, process.argv.slice(2));
const postgresHostName = process.env.MIROIR_TEST_POSTGRES_HOST ?? "192.168.1.160";
const filesystemDeploymentRootDirectory =
  process.env.MIROIR_TEST_FILESYSTEM_ROOT ?? resolveDefaultFilesystemDeploymentRoot();
const adminAssetsRootDirectory =
  process.env.MIROIR_TEST_ADMIN_ASSETS_ROOT ?? resolveDefaultAdminAssetsRoot();

if (config.suiteKeys.length > 0) {
  const testSession = new PostgresIntegrationAdapter({
    postgresHostName,
    adminAssetsRootDirectory,
    filesystemDeploymentRootDirectory,
  });
  const executionEnvironment = await testSession.initSession();
  await runMiroirCoreTestsFromCLI(vitest, config, {
    executionEnvironment,
    testSession,
  });
}
