import { describe, expect } from 'vitest';

import { v4 as uuidv4 } from "uuid";

// import { miroirFileSystemStoreSectionStartup } from "../dist/bundle";
import {
  ActionReturnType,
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
  entityEntityDefinition,
  EntityInstance,
  entityPublisher,
  getBasicApplicationConfiguration,
  getBasicStoreUnitConfiguration,
  JzodObject,
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
  TestSuiteContext,
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
  displayTestSuiteResults,
  displayTestSuiteResultsDetails,
  loadTestConfigFiles,
  resetAndinitializeDeploymentCompositeAction,
  runTestOrTestSuite,
  setupMiroirTest,
  TestActionParams
} from "../utils/tests-utils.js";
import { cleanLevel } from './constants.js';
import { InitApplicationParameters } from 'miroir-core/src/0_interfaces/4-services/PersistenceStoreControllerInterface.js';
import exp from 'constants';
import { transform } from 'typescript';

let domainController: DomainControllerInterface;
let localCache: LocalCache;
// let localMiroirPersistenceStoreController: PersistenceStoreControllerInterface;
// let localAppPersistenceStoreController: PersistenceStoreControllerInterface;
let miroirContext: MiroirContext;
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;
// let globalTestSuiteResults: TestSuiteResult = {};

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

// // ################################################################################################
// afterEach(
//   async () => {
//   }
// )

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
    // console.log("globalTestSuiteResults:\n", Object.values(globalTestSuiteResults).map((r) => "\"" + r.testLabel + "\": " + r.testResult).join("\n"));
    // displayTestSuiteResults(Object.keys(testTemplateSuites)[0]);
    displayTestSuiteResultsDetails(Object.keys(testTemplateSuites)[0]);
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

const newEntityUuid: Uuid = uuidv4();
const newEntityName: string = "newEntityTest";
const createEntity_newEntityDescription: string = "a new entity for testing";
const newEntityDefinitionUuid: Uuid = uuidv4();
const defaultInstanceDetailsReportUuid: Uuid = uuidv4();

// const newEntity: MetaEntity = {
//   uuid: newEntityUuid,
//   parentUuid: entityEntity.uuid,
//   selfApplication: testSelfApplicationUuid,
//   description: createEntity_newEntityDescription,
//   name: newEntityName,
// }

const fileData: {[k: string]: any}[] = [
  {a: "A", b: "B"},
  {a: "1", b: "2"},
  {a: "3", b: "4"},
];
const newEntityJzodSchema:JzodObject = {
  type: "object",
  definition: Object.assign(
    {},
    {
      uuid: {
        type: "string",
        validations: [{ type: "uuid" }],
        tag: { id: 1, defaultLabel: "Uuid", editable: false },
      },
      parentName: {
        type: "string",
        optional: true,
        tag: { id: 1, defaultLabel: "Uuid", editable: false },
      },
      parentUuid: {
        type: "string",
        validations: [{ type: "uuid" }],
        tag: { id: 1, defaultLabel: "parentUuid", editable: false },
      },
    },
    ...(
      fileData[0]?
      Object.values(fileData[0]).map(
        (a: string, index) => (
          {
            [a]: {
              type: "string",
              optional: true,
              tag: { id: index + 2 /* uuid attribute has been added*/, defaultLabel: a, editable: true },
            },
          }
        )
      )
      : []
    )
  ),
};

