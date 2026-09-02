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
import { onFailedRunExport } from "./writeFailedRunExport.js";
import {
  miroirTest_runner_lend_document,
  miroirTest_runner_return_document,
} from "miroir-test-app_deployment-library";
import {
  miroirTest_domain_controller_composite_pk_crud,
  miroirTest_domain_controller_data_crud,
  miroirTest_domain_controller_model_crud,
  miroirTest_domain_controller_model_undo_redo,
  miroirTest_domain_controller_application_version_freeze,
  miroirTest_domain_controller_no_parent_uuid_crud,
  miroirTest_domain_controller_non_uuid_pk_data_crud,
  miroirTest_domain_controller_non_uuid_pk_model_crud,
  miroirTest_evolutionTraceWP1,
  miroirTest_runner_create_entity,
  miroirTest_runner_drop_entity,
  miroirTest_runner_freeze_application_version,
  miroirTest_runner_mcp_get_instances,
} from "miroir-test-app_deployment-miroir";

const SUITE_BY_KEY: Record<string, MiroirTestDefinition> = {
  runner_lend_document: miroirTest_runner_lend_document as MiroirTestDefinition,
  runner_return_document: miroirTest_runner_return_document as MiroirTestDefinition,
  runner_create_entity: miroirTest_runner_create_entity as MiroirTestDefinition,
  runner_drop_entity: miroirTest_runner_drop_entity as MiroirTestDefinition,
  runner_freeze_application_version:
    miroirTest_runner_freeze_application_version as MiroirTestDefinition,
  runner_mcp_get_instances: miroirTest_runner_mcp_get_instances as MiroirTestDefinition,
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
  domain_controller_application_version_freeze:
    miroirTest_domain_controller_application_version_freeze as MiroirTestDefinition,
  evolutionTraceWP1: miroirTest_evolutionTraceWP1 as MiroirTestDefinition,
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
    onFailedRunExport,
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

  const runnerTestContext = executionEnvironment.runnerTestContext;

  for (const suiteKey of config.suiteKeys) {
    const suiteExport = loadRunnerOrActionMiroirTestSuite(suiteKey);
    loadedSuites.push({
      suiteKey,
      definition: suiteExport,
    });
    // The session is built once from the primary suite. Each suite may carry its
    // own testParams bank; runner resolution uses each leaf's runnerRef + session
    // runnerUuidIndex at execution time.
    const suiteExecutionOptions: MiroirTestExecutionOptions =
      runnerTestContext && suiteExport.testParams
        ? {
            ...executionOptions,
            executionEnvironment: {
              ...executionEnvironment,
              runnerTestContext: {
                ...runnerTestContext,
                testParams: {
                  ...runnerTestContext.testParams,
                  ...suiteExport.testParams,
                },
              },
            },
          }
        : executionOptions;
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
      suiteExecutionOptions,
    );
  }
}
