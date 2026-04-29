/**
 * Runner_DropEntity.integ.test.tsx
 */
import "@testing-library/jest-dom";
import { v4 as uuidv4 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";

import {
  ConfigurationService,
  emptyApplicationModel,
  formatYYYYMMDD_HHMMSS,
  getMiroirConfig,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  testBuildPlusRuntimeCompositeActionSuiteForRunner,
  type DomainControllerInterface,
  type LoggerInterface,
  type LoggerOptions,
  type MiroirConfigClient,
  type Runner,
  type StoreUnitConfiguration
} from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import {
  entityEntity,
  runnerCreateEntity,
  runnerDeployApplication,
  runnerDropApplication,
  runnerDropEntity,
} from "miroir-test-app_deployment-miroir";
import { env } from "process";
import { loglevelnext } from "../../src/loglevelnextImporter";
import { runTestOrTestSuite } from "../../src/miroir-fwk/4-tests/tests-utils";
import { miroirAppStartup } from "../../src/startup";
import { loadTestConfigFiles } from "../utils/fileTools";

import { adminSelfApplication, entityApplicationForAdmin, entityDeployment } from "miroir-test-app_deployment-admin";
import { entityAuthor, entityDefinitionAuthor } from "miroir-test-app_deployment-library";
import simplifiedLibraryData from "../assets/library_extract/simplified-library-data.json";
import simplifiedLibraryModel from "../assets/library_extract/simplified-library-model.json";
import {
  afterAllTests,
  beforeAllTests,
  beforeEachTest,
  getTestConfig,
  testApplicationStorageConfiguration,
  type RunnerTestParams,
} from "./RunnerIntegTestTools";

// ################################################################################################
const pageLabel = "Runner_Miroir.integ.test";

let miroirConfig: any;
let loggerOptions: LoggerOptions;

const myConsoleLog = (...args: any[]) => console.log(pageLabel, ...args);
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName("tests", "5-tests", pageLabel)
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

// ################################################################################################
// ################################################################################################
// ################################################################################################
const globalTimeOut = 30000;

const testApplicationUuid = uuidv4();
const testApplicationDeploymentUuid = uuidv4();
const testApplicationName = "testApplication_" + formatYYYYMMDD_HHMMSS(new Date());

const installTestApplicationUuid = testApplicationUuid;
const installTestApplicationDeploymentUuid = testApplicationDeploymentUuid;
const installTestApplicationName = testApplicationName;

const {
  applicationDeploymentMap,
  miroirDeploymentStorageConfiguration,
  adminDeploymentStorageConfiguration,
  adminDeployment,
  libraryDeploymentStorageConfiguration,
} = getTestConfig(
  miroirConfig,
  testApplicationDeploymentUuid,
  testApplicationName,
  testApplicationUuid,
);

let testDeploymentStorageConfiguration: StoreUnitConfiguration = testApplicationStorageConfiguration(
  libraryDeploymentStorageConfiguration,
  testApplicationName,
);

const internalMiroirConfig: MiroirConfigClient = getMiroirConfig(
  miroirConfig,
  testDeploymentStorageConfiguration,
  testApplicationDeploymentUuid,
);

// Install runner test config
const testApplicationDeploymentMap = {
  ...applicationDeploymentMap,
  [testApplicationUuid]: testApplicationDeploymentUuid,
  // [installTestApplicationUuid]: installTestApplicationDeploymentUuid,
};
const installTestDeploymentStorageConfiguration: StoreUnitConfiguration = testApplicationStorageConfiguration(
  libraryDeploymentStorageConfiguration,
  installTestApplicationName,
);
const installInternalMiroirConfig = getMiroirConfig(
  miroirConfig,
  installTestDeploymentStorageConfiguration,
  installTestApplicationDeploymentUuid,
);

let domainController: DomainControllerInterface;

beforeAll(async () => {
  const {
    domainController: localdomainController,
  } = await  beforeAllTests(
    internalMiroirConfig,
    miroirActivityTracker,
    miroirEventService,
    adminDeployment,
    miroirDeploymentStorageConfiguration,
    applicationDeploymentMap,
  );
  domainController = localdomainController;
});

// executed only once like beforeAll, since there is only 1 test suite
beforeEach(async () => {
  await beforeEachTest(
    domainController,
    testApplicationDeploymentMap,
  );
});

afterAll(async () => {
  await afterAllTests(
    miroirActivityTracker,
    // Object.keys(runnerTestParams)
    Object.keys(filteredRunnerTestParams)
  );
});

// const localRunnerCreateApplication = getRunner_CreateApplication(
//   testApplicationUuid,
//   testApplicationDeploymentUuid,
//   "createApplicationAndDeployment",
//   emptyApplicationModel,
// )

const localRunnerInstallApplication = runnerDeployApplication as Runner;
  
const runnerTestParams: Record<string, RunnerTestParams> = {
  // [localRunnerCreateApplication.name]: {
  //   pageLabel,
  //   runner: localRunnerCreateApplication as Runner,
  //   testApplicationUuid,
  //   testApplicationDeploymentUuid,
  //   testApplicationName,
  //   testParams: {
  //     application: testApplicationUuid,
  //     entity: entityAuthor,
  //     entityDefinition: entityDefinitionAuthor,
  //     createApplicationAndDeployment: {
  //       applicationStorage: {
  //         emulatedServerType: "sql",
  //         connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  //         applicationName: testApplicationName,
  //       },
  //     },
  //   }, // testParams
  //   preTestCompositeActions: [
  //     {
  //       // performs query on local cache for emulated server, and on server for remote server
  //       actionType: "compositeRunBoxedQueryAction",
  //       endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
  //       actionLabel: "calculateNewEntityDefinionAndReports",
  //       nameGivenToResult: "libraryEntityList",
  //       payload: {
  //         actionType: "runBoxedQueryAction",
  //         endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //         payload: {
  //           application: testApplicationUuid,
  //           applicationSection: "model", // TODO: give only selfApplication section in individual queries?
  //           query: {
  //             queryType: "boxedQueryWithExtractorCombinerTransformer",
  //             application: testApplicationUuid,
  //             pageParams: {
  //               currentDeploymentUuid: testApplicationDeploymentUuid,
  //             },
  //             extractors: {
  //               entities: {
  //                 extractorOrCombinerType: "extractorInstancesByEntity",
  //                 applicationSection: "model",
  //                 parentName: entityEntity.name,
  //                 parentUuid: entityEntity.uuid,
  //                 orderBy: {
  //                   attributeName: "name",
  //                   direction: "ASC",
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   ], // preTestCompositeActions
  //   testCompositeActionAssertions: [
  //     // TODO: test length of entityBookList.books!
  //     {
  //       actionType: "compositeRunTestAssertion",
  //       actionLabel: "checkNumberOfEntities",
  //       nameGivenToResult: "checkNumberOfEntities",
  //       testAssertion: {
  //         testType: "testAssertion",
  //         testLabel: "checkNumberOfEntities",
  //         definition: {
  //           resultAccessPath: ["0"],
  //           resultTransformer: {
  //             transformerType: "aggregate",
  //             interpolation: "runtime",
  //             applyTo: {
  //               transformerType: "getFromContext",
  //               interpolation: "runtime",
  //               referencePath: ["libraryEntityList", "entities"],
  //             },
  //           },
  //           expectedValue: { aggregate: 0 },
  //         },
  //       },
  //     },
  //     // {
  //     //   actionType: "compositeRunTestAssertion",
  //     //   actionLabel: "checkEntityBooks",
  //     //   nameGivenToResult: "checkEntityList",
  //     //   testAssertion: {
  //     //     testType: "testAssertion",
  //     //     testLabel: "checkEntityBooks",
  //     //     definition: {
  //     //       resultAccessPath: ["libraryEntityList", "entities"],
  //     //       ignoreAttributes: ["author", "storageAccess"],
  //     //       expectedValue: [entityAuthor],
  //     //     },
  //     //   },
  //     // },
  //   ],
  //   internalMiroirConfig,
  //   adminDeployment,
  //   testDeploymentStorageConfiguration,
  //   initialModel: emptyApplicationModel,
  // },
  [localRunnerInstallApplication.name]: {
    pageLabel,
    runner: localRunnerInstallApplication as Runner,
    testApplicationUuid: installTestApplicationUuid,
    testApplicationDeploymentUuid: installTestApplicationDeploymentUuid,
    testApplicationName: installTestApplicationName,
    testParams: {
      deployApplication: {
        applicationBundle: {
          ...simplifiedLibraryModel,
          applications: [
            {
              // uuid: "5af03c98-fe5e-490b-b08f-e1230971c57f",
              uuid: installTestApplicationUuid,
              parentName: "SelfApplication",
              parentUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
              name: installTestApplicationName,
              defaultLabel: `The ${installTestApplicationName} selfApplication.`,
              description: `The model and data of the ${installTestApplicationName} selfApplication.`
            },
          ],
          applicationName: installTestApplicationName,
          applicationUuid: installTestApplicationUuid,
        },
        deploymentData: simplifiedLibraryData,
        newApplicationUuid: testApplicationUuid,
        deploymentUuid: installTestApplicationDeploymentUuid, // to enable getFromParameters on deploymentUuid in the runner
        applicationStorage: {
          emulatedServerType: "sql",
          connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
        },
      },
    }, // testParams
    preTestCompositeActions: [
      {
        // performs query on local cache for emulated server, and on server for remote server
        actionType: "compositeRunBoxedQueryAction",
        endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        actionLabel: "queryInstalledEntities",
        nameGivenToResult: "installedEntityList",
        payload: {
          actionType: "runBoxedQueryAction",
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          payload: {
            application: installTestApplicationUuid,
            applicationSection: "model",
            query: {
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              application: installTestApplicationUuid,
              pageParams: {
                currentDeploymentUuid: installTestApplicationDeploymentUuid,
              },
              extractors: {
                entities: {
                  extractorOrCombinerType: "extractorInstancesByEntity",
                  applicationSection: "model",
                  parentName: entityEntity.name,
                  parentUuid: entityEntity.uuid,
                  orderBy: {
                    attributeName: "name",
                    direction: "ASC",
                  },
                },
              },
            },
          },
        },
      },
      {
        // performs query on local cache for emulated server, and on server for remote server
        actionType: "compositeRunBoxedQueryAction",
        endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        actionLabel: "queryInstalledDeployments",
        nameGivenToResult: "installedDeploymentList",
        payload: {
          actionType: "runBoxedQueryAction",
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          payload: {
            application: adminSelfApplication.uuid,
            applicationSection: "data",
            query: {
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              application: adminSelfApplication.uuid,
              extractors: {
                deployments: {
                  extractorOrCombinerType: "extractorInstancesByEntity",
                  applicationSection: "data",
                  parentName: entityDeployment.name,
                  parentUuid: entityDeployment.uuid,
                  filter: {
                    attributeName: "selfApplication",
                    value: {
                      transformerType: "getFromParameters",
                      referencePath: ["deployApplication", "applicationBundle", "applicationUuid"],
                    },
                  },
                  // filter: {
                  //   attributeName: "selfApplication",
                  //   value: installTestApplicationUuid,
                  // },
                  orderBy: {
                    attributeName: "name",
                    direction: "ASC",
                  },
                },
              },
            },
          },
        },
      },
    ], // preTestCompositeActions
    testCompositeActionAssertions: [
      {
        actionType: "compositeRunTestAssertion",
        actionLabel: "checkDeployedApplication",
        nameGivenToResult: "checkDeployedApplication",
        testAssertion: {
          testType: "testAssertion",
          testLabel: "checkDeployedApplication",
          definition: {
            resultAccessPath: ["0"],
            resultTransformer: {
              transformerType: "aggregate",
              interpolation: "runtime",
              applyTo: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referencePath: ["installedDeploymentList", "deployments"],
              },
            },
            expectedValue: { aggregate: 1 },
          },
        },
      },
      {
        actionType: "compositeRunTestAssertion",
        actionLabel: "checkNumberOfEntities",
        nameGivenToResult: "checkNumberOfEntities",
        testAssertion: {
          testType: "testAssertion",
          testLabel: "checkNumberOfEntities",
          definition: {
            resultAccessPath: ["0"],
            resultTransformer: {
              transformerType: "aggregate",
              interpolation: "runtime",
              applyTo: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referencePath: ["installedEntityList", "entities"],
              },
            },
            expectedValue: { aggregate: 2 },
          },
        },
      },
      {
        actionType: "compositeRunTestAssertion",
        actionLabel: "checkInstalledEntities",
        nameGivenToResult: "checkInstalledEntities",
        testAssertion: {
          testType: "testAssertion",
          testLabel: "checkInstalledEntities",
          definition: {
            resultAccessPath: ["installedEntityList", "entities"],
            ignoreAttributes: ["author", "storageAccess"],
            expectedValue: [
              simplifiedLibraryModel.entities.find((e: any) => e.name === "Author"),
              simplifiedLibraryModel.entities.find((e: any) => e.name === "Country"),
            ],
          },
        },
      },
    ],
    internalMiroirConfig: installInternalMiroirConfig,
    adminDeployment,
    testDeploymentStorageConfiguration: installTestDeploymentStorageConfiguration,
    initialModel: emptyApplicationModel,
    skipCreateDeployment: true,
  },
  [runnerCreateEntity.name]: {
    pageLabel,
    runner: runnerCreateEntity as Runner,
    testApplicationUuid,
    testApplicationDeploymentUuid,
    testApplicationName,
    testParams: {
      [runnerCreateEntity.name]: {
        application: testApplicationUuid,
        entity: entityAuthor,
        entityDefinition: entityDefinitionAuthor,
      },
    }, // testParams
    preTestCompositeActions: [
      {
        // performs query on local cache for emulated server, and on server for remote server
        actionType: "compositeRunBoxedQueryAction",
        endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        actionLabel: "calculateNewEntityDefinionAndReports",
        nameGivenToResult: "libraryEntityList",
        payload: {
          actionType: "runBoxedQueryAction",
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          payload: {
            application: testApplicationUuid,
            applicationSection: "model", // TODO: give only selfApplication section in individual queries?
            query: {
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              application: testApplicationUuid,
              pageParams: {
                currentDeploymentUuid: testApplicationDeploymentUuid,
              },
              extractors: {
                entities: {
                  extractorOrCombinerType: "extractorInstancesByEntity",
                  applicationSection: "model",
                  parentName: entityEntity.name,
                  parentUuid: entityEntity.uuid,
                  orderBy: {
                    attributeName: "name",
                    direction: "ASC",
                  },
                },
              },
            },
          },
        },
      },
    ], // preTestCompositeActions
    testCompositeActionAssertions: [
      // TODO: test length of entityBookList.books!
      {
        actionType: "compositeRunTestAssertion",
        actionLabel: "checkNumberOfEntities",
        nameGivenToResult: "checkNumberOfEntities",
        testAssertion: {
          testType: "testAssertion",
          testLabel: "checkNumberOfEntities",
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
            expectedValue: { aggregate: 1 },
          },
        },
      },
      {
        actionType: "compositeRunTestAssertion",
        actionLabel: "checkEntityBooks",
        nameGivenToResult: "checkEntityList",
        testAssertion: {
          testType: "testAssertion",
          testLabel: "checkEntityBooks",
          definition: {
            resultAccessPath: ["libraryEntityList", "entities"],
            ignoreAttributes: ["author", "storageAccess"],
            expectedValue: [entityAuthor],
          },
        },
      },
    ],
    internalMiroirConfig: installInternalMiroirConfig,
    adminDeployment,
    testDeploymentStorageConfiguration: installTestDeploymentStorageConfiguration,
    initialModel: emptyApplicationModel,
  },
  [runnerDropEntity.name]: {
    pageLabel,
    runner: runnerDropEntity as unknown as Runner,
    testApplicationUuid,
    testApplicationDeploymentUuid,
    testApplicationName,
    testParams: {
      ["createEntity"]: {
        // used by the preRunnerCompositeAction to create the entity before dropping it
        application: testApplicationUuid,
        entity: entityAuthor,
        entityDefinition: entityDefinitionAuthor,
      },
      [runnerDropEntity.name]: {
        application: testApplicationUuid,
        entity: entityAuthor.uuid,
      },
    }, // testParams
    preTestCompositeActions: [
      {
        // performs query on local cache for emulated server, and on server for remote server
        actionType: "compositeRunBoxedQueryAction",
        endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        actionLabel: "calculateNewEntityDefinionAndReports",
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
              pageParams: {
                currentDeploymentUuid: testApplicationDeploymentUuid,
              },
              extractors: {
                entities: {
                  extractorOrCombinerType: "extractorInstancesByEntity",
                  applicationSection: "model",
                  parentName: entityEntity.name,
                  parentUuid: entityEntity.uuid,
                  orderBy: {
                    attributeName: "name",
                    direction: "ASC",
                  },
                },
              },
            },
          },
        },
      },
    ], // preTestCompositeActions
    testCompositeActionAssertions: [
      {
        actionType: "compositeRunTestAssertion",
        actionLabel: "checkNumberOfEntities",
        nameGivenToResult: "checkNumberOfEntities",
        testAssertion: {
          testType: "testAssertion",
          testLabel: "checkNumberOfEntities",
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
            expectedValue: { aggregate: 0 },
          },
        },
      },
      {
        actionType: "compositeRunTestAssertion",
        actionLabel: "checkEntityList",
        nameGivenToResult: "checkEntityList",
        testAssertion: {
          testType: "testAssertion",
          testLabel: "checkEntityList",
          definition: {
            resultAccessPath: ["libraryEntityList", "entities"],
            ignoreAttributes: ["author", "storageAccess"],
            expectedValue: [],
          },
        },
      },
    ],
    internalMiroirConfig: installInternalMiroirConfig,
    adminDeployment,
    testDeploymentStorageConfiguration: installTestDeploymentStorageConfiguration,
    initialModel: emptyApplicationModel,
    preRunnerCompositeActions: [runnerCreateEntity.definition.actionTemplate as any], // preRunnerCompositeActions: create the entity before dropping it
    testCompositeActionLabel: "Create and Drop Entity Author",
  },
  [runnerDropApplication.name]: {
    pageLabel,
    runner: runnerDropApplication as unknown as Runner,
    testApplicationUuid,
    testApplicationDeploymentUuid,
    testApplicationName,
    testParams: {
      [runnerDropApplication.name]: {
        application: testApplicationUuid,
        entity: entityAuthor.uuid,
      },
    }, // testParams
    preTestCompositeActions: [
      {
        // performs query on local cache for emulated server, and on server for remote server
        actionType: "compositeRunBoxedQueryAction",
        endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        actionLabel: "calculateNewEntityDefinionAndReports",
        nameGivenToResult: "adminApplicationList",
        payload: {
          actionType: "runBoxedQueryAction",
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          payload: {
            application: adminSelfApplication.uuid,
            applicationSection: "data",
            query: {
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              application: adminSelfApplication.uuid,
              extractors: {
                applications: {
                  extractorOrCombinerType: "extractorInstancesByEntity",
                  applicationSection: "data",
                  parentName: entityApplicationForAdmin.name,
                  parentUuid: entityApplicationForAdmin.uuid,
                  orderBy: {
                    attributeName: "name",
                    direction: "ASC",
                  },
                },
              },
            },
          },
        },
      },
    ], // preTestCompositeActions
    testCompositeActionAssertions: [
      {
        actionType: "compositeRunTestAssertion",
        actionLabel: "checkNumberOfApplications",
        nameGivenToResult: "checkNumberOfApplications",
        testAssertion: {
          testType: "testAssertion",
          testLabel: "checkNumberOfApplications",
          definition: {
            resultAccessPath: ["0"],
            resultTransformer: {
              transformerType: "aggregate",
              interpolation: "runtime",
              applyTo: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referencePath: ["adminApplicationList", "applications"],
              },
            },
            expectedValue: { aggregate: 2 }, // 2 applications should remain after dropping the test application: the admin application itself, and the miroir meta-application
          },
        },
      },
      // {
      //   actionType: "compositeRunTestAssertion",
      //   actionLabel: "checkEntityList",
      //   nameGivenToResult: "checkEntityList",
      //   testAssertion: {
      //     testType: "testAssertion",
      //     testLabel: "checkEntityList",
      //     definition: {
      //       resultAccessPath: ["libraryEntityList", "entities"],
      //       ignoreAttributes: ["author", "storageAccess"],
      //       expectedValue: [],
      //     },
      //   },
      // },
    ],
    internalMiroirConfig: installInternalMiroirConfig,
    adminDeployment,
    testDeploymentStorageConfiguration: installTestDeploymentStorageConfiguration,
    initialModel: emptyApplicationModel,
    // preRunnerCompositeActions: [runnerCreateEntity.definition.actionTemplate as any], // preRunnerCompositeActions: create the entity before dropping it
    testCompositeActionLabel: "Drop test Application",
    skipDropDeployment: true, // skip dropping deployment after test, since we are dropping the whole application (and thus the deployment) in the runner itself
  },
};

