import type { MiroirTestCliConfig } from "./parseMiroirTestCliConfig.js";
import {
  parseMiroirTestCliArgs,
  resolveMiroirTestCliConfigFromPartial,
} from "./parseMiroirTestCliConfig.js";

export const MIROIR_RUNNER_TEST_VITEST_ENTRY = "miroir-runner-tests.integ.test" as const;

/** Registry keys for runner / action MiroirTest suites (not `Object.keys` on suite JSON). */
export const MIROIR_RUNNER_TEST_SUITE_REGISTRY_NAMES = [
  "runner_library",
  "runner_create_entity",
  "runner_drop_entity",
  "domain_controller_data_crud",
  "domain_controller_model_crud",
  "domain_controller_composite_pk_crud",
  "domain_controller_non_uuid_pk_model_crud",
  "domain_controller_non_uuid_pk_data_crud",
  "domain_controller_no_parent_uuid_crud",
  "domain_controller_model_undo_redo",
  "evolutionTraceWP1",
] as const;

function listRunnerTestSuiteKeys(): string[] {
  return [...MIROIR_RUNNER_TEST_SUITE_REGISTRY_NAMES];
}

// ################################################################################################
export function parseMiroirRunnerTestCliConfig(
  env: NodeJS.ProcessEnv,
  argv: string[],
): MiroirTestCliConfig {
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
