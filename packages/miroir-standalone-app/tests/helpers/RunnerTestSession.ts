import crossFetch from "cross-fetch";

import {
  buildRunnerTestSessionParamBank,
  defaultMiroirMetaModel,
  extendMiroirConfigWithExtraDeploymentConfiguration,
  getBootstrapPhasesForSessionKind,
  remapLibraryAppModelForRunTarget,
  type ApplicationDeploymentMap,
  type Deployment,
  type DomainControllerInterface,
  type MetaModel,
  type MiroirActivityTracker,
  type MiroirConfigClient,
  type MiroirEventService,
  type MiroirTestExecutionEnvironment,
  type Runner,
  type RunnerTestContext,
  type RunnerTestRunTarget,
  type RunnerTestSessionInterface,
  type StoreUnitConfiguration,
} from "miroir-core";
import {
  defaultLibraryAppModel,
  deployment_Library_DO_NO_USE,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";
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
import {
  buildTeardownTestApplicationStoresAction,
} from "../../src/miroir-fwk/4-tests/testApplicationStoreTeardown.js";
import { buildTestSessionModelEnvironment } from "./testSessionModelEnvironment.js";

export type RunnerTestSessionOptions = AppStackBootstrapHostOptions & {
  miroirConfig: MiroirConfigClient;
  miroirActivityTracker: MiroirActivityTracker;
  miroirEventService: MiroirEventService;
  pageLabel?: string;
  runTarget: RunnerTestRunTarget;
  suiteTestParams?: Record<string, unknown>;
  runnerRegistry: Record<string, Runner>;
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
  private libraryModelForSession: MetaModel | undefined;

  constructor(private readonly options: RunnerTestSessionOptions) {}

  private resolveLibraryModelForRunTarget(runTarget: RunnerTestRunTarget): MetaModel {
    return remapLibraryAppModelForRunTarget(
      defaultLibraryAppModel as MetaModel,
      selfApplicationLibrary.uuid as string,
      deployment_Library_DO_NO_USE.uuid,
      runTarget,
    );
  }

  // ##############################################################################################
  async initSession(): Promise<MiroirTestExecutionEnvironment> {
    const { miroirConfig, miroirActivityTracker, miroirEventService, runTarget, runnerRegistry } =
      this.options;
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

    const libraryModelForSession = this.resolveLibraryModelForRunTarget(runTarget);
    this.libraryModelForSession = libraryModelForSession;

    const sessionTestParams = buildRunnerTestSessionParamBank(
      this.options.suiteTestParams,
      runTarget,
      { defaultLibraryAppModel: libraryModelForSession },
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
      runnerRegistry,
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
    if (!this.domainController || !this.applicationDeploymentMap || !this.runnerTestContext) {
      throw new Error("RunnerTestSession.beforeEach: initSession not called");
    }
    await beforeEachTest(this.domainController, this.applicationDeploymentMap, {
      applicationUuid: this.runnerTestContext.runTarget.applicationUuid,
      deploymentUuid: this.runnerTestContext.runTarget.deploymentUuid,
    }, {
      // Keep UI mounted during browser-triggered integration runs.
      clearDocumentBody: false,
    });
    if (this.runnerTestContext) {
      this.runnerTestContext.runtimeContext = {};
    }
  }

  // ##############################################################################################
  async teardown(): Promise<void> {
    if (!this.domainController || !this.applicationDeploymentMap || !this.runnerTestContext) {
      this.domainController = undefined;
      this.applicationDeploymentMap = undefined;
      this.runnerTestContext = undefined;
      return;
    }

    const { runTarget, testDeploymentStorageConfiguration } = this.runnerTestContext;

    const currentModel =
      runTarget.applicationUuid === selfApplicationMiroir.uuid
        ? defaultMiroirMetaModel
        : (this.libraryModelForSession ??
          this.resolveLibraryModelForRunTarget(runTarget));
    const modelEnvironment = buildTestSessionModelEnvironment(
      runTarget.deploymentUuid,
      currentModel,
    );

    await this.domainController.handleCompositeAction(
      buildTeardownTestApplicationStoresAction(
        runTarget.deploymentUuid,
        runTarget.applicationUuid,
        testDeploymentStorageConfiguration,
      ),
      this.applicationDeploymentMap,
      modelEnvironment,
      {},
    );

    this.domainController = undefined;
    this.applicationDeploymentMap = undefined;
    this.runnerTestContext = undefined;
    this.libraryModelForSession = undefined;
  }
}
