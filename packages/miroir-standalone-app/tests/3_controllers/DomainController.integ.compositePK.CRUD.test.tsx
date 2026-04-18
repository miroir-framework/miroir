import { describe, expect } from "vitest";

import process from "process";

import type {
  ApplicationDeploymentMap,
  Deployment,
  Entity,
  EntityDefinition,
  EntityInstance,
  MetaModel,
} from "miroir-core";

import {
  ConfigurationService,
  createDeploymentCompositeAction,
  defaultMiroirMetaModel,
  defaultSelfApplicationDeploymentMap,
  displayTestSuiteResultsDetails,
  DomainControllerInterface,
  entityEntity,
  LoggerInterface,
  LoggerOptions,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  resetAndInitApplicationDeployment,
  resetAndinitializeDeploymentCompositeAction,
  selfApplicationDeploymentMiroir,
  selfApplicationMiroir,
  StoreUnitConfiguration,
  TestCompositeActionParams,
  testUtils_deleteApplicationDeployment,
  testUtils_resetApplicationDeployment,
} from "miroir-core";

import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { miroirAppStartup } from "../../src/startup.js";

import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { loadTestConfigFiles } from "../utils/fileTools.js";

import {
  runTestOrTestSuite,
  setupMiroirTestAndCreateMiroirDeployment,
} from "../../src/miroir-fwk/4-tests/tests-utils.js";

import {
  adminApplication_Miroir,
  deployment_Admin,
} from "miroir-test-app_deployment-admin";

import {
  entityDefinitionPublisher,
  entityPublisher,
  folio as publisher1,
  penguin as publisher2,
  springer as publisher3,
  selfApplicationLibrary,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationVersionLibraryInitialVersion,
} from "miroir-test-app_deployment-library";

import { packageName } from "../../src/constants.js";
import { cleanLevel } from "./constants.js";

// ##############################################################################################
// Composite-PK test entity definition
// PK is ["region", "code"] — two string attributes form the composite key.
// ##############################################################################################

const entityCompositePKUuid = "aaa0b000-1a1a-2b2b-3c3c-4d4d5e5e6f6f";
const entityDefinitionCompositePKUuid = "bbb1c111-2c2c-3d3d-4e4e-5f5f6a6a7b7b";

const entityCompositePK: Entity = {
  uuid: entityCompositePKUuid,
  parentName: "Entity",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
  selfApplication: selfApplicationLibrary.uuid,
  name: "TestEntityCompositePK",
  conceptLevel: "Model",
  description: "Test entity with a composite primary key [region, code].",
} as Entity;

const entityDefinitionCompositePK: EntityDefinition = {
  uuid: entityDefinitionCompositePKUuid,
  parentName: "EntityDefinition",
  parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
  parentDefinitionVersionUuid: "bdd7ad43-f0fc-4716-90c1-87454c40dd95",
  entityUuid: entityCompositePKUuid,
  conceptLevel: "Model",
  name: "TestEntityCompositePK",
  idAttribute: ["region", "code"],
  mlSchema: {
    type: "object",
    definition: {
      region: {
        type: "string",
        tag: { value: { id: 1, defaultLabel: "Region" } },
      },
      code: {
        type: "string",
        tag: { value: { id: 2, defaultLabel: "Code" } },
      },
      parentName: {
        type: "string",
        optional: true,
        tag: { value: { id: 3, defaultLabel: "Entity Name" } },
      },
      parentUuid: {
        type: "uuid",
        tag: { value: { id: 4, defaultLabel: "Entity Uuid" } },
      },
      name: {
        type: "string",
        tag: { value: { id: 5, defaultLabel: "Name" } },
      },
    },
  },
} as any as EntityDefinition;

// Test data instances — PK is composite: region + code
const compositeItem1: EntityInstance = {
  region: "EU",
  code: "A1",
  parentUuid: entityCompositePKUuid,
  parentName: "TestEntityCompositePK",
  name: "EU-A1 item",
} as any as EntityInstance;

const compositeItem2: EntityInstance = {
  region: "EU",
  code: "B2",
  parentUuid: entityCompositePKUuid,
  parentName: "TestEntityCompositePK",
  name: "EU-B2 item",
} as any as EntityInstance;

const compositeItem3: EntityInstance = {
  region: "US",
  code: "A1",
  parentUuid: entityCompositePKUuid,
  parentName: "TestEntityCompositePK",
  name: "US-A1 item",
} as any as EntityInstance;

