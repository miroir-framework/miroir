import { afterAll, beforeEach } from "vitest";

import {
  MiroirActivityTracker,
  defaultMetaModelEnvironment,
  displayMiroirTestResults,
  type MiroirTestCliConfig,
  type MiroirTestDefinition,
  type MiroirTestExecutionEnvironment,
  type MiroirTestExecutionOptions,
  type MiroirTestSuite,
  type RunMiroirTests,
  type RunnerTestSessionInterface,
  type VitestNamespace,
} from "miroir-core";
import { miroirTest_runner_library } from "miroir-test-app_deployment-library";
import {
  miroirTest_domain_controller_composite_pk_crud,
  miroirTest_domain_controller_data_crud,
  miroirTest_domain_controller_model_crud,
  miroirTest_domain_controller_model_undo_redo,
  miroirTest_domain_controller_no_parent_uuid_crud,
  miroirTest_domain_controller_non_uuid_pk_data_crud,
  miroirTest_domain_controller_non_uuid_pk_model_crud,
} from "miroir-test-app_deployment-miroir";

const SUITE_BY_KEY: Record<string, MiroirTestDefinition> = {
  runner_library: miroirTest_runner_library as MiroirTestDefinition,
  domain_controller_data_crud: miroirTest_domain_controller_data_crud as MiroirTestDefinition,
  domain_controller_model_crud: miroirTest_domain_controller_model_crud as MiroirTestDefinition,
  domain_controller_composite_pk_crud:
    miroirTest_domain_controller_composite_pk_crud as MiroirTestDefinition,
  domain_controller_non_uuid_pk_model_crud:
    miroirTest_domain_controller_non_uuid_pk_model_crud as MiroirTestDefinition,
  domain_controller_non_uuid_pk_data_crud:
    miroirTest_domain_controller_non_uuid_pk_data_crud as MiroirTestDefinition,
  domain_controller_no_parent_uuid_crud:
    miroirTest_domain_controller_no_parent_uuid_crud as MiroirTestDefinition,
  domain_controller_model_undo_redo:
    miroirTest_domain_controller_model_undo_redo as MiroirTestDefinition,
};

export function loadRunnerOrActionMiroirTestSuite(suiteKey: string): MiroirTestSuite {
  const instance = SUITE_BY_KEY[suiteKey];
  if (!instance) {
    throw new Error(
      `Unknown runner/action MiroirTest suite key "${suiteKey}". Available: ${Object.keys(SUITE_BY_KEY).join(", ")}`,
    );
  }
  return instance.definition as MiroirTestSuite;
}

// ################################################################################################
export async function runMiroirRunnerTestsFromCLI(
  runMiroirTests: RunMiroirTests,
  vitest: VitestNamespace,
  config: MiroirTestCliConfig,
  miroirActivityTracker: MiroirActivityTracker,
  testSession: RunnerTestSessionInterface,
): Promise<void> {
  const executionEnvironment: MiroirTestExecutionEnvironment = await testSession.initSession();
  const executionOptions: MiroirTestExecutionOptions = {
    executionMode: "integration",
    executionEnvironment,
  };

  const loadedSuites: { suiteKey: string; definition: MiroirTestSuite }[] = [];

  beforeEach(async () => {
    await testSession.beforeEach();
  });

  afterAll(async () => {
    await testSession.teardown();
    if (!loadedSuites.length) {
      return;
    }
    const summaryLabel = loadedSuites.map(({ suiteKey }) => suiteKey).join(", ");
    await displayMiroirTestResults(
      loadedSuites[0].definition,
      summaryLabel,
      loadedSuites[0].suiteKey,
      miroirActivityTracker,
    );
  });

  for (const suiteKey of config.suiteKeys) {
    const suiteExport = loadRunnerOrActionMiroirTestSuite(suiteKey);
    loadedSuites.push({
      suiteKey,
      definition: suiteExport,
    });
    await runMiroirTests._runMiroirTestSuite(
      vitest,
      [suiteKey],
      suiteExport,
      config.filter,
      defaultMetaModelEnvironment,
      miroirActivityTracker,
      undefined,
      true,
      runMiroirTests,
      executionOptions,
    );
  }
}
