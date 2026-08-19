
import {
  type CompositeAction,
  type CompositeActionTemplate,
  type CompositeRunTestAssertion,
  type Deployment,
  type MetaModel,
  MiroirActivityTracker,
  type MiroirConfigClient,
  Runner,
  type StoreUnitConfiguration,
  displayTestSuiteResultsDetails,
} from "miroir-core";
import {
  beforeEachTest,
  getTestConfig,
  resolveEphemeralIndexedDbBaseName,
  testApplicationStorageConfiguration,
  type TestConfig,
} from "../../src/miroir-fwk/4-tests/runnerIntegTestSupport.js";

export {
  beforeEachTest,
  getTestConfig,
  resolveEphemeralIndexedDbBaseName,
  testApplicationStorageConfiguration,
  type TestConfig,
};

export interface RunnerTestParams {
  pageLabel: string,
  runner: Runner,
  testApplicationUuid: string,
  testApplicationDeploymentUuid: string,
  testApplicationName: string,
  testParams: Record<string, any>,
  preTestCompositeActions: CompositeActionTemplate[],
  testCompositeActionAssertions: CompositeRunTestAssertion[],
  internalMiroirConfig: MiroirConfigClient,
  adminDeployment: Deployment,
  testDeploymentStorageConfiguration: StoreUnitConfiguration,
  initialModel: MetaModel,
  preRunnerCompositeActions?: CompositeAction[],
  testCompositeActionLabel?: string,
  skipCreateDeployment?: boolean,
  skipDropDeployment?: boolean,
}

export async function afterAllTests(
  miroirActivityTracker: MiroirActivityTracker,
  displayTestResults: string[],
): Promise<void> {
  displayTestResults.forEach((testName) =>
    displayTestSuiteResultsDetails(
      testName,
      [],
      miroirActivityTracker,
    ),
  );
  return Promise.resolve();
}