// filter to run only specific tests
const filteredRunnerTestParams: Record<string, RunnerTestParams> = Object.fromEntries(
  Object.entries(runnerTestParams).filter(([testName]) =>
    [
      // localRunnerCreateApplication.name,
      // localRunnerInstallApplication.name,
      runnerCreateEntity.name,
      // runnerDropEntity.name,
      // runnerDropApplication.name,
    ].includes(testName)
  )
);

describe.sequential(
  pageLabel,
  () => {
    it.each(Object.entries(filteredRunnerTestParams))(
      "test %s",
      async (currentTestSuiteName, runnerTestParams: RunnerTestParams) => {
        const runnerTestAction = testBuildPlusRuntimeCompositeActionSuiteForRunner(
          runnerTestParams.pageLabel,
          runnerTestParams.runner,
          runnerTestParams.testApplicationUuid,
          runnerTestParams.testApplicationDeploymentUuid,
          runnerTestParams.testApplicationName,
          runnerTestParams.testParams,
          runnerTestParams.preTestCompositeActions,
          runnerTestParams.testCompositeActionAssertions,
          //
          runnerTestParams.internalMiroirConfig,
          runnerTestParams.adminDeployment,
          runnerTestParams.testDeploymentStorageConfiguration,
          runnerTestParams.initialModel,
          runnerTestParams.preRunnerCompositeActions,
          runnerTestParams.testCompositeActionLabel,
          runnerTestParams.skipCreateDeployment,
          runnerTestParams.skipDropDeployment,
        );
        const testSuiteResults = await runTestOrTestSuite(
          domainController,
          runnerTestAction,
          testApplicationDeploymentMap, // applicationDeploymentMap,
          miroirActivityTracker,
          {}
        );
        if (!testSuiteResults || testSuiteResults.status !== "ok") {
          expect(testSuiteResults?.status, `${currentTestSuiteName} failed!`).toBe("ok");
        }
      },
      globalTimeOut
    );
  }
);
