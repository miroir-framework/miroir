/**
 * Postgres integration adapter for MiroirTest transformer integration runs.
 * Replaces direct PersistenceStoreController bootstrap (Gap C / slice T).
 */
import {
  author1,
  author2,
  author3,
  book1,
  book2,
  book4,
  book5,
  book6,
  entityAuthor,
  entityBook,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionPublisher,
  entityPublisher,
  folio as publisher1,
  penguin as publisher2,
  springer as publisher3,
} from "miroir-test-app_deployment-library";
import { setupMiroirDomainController } from "miroir-localcache-redux";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { deployment_Admin } from "miroir-test-app_deployment-admin";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  Action2Error,
  ConfigurationService,
  MiroirActivityTracker,
  MiroirContext,
  MiroirEventService,
  PersistenceStoreControllerManager,
  defaultMiroirMetaModel,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  getBasicApplicationConfiguration,
  getBasicStoreUnitConfiguration,
  miroirCoreStartup,
  type ApplicationDeploymentMap,
  type ApplicationEntitiesAndInstances,
  type CompositeActionSequence,
  type DomainControllerInterface,
  type Entity,
  type EntityDefinition,
  type EntityInstance,
  type MetaEntity,
  type MiroirConfigClient,
  type MiroirTestExecutionEnvironment,
  type RunnerTestSessionInterface,
  type SqlDbStoreSectionConfiguration,
  type StoreUnitConfiguration,
  type Uuid,
} from "miroir-core";

// ################################################################################################
/** Fresh-schema bootstrap via createStore (avoids openStore bootFromPersistedState on empty DB). */
export function buildCreateTestApplicationStoresAction(
  applicationName: string,
  deploymentUuid: Uuid,
  applicationUuid: Uuid,
  storeConfig: StoreUnitConfiguration,
): CompositeActionSequence {
  return {
    actionType: "compositeActionSequence",
    actionLabel: "createTestApplicationStores",
    endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
    payload: {
      actionSequence: [
        {
          actionType: "storeManagementAction_createStore",
          actionLabel: `createStore for ${applicationName}`,
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          payload: {
            application: applicationUuid,
            deploymentUuid,
            configuration: storeConfig,
          },
        },
      ],
    },
  };
}

export function buildTeardownTestApplicationStoresAction(
  deploymentUuid: Uuid,
  applicationUuid: Uuid,
  storeConfig: StoreUnitConfiguration,
): CompositeActionSequence {
  return {
    actionType: "compositeActionSequence",
    actionLabel: "teardownTestApplicationStores",
    endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
    payload: {
      actionSequence: [
        {
          actionType: "storeManagementAction_deleteStore",
          actionLabel: "deleteStore model/data",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          payload: {
            application: applicationUuid,
            deploymentUuid,
            configuration: storeConfig,
          },
        },
        {
          actionType: "storeManagementAction_closeStore",
          actionLabel: "closeStore",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          payload: {
            application: applicationUuid,
            // deploymentUuid,
            // configuration: { [deploymentUuid]: storeConfig },
          },
        },
      ],
    },
  };
}

export const POSTGRES_TEST_APPLICATION_NAME = "testApplication";
export const POSTGRES_TEST_SELF_APPLICATION_UUID: Uuid = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
export const POSTGRES_TEST_DEPLOYMENT_UUID: Uuid = "bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
export const POSTGRES_TEST_MODEL_BRANCH_UUID: Uuid = "cccccccc-cccc-cccc-cccc-cccccccccccc";
export const POSTGRES_TEST_VERSION_UUID: Uuid = "dddddddd-dddd-dddd-dddd-dddddddddddd";

export const POSTGRES_TEST_LIBRARY_ENTITIES_AND_INSTANCES: ApplicationEntitiesAndInstances = [
  {
    entity: entityAuthor as Entity,
    entityDefinition: entityDefinitionAuthor as EntityDefinition,
    instances: [author1, author2, author3 as EntityInstance],
  },
  {
    entity: entityBook as Entity,
    entityDefinition: entityDefinitionBook as EntityDefinition,
    instances: [
      book1 as EntityInstance,
      book2 as EntityInstance,
      book4 as EntityInstance,
      book5 as EntityInstance,
      book6 as EntityInstance,
    ],
  },
  {
    entity: entityPublisher as Entity,
    entityDefinition: entityDefinitionPublisher as EntityDefinition,
    instances: [publisher1 as EntityInstance, publisher2 as EntityInstance, publisher3 as EntityInstance],
  },
];

export type PostgresIntegrationAdapterOptions = {
  postgresHostName?: string;
  /** Writable root for emulated deployment metadata (not admin model/data). */
  filesystemDeploymentRootDirectory?: string;
  /**
   * Base directory for miroirAdmin filesystem deployment (admin/, admin_model/, admin_data/).
   * Override via MIROIR_TEST_ADMIN_ASSETS_ROOT. Independent of the Postgres test schema.
   */
  adminAssetsRootDirectory?: string;
};

