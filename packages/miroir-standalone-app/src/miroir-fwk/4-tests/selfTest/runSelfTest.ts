/**
 * #487: the self-test run. Loads Admin and the miroir deployment the way the app does, reads the
 * miroir app's MiroirTests from the local cache, runs those carrying the tags of
 * `client.selfTest` and returns the result.
 */
import {
  buildRunnerUuidIndex,
  defaultSelfApplicationDeploymentMap,
  filterMiroirTestInstancesByTags,
  isMiroirTestSuiteInstance,
  MiroirLoggerFactory,
  type DomainControllerInterface,
  type LoggerInterface,
  type MiroirActivityTrackerInterface,
  type MiroirConfigClient,
  type Runner,
} from "miroir-core";
import { selfApplicationMiroir } from "miroir-app-miroir";

import { packageName } from "../../../constants.js";
import type { TestResultData } from "../../4_view/components/Buttons/testResultReport.js";
import { cleanLevel } from "../../4_view/constants.js";
import { fetchMiroirAndAppConfigurations } from "../../4_view/services/ConfigurationService.js";
import { readAppMiroirReports } from "../appMiroirReports.js";
import {
  runIntegrationMiroirTestBatch,
  runUnitMiroirTestBatch,
  type MiroirTestSuiteResultsMap,
  type SkippedMiroirTestSuite,
} from "../miroirTestBatch.js";
import {
  computeSelfTestResult,
  failedSelfTestResult,
  selfTestTags,
  type MiroirSelfTestResult,
} from "./selfTestResult.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "runSelfTest");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI").then((logger: LoggerInterface) => {
  log = logger;
});

/** The tag that adds the integration batch (#487 D8). */
export const SELF_TEST_INTEG_TAG = "integ";

/** The key of a suite's integration results, beside its unit results. */
export function integrationSuiteKey(suiteKey: string): string {
  return `${suiteKey} (integ)`;
}

/** The verdict's error when the client finds authentication on (#487 runs without it, decision A5). */
export const SELF_TEST_NEEDS_AUTHENTICATION_OFF =
  "self-test runs with authentication off: set server.authentication.enabled to false in the environment";

/**
 * Never throws: a boot or runner error gives a `failed` result carrying the error, so the page never
 * stays on `running`.
 */
export async function runSelfTest(params: {
  domainController: DomainControllerInterface;
  miroirConfig: MiroirConfigClient;
  tracker: MiroirActivityTrackerInterface;
  /** What `/auth/status` (or Electron IPC) answered. */
  authenticationEnabled?: boolean;
  onSuiteDone?: (suiteKey: string, results: TestResultData[]) => void;
}): Promise<MiroirSelfTestResult> {
  const startedAt = new Date();
  const tags = selfTestTags(params.miroirConfig);
  const environment = params.miroirConfig.environment?.name;
  const failed = (error: string) =>
    failedSelfTestResult(error, { environment, tags, startedAt, endedAt: new Date() });

  if (params.authenticationEnabled) {
    return failed(SELF_TEST_NEEDS_AUTHENTICATION_OFF);
  }
  try {
    const { resultsBySuiteKey, skipped } = await loadAndRun(params, tags, environment);
    return computeSelfTestResult(resultsBySuiteKey, { environment, tags, startedAt, endedAt: new Date() }, skipped);
  } catch (error) {
    log.error("self-test failed to run", error);
    return failed(error instanceof Error ? error.message : String(error));
  }
}

/**
 * The unit batch runs the suites of the tags other than `integ`; with `integ`, the integration
 * batch then runs the `integ` suites on the default in-app profile (#487 D8).
 */
async function loadAndRun(
  params: Parameters<typeof runSelfTest>[0],
  tags: string[],
  environment: string | undefined,
): Promise<{ resultsBySuiteKey: MiroirTestSuiteResultsMap; skipped: SkippedMiroirTestSuite[] }> {
  const loaded = await fetchMiroirAndAppConfigurations({
    domainController: params.domainController,
    miroirConfig: params.miroirConfig,
    applications: [selfApplicationMiroir.uuid],
  });
  if (loaded?.status === "error") {
    throw new Error(loaded.errorMessage ?? "loading the miroir deployment failed");
  }

  const miroirModel = params.domainController.currentModel(
    selfApplicationMiroir.uuid,
    defaultSelfApplicationDeploymentMap,
  );
  const allTests = (miroirModel.tests ?? []).filter(isMiroirTestSuiteInstance);
  const unitTags = tags.filter((tag) => tag !== SELF_TEST_INTEG_TAG);
  const unitTests = unitTags.length > 0 ? filterMiroirTestInstancesByTags(allTests, unitTags) : [];
  const integTests = tags.includes(SELF_TEST_INTEG_TAG)
    ? filterMiroirTestInstancesByTags(allTests, [SELF_TEST_INTEG_TAG])
    : [];
  log.info(
    `self-test on ${environment}: ${unitTests.length} unit and ${integTests.length} integ MiroirTest(s) for tags ${tags.join(", ")}`,
  );

  const resultsBySuiteKey = await runUnitMiroirTestBatch({
    miroirTests: unitTests,
    tracker: params.tracker,
    includeComponentTests: false,
    onSuiteDone: params.onSuiteDone,
  });
  if (integTests.length === 0) {
    return { resultsBySuiteKey, skipped: [] };
  }

  const integration = await runIntegrationMiroirTestBatch({
    miroirTests: integTests,
    runnerUuidIndex: buildRunnerUuidIndex((miroirModel.runners ?? []) as Runner[]),
    miroirReports: () => readAppMiroirReports(params.domainController, defaultSelfApplicationDeploymentMap),
    onSuiteDone: (suiteKey, results) => params.onSuiteDone?.(integrationSuiteKey(suiteKey), results),
  });
  for (const [suiteKey, results] of Object.entries(integration.resultsBySuiteKey)) {
    resultsBySuiteKey[integrationSuiteKey(suiteKey)] = results;
  }
  return { resultsBySuiteKey, skipped: integration.skipped };
}
