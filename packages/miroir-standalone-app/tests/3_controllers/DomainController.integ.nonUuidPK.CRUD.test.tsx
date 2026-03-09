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
// Non-UUID PK test entity definition
// ##############################################################################################

const entityCodeNumberUuid = "ccc0d000-1c1c-2b2b-3a3a-4b4b5c5c6d6d";
const entityDefinitionCodeNumberUuid = "ddd1e111-2d2d-3e3e-4f4f-5a5a6b6b7c7c";

const entityCodeNumber: Entity = {
  uuid: entityCodeNumberUuid,
  parentName: "Entity",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
  selfApplication: selfApplicationLibrary.uuid,
  name: "TestEntityCodeNumber",
  conceptLevel: "Model",
  description: "Test entity with a non-UUID number primary key.",
} as Entity;

const entityDefinitionCodeNumber: EntityDefinition = {
  uuid: entityDefinitionCodeNumberUuid,
  parentName: "EntityDefinition",
  parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
  parentDefinitionVersionUuid: "bdd7ad43-f0fc-4716-90c1-87454c40dd95",
  entityUuid: entityCodeNumberUuid,
  conceptLevel: "Model",
  name: "TestEntityCodeNumber",
  idAttribute: "code",
  mlSchema: {
    type: "object",
    definition: {
      code: {
        type: "number",
        tag: { value: { id: 1, defaultLabel: "Code" } },
      },
      parentName: {
        type: "string",
        optional: true,
        tag: { value: { id: 2, defaultLabel: "Entity Name" } },
      },
      parentUuid: {
        type: "uuid",
        tag: { value: { id: 3, defaultLabel: "Entity Uuid" } },
      },
      name: {
        type: "string",
        tag: { value: { id: 4, defaultLabel: "Name" } },
      },
    },
  },
} as any as EntityDefinition; // cast needed since idAttribute is not yet in generated EntityDefinition type

// Test data instances (no uuid — PK is number field "code")
const codeItem1: EntityInstance = {
  code: 1,
  parentUuid: entityCodeNumberUuid,
  parentName: "TestEntityCodeNumber",
  name: "first item",
} as any as EntityInstance;

const codeItem2: EntityInstance = {
  code: 2,
  parentUuid: entityCodeNumberUuid,
  parentName: "TestEntityCodeNumber",
  name: "second item",
} as any as EntityInstance;

const codeItem3: EntityInstance = {
  code: 3,
  parentUuid: entityCodeNumberUuid,
  parentName: "TestEntityCodeNumber",
  name: "third item",
} as any as EntityInstance;

