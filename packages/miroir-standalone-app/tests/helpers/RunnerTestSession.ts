import crossFetch from "cross-fetch";

import {
  buildRunnerTestSessionParamBank,
  emptyApplicationModel,
  ensureLibraryPlayfield,
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
import { selfApplicationDeploymentMiroir, selfApplicationMiroir, defaultMiroirMetaModel } from "miroir-test-app_deployment-miroir";
import {
  beforeEachTest,
  getTestConfig,
  testApplicationStorageConfiguration,
} from "../4_view/RunnerIntegTestTools.js";
import {
  bootstrapHostOptionsFrom,
  type AppStackBootstrapHostOptions,
} from "../../src/miroir-fwk/4-tests/appStackBootstrapHostOptions.js";
import { runRealServerClientBootstrap } from "../../src/miroir-fwk/4-tests/runRealServerClientBootstrap.js";
import { runAppStackIntegrationBootstrap } from "./appStackIntegrationBootstrap.js";
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
  /**
   * Optional playfield seed applied in `beforeEach` after reset
   * (Action Data.CRUD MiroirTest suites).
   */
  libraryPlayfieldSeed?: {
    libraryEntitiesAndInstances: import("miroir-core").ApplicationEntitiesAndInstances;
    librarySeedInitParams: import("miroir-core").InitApplicationParameters;
    librarySeedMetaModel: MetaModel;
  };
  /**
   * When true, `beforeEach` does **not** reset/seed the session runTarget with
   * remapped library model. Used by CreateEntity / DropEntity MiroirTests that
   * create/drop an ephemeral deployment with `emptyApplicationModel` inside the
   * composite suite (legacy harness parity).
   */
  skipRunTargetPlayfieldReset?: boolean;
  /**
   * Fetch implementation for the client REST transport. MUST be runtime-appropriate:
   * the browser needs the native `window.fetch` (a Node polyfill such as `cross-fetch`
   * silently fails there before any request is sent). Defaults to `crossFetch` for Node
   * (vitest / TLS). The browser orchestrator injects `window.fetch.bind(window)`.
   */
  customFetch?: typeof fetch;
};

export type RunnerTestSessionConfig = {
  applicationDeploymentMap: ApplicationDeploymentMap;
  internalMiroirConfig: MiroirConfigClient;
  adminDeployment: Deployment;
  miroirDeploymentStorageConfiguration: StoreUnitConfiguration;
  testDeploymentStorageConfiguration: StoreUnitConfiguration;
};

// ################################################################################################
/**
 * Resolve the fetch used by the client REST transport for a test session.
 * - explicit override wins (orchestrator / caller)
 * - in a browser, the native `window.fetch` (bound) is required — a Node polyfill
 *   like `cross-fetch` throws before sending, so the request never reaches the server
 * - otherwise fall back to `crossFetch` (Node / vitest, handles local TLS)
 */
export function resolveRuntimeFetch(explicit?: typeof fetch): typeof fetch {
  if (explicit) {
    return explicit;
  }
  if (typeof window !== "undefined" && typeof window.fetch === "function") {
    return window.fetch.bind(window) as typeof fetch;
  }
  return crossFetch as unknown as typeof fetch;
}

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

    // Node polyfill (crossFetch) is only correct outside the browser; inside the
    // browser it fails before issuing a request, so the client never reaches the
    // server. Prefer an explicitly injected fetch, else the browser's native fetch,
    // else crossFetch for Node/vitest.
    const customFetch = resolveRuntimeFetch(this.options.customFetch);

    const { domainController, persistenceStoreControllerManager } =
      !internalMiroirConfig.client.emulateServer
        ? await runRealServerClientBootstrap({
            miroirConfig: internalMiroirConfig,
            applicationDeploymentMap,
            adminDeployment,
            miroirDeploymentStorageConfiguration,
            miroirActivityTracker,
            miroirEventService,
            customFetch,
            testApplicationUuid: runTarget.applicationUuid,
            miroirDeploymentUuid: selfApplicationDeploymentMiroir.uuid,
            miroirSelfApplicationUuid: selfApplicationMiroir.uuid,
            ...bootstrapHostOptionsFrom(this.options),
            // D9: shared miroir-server already has Miroir platform (after host options)
            platformEnsureMode: this.options.platformEnsureMode ?? "skip",
          })
        : await runAppStackIntegrationBootstrap({
            miroirConfig: internalMiroirConfig,
            applicationDeploymentMap,
            adminDeployment,
            miroirDeploymentStorageConfiguration,
            phases: getBootstrapPhasesForSessionKind("runner"),
            miroirActivityTracker,
            miroirEventService,
            customFetch,
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

    // The ephemeral run-target deployment must have a store on the persistence
    // backend before the per-leaf `beforeEach` reset (resetLibraryPlayfield)
    // touches it. In the emulated stack `wireEmulatedStack` already opens every
    // configured deployment locally (including this ephemeral one). Against a real
    // miroir-server nothing has opened/created it yet, so we send the createDeployment
    // composite action over REST here — mirroring the vitest suite's `beforeAll`
    // createDeployment. Admin is already open on the shared server, so skip its openStore.
    // Action Data.CRUD suites also need ensure on emulated when seeding (playfield create).
    if (!internalMiroirConfig.client.emulateServer || this.options.libraryPlayfieldSeed) {
      await ensureLibraryPlayfield({
        domainController,
        applicationDeploymentMap: testApplicationDeploymentMap,
        adminDeployment,
        libraryDeploymentStorageConfiguration: testDeploymentStorageConfiguration,
        libraryDeploymentUuid: runTarget.deploymentUuid,
        librarySelfApplicationUuid: runTarget.applicationUuid,
        mode: "createIfAbsent",
        skipOpenAdminStore: true,
        persistenceStoreControllerManager,
      });
    }

    const libraryModelForSession = this.resolveLibraryModelForRunTarget(runTarget);
    this.libraryModelForSession = libraryModelForSession;

    const sessionTestParams = buildRunnerTestSessionParamBank(
      this.options.suiteTestParams,
      runTarget,
      {
        defaultLibraryAppModel: libraryModelForSession,
        emptyApplicationModel,
      },
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
    if (this.options.skipRunTargetPlayfieldReset) {
      this.runnerTestContext.runtimeContext = {};
      return;
    }
    const emulateServer = this.runnerTestContext.internalMiroirConfig.client.emulateServer === true;
    const playfieldSeed = this.options.libraryPlayfieldSeed;
    await beforeEachTest(this.domainController, this.applicationDeploymentMap, {
      applicationUuid: this.runnerTestContext.runTarget.applicationUuid,
      deploymentUuid: this.runnerTestContext.runTarget.deploymentUuid,
    }, {
      // Keep UI mounted during browser-triggered integration runs.
      clearDocumentBody: false,
      resetMiroirPlatform: emulateServer,
      ...(playfieldSeed
        ? {
            ...playfieldSeed,
            // Remap the *provided* seed metaModel for ephemeral runTargets.
            // Do not replace with defaultLibraryAppModel — Action suites may seed
            // custom entities (e.g. composite-PK TestEntityCompositePK).
            librarySeedMetaModel: remapLibraryAppModelForRunTarget(
              playfieldSeed.librarySeedMetaModel,
              selfApplicationLibrary.uuid as string,
              deployment_Library_DO_NO_USE.uuid,
              this.runnerTestContext.runTarget,
            ),
          }
        : {}),
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
