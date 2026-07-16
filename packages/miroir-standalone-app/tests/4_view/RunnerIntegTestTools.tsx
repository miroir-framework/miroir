import crossFetch from "cross-fetch";

import {
  type ApplicationDeploymentMap,
  type CompositeAction,
  type CompositeRunTestAssertion,
  type Deployment,
  type DomainControllerInterface,
  type MetaModel,
  type MiroirActivityTracker,
  type MiroirConfigClient,
  type MiroirEventService,
  type Runner,
  type StoreUnitConfiguration,
  type Uuid,
  createDeploymentCompositeAction,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  displayTestSuiteResultsDetails,
  resetLibraryPlayfield,
} from "miroir-core";
import {
  adminApplication_Miroir,
  deployment_Admin,
  deployment_Miroir
} from "miroir-test-app_deployment-admin";
import {
  deployment_Library_DO_NO_USE,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";
import {
  selfApplicationDeploymentMiroir,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import { setupMiroirTest } from "../../src/miroir-fwk/4-tests/setupMiroirTest";

export interface RunnerTestParams {
  pageLabel: string,
  runner: Runner,
  testApplicationUuid: string,
  testApplicationDeploymentUuid: string,
  testApplicationName: string,
  testParams: Record<string, any>,
  preTestCompositeActions: CompositeAction[],
  testCompositeActionAssertions: CompositeRunTestAssertion[],
  //
  internalMiroirConfig: MiroirConfigClient,
  adminDeployment: Deployment,
  testDeploymentStorageConfiguration: StoreUnitConfiguration,
  initialModel: MetaModel,
  preRunnerCompositeActions?: CompositeAction[],
  testCompositeActionLabel?: string,
  skipCreateDeployment?: boolean,
  skipDropDeployment?: boolean,
}


// ################################################################################################
export async function beforeEachTest(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
  libraryRunTarget?: {
    applicationUuid: string;
    deploymentUuid: string;
  },
  options?: {
    clearDocumentBody?: boolean;
    /**
     * When true (default for emulated stacks), reset Miroir platform stores too.
     * Must be false for real-server / shared miroir-server runs (D9): the live
     * Miroir deployment often points at package `assets/` under the server's
     * filesystemDeploymentRootDirectory — resetting it mutates source data.
     */
    resetMiroirPlatform?: boolean;
  },
): Promise<void>  {
  await resetLibraryPlayfield({
    domainController,
    applicationDeploymentMap,
    libraryDeploymentUuid:
      libraryRunTarget?.deploymentUuid ?? deployment_Library_DO_NO_USE.uuid,
    librarySelfApplicationUuid:
      libraryRunTarget?.applicationUuid ?? selfApplicationLibrary.uuid,
    miroirDeploymentUuid: selfApplicationDeploymentMiroir.uuid,
    miroirSelfApplicationUuid: selfApplicationMiroir.uuid,
    resetMiroirPlatform: options?.resetMiroirPlatform ?? true,
  });
  if (options?.clearDocumentBody !== false) {
    document.body.innerHTML = "";
  }
};

// ################################################################################################
export async function afterAllTests(
  miroirActivityTracker: MiroirActivityTracker,
  // testActions: Record<string, TestCompositeActionParams>,
  displayTestResults: string[],
): Promise<void> {
  // await deleteAndCloseApplicationDeployments(miroirConfig, domainController, defaultSelfApplicationDeploymentMap, adminApplicationDeploymentConfigurations);
  displayTestResults.forEach((testName) =>
    displayTestSuiteResultsDetails(
      // Object.keys(testActions)[0],
      testName,
      [],
      miroirActivityTracker,
    ),
  );
  return Promise.resolve();
};

// ################################################################################################
export function testApplicationStorageConfiguration(
  libraryDeploymentStorageConfiguration: StoreUnitConfiguration,
  testApplicationName: string,
): StoreUnitConfiguration {
  let testDeploymentStorageConfiguration: StoreUnitConfiguration;
  switch (libraryDeploymentStorageConfiguration.model.emulatedServerType) {
    case "indexedDb": {
      testDeploymentStorageConfiguration = {
        admin: libraryDeploymentStorageConfiguration.admin,
        model: {
          emulatedServerType: "indexedDb",
          indexedDbName: testApplicationName,
        },
        data: {
          emulatedServerType: "indexedDb",
          indexedDbName: testApplicationName,
        },
      };
      break;
    }
    case "filesystem": {
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
      };
    }
    default: {
      throw new Error("Unsupported emulatedServerType: " + libraryDeploymentStorageConfiguration.model.emulatedServerType);
      break;
    }
  }
  return testDeploymentStorageConfiguration;
}

// ################################################################################################
export interface TestConfig {
  applicationDeploymentMap: ApplicationDeploymentMap;
  miroirDeploymentStorageConfiguration: StoreUnitConfiguration;
  adminDeploymentStorageConfiguration: StoreUnitConfiguration;
  adminDeployment: Deployment;
  libraryDeploymentStorageConfiguration: StoreUnitConfiguration;
}

// ################################################################################################
export function getTestConfig(
  miroirConfig: MiroirConfigClient,
  testApplicationDeploymentUuid: Uuid, 
  testApplicationName: string,
  testApplicationUuid: Uuid
):TestConfig {
  const applicationDeploymentMap: ApplicationDeploymentMap = {
    ...defaultSelfApplicationDeploymentMap,
    [testApplicationUuid]: testApplicationDeploymentUuid,
  }
  
  const miroirDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
    ? miroirConfig.client.deploymentStorageConfig[deployment_Miroir.uuid]
    : miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Miroir.uuid];

  // Admin must be present for createDeploymentCompositeAction's first openStore step.
  // Prefer profile config; fall back to the canonical Admin Deployment asset (filesystem).
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

  const libraryDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
    ? miroirConfig.client.deploymentStorageConfig[deployment_Library_DO_NO_USE.uuid]
    : miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Library_DO_NO_USE.uuid];
  return {
    applicationDeploymentMap,
    miroirDeploymentStorageConfiguration,
    adminDeploymentStorageConfiguration,
    adminDeployment,
    libraryDeploymentStorageConfiguration,
  }
}
