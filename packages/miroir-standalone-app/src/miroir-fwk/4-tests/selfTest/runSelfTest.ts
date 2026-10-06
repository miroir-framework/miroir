/**
 * #487: the self-test run. Loads Admin and the miroir deployment the way the app does, reads the
 * miroir app's MiroirTests from the local cache, runs those carrying the tags of
 * `client.selfTest` and returns the result.
 */
import {
  defaultSelfApplicationDeploymentMap,
  filterMiroirTestInstancesByTags,
  isMiroirTestSuiteInstance,
  MiroirLoggerFactory,
  type DomainControllerInterface,
  type LoggerInterface,
  type MiroirActivityTrackerInterface,
  type MiroirConfigClient,
} from "miroir-core";
import { selfApplicationMiroir } from "miroir-app-miroir";

import { packageName } from "../../../constants.js";
import type { TestResultData } from "../../4_view/components/Buttons/testResultReport.js";
import { cleanLevel } from "../../4_view/constants.js";
import { fetchMiroirAndAppConfigurations } from "../../4_view/services/ConfigurationService.js";
import { runUnitMiroirTestBatch } from "../miroirTestBatch.js";
import { computeSelfTestResult, selfTestTags, type MiroirSelfTestResult } from "./selfTestResult.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "runSelfTest");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI").then((logger: LoggerInterface) => {
  log = logger;
});

export async function runSelfTest(params: {
  domainController: DomainControllerInterface;
  miroirConfig: MiroirConfigClient;
  tracker: MiroirActivityTrackerInterface;
  onSuiteDone?: (suiteKey: string, results: TestResultData[]) => void;
}): Promise<MiroirSelfTestResult> {
  const startedAt = new Date();
  const tags = selfTestTags(params.miroirConfig);
  const environment = params.miroirConfig.environment?.name;

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
  const miroirTests = filterMiroirTestInstancesByTags(
    (miroirModel.tests ?? []).filter(isMiroirTestSuiteInstance),
    tags,
  );
  log.info(`self-test on ${environment}: ${miroirTests.length} MiroirTest(s) for tags ${tags.join(", ")}`);

  const resultsBySuiteKey = await runUnitMiroirTestBatch({
    miroirTests,
    tracker: params.tracker,
    includeComponentTests: false,
    onSuiteDone: params.onSuiteDone,
  });
  return computeSelfTestResult(resultsBySuiteKey, { environment, tags, startedAt, endedAt: new Date() });
}
