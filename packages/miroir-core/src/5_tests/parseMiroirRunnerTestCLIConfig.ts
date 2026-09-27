import type { MiroirTestCliConfig } from "./parseMiroirTestCliConfig.js";
import {
  parseMiroirTestCliArgs,
  resolveMiroirTestCliConfigFromPartial,
} from "./parseMiroirTestCliConfig.js";

export const MIROIR_RUNNER_TEST_VITEST_ENTRY = "miroir-runner-tests.integ.test" as const;

/**
 * @deprecated Use `listCliRunnerIntegrationSuiteKeys(loadApplicationMiroirTestCatalog())`.
 * Last hardcoded snapshot of runner / action suite keys.
 */
export const MIROIR_RUNNER_TEST_SUITE_REGISTRY_NAMES = [
  "runner.lendDocument",
  "runner.returnDocument",
  "runner.createEntity",
  "runner.dropEntity",
  "action.domainController.dataCrud",
  "action.domainController.modelCrud",
  "action.domainController.dataCrud.compositePk",
  "action.domainController.modelCrud.nonUuidPk",
  "action.domainController.dataCrud.nonUuidPk",
  "action.domainController.dataCrud.noParentUuid",
  "action.domainController.modelUndoRedo",
  "action.domainController.freezeApplicationVersion",
  "action.scenario.evolutionTrace",
  "runner.freezeApplicationVersion",
  "runner.mcp.getInstances",
  "runner.mcp.lendDocument",
] as const;

function listRunnerTestSuiteKeys(): string[] {
  return [...MIROIR_RUNNER_TEST_SUITE_REGISTRY_NAMES];
}

// ################################################################################################
export function parseMiroirRunnerTestCliConfig(
  env: NodeJS.ProcessEnv,
  argv: string[],
  allSuiteKeys: string[] = listRunnerTestSuiteKeys(),
): MiroirTestCliConfig {
  const config = resolveMiroirTestCliConfigFromPartial(
    env,
    parseMiroirTestCliArgs(argv, { integModeAlias: true }),
    allSuiteKeys,
  );

  if (config.executionMode !== "integration") {
    throw new Error("miroir-standalone-app runner tests require --mode integ");
  }

  return config;
}
