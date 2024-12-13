import { SetupWorkerApi } from 'msw/browser';
import { describe, expect } from 'vitest';

// import { miroirFileSystemStoreSectionStartup } from "../dist/bundle";
import {
  ActionReturnType,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  ApplicationSection,
  author1,
  author2,
  author3,
  book1,
  book2,
  book3,
  book4,
  book5,
  book6,
  CompositeAction,
  ConfigurationService,
  defaultLevels,
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
  entityMenu,
  entityPublisher,
  MetaEntity,
  MiroirConfigClient,
  MiroirContext,
  miroirCoreStartup,
  MiroirLoggerFactory,
  PersistenceStoreControllerInterface,
  publisher1,
  publisher2,
  publisher3,
  Report,
  reportBookList,
  SelfApplicationDeploymentConfiguration,
  selfApplicationDeploymentLibrary,
  selfApplicationDeploymentMiroir,
  selfApplicationMiroir,
  selfApplicationModelBranchMiroirMasterBranch,
  selfApplicationStoreBasedConfigurationMiroir,
  selfApplicationVersionInitialMiroirVersion,
  TestCompositeAction,
  TestCompositeActionTemplate,
  Uuid
} from "miroir-core";


import { LocalCache } from 'miroir-localcache-redux';
import { miroirFileSystemStoreSectionStartup } from 'miroir-store-filesystem';
import { miroirIndexedDbStoreSectionStartup } from 'miroir-store-indexedDb';
import { miroirPostgresStoreSectionStartup } from 'miroir-store-postgres';
import { setupServer, SetupServerApi } from "msw/node";
import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { miroirAppStartup } from '../../src/startup.js';
import {
  addEntitiesAndInstances,
  chainVitestSteps,
  createTestStore,
  loadTestConfigFiles,
  miroirAfterAll,
  miroirAfterEach,
  miroirBeforeAll,
  miroirBeforeEach,
} from "../utils/tests-utils.js";

let localCache: LocalCache;
let localDataStoreWorker: SetupWorkerApi | undefined;
let localDataStoreServer: any /**SetupServerApi | undefined */;
let localMiroirPersistenceStoreController: PersistenceStoreControllerInterface;
let localAppPersistenceStoreController: PersistenceStoreControllerInterface;
// let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface | undefined;
let domainController: DomainControllerInterface;
let miroirContext: MiroirContext;

const env:any = (import.meta as any).env
console.log("@@@@@@@@@@@@@@@@@@ env", env);

const {miroirConfig, logConfig:loggerOptions} = await loadTestConfigFiles(env);

MiroirLoggerFactory.setEffectiveLoggerFactory(
  loglevelnext,
  (defaultLevels as any)[loggerOptions.defaultLevel],
  loggerOptions.defaultTemplate,
  loggerOptions.specificLoggerOptions
);

console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

// ################################################################################################
beforeAll(
  async () => {
    // Establish requests interception layer before all tests.
    miroirAppStartup();
    miroirCoreStartup();
    miroirFileSystemStoreSectionStartup();
    miroirIndexedDbStoreSectionStartup();
    miroirPostgresStoreSectionStartup();
    ConfigurationService.registerTestImplementation({expect: expect as any});
    // if (!miroirConfig.client.emulateServer) {
    //   throw new Error("LocalPersistenceStoreController state do not make sense for real server configurations! Please use only 'emulateServer: true' configurations for this test.");
    // } else {
    const wrapped = await miroirBeforeAll(
      miroirConfig as MiroirConfigClient,
      setupServer,
    );
    if (wrapped) {
      if (wrapped.localMiroirPersistenceStoreController && wrapped.localAppPersistenceStoreController) {
        localMiroirPersistenceStoreController = wrapped.localMiroirPersistenceStoreController;
        localAppPersistenceStoreController = wrapped.localAppPersistenceStoreController;
      }
      localDataStoreWorker = wrapped.localDataStoreWorker as SetupWorkerApi;
      localDataStoreServer = wrapped.localDataStoreServer as SetupServerApi;
      localCache = wrapped.localCache;
      domainController = wrapped.domainController;
      miroirContext = wrapped.miroirContext;
    } else {
      throw new Error("beforeAll failed initialization!");
    }

    // await createTestStore(
    //   miroirConfig,
    //   domainController
    // )

    return Promise.resolve();
  }
)

// ################################################################################################
beforeEach(
  async  () => {
    await miroirBeforeEach(
      miroirConfig,
      domainController,
      [
        {
          adminConfigurationDeployment: adminConfigurationDeploymentMiroir,
          selfApplicationDeployment: selfApplicationDeploymentMiroir as SelfApplicationDeploymentConfiguration,
        },
        // {
        //   adminConfigurationDeployment: adminConfigurationDeploymentLibrary,
        //   selfApplicationDeployment: selfApplicationDeploymentLibrary  as SelfApplicationDeploymentConfiguration,
        // },
      ],
      localMiroirPersistenceStoreController,
      localAppPersistenceStoreController
    );
  //   await addEntitiesAndInstances(
  //     localAppPersistenceStoreController,
  //     domainController,
  //     localCache,
  //     miroirConfig,
  //     adminConfigurationDeploymentLibrary,
  //     [
  //       {
  //         entity: entityAuthor as MetaEntity,
  //         entityDefinition: entityDefinitionAuthor as EntityDefinition,
  //         instances: [
  //           author1,
  //           author2,
  //           author3 as EntityInstance,
  //         ]
  //       },
  //       {
  //         entity: entityBook as MetaEntity,
  //         entityDefinition: entityDefinitionBook as EntityDefinition,
  //         instances: [
  //           book1 as EntityInstance,
  //           book2 as EntityInstance,
  //           book3 as EntityInstance,
  //           book4 as EntityInstance,
  //           book5 as EntityInstance,
  //           book6 as EntityInstance,
  //         ]
  //       },
  //       {
  //         entity: entityPublisher as MetaEntity,
  //         entityDefinition: entityDefinitionPublisher as EntityDefinition,
  //         instances: [
  //           publisher1 as EntityInstance,
  //           publisher2 as EntityInstance,
  //           publisher3 as EntityInstance,
  //         ]
  //       }
  //     ],
  //     reportBookList as Report,
  //   )
  }
)

