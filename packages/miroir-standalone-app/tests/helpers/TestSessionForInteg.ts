/**
 * Integration test session for MiroirTest runs.
 * Bootstraps testApplication + admin deployments with configurable store backends.
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
import { miroirBundledStoreSectionStartup } from "miroir-store-bundled";
import type { BundledDeploymentData } from "miroir-store-bundled";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
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
  type StoreSectionConfiguration,
  type StoreUnitConfiguration,
  type Uuid,
} from "miroir-core";

export type TestApplicationStoreOptions =
  | { emulatedServerType: "sql"; postgresHostName?: string; connectionString?: string }
  | {
      emulatedServerType: "filesystem";
      applicationRootDirectory: string;
    }
  | { emulatedServerType: "indexedDb"; rootIndexDbName: string }
  | {
      emulatedServerType: "mongodb";
      connectionString?: string;
      database?: string;
    };

export type AdminStoreOptions =
  | {
      emulatedServerType: "filesystem";
      adminAssetsRootDirectory: string;
      filesystemDeploymentRootDirectory: string;
    }
  | {
      emulatedServerType: "sql";
      postgresHostName?: string;
      connectionString?: string;
      schema?: string;
    }
  | { emulatedServerType: "indexedDb"; rootIndexDbName: string }
  | {
      emulatedServerType: "mongodb";
      connectionString?: string;
      database?: string;
    }
  | { emulatedServerType: "bundled"; deploymentUuid: Uuid };

export type TestSessionForIntegOptions = {
  applicationName?: string;
  testApplicationStore: TestApplicationStoreOptions;
  adminStore: AdminStoreOptions;
  filesystemDeploymentRootDirectory?: string;
  bundledDeploymentData?: Record<string, BundledDeploymentData>;
};

export const INTEG_TEST_APPLICATION_NAME = "testApplication";
export const INTEG_TEST_SELF_APPLICATION_UUID: Uuid = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
export const INTEG_TEST_DEPLOYMENT_UUID: Uuid = "bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
export const INTEG_TEST_MODEL_BRANCH_UUID: Uuid = "cccccccc-cccc-cccc-cccc-cccccccccccc";
export const INTEG_TEST_VERSION_UUID: Uuid = "dddddddd-dddd-dddd-dddd-dddddddddddd";

/** @deprecated use INTEG_TEST_* */
export const POSTGRES_TEST_APPLICATION_NAME = INTEG_TEST_APPLICATION_NAME;
/** @deprecated use INTEG_TEST_* */
export const POSTGRES_TEST_SELF_APPLICATION_UUID = INTEG_TEST_SELF_APPLICATION_UUID;
/** @deprecated use INTEG_TEST_* */
export const POSTGRES_TEST_DEPLOYMENT_UUID = INTEG_TEST_DEPLOYMENT_UUID;
/** @deprecated use INTEG_TEST_* */
export const POSTGRES_TEST_MODEL_BRANCH_UUID = INTEG_TEST_MODEL_BRANCH_UUID;
/** @deprecated use INTEG_TEST_* */
export const POSTGRES_TEST_VERSION_UUID = INTEG_TEST_VERSION_UUID;

export const INTEG_TEST_LIBRARY_ENTITIES_AND_INSTANCES: ApplicationEntitiesAndInstances = [
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

/** @deprecated use INTEG_TEST_LIBRARY_ENTITIES_AND_INSTANCES */
export const POSTGRES_TEST_LIBRARY_ENTITIES_AND_INSTANCES = INTEG_TEST_LIBRARY_ENTITIES_AND_INSTANCES;

const DEFAULT_POSTGRES_HOST = "192.168.1.160";
const DEFAULT_MONGODB_CONNECTION_STRING = "mongodb://localhost:27017";
const DEFAULT_ADMIN_SQL_SCHEMA = "miroirAdmin";

type EmulatedServerType = StoreSectionConfiguration["emulatedServerType"];

// ################################################################################################
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
          },
        },
      ],
    },
  };
}

export function resolveDefaultFilesystemDeploymentRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
}

export function resolveDefaultAdminAssetsRoot(): string {
  return path.join(resolveDefaultFilesystemDeploymentRoot(), "tests/assets");
}

function relativeStoreDirectory(filesystemDeploymentRoot: string, absolutePath: string): string {
  return path.relative(filesystemDeploymentRoot, absolutePath).split(path.sep).join("/");
}

