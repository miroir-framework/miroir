import { SetupWorkerApi } from 'msw/browser';
import { describe, expect } from 'vitest';

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
  entityPublisher,
  MetaEntity,
  MiroirConfigClient,
  MiroirContext,
  miroirCoreStartup,
  MiroirLoggerFactory,
  PersistenceStoreControllerInterface,
  PersistenceStoreControllerManagerInterface,
  publisher1,
  publisher2,
  publisher3,
  SelfApplicationDeploymentConfiguration,
  selfApplicationDeploymentLibrary,
  selfApplicationDeploymentMiroir,
  selfApplicationMiroir,
  selfApplicationModelBranchMiroirMasterBranch,
  selfApplicationStoreBasedConfigurationMiroir,
  selfApplicationVersionInitialMiroirVersion,
  TestCompositeAction,
  TestCompositeActionSuite,
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
  chainVitestSteps,
  loadTestConfigFiles,
  miroirAfterAll,
  miroirBeforeAll,
  miroirBeforeEach,
  setupMiroirTest,
  TestActionParams
} from "../utils/tests-utils.js";

let domainController: DomainControllerInterface;
let localCache: LocalCache;
// let localDataStoreWorker: SetupWorkerApi | undefined;
// let localDataStoreServer: any /**SetupServerApi | undefined */;
let localMiroirPersistenceStoreController: PersistenceStoreControllerInterface;
let localAppPersistenceStoreController: PersistenceStoreControllerInterface;
let miroirContext: MiroirContext;
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;

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
    const {
      persistenceStoreControllerManager: localpersistenceStoreControllerManager,
      domainController: localdomainController,
      localCache: locallocalCache,
      miroirContext: localmiroirContext,
    } = await setupMiroirTest(miroirConfig);

    persistenceStoreControllerManager = localpersistenceStoreControllerManager;
    domainController = localdomainController;
    localCache = locallocalCache;
    miroirContext = localmiroirContext;

    const wrapped = await miroirBeforeAll(
      miroirConfig as MiroirConfigClient,
      persistenceStoreControllerManager,
      domainController,
    );
    if (wrapped) {
      if (wrapped.localMiroirPersistenceStoreController && wrapped.localAppPersistenceStoreController) {
        localMiroirPersistenceStoreController = wrapped.localMiroirPersistenceStoreController;
        localAppPersistenceStoreController = wrapped.localAppPersistenceStoreController;
      }
    } else {
      throw new Error("beforeAll failed initialization!");
    }

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
      ],
    );
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
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirAfterAll")
    await miroirAfterAll(
      miroirConfig,
      domainController,
      [
        {
          adminConfigurationDeployment: adminConfigurationDeploymentMiroir,
          selfApplicationDeployment: selfApplicationDeploymentMiroir as SelfApplicationDeploymentConfiguration,
        },
      ],
    );
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done miroirAfterAll")
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

const testActions: Record<string, TestActionParams> = {
  "get Entity Entity from Miroir": {
    testActionType: "testCompositeActionSuite",
    deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
    testCompositeAction: {
      testType: "testCompositeActionSuite",
      // deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
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
                : miroirConfig.client.serverConfig.storeSectionConfiguration[adminConfigurationDeploymentLibrary.uuid],
            },
          },
        ],
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
            },
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
                dataStoreType:
                  adminConfigurationDeploymentLibrary.uuid == adminConfigurationDeploymentMiroir.uuid
                    ? "miroir"
                    : "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
                metaModel: defaultMiroirMetaModel,
                application: selfApplicationMiroir,
                selfApplicationDeploymentConfiguration: selfApplicationDeploymentLibrary,
                applicationModelBranch: selfApplicationModelBranchMiroirMasterBranch,
                applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationMiroir,
                applicationVersion: selfApplicationVersionInitialMiroirVersion,
              },
            },
          },
          {
            compositeActionType: "domainAction",
            compositeActionStepLabel: "initLibraryStore",
            domainAction: {
              actionType: "modelAction",
              actionName: "rollback",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            },
          },
          {
            compositeActionType: "domainAction",
            compositeActionStepLabel: "CreateLibraryStoreEntities",
            domainAction: {
              actionType: "modelAction",
              actionName: "createEntity",
              deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              entities: libraryEntitesAndInstances,
            },
          },
          {
            compositeActionType: "domainAction",
            compositeActionStepLabel: "CommitLibraryStoreEntities",
            domainAction: {
              actionType: "modelAction",
              actionName: "commit",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            },
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
              }),
            },
          },
        ],
      },
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
              deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
              deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              configuration: miroirConfig.client.emulateServer
              ? miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentLibrary.uuid]
              : miroirConfig.client.serverConfig.storeSectionConfiguration[adminConfigurationDeploymentLibrary.uuid]
            }
          },
        ],
      },
      testCompositeActions: [
        {
          testType: "testCompositeAction",
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
                      currentDeploymentUuid: adminConfigurationDeploymentMiroir.uuid,
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
                definition: {
                  resultAccessPath: ["entityEntity", "entity"],
                  ignoreAttributes: ["author"],
                  expectedValue: entityEntity,
                },
              },
            },
          ],
        },
      ]
    },
  },
    // ]
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
};

// TODO: duplicate test with ExtractorTemplatePersistenceStoreRunner.integ.test.tsx
describe.sequential("DomainNewController.CompositeAction.integ.test", () => {
  it.each(Object.entries(testActions))("test %s", async (currentTestName, testAction: TestActionParams) => {
    // const fullTestName = describe.sequential.name + "/" + currentTestName
    const fullTestName = expect.getState().currentTestName ?? "no test name";
    console.info("STARTING test:", fullTestName);
    // expect(currentTestName != undefined).toBeTruthy();
    // expect(testParams.testAssertions).toBeDefined();

    await chainVitestSteps(
      fullTestName,
      {},
      async () => {
        switch (testAction.testActionType) {
          case "testCompositeActionSuite": {
            const queryResult: ActionReturnType = await domainController.handleTestCompositeActionSuite(
              testAction.testCompositeAction,
              {},
              localCache.currentModel(testAction.deploymentUuid)
            );
            console.log(
              "test testCompositeActionSuite",
              fullTestName,
              ": queryResult=",
              JSON.stringify(queryResult, null, 2)
            );
            return queryResult;
          }
          case "testCompositeAction": {
            const queryResult: ActionReturnType = await domainController.handleTestCompositeAction(
              testAction.testCompositeAction,
              {},
              localCache.currentModel(testAction.deploymentUuid)
            );
            console.log(
              "test testCompositeAction",
              fullTestName,
              ": queryResult=",
              JSON.stringify(queryResult, null, 2)
            );
            return queryResult;
          }
          case "testCompositeActionTemplate": {
            throw new Error("testCompositeActionTemplate not implemented yet!");
          }
        }
      },
      undefined, // expected result transformation
      undefined, // name to give to result
      "void",
      undefined // expectedValue
    );
  });
});
