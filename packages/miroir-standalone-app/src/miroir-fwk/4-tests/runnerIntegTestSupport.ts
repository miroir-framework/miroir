import {
  type ApplicationDeploymentMap,
  type Deployment,
  type DomainControllerInterface,
  type IntegTestbedResetParams,
  type MiroirConfigClient,
  type StoreUnitConfiguration,
  type Uuid,
  defaultSelfApplicationDeploymentMap,
  ENVIRONMENT_STATE_ROOT,
  resetIntegTestbed,
} from "miroir-core";
import { deployment_Admin, deployment_Miroir } from "miroir-app-admin";
import { deployment_Library_DO_NO_USE, selfApplicationLibrary } from "miroir-example-library";
import { selfApplicationMiroir } from "miroir-app-miroir";

import { resolveCanonicalTestDeploymentUuid } from "./resolveCanonicalTestDeploymentUuid.js";

const STANDALONE_APP_TESTS_TMP = "miroir-standalone-app/tests/tmp";

export type BeforeEachTestOptions = {
  clearDocumentBody?: boolean;
  /**
   * The Miroir deployment reset before each test (default: the Miroir deployment of the test session).
   * `false` against a real server (#321): the server's Miroir deployment is the one of its environment,
   * in `dev` the package assets themselves, which a reset would wipe.
   */
  resetMiroirPlatform?:
    | {
        miroirDeploymentUuid: Uuid;
        miroirSelfApplicationUuid: Uuid;
      }
    | false;
  /** Playfield model + instances + init; forwarded to resetIntegTestbed when set. */
  integTestbedResetParams?: IntegTestbedResetParams;
};

export async function beforeEachTest(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
  libraryRunTarget?: {
    applicationUuid: string;
    deploymentUuid: string;
  },
  options?: BeforeEachTestOptions,
): Promise<void> {
  const resetParams = options?.integTestbedResetParams;
  await resetIntegTestbed({
    domainController,
    applicationDeploymentMap,
    libraryDeploymentUuid:
      libraryRunTarget?.deploymentUuid ?? deployment_Library_DO_NO_USE.uuid,
    librarySelfApplicationUuid:
      libraryRunTarget?.applicationUuid ?? selfApplicationLibrary.uuid,
    resetMiroirPlatform:
      options?.resetMiroirPlatform === false
        ? undefined
        : (options?.resetMiroirPlatform ?? {
            miroirDeploymentUuid: deployment_Miroir.uuid,
            miroirSelfApplicationUuid: selfApplicationMiroir.uuid,
          }),
    ...(resetParams
      ? {
          testbedEntitiesAndInstances: resetParams.testbedEntitiesAndInstances,
          testbedInitApplicationParameters: resetParams.testbedInitApplicationParameters,
          testbedModel: resetParams.testbedModel,
        }
      : {}),
  });
  if (options?.clearDocumentBody !== false && typeof document !== "undefined") {
    document.body.innerHTML = "";
  }
}

/** The filesystem or IndexedDB location of a store section, if it has one. */
function storeLocation(store: StoreUnitConfiguration[keyof StoreUnitConfiguration] | undefined): string | undefined {
  return store?.emulatedServerType === "filesystem"
    ? store.directory
    : store?.emulatedServerType === "indexedDb"
      ? store.indexedDbName
      : undefined;
}

/**
 * #321: `.miroir/<environment>` when the template store is a section of a test environment
 * (`.miroir/<environment>/<application>/…`), so test applications live next to it. #477: the
 * environment part is the state name, `<environment>@<worker>` in a parallel nonreg job. A SQL or
 * MongoDB template has no location of its own: its Admin section tells when it is a filesystem
 * copy, else the Admin application's deployment, a filesystem copy in the state (test-sql, where
 * every section of the template is on SQL).
 */
function environmentStateDirectory(
  libraryDeploymentStorageConfiguration: StoreUnitConfiguration,
  adminDeploymentStorageConfiguration?: StoreUnitConfiguration,
): string | undefined {
  const location =
    storeLocation(libraryDeploymentStorageConfiguration.model) ??
    storeLocation(libraryDeploymentStorageConfiguration.admin) ??
    storeLocation(adminDeploymentStorageConfiguration?.admin) ??
    storeLocation(adminDeploymentStorageConfiguration?.model);
  const [root, environment] = location?.split("/") ?? [];
  return root === ENVIRONMENT_STATE_ROOT && environment ? `${root}/${environment}` : undefined;
}

