import {
  miroirTestCliConfigToEnv,
  miroirCoreTestVitestEntry,
  MIROIR_RUNNER_TEST_VITEST_ENTRY,
  parseMiroirRunnerTestCliConfig,
  parseMiroirTestCliArgs,
  parseProfileArg,
  resolveMiroirTestCliConfigFromPartial,
  splitSuiteKeys,
  splitTags,
} from "miroir-core";
import {
  listCliRunnerIntegrationSuiteKeysFromFolders,
  listCliTransformerIntegrationSuiteKeysFromFolders,
  listCliUnitSuiteKeysFromFolders,
  loadApplicationMiroirTestCatalog,
  resolveCliSuiteKeysFromCatalog,
} from "miroir-core/src/5_tests/loadApplicationMiroirTestsFromFolders.js";

import { applyIntegrationTestProfile } from "../tests/helpers/integrationTestProfiles.js";

const ALL_SUITES_JOKER = "*";

function resolveRequestedSuiteKeys(
  env: NodeJS.ProcessEnv,
  argv: string[],
): string[] {
  const fromArgs = parseMiroirTestCliArgs(argv, { integModeAlias: true });
  return fromArgs.suiteKeys ?? splitSuiteKeys(env.MIROIR_TEST_SUITES ?? env.MIROIR_TEST_SUITE);
}

function resolveRequestedTags(env: NodeJS.ProcessEnv, argv: string[]): string[] | undefined {
  return parseMiroirTestCliArgs(argv, { integModeAlias: true }).tags ?? splitTags(env.MIROIR_TEST_TAGS);
}

export function resolveVitestEntry(
  env: NodeJS.ProcessEnv,
  argv: string[],
): { vitestEntry: string; spawnEnv: NodeJS.ProcessEnv } {
  const catalog = loadApplicationMiroirTestCatalog();
  const unitKeys = listCliUnitSuiteKeysFromFolders();
  const transformerIntegKeys = listCliTransformerIntegrationSuiteKeysFromFolders();
  const runnerKeys = listCliRunnerIntegrationSuiteKeysFromFolders();
  const coreKeys = new Set([...unitKeys, ...transformerIntegKeys]);

  const requestedSuiteKeys = resolveRequestedSuiteKeys(env, argv);
  const requestedTags = resolveRequestedTags(env, argv);
  const explicitRequest =
    requestedSuiteKeys.length > 0 && !requestedSuiteKeys.includes(ALL_SUITES_JOKER);
  // #312: tags pick among the suites this launcher can run (integration-capable ones),
  // before routing, so the chosen entry gets an explicit suite list.
  const selectedSuiteKeys = requestedTags?.length
    ? resolveCliSuiteKeysFromCatalog(
        requestedSuiteKeys,
        [...transformerIntegKeys, ...runnerKeys],
        catalog,
        requestedTags,
      )
    : explicitRequest
      ? resolveCliSuiteKeysFromCatalog(requestedSuiteKeys, [...coreKeys, ...runnerKeys], catalog)
      : requestedSuiteKeys;

  if (requestedTags?.length) {
    const selectedCoreKeys = selectedSuiteKeys.filter((key) => coreKeys.has(key));
    const selectedRunnerKeys = selectedSuiteKeys.filter((key) => !coreKeys.has(key));
    if (selectedCoreKeys.length > 0 && selectedRunnerKeys.length > 0) {
      throw new Error(
        `--tags ${requestedTags.join(",")} selects both core suites (${selectedCoreKeys.join(", ")}) and runner suites (${selectedRunnerKeys.join(", ")}); they run in different entries: narrow the tags or add --suites`,
      );
    }
  }

  if (
    selectedSuiteKeys.length > 0 &&
    !selectedSuiteKeys.includes(ALL_SUITES_JOKER) &&
    selectedSuiteKeys.every((key) => coreKeys.has(key))
  ) {
    const coreConfig = resolveMiroirTestCliConfigFromPartial(
      env,
      parseMiroirTestCliArgs(argv, { integModeAlias: true }),
      unitKeys,
    );
    if (coreConfig.executionMode !== "integration") {
      throw new Error(
        "miroir-core integration suites require MIROIR_TEST_MODE=integ (or integration)",
      );
    }
    const resolvedCoreConfig = { ...coreConfig, suiteKeys: selectedSuiteKeys };
    return {
      vitestEntry: miroirCoreTestVitestEntry(resolvedCoreConfig.executionMode),
      spawnEnv: {
        ...env,
        ...miroirTestCliConfigToEnv(resolvedCoreConfig),
        MIROIR_AUTH_ENABLED: env.MIROIR_AUTH_ENABLED ?? "0",
      },
    };
  }

  const runnerConfig = parseMiroirRunnerTestCliConfig(env, argv, runnerKeys);
  const resolvedRunnerConfig = {
    ...runnerConfig,
    suiteKeys: requestedTags?.length
      ? selectedSuiteKeys
      : resolveCliSuiteKeysFromCatalog(runnerConfig.suiteKeys, runnerKeys, catalog),
  };
  return {
    vitestEntry: MIROIR_RUNNER_TEST_VITEST_ENTRY,
    spawnEnv: {
      ...env,
      ...miroirTestCliConfigToEnv(resolvedRunnerConfig),
      MIROIR_AUTH_ENABLED: env.MIROIR_AUTH_ENABLED ?? "0",
    },
  };
}

/** Apply `--profile` to process.env, then resolve vitest entry + spawn env (Gap D1). */
export function prepareTestMiroirLaunch(
  env: NodeJS.ProcessEnv,
  argv: string[],
): { vitestEntry: string; spawnEnv: NodeJS.ProcessEnv } {
  applyIntegrationTestProfile(parseProfileArg(argv));
  return resolveVitestEntry(env, argv);
}
