import crossFetch from "cross-fetch";

import type {
  Deployment,
  DomainControllerIntegrationSessionOptions,
  DomainControllerInterface,
  DomainControllerSessionProfile,
  IntegrationTestBootstrapPhase,
  IntegrationTestSessionDescriptor,
  MiroirConfigClient,
  MiroirTestExecutionEnvironment,
  RunnerTestSessionInterface
} from "miroir-core";
import {
  describeIntegrationTestSession,
  getBootstrapPhasesForDomainControllerProfile,
} from "miroir-core";
import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";
import {
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";

import {
  bootstrapHostOptionsFrom,
  runAppStackIntegrationBootstrap,
} from "./appStackIntegrationBootstrap.js";

export type DomainControllerIntegrationTestSessionOptions =
  DomainControllerIntegrationSessionOptions;

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
      miroirDeploymentUuid: deployment_Miroir.uuid,
      miroirSelfApplicationUuid: selfApplicationMiroir.uuid,
      libraryPlayfieldEnsureMode: this.sessionOptions.libraryPlayfieldEnsureMode,
      ...bootstrapHostOptionsFrom(this.sessionOptions),
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
