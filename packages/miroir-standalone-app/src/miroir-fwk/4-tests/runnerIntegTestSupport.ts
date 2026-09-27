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
import { deployment_Admin, deployment_Miroir } from "miroir-test-app_deployment-admin";
import { deployment_Library_DO_NO_USE, selfApplicationLibrary } from "miroir-test-app_deployment-library";
import { selfApplicationMiroir } from "miroir-test-app_deployment-miroir";

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

/**
 * #321: `.miroir/<environment>` when the template store is a section of a test environment
 * (`.miroir/<environment>/<application>/…`), so test applications live next to it.
 */
function environmentStateDirectory(
  libraryDeploymentStorageConfiguration: StoreUnitConfiguration,
): string | undefined {
  const template = libraryDeploymentStorageConfiguration.model;
  const location =
    template.emulatedServerType === "filesystem"
      ? template.directory
      : template.emulatedServerType === "indexedDb"
        ? template.indexedDbName
        : undefined;
  const [root, environment] = location?.split("/") ?? [];
  return root === ENVIRONMENT_STATE_ROOT && environment ? `${root}/${environment}` : undefined;
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
): string {
  const key = isolationKey.replace(/-/g, "");
  const isolationSuffix = `_${key}`;
  const budget = POSTGRES_IDENTIFIER_MAX - reservedSuffixLength;
  const maxPrefixLength = Math.max(1, budget - isolationSuffix.length);
  const base = testApplicationName.replace(/[^a-zA-Z0-9_]/g, "_");
  let prefixed = /^[a-zA-Z_]/.test(base) ? base : `app_${base}`;
  if (prefixed.length > maxPrefixLength) {
    prefixed = prefixed.slice(0, maxPrefixLength);
  }
  return `${prefixed}${isolationSuffix}`;
}

export function testApplicationStorageConfiguration(
  libraryDeploymentStorageConfiguration: StoreUnitConfiguration,
  testApplicationName: string,
  isolationKey?: string,
): StoreUnitConfiguration {
  const storeName = isolationKey
    ? ephemeralStoreIdentifier(testApplicationName, isolationKey)
    : testApplicationName;
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
        model: { emulatedServerType: "sql", connectionString, schema: storeName },
        data: { emulatedServerType: "sql", connectionString, schema: storeName },
        modelVersion: { emulatedServerType: "sql", connectionString, schema: `${storeName}_modelVersion` },
      };
      break;
    }
    case "mongodb": {
      const connectionString =
        libraryDeploymentStorageConfiguration.model.connectionString ?? "mongodb://localhost:27017";
      testDeploymentStorageConfiguration = {
        admin: libraryDeploymentStorageConfiguration.admin,
        model: { emulatedServerType: "mongodb", connectionString, database: storeName },
        data: { emulatedServerType: "mongodb", connectionString, database: storeName },
        modelVersion: { emulatedServerType: "mongodb", connectionString, database: `${storeName}_modelVersion` },
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