/** Default: miroir-standalone-app package root (matches miroirConfig relative paths). */
export function resolveDefaultFilesystemDeploymentRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
}

/** Default: standalone-app/tests/assets (full admin/, admin_model/, admin_data/ tree). */
export function resolveDefaultAdminAssetsRoot(): string {
  return path.join(resolveDefaultFilesystemDeploymentRoot(), "tests/assets");
}

function relativeStoreDirectory(filesystemDeploymentRoot: string, absolutePath: string): string {
  return path.relative(filesystemDeploymentRoot, absolutePath).split(path.sep).join("/");
}

export function buildAdminFilesystemStoreConfig(
  adminAssetsRoot: string,
  filesystemDeploymentRoot: string,
): StoreUnitConfiguration {
  return {
    admin: {
      emulatedServerType: "filesystem",
      directory: relativeStoreDirectory(filesystemDeploymentRoot, path.join(adminAssetsRoot, "admin")),
    },
    model: {
      emulatedServerType: "filesystem",
      directory: relativeStoreDirectory(
        filesystemDeploymentRoot,
        path.join(adminAssetsRoot, "admin_model"),
      ),
    },
    data: {
      emulatedServerType: "filesystem",
      directory: relativeStoreDirectory(
        filesystemDeploymentRoot,
        path.join(adminAssetsRoot, "admin_data"),
      ),
    },
  };
}

/**
 * Postgres store for the test application.
 * Admin section uses the test schema (legacy integ parity), not miroirAdmin — miroirAdmin is
 * filesystem-backed via deployment_Admin and MIROIR_TEST_ADMIN_ASSETS_ROOT.
 */
export function buildTestPostgresStoreConfig(
  applicationName: string,
  postgresHostName: string,
): StoreUnitConfiguration {
  const connectionString = `postgres://postgres:postgres@${postgresHostName}:5432/postgres`;
  const storeConfig: StoreUnitConfiguration = getBasicStoreUnitConfiguration(applicationName, {
    emulatedServerType: "sql",
    connectionString,
  });
  return {
    ...storeConfig,
    admin: {
      ...storeConfig.admin,
      schema: applicationName,
    },
  } as StoreUnitConfiguration;
}

// ################################################################################################
export function buildMiroirConfigForPostgres(
  postgresHostName: string,
  options: {
    filesystemDeploymentRootDirectory: string;
    adminAssetsRootDirectory: string;
  },
): MiroirConfigClient {
  const adminStoreConfig = buildAdminFilesystemStoreConfig(
    options.adminAssetsRootDirectory,
    options.filesystemDeploymentRootDirectory,
  );
  const testStoreConfig = buildTestPostgresStoreConfig(
    POSTGRES_TEST_APPLICATION_NAME,
    postgresHostName,
  );

  return {
    client: {
      emulateServer: true,
      rootApiUrl: "http://localhost:0",
      filesystemDeploymentRootDirectory: options.filesystemDeploymentRootDirectory,
      deploymentStorageConfig: {
        [deployment_Admin.uuid]: adminStoreConfig,
        [POSTGRES_TEST_DEPLOYMENT_UUID]: testStoreConfig,
      },
    },
  } as MiroirConfigClient;
}

// ################################################################################################
export class TestSessionForPostgres implements RunnerTestSessionInterface {
  private static storeSectionsRegistered = false;

  private domainController: DomainControllerInterface | undefined;
  private miroirConfig: MiroirConfigClient | undefined;
  private applicationDeploymentMap: ApplicationDeploymentMap | undefined;

  constructor(private readonly options: PostgresIntegrationAdapterOptions = {}) {}