// ################################################################################################
afterEach(
  async () => {
    await miroirAfterEach(
      miroirConfig,
      domainController,
      localMiroirPersistenceStoreController,
      localAppPersistenceStoreController
    );
  }
)

// ################################################################################################
afterAll(
  async () => {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirAfterAll")
    await miroirAfterAll(
      miroirConfig,
      domainController,
      localMiroirPersistenceStoreController,
      localAppPersistenceStoreController,
      localDataStoreServer
    );
    // try {
    //   await localMiroirPersistenceStoreController.close();
    //   await localAppPersistenceStoreController.close();
    // } catch (error) {
    //   console.error('Error afterAll',error);
    // }
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done miroirAfterAll")
  }
)


// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
type TestActionParams = {
  testActionType: "testCompositeAction",
  deploymentUuid: Uuid,
  testCompositeAction: TestCompositeAction,
} 
| {
  testActionType: "testCompositeActionTemplate",
  deploymentUuid: Uuid,
  compositeTestActionTemplate: TestCompositeActionTemplate,
} 

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

const testActions: Record<string, TestActionParams> = {
  "get Entity Entity from Miroir": {
    testActionType: "testCompositeAction",
    deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
    testCompositeAction: {
      testType: "testCompositeAction",
      beforeAll: {
        actionType: "compositeAction",
        actionLabel: "beforeAll",
        actionName: "sequence",
        definition: [
          {
            compositeActionType: "domainAction",
            compositeActionStepLabel: "createLibraryStore",
            domainAction: {
              actionType: "storeManagementAction",
              actionName: "createStore",
              endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
              deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              configuration: miroirConfig.client.emulateServer
              ? miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentLibrary.uuid]
              : miroirConfig.client.serverConfig.storeSectionConfiguration[adminConfigurationDeploymentLibrary.uuid]
            },
          },
        ]
      },
      beforeEach: {
        actionType: "compositeAction",
        actionLabel: "beforeEach",
        actionName: "sequence",
        definition: [
          {
            compositeActionType: "domainAction",
            compositeActionStepLabel: "resetLibraryStore",
            domainAction: {
              actionType: "modelAction",
              actionName: "resetModel",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            }
          },
          {
            compositeActionType: "domainAction",
            compositeActionStepLabel: "initLibraryStore",
            domainAction: {
              actionType: "modelAction",
              actionName: "initModel",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              deploymentUuid: selfApplicationDeploymentLibrary.uuid,
              params: {
                dataStoreType: adminConfigurationDeploymentLibrary.uuid == adminConfigurationDeploymentMiroir.uuid?"miroir":"app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
                metaModel: defaultMiroirMetaModel,
                application: selfApplicationMiroir,
                selfApplicationDeploymentConfiguration: selfApplicationDeploymentLibrary,
                applicationModelBranch: selfApplicationModelBranchMiroirMasterBranch,
                applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationMiroir,
                applicationVersion: selfApplicationVersionInitialMiroirVersion,
              },
            }
          },
          {
            compositeActionType: "domainAction",
            compositeActionStepLabel: "initLibraryStore",
            domainAction: {
              actionType: "modelAction",
              actionName: "rollback",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            }
          },
          {
            compositeActionType: "domainAction",
            compositeActionStepLabel: "CreateLibraryStoreEntities",
            domainAction: {
              actionType: "modelAction",
              actionName: "createEntity",
              deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              entities: libraryEntitesAndInstances
            }
          },
          {
            compositeActionType: "domainAction",
            compositeActionStepLabel: "CommitLibraryStoreEntities",
            domainAction: {
              actionType: "modelAction",
              actionName: "commit",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            }
          },
          {
            compositeActionType: "domainAction",
            compositeActionStepLabel: "CreateLibraryStoreInstances",
            domainAction: {
              actionType: "instanceAction",
              actionName: "createInstance",
              endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
              applicationSection: "data",
              deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              objects: libraryEntitesAndInstances.map((e) => {
                return {
                  parentName: e.entity.name,
                  parentUuid: e.entity.uuid,
                  applicationSection: "data",
                  instances: e.instances,
                };
              })
            }
          }
        ]
      },
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
              applicationSection: "model", // TODO: give only application section in individual queries?
              deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
              query: {
                queryType: "boxedQueryWithExtractorCombinerTransformer",
                deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                pageParams: {
                  currentDeploymentUuid: adminConfigurationDeploymentMiroir.uuid
                },
                queryParams: { },
                contextResults: { },
                extractors: {
                  entity: {
                    extractorOrCombinerType: "extractorForObjectByDirectReference",
                    applicationSection: "model",
                    parentName: "Entity",
                    parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                    instanceUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                  }
                },
              }
            }
          },
        ]
      },
      testCaseAction: {
        compositeActionType: "runTestCaseCompositeAction",
        compositeActionStepLabel: "checkEntityEntity",
        nameGivenToResult: "checkEntityEntity",
        testCase: {
          testType: "testCase",
          definition: {
            resultAccessPath: [ "entityEntity", "entity" ],
            ignoreAttributes: [ "author" ],
            expectedValue: entityEntity
          }
        }
      }
    }
  },
  // "create new Application": {
  //   testActionType: "testCompositeAction",
  //   deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
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
  //             definition: "The {{newApplicationName}} application.",
  //           },
  //           description: {
  //             transformerType: "mustacheStringTemplate",
  //             definition: "This application contains the {{newApplicationName}} model and data",
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
  //           parentName: "Application",
  //           parentUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
  //           name: {
  //             transformerType: "parameterReference",
  //             referenceName: "newApplicationName",
  //           },
  //           defaultLabel: {
  //             transformerType: "mustacheStringTemplate",
  //             definition: "The {{newApplicationName}} application.",
  //           },
  //           description: {
  //             transformerType: "mustacheStringTemplate",
  //             definition: "This application contains the {{newApplicationName}} model and data",
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
  //           application: {
  //             transformerType: "mustacheStringTemplate",
  //             definition: "{{newApplicationForAdmin.uuid}}",
  //           },
  //           description: {
  //             transformerType: "mustacheStringTemplate",
  //             definition: "The default Sql Deployment for Application {{newApplicationName}}",
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
  //             definition: "This is the default menu allowing to explore the {{newApplicationName}} Application",
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
  //                     application: {
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
  //                     application: {
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
  //                     application: {
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
  //             actionName: "resetAndInitMiroirAndApplicationDatabase",
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
}

