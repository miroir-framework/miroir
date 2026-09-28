/**
 * Node-only: load MiroirTest instances from application asset folders.
 * Import via `miroir-core/model-validation-fs` — do not add to the browser entry.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import type {
  Entity,
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
  assertAllowedMiroirTestTags,
  getMiroirTestAllowedTags,
  miroirTestInstanceHasAnyTag,
} from "./miroirTestTags.js";
import {
  APPLICATION_MIROIR_TEST_SOURCE_FOLDERS_LEGACY,
  deploymentPackageApplicationKey,
  ENTITY_MIROIR_TEST_UUID,
  MIROIR_TEST_ENTITY_RELATIVE_PATH,
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
        join(dir, "packages", "miroir-app-miroir", "package.json"),
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
 * Find MiroirTest entity folders under each application package's
 * `assets` store section (`DEPLOYMENT_PACKAGE_PREFIXES`). Adding a deployment package with that folder
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
    const applicationKey = entry.isDirectory() ? deploymentPackageApplicationKey(entry.name) : undefined;
    if (!applicationKey) {
      continue;
    }
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

/** The live MiroirTest Entity row, whose `tags` schema declares the tag vocabulary (#312). */
export function loadMiroirTestEntityFromFolders(repoRoot: string = resolveMonorepoRoot()): Entity {
  return JSON.parse(
    readFileSync(join(repoRoot, MIROIR_TEST_ENTITY_RELATIVE_PATH), "utf-8"),
  ) as Entity;
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
 * (instance `name` or `uuid`) against the folder catalog. With `tags` (#312),
 * keep only the suites carrying any of them; an unknown tag (per the MiroirTest
 * Entity) or a selection left empty is an error.
 */
export function resolveCliSuiteKeysFromCatalog(
  rawKeys: string[],
  availableKeys: string[],
  catalog: ApplicationMiroirTestCatalogEntry[] = loadApplicationMiroirTestCatalog(),
  tags?: string[],
): string[] {
  const selected = resolveSuiteKeys(rawKeys, availableKeys);
  const resolved =
    rawKeys.length === 0 || rawKeys.includes(ALL_SUITES_JOKER)
      ? selected
      : resolveApplicationMiroirTestSuiteKeys(catalog, selected);
  if (!tags?.length) {
    return resolved;
  }
  assertAllowedMiroirTestTags(tags, getMiroirTestAllowedTags(loadMiroirTestEntityFromFolders()));
  const catalogByKey = new Map(catalog.map((entry) => [entry.suiteKey, entry]));
  const tagged = resolved.filter((suiteKey) => {
    const entry = catalogByKey.get(suiteKey);
    return entry !== undefined && miroirTestInstanceHasAnyTag(entry.instance, tags);
  });
  if (tagged.length === 0) {
    throw new Error(
      `No suite carries any of the tags ${tags.join(", ")} among the ${resolved.length} suites available here`,
    );
  }
  return tagged;
}

/** Node CLI / test loader: read the suite from application folders, not named exports. */
export function loadMiroirCoreTestSuiteFromFolders(
  suiteKey: string,
  repoRoot: string = resolveMonorepoRoot(),
): MiroirTestSuite {
  return loadMiroirTestSuiteFromCatalog(loadApplicationMiroirTestCatalog(repoRoot), suiteKey);
}
