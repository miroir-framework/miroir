import type {
  MiroirTestDefinition,
  MiroirTestSuite,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { ENTITY_MIROIR_TEST_UUID } from "./applicationMiroirTestFolders.js";
import {
  classifyMiroirTestSuiteExecutionCapabilities,
  inferIntegrationSessionKind,
  walkMiroirTestLeaves,
} from "./inferIntegrationSessionKind.js";

export type UiIntegrationRunnerSuiteKind = "runnerTest" | "domainControllerTest" | "actionTest";

export type ApplicationMiroirTestCliLaunchKind =
  | "unit"
  | "runner-integration"
  | "transformer-integration"
  | "mixed-unit-transformer";

export type ApplicationMiroirTestCatalogEntry = {
  suiteKey: string;
  instance: MiroirTestDefinition;
  suiteDefinition: MiroirTestSuite;
  cliLaunchKind: ApplicationMiroirTestCliLaunchKind;
  uiRunnerKind?: UiIntegrationRunnerSuiteKind;
};

export function suiteKeyFromMiroirTestInstance(instance: MiroirTestDefinition): string {
  const name = instance.name?.trim();
  if (name) {
    return name;
  }
  const definition = instance.definition as MiroirTestSuite | undefined;
  return definition?.miroirTestLabel?.trim() || instance.uuid;
}

export function isMiroirTestSuiteInstance(value: unknown): value is MiroirTestDefinition {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (record.parentUuid !== ENTITY_MIROIR_TEST_UUID) {
    return false;
  }
  const definition = record.definition as Record<string, unknown> | undefined;
  return definition?.miroirTestType === "miroirTestSuite";
}

export function inferUiIntegrationRunnerSuiteKind(
  suite: MiroirTestSuite,
  suiteKey?: string,
): UiIntegrationRunnerSuiteKind | undefined {
  const sessionKind = inferIntegrationSessionKind(suite);
  if (sessionKind === "runner") {
    return "runnerTest";
  }
  if (sessionKind === "action") {
    if (suiteKey?.startsWith("domain_controller_")) {
      return "domainControllerTest";
    }
    return "actionTest";
  }
  return undefined;
}

export function isUiIntegrationLaunchableSuite(suite: MiroirTestSuite): boolean {
  return inferIntegrationSessionKind(suite) !== undefined;
}

export function classifyApplicationMiroirTestCliLaunchKind(
  suite: MiroirTestSuite,
): ApplicationMiroirTestCliLaunchKind | undefined {
  const capabilities = classifyMiroirTestSuiteExecutionCapabilities(suite);
  const sessionKind = capabilities.integrationSessionKind;

  if (capabilities.hasUnitLeaves && sessionKind === "transformer") {
    return "mixed-unit-transformer";
  }
  if (sessionKind === "runner" || sessionKind === "action") {
    return "runner-integration";
  }
  if (sessionKind === "transformer") {
    return "transformer-integration";
  }
  if (capabilities.hasUnitLeaves || walkMiroirTestLeaves(suite).length > 0) {
    return "unit";
  }
  return undefined;
}

/**
 * Resolve a CLI `--suites` token to a catalog key.
 * Accepts instance `name`, suite `miroirTestLabel`, and legacy registry prefixes
 * (`menu` → `menu_build`, `jzodTypeCheck` → `jzodTypeCheck_TransformerTestSuite`).
 */
export function resolveApplicationMiroirTestSuiteKey(
  catalog: ApplicationMiroirTestCatalogEntry[],
  rawKey: string,
): string | undefined {
  const exact = catalog.find((entry) => entry.suiteKey === rawKey);
  if (exact) {
    return exact.suiteKey;
  }
  const byLabel = catalog.find((entry) => entry.suiteDefinition.miroirTestLabel === rawKey);
  if (byLabel) {
    return byLabel.suiteKey;
  }
  const prefixMatches = catalog.filter(
    (entry) => entry.suiteKey.startsWith(`${rawKey}_`) || entry.suiteKey.startsWith(rawKey),
  );
  if (prefixMatches.length === 1) {
    return prefixMatches[0].suiteKey;
  }
  return undefined;
}

export function resolveApplicationMiroirTestSuiteKeys(
  catalog: ApplicationMiroirTestCatalogEntry[],
  rawKeys: string[],
): string[] {
  return rawKeys.map((rawKey) => {
    const resolved = resolveApplicationMiroirTestSuiteKey(catalog, rawKey);
    if (!resolved) {
      throw new Error(
        `Unknown MiroirTest suite key "${rawKey}". Available: ${catalog
          .map((entry) => entry.suiteKey)
          .join(", ")}`,
      );
    }
    return resolved;
  });
}

/** Load a suite definition from the shared application catalog (CLI and tests). */
export function loadMiroirTestSuiteFromCatalog(
  catalog: ApplicationMiroirTestCatalogEntry[],
  suiteKey: string,
): MiroirTestSuite {
  const resolved = resolveApplicationMiroirTestSuiteKey(catalog, suiteKey) ?? suiteKey;
  const entry = catalog.find((item) => item.suiteKey === resolved);
  if (!entry) {
    throw new Error(
      `Unknown MiroirTest suite key "${suiteKey}". Available: ${catalog
        .map((item) => item.suiteKey)
        .join(", ")}`,
    );
  }
  return entry.suiteDefinition;
}

export function catalogEntryFromMiroirTest(
  instance: MiroirTestDefinition,
): ApplicationMiroirTestCatalogEntry | undefined {
  if (!isMiroirTestSuiteInstance(instance)) {
    return undefined;
  }
  const suiteDefinition = instance.definition as MiroirTestSuite;
  const cliLaunchKind = classifyApplicationMiroirTestCliLaunchKind(suiteDefinition);
  if (cliLaunchKind === undefined) {
    return undefined;
  }
  const suiteKey = suiteKeyFromMiroirTestInstance(instance);
  return {
    suiteKey,
    instance,
    suiteDefinition,
    cliLaunchKind,
    uiRunnerKind: inferUiIntegrationRunnerSuiteKind(suiteDefinition, suiteKey),
  };
}

export function buildApplicationMiroirTestCatalog(
  instances: MiroirTestDefinition[],
): ApplicationMiroirTestCatalogEntry[] {
  const byKey = new Map<string, ApplicationMiroirTestCatalogEntry>();
  for (const instance of instances) {
    const entry = catalogEntryFromMiroirTest(instance);
    if (!entry) {
      continue;
    }
    byKey.set(entry.suiteKey, entry);
  }
  return [...byKey.values()].sort((a, b) => a.suiteKey.localeCompare(b.suiteKey));
}

export function indexApplicationMiroirTestsByKey(
  catalog: ApplicationMiroirTestCatalogEntry[],
): Record<string, ApplicationMiroirTestCatalogEntry> {
  return Object.fromEntries(catalog.map((entry) => [entry.suiteKey, entry]));
}

function keysForKinds(
  catalog: ApplicationMiroirTestCatalogEntry[],
  kinds: readonly ApplicationMiroirTestCliLaunchKind[],
): string[] {
  const kindSet = new Set(kinds);
  return catalog
    .filter((entry) => kindSet.has(entry.cliLaunchKind))
    .map((entry) => entry.suiteKey)
    .sort();
}

/** Unit-capable suites for `testMiroir --mode unit` (includes mixed transformer suites). */
export function listCliUnitSuiteKeys(catalog: ApplicationMiroirTestCatalogEntry[]): string[] {
  return keysForKinds(catalog, ["unit", "mixed-unit-transformer"]);
}

/** Runner / action integration suites for `miroir-runner-tests.integ`. */
export function listCliRunnerIntegrationSuiteKeys(
  catalog: ApplicationMiroirTestCatalogEntry[],
): string[] {
  return keysForKinds(catalog, ["runner-integration"]);
}

/** Transformer integration suites (including mixed unit+integ). */
export function listCliTransformerIntegrationSuiteKeys(
  catalog: ApplicationMiroirTestCatalogEntry[],
): string[] {
  return keysForKinds(catalog, ["transformer-integration", "mixed-unit-transformer"]);
}

export type UiIntegrationRunnerSuiteRegistryMap = Record<
  string,
  { kind: UiIntegrationRunnerSuiteKind; suiteDefinition: MiroirTestSuite }
>;

export type UiIntegrationTransformerSuiteRegistryMap = Record<
  string,
  { suiteDefinition: MiroirTestSuite }
>;

export function buildUiIntegrationRunnerSuiteRegistryFromCatalog(
  catalog: ApplicationMiroirTestCatalogEntry[],
): UiIntegrationRunnerSuiteRegistryMap {
  const result: UiIntegrationRunnerSuiteRegistryMap = {};
  for (const entry of catalog) {
    if (entry.uiRunnerKind === undefined) {
      continue;
    }
    result[entry.suiteKey] = {
      kind: entry.uiRunnerKind,
      suiteDefinition: entry.suiteDefinition,
    };
  }
  return result;
}

export function buildUiIntegrationTransformerSuiteRegistryFromCatalog(
  catalog: ApplicationMiroirTestCatalogEntry[],
): UiIntegrationTransformerSuiteRegistryMap {
  const result: UiIntegrationTransformerSuiteRegistryMap = {};
  for (const entry of catalog) {
    if (
      entry.cliLaunchKind !== "transformer-integration" &&
      entry.cliLaunchKind !== "mixed-unit-transformer"
    ) {
      continue;
    }
    result[entry.suiteKey] = { suiteDefinition: entry.suiteDefinition };
  }
  return result;
}

export function buildUiIntegrationSuiteRegistriesFromMiroirTests(
  instances: MiroirTestDefinition[],
): {
  runner: UiIntegrationRunnerSuiteRegistryMap;
  transformer: UiIntegrationTransformerSuiteRegistryMap;
} {
  const catalog = buildApplicationMiroirTestCatalog(instances);
  return {
    runner: buildUiIntegrationRunnerSuiteRegistryFromCatalog(catalog),
    transformer: buildUiIntegrationTransformerSuiteRegistryFromCatalog(catalog),
  };
}
