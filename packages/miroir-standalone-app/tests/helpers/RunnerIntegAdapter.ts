import {
  getMiroirConfig,
} from "miroir-core";
import type {
  ApplicationDeploymentMap,
  DomainControllerInterface,
  MiroirActivityTracker,
  MiroirConfigClient,
  MiroirEventService,
  StoreUnitConfiguration,
  MiroirTestExecutionEnvironment,
  MiroirTestIntegrationPort,
  RunnerTestContext,
} from "miroir-core";
import {
  libraryTestIdentifiers,
  RUNNER_TEST_ENVIRONMENT_REFS,
} from "miroir-test-app_deployment-library";
import {
  beforeAllTests,
  beforeEachTest,
  getTestConfig,
  testApplicationStorageConfiguration,
} from "../4_view/RunnerIntegTestTools.js";

export type RunnerIntegAdapterOptions = {
  miroirConfig: MiroirConfigClient;
  miroirActivityTracker: MiroirActivityTracker;
  miroirEventService: MiroirEventService;
  pageLabel?: string;
};

export class RunnerIntegAdapter implements MiroirTestIntegrationPort {
  private domainController: DomainControllerInterface | undefined;
  private applicationDeploymentMap: ApplicationDeploymentMap | undefined;
  private runnerTestContext: RunnerTestContext | undefined;

  constructor(private readonly options: RunnerIntegAdapterOptions) {}

  async initSession(): Promise<MiroirTestExecutionEnvironment> {
    const { miroirConfig, miroirActivityTracker, miroirEventService } = this.options;
    const pageLabel = this.options.pageLabel ?? "miroir-runner-tests.integ";

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

    const internalMiroirConfig = getMiroirConfig(
      miroirConfig,
      testDeploymentStorageConfiguration,
      libraryTestIdentifiers.installTestApplicationDeploymentUuid,
    );

    const { domainController } = await beforeAllTests(
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
      throw new Error("RunnerIntegAdapter.beforeEach: initSession not called");
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
