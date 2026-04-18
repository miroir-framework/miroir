import { describe, expect } from "vitest";

import process from "process";

import type {
  ApplicationDeploymentMap,
  Deployment,
  Entity,
  EntityDefinition,
  EntityInstance,
  MetaModel,
  SelfApplication,
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
// Entity whose instances do NOT carry a parentUuid attribute.
// Uses standard UUID primary key.
// ##############################################################################################

const entityNoParentUuidUuid = "aaa11111-bbbb-cccc-dddd-eeee00001111";
const entityDefinitionNoParentUuidUuid = "aaa22222-bbbb-cccc-dddd-eeee00002222";

const entityNoParentUuid: Entity = {
  uuid: entityNoParentUuidUuid,
  parentName: "Entity",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
  selfApplication: selfApplicationLibrary.uuid,
  name: "TestEntityNoParentUuid",
  conceptLevel: "Model",
  description: "Test entity whose instances do not bear a parentUuid attribute.",
} as Entity;

const entityDefinitionNoParentUuid: EntityDefinition = {
  uuid: entityDefinitionNoParentUuidUuid,
  parentName: "EntityDefinition",
  parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
  parentDefinitionVersionUuid: "bdd7ad43-f0fc-4716-90c1-87454c40dd95",
  entityUuid: entityNoParentUuidUuid,
  conceptLevel: "Model",
  name: "TestEntityNoParentUuid",
  mlSchema: {
    type: "object",
    definition: {
      uuid: {
        type: "uuid",
        tag: { value: { id: 1, defaultLabel: "Uuid", editable: false } },
      },
      name: {
        type: "string",
        tag: { value: { id: 2, defaultLabel: "Name" } },
      },
      description: {
        type: "string",
        optional: true,
        tag: { value: { id: 3, defaultLabel: "Description" } },
      },
      // NO parentName, NO parentUuid in schema
    },
  },
} as EntityDefinition;

// Test data instances — NO parentUuid attribute
const noParentItem1: EntityInstance = {
  uuid: "ff000001-0000-0000-0000-000000000001",
  name: "item one",
} as any as EntityInstance;

const noParentItem2: EntityInstance = {
  uuid: "ff000002-0000-0000-0000-000000000002",
  name: "item two",
} as any as EntityInstance;

const noParentItem3: EntityInstance = {
  uuid: "ff000003-0000-0000-0000-000000000003",
  name: "item three",
} as any as EntityInstance;

// A minimal MetaModel for the test deployment
const noParentUuidTestMetaModel: MetaModel = {
  applicationUuid: selfApplicationLibrary.uuid,
  applicationName: selfApplicationLibrary.name,
  applications: [],
  entities: [entityPublisher as Entity, entityNoParentUuid],
  entityDefinitions: [
    entityDefinitionPublisher as EntityDefinition,
    entityDefinitionNoParentUuid,
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

const fileName = "DomainController.integ.noParentUuid.CRUD.test";
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

const queryNoParentUuidInstances = {
  actionType: "compositeRunBoxedQueryAction",
  endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
  actionLabel: "queryNoParentUuidInstances",
  nameGivenToResult: "noParentUuidList",
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
          items: {
            extractorOrCombinerType: "extractorInstancesByEntity",
            applicationSection: "data",
            parentName: "TestEntityNoParentUuid",
            parentUuid: entityNoParentUuidUuid,
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
          referencePath: ["noParentUuidList", "items"] as string[],
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
// Create the test entity and verify it appears in the model.
// ##############################################################################################

const modelTestActions: Record<string, TestCompositeActionParams> = {
  "DomainController.integ.noParentUuid.Model.CRUD": {
    testActionType: "testCompositeActionSuite",
    testActionLabel: "DomainController.integ.noParentUuid.Model.CRUD",
    application: testApplicationUuid,
    testCompositeAction: {
      testType: "testCompositeActionSuite",
      testLabel: "DomainController.integ.noParentUuid.Model.CRUD",
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
          selfApplication: selfApplicationLibrary as SelfApplication,
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
          applications: [],
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
        "Create Entity TestEntityNoParentUuid and Commit": {
          testType: "testCompositeAction",
          testLabel: "Create Entity TestEntityNoParentUuid and Commit",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "createNoParentUuidEntityAndCommit",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              actionSequence: [
                ...refreshMiroirAndLibrary,
                {
                  actionType: "createEntity",
                  actionLabel: "createEntityNoParentUuid",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                    entities: [
                      {
                        entity: entityNoParentUuid,
                        entityDefinition: entityDefinitionNoParentUuid,
                      },
                    ],
                  },
                },
                {
                  actionType: "commit",
                  actionLabel: "commitEntityNoParentUuid",
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
                        extractors: {
                          entities: {
                            extractorOrCombinerType: "extractorInstancesByEntity",
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
                  expectedValue: { aggregate: 2 }, // Publisher + TestEntityNoParentUuid
                },
              },
            },
          ],
        },
      },
    },
  },
};

describe.sequential("DomainController.integ.noParentUuid.Model.CRUD", () => {
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
// ─── SUITE 2: Data CRUD with instances that have no parentUuid ────────────────
// beforeEach sets up TestEntityNoParentUuid with 3 initial instances.
// All CUD actions provide payload.parentUuid as the fallback.
// Instances themselves have NO parentUuid attribute.
// ##############################################################################################

const dataTestActions: Record<string, TestCompositeActionParams> = {
  "DomainController.integ.noParentUuid.Data.CRUD": {
    testActionType: "testCompositeActionSuite",
    testActionLabel: "DomainController.integ.noParentUuid.Data.CRUD",
    application: testApplicationUuid,
    testCompositeAction: {
      testType: "testCompositeActionSuite",
      testLabel: "DomainController.integ.noParentUuid.Data.CRUD",
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
          selfApplication: selfApplicationLibrary as SelfApplication,
          applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
          applicationVersion: selfApplicationVersionLibraryInitialVersion,
        },
        [
          {
            entity: entityNoParentUuid,
            entityDefinition: entityDefinitionNoParentUuid,
            instances: [noParentItem1, noParentItem2, noParentItem3],
          },
        ],
        noParentUuidTestMetaModel,
        [entityNoParentUuidUuid],
      ),
      afterEach: testUtils_resetApplicationDeployment(deployment_Library_DO_NO_USE.uuid),
      afterAll: testUtils_deleteApplicationDeployment(
        miroirConfig,
        selfApplicationLibrary.uuid,
        deployment_Library_DO_NO_USE.uuid,
      ),
      testCompositeActions: {
        // ─── Read ────────────────────────────────────────────────────────────
        "Read instances of TestEntityNoParentUuid": {
          testType: "testCompositeAction",
          testLabel: "Read instances of TestEntityNoParentUuid",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "refreshAndQuery",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              actionSequence: [
                ...refreshMiroirAndLibrary,
                queryNoParentUuidInstances,
              ],
            },
          },
          testCompositeActionAssertions: [
            checkCount(3),
          ],
        },

        // ─── Create (no parentUuid on instance, payload.parentUuid as fallback) ───
        "Create instance without parentUuid": {
          testType: "testCompositeAction",
          testLabel: "Create instance without parentUuid",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "createAndQuery",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              actionSequence: [
                ...refreshMiroirAndLibrary,
                {
                  actionType: "createInstance",
                  actionLabel: "createNoParentItem4",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  payload: {
                    application: testApplicationUuid,
                    applicationSection: "data",
                    parentUuid: entityNoParentUuidUuid, // fallback for instances without parentUuid
                    objects: [
                      {
                        uuid: "ff000004-0000-0000-0000-000000000004",
                        name: "item four",
                      } as any as EntityInstance,
                    ],
                  },
                },
                queryNoParentUuidInstances,
              ],
            },
          },
          testCompositeActionAssertions: [checkCount(4)],
        },

        // ─── Update (no parentUuid on instance, payload.parentUuid as fallback) ───
        "Update instance without parentUuid": {
          testType: "testCompositeAction",
          testLabel: "Update instance without parentUuid",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "updateAndQuery",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              actionSequence: [
                ...refreshMiroirAndLibrary,
                {
                  actionType: "updateInstance",
                  actionLabel: "updateNoParentItem1",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  payload: {
                    application: testApplicationUuid,
                    applicationSection: "data",
                    parentUuid: entityNoParentUuidUuid,
                    objects: [
                      {
                        uuid: "ff000001-0000-0000-0000-000000000001",
                        name: "item one UPDATED",
                      } as any as EntityInstance,
                    ],
                  },
                },
                queryNoParentUuidInstances,
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
                  resultAccessPath: ["noParentUuidList", "items"],
                  ignoreAttributes: ["conceptLevel"],
                  expectedValue: [
                    {
                      uuid: "ff000001-0000-0000-0000-000000000001",
                      name: "item one UPDATED",
                    },
                    noParentItem3,
                    noParentItem2,
                  ],
                },
              },
            },
          ],
        },

        // ─── Delete (no parentUuid on instance, payload.parentUuid as fallback) ───
        "Delete instance without parentUuid": {
          testType: "testCompositeAction",
          testLabel: "Delete instance without parentUuid",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "deleteAndQuery",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              actionSequence: [
                ...refreshMiroirAndLibrary,
                {
                  actionType: "deleteInstance",
                  actionLabel: "deleteNoParentItem2",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  payload: {
                    application: testApplicationUuid,
                    applicationSection: "data",
                    parentUuid: entityNoParentUuidUuid,
                    objects: [noParentItem2],
                  },
                },
                queryNoParentUuidInstances,
              ],
            },
          },
          testCompositeActionAssertions: [
            checkCount(2),
          ],
        },

        // ─── Mixed: some instances WITH parentUuid, some WITHOUT ─────────
        "Create batch with mixed parentUuid presence": {
          testType: "testCompositeAction",
          testLabel: "Create batch with mixed parentUuid presence",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "mixedCreateAndQuery",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              actionSequence: [
                ...refreshMiroirAndLibrary,
                {
                  actionType: "createInstance",
                  actionLabel: "createMixedBatch",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  payload: {
                    application: testApplicationUuid,
                    applicationSection: "data",
                    parentUuid: entityNoParentUuidUuid, // fallback for those without parentUuid
                    objects: [
                      {
                        // Instance WITH explicit parentUuid
                        uuid: "ff000005-0000-0000-0000-000000000005",
                        parentUuid: entityNoParentUuidUuid,
                        name: "item five with parentUuid",
                      } as any as EntityInstance,
                      {
                        // Instance WITHOUT parentUuid — resolved from payload
                        uuid: "ff000006-0000-0000-0000-000000000006",
                        name: "item six without parentUuid",
                      } as any as EntityInstance,
                    ],
                  },
                },
                queryNoParentUuidInstances,
              ],
            },
          },
          testCompositeActionAssertions: [checkCount(5)], // 3 initial + 2 new
        },
      },
    },
  },
};

describe.sequential("DomainController.integ.noParentUuid.Data.CRUD", () => {
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
