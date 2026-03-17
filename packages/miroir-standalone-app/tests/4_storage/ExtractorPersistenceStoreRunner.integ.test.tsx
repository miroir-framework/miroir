import { describe } from 'vitest';

import {
  type Action2ReturnType,
  ApplicationSection,
  ConfigurationService,
  createDeploymentCompositeAction,
  // defaultLibraryModelEnvironment,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  DomainControllerInterface,
  EntityDefinition,
  entityEndpointVersion,
  entityEntity,
  entityEntityDefinition,
  EntityInstance,
  entityMenu,
  ignorePostgresExtraAttributesOnObject,
  LoggerInterface,
  MetaEntity,
  MiroirActivityTracker,
  MiroirConfigClient,
  MiroirEventService,
  miroirFundamentalJzodSchema,
  MiroirLoggerFactory,
  PersistenceStoreControllerInterface,
  resetAndInitApplicationDeployment,
  resetAndinitializeDeploymentCompositeAction,
  selfApplicationMiroir,
  // selfApplicationLibrary,
  StoreUnitConfiguration
} from "miroir-core";
import {
  deployment_Admin,
  deployment_Miroir,
  menuDefaultAdmin,
} from "miroir-test-app_deployment-admin";
import {
  deployment_Library_DO_NO_USE,
  menuDefaultLibrary,
} from "miroir-test-app_deployment-library";


import {
  author1,
  author2,
  author3,
  book1,
  book2,
  book3,
  book4,
  book5,
  book6,
  endpointDocument,
  entityAuthor,
  entityBook,
  entityCountry,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionPublisher,
  entityLendingHistoryItem,
  entityPublisher,
  entityUser,
  getDefaultLibraryModelEnvironmentDEFUNCT,
  folio as publisher1,
  penguin as publisher2,
  springer as publisher3,
  selfApplicationLibrary,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationVersionLibraryInitialVersion,
} from "miroir-test-app_deployment-library";

import {
  AdminApplicationDeploymentConfiguration,
  defaultMiroirMetaModel,
  ignorePostgresExtraAttributesOnList,
  LocalCacheInterface,
  LoggerOptions,
  MiroirContext,
  miroirCoreStartup,
  PersistenceStoreControllerManagerInterface
} from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from 'miroir-store-filesystem';
import { miroirIndexedDbStoreSectionStartup } from 'miroir-store-indexedDb';
import { miroirMongoDbStoreSectionStartup } from 'miroir-store-mongodb';
import { miroirPostgresStoreSectionStartup } from 'miroir-store-postgres';
// import { miroirCoreStartup } from 'miroir-core/src/startup.js';
import type {
  ApplicationDeploymentMap,
  ApplicationEntitiesAndInstances,
  Deployment,
  EndpointDefinition,
  Entity,
  Menu,
  MlSchema,
} from "miroir-core";
import { loglevelnext } from "../../src/loglevelnextImporter.js";
import {
  createMiroirDeploymentGetPersistenceStoreController,
  deleteAndCloseApplicationDeployments,
  deploymentConfigurations,
  resetApplicationDeployments,
  selfApplicationDeploymentConfigurations,
  setupMiroirTest,
} from "../../src/miroir-fwk/4-tests/tests-utils.js";
import { chainVitestSteps } from '../../src/miroir-fwk/4-tests/vitest-utils.js';
import { miroirAppStartup } from '../../src/startup.js';
import { cleanLevel, packageName } from '../3_controllers/constants.js';
import { loadTestConfigFiles } from '../utils/fileTools.js';

let domainController: DomainControllerInterface;
let localCache: LocalCacheInterface;
let localMiroirPersistenceStoreController: PersistenceStoreControllerInterface;
let localAppPersistenceStoreController: PersistenceStoreControllerInterface;
// let miroirContext: MiroirContext;
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;

// const env:any = (import.meta as any).env
const env:any = process.env
console.log("@@@@@@@@@@@@@@@@@@ env", env);

const {miroirConfig, logConfig:importedLoggerOptions} = await loadTestConfigFiles(env);
const loggerOptions: LoggerOptions = importedLoggerOptions??{
  defaultLevel: "INFO", 
  defaultTemplate: "[{{time}}] {{level}} ({{name}}) -",
  specificLoggerOptions: {},
};

const fileName = "ExtractorPersistenceStoreRunner.integ.test";
const myConsoleLog = (...args: any[]) => console.log(fileName, ...args);
myConsoleLog("using logger options:", JSON.stringify(loggerOptions, null, 2));
// const {miroirConfig, logConfig:loggerOptions} = await loadTestConfigFiles(env);
myConsoleLog(fileName, "received env", JSON.stringify(env, null, 2));

// let miroirConfig:any;
// let loggerOptions:any;
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, fileName)
).then((logger: LoggerInterface) => {log = logger});

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
miroirMongoDbStoreSectionStartup(ConfigurationService.configurationService);
miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);
ConfigurationService.configurationService.registerTestImplementation({expect: expect as any});