// MetaModel for our test deployment
const compositePKTestMetaModel: MetaModel = {
  applicationUuid: selfApplicationLibrary.uuid,
  applicationName: selfApplicationLibrary.name,
  entities: [entityPublisher as Entity, entityCompositePK],
  entityDefinitions: [
    entityDefinitionPublisher as EntityDefinition,
    entityDefinitionCompositePK,
  ],
  endpoints: [],
  jzodSchemas: [],
  menus: [],
  runners: [],
  themes: [],
  applicationVersions: [],
  reports: [],
  storedQueries: [],
  applicationVersionCrossEntityDefinition: [],
};

// ##############################################################################################

const env: any = process.env;

const fileName = "DomainController.integ.compositePK.CRUD.test";
const myConsoleLog = (...args: any[]) => console.log(fileName, ...args);

let miroirConfig: any;
let loggerOptions: LoggerOptions;
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, fileName)
).then((logger: LoggerInterface) => {
  log = logger;
});

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
miroirMongoDbStoreSectionStartup(ConfigurationService.configurationService);
miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);
ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

const { miroirConfig: miroirConfigParam, logConfig } = await loadTestConfigFiles(env);
miroirConfig = miroirConfigParam;
loggerOptions = logConfig;

const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
MiroirLoggerFactory.startRegisteredLoggers(
  miroirActivityTracker,
  miroirEventService,
  loglevelnext,
  loggerOptions
);

const globalTimeOut = 30000;

const deployment_Miroir: Deployment = {
  uuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  parentName: "Deployment",
  parentUuid: "7959d814-400c-4e80-988f-a00fe582ab98",
  name: "DefaultMiroirApplicationDeployment",
  defaultLabel:
    "Miroir SelfApplication Deployment Configuration declaring Miroir SelfApplication Deployment in Admin schema.",
  selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  description: "The default Deployment for SelfApplication Miroir",
  configuration: {
    admin: {
      emulatedServerType: "filesystem",
      directory: "../miroir-core/src/assets/admin",
    },
    model: {
      emulatedServerType: "filesystem",
      directory: "../miroir-test-app_deployment-miroir/assets/miroir_model",
    },
    data: {
      emulatedServerType: "filesystem",
      directory: "../miroir-test-app_deployment-miroir/assets/miroir_data",
    },
  },
};

const deployment_Library_DO_NO_USE: Deployment = {
  uuid: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  parentName: "Deployment",
  parentUuid: "35c5608a-7678-4f07-a4ec-76fc5bc35424",
  name: "LibraryApplicationFilesystemDeployment",
  defaultLabel: "LibraryApplicationFilesystemDeployment",
  selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
  description: "The default Filesystem Deployment for SelfApplication Library",
  configuration: {
    admin: {
      emulatedServerType: "sql",
      connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
      schema: "miroirAdmin",
    },
    model: {
      emulatedServerType: "sql",
      connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
      schema: "library",
    },
    data: {
      emulatedServerType: "sql",
      connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
      schema: "library",
    },
  },
};

const applicationDeploymentMap: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
};

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

const testApplicationUuid = selfApplicationLibrary.uuid;
const testApplicationDeploymentUuid = deployment_Library_DO_NO_USE.uuid;

const testDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[testApplicationDeploymentUuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[testApplicationDeploymentUuid];

let domainController: DomainControllerInterface;

// ##############################################################################################
// Shared action sequence helpers
// ##############################################################################################
const refreshMiroirAndLibrary = [
  {
    actionType: "rollback",
    actionLabel: "refreshMiroirLocalCache",
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    payload: { application: selfApplicationMiroir.uuid },
  },
  {
    actionType: "rollback",
    actionLabel: "refreshLibraryLocalCache",
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    payload: { application: testApplicationUuid },
  },
] as const;

const queryCompositePKInstances = {
  actionType: "compositeRunBoxedQueryAction",
  endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
  actionLabel: "queryCompositePKInstances",
  nameGivenToResult: "compositePKList",
  payload: {
    actionType: "runBoxedQueryAction",
    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
    payload: {
      application: testApplicationUuid,
      applicationSection: "data",
      query: {
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        application: testApplicationUuid,
        pageParams: { currentDeploymentUuid: testApplicationDeploymentUuid },
        extractors: {
          compositeItems: {
            extractorOrCombinerType: "extractorInstancesByEntity",
            applicationSection: "data",
            parentName: "TestEntityCompositePK",
            parentUuid: entityCompositePKUuid,
            orderBy: { attributeName: "name", direction: "ASC" },
          },
        },
      },
    },
  },
} as const;

const checkCount = (n: number) => ({
  actionType: "compositeRunTestAssertion" as const,
  actionLabel: "checkCount",
  nameGivenToResult: "checkCount",
  testAssertion: {
    testType: "testAssertion" as const,
    testLabel: "checkCount",
    definition: {
      resultAccessPath: ["0"] as string[],
      resultTransformer: {
        transformerType: "aggregate" as const,
        interpolation: "runtime" as const,
        applyTo: {
          transformerType: "getFromContext" as const,
          interpolation: "runtime" as const,
          referencePath: ["compositePKList", "compositeItems"] as string[],
        },
      },
      expectedValue: { aggregate: n },
    },
  },
});

// ##############################################################################################
// beforeAll / afterAll
// ##############################################################################################
beforeAll(async () => {
  myConsoleLog("@@@@@@@@@@@@@@@@@@ beforeAll");
  const { domainController: localDomainController } =
    await setupMiroirTestAndCreateMiroirDeployment(
      miroirConfig,
      miroirActivityTracker,
      miroirEventService,
      deployment_Miroir.uuid,
      adminApplication_Miroir.uuid,
      adminDeployment,
      miroirDeploymentStorageConfiguration,
      applicationDeploymentMap,
    );
  domainController = localDomainController;

  await resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, [
    selfApplicationDeploymentMiroir as Deployment,
  ]);
  document.body.innerHTML = "";
  myConsoleLog("@@@@@@@@@@@@@@@@@@ beforeAll DONE");
  return Promise.resolve();
});

afterAll(async () => {
  displayTestSuiteResultsDetails(
    Object.keys(dataTestActions)[0],
    [],
    miroirActivityTracker
  );
});

// ##############################################################################################
// ─── SUITE: Data CRUD with composite PK ──────────────────────────────────────
// beforeEach sets up TestEntityCompositePK with 3 initial instances.
// Tests CRUD on those composite-keyed instances.
// ##############################################################################################

