import {
  miroirTestCliConfigToEnv,
  miroirCoreTestVitestEntry,
  MIROIR_RUNNER_TEST_VITEST_ENTRY,
  MIROIR_RUNNER_TEST_SUITE_REGISTRY_NAMES,
  parseMiroirRunnerTestCliConfig,
  parseMiroirTestCliArgs,
  parseProfileArg,
  resolveMiroirTestCliConfigFromPartial,
  splitSuiteKeys,
  listMiroirTestSuiteKeys,
} from "miroir-core";

import { applyIntegrationTestProfile } from "../tests/helpers/integrationTestProfiles.js";

function listRunnerTestSuiteKeys(): string[] {
  return [...MIROIR_RUNNER_TEST_SUITE_REGISTRY_NAMES];
}

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
  const requestedSuiteKeys = resolveRequestedSuiteKeys(env, argv);
  const coreKeys = new Set(listMiroirTestSuiteKeys());

  if (
    requestedSuiteKeys.length > 0 &&
    !requestedSuiteKeys.includes("*") &&
    requestedSuiteKeys.every((key) => coreKeys.has(key))
  ) {
    const coreConfig = resolveMiroirTestCliConfigFromPartial(
      env,
      parseMiroirTestCliArgs(argv, { integModeAlias: true }),
      listMiroirTestSuiteKeys(),
    );
    if (coreConfig.executionMode !== "integration") {
      throw new Error(
        "miroir-core integration suites require MIROIR_TEST_MODE=integ (or integration)",
      );
    }
    return {
      vitestEntry: miroirCoreTestVitestEntry(coreConfig.executionMode),
      spawnEnv: { ...env, ...miroirTestCliConfigToEnv(coreConfig) },
    };
  }

  const runnerConfig = parseMiroirRunnerTestCliConfig(env, argv);
  return {
    vitestEntry: MIROIR_RUNNER_TEST_VITEST_ENTRY,
    spawnEnv: { ...env, ...miroirTestCliConfigToEnv(runnerConfig) },
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
