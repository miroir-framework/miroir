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

import type {
  AppStackIntegrationSessionOptions,
  DomainControllerInterface,
  MiroirConfigClient,
  MiroirTestExecutionEnvironment,
  PersistenceStoreControllerManagerInterface,
  RunnerTestSessionInterface
} from "miroir-core";
import { getBootstrapPhasesForSessionKind, type StoreUnitConfiguration } from "miroir-core";
import { deployment_Admin, deployment_Miroir } from "miroir-app-admin";
import { selfApplicationLibrary } from "miroir-example-library";

import {
  runAppStackIntegrationBootstrap
} from "./appStackIntegrationBootstrap.js";
import { DEFAULT_TEST_ENVIRONMENT, openTestEnvironment, selectedTestEnvironment } from "./testEnvironment.js";

import {
  INTEG_TEST_APPLICATION_NAME,
  type AdminStoreOptions,
  type TestApplicationStoreOptions,
  type TestSessionForIntegOptions,
} from "../../src/miroir-fwk/4-tests/IntegrationTestSession.js";

// ################################################################################################
// Browser-safe re-exports — kept in sync with src/miroir-fwk/4-tests/IntegrationTestSession.ts.
// The Node-only override of resolveDefaultFilesystemDeploymentRoot is defined below and takes
// precedence over the src browser-emulated default.
export {
  buildAdminStoreUnitConfiguration, buildCreateTestApplicationStoresAction, buildIntegrationTestModelEnvironment, buildMiroirConfigForInteg,
  buildTeardownTestApplicationStoresAction,
  buildTestApplicationStoreUnitConfiguration, buildTestPostgresStoreConfig, collectStoreUnitConfigurationServerTypes, generateEphemeralIntegrationTestApplicationIdentity, INTEG_TEST_APPLICATION_NAME, INTEG_TEST_DEPLOYMENT_UUID, INTEG_TEST_LIBRARY_ENTITIES_AND_INSTANCES, INTEG_TEST_MODEL_BRANCH_UUID, INTEG_TEST_SELF_APPLICATION_UUID, INTEG_TEST_VERSION_UUID, IntegrationTestSession,
  PINNED_INTEG_TEST_APPLICATION_IDENTITY,
  /** @deprecated use INTEG_TEST_* */
  POSTGRES_TEST_APPLICATION_NAME,
  /** @deprecated use INTEG_TEST_* */
  POSTGRES_TEST_DEPLOYMENT_UUID,
  /** @deprecated use INTEG_TEST_LIBRARY_ENTITIES_AND_INSTANCES */
  POSTGRES_TEST_LIBRARY_ENTITIES_AND_INSTANCES,
  /** @deprecated use INTEG_TEST_* */
  POSTGRES_TEST_MODEL_BRANCH_UUID,
  /** @deprecated use INTEG_TEST_* */
  POSTGRES_TEST_SELF_APPLICATION_UUID,
  /** @deprecated use INTEG_TEST_* */
  POSTGRES_TEST_VERSION_UUID, type AdminStoreOptions, type IntegrationTestApplicationIdentity, type TestApplicationStoreOptions, type TestSessionForIntegOptions
} from "../../src/miroir-fwk/4-tests/IntegrationTestSession.js";

const DEFAULT_POSTGRES_HOST = "localhost";
const DEFAULT_ADMIN_SQL_SCHEMA = "miroirAdmin";

// ################################################################################################
// Node-only real filesystem default. It OVERRIDES the browser-emulated stub in src/ for every
// direct caller of this facade.
export function resolveDefaultFilesystemDeploymentRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
}

/**
 * #321: transformer sessions run on a test environment: MIROIR_ENV when it names one (set by
 * `--profile`), `test-sql` otherwise. The Admin store is the environment's Admin copy in
 * .miroir/<environment>/admin, the ephemeral test application goes next to it (filesystem, IndexedDB)
 * or on the environment's database connection. `MIROIR_TEST_*` variables still choose the store types
 * and override the locations.
 */
export function resolveTestSessionForIntegOptionsFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): TestSessionForIntegOptions {
  const testEnvironment = openTestEnvironment(selectedTestEnvironment(env) ?? DEFAULT_TEST_ENVIRONMENT, env);
  const client = testEnvironment.miroirConfig.client as {
    filesystemDeploymentRootDirectory: string;
    deploymentStorageConfig: Record<string, StoreUnitConfiguration>;
  };
  const filesystemDeploymentRootDirectory = client.filesystemDeploymentRootDirectory;

  return {
    testApplicationStore: resolveTestApplicationStoreOptionsFromEnv(
      env,
      testEnvironment.resolved.stateName,
      client.deploymentStorageConfig[deployment_Miroir.uuid],
    ),
    adminStore: resolveAdminStoreOptionsFromEnv(
      env,
      testEnvironment.name,
      filesystemDeploymentRootDirectory,
      client.deploymentStorageConfig[deployment_Admin.uuid],
    ),
    filesystemDeploymentRootDirectory,
  };
}

