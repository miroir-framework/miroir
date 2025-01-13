import { describe, expect } from 'vitest';

import { v4 as uuidv4 } from "uuid";

// import { miroirFileSystemStoreSectionStartup } from "../dist/bundle";
import {
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  author1,
  author2,
  author3,
  book1,
  book2,
  book3,
  book4,
  book5,
  book6,
  ConfigurationService,
  defaultMiroirMetaModel,
  DomainControllerInterface,
  entityAuthor,
  entityBook,
  EntityDefinition,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionPublisher,
  entityEntity,
  EntityInstance,
  entityPublisher,
  getBasicApplicationConfiguration,
  getBasicStoreUnitConfiguration,
  LoggerInterface,
  MetaEntity,
  MiroirContext,
  miroirCoreStartup,
  MiroirLoggerFactory,
  PersistenceStoreControllerManagerInterface,
  publisher1,
  publisher2,
  publisher3,
  resetAndInitApplicationDeployment,
  SelfApplicationDeploymentConfiguration,
  selfApplicationDeploymentLibrary,
  selfApplicationDeploymentMiroir,
  selfApplicationLibrary,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationStoreBasedConfigurationLibrary,
  selfApplicationVersionLibraryInitialVersion,
  StoreUnitConfiguration,
  TestSuiteResult,
  Uuid
} from "miroir-core";


import { AdminApplicationDeploymentConfiguration } from 'miroir-core/src/0_interfaces/1_core/StorageConfiguration.js';
import { LoggerOptions } from 'miroir-core/src/0_interfaces/4-services/LoggerInterface.js';
import { packageName } from 'miroir-core/src/constants.js';
import { LocalCache } from 'miroir-localcache-redux';
import { miroirFileSystemStoreSectionStartup } from 'miroir-store-filesystem';
import { miroirIndexedDbStoreSectionStartup } from 'miroir-store-indexedDb';
import { miroirPostgresStoreSectionStartup } from 'miroir-store-postgres';
import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { miroirAppStartup } from '../../src/startup.js';
import {
  createDeploymentCompositeAction,
  deleteAndCloseApplicationDeployments,
  loadTestConfigFiles,
  resetAndinitializeDeploymentCompositeAction,
  runTestOrTestSuite,
  setupMiroirTest,
  TestActionParams
} from "../utils/tests-utils.js";
import { cleanLevel } from './constants.js';
import { InitApplicationParameters } from 'miroir-core/src/0_interfaces/4-services/PersistenceStoreControllerInterface.js';
import { getBasicApplicationConfigurationParameters } from 'miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js';

let domainController: DomainControllerInterface;
let localCache: LocalCache;
// let localMiroirPersistenceStoreController: PersistenceStoreControllerInterface;
// let localAppPersistenceStoreController: PersistenceStoreControllerInterface;
let miroirContext: MiroirContext;
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;
let globalTestSuiteResults: TestSuiteResult = {};

const env:any = (import.meta as any).env
console.log("@@@@@@@@@@@@@@@@@@ env", env);

const myConsoleLog = (...args: any[]) => console.log(fileName, ...args);
const fileName = "DomainNewController.integ.test";
myConsoleLog(fileName, "received env", JSON.stringify(env, null, 2));

let miroirConfig:any;
let loggerOptions:LoggerOptions;
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, fileName)
).then((logger: LoggerInterface) => {log = logger});

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup();
miroirIndexedDbStoreSectionStartup();
miroirPostgresStoreSectionStartup();
ConfigurationService.registerTestImplementation({expect: expect as any});

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
  loglevelnext,
  loggerOptions,
);
myConsoleLog("started registered loggers DONE");

const miroirtDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentMiroir.uuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[adminConfigurationDeploymentMiroir.uuid];

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
  ...adminConfigurationDeploymentMiroir,
  configuration: miroirStoreUnitConfigurationForTest,
} as AdminApplicationDeploymentConfiguration;

// ################################################################################################
beforeAll(
  async () => {
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
      typedAdminConfigurationDeploymentMiroir.uuid,
      typedAdminConfigurationDeploymentMiroir.configuration,
    );
    const createDeploymentResult = await domainController.handleCompositeAction(
      createMiroirDeploymentCompositeAction,
      defaultMiroirMetaModel
    );
    if (createDeploymentResult.status !== "ok") {
      throw new Error("Failed to create Miroir deployment: " + JSON.stringify(createDeploymentResult));
    }

    return Promise.resolve();
  }
)