/**
 * #477: the prefix of the SQL schemas and MongoDB databases of test applications installed in a
 * test environment, `test-sql@w2` → `test_sql_w2`, like the environment's own stores; none outside
 * a test environment.
 */
function environmentStorePrefix(
  libraryDeploymentStorageConfiguration: StoreUnitConfiguration,
  adminDeploymentStorageConfiguration?: StoreUnitConfiguration,
): string | undefined {
  const directory = environmentStateDirectory(libraryDeploymentStorageConfiguration, adminDeploymentStorageConfiguration);
  return directory?.slice(ENVIRONMENT_STATE_ROOT.length + 1).replace(/[^A-Za-z0-9_]/g, "_");
}

/**
 * Node CLI profiles use Level under `tests/tmp`, or next to their template in a test environment
 * (`.miroir/<environment>/<application>/indexedDb`); browser UI profiles use short IndexedDB names.
 */
export function resolveEphemeralIndexedDbBaseName(
  libraryDeploymentStorageConfiguration: StoreUnitConfiguration,
  testApplicationName: string,
): string {
  const template = libraryDeploymentStorageConfiguration.model;
  const environmentDirectory = environmentStateDirectory(libraryDeploymentStorageConfiguration);
  if (environmentDirectory) {
    return `${environmentDirectory}/${testApplicationName}/indexedDb`;
  }
  if (
    template.emulatedServerType === "indexedDb" &&
    template.indexedDbName.includes(`${STANDALONE_APP_TESTS_TMP}/`)
  ) {
    return `${STANDALONE_APP_TESTS_TMP}/indexedDb-${testApplicationName}`;
  }
  return testApplicationName;
}

function usesStandaloneAppTestsTmpLayout(
  libraryDeploymentStorageConfiguration: StoreUnitConfiguration,
): boolean {
  const template = libraryDeploymentStorageConfiguration.model;
  if (template.emulatedServerType === "indexedDb") {
    return template.indexedDbName.includes(`${STANDALONE_APP_TESTS_TMP}/`);
  }
  if (template.emulatedServerType === "filesystem") {
    return template.directory.includes(`${STANDALONE_APP_TESTS_TMP}/`);
  }
  return false;
}


const POSTGRES_IDENTIFIER_MAX = 63;
const MODEL_VERSION_SUFFIX_LENGTH = "_modelVersion".length;

/**
 * Postgres-safe identifier for an ephemeral testbed store. Isolation key is
 * typically the deployment UUID so concurrent / leftover "Library" schemas are
 * not reused or dropped. Truncates only the application-name prefix so the
 * UUID and a reserved `_modelVersion` suffix still fit in 63 characters.
 */
export function ephemeralStoreIdentifier(
  testApplicationName: string,
  isolationKey: string,
  reservedSuffixLength: number = MODEL_VERSION_SUFFIX_LENGTH,
  environmentPrefix?: string,
): string {
  const key = isolationKey.replace(/-/g, "");
  const isolationSuffix = `_${key}`;
  const environmentPart = environmentPrefix ? `${environmentPrefix}_` : "";
  const budget = POSTGRES_IDENTIFIER_MAX - reservedSuffixLength - environmentPart.length;
  const maxPrefixLength = Math.max(1, budget - isolationSuffix.length);
  const base = testApplicationName.replace(/[^a-zA-Z0-9_]/g, "_");
  let prefixed = environmentPart || /^[a-zA-Z_]/.test(base) ? base : `app_${base}`;
  if (prefixed.length > maxPrefixLength) {
    prefixed = prefixed.slice(0, maxPrefixLength);
  }
  return `${environmentPart}${prefixed}${isolationSuffix}`;
}

/**
 * The schema or database of a test application without isolation key, under its template's
 * environment (#477). Truncating it could make two applications share a store: a name that does
 * not fit in 63 characters with the `_modelVersion` suffix is an error.
 */