// const {miroirConfig: miroirConfigParam, logConfig:loggerOptionsParam} = await loadTestConfigFiles(env)
myConsoleLog("received miroirConfig", JSON.stringify(miroirConfig, null, 2));
myConsoleLog(
  "received miroirConfig.client",
  JSON.stringify(miroirConfig.client, null, 2)
);
myConsoleLog("received loggerOptions", JSON.stringify(loggerOptions, null, 2));
const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
MiroirLoggerFactory.startRegisteredLoggers(
  miroirActivityTracker,
  miroirEventService,
  loglevelnext,
  loggerOptions,
);
myConsoleLog("started registered loggers DONE");

// const miroirtDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
//   ? miroirConfig.client.deploymentStorageConfig[deployment_Miroir.uuid]
//   : miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Miroir.uuid];

const testApplicationDeploymentUuid = deployment_Library_DO_NO_USE.uuid;
const libraryDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[testApplicationDeploymentUuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[testApplicationDeploymentUuid];

const adminDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
? miroirConfig.client.deploymentStorageConfig[deployment_Admin.uuid]
: miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Admin.uuid];

  
const adminDeployment: Deployment = {
  ...deployment_Admin,
  configuration: adminDeploymentStorageConfiguration,
};

// const typedAdminConfigurationDeploymentLibrary:AdminApplicationDeploymentConfiguration = deployment_Library_DO_NO_USE as any;

const applicationDeploymentMap: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
};

console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

export const libraryEntitiesAndInstances: ApplicationEntitiesAndInstances = [
  {
    entity: entityAuthor as Entity,
    entityDefinition: entityDefinitionAuthor as EntityDefinition,
    instances: [author1, author2, author3 as EntityInstance],
  },
  {
    entity: entityBook as Entity,
    entityDefinition: entityDefinitionBook as EntityDefinition,
    instances: [
      book1 as EntityInstance,
      book2 as EntityInstance,
      book3 as EntityInstance,
      book4 as EntityInstance,
      book5 as EntityInstance,
      book6 as EntityInstance,
    ],
  },
  {
    entity: entityPublisher as Entity,
    entityDefinition: entityDefinitionPublisher as EntityDefinition,
    instances: [
      publisher1 as EntityInstance,
      publisher2 as EntityInstance,
      publisher3 as EntityInstance,
    ],
  },
];

const defaultLibraryModelEnvironment = getDefaultLibraryModelEnvironmentDEFUNCT(
  miroirFundamentalJzodSchema as MlSchema,
  defaultMiroirMetaModel,
  endpointDocument as EndpointDefinition,
  deployment_Library_DO_NO_USE.uuid,
);

// ################################################################################################
beforeAll(
  async () => {
    // Establish requests interception layer before all tests.
    if (!miroirConfig.client.emulateServer) {
      throw new Error(
        "LocalPersistenceStoreController state do not make sense for real server configurations! Please use only 'emulateServer: true' configurations for this test."
      );
    }

    const {
      persistenceStoreControllerManagerForServer: localpersistenceStoreControllerManager,
      domainController: localdomainController,
      localCache: locallocalCache,
      miroirContext: localmiroirContext,
    } = await setupMiroirTest(miroirConfig);

    if (!localpersistenceStoreControllerManager) {
      throw new Error("localpersistenceStoreControllerManager not defined");
    }

    persistenceStoreControllerManager = localpersistenceStoreControllerManager;
    domainController = localdomainController;
    localCache = locallocalCache;
    // miroirContext = localmiroirContext;


    const wrapped = await createMiroirDeploymentGetPersistenceStoreController(
      miroirConfig as MiroirConfigClient,
      persistenceStoreControllerManager,
      domainController,
      applicationDeploymentMap,
      adminDeployment,
    );
    if (wrapped) {
      if (wrapped.localMiroirPersistenceStoreController) {
        localMiroirPersistenceStoreController = wrapped.localMiroirPersistenceStoreController;
      } else {
        throw new Error("beforeAll failed localMiroirPersistenceStoreController initialization!");
      }
    } else {
      throw new Error("beforeAll failed initialization!");
    }
    const createLibraryDeploymentAction = createDeploymentCompositeAction(
      "library",
      deployment_Library_DO_NO_USE.uuid,
      selfApplicationLibrary.uuid,
      adminDeployment,
      libraryDeploymentStorageConfiguration);
    const result = await domainController.handleCompositeAction(
      createLibraryDeploymentAction,
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
      {}
    );

    if (result.status !== "ok") {
      throw new Error("beforeAll failed createLibraryDeploymentAction!");
    }

    const tmplocalAppPersistenceStoreController = persistenceStoreControllerManager.getPersistenceStoreController(
      deployment_Library_DO_NO_USE.uuid
    );
    if (!tmplocalAppPersistenceStoreController) {
      throw new Error("beforeAll failed localAppPersistenceStoreController initialization!");
    }
    localAppPersistenceStoreController = tmplocalAppPersistenceStoreController;

    return Promise.resolve();
  }
)