/** The connection string with another host: `MIROIR_TEST_POSTGRES_HOST` overrides the environment's. */
function withPostgresHost(connectionString: string, host: string): string {
  return connectionString.replace(/@[^@:/]+(:\d+)?\//, (_match, port: string | undefined) => `@${host}${port ?? ""}/`);
}

function resolveTestApplicationStoreOptionsFromEnv(
  env: NodeJS.ProcessEnv,
  /** The environment's state name: `<environment>@<worker>` in a parallel nonreg job (#477). */
  environmentStateName: string,
  miroirStorage: StoreUnitConfiguration | undefined,
): TestApplicationStoreOptions {
  const environmentSection = miroirStorage?.model;
  const storeType = env.MIROIR_TEST_APP_STORE_TYPE ?? environmentSection?.emulatedServerType ?? "sql";
  const environmentDirectory = `.miroir/${environmentStateName}/${INTEG_TEST_APPLICATION_NAME}`;
  // #477: the database stores of the test application carry the state name, like the environment's own.
  const environmentStoreName = `${environmentStateName.replace(/[^A-Za-z0-9_]/g, "_")}_${INTEG_TEST_APPLICATION_NAME}`;
  switch (storeType) {
    case "sql": {
      const host = env.MIROIR_TEST_POSTGRES_HOST;
      if (environmentSection?.emulatedServerType === "sql") {
        return {
          emulatedServerType: "sql",
          connectionString: host
            ? withPostgresHost(environmentSection.connectionString, host)
            : environmentSection.connectionString,
          schema: environmentStoreName,
        };
      }
      return { emulatedServerType: "sql", postgresHostName: host ?? DEFAULT_POSTGRES_HOST };
    }
    case "filesystem":
      return {
        emulatedServerType: "filesystem",
        applicationRootDirectory: env.MIROIR_TEST_APP_FILESYSTEM_ROOT ?? environmentDirectory,
      };
    case "indexedDb":
      return {
        emulatedServerType: "indexedDb",
        rootIndexDbName: env.MIROIR_TEST_APP_INDEXEDDB_NAME ?? `${environmentDirectory}/indexedDb`,
      };
    case "mongodb":
      return {
        emulatedServerType: "mongodb",
        connectionString:
          env.MIROIR_TEST_MONGODB_CONNECTION_STRING ??
          (environmentSection?.emulatedServerType === "mongodb" ? environmentSection.connectionString : undefined),
        database:
          env.MIROIR_TEST_APP_MONGODB_DATABASE ??
          (environmentSection?.emulatedServerType === "mongodb" ? environmentStoreName : INTEG_TEST_APPLICATION_NAME),
      };
    default:
      throw new Error(
        `Unsupported MIROIR_TEST_APP_STORE_TYPE "${storeType}". Expected sql, filesystem, indexedDb, or mongodb.`,
      );
  }
}

function resolveAdminStoreOptionsFromEnv(
  env: NodeJS.ProcessEnv,
  environmentName: string,
  filesystemDeploymentRootDirectory: string,
  adminStorage: StoreUnitConfiguration | undefined,
): AdminStoreOptions {
  const storeType = env.MIROIR_TEST_ADMIN_STORE_TYPE ?? adminStorage?.admin.emulatedServerType ?? "filesystem";
  switch (storeType) {
    case "filesystem": {
      const sections = adminStorage ? [adminStorage.admin, adminStorage.model, adminStorage.data] : [];
      const [admin, model, data] = sections;
      if (
        admin?.emulatedServerType !== "filesystem" ||
        model?.emulatedServerType !== "filesystem" ||
        data?.emulatedServerType !== "filesystem"
      ) {
        throw new Error(
          `MIROIR_TEST_ADMIN_STORE_TYPE=filesystem: the Admin of environment "${environmentName}" is not a filesystem store`,
        );
      }
      return {
        emulatedServerType: "filesystem",
        directories: { admin: admin.directory, model: model.directory, data: data.directory },
        filesystemDeploymentRootDirectory,
      };
    }
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
    private readonly appStackOptions: AppStackIntegrationSessionOptions,
  ) {}

  async initSession(): Promise<MiroirTestExecutionEnvironment> {
    const executionEnvironment = await runAppStackIntegrationBootstrap({
      miroirConfig: this.miroirConfig,
      phases: getBootstrapPhasesForSessionKind("appStackPersistenceStoreController"),
      testApplicationUuid: selfApplicationLibrary.uuid,
      deployMiroirStrategy: "persistenceStoreControllerHelper",
      openAdminAndMiroirStoresOnServer: false,
      customFetch: crossFetch,
      libraryPlayfieldEnsureMode: this.appStackOptions.libraryPlayfieldEnsureMode,
      ...this.appStackOptions,
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