function resolvePostgresConnectionString(options: {
  postgresHostName?: string;
  connectionString?: string;
}): string {
  return (
    options.connectionString ??
    `postgres://postgres:postgres@${options.postgresHostName ?? DEFAULT_POSTGRES_HOST}:5432/postgres`
  );
}

function resolveMongoConnectionString(connectionString?: string): string {
  return connectionString ?? DEFAULT_MONGODB_CONNECTION_STRING;
}

function withTestApplicationSqlAdminSchema(
  applicationName: string,
  storeConfig: StoreUnitConfiguration,
): StoreUnitConfiguration {
  return {
    ...storeConfig,
    admin: {
      ...storeConfig.admin,
      schema: applicationName,
    },
  } as StoreUnitConfiguration;
}

export function buildTestApplicationStoreUnitConfiguration(
  applicationName: string,
  options: TestApplicationStoreOptions,
): StoreUnitConfiguration {
  switch (options.emulatedServerType) {
    case "sql": {
      const connectionString = resolvePostgresConnectionString(options);
      return withTestApplicationSqlAdminSchema(
        applicationName,
        getBasicStoreUnitConfiguration(applicationName, {
          emulatedServerType: "sql",
          connectionString,
        }),
      );
    }
    case "filesystem": {
      return getBasicStoreUnitConfiguration(applicationName, {
        emulatedServerType: "filesystem",
        rootDirectory: options.applicationRootDirectory,
      });
    }
    case "indexedDb": {
      return getBasicStoreUnitConfiguration(applicationName, {
        emulatedServerType: "indexedDb",
        rootIndexDbName: options.rootIndexDbName,
      });
    }
    case "mongodb": {
      const connectionString = resolveMongoConnectionString(options.connectionString);
      const database = options.database ?? applicationName;
      return {
        admin: {
          emulatedServerType: "mongodb",
          connectionString,
          database: `${database}-admin`,
        },
        model: {
          emulatedServerType: "mongodb",
          connectionString,
          database,
        },
        data: {
          emulatedServerType: "mongodb",
          connectionString,
          database,
        },
      };
    }
    default: {
      const exhaustive: never = options;
      throw new Error(`Unsupported test application store: ${JSON.stringify(exhaustive)}`);
    }
  }
}

export function buildAdminStoreUnitConfiguration(options: AdminStoreOptions): StoreUnitConfiguration {
  switch (options.emulatedServerType) {
    case "filesystem": {
      const adminAssetsRoot = options.adminAssetsRootDirectory;
      const filesystemRoot = options.filesystemDeploymentRootDirectory;
      return {
        admin: {
          emulatedServerType: "filesystem",
          directory: relativeStoreDirectory(filesystemRoot, path.join(adminAssetsRoot, "admin")),
        },
        model: {
          emulatedServerType: "filesystem",
          directory: relativeStoreDirectory(
            filesystemRoot,
            path.join(adminAssetsRoot, "admin_model"),
          ),
        },
        data: {
          emulatedServerType: "filesystem",
          directory: relativeStoreDirectory(
            filesystemRoot,
            path.join(adminAssetsRoot, "admin_data"),
          ),
        },
      };
    }
    case "sql": {
      const connectionString = resolvePostgresConnectionString(options);
      const schema = options.schema ?? DEFAULT_ADMIN_SQL_SCHEMA;
      return getBasicStoreUnitConfiguration(schema, {
        emulatedServerType: "sql",
        connectionString,
      });
    }
    case "indexedDb": {
      return getBasicStoreUnitConfiguration("miroirAdmin", {
        emulatedServerType: "indexedDb",
        rootIndexDbName: options.rootIndexDbName,
      });
    }
    case "mongodb": {
      const connectionString = resolveMongoConnectionString(options.connectionString);
      const database = options.database ?? "miroirAdmin";
      return {
        admin: {
          emulatedServerType: "mongodb",
          connectionString,
          database: `${database}-admin`,
        },
        model: {
          emulatedServerType: "mongodb",
          connectionString,
          database,
        },
        data: {
          emulatedServerType: "mongodb",
          connectionString,
          database,
        },
      };
    }
    case "bundled": {
      return {
        admin: { emulatedServerType: "bundled", deploymentUuid: options.deploymentUuid },
        model: { emulatedServerType: "bundled", deploymentUuid: options.deploymentUuid },
        data: { emulatedServerType: "bundled", deploymentUuid: options.deploymentUuid },
      };
    }
    default: {
      const exhaustive: never = options;
      throw new Error(`Unsupported admin store: ${JSON.stringify(exhaustive)}`);
    }
  }
}

