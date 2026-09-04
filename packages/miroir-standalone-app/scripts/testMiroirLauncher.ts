import {
  miroirTestCliConfigToEnv,
  miroirCoreTestVitestEntry,
  MIROIR_RUNNER_TEST_VITEST_ENTRY,
  parseMiroirRunnerTestCliConfig,
  parseMiroirTestCliArgs,
  parseProfileArg,
  resolveMiroirTestCliConfigFromPartial,
  splitSuiteKeys,
} from "miroir-core";
import {
  listCliRunnerIntegrationSuiteKeysFromFolders,
  listCliTransformerIntegrationSuiteKeysFromFolders,
  listCliUnitSuiteKeysFromFolders,
  loadApplicationMiroirTestCatalog,
  resolveCliSuiteKeysFromCatalog,
} from "miroir-core/src/5_tests/loadApplicationMiroirTestsFromFolders.js";

import { applyIntegrationTestProfile } from "../tests/helpers/integrationTestProfiles.js";

function resolveRequestedSuiteKeys(
  env: NodeJS.ProcessEnv,
  argv: string[],
): string[] {
  const fromArgs = parseMiroirTestCliArgs(argv, { integModeAlias: true });
  return fromArgs.suiteKeys ?? splitSuiteKeys(env.MIROIR_TEST_SUITES ?? env.MIROIR_TEST_SUITE);
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
  const resolvedRequestedKeys =
    requestedSuiteKeys.length > 0 && !requestedSuiteKeys.includes("*")
      ? resolveCliSuiteKeysFromCatalog(requestedSuiteKeys, [...coreKeys, ...runnerKeys], catalog)
      : requestedSuiteKeys;

  if (
    resolvedRequestedKeys.length > 0 &&
    !resolvedRequestedKeys.includes("*") &&
    resolvedRequestedKeys.every((key) => coreKeys.has(key))
  ) {
    const coreConfig = resolveMiroirTestCliConfigFromPartial(
      env,
      parseMiroirTestCliArgs(argv, { integModeAlias: true }),
      unitKeys,
    );
    const resolvedCoreConfig = {
      ...coreConfig,
      suiteKeys: resolveCliSuiteKeysFromCatalog(coreConfig.suiteKeys, unitKeys, catalog),
    };
    if (resolvedCoreConfig.executionMode !== "integration") {
      throw new Error(
        "miroir-core integration suites require MIROIR_TEST_MODE=integ (or integration)",
      );
    }
    return {
      vitestEntry: miroirCoreTestVitestEntry(resolvedCoreConfig.executionMode),
      spawnEnv: { ...env, ...miroirTestCliConfigToEnv(resolvedCoreConfig) },
    };
  }

  const runnerConfig = parseMiroirRunnerTestCliConfig(env, argv, runnerKeys);
  const resolvedRunnerConfig = {
    ...runnerConfig,
    suiteKeys: resolveCliSuiteKeysFromCatalog(runnerConfig.suiteKeys, runnerKeys, catalog),
  };
  return {
    vitestEntry: MIROIR_RUNNER_TEST_VITEST_ENTRY,
    spawnEnv: { ...env, ...miroirTestCliConfigToEnv(resolvedRunnerConfig) },
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