let beforEachCount = 0;
// ################################################################################################
beforeEach(
  async  () => {
    beforEachCount++;
    console.log("################################################### beforeEach start", beforEachCount);
    await resetAndInitApplicationDeployment(
      domainController,
      applicationDeploymentMap,
      selfApplicationDeploymentConfigurations
    );
    console.log("################################################### beforeEach resetAndinitializeDeploymentCompositeAction", beforEachCount);
    const initResult:Action2ReturnType = await domainController.handleCompositeAction(
      resetAndinitializeDeploymentCompositeAction(
        selfApplicationLibrary.uuid,
        deployment_Library_DO_NO_USE.uuid,
        {
          dataStoreType: "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
          metaModel: defaultMiroirMetaModel,
          selfApplication: selfApplicationLibrary,
          applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
          applicationVersion: selfApplicationVersionLibraryInitialVersion,
        },
        libraryEntitiesAndInstances,
        defaultLibraryModelEnvironment.currentModel as any,
      ),
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
      {},
    );
    if (initResult.status !== "ok") {
      throw new Error("beforeEach failed initialization! " + beforEachCount + " " + JSON.stringify(initResult, null, 2));
    }
    document.body.innerHTML = '';
    console.log("################################################### beforeEach done", beforEachCount);
  }
)

// ################################################################################################
afterEach(
  async () => {
    log.info("################################################### afterEach start", beforEachCount);
    await resetApplicationDeployments(
      deploymentConfigurations,
      applicationDeploymentMap,
      domainController,
      localCache,
    );
    log.info("################################################### afterEach done", beforEachCount);
  }
)

// ################################################################################################
afterAll(
  async () => {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ deleteAndCloseApplicationDeployments")
    await deleteAndCloseApplicationDeployments(
      miroirConfig,
      domainController,
      applicationDeploymentMap,
      [
        deployment_Miroir as AdminApplicationDeploymentConfiguration,
      ]
    );
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done deleteAndCloseApplicationDeployments")
  }
)



// ##############################################################################################
// ##############################################################################################
// ##############################################################################################