// ################################################################################################
beforeEach(
  async  () => {
    await resetAndInitApplicationDeployment(domainController, [
      selfApplicationDeploymentMiroir as SelfApplicationDeploymentConfiguration,
    ]);
    document.body.innerHTML = '';
  }
)

// ################################################################################################
afterEach(
  async () => {
  }
)

// ################################################################################################
afterAll(
  async () => {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ deleteAndCloseApplicationDeployments")
    await deleteAndCloseApplicationDeployments(
      miroirConfig,
      domainController,
      [
        typedAdminConfigurationDeploymentMiroir
      ],
    );
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done deleteAndCloseApplicationDeployments")
    console.log("globalTestSuiteResults:\n", Object.values(globalTestSuiteResults).map((r) => "\"" + r.testLabel + "\": " + r.testResult).join("\n"));
  }
)


// ##############################################################################################
// ##############################################################################################
// ##############################################################################################

const libraryEntitesAndInstances = [
  {
    entity: entityAuthor as MetaEntity,
    entityDefinition: entityDefinitionAuthor as EntityDefinition,
    instances: [
      author1,
      author2,
      author3 as EntityInstance,
    ]
  },
  {
    entity: entityBook as MetaEntity,
    entityDefinition: entityDefinitionBook as EntityDefinition,
    instances: [
      book1 as EntityInstance,
      book2 as EntityInstance,
      book3 as EntityInstance,
      book4 as EntityInstance,
      book5 as EntityInstance,
      book6 as EntityInstance,
    ]
  },
  {
    entity: entityPublisher as MetaEntity,
    entityDefinition: entityDefinitionPublisher as EntityDefinition,
    instances: [
      publisher1 as EntityInstance,
      publisher2 as EntityInstance,
      publisher3 as EntityInstance,
    ]
  }
];

const  testSelfApplicationUuid: Uuid = uuidv4();
const  testAdminConfigurationDeploymentUuid: Uuid = uuidv4();
const  testApplicationModelBranchUuid: Uuid = uuidv4();
const  testApplicationVersionUuid: Uuid = uuidv4();

const testDeploymentStorageConfiguration: StoreUnitConfiguration = getBasicStoreUnitConfiguration(
  "test",
  {
    emulatedServerType: "sql",
    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  }
)

const initParametersForTest:InitApplicationParameters = getBasicApplicationConfiguration(
  "Test",
  testSelfApplicationUuid,
  testAdminConfigurationDeploymentUuid,
  testApplicationModelBranchUuid,
  testApplicationVersionUuid,
)

