import { afterAll, beforeEach } from "vitest";

import {
  ConfigurationService,
  MiroirActivityTracker,
  defaultMetaModelEnvironment,
  getClientEnvironment,
  getProcessCapabilities,
  displayMiroirTestResults,
  indexApplicationMiroirTestsByKey,
  miroirTestSuiteForEnvironment,
  resolveApplicationMiroirTestSuiteKey,
  type MiroirTestCliConfig,
  type MiroirTestExecutionEnvironment,
  type MiroirTestExecutionOptions,
  type MiroirTestSuite,
  type ProcessCapabilities,
  type RunMiroirTests,
  type RunnerTestSessionInterface,
  type VitestNamespace,
  resolveSuitesTestbedReset,
  withTestbedResetPolicy,
} from "@miroir-framework/core";
import { timedTestPhase } from "./testTimingPhase.js";
import { topLevelSuiteName } from "./testbedResetScope.js";
import { onFailedRunExport } from "./writeFailedRunExport.js";
import {
  listCliRunnerIntegrationSuiteKeysFromFolders,
  loadApplicationMiroirTestCatalog,
} from "@miroir-framework/core/model-validation-fs";

const applicationMiroirTestCatalog = loadApplicationMiroirTestCatalog();
const runnerSuitesByKey = indexApplicationMiroirTestsByKey(applicationMiroirTestCatalog);

const reportedSkippedSuiteKeys = new Set<string>();

/** #696: the capabilities of the test process, which a suite's requirements are checked against. */
let testProcessCapabilities: ProcessCapabilities | undefined;

/**
 * #696: sets the test process capabilities from its configuration, as a server would compute them: a suite
 * tagged `versioning` is then skipped where `features.versioning` is false. Call it after the store startups.
 */
export function setTestProcessCapabilitiesFromConfig(
  miroirConfig: Parameters<typeof getProcessCapabilities>[0]["config"],
): void {
  testProcessCapabilities = getProcessCapabilities({
    config: miroirConfig,
    environment: getClientEnvironment(),
    storeSectionFactoryRegister: ConfigurationService.configurationService.StoreSectionFactoryRegister,
    adminStoreFactoryRegister: ConfigurationService.configurationService.adminStoreFactoryRegister,
  });
}

export function loadRunnerOrActionMiroirTestSuite(suiteKey: string): MiroirTestSuite {
  const resolvedKey =
    resolveApplicationMiroirTestSuiteKey(applicationMiroirTestCatalog, suiteKey) ?? suiteKey;
  const entry = runnerSuitesByKey[resolvedKey];
  if (!entry || entry.cliLaunchKind !== "runner-integration") {
    throw new Error(
      `Unknown runner/action MiroirTest suite key "${suiteKey}". Available: ${listCliRunnerIntegrationSuiteKeysFromFolders().join(", ")}`,
    );
  }
  // #589, #696: a suite whose requirement is unmet here (versioning off) runs as skipped
  const { suite, skipReason } = miroirTestSuiteForEnvironment(
    entry.instance,
    entry.suiteDefinition,
    testProcessCapabilities,
  );
  if (skipReason !== undefined && !reportedSkippedSuiteKeys.has(suiteKey)) {
    reportedSkippedSuiteKeys.add(suiteKey);
    console.log(`MiroirTest suite "${suiteKey}" skipped: ${skipReason}`);
  }
  return suite;
}

// ################################################################################################
export async function runMiroirRunnerTestsFromCLI(
  runMiroirTests: RunMiroirTests,
  vitest: VitestNamespace,
  config: MiroirTestCliConfig,
  miroirActivityTracker: MiroirActivityTracker,
  testSession: RunnerTestSessionInterface,
): Promise<void> {
  const executionEnvironment: MiroirTestExecutionEnvironment = await timedTestPhase(
    "session.init",
    () => testSession.initSession(),
  );
  const executionOptions: MiroirTestExecutionOptions = {
    executionMode: "integration",
    executionEnvironment,
    onFailedRunExport,
  };

  const loadedSuites: { suiteKey: string; definition: MiroirTestSuite }[] = [];

  // #318: suites marked `testbedReset: "perSuite"` reset once per top-level suite.
  const resetTestbed = withTestbedResetPolicy(
    resolveSuitesTestbedReset(config.suiteKeys.map(loadRunnerOrActionMiroirTestSuite)),
    () => testSession.beforeEach(),
  );
  beforeEach(async (context) => {
    await resetTestbed(topLevelSuiteName(context.task));
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