// TODO: duplicate test with ExtractorTemplatePersistenceStoreRunner.integ.test.tsx
describe.sequential("ExtractorOrQueryPersistenceStoreRunner.integ.test", async () => {
  const runAsSql = true;

  // ################################################################################################
  it("get Miroir Entities", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_getMiroirEntities",
      {},
      async () => {
        const applicationSection: ApplicationSection = "model";
        const queryResult: Action2ReturnType =
          await localMiroirPersistenceStoreController.handleBoxedQueryAction(
            {
              actionType: "runBoxedQueryAction",
              endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
              payload: {
                application: selfApplicationLibrary.uuid,
                applicationSection: applicationSection,
                query: {
                  queryType: "boxedQueryWithExtractorCombinerTransformer",
                  application: selfApplicationLibrary.uuid,
                  runAsSql,
                  extractors: {
                    entities: {
                      extractorOrCombinerType: "extractorInstancesByEntity",
                      applicationSection: applicationSection,
                      parentName: "Entity",
                      parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                    },
                  },
                },
              },
            },
            applicationDeploymentMap
          );
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult; // == "ok" ? queryResult : {status: "error", error: queryResult.error};
      },
      // (a) => ignorePostgresExtraAttributesOnRecord((a as any).returnedDomainElement.entities, ["author"]),
      (a) =>
        ignorePostgresExtraAttributesOnList(
          (a as any).returnedDomainElement.entities.sort((a: any, b: any) =>
            a.name.localeCompare(b.name)
          ),
          ["author", "storageAccess"]
        ),
      // (a) => (a as any).returnedDomainElement.entities,
      // undefined, // expected result transformation
      undefined, // name to give to result
      undefined,
      defaultMiroirMetaModel.entities
      .sort((a, b) => a.name.localeCompare(b.name)),
    );
  });

  // ################################################################################################
  it("get Entity Entity from Miroir", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_selectEntityInstance_selectObjectByDirectReference",
      {},
      async () => {
        console.log(
          "#######################################################################################################",
        );
        const applicationSection: ApplicationSection = "model";

        const queryResult: Action2ReturnType =
          await localMiroirPersistenceStoreController.handleBoxedQueryAction(
            {
              actionType: "runBoxedQueryAction",
              endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
              payload: {
                application: selfApplicationMiroir.uuid,
                applicationSection: applicationSection,
                query: {
                  queryType: "boxedQueryWithExtractorCombinerTransformer",
                  application: selfApplicationMiroir.uuid,
                  extractors: {
                    entity: {
                      extractorOrCombinerType: "extractorByPrimaryKey",
                      applicationSection: "model",
                      parentName: "Entity",
                      parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                      instanceUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                    },
                  },
                },
              },
            },
            applicationDeploymentMap,
          );
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) =>
        ignorePostgresExtraAttributesOnObject((a as any).returnedDomainElement.entity, [
          "author",
          "storageAccess",
        ]),
      undefined, // name to give to result
      undefined,
      ignorePostgresExtraAttributesOnObject(entityEntity as EntityInstance, [
        "author",
        "storageAccess",
      ]),
      // {
      //   uuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      //   parentName: "Entity",
      //   parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      //   parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
      //   name: "Entity",
      //   selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      //   conceptLevel: "MetaModel",
      //   description: "The Metaclass for entities.",
      // }
    );
  });

  
  // ################################################################################################
  it("get Library Entities", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_getLibraryEntities",
      {},
      async () => {
        const applicationSection: ApplicationSection = "model";
        const queryResult: Action2ReturnType =
          await localAppPersistenceStoreController.handleBoxedQueryAction(
            {
              actionType: "runBoxedQueryAction",
              endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
              payload: {
                application: selfApplicationLibrary.uuid,
                applicationSection: applicationSection,
                query: {
                  queryType: "boxedQueryWithExtractorCombinerTransformer",
                  application: selfApplicationLibrary.uuid,
                  runAsSql,
                  extractors: {
                    entities: {
                      extractorOrCombinerType: "extractorInstancesByEntity",
                      applicationSection: applicationSection,
                      parentName: entityEntity.name,
                      parentUuid: entityEntity.uuid,
                    },
                  },
                },
              },
            },
            applicationDeploymentMap,
          );
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult; // == "ok" ? queryResult : {status: "error", error: queryResult.error};
      },
      (a) =>
        ignorePostgresExtraAttributesOnList(
          (a as any).returnedDomainElement.entities.sort((a: any, b: any) =>
            a.name.localeCompare(b.name),
          ),
          // ["author", "storageAccess"],
          ["author", "storageAccess", "conceptLevel"],
        ),
      // (a) => (a as any).returnedDomainElement.entities,
      // undefined, // expected result transformation
      undefined, // name to give to result
      undefined,
      ignorePostgresExtraAttributesOnList([
        entityAuthor as Entity,
        entityBook as Entity,
        entityCountry as Entity,
        entityLendingHistoryItem as Entity,
        entityPublisher as Entity,
        entityUser as Entity,
      ], ["author", "storageAccess", "conceptLevel"]).sort((a, b) => a.name.localeCompare(b.name)),
    );
  });
  
  // ################################################################################################
  it("get Library Menus", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_getMenus",
      {},
      async () => {
        const applicationSection: ApplicationSection = "model";
        const queryResult: Action2ReturnType =
          await localAppPersistenceStoreController.handleBoxedQueryAction(
            {
              actionType: "runBoxedQueryAction",
              endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
              payload: {
                application: selfApplicationLibrary.uuid,
                applicationSection: applicationSection,
                query: {
                  queryType: "boxedQueryWithExtractorCombinerTransformer",
                  application: selfApplicationLibrary.uuid,
                  runAsSql,
                  extractors: {
                    menus: {
                      extractorOrCombinerType: "extractorInstancesByEntity",
                      applicationSection: applicationSection,
                      parentName: "Menu",
                      parentUuid: entityMenu.uuid,
                    },
                  },
                },
              },
            },
            applicationDeploymentMap
          );
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult; // == "ok" ? queryResult : {status: "error", error: queryResult.error};
      },
      // (a) => ignorePostgresExtraAttributesOnRecord((a as any).returnedDomainElement.entities, ["author"]),
      (a) =>
        ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.menus, [
          "author",
          "parentDefinitionVersionUuid",
        ]),
      // (a) => (a as any).returnedDomainElement.entities,
      // undefined, // expected result transformation
      undefined, // name to give to result
      undefined,
      ignorePostgresExtraAttributesOnList([
          menuDefaultLibrary as Menu,
      ], ["author", "parentDefinitionVersionUuid"])
    );
  });

  // ################################################################################################
  it("get Filtered Entity Entity from Miroir", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_selectObjectListByEntity_filtered",
      {},
      async () => {
        const applicationSection: ApplicationSection = "model";
        const queryResult = await localMiroirPersistenceStoreController.handleBoxedQueryAction(
          {
            actionType: "runBoxedQueryAction",
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            payload: {
              application: selfApplicationLibrary.uuid,
              applicationSection: applicationSection,
              query: {
                queryType: "boxedQueryWithExtractorCombinerTransformer",
                application: selfApplicationLibrary.uuid,
                runAsSql,
                extractors: {
                  entities: {
                    extractorOrCombinerType: "extractorInstancesByEntity",
                    applicationSection: applicationSection,
                    parentName: "Entity",
                    parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                    filter: {
                      attributeName: "name",
                      value: "en",
                    },
                  },
                },
              },
            },
          },
          applicationDeploymentMap,
        );
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) =>
        ignorePostgresExtraAttributesOnList(
          (a as any).returnedDomainElement.entities.sort((a: any, b: any) =>
            a.name.localeCompare(b.name),
          ),
          ["author", "storageAccess"],
        ),
      undefined, // name to give to result
      undefined,
      [entityEndpointVersion, entityEntity, entityEntityDefinition, entityMenu].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    );
  });
  
  // ################################################################################################
  it("get Unique Authors from Books in Library with actionRuntimeTransformer", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction(
          {
            actionType: "runBoxedQueryAction",
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            payload: {
              application: selfApplicationLibrary.uuid,
              applicationSection: applicationSection,
              query: {
                application: selfApplicationLibrary.uuid,
                queryType: "boxedQueryWithExtractorCombinerTransformer",
                runAsSql,
                extractors: {
                  books: {
                    extractorOrCombinerType: "extractorInstancesByEntity",
                    applicationSection: applicationSection,
                    parentName: "Book",
                    parentUuid: entityBook.uuid,
                  },
                },
                runtimeTransformers: {
                  getUniqueValuesAuthors: {
                    transformerType: "getUniqueValues",
                    interpolation: "runtime",
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referenceName: "books",
                    },
                    attribute: "author",
                    orderBy: "author",
                  },
                },
              },
            },
          },
          applicationDeploymentMap
        );
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) => (a as any).returnedDomainElement.getUniqueValuesAuthors,
      undefined, // name to give to result
      undefined,
      [
        { author: "4441169e-0c22-4fbc-81b2-28c87cf48ab2" },
        { author: "ce7b601d-be5f-4bc6-a5af-14091594046a" },
        { author: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17" },
        { author: "e4376314-d197-457c-aa5e-d2da5f8d5977" },
      ]
    );
  });
  
  // ################################################################################################
  it("get count books with actionRuntimeTransformer", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction({
          actionType: "runBoxedQueryAction",
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          payload: {
            application: selfApplicationLibrary.uuid,
            applicationSection: applicationSection,
            query: {
              application: selfApplicationLibrary.uuid,
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              runAsSql,
              extractors: {
                books: {
                  extractorOrCombinerType: "extractorInstancesByEntity",
                  applicationSection: applicationSection,
                  parentName: "Book",
                  parentUuid: entityBook.uuid,
                },
              },
              runtimeTransformers: {
                getUniqueValuesAuthors: {
                  interpolation: "runtime",
                  transformerType: "aggregate",
                  applyTo: {
                    transformerType: "getFromContext",
                    interpolation: "runtime",
                    referenceName: "books",
                  },
                },
              },
            },
          }
        }, applicationDeploymentMap);
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      // (a) => (a as any).returnedDomainElement.getUniqueValuesAuthors,
      (a) => (a as any).returnedDomainElement.getUniqueValuesAuthors,
      undefined, // name to give to result
      undefined,
      // 3,
      [{aggregate: 6}],
      // [{count: "3"}],
      // ["4441169e-0c22-4fbc-81b2-28c87cf48ab2","ce7b601d-be5f-4bc6-a5af-14091594046a","d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17"]
    );
  });
  
  // ################################################################################################
  it("get count books by author uuid with actionRuntimeTransformer", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction(
          {
            actionType: "runBoxedQueryAction",
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            payload: {
              application: selfApplicationLibrary.uuid,
              applicationSection: applicationSection,
              query: {
                application: selfApplicationLibrary.uuid,
                queryType: "boxedQueryWithExtractorCombinerTransformer",
                runAsSql,
                extractors: {
                  books: {
                    extractorOrCombinerType: "extractorInstancesByEntity",
                    applicationSection: applicationSection,
                    parentName: "Book",
                    parentUuid: entityBook.uuid,
                  },
                },
                runtimeTransformers: {
                  countBooksByAuthors: {
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referenceName: "books",
                    },
                    transformerType: "aggregate",
                    interpolation: "runtime",
                    groupBy: "author",
                  },
                },
              },
            },
          },
          applicationDeploymentMap
        );
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) => (a as any).returnedDomainElement.countBooksByAuthors.sort((a: any, b: any) => a.author.localeCompare(b.author)),
      undefined, // name to give to result
      undefined,
      [
        { author: "4441169e-0c22-4fbc-81b2-28c87cf48ab2", aggregate: 1 },
        { author: "ce7b601d-be5f-4bc6-a5af-14091594046a", aggregate: 2 },
        { author: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17", aggregate: 2 },
        { author: "e4376314-d197-457c-aa5e-d2da5f8d5977", aggregate: 1 },
      ]
    );
  });

  // ################################################################################################
  it("select publisher of book: combinerOneToOne combiner", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction(
          {
            actionType: "runBoxedQueryAction",
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            payload: {
              application: selfApplicationLibrary.uuid,
              applicationSection: applicationSection,
              query: {
                application: selfApplicationLibrary.uuid,
                queryType: "boxedQueryWithExtractorCombinerTransformer",
                runAsSql,
                extractors: {
                  book: {
                    extractorOrCombinerType: "extractorByPrimaryKey",
                    applicationSection: applicationSection,
                    parentName: "Book",
                    parentUuid: entityBook.uuid,
                    instanceUuid: book2.uuid,
                  },
                },
                combiners: {
                  publisher: {
                    extractorOrCombinerType: "combinerOneToOne",
                    parentName: "Publisher",
                    parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
                    objectReference: "book",
                    AttributeOfObjectToCompareToReferenceUuid: "publisher",
                  },
                },
              },
            },
          },
          applicationDeploymentMap
        );
        console.log(expect.getState().currentTestName, "queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) =>
        ignorePostgresExtraAttributesOnObject((a as any).returnedDomainElement.publisher, [
          "conceptLevel", "createdAt", "icon", "updatedAt",
        ]),
      undefined, // name to give to result
      undefined,
      publisher3
    );
  });

  // ################################################################################################
  it("select Books of Author: combinerOneToMany combiner", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction(
          {
            actionType: "runBoxedQueryAction",
            // actionName: "runQuery",
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            payload: {
              application: selfApplicationLibrary.uuid,
              applicationSection: applicationSection,
              query: {
                queryType: "boxedQueryWithExtractorCombinerTransformer",
                application: selfApplicationLibrary.uuid,
                runAsSql,
                extractors: {
                  author: {
                    extractorOrCombinerType: "extractorByPrimaryKey",
                    applicationSection: applicationSection,
                    parentName: entityAuthor.name,
                    parentUuid: entityAuthor.uuid,
                    instanceUuid: author2.uuid,
                  },
                },
                combiners: {
                  booksOfAuthor: {
                    //join with only returnValue references
                    extractorOrCombinerType: "combinerOneToMany",
                    parentName: entityBook.name,
                    parentUuid: entityBook.uuid,
                    objectReference: "author",
                    AttributeOfListObjectToCompareToReferenceUuid: "author",
                  },
                },
              },
            },
          },
          applicationDeploymentMap
        );
        console.log(expect.getState().currentTestName, "queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) =>
        ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.booksOfAuthor.sort((a: any, b: any) => a.name.localeCompare(b.name)), [
          "conceptLevel", "createdAt", "icon", "updatedAt", "year", "ISBN",
        ]),
      undefined, // name to give to result
      undefined,
      ignorePostgresExtraAttributesOnList([
        book1,
        book6,
      ].sort((a, b) => a.name.localeCompare(b.name)) as any, [
        "conceptLevel", "createdAt", "icon", "updatedAt", "year", "ISBN",
      ])
      
    );
  });

  // // ################################################################################################
  // // TODO: write in UTF-8 on disk / in Database!
  // // TODO: provide implementation for mapList
  // it("get book title (name) list with actionRuntimeTransformer: mapList + innerFullObjectTemplate", async () => {
  //   await chainVitestSteps(
  //     "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
  //     {},
  //     async () => {
  //       const applicationSection: ApplicationSection = "data";
  //       const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction({
  //         actionType: "runBoxedQueryAction",
  //         actionName: "runQuery",
  //         deploymentUuid: deployment_Library_DO_NO_USE.uuid,
  //         endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //         payload: {
  //           applicationSection: applicationSection,
  //           query: {
  //             queryType: "boxedQueryWithExtractorCombinerTransformer",
  //             pageParams: {},
  //             queryParams: {},
  //             contextResults: {},
  //             deploymentUuid: deployment_Library_DO_NO_USE.uuid,
  //             extractors: {
  //               books: {
  //                 extractorOrCombinerType: "extractorInstancesByEntity",
  //                 applicationSection: applicationSection,
  //                 parentName: "Book",
  //                 parentUuid: entityBook.uuid,
  //               },
  //             },
  //             runtimeTransformers: {
  //               countries: {
  //                 transformerType: "mapList",
  //                 interpolation: "runtime",
  //                 referencedTransformer: "books",
  //                 orderBy: "name",
  //                 elementTransformer: {
  //                   transformerType: "innerFullObjectTemplate",
  //                   interpolation: "runtime",
  //                   referenceToOuterObject: "book",
  //                   definition: [
  //                     {
  //                       attributeKey: {
  //                         interpolation: "runtime",
  //                         transformerType: "constantUuid",
  //                         value: "uuid",
  //                       },
  //                       attributeValue: {
  //                         interpolation: "runtime",
  //                         transformerType: "generateUuid",
  //                       },
  //                     },
  //                     {
  //                       attributeKey: {
  //                         interpolation: "runtime",
  //                         transformerType: "constantUuid",
  //                         value: "name",
  //                       },
  //                       attributeValue: {
  //                         interpolation: "runtime",
  //                         transformerType: "mustacheStringTemplate",
  //                         definition: "{{book.name}}",
  //                       },
  //                     },
  //                   ],
  //                 },
  //               },
  //             },
  //           },
  //         }
  //       });
  //       console.log("queryResult", JSON.stringify(queryResult, null, 2));
  //       return queryResult;
  //     },
  //     (a) =>
  //       ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.countries, [
  //         "uuid",
  //       ]).sort((a, b) =>
  //         a["name"].localeCompare(b["name"])
  //       ),
  //     undefined, // name to give to result
  //     undefined,
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

  // ################################################################################################
  it("get books of an author with combiner", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_getBooksOfAuthorWithCombiner",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction({
          actionType: "runBoxedQueryAction",
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          payload: {
            application: selfApplicationLibrary.uuid,
            applicationSection: applicationSection,
            query: {
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              application: selfApplicationLibrary.uuid,
              runAsSql,
              extractors: {
                book: {
                  extractorOrCombinerType: "extractorByPrimaryKey",
                  parentName: "Book",
                  parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
                  instanceUuid: "c6852e89-3c3c-447f-b827-4b5b9d830975",
                },
              },
              combiners: {
                author: {
                  extractorOrCombinerType: "combinerOneToOne",
                  parentName: "Author",
                  parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
                  objectReference: "book",
                  AttributeOfObjectToCompareToReferenceUuid: "author",
                },
                booksOfAuthor: {
                  extractorOrCombinerType: "combinerOneToMany",
                  parentName: "Book",
                  parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
                  objectReference: "author",
                  AttributeOfListObjectToCompareToReferenceUuid: "author",
                },
              },
            },
          }
        }, applicationDeploymentMap);
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) => {
        const result = ignorePostgresExtraAttributesOnList(
          (a as any).returnedDomainElement.booksOfAuthor.sort((a: any, b: any) => a.name.localeCompare(b.name)),
          ["conceptLevel", "createdAt", "icon", "updatedAt", "year", "ISBN"],
        );
        return result;
      },
      undefined, // name to give to result
      undefined,
      ignorePostgresExtraAttributesOnList([
        {
          author: "ce7b601d-be5f-4bc6-a5af-14091594046a",
          conceptLevel: "Data",
          name: "Le Pain et le Cirque",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          publisher: "516a7366-39e7-4998-82cb-80199a7fa667",
          uuid: "c6852e89-3c3c-447f-b827-4b5b9d830975",
        },
        {
          author: "ce7b601d-be5f-4bc6-a5af-14091594046a",
          conceptLevel: "Data",
          name: "Et dans l'éternité je ne m'ennuierai pas",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          publisher: "516a7366-39e7-4998-82cb-80199a7fa667",
          uuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
          year: 2014,
        } as any,
      ].sort((a, b) => a.name.localeCompare(b.name)), ["conceptLevel", "createdAt", "icon", "updatedAt", "year", "ISBN"])
    );
  });

  // ################################################################################################
  it("select first Book in Library with actionRuntimeTransformer", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction(
          {
            actionType: "runBoxedQueryAction",
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            payload: {
              application: selfApplicationLibrary.uuid,
              applicationSection: applicationSection,
              query: {
                queryType: "boxedQueryWithExtractorCombinerTransformer",
                application: selfApplicationLibrary.uuid,
                runAsSql,
                extractors: {
                  books: {
                    extractorOrCombinerType: "extractorInstancesByEntity",
                    applicationSection: applicationSection,
                    parentName: "Book",
                    parentUuid: entityBook.uuid,
                  },
                },
                runtimeTransformers: {
                  firstBook: {
                    transformerType: "pickFromList",
                    interpolation: "runtime",
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referenceName: "books",
                    },
                    index: 0,
                    orderBy: "name",
                  },
                },
              },
            },
          },
          applicationDeploymentMap
        );
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) =>
        ignorePostgresExtraAttributesOnObject((a as any).returnedDomainElement.firstBook, [
          "conceptLevel",
          "createdAt",
          "icon",
          "updatedAt",
          "year",
          "ISBN",
        ]),
      undefined, // name to give to result
      undefined,
      // [
      ignorePostgresExtraAttributesOnObject(book1 as any, [
        "conceptLevel",
        "createdAt",
        "icon",
        "updatedAt",
        "year",
        "ISBN",
      ]),
      // { author: "4441169e-0c22-4fbc-81b2-28c87cf48ab2" },
      // { author: "ce7b601d-be5f-4bc6-a5af-14091594046a" },
      // { author: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17" },
      // { author: "e4376314-d197-457c-aa5e-d2da5f8d5977" },
      // ]
    );
  });

  // // ################################################################################################
  // it("get Book and foreign key author and return transformed result", async () => {
  //   await chainVitestSteps(
  //     "ExtractorPersistenceStoreRunner_selectEntityInstance_selectObjectByDirectReference",
  //     {},
  //     async () => {
  //       console.log("#######################################################################################################");
  //       const applicationSection:ApplicationSection = "data";

  //       const queryResult: Action2ReturnType =
  //         await localAppPersistenceStoreController.handleBoxedExtractorAction(
  //           {
  //             actionType: "runBoxedExtractorAction",
  //             application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  //             endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //             payload: {
  //               application: selfApplicationLibrary.uuid,
  //               // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
  //               applicationSection: applicationSection,
  //               query: {
  //                 queryType: "boxedExtractorOrCombinerReturningObject",
  //                 application: selfApplicationLibrary.uuid,
  //                 // runAsSql, // TODO: enable runAsSql for handleBoxedExtractorAction
  //                 pageParams: {},
  //                 queryParams: {},
  //                 contextResults: {},
  //                 // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
  //                 select: {
  //                   extractorOrCombinerType: "extractorByPrimaryKey",
  //                   applicationSection: applicationSection,
  //                   parentName: "Book",
  //                   parentUuid: entityBook.uuid,
  //                   instanceUuid: book1.uuid,
  //                   foreignKeysForTransformer: ["author"],
  //                   applyTransformer: {
  //                     transformerType: "createObject",
  //                     interpolation: "runtime",
  //                     definition: {
  //                       bookTitle: {
  //                         transformerType: "getFromContext",
  //                         interpolation: "runtime",
  //                         referencePath: ["referenceObject", "name"],
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //           applicationDeploymentMap,
  //           defaultLibraryModelEnvironment
  //         );
  //       console.log("queryResult", JSON.stringify(queryResult, null, 2));
  //       return queryResult;
  //     },
  //     (a) => ignorePostgresExtraAttributesOnObject((a as any).returnedDomainElement, []),
  //     // undefined, // expected result transformation
  //     undefined, // name to give to result
  //     undefined,
  //     { "bookTitle": "Et dans l'éternité je ne m'ennuierai pas"}
  //     // book1
  //   );
  // });


  // // ################################################################################################
  // TODO: fix template action types
  // it("build custom object with actionRuntimeTransformer using createObjectFromPairs", async () => {
  //   await chainVitestSteps(
  //     "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
  //     {},
  //     async () => {
  //       const applicationSection: ApplicationSection = "data";
  //       const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction({
  //         actionType: "runBoxedQueryAction",
  //         // actionName: "runQuery",
  //         application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  //         deploymentUuid: deployment_Library_DO_NO_USE.uuid,
  //         endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //         payload: {
  //           applicationSection: applicationSection,
  //           query: {
  //             queryType: "boxedQueryWithExtractorCombinerTransformer",
  //             runAsSql,
  //             pageParams: {},
  //             queryParams: {},
  //             contextResults: {},
  //             deploymentUuid: deployment_Library_DO_NO_USE.uuid,
  //             extractors: {
  //               book: {
  //                 extractorOrCombinerType: "extractorByPrimaryKey",
  //                 applicationSection: applicationSection,
  //                 parentName: "Book",
  //                 parentUuid: entityBook.uuid,
  //                 instanceUuid: book2.uuid,
  //               },
  //             },
  //             runtimeTransformers: {
  //               newBook: {
  //                 transformerType: "createObjectFromPairs",
  //                 interpolation: "runtime",
  //                 applyTo: {
  //                   transformerType: "getFromContext",
  //                   interpolation: "runtime",
  //                   referenceName: "book",
  //                 },
  //                 referenceToOuterObject: "book",
  //                 definition: [
  //                   {
  //                     attributeKey: {
  //                       interpolation: "runtime",
  //           transformerType: "returnValue",
  //           mlSchema: { type: "string" },
  //                       value: "uuid",
  //                     },
  //                     attributeValue: {
  //                       interpolation: "runtime",
  //                       transformerType: "generateUuid",
  //                     },
  //                   },
  //                   {
  //                     attributeKey: {
  //                       interpolation: "runtime",
  //           transformerType: "returnValue",
  //           mlSchema: { type: "string" },
  //                       value: "name",
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
  //         }
  //       });
  //       console.log(expect.getState().currentTestName, "queryResult", JSON.stringify(queryResult, null, 2));
  //       return queryResult;
  //     },
  //     (a) => ignorePostgresExtraAttributes((a as any).returnedDomainElement.newBook, ["uuid"]),
  //     undefined, // name to give to result
  //     undefined,
  //       {
  //         name: book2.name,
  //       },
  //   );
  // });
  
});