// TODO: duplicate test with ExtractorTemplatePersistenceStoreRunner.integ.test.tsx
describe.sequential("DomainNewController.CompositeAction.integ.test", () => {
  it.each(Object.entries(testActions))('test %s', async (currentTestName, testAction: TestActionParams) => {
    // const fullTestName = describe.sequential.name + "/" + currentTestName
    const fullTestName = expect.getState().currentTestName?? "no test name";
    console.info("STARTING test:", fullTestName);
    // expect(currentTestName != undefined).toBeTruthy();
    // expect(testParams.testAssertions).toBeDefined();

    await chainVitestSteps(
      fullTestName,
      {},
      async () => {
        switch (testAction.testActionType) {
          case 'testCompositeAction': {
            const queryResult:ActionReturnType = await domainController.handleTestAction(
              testAction.testCompositeAction,
              {},
              localCache.currentModel(testAction.deploymentUuid)
            );
            console.log("test", fullTestName, ": queryResult=", JSON.stringify(queryResult, null, 2));
            return queryResult;
          }
          case 'testCompositeActionTemplate': {
            throw new Error("testCompositeActionTemplate not implemented yet!");
          }
        }
      },
      undefined, // expected result transformation
      undefined, // name to give to result
      "void",
      undefined, // expectedValue
    );
  });

  // // ################################################################################################
  // it("get Entity Entity from Miroir", async () => {
  //   const expectedValue = {
  //     uuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  //     parentName: "Entity",
  //     parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  //     parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
  //     name: "Entity",
  //     application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  //     conceptLevel: "MetaModel",
  //     description: "The Metaclass for entities.",
  //   }

  //   await chainVitestSteps(
  //     "ExtractorPersistenceStoreRunner_selectEntityInstance_selectObjectByDirectReference",
  //     {},
  //     async () => {
  //       const applicationSection:ApplicationSection = "model";
  //       const localCompositeAction: CompositeAction = {
  //         actionType: "compositeAction",
  //         actionLabel: "selectEntityEntity",
  //         actionName: "sequence",
  //         definition: [
  //           {
  //             compositeActionType: "domainAction",
  //             compositeActionStepLabel: "selectEntityEntity_refresh",
  //             domainAction: {
  //               actionName: "rollback",
  //               actionType: "modelAction",
  //               endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //               deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
  //             },
  //           },
  //           {
  //             compositeActionType: "runBoxedExtractorOrQueryAction",
  //             compositeActionStepLabel: "calculateNewEntityDefinionAndReports",
  //             nameGivenToResult: "entityEntity",
  //             query: {
  //               actionType: "runBoxedExtractorOrQueryAction",
  //               actionName: "runQuery",
  //               endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //               applicationSection: "model", // TODO: give only application section in individual queries?
  //               deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
  //               query: {
  //                 queryType: "boxedQueryWithExtractorCombinerTransformer",
  //                 deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
  //                 pageParams: {
  //                   currentDeploymentUuid: adminConfigurationDeploymentMiroir.uuid
  //                 },
  //                 queryParams: { },
  //                 contextResults: { },
  //                 extractors: {
  //                   entity: {
  //                     extractorOrCombinerType: "extractorForObjectByDirectReference",
  //                     applicationSection: "model",
  //                     parentName: "Entity",
  //                     parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  //                     instanceUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  //                   }
  //                 },
  //               }
  //             }
  //           },
  //         ]
  //       };

  
  //       const compositeTestAction: TestCompositeAction  = {
  //         testType: "testCompositeAction",
  //         compositeAction: localCompositeAction,
  //         testCaseAction: {
  //           compositeActionType: "runTestCaseCompositeAction",
  //           compositeActionStepLabel: "checkEntityEntity",
  //           nameGivenToResult: "checkEntityEntity",
  //           testCase: {
  //             testType: "testCase",
  //             definition: {
  //               resultAccessPath: [ "entityEntity", "entity" ],
  //               ignoreAttributes: [ "author" ],
  //               expectedValue: expectedValue
  //             }
  //           }
  //         }
  //       }
  //       const queryResult:ActionReturnType = await domainController.handleTestAction(
  //         compositeTestAction,
  //         {},
  //         localCache.currentModel(adminConfigurationDeploymentLibrary.uuid)
  //         // {} as any,
  //       );
  //       console.log("test queryResult", JSON.stringify(queryResult, null, 2));
  //       return queryResult;
  //     },
  //     undefined, // expected result transformation
  //     undefined, // name to give to result
  //     // "instance",
  //     "void",
  //     undefined, // expectedValue
  //     // expectedValue
  //   );
  // });

  // // ################################################################################################
  // it("get Miroir Entities", async () => {
  //   await chainVitestSteps(
  //     "ExtractorPersistenceStoreRunner_getMiroirEntities",
  //     {},
  //     async () => {
  //       const applicationSection: ApplicationSection = "model";
  //       const queryResult: ActionReturnType = await localMiroirPersistenceStoreController.handleBoxedQueryAction({
  //         actionType: "runBoxedQueryAction",
  //         actionName: "runQuery",
  //         deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //         endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //         applicationSection: applicationSection,
  //         query: {
  //           queryType: "boxedQueryWithExtractorCombinerTransformer",
  //           pageParams: {},
  //           queryParams: {},
  //           contextResults: {},
  //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //           extractors: {
  //             entities: {
  //               extractorOrCombinerType: "extractorByEntityReturningObjectList",
  //               applicationSection: applicationSection,
  //               parentName: "Entity",
  //               parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",

  //             },
  //           },
  //         },
  //       });
  //       console.log("queryResult", JSON.stringify(queryResult, null, 2));
  //       return queryResult; // == "ok" ? queryResult : {status: "error", error: queryResult.error};
  //     },
  //     // (a) => ignorePostgresExtraAttributesOnRecord((a as any).returnedDomainElement.elementValue.entities, ["author"]),
  //     (a) => ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.elementValue.entities.sort((a,b) => a.name.localeCompare(b.name)), ["author"]),
  //     // (a) => (a as any).returnedDomainElement.elementValue.entities.elementValue,
  //     // undefined, // expected result transformation
  //     undefined, // name to give to result
  //     "object", //"instanceUuidIndex",
  //     Object.values({
  //       "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad": {
  //         uuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  //         parentName: "Entity",
  //         parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  //         parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
  //         name: "Entity",
  //         application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  //         conceptLevel: "MetaModel",
  //         description: "The Metaclass for entities.",
  //       },
  //       "35c5608a-7678-4f07-a4ec-76fc5bc35424": {
  //         uuid: "35c5608a-7678-4f07-a4ec-76fc5bc35424",
  //         parentName: "Entity",
  //         parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  //         parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
  //         name: "SelfApplicationDeploymentConfiguration",
  //         application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  //         conceptLevel: "Model",
  //         description: "An Application Deployment",
  //       },
  //       "3d8da4d4-8f76-4bb4-9212-14869d81c00c": {
  //         uuid: "3d8da4d4-8f76-4bb4-9212-14869d81c00c",
  //         parentName: "Entity",
  //         parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  //         parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
  //         name: "Endpoint",
  //         application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  //         conceptLevel: "Model",
  //         description: "An Endpoint, servicing Actions that are part of a Domain Specific Language",
  //       },
  //       "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916": {
  //         uuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
  //         parentName: "Entity",
  //         parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  //         parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
  //         name: "Report",
  //         application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  //         conceptLevel: "Model",
  //         description: "Report, allowing to display model instances",
  //       },
  //       "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd": {
  //         uuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
  //         parentName: "Entity",
  //         parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  //         parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
  //         name: "EntityDefinition",
  //         application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  //         conceptLevel: "MetaModel",
  //         description: "The Metaclass for the definition of entities.",
  //       },
  //       "5e81e1b9-38be-487c-b3e5-53796c57fccf": {
  //         uuid: "5e81e1b9-38be-487c-b3e5-53796c57fccf",
  //         parentName: "Entity",
  //         parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  //         parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
  //         name: "JzodSchema",
  //         application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  //         conceptLevel: "Model",
  //         description: "Common Jzod Schema definitions, available to all Entity definitions",
  //       },
  //       "7990c0c9-86c3-40a1-a121-036c91b55ed7": {
  //         uuid: "7990c0c9-86c3-40a1-a121-036c91b55ed7",
  //         parentName: "Entity",
  //         parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  //         parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
  //         name: "StoreBasedConfiguration",
  //         application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  //         conceptLevel: "Model",
  //         description: "A configuration of storage-related aspects of a Model.",
  //       },
  //       "a659d350-dd97-4da9-91de-524fa01745dc": {
  //         uuid: "a659d350-dd97-4da9-91de-524fa01745dc",
  //         parentName: "Entity",
  //         parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  //         parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
  //         name: "SelfApplication",
  //         application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  //         conceptLevel: "Model",
  //         description: "Self Application",
  //       },
  //       "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24": {
  //         uuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
  //         parentName: "Entity",
  //         parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  //         parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
  //         name: "SelfApplicationVersion",
  //         application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  //         conceptLevel: "Model",
  //         description: "A Version of the Self Application",
  //       },
  //       "cdb0aec6-b848-43ac-a058-fe2dbe5811f1": {
  //         uuid: "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
  //         parentName: "Entity",
  //         parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  //         parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
  //         name: "ApplicationModelBranch",
  //         application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  //         conceptLevel: "Model",
  //         description: "A Branch of an Application Model",
  //       },
  //       "dde4c883-ae6d-47c3-b6df-26bc6e3c1842": {
  //         uuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
  //         parentName: "Entity",
  //         parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  //         parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
  //         name: "Menu",
  //         application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  //         conceptLevel: "Model",
  //         description: "Menu, allowing to display elements useful to navigate the application",
  //       },
  //       "e4320b9e-ab45-4abe-85d8-359604b3c62f": {
  //         uuid: "e4320b9e-ab45-4abe-85d8-359604b3c62f",
  //         parentName: "Entity",
  //         parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  //         parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
  //         name: "Query",
  //         application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  //         conceptLevel: "Model",
  //         description: "A Query",
  //       },
  //     }).sort((a,b) => a.name.localeCompare(b.name))
  //   );
  // });
  
  // // ################################################################################################
  // it("get Library Entities", async () => {
  //   await chainVitestSteps(
  //     "ExtractorPersistenceStoreRunner_getLibraryEntities",
  //     {},
  //     async () => {
  //       const applicationSection: ApplicationSection = "model";
  //       const queryResult: ActionReturnType = await localAppPersistenceStoreController.handleBoxedQueryAction({
  //         actionType: "runBoxedQueryAction",
  //         actionName: "runQuery",
  //         deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //         endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //         applicationSection: applicationSection,
  //         query: {
  //           queryType: "boxedQueryWithExtractorCombinerTransformer",
  //           pageParams: {},
  //           queryParams: {},
  //           contextResults: {},
  //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //           extractors: {
  //             entities: {
  //               extractorOrCombinerType: "extractorByEntityReturningObjectList",
  //               applicationSection: applicationSection,
  //               parentName: entityEntity.name,
  //               parentUuid: entityEntity.uuid,
  //               // parentUuid: {
  //               //   transformerType: "constantUuid",
  //               //   constantUuidValue: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  //               // },
  //             },
  //           },
  //         },
  //       });
  //       console.log("queryResult", JSON.stringify(queryResult, null, 2));
  //       return queryResult; // == "ok" ? queryResult : {status: "error", error: queryResult.error};
  //     },
  //     (a) =>
  //       ignorePostgresExtraAttributesOnList(
  //         (a as any).returnedDomainElement.elementValue.entities.sort((a, b) => a.name.localeCompare(b.name)),
  //         ["author"]
  //       ),
  //     // (a) => (a as any).returnedDomainElement.elementValue.entities.elementValue,
  //     // undefined, // expected result transformation
  //     undefined, // name to give to result
  //     "object", //"instanceUuidIndex",
  //     [entityAuthor, entityBook, entityPublisher].sort((a, b) => a.name.localeCompare(b.name))
  //   );
  // });
  
  // // ################################################################################################
  // it("get Library Menus", async () => {
  //   await chainVitestSteps(
  //     "ExtractorPersistenceStoreRunner_getMenus",
  //     {},
  //     async () => {
  //       const applicationSection: ApplicationSection = "model";
  //       const queryResult: ActionReturnType = await localAppPersistenceStoreController.handleBoxedQueryAction({
  //         actionType: "runBoxedQueryAction",
  //         actionName: "runQuery",
  //         deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //         endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //         applicationSection: applicationSection,
  //         query: {
  //           queryType: "boxedQueryWithExtractorCombinerTransformer",
  //           pageParams: {},
  //           queryParams: {},
  //           contextResults: {},
  //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //           extractors: {
  //             menus: {
  //               extractorOrCombinerType: "extractorByEntityReturningObjectList",
  //               applicationSection: applicationSection,
  //               parentName: "Menu",
  //               parentUuid: entityMenu.uuid,
  //             },
  //           },
  //         },
  //       });
  //       console.log("queryResult", JSON.stringify(queryResult, null, 2));
  //       return queryResult; // == "ok" ? queryResult : {status: "error", error: queryResult.error};
  //     },
  //     // (a) => ignorePostgresExtraAttributesOnRecord((a as any).returnedDomainElement.elementValue.entities, ["author"]),
  //     (a) => ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.elementValue.menus, ["author", "parentDefinitionVersionUuid"]),
  //     // (a) => (a as any).returnedDomainElement.elementValue.entities.elementValue,
  //     // undefined, // expected result transformation
  //     undefined, // name to give to result
  //     "object", //"instanceUuidIndex",
  //     Object.values({
  //       "dd168e5a-2a21-4d2d-a443-032c6d15eb22": {
  //         uuid: "dd168e5a-2a21-4d2d-a443-032c6d15eb22",
  //         parentName: "Menu",
  //         parentUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
  //         name: "LibraryMenu",
  //         defaultLabel: "Meta-Model",
  //         description: "This is the default menu allowing to explore the Library Application.",
  //         definition: {
  //           menuType: "complexMenu",
  //           definition: [
  //             {
  //               title: "Library",
  //               label: "library",
  //               items: [
  //                 {
  //                   label: "Library Entities",
  //                   section: "model",
  //                   application: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  //                   reportUuid: "c9ea3359-690c-4620-9603-b5b402e4a2b9",
  //                   icon: "category",
  //                 },
  //                 {
  //                   label: "Library Entity Definitions",
  //                   section: "model",
  //                   application: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  //                   reportUuid: "f9aff35d-8636-4519-8361-c7648e0ddc68",
  //                   icon: "category",
  //                 },
  //                 {
  //                   label: "Library Reports",
  //                   section: "model",
  //                   application: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  //                   reportUuid: "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855",
  //                   icon: "list",
  //                 },
  //                 {
  //                   label: "Library Books",
  //                   section: "data",
  //                   application: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  //                   reportUuid: "74b010b6-afee-44e7-8590-5f0849e4a5c9",
  //                   icon: "auto_stories",
  //                 },
  //                 {
  //                   label: "Library Authors",
  //                   section: "data",
  //                   application: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  //                   reportUuid: "66a09068-52c3-48bc-b8dd-76575bbc8e72",
  //                   icon: "star",
  //                 },
  //                 {
  //                   label: "Library Publishers",
  //                   section: "data",
  //                   application: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  //                   reportUuid: "a77aa662-006d-46cd-9176-01f02a1a12dc",
  //                   icon: "account_balance",
  //                 },
  //                 {
  //                   label: "Library countries",
  //                   section: "data",
  //                   application: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  //                   reportUuid: "08176cc7-43ae-4fca-91b7-bf869d19e4b9",
  //                   icon: "flag",
  //                 },
  //                 {
  //                   label: "Library Users",
  //                   section: "data",
  //                   application: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  //                   reportUuid: "3df9413d-5050-4357-910c-f764aacae7e6",
  //                   icon: "person",
  //                 },
  //               ],
  //             },
  //           ],
  //         },
  //       },
  //     })
  //   );
  // });

  // // ################################################################################################
  // it("get Filtered Entity Entity from Miroir", async () => {
  //   await chainVitestSteps(
  //     "ExtractorPersistenceStoreRunner_selectObjectListByEntity_filtered",
  //     {},
  //     async () => {
  //       const applicationSection: ApplicationSection = "model";
  //       const queryResult = await localMiroirPersistenceStoreController.handleBoxedQueryAction({
  //         actionType: "runBoxedQueryAction",
  //         actionName: "runQuery",
  //         deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //         endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //         applicationSection: applicationSection,
  //         query: {
  //           queryType: "boxedQueryWithExtractorCombinerTransformer",
  //           pageParams: {},
  //           queryParams: {},
  //           contextResults: {},
  //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //           extractors: {
  //             entities: {
  //               extractorOrCombinerType: "extractorByEntityReturningObjectList",
  //               applicationSection: applicationSection,
  //               parentName: "Entity",
  //               parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  //               filter: {
  //                 attributeName: "name",
  //                 value: "or",
  //               },
  //             },
  //           },
  //         },
  //       });
  //       console.log("queryResult", JSON.stringify(queryResult, null, 2));
  //       return queryResult;
  //     },
  //     (a) =>
  //       ignorePostgresExtraAttributesOnList(
  //         (a as any).returnedDomainElement.elementValue.entities.sort((a, b) => a.name.localeCompare(b.name)),
  //         ["author"]
  //       ),
  //     undefined, // name to give to result
  //     "object",
  //     [entityReport, entityStoreBasedConfiguration].sort((a, b) => a.name.localeCompare(b.name))
  //   );
  // });
  
  // // ################################################################################################
  // it("get Unique Authors from Books in Library with actionRuntimeTransformer", async () => {
  //   await chainVitestSteps(
  //     "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
  //     {},
  //     async () => {
  //       const applicationSection: ApplicationSection = "data";
  //       const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction({
  //         actionType: "runBoxedQueryAction",
  //         actionName: "runQuery",
  //         deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //         endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //         applicationSection: applicationSection,
  //         query: {
  //           queryType: "boxedQueryWithExtractorCombinerTransformer",
  //           pageParams: {},
  //           queryParams: {},
  //           contextResults: {},
  //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //           extractors: {
  //             books: {
  //               extractorOrCombinerType: "extractorByEntityReturningObjectList",
  //               applicationSection: applicationSection,
  //               parentName: "Book",
  //               parentUuid: entityBook.uuid,
  //             },
  //           },
  //           runtimeTransformers: {
  //             uniqueAuthors: {
  //               transformerType: "unique",
  //               interpolation: "runtime",
  //               referencedExtractor: "books",
  //               attribute: "author",
  //               orderBy: "author",
  //             },
  //           },
  //         },
  //       });
  //       console.log("queryResult", JSON.stringify(queryResult, null, 2));
  //       return queryResult;
  //     },
  //     (a) => (a as any).returnedDomainElement.elementValue.uniqueAuthors,
  //     undefined, // name to give to result
  //     "object",
  //     [
  //       { author: "4441169e-0c22-4fbc-81b2-28c87cf48ab2" },
  //       { author: "ce7b601d-be5f-4bc6-a5af-14091594046a" },
  //       { author: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17" },
  //       { author: "e4376314-d197-457c-aa5e-d2da5f8d5977" },
  //     ]
  //   );
  // });
  
  // // ################################################################################################
  // it("get count books with actionRuntimeTransformer", async () => {
  //   await chainVitestSteps(
  //     "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
  //     {},
  //     async () => {
  //       const applicationSection: ApplicationSection = "data";
  //       const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction({
  //         actionType: "runBoxedQueryAction",
  //         actionName: "runQuery",
  //         deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //         endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //         applicationSection: applicationSection,
  //         query: {
  //           queryType: "boxedQueryWithExtractorCombinerTransformer",
  //           pageParams: {},
  //           queryParams: {},
  //           contextResults: {},
  //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //           extractors: {
  //             books: {
  //               extractorOrCombinerType: "extractorByEntityReturningObjectList",
  //               applicationSection: applicationSection,
  //               parentName: "Book",
  //               parentUuid: entityBook.uuid,
  //             },
  //           },
  //           runtimeTransformers: {
  //             uniqueAuthors: {
  //               referencedExtractor: "books",
  //               interpolation: "runtime",
  //               transformerType: "count",
  //             },
  //           },
  //         },
  //       });
  //       console.log("queryResult", JSON.stringify(queryResult, null, 2));
  //       return queryResult;
  //     },
  //     // (a) => (a as any).returnedDomainElement.elementValue.uniqueAuthors,
  //     (a) => (a as any).returnedDomainElement.elementValue.uniqueAuthors,
  //     undefined, // name to give to result
  //     "object",// must equal a.returnedDomainElement.elementType
  //     // 3,
  //     [{count: 6}],
  //     // [{count: "3"}],
  //     // ["4441169e-0c22-4fbc-81b2-28c87cf48ab2","ce7b601d-be5f-4bc6-a5af-14091594046a","d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17"]
  //   );
  // });
  
  // // ################################################################################################
  // it("get count books by author uuid with actionRuntimeTransformer", async () => {
  //   await chainVitestSteps(
  //     "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
  //     {},
  //     async () => {
  //       const applicationSection: ApplicationSection = "data";
  //       const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction({
  //         actionType: "runBoxedQueryAction",
  //         actionName: "runQuery",
  //         deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //         endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //         applicationSection: applicationSection,
  //         query: {
  //           queryType: "boxedQueryWithExtractorCombinerTransformer",
  //           pageParams: {},
  //           queryParams: {},
  //           contextResults: {},
  //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //           extractors: {
  //             books: {
  //               extractorOrCombinerType: "extractorByEntityReturningObjectList",
  //               applicationSection: applicationSection,
  //               parentName: "Book",
  //               parentUuid: entityBook.uuid,
  //             },
  //           },
  //           runtimeTransformers: {
  //             countBooksByAuthors: {
  //               referencedExtractor: "books",
  //               transformerType: "count",
  //               interpolation: "runtime",
  //               groupBy: "author",
  //               orderBy: "author",
  //             },
  //           },
  //         },
  //       });
  //       console.log("queryResult", JSON.stringify(queryResult, null, 2));
  //       return queryResult;
  //     },
  //     // (a) => (a as any).returnedDomainElement.elementValue.countBooksByAuthors,
  //     (a) => (a as any).returnedDomainElement.elementValue.countBooksByAuthors,
  //     undefined, // name to give to result
  //     "object", // must equal a.returnedDomainElement.elementType
  //     [
  //       { author: "4441169e-0c22-4fbc-81b2-28c87cf48ab2", count: 1 },
  //       { author: "ce7b601d-be5f-4bc6-a5af-14091594046a", count: 2 },
  //       { author: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17", count: 2 },
  //       { author: "e4376314-d197-457c-aa5e-d2da5f8d5977", count: 1 },
  //     ]
  //   );
  // });
  
  // // ################################################################################################
  // it("build custom object with actionRuntimeTransformer using fullObjectTemplate", async () => {
  //   await chainVitestSteps(
  //     "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
  //     {},
  //     async () => {
  //       const applicationSection: ApplicationSection = "data";
  //       const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction({
  //         actionType: "runBoxedQueryAction",
  //         actionName: "runQuery",
  //         deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //         endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //         applicationSection: applicationSection,
  //         query: {
  //           queryType: "boxedQueryWithExtractorCombinerTransformer",
  //           pageParams: {},
  //           queryParams: {},
  //           contextResults: {},
  //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //           extractors: {
  //             book: {
  //               extractorOrCombinerType: "extractorForObjectByDirectReference",
  //               applicationSection: applicationSection,
  //               parentName: "Book",
  //               parentUuid: entityBook.uuid,
  //               instanceUuid: book2.uuid,
  //             },
  //           },
  //           runtimeTransformers: {
  //             newBook: {
  //               transformerType: "fullObjectTemplate",
  //               interpolation: "runtime",
  //               referencedExtractor: "book",
  //               definition: [
  //                 {
  //                   attributeKey: {
  //                     interpolation: "runtime",
  //                     transformerType: "constantString",
  //                     constantStringValue: "uuid",
  //                   },
  //                   attributeValue: {
  //                     interpolation: "runtime",
  //                     transformerType: "newUuid",
  //                   },
  //                 },
  //                 {
  //                   attributeKey: {
  //                     interpolation: "runtime",
  //                     transformerType: "constantString",
  //                     constantStringValue: "name",
  //                   },
  //                   attributeValue: {
  //                     interpolation: "runtime",
  //                     transformerType: "mustacheStringTemplate",
  //                     definition: "{{book.name}}",
  //                   },
  //                 },
  //               ],
  //             },
  //           },
  //         },
  //       });
  //       console.log(expect.getState().currentTestName, "queryResult", JSON.stringify(queryResult, null, 2));
  //       return queryResult;
  //     },
  //     (a) => ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.elementValue.newBook, ["uuid"]),
  //     undefined, // name to give to result
  //     "object", // must equal a.returnedDomainElement.elementType
  //     [
  //       {
  //         name: book2.name,
  //       },
  //     ]
  //   );
  // });

  // // ################################################################################################
  // it("select publisher of book: combinerForObjectByRelation combiner", async () => {
  //   await chainVitestSteps(
  //     "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
  //     {},
  //     async () => {
  //       const applicationSection: ApplicationSection = "data";
  //       const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction({
  //         actionType: "runBoxedQueryAction",
  //         actionName: "runQuery",
  //         deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //         endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //         applicationSection: applicationSection,
  //         query: {
  //           queryType: "boxedQueryWithExtractorCombinerTransformer",
  //           pageParams: {},
  //           queryParams: {},
  //           contextResults: {},
  //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //           extractors: {
  //             book: {
  //               extractorOrCombinerType: "extractorForObjectByDirectReference",
  //               applicationSection: applicationSection,
  //               parentName: "Book",
  //               parentUuid: entityBook.uuid,
  //               instanceUuid: book2.uuid
  //             },
  //           },
  //           combiners: {
  //             publisher: {
  //               extractorOrCombinerType: "combinerForObjectByRelation",
  //               parentName: "Publisher",
  //               parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
  //               objectReference: "book",
  //               AttributeOfObjectToCompareToReferenceUuid: "publisher",
  //             },
  //           },
  //         },
  //       });
  //       console.log(expect.getState().currentTestName, "queryResult", JSON.stringify(queryResult, null, 2));
  //       return queryResult;
  //     },
  //     (a) =>
  //       ignorePostgresExtraAttributesOnObject((a as any).returnedDomainElement.elementValue.publisher, [
  //         "conceptLevel", "createdAt", "icon", "updatedAt",
  //       ]),
  //     undefined, // name to give to result
  //     "object", // must equal a.returnedDomainElement.elementType
  //       publisher3
  //   );
  // });

  // // ################################################################################################
  // it("select Books of Author: combinerByRelationReturningObjectList combiner", async () => {
  //   await chainVitestSteps(
  //     "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
  //     {},
  //     async () => {
  //       const applicationSection: ApplicationSection = "data";
  //       const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction({
  //         actionType: "runBoxedQueryAction",
  //         actionName: "runQuery",
  //         deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //         endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //         applicationSection: applicationSection,
  //         query: {
  //           queryType: "boxedQueryWithExtractorCombinerTransformer",
  //           pageParams: {},
  //           queryParams: {},
  //           contextResults: {},
  //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //           extractors: {
  //             author: {
  //               extractorOrCombinerType: "extractorForObjectByDirectReference",
  //               applicationSection: applicationSection,
  //               parentName: entityAuthor.name,
  //               parentUuid: entityAuthor.uuid,
  //               instanceUuid: author2.uuid
  //             },
  //           },
  //           combiners: {
  //             booksOfAuthor: { //join with only constant references
  //               extractorOrCombinerType: "combinerByRelationReturningObjectList",
  //               parentName: entityBook.name,
  //               parentUuid: entityBook.uuid,
  //               objectReference: "author",
  //               AttributeOfListObjectToCompareToReferenceUuid: "author",
  //             },
  //           },
  //         },
  //       });
  //       console.log(expect.getState().currentTestName, "queryResult", JSON.stringify(queryResult, null, 2));
  //       return queryResult;
  //     },
  //     (a) =>
  //       ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.elementValue.booksOfAuthor.sort((a, b) => a.name.localeCompare(b.name)), [
  //         "conceptLevel", "createdAt", "icon", "updatedAt",
  //       ]),
  //     undefined, // name to give to result
  //     "object", // must equal a.returnedDomainElement.elementType
  //     ignorePostgresExtraAttributesOnList([
  //       book1,
  //       book6,
  //     ].sort((a, b) => a.name.localeCompare(b.name)) as any, [
  //       "conceptLevel", "createdAt", "icon", "updatedAt",
  //     ])
      
  //   );
  // });

  // // ################################################################################################
  // // TODO: write in UTF-8 on disk!
  // it("get book title (name) list with actionRuntimeTransformer: mapperListToList + innerFullObjectTemplate", async () => {
  //   await chainVitestSteps(
  //     "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
  //     {},
  //     async () => {
  //       const applicationSection: ApplicationSection = "data";
  //       const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction({
  //         actionType: "runBoxedQueryAction",
  //         actionName: "runQuery",
  //         deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //         endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //         applicationSection: applicationSection,
  //         query: {
  //           queryType: "boxedQueryWithExtractorCombinerTransformer",
  //           pageParams: {},
  //           queryParams: {},
  //           contextResults: {},
  //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //           extractors: {
  //             books: {
  //               extractorOrCombinerType: "extractorByEntityReturningObjectList",
  //               applicationSection: applicationSection,
  //               parentName: "Book",
  //               parentUuid: entityBook.uuid,
  //             },
  //           },
  //           runtimeTransformers: {
  //             countries: {
  //               transformerType: "mapperListToList",
  //               interpolation: "runtime",
  //               referencedExtractor: "books",
  //               orderBy: "name",
  //               elementTransformer: {
  //                 transformerType: "innerFullObjectTemplate",
  //                 interpolation: "runtime",
  //                 referenceToOuterObject: "book",
  //                 definition: [
  //                   {
  //                     attributeKey: {
  //                       interpolation: "runtime",
  //                       transformerType: "constantUuid",
  //                       constantUuidValue: "uuid",
  //                     },
  //                     attributeValue: {
  //                       interpolation: "runtime",
  //                       transformerType: "newUuid",
  //                     },
  //                   },
  //                   {
  //                     attributeKey: {
  //                       interpolation: "runtime",
  //                       transformerType: "constantUuid",
  //                       constantUuidValue: "name",
  //                     },
  //                     attributeValue: {
  //                       interpolation: "runtime",
  //                       transformerType: "mustacheStringTemplate",
  //                       definition: "{{book.name}}",
  //                     },
  //                   },
  //                 ],
  //               },
  //             },
  //           },
  //         },
  //       });
  //       console.log("queryResult", JSON.stringify(queryResult, null, 2));
  //       return queryResult;
  //     },
  //     (a) =>
  //       ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.elementValue.countries, [
  //         "uuid",
  //       ]).sort((a, b) =>
  //         a["name"].localeCompare(b["name"])
  //       ),
  //     undefined, // name to give to result
  //     "object", // must equal a.returnedDomainElement.elementType
  //     [
  //       {
  //         name: "Et dans l'éternité je ne m'ennuierai pas",
  //         // name: book1.name,
  //       },
  //       {
  //         name: book2.name,
  //       },
  //       {
  //         name: "Renata n'importe quoi",
  //         // name: book3.name,
  //       },
  //       {
  //         name: book4.name,
  //       },
  //       {
  //         name: book5.name,
  //       },
  //       {
  //         name: book6.name,
  //       },
  //     // ].sort((a, b) => a.name.localeCompare(b.name))
  //     ].sort((a, b) => a.name == b.name ? 0 : a.name < b.name ? -1 : 1)
  //   );
  // });

  // // ################################################################################################
  // it("get books of an author with combiner", async () => {
  //   await chainVitestSteps(
  //     "ExtractorPersistenceStoreRunner_getBooksOfAuthorWithCombiner",
  //     {},
  //     async () => {
  //       const applicationSection: ApplicationSection = "data";
  //       const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction({
  //         actionType: "runBoxedQueryAction",
  //         actionName: "runQuery",
  //         deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //         endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //         applicationSection: applicationSection,
  //         query: {
  //           queryType: "boxedQueryWithExtractorCombinerTransformer",
  //           pageParams: {},
  //           queryParams: {
  //             // instanceUuid: "c6852e89-3c3c-447f-b827-4b5b9d830975",
  //           },
  //           contextResults: {},
  //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //           extractors: {
  //             book: {
  //               extractorOrCombinerType: "extractorForObjectByDirectReference",
  //               parentName: "Book",
  //               parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //               instanceUuid: "c6852e89-3c3c-447f-b827-4b5b9d830975",
  //             },
  //           },
  //           combiners: {
  //             author: {
  //               extractorOrCombinerType: "combinerForObjectByRelation",
  //               parentName: "Author",
  //               parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
  //               objectReference: "book",
  //               AttributeOfObjectToCompareToReferenceUuid: "author",
  //             },
  //             booksOfAuthor: {
  //               extractorOrCombinerType: "combinerByRelationReturningObjectList",
  //               parentName: "Book",
  //               parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //               objectReference: "author",
  //               AttributeOfListObjectToCompareToReferenceUuid: "author",
  //             },
  //           },
  //         },
  //       });
  //       console.log("queryResult", JSON.stringify(queryResult, null, 2));
  //       return queryResult;
  //     },
  //     (a) => {
  //       const result = ignorePostgresExtraAttributesOnList(
  //         (a as any).returnedDomainElement.elementValue.booksOfAuthor.sort((a, b) => a.name.localeCompare(b.name)),
  //       );
  //       return result;
  //     },
  //     undefined, // name to give to result
  //     "object", // must equal a.returnedDomainElement.elementType
  //     Object.values({
  //       "c6852e89-3c3c-447f-b827-4b5b9d830975": {
  //         author: "ce7b601d-be5f-4bc6-a5af-14091594046a",
  //         conceptLevel: "Data",
  //         name: "Le Pain et le Cirque",
  //         parentName: "Book",
  //         parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //         publisher: "516a7366-39e7-4998-82cb-80199a7fa667",
  //         uuid: "c6852e89-3c3c-447f-b827-4b5b9d830975",
  //       },
  //       "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": {
  //         author: "ce7b601d-be5f-4bc6-a5af-14091594046a",
  //         conceptLevel: "Data",
  //         name: "Et dans l'éternité je ne m'ennuierai pas",
  //         parentName: "Book",
  //         parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //         publisher: "516a7366-39e7-4998-82cb-80199a7fa667",
  //         uuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
  //       },
  //     }).sort((a, b) => a.name.localeCompare(b.name))
  //   );
  // });

  // // ################################################################################################
  // it("select first Book in Library with actionRuntimeTransformer", async () => {
  //   await chainVitestSteps(
  //     "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
  //     {},
  //     async () => {
  //       const applicationSection: ApplicationSection = "data";
  //       const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction({
  //         actionType: "runBoxedQueryAction",
  //         actionName: "runQuery",
  //         deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //         endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //         applicationSection: applicationSection,
  //         query: {
  //           queryType: "boxedQueryWithExtractorCombinerTransformer",
  //           pageParams: {},
  //           queryParams: {},
  //           contextResults: {},
  //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //           extractors: {
  //             books: {
  //               extractorOrCombinerType: "extractorByEntityReturningObjectList",
  //               applicationSection: applicationSection,
  //               parentName: "Book",
  //               parentUuid: entityBook.uuid,
  //             },
  //           },
  //           runtimeTransformers: {
  //             firstBook: {
  //               transformerType: "listPickElement",
  //               interpolation: "runtime",
  //               referencedExtractor: "books",
  //               index: 0,
  //               orderBy: "name",
  //             },
  //           },
  //         },
  //       });
  //       console.log("queryResult", JSON.stringify(queryResult, null, 2));
  //       return queryResult;
  //     },
  //     (a) => ignorePostgresExtraAttributesOnObject((a as any).returnedDomainElement.elementValue.firstBook),
  //     undefined, // name to give to result
  //     "object",
  //     // [
  //       book1,
  //       // { author: "4441169e-0c22-4fbc-81b2-28c87cf48ab2" },
  //       // { author: "ce7b601d-be5f-4bc6-a5af-14091594046a" },
  //       // { author: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17" },
  //       // { author: "e4376314-d197-457c-aa5e-d2da5f8d5977" },
  //     // ]
  //   );
  // });
    
  
});