// A minimal MetaModel for the test deployment that includes entityCodeNumber
const codeNumberTestMetaModel: MetaModel = {
  applicationUuid: selfApplicationLibrary.uuid,
  applicationName: selfApplicationLibrary.name,
  entities: [entityPublisher as Entity, entityCodeNumber],
  entityDefinitions: [
    entityDefinitionPublisher as EntityDefinition,
    entityDefinitionCodeNumber,
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
console.log("@@@@@@@@@@@@@@@@@@ env", env);

const fileName = "DomainController.integ.nonUuidPK.CRUD.test";
const myConsoleLog = (...args: any[]) => console.log(fileName, ...args);
myConsoleLog(fileName, "received env", JSON.stringify(env, null, 2));

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
myConsoleLog("received miroirConfig", JSON.stringify(miroirConfig, null, 2));
myConsoleLog("received miroirConfig.client", JSON.stringify(miroirConfig.client, null, 2));
myConsoleLog("received loggerOptions", JSON.stringify(loggerOptions, null, 2));
const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
MiroirLoggerFactory.startRegisteredLoggers(
  miroirActivityTracker,
  miroirEventService,
  loglevelnext,
  loggerOptions
);
myConsoleLog("started registered loggers DONE");

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
// Shared action sequence helpers embedded in test compositeActions
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

const queryCodeNumberInstances = {
  actionType: "compositeRunBoxedQueryAction",
  endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
  actionLabel: "queryCodeNumberInstances",
  nameGivenToResult: "codeNumberList",
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
        queryParams: {},
        contextResults: {},
        extractors: {
          codeItems: {
            extractorOrCombinerType: "extractorByEntityReturningObjectList",
            applicationSection: "data",
            parentName: "TestEntityCodeNumber",
            parentUuid: entityCodeNumberUuid,
            orderBy: { attributeName: "code", direction: "ASC" },
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
          referencePath: ["codeNumberList", "codeItems"] as string[],
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
  myConsoleLog("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ beforeAll");
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
  myConsoleLog("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ beforeAll DONE");
  return Promise.resolve();
});

afterAll(async () => {
  displayTestSuiteResultsDetails(
    Object.keys(modelTestActions)[0],
    [],
    miroirActivityTracker
  );
});

// ##############################################################################################
// ─── SUITE 1: Model CRUD ─────────────────────────────────────────────────────
// Create an entity with non-UUID number PK and verify it in the model store.
// beforeEach initialises Library with Publisher only; each test creates
// entityCodeNumber as part of its action sequence.
// ##############################################################################################

const modelTestActions: Record<string, TestCompositeActionParams> = {
  "DomainController.integ.nonUuidPK.Model.CRUD": {
    testActionType: "testCompositeActionSuite",
    testActionLabel: "DomainController.integ.nonUuidPK.Model.CRUD",
    application: testApplicationUuid,
    testCompositeAction: {
      testType: "testCompositeActionSuite",
      testLabel: "DomainController.integ.nonUuidPK.Model.CRUD",
      beforeAll: createDeploymentCompositeAction(
        "library",
        testApplicationDeploymentUuid,
        testApplicationUuid,
        adminDeployment,
        testDeploymentStorageConfiguration,
      ),
      // beforeEach: Publisher only so we can test entity creation
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
            entity: entityPublisher as Entity,
            entityDefinition: entityDefinitionPublisher as EntityDefinition,
            instances: [
              publisher1 as EntityInstance,
              publisher2 as EntityInstance,
              publisher3 as EntityInstance,
            ],
          },
        ],
        {
          applicationUuid: selfApplicationLibrary.uuid,
          applicationName: selfApplicationLibrary.name,
          entities: [entityPublisher as Entity],
          entityDefinitions: [entityDefinitionPublisher as EntityDefinition],
          endpoints: [],
          jzodSchemas: [],
          menus: [],
          runners: [],
          themes: [],
          applicationVersions: [],
          reports: [],
          storedQueries: [],
          applicationVersionCrossEntityDefinition: [],
        } as MetaModel,
        [entityPublisher.uuid],
      ),
      afterEach: testUtils_resetApplicationDeployment(deployment_Library_DO_NO_USE.uuid),
      afterAll: testUtils_deleteApplicationDeployment(
        miroirConfig,
        selfApplicationLibrary.uuid,
        deployment_Library_DO_NO_USE.uuid,
      ),
      testCompositeActions: {
        "Create Entity TestEntityCodeNumber and Commit": {
          testType: "testCompositeAction",
          testLabel: "Create Entity TestEntityCodeNumber and Commit",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "createCodeNumberEntityAndCommit",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              actionSequence: [
                ...refreshMiroirAndLibrary,
                {
                  actionType: "createEntity",
                  actionLabel: "createEntityCodeNumber",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                    entities: [
                      {
                        entity: entityCodeNumber,
                        entityDefinition: entityDefinitionCodeNumber,
                      },
                    ],
                  },
                },
                {
                  actionType: "commit",
                  actionLabel: "commitEntityCodeNumber",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: { application: testApplicationUuid },
                },
                {
                  actionType: "compositeRunBoxedQueryAction",
                  endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
                  actionLabel: "queryEntities",
                  nameGivenToResult: "libraryEntityList",
                  payload: {
                    actionType: "runBoxedQueryAction",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    payload: {
                      application: testApplicationUuid,
                      applicationSection: "model",
                      query: {
                        queryType: "boxedQueryWithExtractorCombinerTransformer",
                        application: testApplicationUuid,
                        pageParams: { currentDeploymentUuid: testApplicationDeploymentUuid },
                        queryParams: {},
                        contextResults: {},
                        extractors: {
                          entities: {
                            extractorOrCombinerType: "extractorByEntityReturningObjectList",
                            applicationSection: "model",
                            parentName: entityEntity.name,
                            parentUuid: entityEntity.uuid,
                            orderBy: { attributeName: "name", direction: "ASC" },
                          },
                        },
                      },
                    },
                  },
                },
              ],
            },
          },
          testCompositeActionAssertions: [
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkEntityCount",
              nameGivenToResult: "checkEntityCount",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkEntityCount",
                definition: {
                  resultAccessPath: ["0"],
                  resultTransformer: {
                    transformerType: "aggregate",
                    interpolation: "runtime",
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referencePath: ["libraryEntityList", "entities"],
                    },
                  },
                  expectedValue: { aggregate: 2 }, // Publisher + TestEntityCodeNumber
                },
              },
            },
          ],
        },
      },
    },
  },
};