const dataTestActions: Record<string, TestCompositeActionParams> = {
  "DomainController.integ.compositePK.Data.CRUD": {
    testActionType: "testCompositeActionSuite",
    testActionLabel: "DomainController.integ.compositePK.Data.CRUD",
    application: testApplicationUuid,
    testCompositeAction: {
      testType: "testCompositeActionSuite",
      testLabel: "DomainController.integ.compositePK.Data.CRUD",
      beforeAll: createDeploymentCompositeAction(
        "library",
        testApplicationDeploymentUuid,
        testApplicationUuid,
        adminDeployment,
        testDeploymentStorageConfiguration,
      ),
      beforeEach: resetAndinitializeDeploymentCompositeAction(
        selfApplicationLibrary.uuid,
        deployment_Library_DO_NO_USE.uuid,
        {
          dataStoreType: "app",
          metaModel: defaultMiroirMetaModel,
          selfApplication: selfApplicationLibrary,
          applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
          applicationVersion: selfApplicationVersionLibraryInitialVersion,
        },
        [
          {
            entity: entityCompositePK,
            entityDefinition: entityDefinitionCompositePK,
            instances: [compositeItem1, compositeItem2, compositeItem3],
          },
        ],
        compositePKTestMetaModel,
        [entityCompositePKUuid],
      ),
      afterEach: testUtils_resetApplicationDeployment(deployment_Library_DO_NO_USE.uuid),
      afterAll: testUtils_deleteApplicationDeployment(
        miroirConfig,
        selfApplicationLibrary.uuid,
        deployment_Library_DO_NO_USE.uuid,
      ),
      testCompositeActions: {
        // ─── Read ────────────────────────────────────────────────────────────
        "Refresh instances of TestEntityCompositePK": {
          testType: "testCompositeAction",
          testLabel: "Refresh instances of TestEntityCompositePK",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "refreshAndQuery",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              actionSequence: [
                ...refreshMiroirAndLibrary,
                queryCompositePKInstances,
              ],
            },
          },
          testCompositeActionAssertions: [
            checkCount(3),
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkItems",
              nameGivenToResult: "checkItems",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkItems",
                definition: {
                  resultAccessPath: ["compositePKList", "compositeItems"],
                  ignoreAttributes: ["conceptLevel"],
                  expectedValue: [compositeItem1, compositeItem2, compositeItem3],
                },
              },
            },
          ],
        },

        // ─── Create ──────────────────────────────────────────────────────────
        "Create instance in TestEntityCompositePK": {
          testType: "testCompositeAction",
          testLabel: "Create instance in TestEntityCompositePK",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "createAndQuery",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              actionSequence: [
                ...refreshMiroirAndLibrary,
                {
                  actionType: "createInstance",
                  actionLabel: "createCompositeItem4",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  payload: {
                    application: testApplicationUuid,
                    applicationSection: "data",
                    objects: [
                      {
                        region: "US",
                        code: "B2",
                        parentUuid: entityCompositePKUuid,
                        parentName: "TestEntityCompositePK",
                        name: "US-B2 item",
                      } as any as EntityInstance,
                    ],
                  },
                },
                queryCompositePKInstances,
              ],
            },
          },
          testCompositeActionAssertions: [checkCount(4)],
        },

        // ─── Update ──────────────────────────────────────────────────────────
        "Update instance in TestEntityCompositePK": {
          testType: "testCompositeAction",
          testLabel: "Update instance in TestEntityCompositePK",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "updateAndQuery",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              actionSequence: [
                ...refreshMiroirAndLibrary,
                {
                  actionType: "updateInstance",
                  actionLabel: "updateCompositeItem1",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  payload: {
                    application: testApplicationUuid,
                    applicationSection: "data",
                    objects: [
                      {
                        region: "EU",
                        code: "A1",
                        parentUuid: entityCompositePKUuid,
                        parentName: "TestEntityCompositePK",
                        name: "EU-A1 item UPDATED",
                      } as any as EntityInstance,
                    ],
                  },
                },
                queryCompositePKInstances,
              ],
            },
          },
          testCompositeActionAssertions: [
            checkCount(3),
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkUpdatedItem",
              nameGivenToResult: "checkUpdatedItem",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkUpdatedItem",
                definition: {
                  resultAccessPath: ["compositePKList", "compositeItems"],
                  ignoreAttributes: ["conceptLevel"],
                  expectedValue: [
                    {
                      region: "EU",
                      code: "A1",
                      parentUuid: entityCompositePKUuid,
                      parentName: "TestEntityCompositePK",
                      name: "EU-A1 item UPDATED",
                    },
                    compositeItem2,
                    compositeItem3,
                  ],
                },
              },
            },
          ],
        },

        // ─── Delete ──────────────────────────────────────────────────────────
        "Delete instance from TestEntityCompositePK": {
          testType: "testCompositeAction",
          testLabel: "Delete instance from TestEntityCompositePK",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "deleteAndQuery",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              actionSequence: [
                ...refreshMiroirAndLibrary,
                {
                  actionType: "deleteInstance",
                  actionLabel: "deleteCompositeItem2",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  payload: {
                    application: testApplicationUuid,
                    applicationSection: "data",
                    objects: [compositeItem2],
                  },
                },
                queryCompositePKInstances,
              ],
            },
          },
          testCompositeActionAssertions: [
            checkCount(2),
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkRemainingItems",
              nameGivenToResult: "checkRemainingItems",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkRemainingItems",
                definition: {
                  resultAccessPath: ["compositePKList", "compositeItems"],
                  ignoreAttributes: ["conceptLevel"],
                  expectedValue: [compositeItem1, compositeItem3],
                },
              },
            },
          ],
        },
      },
    },
  },
};

describe.sequential("DomainController.integ.compositePK.Data.CRUD", () => {
  it.each(Object.entries(dataTestActions))(
    "test %s",
    async (currentTestSuiteName, testAction: TestCompositeActionParams) => {
      const testSuiteResults = await runTestOrTestSuite(
        domainController,
        testAction,
        applicationDeploymentMap,
        miroirActivityTracker,
        {}
      );
      if (!testSuiteResults || testSuiteResults.status !== "ok") {
        expect(testSuiteResults?.status, `${currentTestSuiteName} failed!`).toBe("ok");
      }
    },
    globalTimeOut
  );
});
