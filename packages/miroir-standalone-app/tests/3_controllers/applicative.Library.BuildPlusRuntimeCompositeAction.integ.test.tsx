import * as vitest from 'vitest';
// import { describe, expect } from 'vitest';

// import { v4 as uuidv4 } from "uuid";

// import { miroirFileSystemStoreSectionStartup } from "../dist/bundle";
import {
  AdminApplicationDeploymentConfiguration,
  ConfigurationService,
  Deployment,
  displayTestSuiteResultsDetails,
  DomainControllerInterface,
  LocalCacheInterface,
  LoggerGlobalContext,
  LoggerInterface,
  LoggerOptions,
  MiroirActivityTracker,
  MiroirContext,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  PersistenceStoreControllerManagerInterface,
  resetAndInitApplicationDeployment,
  selfApplicationDeploymentMiroir,
  StoreUnitConfiguration
} from "miroir-core";


// import { packageName } from 'miroir-core';
// import { AdminApplicationDeploymentConfiguration } from 'miroir-core/src/0_interfaces/1_core/StorageConfiguration.js';
import type { Uuid } from 'miroir-core';
import { createDeploymentCompositeAction, defaultMiroirModelEnvironment } from 'miroir-core';
import { miroirFileSystemStoreSectionStartup } from 'miroir-store-filesystem';
import { miroirIndexedDbStoreSectionStartup } from 'miroir-store-indexedDb';
import { miroirPostgresStoreSectionStartup } from 'miroir-store-postgres';
import { deployment_Miroir } from 'miroir-test-app_deployment-admin';
import { loglevelnext } from "../../src/loglevelnextImporter.js";
import {
  getTestSuitesForBuildPlusRuntimeCompositeAction,
  testSuiteNameForBuildPlusRuntimeCompositeAction,
} from "../../src/miroir-fwk/4-tests/applicative.Library.BuildPlusRuntimeCompositeAction.js";
import {
  runTestOrTestSuite,
  setupMiroirTest
} from "../../src/miroir-fwk/4-tests/tests-utils.js";
import { miroirAppStartup } from '../../src/startup.js';
import { loadTestConfigFiles } from '../utils/fileTools.js';
import { cleanLevel, packageName } from './constants.js';

let domainController: DomainControllerInterface | undefined = undefined;
let localCache: LocalCacheInterface | undefined = undefined;
let miroirContext: MiroirContext;
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;

// ################################################################################################
// const testSuiteName: string = "applicative.Library.BuildPlusRuntimeCompositeAction.integ.test";
// ################################################################################################

const env:any = (import.meta as any).env
console.log("@@@@@@@@@@@@@@@@@@ env", env);

const RUN_TEST= process.env.RUN_TEST

const myConsoleLog = (...args: any[]) => console.log(testSuiteNameForBuildPlusRuntimeCompositeAction, ...args);
myConsoleLog(testSuiteNameForBuildPlusRuntimeCompositeAction, "received env", JSON.stringify(env, null, 2));

const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);

let miroirConfig:any;
let loggerOptions:LoggerOptions;
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, testSuiteNameForBuildPlusRuntimeCompositeAction)
).then((logger: LoggerInterface) => {log = logger});

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);
ConfigurationService.configurationService.registerTestImplementation({expect: expect as any});

const {miroirConfig: miroirConfigParam, logConfig} = await loadTestConfigFiles(env)
miroirConfig = miroirConfigParam;
loggerOptions = logConfig;
myConsoleLog("received miroirConfig", JSON.stringify(miroirConfig, null, 2));
myConsoleLog(
  "received miroirConfig.client",
  JSON.stringify(miroirConfig.client, null, 2)
);
myConsoleLog("received loggerOptions", JSON.stringify(loggerOptions, null, 2));
MiroirLoggerFactory.startRegisteredLoggers(
  miroirActivityTracker,
  miroirEventService,
  loglevelnext,
  loggerOptions,
);
myConsoleLog("started registered loggers DONE");

const testApplicationName: string = "Test";
const testApplicationUuid: Uuid = "ca7832a9-379a-41d9-8d4d-6c12c05a0cd6";

const miroirtDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[deployment_Miroir.uuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Miroir.uuid];

const miroirStoreUnitConfigurationForTest: StoreUnitConfiguration = {
  "admin": {
    "emulatedServerType": "filesystem",
    "directory":"./tests/tmp/miroir_admin"
  },
  "model": {
    "emulatedServerType": "filesystem",
    "directory":"./tests/tmp/miroir_model"
  },
  "data": {
    "emulatedServerType": "filesystem",
    "directory":"./tests/tmp/miroir_data"
  }
}

const typedAdminConfigurationDeploymentMiroir = {
  ...deployment_Miroir,
  configuration: miroirStoreUnitConfigurationForTest,
} as AdminApplicationDeploymentConfiguration;