describe.sequential("DomainController.integ.nonUuidPK.Model.CRUD", () => {
  it.each(Object.entries(modelTestActions))(
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

// ##############################################################################################
// ─── SUITE 2: Data CRUD with non-UUID PK ─────────────────────────────────────
// beforeEach sets up TestEntityCodeNumber with 3 initial instances (code: 1, 2, 3).
// Tests CRUD on those instances.
// ##############################################################################################

const dataTestActions: Record<string, TestCompositeActionParams> = {
  "DomainController.integ.nonUuidPK.Data.CRUD": {
    testActionType: "testCompositeActionSuite",
    testActionLabel: "DomainController.integ.nonUuidPK.Data.CRUD",
    application: testApplicationUuid,
    testCompositeAction: {
      testType: "testCompositeActionSuite",
      testLabel: "DomainController.integ.nonUuidPK.Data.CRUD",
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
            entity: entityCodeNumber,
            entityDefinition: entityDefinitionCodeNumber,
            instances: [codeItem1, codeItem2, codeItem3],
          },
        ],
        codeNumberTestMetaModel,
        [entityCodeNumberUuid],
      ),
      afterEach: testUtils_resetApplicationDeployment(deployment_Library_DO_NO_USE.uuid),
      afterAll: testUtils_deleteApplicationDeployment(
        miroirConfig,
        selfApplicationLibrary.uuid,
        deployment_Library_DO_NO_USE.uuid,
      ),
      testCompositeActions: {
        // ─── Read ────────────────────────────────────────────────────────────
        "Refresh instances of TestEntityCodeNumber": {
          testType: "testCompositeAction",
          testLabel: "Refresh instances of TestEntityCodeNumber",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "refreshAndQuery",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              actionSequence: [
                ...refreshMiroirAndLibrary,
                queryCodeNumberInstances,
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
                  resultAccessPath: ["codeNumberList", "codeItems"],
                  ignoreAttributes: ["conceptLevel"],
                  expectedValue: [codeItem1, codeItem2, codeItem3],
                },
              },
            },
          ],
        },

        // ─── Create ──────────────────────────────────────────────────────────
        "Create instance in TestEntityCodeNumber": {
          testType: "testCompositeAction",
          testLabel: "Create instance in TestEntityCodeNumber",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "createAndQuery",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              actionSequence: [
                ...refreshMiroirAndLibrary,
                {
                  actionType: "createInstance",
                  actionLabel: "createCodeItem4",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  payload: {
                    application: testApplicationUuid,
                    applicationSection: "data",
                    objects: [
                      {
                        code: 4,
                        parentUuid: entityCodeNumberUuid,
                        parentName: "TestEntityCodeNumber",
                        name: "fourth item",
                      } as any as EntityInstance,
                    ],
                  },
                },
                queryCodeNumberInstances,
              ],
            },
          },
          testCompositeActionAssertions: [checkCount(4)],
        },

        // ─── Update ──────────────────────────────────────────────────────────
        "Update instance in TestEntityCodeNumber": {
          testType: "testCompositeAction",
          testLabel: "Update instance in TestEntityCodeNumber",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "updateAndQuery",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              actionSequence: [
                ...refreshMiroirAndLibrary,
                {
                  actionType: "updateInstance",
                  actionLabel: "updateCodeItem1",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  payload: {
                    application: testApplicationUuid,
                    applicationSection: "data",
                    objects: [
                      {
                        code: 1,
                        parentUuid: entityCodeNumberUuid,
                        parentName: "TestEntityCodeNumber",
                        name: "first item UPDATED",
                      } as any as EntityInstance,
                    ],
                  },
                },
                queryCodeNumberInstances,
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
                  resultAccessPath: ["codeNumberList", "codeItems"],
                  ignoreAttributes: ["conceptLevel"],
                  expectedValue: [
                    {
                      code: 1,
                      parentUuid: entityCodeNumberUuid,
                      parentName: "TestEntityCodeNumber",
                      name: "first item UPDATED",
                    },
                    codeItem2,
                    codeItem3,
                  ],
                },
              },
            },
          ],
        },

        // ─── Delete ──────────────────────────────────────────────────────────
        "Delete instance from TestEntityCodeNumber": {
          testType: "testCompositeAction",
          testLabel: "Delete instance from TestEntityCodeNumber",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "deleteAndQuery",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              actionSequence: [
                ...refreshMiroirAndLibrary,
                {
                  actionType: "deleteInstance",
                  actionLabel: "deleteCodeItem2",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  payload: {
                    application: testApplicationUuid,
                    applicationSection: "data",
                    objects: [codeItem2],
                  },
                },
                queryCodeNumberInstances,
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
                  resultAccessPath: ["codeNumberList", "codeItems"],
                  ignoreAttributes: ["conceptLevel"],
                  expectedValue: [codeItem1, codeItem3],
                },
              },
            },
          ],
        },
      },
    },
  },
};

describe.sequential("DomainController.integ.nonUuidPK.Data.CRUD", () => {
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