/** @deprecated use buildTestApplicationStoreUnitConfiguration */
export function buildTestPostgresStoreConfig(
  applicationName: string,
  postgresHostName: string,
): StoreUnitConfiguration {
  return buildTestApplicationStoreUnitConfiguration(applicationName, {
    emulatedServerType: "sql",
    postgresHostName,
  });
}

/** @deprecated use buildAdminStoreUnitConfiguration */
export function buildAdminFilesystemStoreConfig(
  adminAssetsRoot: string,
  filesystemDeploymentRoot: string,
): StoreUnitConfiguration {
  return buildAdminStoreUnitConfiguration({
    emulatedServerType: "filesystem",
    adminAssetsRootDirectory: adminAssetsRoot,
    filesystemDeploymentRootDirectory: filesystemDeploymentRoot,
  });
}

export function collectStoreUnitConfigurationServerTypes(
  ...configs: StoreUnitConfiguration[]
): Set<EmulatedServerType> {
  const types = new Set<EmulatedServerType>();
  for (const config of configs) {
    for (const section of [config.admin, config.model, config.data]) {
      types.add(section.emulatedServerType);
    }
  }
  return types;
}

export function buildMiroirConfigForInteg(
  testStoreConfig: StoreUnitConfiguration,
  adminStoreConfig: StoreUnitConfiguration,
  filesystemDeploymentRootDirectory: string,
): MiroirConfigClient {
  return {
    client: {
      emulateServer: true,
      rootApiUrl: "http://localhost:0",
      filesystemDeploymentRootDirectory,
      deploymentStorageConfig: {
        [deployment_Admin.uuid]: adminStoreConfig,
        [INTEG_TEST_DEPLOYMENT_UUID]: testStoreConfig,
      },
    },
  } as MiroirConfigClient;
}

/** @deprecated use buildMiroirConfigForInteg */
export function buildMiroirConfigForPostgres(
  postgresHostName: string,
  options: {
    filesystemDeploymentRootDirectory: string;
    adminAssetsRootDirectory: string;
  },
): MiroirConfigClient {
  const adminStoreConfig = buildAdminStoreUnitConfiguration({
    emulatedServerType: "filesystem",
    adminAssetsRootDirectory: options.adminAssetsRootDirectory,
    filesystemDeploymentRootDirectory: options.filesystemDeploymentRootDirectory,
  });
  const testStoreConfig = buildTestApplicationStoreUnitConfiguration(
    INTEG_TEST_APPLICATION_NAME,
    { emulatedServerType: "sql", postgresHostName },
  );
  return buildMiroirConfigForInteg(
    testStoreConfig,
    adminStoreConfig,
    options.filesystemDeploymentRootDirectory,
  );
}

export function resolveTestSessionForIntegOptionsFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): TestSessionForIntegOptions {
  const filesystemDeploymentRootDirectory =
    env.MIROIR_TEST_FILESYSTEM_ROOT ?? resolveDefaultFilesystemDeploymentRoot();
  const adminAssetsRootDirectory =
    env.MIROIR_TEST_ADMIN_ASSETS_ROOT ?? resolveDefaultAdminAssetsRoot();

  return {
    testApplicationStore: resolveTestApplicationStoreOptionsFromEnv(env),
    adminStore: resolveAdminStoreOptionsFromEnv(env, {
      filesystemDeploymentRootDirectory,
      adminAssetsRootDirectory,
    }),
    filesystemDeploymentRootDirectory,
  };
}

