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
  type IntegTestHostOptions,
  type MetaModel,
  type MiroirActivityTracker,
  type MiroirConfigClient,
  type MiroirEventService,
  type MiroirTestExecutionEnvironment,
  type PersistenceStoreControllerManagerInterface,
  type Runner,
  type RunnerLibraryPlayfieldSeed,
  type RunnerTestContext,
  type RunnerTestSessionInterface,
  type StoreUnitConfiguration,
  type TestbedUuids,
} from "miroir-core";
import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import {
  defaultAppForTestModel,
  deployment_AppForTest_DO_NO_USE,
  selfApplicationAppForTest,
} from "miroir-test-app_deployment-appForTest";
import {
  defaultLibraryAppModel,
  deployment_Library_DO_NO_USE,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";
import { defaultMiroirMetaModel, selfApplicationMiroir } from "miroir-test-app_deployment-miroir";
import { runRealServerClientBootstrap } from "../../src/miroir-fwk/4-tests/runRealServerClientBootstrap.js";
import {
  buildTeardownTestApplicationStoresAction,
} from "../../src/miroir-fwk/4-tests/testApplicationStoreTeardown.js";
import {
  beforeEachTest,
  getTestConfig,
  testApplicationStorageConfiguration,
} from "../4_view/RunnerIntegTestTools.js";
import { runAppStackIntegrationBootstrap } from "./appStackIntegrationBootstrap.js";
import { buildTestSessionModelEnvironment } from "./testSessionModelEnvironment.js";

export type RunnerTestSessionOptions = IntegTestHostOptions & {
  miroirConfig: MiroirConfigClient;
  miroirActivityTracker: MiroirActivityTracker;
  miroirEventService: MiroirEventService;
  pageLabel?: string;
  runTarget: TestbedUuids;
  suiteTestParams?: Record<string, unknown>;
  runnerRegistry: Record<string, Runner>;
  /** When set, `resolveRunnerTestLeaf` uses this instead of `runnerRegistry[leaf.runnerRef]`. */
  resolvedRunner?: Runner;
  /**
   * Optional playfield seed applied in `beforeEach` after reset
   * (Action Data.CRUD MiroirTest suites).
   */
  libraryPlayfieldSeed?: RunnerLibraryPlayfieldSeed;
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
  runTarget: TestbedUuids,
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
  private persistenceStoreControllerManager:
    | PersistenceStoreControllerManagerInterface
    | undefined;

  constructor(private readonly options: RunnerTestSessionOptions) {}

  private resolveTestAppModelForRunTarget(runTarget: TestbedUuids): MetaModel {
    if (runTarget.applicationName === "appForTest") {
      return remapLibraryAppModelForRunTarget(
        defaultAppForTestModel as MetaModel,
        selfApplicationAppForTest.uuid as string,
        deployment_AppForTest_DO_NO_USE.uuid,
        runTarget,
      );
    }
    return remapLibraryAppModelForRunTarget(
      defaultLibraryAppModel as MetaModel,
      selfApplicationLibrary.uuid as string,
      deployment_Library_DO_NO_USE.uuid,
      runTarget,
    );
  }

  private resolveCanonicalModelRemap(runTarget: TestbedUuids): {
    canonicalApplicationUuid: string;
    canonicalDeploymentUuid: string;
  } {
    if (runTarget.applicationName === "appForTest") {
      return {
        canonicalApplicationUuid: selfApplicationAppForTest.uuid as string,
        canonicalDeploymentUuid: deployment_AppForTest_DO_NO_USE.uuid,
      };
    }
    return {
      canonicalApplicationUuid: selfApplicationLibrary.uuid as string,
      canonicalDeploymentUuid: deployment_Library_DO_NO_USE.uuid,
    };
  }

  // ##############################################################################################
  async initSession(): Promise<MiroirTestExecutionEnvironment> {
    const {
      miroirConfig,
      miroirActivityTracker,
      miroirEventService,
      runTarget,
      runnerRegistry,
      resolvedRunner,
    } = this.options;
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
            applicationDeploymentMap,
            adminDeployment,
            miroirDeploymentStorageConfiguration,
            customFetch,
            testApplicationUuid: runTarget.applicationUuid,
            miroirDeploymentUuid: deployment_Miroir.uuid,
            miroirSelfApplicationUuid: selfApplicationMiroir.uuid,
            ...this.options,
            // D9: shared miroir-server already has Miroir platform (after host options)
            platformEnsureMode: this.options.platformEnsureMode ?? "skip",
          })
        : await runAppStackIntegrationBootstrap({
            applicationDeploymentMap,
            adminDeployment,
            miroirDeploymentStorageConfiguration,
            phases: getBootstrapPhasesForSessionKind("runner"),
            customFetch,
            testApplicationUuid: runTarget.applicationUuid,
            deployMiroirStrategy: "compositeAction",
            openAdminAndMiroirStoresOnServer: false,
            miroirDeploymentUuid: deployment_Miroir.uuid,
            miroirSelfApplicationUuid: selfApplicationMiroir.uuid,
            ...this.options,
          });

    const testApplicationDeploymentMap = {
      ...applicationDeploymentMap,
      [runTarget.applicationUuid]: runTarget.deploymentUuid,
    };

    // The ephemeral run-target deployment must have a store on the persistence
    // backend before the per-leaf `beforeEach` reset (resetIntegTestbed)
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

    const libraryModelForSession = remapLibraryAppModelForRunTarget(
      defaultLibraryAppModel as MetaModel,
      selfApplicationLibrary.uuid as string,
      deployment_Library_DO_NO_USE.uuid,
      runTarget,
    );
    const testAppModelForSession = this.resolveTestAppModelForRunTarget(runTarget);
    this.libraryModelForSession = testAppModelForSession;

    const sessionTestParams = buildRunnerTestSessionParamBank(
      this.options.suiteTestParams,
      runTarget,
      {
        defaultLibraryAppModel: libraryModelForSession,
        defaultAppForTestModel: remapLibraryAppModelForRunTarget(
          defaultAppForTestModel as MetaModel,
          selfApplicationAppForTest.uuid as string,
          deployment_AppForTest_DO_NO_USE.uuid,
          runTarget,
        ),
        emptyApplicationModel,
      },
    );

    this.domainController = domainController;
    this.persistenceStoreControllerManager = persistenceStoreControllerManager;
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
      ...(resolvedRunner ? { resolvedRunner } : {}),
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
    const { canonicalApplicationUuid, canonicalDeploymentUuid } =
      this.resolveCanonicalModelRemap(this.runnerTestContext.runTarget);
    await beforeEachTest(this.domainController, this.applicationDeploymentMap, {
      applicationUuid: this.runnerTestContext.runTarget.applicationUuid,
      deploymentUuid: this.runnerTestContext.runTarget.deploymentUuid,
    }, {
      clearDocumentBody: false, // Keep UI mounted during browser-triggered integration runs.
      resetMiroirPlatform: emulateServer,
      ...(playfieldSeed
        ? {
            ...playfieldSeed,
            // Remap the *provided* seed metaModel for ephemeral runTargets.
            // Do not replace with defaultLibraryAppModel — Action suites may seed
            // custom entities (e.g. composite-PK TestEntityCompositePK).
            testbedModel: remapLibraryAppModelForRunTarget(
              playfieldSeed.testbedModel,
              canonicalApplicationUuid,
              canonicalDeploymentUuid,
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
          this.resolveTestAppModelForRunTarget(runTarget));
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

    // Release emulated-server persistence backends (Postgres pools, etc.) so the
    // vitest worker can shut down without RPC timeouts.
    if (this.persistenceStoreControllerManager) {
      for (const deploymentUuid of [
        ...this.persistenceStoreControllerManager.getPersistenceStoreControllers(),
      ]) {
        await this.persistenceStoreControllerManager.deletePersistenceStoreController(
          deploymentUuid,
        );
      }
    }

    this.domainController = undefined;
    this.applicationDeploymentMap = undefined;
    this.runnerTestContext = undefined;
    this.libraryModelForSession = undefined;
    this.persistenceStoreControllerManager = undefined;
  }
}