const testTemplateSuites: Record<string, TestActionParams> = {
  "applicative.Library.integ.test": {
    testActionType: "testCompositeActionTemplateSuite",
    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
    testActionLabel: "applicative.Library.integ.test",
    testCompositeAction: {
      testType: "testCompositeActionTemplateSuite",
      testLabel: "applicative.Library.integ.test",
      beforeAll: createDeploymentCompositeAction(
        testAdminConfigurationDeploymentUuid,
        testDeploymentStorageConfiguration
      ),
      beforeEach: resetAndinitializeDeploymentCompositeAction(
        testAdminConfigurationDeploymentUuid,
        initParametersForTest,
        // libraryEntitesAndInstances
        []
      ),
      // afterEach: {
      //   actionType: "compositeAction",
      //   actionLabel: "afterEach",
      //   actionName: "sequence",
      //   definition: [
      //     {
      //       actionType: "domainAction",
      //       actionLabel: "resetLibraryStore",
      //       domainAction: {
      //         actionType: "modelAction",
      //         actionName: "resetModel",
      //         endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      //         deploymentUuid: testAdminConfigurationDeploymentUuid,
      //       },
      //     },
      //   ],
      // },
      // afterAll: {
      //   actionType: "compositeAction",
      //   actionLabel: "afterEach",
      //   actionName: "sequence",
      //   definition: [
      //     {
      //       actionType: "domainAction",
      //       actionLabel: "resetLibraryStore",
      //       domainAction: {
      //         actionType: "storeManagementAction",
      //         actionName: "deleteStore",
      //         endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
      //         deploymentUuid: testAdminConfigurationDeploymentUuid,
      //         configuration: testDeploymentStorageConfiguration,
      //       },
      //     },
      //   ],
      // },
      testCompositeActions: {
        // "get Entity Entity from Miroir": {
        //   testType: "testCompositeAction",
        //   testLabel: "getEntityEntity",
        //   compositeAction: {
        //     actionType: "compositeAction",
        //     actionLabel: "selectEntityEntity",
        //     actionName: "sequence",
        //     definition: [
        //       {
        //         actionType: "domainAction",
        //         actionLabel: "selectEntityEntity_refresh",
        //         domainAction: {
        //           actionName: "rollback",
        //           actionType: "modelAction",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
        //         },
        //       },
        //       {
        //         actionType: "runBoxedExtractorOrQueryAction",
        //         actionLabel: "calculateNewEntityDefinionAndReports",
        //         nameGivenToResult: "entityEntity",
        //         query: {
        //           actionType: "runBoxedExtractorOrQueryAction",
        //           actionName: "runQuery",
        //           endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        //           applicationSection: "model", // TODO: give only selfApplication section in individual queries?
        //           deploymentUuid: typedAdminConfigurationDeploymentMiroir.uuid,
        //           query: {
        //             queryType: "boxedQueryWithExtractorCombinerTransformer",
        //             deploymentUuid: typedAdminConfigurationDeploymentMiroir.uuid,
        //             pageParams: {
        //               currentDeploymentUuid: typedAdminConfigurationDeploymentMiroir.uuid,
        //             },
        //             queryParams: {},
        //             contextResults: {},
        //             extractors: {
        //               entity: {
        //                 extractorOrCombinerType: "extractorForObjectByDirectReference",
        //                 applicationSection: "model",
        //                 parentName: "Entity",
        //                 parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
        //                 instanceUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
        //               },
        //             },
        //           },
        //         },
        //       },
        //     ],
        //   },
        //   testCompositeActionAssertions: [
        //     {
        //       actionType: "compositeRunTestAssertion",
        //       actionLabel: "checkEntityEntity",
        //       nameGivenToResult: "checkEntityEntity",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         testLabel: "checkEntityEntity",
        //         definition: {
        //           resultAccessPath: ["entityEntity", "entity"],
        //           ignoreAttributes: ["author"],
        //           expectedValue: entityEntity,
        //         },
        //       },
        //     },
        //   ],
        // },
        "create new Entity from spreadsheet": {
          testType: "testCompositeActionTemplate",
          testLabel: "createEntityFromSpreadsheet",
          compositeActionTemplate: {
            actionType: "compositeAction",
            actionLabel: "selectEntityEntity",
            actionName: "sequence",
            templates: {
              testAdminConfigurationDeploymentUuid,
              // createEntity_newEntity: newEntity,
              newEntityName,
              newEntityUuid,
              newEntityDefinitionUuid,
              testSelfApplicationUuid,
              defaultInstanceDetailsReportUuid,
              createEntity_newEntityDescription,
              createEntity_newEntity: {
                uuid: {
                  transformerType: "parameterReference",
                  referenceName: "newEntityUuid",
                },
                parentUuid: entityEntity.uuid,
                selfApplication: {
                  transformerType: "parameterReference",
                  referenceName: "testSelfApplicationUuid",
                },
                description: {
                  transformerType: "parameterReference",
                  referenceName: "createEntity_newEntityDescription",
                },
                name: {
                  transformerType: "parameterReference",
                  referenceName: "newEntityName",
                },
              },
              fileData,
              createEntity_newEntityDefinition: {
                name: {
                  transformerType: "parameterReference",
                  referenceName: "newEntityName",
                },
                uuid: {
                  transformerType: "parameterReference",
                  referenceName: "newEntityDefinitionUuid",
                },
                parentName: "EntityDefinition",
                parentUuid: entityEntityDefinition.uuid,
                entityUuid: {
                  transformerType: "mustacheStringTemplate",
                  definition: "{{createEntity_newEntity.uuid}}",
                },
                conceptLevel: "Model",
                defaultInstanceDetailsReportUuid: defaultInstanceDetailsReportUuid,
                jzodSchema: newEntityJzodSchema
                // jzodSchema: {
                //   // {
                //     transformerType: "listPickElement",
                //     interpolation: "runtime",
                //     referencedExtractor: "fileData",
                //     index: 0
                //   // }
                //   // uuid: {
                //   //   type: "string",
                //   //   validations: [{ type: "uuid" }],
                //   //   tag: { id: 1, defaultLabel: "Uuid", editable: false },
                //   // },
                //   // parentName: {
                //   //   type: "string",
                //   //   optional: true,
                //   //   tag: { id: 1, defaultLabel: "Uuid", editable: false },
                //   // },
                //   // parentUuid: {
                //   //   type: "string",
                //   //   validations: [{ type: "uuid" }],
                //   //   tag: { id: 1, defaultLabel: "parentUuid", editable: false },
                //   // },
                  
                // },
              },
            },
            definition: [
              // createEntity
              {
                actionType: "modelAction",
                actionName: "createEntity",
                actionLabel: "createEntity",
                deploymentUuid: {
                  transformerType: "parameterReference",
                  referenceName: "testAdminConfigurationDeploymentUuid",
                },
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                entities: [
                  {
                    entity: {
                      transformerType: "parameterReference",
                      referenceName: "createEntity_newEntity",
                    },
                    entityDefinition: {
                      transformerType: "parameterReference",
                      referenceName: "createEntity_newEntityDefinition",
                    },
                  },
                ],
              },
              {
                actionType: "compositeRunBoxedExtractorOrQueryAction",
                actionLabel: "calculateNewEntityDefinionAndReports",
                nameGivenToResult: "newApplicationEntityList",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  applicationSection: "model", // TODO: give only selfApplication section in individual queries?
                  deploymentUuid: {
                    transformerType: "parameterReference",
                    referenceName: "testAdminConfigurationDeploymentUuid",
                  },
                  query: {
                    queryType: "boxedQueryWithExtractorCombinerTransformer",
                    deploymentUuid: {
                      transformerType: "parameterReference",
                      referenceName: "testAdminConfigurationDeploymentUuid",
                    },
                    pageParams: {
                      currentDeploymentUuid: {
                        transformerType: "parameterReference",
                        referenceName: "testAdminConfigurationDeploymentUuid",
                      },
                    },
                    queryParams: {},
                    contextResults: {},
                    extractors: {
                      entities: {
                        extractorOrCombinerType: "extractorByEntityReturningObjectList",
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
              {
                actionType: "compositeRunBoxedExtractorOrQueryAction",
                actionLabel: "calculateNewEntityDefinionAndReports",
                nameGivenToResult: "newApplicationEntityDefinitionList",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  applicationSection: "model", // TODO: give only selfApplication section in individual queries?
                  deploymentUuid: {
                    transformerType: "parameterReference",
                    referenceName: "testAdminConfigurationDeploymentUuid",
                  },
                  query: {
                    queryType: "boxedQueryWithExtractorCombinerTransformer",
                    deploymentUuid: {
                      transformerType: "parameterReference",
                      referenceName: "testAdminConfigurationDeploymentUuid",
                    },
                    pageParams: {
                      currentDeploymentUuid: {
                        transformerType: "parameterReference",
                        referenceName: "testAdminConfigurationDeploymentUuid",
                      },
                    },
                    queryParams: {},
                    contextResults: {},
                    extractors: {
                      entityDefinitions: {
                        extractorOrCombinerType: "extractorByEntityReturningObjectList",
                        applicationSection: "model",
                        parentName: entityEntityDefinition.name,
                        parentUuid: entityEntityDefinition.uuid,
                        orderBy: {
                          attributeName: "name",
                          direction: "ASC",
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
          testCompositeActionAssertions: [
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkEntities",
              nameGivenToResult: "checkEntityList",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkEntities",
                definition: {
                  resultAccessPath: ["newApplicationEntityList", "entities"],
                  ignoreAttributes: ["author"],
                  expectedValue: [
                    // newEntity,
                    {
                      uuid: newEntityUuid,
                      parentUuid: entityEntity.uuid,
                      selfApplication: testSelfApplicationUuid,
                      description: createEntity_newEntityDescription,
                      name: newEntityName,
                    },
                  ],
                },
              },
            },
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkEntityDefinitions",
              nameGivenToResult: "checkEntityDefinitionList",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkEntityDefinitions", // TODO: index testCompositeActionAssertions in an object, ensuring unique keys
                definition: {
                  resultAccessPath: ["newApplicationEntityDefinitionList", "entityDefinitions"],
                  ignoreAttributes: ["author"],
                  expectedValue: [
                    // newEntityDefinition,
                    {
                      name: newEntityName,
                      uuid: newEntityDefinitionUuid,
                      parentName: "EntityDefinition",
                      parentUuid: entityEntityDefinition.uuid,
                      entityUuid: newEntityUuid,
                      conceptLevel: "Model",
                      defaultInstanceDetailsReportUuid: defaultInstanceDetailsReportUuid,
                      jzodSchema: newEntityJzodSchema,
                    },
                    // {
                    //   transformerType: "parameterReference",
                    //   referenceName: "createEntity_newEntityDefinition",
                    // },
                  ],
                },
              },
            },
          ],
        },
      },
    },
  },
};



// const testSuites: Record<string, TestActionParams> = {
//   "applicative.Library.integ.test": {
//     testActionType: "testCompositeActionSuite",
//     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
//     testActionLabel: "applicative.Library.integ.test",
//     testCompositeAction: {
//       testType: "testCompositeActionSuite",
//       testLabel: "applicative.Library.integ.test",
//       beforeAll: createDeploymentCompositeAction(
//         testAdminConfigurationDeploymentUuid,
//         testDeploymentStorageConfiguration
//       ),
//       beforeEach: resetAndinitializeDeploymentCompositeAction(
//         testAdminConfigurationDeploymentUuid,
//         initParametersForTest,
//         // libraryEntitesAndInstances
//         []
//       ),
//       // afterEach: {
//       //   actionType: "compositeAction",
//       //   actionLabel: "afterEach",
//       //   actionName: "sequence",
//       //   definition: [
//       //     {
//       //       actionType: "domainAction",
//       //       actionLabel: "resetLibraryStore",
//       //       domainAction: {
//       //         actionType: "modelAction",
//       //         actionName: "resetModel",
//       //         endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
//       //         deploymentUuid: testAdminConfigurationDeploymentUuid,
//       //       },
//       //     },
//       //   ],
//       // },
//       // afterAll: {
//       //   actionType: "compositeAction",
//       //   actionLabel: "afterEach",
//       //   actionName: "sequence",
//       //   definition: [
//       //     {
//       //       actionType: "domainAction",
//       //       actionLabel: "resetLibraryStore",
//       //       domainAction: {
//       //         actionType: "storeManagementAction",
//       //         actionName: "deleteStore",
//       //         endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
//       //         deploymentUuid: testAdminConfigurationDeploymentUuid,
//       //         configuration: testDeploymentStorageConfiguration,
//       //       },
//       //     },
//       //   ],
//       // },
//       testCompositeActions: {
//         // "get Entity Entity from Miroir": {
//         //   testType: "testCompositeAction",
//         //   testLabel: "getEntityEntity",
//         //   compositeAction: {
//         //     actionType: "compositeAction",
//         //     actionLabel: "selectEntityEntity",
//         //     actionName: "sequence",
//         //     definition: [
//         //       {
//         //         actionType: "domainAction",
//         //         actionLabel: "selectEntityEntity_refresh",
//         //         domainAction: {
//         //           actionName: "rollback",
//         //           actionType: "modelAction",
//         //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
//         //           deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
//         //         },
//         //       },
//         //       {
//         //         actionType: "runBoxedExtractorOrQueryAction",
//         //         actionLabel: "calculateNewEntityDefinionAndReports",
//         //         nameGivenToResult: "entityEntity",
//         //         query: {
//         //           actionType: "runBoxedExtractorOrQueryAction",
//         //           actionName: "runQuery",
//         //           endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
//         //           applicationSection: "model", // TODO: give only selfApplication section in individual queries?
//         //           deploymentUuid: typedAdminConfigurationDeploymentMiroir.uuid,
//         //           query: {
//         //             queryType: "boxedQueryWithExtractorCombinerTransformer",
//         //             deploymentUuid: typedAdminConfigurationDeploymentMiroir.uuid,
//         //             pageParams: {
//         //               currentDeploymentUuid: typedAdminConfigurationDeploymentMiroir.uuid,
//         //             },
//         //             queryParams: {},
//         //             contextResults: {},
//         //             extractors: {
//         //               entity: {
//         //                 extractorOrCombinerType: "extractorForObjectByDirectReference",
//         //                 applicationSection: "model",
//         //                 parentName: "Entity",
//         //                 parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
//         //                 instanceUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
//         //               },
//         //             },
//         //           },
//         //         },
//         //       },
//         //     ],
//         //   },
//         //   testCompositeActionAssertions: [
//         //     {
//         //       actionType: "compositeRunTestAssertion",
//         //       actionLabel: "checkEntityEntity",
//         //       nameGivenToResult: "checkEntityEntity",
//         //       testAssertion: {
//         //         testType: "testAssertion",
//         //         testLabel: "checkEntityEntity",
//         //         definition: {
//         //           resultAccessPath: ["entityEntity", "entity"],
//         //           ignoreAttributes: ["author"],
//         //           expectedValue: entityEntity,
//         //         },
//         //       },
//         //     },
//         //   ],
//         // },
//         "create new Entity from spreadsheet": {
//           testType: "testCompositeAction",
//           testLabel: "createEntityFromSpreadsheet",
//           compositeAction: {
//             actionType: "compositeAction",
//             actionLabel: "selectEntityEntity",
//             actionName: "sequence",
//             // templates: {
//             //   newEntityDefinition: {
//             //     name: {
//             //       transformerType: "parameterReference",
//             //       referenceName: "createEntity_newEntityName",
//             //     },
//             //     uuid: {
//             //       transformerType: "parameterReference",
//             //       referenceName: "createEntity_newEntityDefinitionUuid",
//             //     },
//             //     parentName: "EntityDefinition",
//             //     parentUuid: {
//             //       transformerType: "mustacheStringTemplate",
//             //       definition: "{{entityEntityDefinition.uuid}}",
//             //     },
//             //     entityUuid: {
//             //       transformerType: "mustacheStringTemplate",
//             //       definition: "{{createEntity_newEntity.uuid}}",
//             //     },
//             //     conceptLevel: "Model",
//             //     defaultInstanceDetailsReportUuid: {
//             //       transformerType: "parameterReference",
//             //       referenceName: "createEntity_newEntityDetailsReportUuid",
//             //     },
//             //     jzodSchema: {
//             //       transformerType: "parameterReference",
//             //       referenceName: "jzodSchema",
//             //     },
//             //   },
//             // },
//             definition: [
//               // createEntity
//               {
//                 actionType: "modelAction",
//                 actionName: "createEntity",
//                 actionLabel: "createEntity",
//                 deploymentUuid: testAdminConfigurationDeploymentUuid,
//                 // deploymentUuid: {
//                 //   transformerType: "parameterReference",
//                 //   referenceName: "currentDeploymentUuid",
//                 // },
//                 endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
//                 entities: [
//                   {
//                     entity: newEntity,
//                     // entity: {
//                     //   transformerType: "parameterReference",
//                     //   referenceName: "createEntity_newEntity",
//                     // },
//                     entityDefinition: newEntityDefinition,
//                     // entityDefinition: {
//                     //   transformerType: "parameterReference",
//                     //   referenceName: "newEntityDefinition",
//                     // },
//                   },
//                 ],
//               },
//               {
//                 actionType: "compositeRunBoxedExtractorOrQueryAction",
//                 actionLabel: "calculateNewEntityDefinionAndReports",
//                 nameGivenToResult: "newApplicationEntityList",
//                 query: {
//                   actionType: "runBoxedExtractorOrQueryAction",
//                   actionName: "runQuery",
//                   endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
//                   applicationSection: "model", // TODO: give only selfApplication section in individual queries?
//                   deploymentUuid: testAdminConfigurationDeploymentUuid,
//                   query: {
//                     queryType: "boxedQueryWithExtractorCombinerTransformer",
//                     deploymentUuid: testAdminConfigurationDeploymentUuid,
//                     pageParams: {
//                       currentDeploymentUuid: testAdminConfigurationDeploymentUuid,
//                     },
//                     queryParams: {},
//                     contextResults: {},
//                     extractors: {
//                       entities: {
//                         extractorOrCombinerType: "extractorByEntityReturningObjectList",
//                         applicationSection: "model",
//                         parentName: entityEntity.name,
//                         parentUuid: entityEntity.uuid,
//                         orderBy: {
//                           attributeName: "name",
//                           direction: "ASC",
//                         },
//                       },
//                     },
//                   },
//                 },
//               },
//               {
//                 actionType: "compositeRunBoxedExtractorOrQueryAction",
//                 actionLabel: "calculateNewEntityDefinionAndReports",
//                 nameGivenToResult: "newApplicationEntityDefinitionList",
//                 query: {
//                   actionType: "runBoxedExtractorOrQueryAction",
//                   actionName: "runQuery",
//                   endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
//                   applicationSection: "model", // TODO: give only selfApplication section in individual queries?
//                   deploymentUuid: testAdminConfigurationDeploymentUuid,
//                   query: {
//                     queryType: "boxedQueryWithExtractorCombinerTransformer",
//                     deploymentUuid: testAdminConfigurationDeploymentUuid,
//                     pageParams: {
//                       currentDeploymentUuid: testAdminConfigurationDeploymentUuid,
//                     },
//                     queryParams: {},
//                     contextResults: {},
//                     extractors: {
//                       entityDefinitions: {
//                         extractorOrCombinerType: "extractorByEntityReturningObjectList",
//                         applicationSection: "model",
//                         parentName: entityEntityDefinition.name,
//                         parentUuid: entityEntityDefinition.uuid,
//                         orderBy: {
//                           attributeName: "name",
//                           direction: "ASC",
//                         },
//                       },
//                     },
//                   },
//                 },
//               },
//             ],
//           },
//           testCompositeActionAssertions: [
//             {
//               actionType: "compositeRunTestAssertion",
//               actionLabel: "checkEntities",
//               nameGivenToResult: "checkEntityList",
//               testAssertion: {
//                 testType: "testAssertion",
//                 testLabel: "checkEntities",
//                 definition: {
//                   resultAccessPath: ["newApplicationEntityList", "entities"],
//                   ignoreAttributes: ["author"],
//                   expectedValue: [newEntity],
//                 },
//               },
//             },
//             {
//               actionType: "compositeRunTestAssertion",
//               actionLabel: "checkEntityDefinitions",
//               nameGivenToResult: "checkEntityDefinitionList",
//               testAssertion: {
//                 testType: "testAssertion",
//                 testLabel: "checkEntityDefinitions", // TODO: index testCompositeActionAssertions in an object, ensuring unique keys
//                 // testLabel: "checkEntities",
//                 definition: {
//                   resultAccessPath: ["newApplicationEntityDefinitionList", "entityDefinitions"],
//                   ignoreAttributes: ["author"],
//                   expectedValue: [newEntityDefinition],
//                 },
//               },
//             },
//           ],
//         },
//       },
//     },
//   },
// };

// const display
// TODO: duplicate test with ExtractorTemplatePersistenceStoreRunner.integ.test.tsx
describe.sequential("applicative.Library.integ.test", () => {
  // it.each(Object.entries(testSuites))("test %s", async (currentTestSuiteName, testAction: TestActionParams) => {
  //   const testSuiteResults = await runTestOrTestSuite(
  //     localCache,
  //     domainController,
  //     testAction
  //   );
  //   if (testSuiteResults.status !== "ok") {
  //     expect(testSuiteResults.status, `${currentTestSuiteName} failed!`).toBe("ok");
  //   }
  // });
  it.each(Object.entries(testTemplateSuites))("test %s", async (currentTestSuiteName, testAction: TestActionParams) => {
    const testSuiteResults = await runTestOrTestSuite(
      localCache,
      domainController,
      testAction
    );
    if (testSuiteResults.status !== "ok") {
      expect(testSuiteResults.status, `${currentTestSuiteName} failed!`).toBe("ok");
    }
  });
});