function resolveTestApplicationStoreOptionsFromEnv(
  env: NodeJS.ProcessEnv,
): TestApplicationStoreOptions {
  const storeType = env.MIROIR_TEST_APP_STORE_TYPE ?? "sql";
  switch (storeType) {
    case "sql":
      return {
        emulatedServerType: "sql",
        postgresHostName: env.MIROIR_TEST_POSTGRES_HOST ?? DEFAULT_POSTGRES_HOST,
      };
    case "filesystem":
      return {
        emulatedServerType: "filesystem",
        applicationRootDirectory:
          env.MIROIR_TEST_APP_FILESYSTEM_ROOT ??
          path.join(resolveDefaultFilesystemDeploymentRoot(), "tests/tmp", INTEG_TEST_APPLICATION_NAME),
      };
    case "indexedDb":
      return {
        emulatedServerType: "indexedDb",
        rootIndexDbName: env.MIROIR_TEST_APP_INDEXEDDB_NAME ?? INTEG_TEST_APPLICATION_NAME,
      };
    case "mongodb":
      return {
        emulatedServerType: "mongodb",
        connectionString: env.MIROIR_TEST_MONGODB_CONNECTION_STRING,
        database: env.MIROIR_TEST_APP_MONGODB_DATABASE ?? INTEG_TEST_APPLICATION_NAME,
      };
    default:
      throw new Error(
        `Unsupported MIROIR_TEST_APP_STORE_TYPE "${storeType}". Expected sql, filesystem, indexedDb, or mongodb.`,
      );
  }
}

function resolveAdminStoreOptionsFromEnv(
  env: NodeJS.ProcessEnv,
  defaults: {
    filesystemDeploymentRootDirectory: string;
    adminAssetsRootDirectory: string;
  },
): AdminStoreOptions {
  const storeType = env.MIROIR_TEST_ADMIN_STORE_TYPE ?? "filesystem";
  switch (storeType) {
    case "filesystem":
      return {
        emulatedServerType: "filesystem",
        adminAssetsRootDirectory: defaults.adminAssetsRootDirectory,
        filesystemDeploymentRootDirectory: defaults.filesystemDeploymentRootDirectory,
      };
    case "sql":
      return {
        emulatedServerType: "sql",
        postgresHostName: env.MIROIR_TEST_POSTGRES_HOST ?? DEFAULT_POSTGRES_HOST,
        schema: env.MIROIR_TEST_ADMIN_SQL_SCHEMA ?? DEFAULT_ADMIN_SQL_SCHEMA,
      };
    case "indexedDb":
      return {
        emulatedServerType: "indexedDb",
        rootIndexDbName: env.MIROIR_TEST_ADMIN_INDEXEDDB_NAME ?? "miroirAdmin",
      };
    case "mongodb":
      return {
        emulatedServerType: "mongodb",
        connectionString: env.MIROIR_TEST_MONGODB_CONNECTION_STRING,
        database: env.MIROIR_TEST_ADMIN_MONGODB_DATABASE ?? "miroirAdmin",
      };
    case "bundled":
      return {
        emulatedServerType: "bundled",
        deploymentUuid: deployment_Admin.uuid,
      };
    default:
      throw new Error(
        `Unsupported MIROIR_TEST_ADMIN_STORE_TYPE "${storeType}". Expected filesystem, sql, indexedDb, mongodb, or bundled.`,
      );
  }
}

function registerStoreSectionStartups(
  serverTypes: Set<EmulatedServerType>,
  bundledDeploymentData: Record<string, BundledDeploymentData>,
): void {
  const configurationService = ConfigurationService.configurationService;
  if (serverTypes.has("filesystem")) {
    miroirFileSystemStoreSectionStartup(configurationService);
  }
  if (serverTypes.has("sql")) {
    miroirPostgresStoreSectionStartup(configurationService);
  }
  if (serverTypes.has("indexedDb")) {
    miroirIndexedDbStoreSectionStartup(configurationService);
  }
  if (serverTypes.has("mongodb")) {
    miroirMongoDbStoreSectionStartup(configurationService);
  }
  if (serverTypes.has("bundled")) {
    miroirBundledStoreSectionStartup(configurationService, bundledDeploymentData);
  }
}

// ################################################################################################
export class TestSessionForInteg implements RunnerTestSessionInterface {
  private static storeSectionsRegisteredFor = new Set<string>();

  private domainController: DomainControllerInterface | undefined;
  private miroirConfig: MiroirConfigClient | undefined;
  private applicationDeploymentMap: ApplicationDeploymentMap | undefined;
  private testStoreConfig: StoreUnitConfiguration | undefined;

  constructor(private readonly options: TestSessionForIntegOptions) {}

  private getApplicationName(): string {
    return this.options.applicationName ?? INTEG_TEST_APPLICATION_NAME;
  }

  private getFilesystemDeploymentRoot(): string {
    return this.options.filesystemDeploymentRootDirectory ?? resolveDefaultFilesystemDeploymentRoot();
  }

  private getTestStoreConfig(): StoreUnitConfiguration {
    return buildTestApplicationStoreUnitConfiguration(
      this.getApplicationName(),
      this.options.testApplicationStore,
    );
  }

