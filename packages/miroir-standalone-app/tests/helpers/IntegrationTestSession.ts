/**
 * Node-only facade for the browser-safe IntegrationTestSession module.
 *
 * Re-exports the browser-safe implementation from src/, and adds back the
 * Node-only pieces that must not leak into the Vite/browser bundle:
 * real filesystem-root resolution (node:path + node:url), env-based option
 * resolution (process.env), and the app-stack integration test session
 * (which depends on cross-fetch + appStackIntegrationBootstrap).
 */
import crossFetch from "cross-fetch";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { deployment_Admin } from "miroir-test-app_deployment-admin";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";
import type {
  ApplicationDeploymentMap,
  Deployment,
  DomainControllerInterface,
  LibraryPlayfieldEnsureMode,
  MiroirConfigClient,
  MiroirTestExecutionEnvironment,
  PersistenceStoreControllerManagerInterface,
  RunnerTestSessionInterface,
  StoreUnitConfiguration,
} from "miroir-core";
import { getBootstrapPhasesForSessionKind } from "miroir-core";

import {
  bootstrapHostOptionsFrom,
  runAppStackIntegrationBootstrap,
  type AppStackBootstrapHostOptions,
} from "./appStackIntegrationBootstrap.js";

import {
  INTEG_TEST_APPLICATION_NAME,
  type AdminStoreOptions,
  type TestApplicationStoreOptions,
  type TestSessionForIntegOptions,
} from "../../src/miroir-fwk/4-tests/IntegrationTestSession.js";

export type { AppStackBootstrapHostOptions };

export type AppStackSessionOptions = AppStackBootstrapHostOptions & {
  applicationDeploymentMap: ApplicationDeploymentMap;
  adminDeployment: Deployment;
  libraryDeploymentStorageConfiguration: StoreUnitConfiguration;
  libraryPlayfieldEnsureMode?: LibraryPlayfieldEnsureMode;
};

// ################################################################################################
// Browser-safe re-exports — kept in sync with src/miroir-fwk/4-tests/IntegrationTestSession.ts.
// Node-only overrides (resolveDefaultFilesystemDeploymentRoot, resolveDefaultAdminAssetsRoot)
// are defined below and take precedence over the src browser-emulated defaults.
export {
  INTEG_TEST_APPLICATION_NAME,
  INTEG_TEST_SELF_APPLICATION_UUID,
  INTEG_TEST_DEPLOYMENT_UUID,
  INTEG_TEST_MODEL_BRANCH_UUID,
  INTEG_TEST_VERSION_UUID,
  INTEG_TEST_LIBRARY_ENTITIES_AND_INSTANCES,
  PINNED_INTEG_TEST_APPLICATION_IDENTITY,
  generateEphemeralIntegrationTestApplicationIdentity,
  buildIntegrationTestModelEnvironment,
  buildCreateTestApplicationStoresAction,
  buildTeardownTestApplicationStoresAction,
  buildTestApplicationStoreUnitConfiguration,
  buildAdminStoreUnitConfiguration,
  buildTestPostgresStoreConfig,
  buildAdminFilesystemStoreConfig,
  collectStoreUnitConfigurationServerTypes,
  buildMiroirConfigForInteg,
  IntegrationTestSession,
  IntegrationTestSessionForPostgres,
  type IntegrationTestApplicationIdentity,
  type TestApplicationStoreOptions,
  type AdminStoreOptions,
  type TestSessionForIntegOptions,
  type PostgresIntegrationAdapterOptions,
  /** @deprecated use INTEG_TEST_* */
  POSTGRES_TEST_APPLICATION_NAME,
  /** @deprecated use INTEG_TEST_* */
  POSTGRES_TEST_SELF_APPLICATION_UUID,
  /** @deprecated use INTEG_TEST_* */
  POSTGRES_TEST_DEPLOYMENT_UUID,
  /** @deprecated use INTEG_TEST_* */
  POSTGRES_TEST_MODEL_BRANCH_UUID,
  /** @deprecated use INTEG_TEST_* */
  POSTGRES_TEST_VERSION_UUID,
  /** @deprecated use INTEG_TEST_LIBRARY_ENTITIES_AND_INSTANCES */
  POSTGRES_TEST_LIBRARY_ENTITIES_AND_INSTANCES,
  /** @deprecated use buildMiroirConfigForInteg */
  buildMiroirConfigForPostgres,
} from "../../src/miroir-fwk/4-tests/IntegrationTestSession.js";

const DEFAULT_POSTGRES_HOST = "192.168.1.160";
const DEFAULT_ADMIN_SQL_SCHEMA = "miroirAdmin";

// ################################################################################################
// Node-only real filesystem defaults. These OVERRIDE the browser-emulated stubs in src/ for every
// direct caller of this facade (tests, env resolvers). Note: the deprecated
// IntegrationTestSessionForPostgres class is defined in src/ and falls back to its own
// browser-emulated defaults when its options are omitted — it is unused in this codebase.
export function resolveDefaultFilesystemDeploymentRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
}

export function resolveDefaultAdminAssetsRoot(): string {
  return path.join(resolveDefaultFilesystemDeploymentRoot(), "tests/assets");
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

// ################################################################################################
// Node-only app-stack integration test session (depends on cross-fetch + appStackIntegrationBootstrap).
export class AppStackIntegrationTestSession implements RunnerTestSessionInterface {
  private domainController: DomainControllerInterface | undefined;
  private persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface | undefined;

  constructor(
    private readonly miroirConfig: MiroirConfigClient,
    private readonly appStackOptions: AppStackSessionOptions,
  ) {}

  async initSession(): Promise<MiroirTestExecutionEnvironment> {
    const executionEnvironment = await runAppStackIntegrationBootstrap({
      miroirConfig: this.miroirConfig,
      applicationDeploymentMap: this.appStackOptions.applicationDeploymentMap,
      adminDeployment: this.appStackOptions.adminDeployment,
      libraryDeploymentStorageConfiguration:
        this.appStackOptions.libraryDeploymentStorageConfiguration,
      phases: getBootstrapPhasesForSessionKind("appStackPersistenceStoreController"),
      testApplicationUuid: selfApplicationLibrary.uuid,
      deployMiroirStrategy: "persistenceStoreControllerHelper",
      openAdminAndMiroirStoresOnServer: false,
      customFetch: crossFetch,
      libraryPlayfieldEnsureMode: this.appStackOptions.libraryPlayfieldEnsureMode,
      ...bootstrapHostOptionsFrom(this.appStackOptions),
    });

    this.domainController = executionEnvironment.domainController;
    this.persistenceStoreControllerManager =
      executionEnvironment.persistenceStoreControllerManager;

    return executionEnvironment;
  }

  async beforeEach(): Promise<void> {
    // App-stack integ tests manage per-test seeding in their own beforeEach hooks.
  }

  async teardown(): Promise<void> {
    this.domainController = undefined;
    this.persistenceStoreControllerManager = undefined;
  }
}
