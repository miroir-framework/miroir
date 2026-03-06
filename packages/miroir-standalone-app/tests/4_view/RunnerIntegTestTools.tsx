import "@testing-library/jest-dom";

import crossFetch from "cross-fetch";
import {
  type ApplicationDeploymentMap,
  type CompositeAction,
  type CompositeRunTestAssertion,
  type Deployment,
  type DomainControllerInterface,
  type LocalCacheInterface,
  type MetaModel,
  type MiroirActivityTracker,
  type MiroirConfigClient,
  type MiroirEventService,
  type PersistenceStoreControllerManager,
  type Runner,
  type StoreUnitConfiguration,
  type Uuid,
  createDeploymentCompositeAction,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  displayTestSuiteResultsDetails,
  resetAndInitApplicationDeployment,
  selfApplicationDeploymentMiroir
} from "miroir-core";
import {
  adminApplication_Miroir,
  deployment_Admin,
  deployment_Miroir
} from "miroir-test-app_deployment-admin";
import { deployment_Library_DO_NO_USE } from "miroir-test-app_deployment-library";
import { setupMiroirTest } from "../../src/miroir-fwk/4-tests/tests-utils";

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

}

// ################################################################################################
export async function beforeAllTests(
  miroirConfig: MiroirConfigClient,
  miroirActivityTracker: MiroirActivityTracker,
  miroirEventService: MiroirEventService,
  adminDeployment: Deployment,
  miroirDeploymentStorageConfiguration: StoreUnitConfiguration,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<{
  localCache: LocalCacheInterface;
  domainController: DomainControllerInterface;
  persistenceStoreControllerManager: PersistenceStoreControllerManager;
}> {
  // Establish requests interception layer before all tests.
  console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ beforeAll");
  const {
    persistenceStoreControllerManagerForClient: localpersistenceStoreControllerManager,
    domainController: localdomainController,
    localCache: locallocalCache,
    miroirContext: localmiroirContext,
  } = await setupMiroirTest(miroirConfig, miroirActivityTracker, miroirEventService, crossFetch);

  // persistenceStoreControllerManager = localpersistenceStoreControllerManager;
  // domainController = localdomainController;
  // localCache = locallocalCache;
  // miroirContext = localmiroirContext;

  // create the Miroir app deployment containing the meta-model
  const createMiroirDeploymentCompositeAction = createDeploymentCompositeAction(
    "miroir",
    deployment_Miroir.uuid,
    adminApplication_Miroir.uuid,
    adminDeployment,
    miroirDeploymentStorageConfiguration,
  );
  const createDeploymentResult = await localdomainController.handleCompositeAction(
    createMiroirDeploymentCompositeAction,
    applicationDeploymentMap,
    defaultMiroirModelEnvironment,
    {},
  );
  if (createDeploymentResult.status !== "ok") {
    console.error(
      "Failed to create Miroir deployment, createMiroirDeploymentCompositeAction:",
      JSON.stringify(createMiroirDeploymentCompositeAction, null, 2)
    );
    throw new Error("Failed to create Miroir deployment: " + JSON.stringify(createDeploymentResult));
  }
  console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ beforeAll DONE");

  return Promise.resolve({
    localCache: locallocalCache,
    domainController: localdomainController,
    persistenceStoreControllerManager: localpersistenceStoreControllerManager,
  });
}

// ################################################################################################
export async function beforeEachTest(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<void>  {
  await resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, [
    selfApplicationDeploymentMiroir as Deployment,
  ]);
  document.body.innerHTML = "";
};

// ################################################################################################
export async function afterAllTests(
  miroirActivityTracker: MiroirActivityTracker,
  // testActions: Record<string, TestCompositeActionParams>,
  displayTestResults: string,
): Promise<void> {
  // await deleteAndCloseApplicationDeployments(miroirConfig, domainController, defaultSelfApplicationDeploymentMap, adminApplicationDeploymentConfigurations);
  displayTestSuiteResultsDetails(
    // Object.keys(testActions)[0],
    displayTestResults,
    [],
    miroirActivityTracker
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
  }
  return testDeploymentStorageConfiguration;
}

// ################################################################################################
export function getTestConfig(
  miroirConfig: MiroirConfigClient,
  testApplicationDeploymentUuid: Uuid, 
  testApplicationName: string,
  testApplicationUuid: Uuid
):{
  applicationDeploymentMap: ApplicationDeploymentMap;
  miroirDeploymentStorageConfiguration: StoreUnitConfiguration;
  adminDeploymentStorageConfiguration: StoreUnitConfiguration;
  adminDeployment: Deployment;
  libraryDeploymentStorageConfiguration: StoreUnitConfiguration;
} {
  const applicationDeploymentMap: ApplicationDeploymentMap = {
    ...defaultSelfApplicationDeploymentMap,
    [testApplicationUuid]: testApplicationDeploymentUuid,
  }
  
  const miroirDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
    ? miroirConfig.client.deploymentStorageConfig[deployment_Miroir.uuid]
    : miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Miroir.uuid];
  
  const adminDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
    ? miroirConfig.client.deploymentStorageConfig[deployment_Admin.uuid]
    : miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Admin.uuid];
  
    
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