const testActions: Record<string, TestActionParams> = {
  "applicative.Library.integ.test": {
    testActionType: "testCompositeActionSuite",
    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
    testActionLabel: "applicative.Library.integ.test",
    testCompositeAction: {
      testType: "testCompositeActionSuite",
      testLabel: "applicative.Library.integ.test",
      beforeAll: createDeploymentCompositeAction(
        testAdminConfigurationDeploymentUuid,
        testDeploymentStorageConfiguration,
      ),
      beforeEach: resetAndinitializeDeploymentCompositeAction(
        testAdminConfigurationDeploymentUuid,
        initParametersForTest,
        libraryEntitesAndInstances,
      ),
      afterEach: {
        actionType: "compositeAction",
        actionLabel: "afterEach",
        actionName: "sequence",
        definition: [
          {
            compositeActionType: "domainAction",
            compositeActionStepLabel: "resetLibraryStore",
            domainAction: {
              actionType: "modelAction",
              actionName: "resetModel",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              deploymentUuid: testAdminConfigurationDeploymentUuid,
            },
          },
        ],
      },
      afterAll: {
        actionType: "compositeAction",
        actionLabel: "afterEach",
        actionName: "sequence",
        definition: [
          {
            compositeActionType: "domainAction",
            compositeActionStepLabel: "resetLibraryStore",
            domainAction: {
              actionType: "storeManagementAction",
              actionName: "deleteStore",
              endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
              deploymentUuid: testAdminConfigurationDeploymentUuid,
              configuration: testDeploymentStorageConfiguration,
            },
          },
        ],
      },
      testCompositeActions: {
        "get Entity Entity from Miroir": {
          testType: "testCompositeAction",
          testLabel: "getEntityEntity",
          compositeAction: {
            actionType: "compositeAction",
            actionLabel: "selectEntityEntity",
            actionName: "sequence",
            definition: [
              {
                compositeActionType: "domainAction",
                compositeActionStepLabel: "selectEntityEntity_refresh",
                domainAction: {
                  actionName: "rollback",
                  actionType: "modelAction",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                },
              },
              {
                compositeActionType: "runBoxedExtractorOrQueryAction",
                compositeActionStepLabel: "calculateNewEntityDefinionAndReports",
                nameGivenToResult: "entityEntity",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  applicationSection: "model", // TODO: give only selfApplication section in individual queries?
                  deploymentUuid: typedAdminConfigurationDeploymentMiroir.uuid,
                  query: {
                    queryType: "boxedQueryWithExtractorCombinerTransformer",
                    deploymentUuid: typedAdminConfigurationDeploymentMiroir.uuid,
                    pageParams: {
                      currentDeploymentUuid: typedAdminConfigurationDeploymentMiroir.uuid,
                    },
                    queryParams: {},
                    contextResults: {},
                    extractors: {
                      entity: {
                        extractorOrCombinerType: "extractorForObjectByDirectReference",
                        applicationSection: "model",
                        parentName: "Entity",
                        parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                        instanceUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                      },
                    },
                  },
                },
              },
            ],
          },
          testCompositeActionAssertions: [
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkEntityEntity",
              nameGivenToResult: "checkEntityEntity",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkEntityEntity",
                definition: {
                  resultAccessPath: ["entityEntity", "entity"],
                  ignoreAttributes: ["author"],
                  expectedValue: entityEntity,
                },
              },
            },
          ],
        },
      },
    },
  },
  // ]
  // "create new SelfApplication": {
  //   testActionType: "testCompositeAction",
  //   deploymentUuid: typedAdminConfigurationDeploymentMiroir.uuid,
  //   compositeTestAction: {
  //     testType: "testCompositeAction",
  //     compositeAction: {
  //       actionType: "compositeAction",
  //       actionName: "sequence",
  //       templates: {
  //         // business objects
  //         newDeploymentStoreConfiguration: {
  //           admin: {
  //             emulatedServerType: "sql",
  //             connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  //             schema: "miroirAdmin",
  //           },
  //           model: {
  //             emulatedServerType: "sql",
  //             connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  //             schema: {
  //               transformerType: "mustacheStringTemplate",
  //               definition: "{{newApplicationName}}Model",
  //             },
  //           },
  //           data: {
  //             emulatedServerType: "sql",
  //             connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  //             schema: {
  //               transformerType: "mustacheStringTemplate",
  //               definition: "{{newApplicationName}}Data",
  //             },
  //           },
  //         },
  //         newApplicationForAdmin: {
  //           uuid: {
  //             transformerType: "parameterReference",
  //             referenceName: "newAdminAppApplicationUuid",
  //           },
  //           parentName: {
  //             transformerType: "mustacheStringTemplate",
  //             definition: "{{entityApplicationForAdmin.name}}",
  //           },
  //           parentUuid: {
  //             transformerType: "mustacheStringTemplate",
  //             definition: "{{entityApplicationForAdmin.uuid}}",
  //           },
  //           name: {
  //             transformerType: "parameterReference",
  //             referenceName: "newApplicationName",
  //           },
  //           defaultLabel: {
  //             transformerType: "mustacheStringTemplate",
  //             definition: "The {{newApplicationName}} selfApplication.",
  //           },
  //           description: {
  //             transformerType: "mustacheStringTemplate",
  //             definition: "This selfApplication contains the {{newApplicationName}} model and data",
  //           },
  //           selfApplication: {
  //             transformerType: "parameterReference",
  //             referenceName: "newSelfApplicationUuid",
  //           },
  //         },
  //         newSelfApplication: {
  //           uuid: {
  //             transformerType: "parameterReference",
  //             referenceName: "newSelfApplicationUuid",
  //           },
  //           parentName: "SelfApplication",
  //           parentUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
  //           name: {
  //             transformerType: "parameterReference",
  //             referenceName: "newApplicationName",
  //           },
  //           defaultLabel: {
  //             transformerType: "mustacheStringTemplate",
  //             definition: "The {{newApplicationName}} selfApplication.",
  //           },
  //           description: {
  //             transformerType: "mustacheStringTemplate",
  //             definition: "This selfApplication contains the {{newApplicationName}} model and data",
  //           },
  //           selfApplication: {
  //             transformerType: "parameterReference",
  //             referenceName: "newSelfApplicationUuid",
  //           },
  //         },
  //         DeploymentConfiguration: {
  //           uuid: {
  //             transformerType: "parameterReference",
  //             referenceName: "newDeploymentUuid",
  //           },
  //           parentName: {
  //             transformerType: "mustacheStringTemplate",
  //             definition: "{{entityDeployment.name}}",
  //           },
  //           parentUuid: {
  //             transformerType: "mustacheStringTemplate",
  //             definition: "{{entityDeployment.uuid}}",
  //           },
  //           name: {
  //             transformerType: "mustacheStringTemplate",
  //             definition: "{{newApplicationName}}ApplicationSqlDeployment",
  //           },
  //           defaultLabel: {
  //             transformerType: "mustacheStringTemplate",
  //             definition: "{{newApplicationName}}ApplicationSqlDeployment",
  //           },
  //           selfApplication: {
  //             transformerType: "mustacheStringTemplate",
  //             definition: "{{newApplicationForAdmin.uuid}}",
  //           },
  //           description: {
  //             transformerType: "mustacheStringTemplate",
  //             definition: "The default Sql Deployment for SelfApplication {{newApplicationName}}",
  //           },
  //           configuration: {
  //             transformerType: "parameterReference",
  //             referenceName: "newDeploymentStoreConfiguration",
  //           },
  //         },
  //         newApplicationMenu: {
  //           uuid: "84c178cc-1b1b-497a-a035-9b3d756bb085",
  //           parentName: "Menu",
  //           parentUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
  //           parentDefinitionVersionUuid: "0f421b2f-2fdc-47ee-8232-62121ea46350",
  //           name: {
  //             transformerType: "mustacheStringTemplate",
  //             definition: "{{newApplicationName}}Menu",
  //           },
  //           defaultLabel: "Meta-Model",
  //           description: {
  //             transformerType: "mustacheStringTemplate",
  //             definition: "This is the default menu allowing to explore the {{newApplicationName}} SelfApplication",
  //           },
  //           definition: {
  //             menuType: "complexMenu",
  //             definition: [
  //               {
  //                 title: {
  //                   transformerType: "parameterReference",
  //                   referenceName: "newApplicationName",
  //                 },
  //                 label: {
  //                   transformerType: "parameterReference",
  //                   referenceName: "newApplicationName",
  //                 },
  //                 items: [
  //                   {
  //                     label: {
  //                       transformerType: "mustacheStringTemplate",
  //                       definition: "{{newApplicationName}} Entities",
  //                     },
  //                     section: "model",
  //                     selfApplication: {
  //                       transformerType: "parameterReference",
  //                       referenceName: "newDeploymentUuid",
  //                     },
  //                     reportUuid: "c9ea3359-690c-4620-9603-b5b402e4a2b9",
  //                     icon: "category",
  //                   },
  //                   {
  //                     label: {
  //                       transformerType: "mustacheStringTemplate",
  //                       definition: "{{newApplicationName}} Entity Definitions",
  //                     },
  //                     section: "model",
  //                     selfApplication: {
  //                       transformerType: "parameterReference",
  //                       referenceName: "newDeploymentUuid",
  //                     },
  //                     reportUuid: "f9aff35d-8636-4519-8361-c7648e0ddc68",
  //                     icon: "category",
  //                   },
  //                   {
  //                     label: {
  //                       transformerType: "mustacheStringTemplate",
  //                       definition: "{{newApplicationName}} Reports",
  //                     },
  //                     section: "model",
  //                     selfApplication: {
  //                       transformerType: "parameterReference",
  //                       referenceName: "newDeploymentUuid",
  //                     },
  //                     reportUuid: "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855",
  //                     icon: "list",
  //                   },
  //                 ],
  //               },
  //             ],
  //           },
  //         },
  //       },
  //       definition: [
  //         // openStoreAction
  //         {
  //           compositeActionType: "domainAction",
  //           compositeActionStepLabel: "openStoreAction",
  //           domainAction: {
  //             actionType: "storeManagementAction",
  //             actionName: "openStore",
  //             endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
  //             configuration: {
  //               transformerType: "fullObjectTemplate",
  //               referencedExtractor: "NOT_RELEVANT",
  //               definition: [
  //                 {
  //                   attributeKey: {
  //                     transformerType: "parameterReference",
  //                     referenceName: "newDeploymentUuid",
  //                   },
  //                   attributeValue: {
  //                     transformerType: "parameterReference",
  //                     referenceName: "newDeploymentStoreConfiguration",
  //                   }
  //                 }
  //               ],
  //             },
  //             deploymentUuid: {
  //               transformerType: "parameterReference",
  //               referenceName: "newDeploymentUuid",
  //             },
  //           }
  //         },
  //         // createStoreAction
  //         {
  //           compositeActionType: "domainAction",
  //           compositeActionStepLabel: "createStoreAction",
  //           domainAction: {
  //             actionType: "storeManagementAction",
  //             actionName: "createStore",
  //             endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
  //             deploymentUuid: {
  //               transformerType: "parameterReference",
  //               referenceName: "newDeploymentUuid",
  //             },
  //             configuration: {
  //               transformerType: "parameterReference",
  //               referenceName: "newDeploymentStoreConfiguration",
  //             },
  //           }
  //           // action: {
  //           //   transformerType: "parameterReference",
  //           //   referenceName: "createStoreAction",
  //           // }
  //         },
  //         // resetAndInitAction
  //         {
  //           compositeActionType: "domainAction",
  //           compositeActionStepLabel: "resetAndInitAction",
  //           domainAction: {
  //             endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
  //             actionType: "storeManagementAction",
  //             actionName: "resetAndInitApplicationDeployment",
  //             deploymentUuid: "",
  //             deployments: [
  //               {
  //                 transformerType: "parameterReference",
  //                 referenceName: "DeploymentConfiguration",
  //               },
  //             ],
  //           }
  //           // action: {
  //           //   transformerType: "parameterReference",
  //           //   referenceName: "resetAndInitAction",
  //           // }
  //         },
  //         // createSelfApplicationAction
  //         {
  //           compositeActionType: "domainAction",
  //           compositeActionStepLabel: "createSelfApplicationAction",
  //           domainAction: {
  //             actionType: "instanceAction",
  //             actionName: "createInstance",
  //             applicationSection: "model",
  //             deploymentUuid: {
  //               transformerType: "parameterReference",
  //               referenceName: "newDeploymentUuid",
  //             },
  //             endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //             objects: [
  //               {
  //                 parentName: {
  //                   transformerType: "mustacheStringTemplate",
  //                   definition: "{{entitySelfApplication.name}}",
  //                 },
  //                 parentUuid: {
  //                   transformerType: "mustacheStringTemplate",
  //                   definition: "{{entitySelfApplication.uuid}}",
  //                 },
  //                 applicationSection: "model",
  //                 instances: [
  //                   {
  //                     transformerType: "parameterReference",
  //                     referenceName: "newSelfApplication",
  //                   },
  //                 ],
  //               },
  //             ],
  //           }
  //         },
  //         // createApplicationForAdminAction
  //         {
  //           compositeActionType: "domainAction",
  //           compositeActionStepLabel: "createApplicationForAdminAction",
  //           domainAction: {
  //             actionType: "instanceAction",
  //             actionName: "createInstance",
  //             applicationSection: "data",
  //             deploymentUuid: {
  //               transformerType: "mustacheStringTemplate",
  //               definition: "{{adminConfigurationDeploymentAdmin.uuid}}",
  //             },
  //             endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //             objects: [
  //               {
  //                 parentName: {
  //                   transformerType: "mustacheStringTemplate",
  //                   definition: "{{entityApplicationForAdmin.name}}",
  //                 },
  //                 parentUuid: {
  //                   transformerType: "mustacheStringTemplate",
  //                   definition: "{{entityApplicationForAdmin.uuid}}",
  //                 },
  //                 applicationSection: "data",
  //                 instances: [
  //                   {
  //                     transformerType: "parameterReference",
  //                     referenceName: "newApplicationForAdmin",
  //                   },
  //                 ],
  //               },
  //             ],
  //           }
  //           // action: {
  //           //   transformerType: "parameterReference",
  //           //   referenceName: "createApplicationForAdminAction",
  //           // }
  //         },
  //         // createAdminDeploymentAction
  //         {
  //           compositeActionType: "domainAction",
  //           compositeActionStepLabel: "createAdminDeploymentAction",
  //           domainAction: {
  //             actionType: "instanceAction",
  //             actionName: "createInstance",
  //             applicationSection: "data",
  //             deploymentUuid: {
  //               transformerType: "mustacheStringTemplate",
  //               definition: "{{adminConfigurationDeploymentAdmin.uuid}}",
  //             },
  //             endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //             objects: [
  //               {
  //                 parentName: {
  //                   transformerType: "mustacheStringTemplate",
  //                   definition: "{{entityDeployment.name}}",
  //                 },
  //                 parentUuid: {
  //                   transformerType: "mustacheStringTemplate",
  //                   definition: "{{entityDeployment.uuid}}",
  //                 },
  //                 applicationSection: "data",
  //                 instances: [
  //                   {
  //                     transformerType: "parameterReference",
  //                     referenceName: "DeploymentConfiguration",
  //                   },
  //                 ],
  //               },
  //             ],
  //           }
  //           // action: {
  //           //   transformerType: "parameterReference",
  //           //   referenceName: "createAdminDeploymentAction",
  //           // }
  //         },
  //         // createNewApplicationMenuAction
  //         {
  //           compositeActionType: "domainAction",
  //           compositeActionStepLabel: "createNewApplicationMenuAction",
  //           domainAction: {
  //             actionType: "instanceAction",
  //             actionName: "createInstance",
  //             applicationSection: "model",
  //             deploymentUuid: {
  //               transformerType: "parameterReference",
  //               referenceName: "newDeploymentUuid",
  //             },
  //             endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //             objects: [
  //               {
  //                 parentName: {
  //                   transformerType: "mustacheStringTemplate",
  //                   definition: "{{entityMenu.name}}",
  //                 },
  //                 parentUuid: {
  //                   transformerType: "mustacheStringTemplate",
  //                   definition: "{{entityMenu.uuid}}",
  //                 },
  //                 applicationSection: "model",
  //                 instances: [
  //                   {
  //                     transformerType: "parameterReference",
  //                     referenceName: "newApplicationMenu",
  //                   },
  //                 ],
  //               },
  //             ],
  //           }
  //           // action: {
  //           //   transformerType: "parameterReference",
  //           //   referenceName: "createNewApplicationMenuAction",
  //           // }
  //         },
  //         // commitAction
  //         {
  //           compositeActionType: "domainAction",
  //           compositeActionStepLabel: "commitAction",
  //           domainAction: {
  //             actionName: "commit",
  //             actionType: "modelAction",
  //             endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //             deploymentUuid: {
  //               transformerType: "parameterReference",
  //               referenceName: "newDeploymentUuid",
  //             },
  //           }
  //           // action: {
  //           //   transformerType: "parameterReference",
  //           //   referenceName: "commitAction",
  //           // }
  //         },
  //       ]
  //     }
  //   }
  // }
};

// TODO: duplicate test with ExtractorTemplatePersistenceStoreRunner.integ.test.tsx
describe.sequential("DomainNewController.CompositeAction.integ.test", () => {
  it.each(Object.entries(testActions))("test %s", async (currentTestName, testAction: TestActionParams) => {
    const testSuiteResults = await runTestOrTestSuite(
      localCache,
      domainController,
      testAction
    );
    globalTestSuiteResults = testSuiteResults.status == "ok"? testSuiteResults.returnedDomainElement.elementValue as any : globalTestSuiteResults;
    for (const [testLabel, testResult] of Object.entries(globalTestSuiteResults)) {
      expect(testResult.testResult, `${testLabel} failed!`).toBe("ok");
    }
    console.log("testSuiteResults", testSuiteResults);
    
  });
});