  private getAdminStoreConfig(): StoreUnitConfiguration {
    return buildAdminStoreUnitConfiguration(this.options.adminStore);
  }

  private getApplicationDeploymentMap(): ApplicationDeploymentMap {
    return {
      ...defaultSelfApplicationDeploymentMap,
      [INTEG_TEST_SELF_APPLICATION_UUID]: INTEG_TEST_DEPLOYMENT_UUID,
    };
  }

  private getInitApplicationParameters() {
    return getBasicApplicationConfiguration(
      this.getApplicationName(),
      INTEG_TEST_SELF_APPLICATION_UUID,
      INTEG_TEST_DEPLOYMENT_UUID,
      INTEG_TEST_MODEL_BRANCH_UUID,
      INTEG_TEST_VERSION_UUID,
    );
  }

  private ensureStoreSectionsRegistered(
    testStoreConfig: StoreUnitConfiguration,
    adminStoreConfig: StoreUnitConfiguration,
  ): void {
    const registrationKey = [...collectStoreUnitConfigurationServerTypes(testStoreConfig, adminStoreConfig)]
      .sort()
      .join(",");
    if (TestSessionForInteg.storeSectionsRegisteredFor.has(registrationKey)) {
      return;
    }
    miroirCoreStartup();
    registerStoreSectionStartups(
      collectStoreUnitConfigurationServerTypes(testStoreConfig, adminStoreConfig),
      this.options.bundledDeploymentData ?? {},
    );
    TestSessionForInteg.storeSectionsRegisteredFor.add(registrationKey);
  }

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
        payload: { application: INTEG_TEST_SELF_APPLICATION_UUID },
      },
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );
    if (resetResult instanceof Action2Error) {
      throw new Error(
        "TestSessionForInteg.initTestApplicationData: resetModel failed: " +
          JSON.stringify(resetResult),
      );
    }

    const initResult = await domainController.handleAction(
      {
        actionType: "initModel",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        payload: {
          application: INTEG_TEST_SELF_APPLICATION_UUID,
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
        "TestSessionForInteg.initTestApplicationData: initModel failed: " + JSON.stringify(initResult),
      );
    }

    const createEntityResult = await domainController.handleAction(
      {
        actionType: "createEntity",
        actionLabel: "CreateLibraryStoreEntities",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        payload: {
          application: INTEG_TEST_SELF_APPLICATION_UUID,
          transactional: false,
          entities: INTEG_TEST_LIBRARY_ENTITIES_AND_INSTANCES.flatMap((entry) => ({
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
        "TestSessionForInteg.initTestApplicationData: createEntity failed: " +
          JSON.stringify(createEntityResult),
      );
    }

    const createInstanceResult = await domainController.handleAction(
      {
        actionType: "createInstance",
        actionLabel: "CreateLibraryStoreInstances",
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        payload: {
          application: INTEG_TEST_SELF_APPLICATION_UUID,
          applicationSection: "data",
          objects: INTEG_TEST_LIBRARY_ENTITIES_AND_INSTANCES.flatMap((entry) => entry.instances),
        },
      },
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );
    if (createInstanceResult instanceof Action2Error) {
      throw new Error(
        "TestSessionForInteg.initTestApplicationData: createInstance failed: " +
          JSON.stringify(createInstanceResult),
      );
    }
  }

  private isIgnorableCreateStoreError(
    result: Action2Error,
    sectionConfig: StoreSectionConfiguration,
  ): boolean {
    const serialized = JSON.stringify(result.errorMessage ?? result);
    if (sectionConfig.emulatedServerType === "sql") {
      return serialized.includes("42P06") || serialized.includes("already exists");
    }
    return false;
  }

  async initSession(): Promise<MiroirTestExecutionEnvironment> {
    const filesystemRoot = this.getFilesystemDeploymentRoot();
    const testStoreConfig = this.getTestStoreConfig();
    const adminStoreConfig = this.getAdminStoreConfig();
    this.testStoreConfig = testStoreConfig;

    this.ensureStoreSectionsRegistered(testStoreConfig, adminStoreConfig);

    this.miroirConfig = buildMiroirConfigForInteg(
      testStoreConfig,
      adminStoreConfig,
      filesystemRoot,
    );
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
      persistenceStoreAccessMode: "local",
      localPersistenceStoreControllerManager: persistenceStoreControllerManager,
    });

    const addAdminResult = await persistenceStoreControllerManager.addPersistenceStoreController(
      deployment_Admin.uuid,
      adminStoreConfig,
    );
    if (addAdminResult instanceof Action2Error) {
      throw new Error(
        "TestSessionForInteg.initSession: addPersistenceStoreController(admin) failed: " +
          JSON.stringify(addAdminResult),
      );
    }

    const addResult = await persistenceStoreControllerManager.addPersistenceStoreController(
      INTEG_TEST_DEPLOYMENT_UUID,
      testStoreConfig,
    );
    if (addResult instanceof Action2Error) {
      throw new Error(
        "TestSessionForInteg.initSession: addPersistenceStoreController failed: " +
          JSON.stringify(addResult),
      );
    }

    const persistenceStoreController = persistenceStoreControllerManager.getPersistenceStoreController(
      INTEG_TEST_DEPLOYMENT_UUID,
    );
    if (!persistenceStoreController) {
      throw new Error("TestSessionForInteg.initSession: persistence store controller missing");
    }

    for (const sectionConfig of [testStoreConfig.admin, testStoreConfig.model, testStoreConfig.data]) {
      const createResult = await persistenceStoreController.createStore(sectionConfig);
      if (
        createResult instanceof Action2Error &&
        this.isIgnorableCreateStoreError(createResult, sectionConfig)
      ) {
        continue;
      }
      if (createResult instanceof Action2Error) {
        throw new Error(
          "TestSessionForInteg.initSession: createStore failed: " + JSON.stringify(createResult),
        );
      }
    }

    const openResult = await persistenceStoreController.open();
    if (openResult instanceof Action2Error) {
      throw new Error(
        "TestSessionForInteg.initSession: open store failed: " + JSON.stringify(openResult),
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
        "TestSessionForInteg.initSession: initApplication failed: " + JSON.stringify(initApplicationResult),
      );
    }

    await this.initTestApplicationData(domainController, this.applicationDeploymentMap);

    this.domainController = domainController;

    return {
      domainController,
      applicationDeploymentMap: this.applicationDeploymentMap,
      testApplicationUuid: INTEG_TEST_SELF_APPLICATION_UUID,
    };
  }

  async beforeEach(): Promise<void> {
    if (!this.domainController || !this.applicationDeploymentMap) {
      throw new Error("TestSessionForInteg.beforeEach: initSession not called");
    }

    await this.initTestApplicationData(this.domainController, this.applicationDeploymentMap);
  }

  async teardown(): Promise<void> {
    if (!this.domainController || !this.miroirConfig || !this.applicationDeploymentMap) {
      return;
    }

    const storeConfig = this.testStoreConfig ?? this.getTestStoreConfig();
    await this.domainController.handleCompositeAction(
      buildTeardownTestApplicationStoresAction(
        INTEG_TEST_DEPLOYMENT_UUID,
        INTEG_TEST_SELF_APPLICATION_UUID,
        storeConfig,
      ),
      this.applicationDeploymentMap,
      defaultMiroirModelEnvironment,
      {},
    );

    this.domainController = undefined;
    this.miroirConfig = undefined;
    this.applicationDeploymentMap = undefined;
    this.testStoreConfig = undefined;
  }
}

/** @deprecated use TestSessionForInteg */
export type PostgresIntegrationAdapterOptions = {
  postgresHostName?: string;
  filesystemDeploymentRootDirectory?: string;
  adminAssetsRootDirectory?: string;
};

/** @deprecated use TestSessionForInteg */
export class TestSessionForPostgres extends TestSessionForInteg {
  constructor(options: PostgresIntegrationAdapterOptions = {}) {
    super({
      testApplicationStore: {
        emulatedServerType: "sql",
        postgresHostName: options.postgresHostName,
      },
      adminStore: {
        emulatedServerType: "filesystem",
        adminAssetsRootDirectory: options.adminAssetsRootDirectory ?? resolveDefaultAdminAssetsRoot(),
        filesystemDeploymentRootDirectory:
          options.filesystemDeploymentRootDirectory ?? resolveDefaultFilesystemDeploymentRoot(),
      },
      filesystemDeploymentRootDirectory: options.filesystemDeploymentRootDirectory,
    });
  }
}

/** @deprecated use TestSessionForInteg */
export class PostgresIntegrationAdapter extends TestSessionForPostgres {}
