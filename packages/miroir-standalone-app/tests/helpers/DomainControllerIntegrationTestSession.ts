import crossFetch from "cross-fetch";

import type {
  ApplicationDeploymentMap,
  Deployment,
  DomainControllerInterface,
  DomainControllerSessionProfile,
  IntegrationTestBootstrapPhase,
  IntegrationTestSessionDescriptor,
  MiroirActivityTracker,
  MiroirConfigClient,
  MiroirEventService,
  MiroirTestExecutionEnvironment,
  RunnerTestSessionInterface,
  StoreUnitConfiguration,
} from "miroir-core";
import {
  describeIntegrationTestSession,
  getBootstrapPhasesForDomainControllerProfile,
} from "miroir-core";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";
import {
  selfApplicationDeploymentMiroir,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";

import type { AppStackSessionOptions } from "./IntegrationTestSession.js";
import { runAppStackIntegrationBootstrap } from "./appStackIntegrationBootstrap.js";

export type DomainControllerIntegrationTestSessionOptions = AppStackSessionOptions & {
  miroirDeploymentStorageConfiguration: StoreUnitConfiguration;
  miroirActivityTracker?: MiroirActivityTracker;
  miroirEventService?: MiroirEventService;
  customFetch?: typeof fetch;
  /**
   * Model.CRUD resets miroir only in `beforeEach`, not in `beforeAll`.
   * When true, `miroirPlatform` omits the `resetMiroirModel` bootstrap phase.
   */
  skipResetMiroirModelInInit?: boolean;
};

function resolveBootstrapPhases(
  profile: DomainControllerSessionProfile,
  skipResetMiroirModelInInit: boolean | undefined,
): readonly IntegrationTestBootstrapPhase[] {
  const phases = [...getBootstrapPhasesForDomainControllerProfile(profile)];
  if (profile === "miroirPlatform" && skipResetMiroirModelInInit) {
    return phases.filter((phase) => phase !== "resetMiroirModel");
  }
  return phases;
}

export class DomainControllerIntegrationTestSession implements RunnerTestSessionInterface {
  readonly descriptor: IntegrationTestSessionDescriptor;
  private domainController: DomainControllerInterface | undefined;

  constructor(
    private readonly miroirConfig: MiroirConfigClient,
    private readonly sessionOptions: DomainControllerIntegrationTestSessionOptions,
    private readonly profile: DomainControllerSessionProfile,
  ) {
    this.descriptor = describeIntegrationTestSession("domainController", profile);
  }

  async initSession(): Promise<MiroirTestExecutionEnvironment> {
    const executionEnvironment = await runAppStackIntegrationBootstrap({
      miroirConfig: this.miroirConfig,
      applicationDeploymentMap: this.sessionOptions.applicationDeploymentMap,
      adminDeployment: this.sessionOptions.adminDeployment as Deployment,
      libraryDeploymentStorageConfiguration:
        this.sessionOptions.libraryDeploymentStorageConfiguration,
      miroirDeploymentStorageConfiguration:
        this.sessionOptions.miroirDeploymentStorageConfiguration,
      phases: resolveBootstrapPhases(
        this.profile,
        this.sessionOptions.skipResetMiroirModelInInit,
      ),
      miroirActivityTracker: this.sessionOptions.miroirActivityTracker,
      miroirEventService: this.sessionOptions.miroirEventService,
      customFetch: this.sessionOptions.customFetch ?? crossFetch,
      testApplicationUuid: selfApplicationLibrary.uuid,
      deployMiroirStrategy: "compositeAction",
      openAdminAndMiroirStoresOnServer: true,
      miroirDeploymentUuid: selfApplicationDeploymentMiroir.uuid,
      miroirSelfApplicationUuid: selfApplicationMiroir.uuid,
    });

    this.domainController = executionEnvironment.domainController;
    return executionEnvironment;
  }

  async beforeEach(): Promise<void> {
    // Domain-controller integ tests manage per-test hooks in their own files.
  }

  async teardown(): Promise<void> {
    this.domainController = undefined;
  }
}
