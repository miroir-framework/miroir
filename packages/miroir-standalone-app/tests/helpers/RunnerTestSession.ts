import type {
  ApplicationDeploymentMap,
  DomainControllerInterface,
  MiroirActivityTracker,
  MiroirConfigClient,
  MiroirEventService,
  MiroirTestExecutionEnvironment,
  RunnerTestSessionInterface,
  RunnerTestContext,
  StoreUnitConfiguration,
  Deployment,
} from "miroir-core";
import {
  extendMiroirConfigWithExtraDeploymentConfiguration,
} from "miroir-core";
import {
  libraryTestIdentifiers,
  RUNNER_TEST_ENVIRONMENT_REFS,
} from "miroir-test-app_deployment-library";
import {
  beforeEachTest,
  getTestConfig,
  testApplicationStorageConfiguration,
} from "../4_view/RunnerIntegTestTools.js";
import { setupMiroirTestAndDeployMiroirApp } from "../../src/miroir-fwk/4-tests/setupMiroirTest.js";

export type RunnerTestSessionOptions = {
  miroirConfig: MiroirConfigClient;
  miroirActivityTracker: MiroirActivityTracker;
  miroirEventService: MiroirEventService;
  pageLabel?: string;
};

export type RunnerTestSessionConfig = {
  applicationDeploymentMap: ApplicationDeploymentMap;
  internalMiroirConfig: MiroirConfigClient;
  adminDeployment: Deployment;
  miroirDeploymentStorageConfiguration: StoreUnitConfiguration;
  testDeploymentStorageConfiguration: StoreUnitConfiguration;
};

// ################################################################################################
function getTestSessionConfig(miroirConfig: MiroirConfigClient): RunnerTestSessionConfig {
  const {
    applicationDeploymentMap,
    miroirDeploymentStorageConfiguration,
    adminDeployment,
    libraryDeploymentStorageConfiguration,
  } = getTestConfig(
    miroirConfig,
    libraryTestIdentifiers.testApplicationDeploymentUuid,
    libraryTestIdentifiers.testApplicationName,
    libraryTestIdentifiers.testApplicationUuid,
  );

  const testDeploymentStorageConfiguration: StoreUnitConfiguration =
    testApplicationStorageConfiguration(
      libraryDeploymentStorageConfiguration,
      libraryTestIdentifiers.installTestApplicationName,
    );

  const internalMiroirConfig = extendMiroirConfigWithExtraDeploymentConfiguration(
    miroirConfig,
    testDeploymentStorageConfiguration,
    libraryTestIdentifiers.installTestApplicationDeploymentUuid,
  );

  return {
    applicationDeploymentMap,
    miroirDeploymentStorageConfiguration,
    adminDeployment,
    testDeploymentStorageConfiguration,
    internalMiroirConfig,
  };
}

// ################################################################################################
export class RunnerTestSession implements RunnerTestSessionInterface {
  private domainController: DomainControllerInterface | undefined;
  private applicationDeploymentMap: ApplicationDeploymentMap | undefined;
  private runnerTestContext: RunnerTestContext | undefined;

  constructor(private readonly options: RunnerTestSessionOptions) {}


  async initSession(): Promise<MiroirTestExecutionEnvironment> {
    const { miroirConfig, miroirActivityTracker, miroirEventService } = this.options;
    const pageLabel = this.options.pageLabel ?? "miroir-runner-tests.integ";

    const {
      applicationDeploymentMap,
      miroirDeploymentStorageConfiguration,
      adminDeployment,
      testDeploymentStorageConfiguration, // not used in setupMiroirTestAndDeployMiroirApp!
      internalMiroirConfig,
    } = getTestSessionConfig(miroirConfig);

    const { domainController } = await setupMiroirTestAndDeployMiroirApp(
      internalMiroirConfig,
      miroirActivityTracker,
      miroirEventService,
      adminDeployment,
      miroirDeploymentStorageConfiguration,
      applicationDeploymentMap,
    );

    const testApplicationDeploymentMap = {
      ...applicationDeploymentMap,
      [libraryTestIdentifiers.testApplicationUuid]:
        libraryTestIdentifiers.testApplicationDeploymentUuid,
    };

    this.domainController = domainController;
    this.applicationDeploymentMap = testApplicationDeploymentMap;
    this.runnerTestContext = {
      pageLabel,
      domainController,
      applicationDeploymentMap: testApplicationDeploymentMap,
      internalMiroirConfig,
      adminDeployment,
      testDeploymentStorageConfiguration,
      testParams: RUNNER_TEST_ENVIRONMENT_REFS?.testParams ?? {},
      runtimeContext: {},
    };

    return { runnerTestContext: this.runnerTestContext };
  }

  async beforeEach(): Promise<void> {
    if (!this.domainController || !this.applicationDeploymentMap) {
      throw new Error("RunnerTestSession.beforeEach: initSession not called");
    }
    await beforeEachTest(this.domainController, this.applicationDeploymentMap);
    if (this.runnerTestContext) {
      this.runnerTestContext.runtimeContext = {};
    }
  }

  async teardown(): Promise<void> {
    this.domainController = undefined;
    this.applicationDeploymentMap = undefined;
    this.runnerTestContext = undefined;
  }
}