  private ensureStoreSectionsRegistered(): void {
    if (!TestSessionForPostgres.storeSectionsRegistered) {
      miroirCoreStartup();
      miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
      miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);
      TestSessionForPostgres.storeSectionsRegistered = true;
    }
  }

  private getFilesystemDeploymentRoot(): string {
    return this.options.filesystemDeploymentRootDirectory ?? resolveDefaultFilesystemDeploymentRoot();
  }

  private getAdminAssetsRoot(): string {
    return this.options.adminAssetsRootDirectory ?? resolveDefaultAdminAssetsRoot();
  }

  private getStoreConfig(): StoreUnitConfiguration {
    const postgresHostName = this.options.postgresHostName ?? "192.168.1.160";
    return buildTestPostgresStoreConfig(POSTGRES_TEST_APPLICATION_NAME, postgresHostName);
  }

  private getApplicationDeploymentMap(): ApplicationDeploymentMap {
    return {
      ...defaultSelfApplicationDeploymentMap,
      [POSTGRES_TEST_SELF_APPLICATION_UUID]: POSTGRES_TEST_DEPLOYMENT_UUID,
    };
  }

  private getInitApplicationParameters() {
    return getBasicApplicationConfiguration(
      POSTGRES_TEST_APPLICATION_NAME,
      POSTGRES_TEST_SELF_APPLICATION_UUID,
      POSTGRES_TEST_DEPLOYMENT_UUID,
      POSTGRES_TEST_MODEL_BRANCH_UUID,
      POSTGRES_TEST_VERSION_UUID,
    );
  }

  // ##############################################################################################
  /** Mirrors legacy initMiroirCoreTestIntegrationStore data seeding via domainController. */
  private async initTestApplicationData(
    domainController: DomainControllerInterface,
    applicationDeploymentMap: ApplicationDeploymentMap,
  ): Promise<void> {
    const initParams = this.getInitApplicationParameters();

    const resetResult = await domainController.handleAction(
      {
        actionType: "resetModel",
        actionLabel: "resetTestStore",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        payload: { application: POSTGRES_TEST_SELF_APPLICATION_UUID },
      },
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );
    if (resetResult instanceof Action2Error) {
      throw new Error(
        "TestSessionForPostgres.initTestApplicationData: resetModel failed: " +
          JSON.stringify(resetResult),
      );
    }

    const initResult = await domainController.handleAction(
      {
        actionType: "initModel",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        payload: {
          application: POSTGRES_TEST_SELF_APPLICATION_UUID,
          params: {
            dataStoreType: "app",
            metaModel: defaultMiroirMetaModel,
            selfApplication: initParams.selfApplication,
            applicationModelBranch: initParams.applicationModelBranch,
            applicationVersion: initParams.applicationVersion,
          },
        },
      },
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );
    if (initResult instanceof Action2Error) {
      throw new Error(
        "TestSessionForPostgres.initTestApplicationData: initModel failed: " +
          JSON.stringify(initResult),
      );
    }

    const createEntityResult = await domainController.handleAction(
      {
        actionType: "createEntity",
        actionLabel: "CreateLibraryStoreEntities",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        payload: {
          application: POSTGRES_TEST_SELF_APPLICATION_UUID,
          transactional: false, // TODO: remove, use commit instead! There seem to be an issue with transactional: false and commit, is it because of "local" access in domainController?
          entities: POSTGRES_TEST_LIBRARY_ENTITIES_AND_INSTANCES.flatMap((entry) => ({
            entity: entry.entity as Entity,
            entityDefinition: entry.entityDefinition,
          })),
        },
      },
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );
    if (createEntityResult instanceof Action2Error) {
      throw new Error(
        "TestSessionForPostgres.initTestApplicationData: createEntity failed: " +
          JSON.stringify(createEntityResult),
      );
    }

    // const commitResult = await domainController.handleAction(
    //   {
    //     actionType: "commit",
    //     endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    //     payload: {
    //       application: POSTGRES_TEST_SELF_APPLICATION_UUID,
    //     },
    //   },
    //   applicationDeploymentMap,
    //   defaultMiroirModelEnvironment,
    // );
    // if (commitResult instanceof Action2Error) {
    //   throw new Error(
    //     "TestSessionForPostgres.initTestApplicationData: commit failed: " +
    //       JSON.stringify(commitResult),
    //   );
    // }

    const createInstanceResult = await domainController.handleAction(
      {
        actionType: "createInstance",
        actionLabel: "CreateLibraryStoreInstances",
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        payload: {
          application: POSTGRES_TEST_SELF_APPLICATION_UUID,
          applicationSection: "data",
          objects: POSTGRES_TEST_LIBRARY_ENTITIES_AND_INSTANCES.flatMap((entry) => entry.instances),
        },
      },
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );
    if (createInstanceResult instanceof Action2Error) {
      throw new Error(
        "TestSessionForPostgres.initTestApplicationData: createInstance failed: " +
          JSON.stringify(createInstanceResult),
      );
    }
  }

  private isDuplicatePostgresSchemaError(result: Action2Error): boolean {
    const serialized = JSON.stringify(result.errorMessage ?? result);
    return serialized.includes("42P06") || serialized.includes("already exists");
  }

  // ##############################################################################################
  async initSession(): Promise<MiroirTestExecutionEnvironment> {
    this.ensureStoreSectionsRegistered();

    const postgresHostName = this.options.postgresHostName ?? "192.168.1.160";
    const filesystemRoot = this.getFilesystemDeploymentRoot();

    this.miroirConfig = buildMiroirConfigForPostgres(postgresHostName, {
      filesystemDeploymentRootDirectory: filesystemRoot,
      adminAssetsRootDirectory: this.getAdminAssetsRoot(),
    });
    this.applicationDeploymentMap = this.getApplicationDeploymentMap();

    const miroirActivityTracker = new MiroirActivityTracker();
    const miroirEventService = new MiroirEventService(miroirActivityTracker);
    const miroirContext = new MiroirContext(
      miroirActivityTracker,
      miroirEventService,
      this.miroirConfig,
    );

    const persistenceStoreControllerManager = new PersistenceStoreControllerManager(
      ConfigurationService.configurationService.adminStoreFactoryRegister,
      ConfigurationService.configurationService.StoreSectionFactoryRegister,
      filesystemRoot,
    );

    const domainController = setupMiroirDomainController(miroirContext, {
      persistenceStoreAccessMode: "local", // TODO: change to "remote" for integration tests!
      // persistenceStoreAccessMode: "remote", // TODO: change to "remote" for integration tests!
      localPersistenceStoreControllerManager: persistenceStoreControllerManager,
    });

    const adminStoreConfig = buildAdminFilesystemStoreConfig(
      this.getAdminAssetsRoot(),
      filesystemRoot,
    );
    const storeConfig = this.getStoreConfig();

    const addAdminResult = await persistenceStoreControllerManager.addPersistenceStoreController(
      deployment_Admin.uuid,
      adminStoreConfig,
    );
    if (addAdminResult instanceof Action2Error) {
      throw new Error(
        "TestSessionForPostgres.initSession: addPersistenceStoreController(admin) failed: " +
          JSON.stringify(addAdminResult),
      );
    }

    const addResult = await persistenceStoreControllerManager.addPersistenceStoreController(
      POSTGRES_TEST_DEPLOYMENT_UUID,
      storeConfig,
    );
    if (addResult instanceof Action2Error) {
      throw new Error(
        "TestSessionForPostgres.initSession: addPersistenceStoreController failed: " +
          JSON.stringify(addResult),
      );
    }

    const persistenceStoreController = persistenceStoreControllerManager.getPersistenceStoreController(
      POSTGRES_TEST_DEPLOYMENT_UUID,
    );
    if (!persistenceStoreController) {
      throw new Error("TestSessionForPostgres.initSession: persistence store controller missing");
    }

    // createStore routes via adminStore; test admin.schema matches model/data (testApplication).
    for (const sectionConfig of [storeConfig.admin, storeConfig.model, storeConfig.data]) {
      const createResult = await persistenceStoreController.createStore(sectionConfig);
      if (createResult instanceof Action2Error && this.isDuplicatePostgresSchemaError(createResult)) {
        continue;
      }
      if (createResult instanceof Action2Error) {
        throw new Error(
          "TestSessionForPostgres.initSession: createStore failed: " +
            JSON.stringify(createResult),
        );
      }
    }

    const openResult = await persistenceStoreController.open();
    if (openResult instanceof Action2Error) {
      throw new Error(
        "TestSessionForPostgres.initSession: open store failed: " + JSON.stringify(openResult),
      );
    }

    const initParams = this.getInitApplicationParameters();
    const initApplicationResult = await persistenceStoreController.initApplication(
      "miroir",
      initParams.selfApplication,
      initParams.applicationModelBranch,
      initParams.applicationVersion,
    );
    if (initApplicationResult instanceof Action2Error) {
      throw new Error(
        "TestSessionForPostgres.initSession: initApplication failed: " +
          JSON.stringify(initApplicationResult),
      );
    }

    await this.initTestApplicationData(domainController, this.applicationDeploymentMap);

    this.domainController = domainController;

    return {
      domainController,
      applicationDeploymentMap: this.applicationDeploymentMap,
      testApplicationUuid: POSTGRES_TEST_SELF_APPLICATION_UUID,
    };
  }

  async beforeEach(): Promise<void> {
    if (!this.domainController || !this.applicationDeploymentMap) {
      throw new Error("TestSessionForPostgres.beforeEach: initSession not called");
    }

    await this.initTestApplicationData(this.domainController, this.applicationDeploymentMap);
  }

  async teardown(): Promise<void> {
    if (!this.domainController || !this.miroirConfig || !this.applicationDeploymentMap) {
      return;
    }

    const storeConfig = this.getStoreConfig();
    await this.domainController.handleCompositeAction(
      buildTeardownTestApplicationStoresAction(
        POSTGRES_TEST_DEPLOYMENT_UUID,
        POSTGRES_TEST_SELF_APPLICATION_UUID,
        storeConfig,
      ),
      this.applicationDeploymentMap,
      defaultMiroirModelEnvironment,
      {},
    );

    this.domainController = undefined;
    this.miroirConfig = undefined;
    this.applicationDeploymentMap = undefined;
  }
}