export function canonicalStoreIdentifier(testApplicationName: string, environmentPrefix: string): string {
  const identifier = `${environmentPrefix}_${testApplicationName}`;
  if (identifier.length + MODEL_VERSION_SUFFIX_LENGTH > POSTGRES_IDENTIFIER_MAX) {
    throw new Error(
      `test application store "${identifier}" is too long: with "_modelVersion" it exceeds ${POSTGRES_IDENTIFIER_MAX} characters`,
    );
  }
  return identifier;
}

/**
 * The stores of a test application, cloned from its template's. `adminDeploymentStorageConfiguration`
 * (the Admin application's deployment) locates the test environment when no section of the template
 * does: without it, a template entirely on SQL or MongoDB gives schemas shared by parallel workers.
 */
export function testApplicationStorageConfiguration(
  libraryDeploymentStorageConfiguration: StoreUnitConfiguration,
  testApplicationName: string,
  isolationKey?: string,
  adminDeploymentStorageConfiguration?: StoreUnitConfiguration,
): StoreUnitConfiguration {
  const storeName = isolationKey
    ? ephemeralStoreIdentifier(testApplicationName, isolationKey)
    : testApplicationName;
  // #477: SQL schemas and MongoDB databases have no directory to live next to their template's
  // environment; they carry its name instead.
  const environmentPrefix = environmentStorePrefix(libraryDeploymentStorageConfiguration, adminDeploymentStorageConfiguration);
  const databaseName = !environmentPrefix
    ? storeName
    : isolationKey
      ? ephemeralStoreIdentifier(testApplicationName, isolationKey, MODEL_VERSION_SUFFIX_LENGTH, environmentPrefix)
      : canonicalStoreIdentifier(testApplicationName, environmentPrefix);
  let testDeploymentStorageConfiguration: StoreUnitConfiguration;
  switch (libraryDeploymentStorageConfiguration.model.emulatedServerType) {
    case "indexedDb": {
      const indexedDbBaseName = resolveEphemeralIndexedDbBaseName(
        libraryDeploymentStorageConfiguration,
        storeName,
      );
      testDeploymentStorageConfiguration = {
        admin: libraryDeploymentStorageConfiguration.admin,
        model: {
          emulatedServerType: "indexedDb",
          indexedDbName: indexedDbBaseName,
        },
        data: {
          emulatedServerType: "indexedDb",
          indexedDbName: indexedDbBaseName,
        },
        modelVersion: {
          emulatedServerType: "indexedDb",
          indexedDbName: `${indexedDbBaseName}_modelVersion`,
        },
      };
      break;
    }
    case "filesystem": {
      const environmentDirectory = environmentStateDirectory(libraryDeploymentStorageConfiguration);
      if (environmentDirectory) {
        testDeploymentStorageConfiguration = {
          admin: libraryDeploymentStorageConfiguration.admin,
          model: { emulatedServerType: "filesystem", directory: `${environmentDirectory}/${storeName}/model` },
          data: { emulatedServerType: "filesystem", directory: `${environmentDirectory}/${storeName}/data` },
          modelVersion: {
            emulatedServerType: "filesystem",
            directory: `${environmentDirectory}/${storeName}/modelVersion`,
          },
        };
        break;
      }
      if (usesStandaloneAppTestsTmpLayout(libraryDeploymentStorageConfiguration)) {
        testDeploymentStorageConfiguration = {
          admin: libraryDeploymentStorageConfiguration.admin,
          model: {
            emulatedServerType: "filesystem",
            directory: `${STANDALONE_APP_TESTS_TMP}/${storeName}_model`,
          },
          data: {
            emulatedServerType: "filesystem",
            directory: `${STANDALONE_APP_TESTS_TMP}/${storeName}_data`,
          },
          modelVersion: {
            emulatedServerType: "filesystem",
            directory: `${STANDALONE_APP_TESTS_TMP}/${storeName}_modelVersion`,
          },
        };
        break;
      }
      testDeploymentStorageConfiguration = {
        admin: libraryDeploymentStorageConfiguration.admin,
        model: {
          emulatedServerType: "filesystem",
          directory: "./test_data/" + storeName,
        },
        data: {
          emulatedServerType: "filesystem",
          directory: "./test_data/" + storeName,
        },
        modelVersion: {
          emulatedServerType: "filesystem",
          directory: `./test_data/${storeName}_modelVersion`,
        },
      };
      break;
    }
    case "sql": {
      // #321: same server as the template (a test environment names its host and password)
      const connectionString =
        libraryDeploymentStorageConfiguration.model.connectionString ??
        "postgres://postgres:postgres@localhost:5432/postgres";
      testDeploymentStorageConfiguration = {
        admin: libraryDeploymentStorageConfiguration.admin,
        model: { emulatedServerType: "sql", connectionString, schema: databaseName },
        data: { emulatedServerType: "sql", connectionString, schema: databaseName },
        modelVersion: { emulatedServerType: "sql", connectionString, schema: `${databaseName}_modelVersion` },
      };
      break;
    }
    case "mongodb": {
      const connectionString =
        libraryDeploymentStorageConfiguration.model.connectionString ?? "mongodb://localhost:27017";
      testDeploymentStorageConfiguration = {
        admin: libraryDeploymentStorageConfiguration.admin,
        model: { emulatedServerType: "mongodb", connectionString, database: databaseName },
        data: { emulatedServerType: "mongodb", connectionString, database: databaseName },
        modelVersion: { emulatedServerType: "mongodb", connectionString, database: `${databaseName}_modelVersion` },
      };
      break;
    }
    default: {
      throw new Error(
        "Unsupported emulatedServerType: " + libraryDeploymentStorageConfiguration.model.emulatedServerType,
      );
    }
  }
  return testDeploymentStorageConfiguration;
}

