/**
 * Node-only: load MiroirTest instances from application asset folders.
 * Import via `miroir-core/model-validation-fs` — do not add to the browser entry.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import type {
  MiroirTestDefinition,
  MiroirTestSuite,
  Runner,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  buildApplicationMiroirTestCatalog,
  listCliRunnerIntegrationSuiteKeys,
  listCliTransformerIntegrationSuiteKeys,
  listCliUnitSuiteKeys,
  loadMiroirTestSuiteFromCatalog,
  resolveApplicationMiroirTestSuiteKeys,
  type ApplicationMiroirTestCatalogEntry,
  isMiroirTestSuiteInstance,
} from "./applicationMiroirTestCatalog.js";
import { ALL_SUITES_JOKER, resolveSuiteKeys } from "./parseMiroirTestCliConfig.js";
import {
  APPLICATION_MIROIR_TEST_SOURCE_FOLDERS_LEGACY,
  DEPLOYMENT_PACKAGE_PREFIX,
  ENTITY_MIROIR_TEST_UUID,
  buildRunnerUuidIndex,
  isRunnerInstance,
  runnerEntityFolderRelativePath,
  type ApplicationMiroirTestSourceFolder,
} from "./applicationMiroirTestFolders.js";

export function resolveMonorepoRoot(startDir: string = process.cwd()): string {
  let dir = resolve(startDir);
  for (let i = 0; i < 12; i++) {
    if (
      existsSync(
        join(dir, "packages", "miroir-test-app_deployment-miroir", "package.json"),
      )
    ) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  throw new Error(`Could not resolve Miroir monorepo root from "${startDir}"`);
}

/**
 * Find MiroirTest entity folders under each `miroir-test-app_deployment-<app>`
 * package `assets` store section. Adding a deployment package with that folder
 * is enough — no hardcoded app list.
 */
export function discoverApplicationMiroirTestSourceFolders(
  repoRoot: string = resolveMonorepoRoot(),
): ApplicationMiroirTestSourceFolder[] {
  const packagesDir = join(repoRoot, "packages");
  if (!existsSync(packagesDir)) {
    return [];
  }
  const found: ApplicationMiroirTestSourceFolder[] = [];
  for (const entry of readdirSync(packagesDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith(DEPLOYMENT_PACKAGE_PREFIX)) {
      continue;
    }
    const applicationKey = entry.name.slice(DEPLOYMENT_PACKAGE_PREFIX.length);
    const assetsDir = join(packagesDir, entry.name, "assets");
    if (!existsSync(assetsDir)) {
      continue;
    }
    for (const store of readdirSync(assetsDir, { withFileTypes: true })) {
      if (!store.isDirectory()) {
        continue;
      }
      const testDir = join(assetsDir, store.name, ENTITY_MIROIR_TEST_UUID);
      if (!existsSync(testDir)) {
        continue;
      }
      found.push({
        applicationKey,
        relativePath: relative(repoRoot, testDir).replace(/\\/g, "/"),
      });
    }
  }
  return found.sort(
    (a, b) =>
      a.applicationKey.localeCompare(b.applicationKey) ||
      a.relativePath.localeCompare(b.relativePath),
  );
}

export function resolveApplicationMiroirTestSourceFolders(
  repoRoot: string = resolveMonorepoRoot(),
): readonly ApplicationMiroirTestSourceFolder[] {
  const discovered = discoverApplicationMiroirTestSourceFolders(repoRoot);
  return discovered.length > 0 ? discovered : APPLICATION_MIROIR_TEST_SOURCE_FOLDERS_LEGACY;
}

function loadJsonFilesFromFolder(dir: string): unknown[] {
  if (!existsSync(dir)) {
    return [];
  }
  const values: unknown[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }
    values.push(JSON.parse(readFileSync(join(dir, entry.name), "utf8")) as unknown);
  }
  return values;
}

export function loadApplicationMiroirTestsFromFolders(
  repoRoot: string = resolveMonorepoRoot(),
): MiroirTestDefinition[] {
  const instances: MiroirTestDefinition[] = [];
  for (const folder of resolveApplicationMiroirTestSourceFolders(repoRoot)) {
    for (const parsed of loadJsonFilesFromFolder(join(repoRoot, folder.relativePath))) {
      if (isMiroirTestSuiteInstance(parsed)) {
        instances.push(parsed);
      }
    }
  }
  return instances;
}

/** Runner uuid → instance, from sibling Runner folders of the discovered MiroirTest apps. */
export function loadApplicationRunnerUuidIndexFromFolders(
  repoRoot: string = resolveMonorepoRoot(),
): Record<string, Runner> {
  const runners: Runner[] = [];
  for (const folder of resolveApplicationMiroirTestSourceFolders(repoRoot)) {
    const runnerDir = join(repoRoot, runnerEntityFolderRelativePath(folder.relativePath));
    for (const parsed of loadJsonFilesFromFolder(runnerDir)) {
      if (isRunnerInstance(parsed)) {
        runners.push(parsed);
      }
    }
  }
  return buildRunnerUuidIndex(runners);
}

export function loadApplicationMiroirTestCatalog(
  repoRoot: string = resolveMonorepoRoot(),
): ApplicationMiroirTestCatalogEntry[] {
  return buildApplicationMiroirTestCatalog(loadApplicationMiroirTestsFromFolders(repoRoot));
}

export function listCliUnitSuiteKeysFromFolders(
  repoRoot: string = resolveMonorepoRoot(),
): string[] {
  return listCliUnitSuiteKeys(loadApplicationMiroirTestCatalog(repoRoot));
}

export function listCliRunnerIntegrationSuiteKeysFromFolders(
  repoRoot: string = resolveMonorepoRoot(),
): string[] {
  return listCliRunnerIntegrationSuiteKeys(loadApplicationMiroirTestCatalog(repoRoot));
}

export function listCliTransformerIntegrationSuiteKeysFromFolders(
  repoRoot: string = resolveMonorepoRoot(),
): string[] {
  return listCliTransformerIntegrationSuiteKeys(loadApplicationMiroirTestCatalog(repoRoot));
}

/**
 * Expand `*` / empty to every key in `availableKeys`, then resolve suite keys
 * (instance `name` or `uuid`) against the folder catalog.
 */
export function resolveCliSuiteKeysFromCatalog(
  rawKeys: string[],
  availableKeys: string[],
  catalog: ApplicationMiroirTestCatalogEntry[] = loadApplicationMiroirTestCatalog(),
): string[] {
  const selected = resolveSuiteKeys(rawKeys, availableKeys);
  if (rawKeys.length === 0 || rawKeys.includes(ALL_SUITES_JOKER)) {
    return selected;
  }
  return resolveApplicationMiroirTestSuiteKeys(catalog, selected);
}

/** Node CLI / test loader: read the suite from application folders, not named exports. */
export function loadMiroirCoreTestSuiteFromFolders(
  suiteKey: string,
  repoRoot: string = resolveMonorepoRoot(),
): MiroirTestSuite {
  return loadMiroirTestSuiteFromCatalog(loadApplicationMiroirTestCatalog(repoRoot), suiteKey);
}
