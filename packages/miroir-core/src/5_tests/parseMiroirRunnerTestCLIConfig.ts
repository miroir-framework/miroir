import type { MiroirTestCliConfig } from "./parseMiroirTestCliConfig.js";
import {
  parseMiroirTestCliArgs,
  parseProfileArg,
  resolveMiroirTestCliConfigFromPartial,
} from "./parseMiroirTestCliConfig.js";
import { applyRunnerTestProfile } from "./runnerTestProfiles.js";

export const MIROIR_RUNNER_TEST_VITEST_ENTRY = "miroir-runner-tests.integ.test" as const;

/** Registry keys for runner MiroirTest suites (not `Object.keys` on suite JSON). */
export const MIROIR_RUNNER_TEST_SUITE_REGISTRY_NAMES = ["runner_library"] as const;

function listRunnerTestSuiteKeys(): string[] {
  return [...MIROIR_RUNNER_TEST_SUITE_REGISTRY_NAMES];
}

// ################################################################################################
export function parseMiroirRunnerTestCliConfig(
  env: NodeJS.ProcessEnv,
  argv: string[],
): MiroirTestCliConfig {
  applyRunnerTestProfile(parseProfileArg(argv));

  const config = resolveMiroirTestCliConfigFromPartial(
    env,
    parseMiroirTestCliArgs(argv, { integModeAlias: true }),
    listRunnerTestSuiteKeys(),
  );

  if (config.executionMode !== "integration") {
    throw new Error("miroir-standalone-app runner tests require --mode integ");
  }

  return config;
}