export interface TestConfig {
  applicationDeploymentMap: ApplicationDeploymentMap;
  miroirDeploymentStorageConfiguration: StoreUnitConfiguration;
  adminDeploymentStorageConfiguration: StoreUnitConfiguration;
  adminDeployment: Deployment;
  libraryDeploymentStorageConfiguration: StoreUnitConfiguration;
}

export function getTestConfig(
  miroirConfig: MiroirConfigClient,
  testApplicationDeploymentUuid: Uuid,
  testApplicationName: string,
  testApplicationUuid: Uuid,
): TestConfig {
  const applicationDeploymentMap: ApplicationDeploymentMap = {
    ...defaultSelfApplicationDeploymentMap,
    [testApplicationUuid]: testApplicationDeploymentUuid,
  };

  const miroirDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
    ? miroirConfig.client.deploymentStorageConfig[deployment_Miroir.uuid]
    : miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Miroir.uuid];

  // #321: no fallback on deployment_Admin.configuration (the tracked Admin assets): tests never write there
  const adminDeploymentStorageConfiguration: StoreUnitConfiguration | undefined = miroirConfig.client.emulateServer
    ? miroirConfig.client.deploymentStorageConfig?.[deployment_Admin.uuid]
    : miroirConfig.client.serverConfig?.storeSectionConfiguration?.[deployment_Admin.uuid];

  if (!adminDeploymentStorageConfiguration) {
    throw new Error(
      `getTestConfig: missing Admin store config for deployment ${deployment_Admin.uuid} ` +
        `(add it to the profile storeSectionConfiguration / deploymentStorageConfig)`,
    );
  }

  const adminDeployment: Deployment = {
    ...deployment_Admin,
    configuration: adminDeploymentStorageConfiguration,
  };

  const canonicalDeploymentUuid = resolveCanonicalTestDeploymentUuid(testApplicationName);
  const libraryDeploymentStorageConfiguration: StoreUnitConfiguration | undefined =
    miroirConfig.client.emulateServer
      ? miroirConfig.client.deploymentStorageConfig?.[canonicalDeploymentUuid]
      : miroirConfig.client.serverConfig?.storeSectionConfiguration?.[canonicalDeploymentUuid];

  if (!libraryDeploymentStorageConfiguration) {
    throw new Error(
      `getTestConfig: missing store config for deployment ${canonicalDeploymentUuid} ` +
        `(applicationName=${testApplicationName}). Add it to the profile deploymentStorageConfig.`,
    );
  }

  return {
    applicationDeploymentMap,
    miroirDeploymentStorageConfiguration,
    adminDeploymentStorageConfiguration,
    adminDeployment,
    libraryDeploymentStorageConfiguration,
  };
}
