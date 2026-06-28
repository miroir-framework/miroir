import crossFetch from "cross-fetch";

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
  RunnerTestRunTarget,
} from "miroir-core";
import {
  buildRunnerTestSessionParamBank,
  extendMiroirConfigWithExtraDeploymentConfiguration,
  getBootstrapPhasesForSessionKind,
} from "miroir-core";
import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";
import {
  selfApplicationDeploymentMiroir,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import {
  beforeEachTest,
  getTestConfig,
  testApplicationStorageConfiguration,
} from "../4_view/RunnerIntegTestTools.js";
import {
  bootstrapHostOptionsFrom,
  runAppStackIntegrationBootstrap,
  type AppStackBootstrapHostOptions,
} from "./appStackIntegrationBootstrap.js";

export type RunnerTestSessionOptions = AppStackBootstrapHostOptions & {
  miroirConfig: MiroirConfigClient;
  miroirActivityTracker: MiroirActivityTracker;
  miroirEventService: MiroirEventService;
  pageLabel?: string;
  runTarget: RunnerTestRunTarget;
  suiteTestParams?: Record<string, unknown>;
};

export type RunnerTestSessionConfig = {
  applicationDeploymentMap: ApplicationDeploymentMap;
  internalMiroirConfig: MiroirConfigClient;
  adminDeployment: Deployment;
  miroirDeploymentStorageConfiguration: StoreUnitConfiguration;
  testDeploymentStorageConfiguration: StoreUnitConfiguration;
};

// ################################################################################################
export function getTestSessionConfig(
  miroirConfig: MiroirConfigClient,
  runTarget: RunnerTestRunTarget,
): RunnerTestSessionConfig {
  const {
    applicationDeploymentMap,
    miroirDeploymentStorageConfiguration,
    adminDeployment,
    libraryDeploymentStorageConfiguration,
  } = getTestConfig(
    miroirConfig,
    runTarget.deploymentUuid,
    runTarget.applicationName,
    runTarget.applicationUuid,
  );

  const testDeploymentStorageConfiguration: StoreUnitConfiguration =
    testApplicationStorageConfiguration(
      libraryDeploymentStorageConfiguration,
      runTarget.applicationName,
    );

  const internalMiroirConfig = extendMiroirConfigWithExtraDeploymentConfiguration(
    miroirConfig,
    testDeploymentStorageConfiguration,
    runTarget.deploymentUuid,
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

  // ##############################################################################################
  async initSession(): Promise<MiroirTestExecutionEnvironment> {
    const { miroirConfig, miroirActivityTracker, miroirEventService, runTarget } = this.options;
    const pageLabel = this.options.pageLabel ?? "miroir-runner-tests.integ";

    const {
      applicationDeploymentMap,
      miroirDeploymentStorageConfiguration,
      adminDeployment,
      testDeploymentStorageConfiguration,
      internalMiroirConfig,
    } = getTestSessionConfig(miroirConfig, runTarget);

    const { domainController, persistenceStoreControllerManager } =
      await runAppStackIntegrationBootstrap({
        miroirConfig: internalMiroirConfig,
        applicationDeploymentMap,
        adminDeployment,
        miroirDeploymentStorageConfiguration,
        phases: getBootstrapPhasesForSessionKind("runner"),
        miroirActivityTracker,
        miroirEventService,
        customFetch: crossFetch,
        testApplicationUuid: runTarget.applicationUuid,
        deployMiroirStrategy: "compositeAction",
        openAdminAndMiroirStoresOnServer: false,
        miroirDeploymentUuid: selfApplicationDeploymentMiroir.uuid,
        miroirSelfApplicationUuid: selfApplicationMiroir.uuid,
        ...bootstrapHostOptionsFrom(this.options),
      });

    const testApplicationDeploymentMap = {
      ...applicationDeploymentMap,
      [runTarget.applicationUuid]: runTarget.deploymentUuid,
    };

    const sessionTestParams = buildRunnerTestSessionParamBank(
      this.options.suiteTestParams,
      runTarget,
      { defaultLibraryAppModel },
    );

    this.domainController = domainController;
    this.applicationDeploymentMap = testApplicationDeploymentMap;
    this.runnerTestContext = {
      pageLabel,
      domainController,
      applicationDeploymentMap: testApplicationDeploymentMap,
      internalMiroirConfig,
      adminDeployment,
      testDeploymentStorageConfiguration,
      runTarget,
      testParams: sessionTestParams,
      runtimeContext: {},
    };

    return {
      domainController,
      applicationDeploymentMap: testApplicationDeploymentMap,
      testApplicationUuid: runTarget.applicationUuid,
      persistenceStoreControllerManager,
      runnerTestContext: this.runnerTestContext,
    };
  }

  // ##############################################################################################
  async beforeEach(): Promise<void> {
    if (!this.domainController || !this.applicationDeploymentMap) {
      throw new Error("RunnerTestSession.beforeEach: initSession not called");
    }
    await beforeEachTest(this.domainController, this.applicationDeploymentMap);
    if (this.runnerTestContext) {
      this.runnerTestContext.runtimeContext = {};
    }
  }

  // ##############################################################################################
  async teardown(): Promise<void> {
    this.domainController = undefined;
    this.applicationDeploymentMap = undefined;
    this.runnerTestContext = undefined;
  }
}
