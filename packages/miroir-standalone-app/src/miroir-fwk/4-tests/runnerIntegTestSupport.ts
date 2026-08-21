import {
  type ApplicationDeploymentMap,
  type ApplicationEntitiesAndInstances,
  type Deployment,
  type DomainControllerInterface,
  type InitApplicationParameters,
  type MetaModelPartial,
  type MiroirConfigClient,
  type StoreUnitConfiguration,
  type Uuid,
  defaultSelfApplicationDeploymentMap,
  resetIntegTestbed,
} from "miroir-core";
import { deployment_Admin, deployment_Miroir } from "miroir-test-app_deployment-admin";
import { deployment_Library_DO_NO_USE, selfApplicationLibrary } from "miroir-test-app_deployment-library";
import { selfApplicationMiroir } from "miroir-test-app_deployment-miroir";

import { resolveCanonicalTestDeploymentUuid } from "./resolveCanonicalTestDeploymentUuid.js";

const STANDALONE_APP_TESTS_TMP = "miroir-standalone-app/tests/tmp";

export async function beforeEachTest(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
  libraryRunTarget?: {
    applicationUuid: string;
    deploymentUuid: string;
  },
  options?: {
    clearDocumentBody?: boolean;
    resetMiroirPlatform?: {
      miroirDeploymentUuid: Uuid;
      miroirSelfApplicationUuid: Uuid;
    };
    testbedEntitiesAndInstances?: ApplicationEntitiesAndInstances;
    testbedInitApplicationParameters?: InitApplicationParameters;
    testbedModel?: MetaModelPartial;
  },
): Promise<void> {
  await resetIntegTestbed({
    domainController,
    applicationDeploymentMap,
    libraryDeploymentUuid:
      libraryRunTarget?.deploymentUuid ?? deployment_Library_DO_NO_USE.uuid,
    librarySelfApplicationUuid:
      libraryRunTarget?.applicationUuid ?? selfApplicationLibrary.uuid,
    resetMiroirPlatform: options?.resetMiroirPlatform ?? {
      miroirDeploymentUuid: deployment_Miroir.uuid,
      miroirSelfApplicationUuid: selfApplicationMiroir.uuid,
    },
    testbedEntitiesAndInstances: options?.testbedEntitiesAndInstances,
    testbedInitApplicationParameters: options?.testbedInitApplicationParameters,
    testbedModel: options?.testbedModel,
  });
  if (options?.clearDocumentBody !== false && typeof document !== "undefined") {
    document.body.innerHTML = "";
  }
}

/** Node CLI profiles use Level under `tests/tmp`; browser UI profiles use short IndexedDB names. */
export function resolveEphemeralIndexedDbBaseName(
  libraryDeploymentStorageConfiguration: StoreUnitConfiguration,
  testApplicationName: string,
): string {
  const template = libraryDeploymentStorageConfiguration.model;
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

export function testApplicationStorageConfiguration(
  libraryDeploymentStorageConfiguration: StoreUnitConfiguration,
  testApplicationName: string,
): StoreUnitConfiguration {
  let testDeploymentStorageConfiguration: StoreUnitConfiguration;
  switch (libraryDeploymentStorageConfiguration.model.emulatedServerType) {
    case "indexedDb": {
      const indexedDbBaseName = resolveEphemeralIndexedDbBaseName(
        libraryDeploymentStorageConfiguration,
        testApplicationName,
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
      if (usesStandaloneAppTestsTmpLayout(libraryDeploymentStorageConfiguration)) {
        testDeploymentStorageConfiguration = {
          admin: libraryDeploymentStorageConfiguration.admin,
          model: {
            emulatedServerType: "filesystem",
            directory: `${STANDALONE_APP_TESTS_TMP}/${testApplicationName}_model`,
          },
          data: {
            emulatedServerType: "filesystem",
            directory: `${STANDALONE_APP_TESTS_TMP}/${testApplicationName}_data`,
          },
          modelVersion: {
            emulatedServerType: "filesystem",
            directory: `${STANDALONE_APP_TESTS_TMP}/${testApplicationName}_modelVersion`,
          },
        };
        break;
      }
      testDeploymentStorageConfiguration = {
        admin: libraryDeploymentStorageConfiguration.admin,
        model: {
          emulatedServerType: "filesystem",
          directory: "./test_data/" + testApplicationName,
        },
        data: {
          emulatedServerType: "filesystem",
          directory: "./test_data/" + testApplicationName,
        },
        modelVersion: {
          emulatedServerType: "filesystem",
          directory: `./test_data/${testApplicationName}_modelVersion`,
        },
      };
      break;
    }
    case "sql": {
      testDeploymentStorageConfiguration = {
        admin: libraryDeploymentStorageConfiguration.admin,
        model: {
          emulatedServerType: "sql",
          connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
          schema: testApplicationName,
        },
        data: {
          emulatedServerType: "sql",
          connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
          schema: testApplicationName,
        },
        modelVersion: {
          emulatedServerType: "sql",
          connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
          schema: `${testApplicationName}_modelVersion`,
        },
      };
      break;
    }
    case "mongodb": {
      testDeploymentStorageConfiguration = {
        admin: libraryDeploymentStorageConfiguration.admin,
        model: {
          emulatedServerType: "mongodb",
          connectionString: "mongodb://localhost:27017",
          database: testApplicationName,
        },
        data: {
          emulatedServerType: "mongodb",
          connectionString: "mongodb://localhost:27017",
          database: testApplicationName,
        },
        modelVersion: {
          emulatedServerType: "mongodb",
          connectionString: "mongodb://localhost:27017",
          database: `${testApplicationName}_modelVersion`,
        },
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

  const adminDeploymentStorageConfiguration: StoreUnitConfiguration =
    (miroirConfig.client.emulateServer
      ? miroirConfig.client.deploymentStorageConfig?.[deployment_Admin.uuid]
      : miroirConfig.client.serverConfig?.storeSectionConfiguration?.[deployment_Admin.uuid]) ??
    (deployment_Admin.configuration as StoreUnitConfiguration);

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
