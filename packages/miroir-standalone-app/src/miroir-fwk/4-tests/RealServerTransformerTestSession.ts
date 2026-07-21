/**
 * Transformer integ session against a live `miroir-server` (REST client).
 * Creates an ephemeral testApplication deployment on the server, seeds Author/Book/Publisher,
 * and tears down stores (+ Admin Deployment/Application rows) after the run.
 *
 * First profile in scope: `realServer-sql` (library template model.emulatedServerType === "sql").
 */
import crossFetch from "cross-fetch";

import {
  ensureLibraryPlayfield,
  extendMiroirConfigWithExtraDeploymentConfiguration,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type MiroirActivityTracker,
  type MiroirConfigClient,
  type MiroirEventService,
  type MiroirTestExecutionEnvironment,
  type RunnerTestSessionInterface,
  type StoreUnitConfiguration,
} from "miroir-core";
import {
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";

import {
  type AppStackBootstrapHostOptions,
  bootstrapHostOptionsFrom,
} from "./appStackBootstrapHostOptions.js";
import {
  buildIntegrationTestModelEnvironment,
  generateEphemeralIntegrationTestApplicationIdentity,
  PINNED_INTEG_TEST_APPLICATION_IDENTITY,
  type IntegrationTestApplicationIdentity,
} from "./IntegrationTestSession.js";
import { runRealServerClientBootstrap } from "./runRealServerClientBootstrap.js";
import { buildTeardownTestApplicationStoresAction } from "./testApplicationStoreTeardown.js";
import {
  buildTransformerApplicationDeploymentMap,
  deriveEphemeralTestApplicationStorageConfiguration,
  resolveAdminDeploymentFromMiroirConfig,
  resolveLibraryTemplateStorageFromMiroirConfig,
  resolveMiroirStorageFromMiroirConfig,
  seedTransformerTestApplicationData,
} from "./transformerTestApplicationPlayfield.js";
import { deployment_Miroir } from "miroir-test-app_deployment-admin";

export type RealServerTransformerTestSessionOptions = AppStackBootstrapHostOptions & {
  /** Discriminant — orchestrator routes on this (or `isRealServerTransformerSessionOptions`). */
  transport: "realServer";
  miroirConfig: MiroirConfigClient;
  applicationIdentity?: IntegrationTestApplicationIdentity;
  miroirActivityTracker?: MiroirActivityTracker;
  miroirEventService?: MiroirEventService;
  /**
   * Fetch for REST transport. Browser must inject `window.fetch`; Node defaults to cross-fetch.
   */
  customFetch?: typeof fetch;
};

export function isRealServerTransformerSessionOptions(
  options: unknown,
): options is RealServerTransformerTestSessionOptions {
  return (
    typeof options === "object" &&
    options !== null &&
    (options as RealServerTransformerTestSessionOptions).transport === "realServer"
  );
}

function resolveRuntimeFetch(explicit?: typeof fetch): typeof fetch {
  if (explicit) {
    return explicit;
  }
  if (typeof window !== "undefined" && typeof window.fetch === "function") {
    return window.fetch.bind(window) as typeof fetch;
  }
  return crossFetch as unknown as typeof fetch;
}

function assertSqlLibraryTemplate(store: StoreUnitConfiguration, profileHint?: string): void {
  if (store.model.emulatedServerType !== "sql") {
    throw new Error(
      `RealServerTransformerTestSession requires a sql library template on the server` +
        ` (got model.emulatedServerType=${store.model.emulatedServerType}` +
        (profileHint ? ` for profile "${profileHint}"` : "") +
        `). First profile in scope: realServer-sql.`,
    );
  }
}

export class RealServerTransformerTestSession implements RunnerTestSessionInterface {
  private domainController: DomainControllerInterface | undefined;
  private applicationDeploymentMap: ApplicationDeploymentMap | undefined;
  private identity: IntegrationTestApplicationIdentity | undefined;
  private testDeploymentStorageConfiguration: StoreUnitConfiguration | undefined;
  private createdPlayfield = false;

  constructor(private readonly options: RealServerTransformerTestSessionOptions) {}

  async initSession(): Promise<MiroirTestExecutionEnvironment> {
    const identity =
      this.options.applicationIdentity ?? PINNED_INTEG_TEST_APPLICATION_IDENTITY;
    this.identity = identity;

    const libraryTemplate = resolveLibraryTemplateStorageFromMiroirConfig(
      this.options.miroirConfig,
    );
    assertSqlLibraryTemplate(libraryTemplate);

    const testDeploymentStorageConfiguration =
      deriveEphemeralTestApplicationStorageConfiguration(
        libraryTemplate,
        identity.applicationName,
      );
    this.testDeploymentStorageConfiguration = testDeploymentStorageConfiguration;

    const adminDeployment = resolveAdminDeploymentFromMiroirConfig(this.options.miroirConfig);
    const miroirDeploymentStorageConfiguration = resolveMiroirStorageFromMiroirConfig(
      this.options.miroirConfig,
    );
    const applicationDeploymentMap = buildTransformerApplicationDeploymentMap(identity);
    this.applicationDeploymentMap = applicationDeploymentMap;

    const internalMiroirConfig = extendMiroirConfigWithExtraDeploymentConfiguration(
      this.options.miroirConfig,
      testDeploymentStorageConfiguration,
      identity.deploymentUuid,
    );

    const customFetch = resolveRuntimeFetch(this.options.customFetch);
    const hostBootstrap = bootstrapHostOptionsFrom(this.options);

    const { domainController, persistenceStoreControllerManager } =
      await runRealServerClientBootstrap({
        miroirConfig: internalMiroirConfig,
        applicationDeploymentMap,
        adminDeployment,
        miroirDeploymentStorageConfiguration,
        miroirActivityTracker: this.options.miroirActivityTracker,
        miroirEventService: this.options.miroirEventService,
        customFetch,
        testApplicationUuid: identity.applicationUuid,
        miroirDeploymentUuid: deployment_Miroir.uuid,
        miroirSelfApplicationUuid: selfApplicationMiroir.uuid,
        ...hostBootstrap,
        platformEnsureMode: this.options.platformEnsureMode ?? "skip",
      });

    this.domainController = domainController;

    const playfield = await ensureLibraryPlayfield({
      domainController,
      applicationDeploymentMap,
      adminDeployment,
      libraryDeploymentStorageConfiguration: testDeploymentStorageConfiguration,
      libraryDeploymentUuid: identity.deploymentUuid,
      librarySelfApplicationUuid: identity.applicationUuid,
      mode: "createIfAbsent",
      skipOpenAdminStore: true,
    });
    this.createdPlayfield = playfield.created;

    await seedTransformerTestApplicationData(
      domainController,
      identity,
      applicationDeploymentMap,
    );

    return {
      domainController,
      applicationDeploymentMap,
      testApplicationUuid: identity.applicationUuid,
      persistenceStoreControllerManager,
    };
  }

  async beforeEach(): Promise<void> {
    if (!this.domainController || !this.applicationDeploymentMap || !this.identity) {
      throw new Error("RealServerTransformerTestSession.beforeEach: initSession not called");
    }
    await seedTransformerTestApplicationData(
      this.domainController,
      this.identity,
      this.applicationDeploymentMap,
    );
  }

  async teardown(): Promise<void> {
    if (
      !this.domainController ||
      !this.applicationDeploymentMap ||
      !this.identity ||
      !this.testDeploymentStorageConfiguration
    ) {
      this.domainController = undefined;
      this.applicationDeploymentMap = undefined;
      this.identity = undefined;
      this.testDeploymentStorageConfiguration = undefined;
      this.createdPlayfield = false;
      return;
    }

    await this.domainController.handleCompositeAction(
      buildTeardownTestApplicationStoresAction(
        this.identity.deploymentUuid,
        this.identity.applicationUuid,
        this.testDeploymentStorageConfiguration,
        // createDeployment via ensureLibraryPlayfield registers Admin Deployment/Application rows.
        { deleteAdminInstances: this.createdPlayfield },
      ),
      this.applicationDeploymentMap,
      buildIntegrationTestModelEnvironment(this.identity.deploymentUuid),
      {},
    );

    this.domainController = undefined;
    this.applicationDeploymentMap = undefined;
    this.identity = undefined;
    this.testDeploymentStorageConfiguration = undefined;
    this.createdPlayfield = false;
  }
}

/** Resolve identity for realServer transformer options (browser / Node launcher). */
export function resolveRealServerTransformerApplicationIdentity(
  runTargetMode: "ephemeral" | "pinned",
): IntegrationTestApplicationIdentity {
  return runTargetMode === "ephemeral"
    ? generateEphemeralIntegrationTestApplicationIdentity()
    : PINNED_INTEG_TEST_APPLICATION_IDENTITY;
}
