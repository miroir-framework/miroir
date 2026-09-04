/**
 * Node-only: load MiroirTest instances from application asset folders.
 * Import via `miroir-core/model-validation-fs` — do not add to the browser entry.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import type {
  MiroirTestDefinition,
  MiroirTestSuite,
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
import { APPLICATION_MIROIR_TEST_SOURCE_FOLDERS } from "./applicationMiroirTestFolders.js";

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

export function loadApplicationMiroirTestsFromFolders(
  repoRoot: string = resolveMonorepoRoot(),
): MiroirTestDefinition[] {
  const instances: MiroirTestDefinition[] = [];
  for (const folder of APPLICATION_MIROIR_TEST_SOURCE_FOLDERS) {
    const dir = join(repoRoot, folder.relativePath);
    if (!existsSync(dir)) {
      continue;
    }
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) {
        continue;
      }
      const parsed = JSON.parse(readFileSync(join(dir, entry.name), "utf8")) as unknown;
      if (isMiroirTestSuiteInstance(parsed)) {
        instances.push(parsed);
      }
    }
  }
  return instances;
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
 * Expand `*` / empty to every key in `availableKeys`, then resolve legacy aliases
 * (`menu` → `menu_build`) against the folder catalog.
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