// ################################################################################################
// beforeAll(
const beforeAll = async () => {
  LoggerGlobalContext.setTest("beforeAll");
  
  const {
    persistenceStoreControllerManagerForClient: localpersistenceStoreControllerManager,
    domainController: localdomainController,
    localCache: locallocalCache,
    miroirContext: localmiroirContext,
  } = await setupMiroirTest(miroirConfig);

  persistenceStoreControllerManager = localpersistenceStoreControllerManager;
  domainController = localdomainController;
  localCache = locallocalCache;
  miroirContext = localmiroirContext;

  const createMiroirDeploymentCompositeAction = createDeploymentCompositeAction(
    testApplicationName,
    testApplicationUuid,
    typedAdminConfigurationDeploymentMiroir.uuid,
    typedAdminConfigurationDeploymentMiroir.configuration,
  );
  const createDeploymentResult = await domainController.handleCompositeAction(
    createMiroirDeploymentCompositeAction,
    defaultMiroirModelEnvironment,
    {}
  );

  if (createDeploymentResult.status !== "ok") {
    throw new Error("Failed to create Miroir deployment: " + JSON.stringify(createDeploymentResult));
  }

  const resetAndInitResult = await resetAndInitApplicationDeployment(domainController, [
    selfApplicationDeploymentMiroir as Deployment,
  ]);

  if (resetAndInitResult.status !== "ok") {
    throw new Error("Failed to reset and init Miroir deployment: " + JSON.stringify(resetAndInitResult));
  }

  LoggerGlobalContext.setTest(undefined);
  return Promise.resolve();
}

// ################################################################################################
// const beforeEach = async  () => {
//   LoggerGlobalContext.setTest("beforeEach");
  
//   if (!domainController) {
//     throw new Error("beforeEach DomainController is not initialized");
//   }
//   await resetAndInitApplicationDeployment(domainController, [
//     selfApplicationDeploymentMiroir as Deployment,
//   ]);
//   document.body.innerHTML = '';
//   LoggerGlobalContext.setTest(undefined);
// }

// // ################################################################################################
// afterEach(
//   async () => {
//   }
// )

// ################################################################################################
const afterAll = (
  async () => {
    LoggerGlobalContext.setTest("afterAll-integTest");
    // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ deleteAndCloseApplicationDeployments")
    // if (!domainController) {
    //   throw new Error("DomainController is not initialized");
    // }
    // await deleteAndCloseApplicationDeployments(
    //   miroirConfig,
    //   domainController,
    //   [
    //     typedAdminConfigurationDeploymentMiroir
    //   ],
    // );
    // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done deleteAndCloseApplicationDeployments")

    // console.log("globalTestSuiteResults:\n", Object.values(globalTestSuiteResults).map((r) => "\"" + r.testLabel + "\": " + r.testResult).join("\n"));
    displayTestSuiteResultsDetails(Object.keys(testSuitesForBuildPlusRuntimeCompositeAction)[0], [], miroirActivityTracker);
    LoggerGlobalContext.setTest(undefined);
  }
)


// ##############################################################################################
// ##############################################################################################
// ##############################################################################################

const {testSuitesForBuildPlusRuntimeCompositeAction, testDeploymentStorageConfiguration, testDeploymentUuid} =
  getTestSuitesForBuildPlusRuntimeCompositeAction(miroirConfig);
// const testSuitesForBuildPlusRuntimeCompositeAction: Record<string, any> =
//   getTestSuitesForBuildPlusRuntimeCompositeAction(miroirConfig);


// const display
// TODO: duplicate test with ExtractorTemplatePersistenceStoreRunner.integ.test.tsx
if (RUN_TEST == testSuiteNameForBuildPlusRuntimeCompositeAction) {
  if (beforeAll) await beforeAll(); // beforeAll is a function, not the call to the jest/vitest hook
  // if (beforeEach) await beforeEach(); // beforeAll is a function, not the call to the jest/vitest hook
  if (!localCache) {
    throw new Error("running test localCache is not defined!");
  }
  if (!domainController) {
    throw new Error("running test domainController is not defined!");
  }
  for (const [currentTestSuiteName, testSuite] of Object.entries(testSuitesForBuildPlusRuntimeCompositeAction)) {
    console.log("################################ running test suite:", currentTestSuiteName);
    const testSuiteResults = await runTestOrTestSuite(
      domainController,
      testSuite,
      (testSuite as any)["testParams"]
    );
    if (!testSuiteResults || testSuiteResults.status !== "ok") {
      vitest.expect(testSuiteResults?.status, `${currentTestSuiteName} failed!`).toBe("ok");
    }
  }
  if (afterAll) await afterAll(); // beforeAll is a function, not the call to the jest/vitest hook

} else {
  console.log("################################ skipping test suite:", testSuiteNameForBuildPlusRuntimeCompositeAction, "RUN_TEST=", RUN_TEST);
}

