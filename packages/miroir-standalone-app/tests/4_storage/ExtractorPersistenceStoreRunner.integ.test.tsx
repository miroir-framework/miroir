import { describe } from 'vitest';

// import { miroirFileSystemStoreSectionStartup } from "../dist/bundle";
import {
  Action2ReturnType,
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
  DomainControllerInterface,
  entityAuthor,
  entityBook,
  EntityDefinition,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionPublisher,
  entityEndpointVersion,
  entityEntity,
  entityEntityDefinition,
  EntityInstance,
  entityMenu,
  entityPublisher,
  entityReport,
  entityStoreBasedConfiguration,
  ignorePostgresExtraAttributesOnObject,
  LoggerInterface,
  MetaEntity,
  MiroirConfigClient,
  MiroirLoggerFactory,
  PersistenceStoreControllerInterface,
  publisher1,
  publisher2,
  publisher3,
  resetAndInitApplicationDeployment,
  SelfApplicationDeploymentConfiguration,
  selfApplicationLibrary,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationStoreBasedConfigurationLibrary,
  selfApplicationVersionLibraryInitialVersion,
  StoreUnitConfiguration
} from "miroir-core";


import {
  ConfigurationService,
  defaultMiroirMetaModel,
  ignorePostgresExtraAttributesOnList,
  MiroirContext,
  PersistenceStoreControllerManagerInterface,
  selfApplicationDeploymentLibrary,
  selfApplicationDeploymentMiroir,
} from "miroir-core";
import { AdminApplicationDeploymentConfiguration } from 'miroir-core/src/0_interfaces/1_core/StorageConfiguration.js';
import { LoggerOptions } from 'miroir-core/src/0_interfaces/4-services/LoggerInterface.js';
import { miroirCoreStartup } from 'miroir-core/src/startup.js';
import { LocalCache } from 'miroir-localcache-redux';
import { miroirFileSystemStoreSectionStartup } from 'miroir-store-filesystem';
import { miroirIndexedDbStoreSectionStartup } from 'miroir-store-indexedDb';
import { miroirPostgresStoreSectionStartup } from 'miroir-store-postgres';
import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { miroirAppStartup } from '../../src/startup.js';
import { cleanLevel, packageName } from '../3_controllers/constants.js';
import { ApplicationEntitiesAndInstances } from '../utils/tests-utils-testOnLibrary.js';
import {
  chainVitestSteps,
  createDeploymentCompositeAction,
  createMiroirDeploymentGetPersistenceStoreController,
  deleteAndCloseApplicationDeployments,
  deploymentConfigurations,
  loadTestConfigFiles,
  resetAndinitializeDeploymentCompositeAction,
  resetApplicationDeployments,
  selfApplicationDeploymentConfigurations,
  setupMiroirTest
} from "../utils/tests-utils.js";

let domainController: DomainControllerInterface;
let localCache: LocalCache;
let localMiroirPersistenceStoreController: PersistenceStoreControllerInterface;
let localAppPersistenceStoreController: PersistenceStoreControllerInterface;
let miroirContext: MiroirContext;
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;

const env:any = (import.meta as any).env
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
miroirFileSystemStoreSectionStartup();
miroirIndexedDbStoreSectionStartup();
miroirPostgresStoreSectionStartup();
ConfigurationService.registerTestImplementation({expect: expect as any});

// const {miroirConfig: miroirConfigParam, logConfig:loggerOptionsParam} = await loadTestConfigFiles(env)
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

const testApplicationDeploymentUuid = adminConfigurationDeploymentLibrary.uuid;
const libraryDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[testApplicationDeploymentUuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[testApplicationDeploymentUuid];

const typedAdminConfigurationDeploymentLibrary:AdminApplicationDeploymentConfiguration = adminConfigurationDeploymentLibrary as any;
  
console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

export const libraryEntitiesAndInstances: ApplicationEntitiesAndInstances  = [
  {
    entity: entityAuthor as MetaEntity,
    entityDefinition: entityDefinitionAuthor as EntityDefinition,
    instances: [author1, author2, author3 as EntityInstance],
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
    ],
  },
  {
    entity: entityPublisher as MetaEntity,
    entityDefinition: entityDefinitionPublisher as EntityDefinition,
    instances: [publisher1 as EntityInstance, publisher2 as EntityInstance, publisher3 as EntityInstance],
  },
];

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
    miroirContext = localmiroirContext;


    const wrapped = await createMiroirDeploymentGetPersistenceStoreController(
      miroirConfig as MiroirConfigClient,
      persistenceStoreControllerManager,
      domainController
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
    const createLibraryDeploymentAction = createDeploymentCompositeAction(adminConfigurationDeploymentLibrary.uuid, libraryDeploymentStorageConfiguration);
    const result = await domainController.handleCompositeAction(createLibraryDeploymentAction, defaultMiroirMetaModel);

    if (result.status !== "ok") {
      throw new Error("beforeAll failed createLibraryDeploymentAction!");
    }

    const tmplocalAppPersistenceStoreController = persistenceStoreControllerManager.getPersistenceStoreController(
      adminConfigurationDeploymentLibrary.uuid
    );
    if (!tmplocalAppPersistenceStoreController) {
      throw new Error("beforeAll failed localAppPersistenceStoreController initialization!");
    }
    localAppPersistenceStoreController = tmplocalAppPersistenceStoreController;

    return Promise.resolve();
  }
)

// ################################################################################################
beforeEach(
  async  () => {
    await resetAndInitApplicationDeployment(domainController, selfApplicationDeploymentConfigurations);
    const initResult:Action2ReturnType = await domainController.handleCompositeAction(
      resetAndinitializeDeploymentCompositeAction(
        adminConfigurationDeploymentLibrary.uuid,
        {
          dataStoreType: "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
          metaModel: defaultMiroirMetaModel,
          selfApplication: selfApplicationLibrary,
          // selfApplicationDeploymentConfiguration: selfApplicationDeploymentLibrary,
          applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
          // applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationLibrary,
          applicationVersion: selfApplicationVersionLibraryInitialVersion,
        },
        libraryEntitiesAndInstances
      ),
      // testOnLibrary_resetInitAndAddTestDataToLibraryDeployment(miroirConfig, libraryEntitiesAndInstances),
      {},
      defaultMiroirMetaModel
    );
    if (initResult.status !== "ok") {
      throw new Error("beforeEach failed initialization!");
    }
    document.body.innerHTML = '';
    console.log("beforeEach done");
  }
)

// ################################################################################################
afterEach(
  async () => {
    await resetApplicationDeployments(
      deploymentConfigurations,
      domainController,
      localCache,
    );
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
        adminConfigurationDeploymentMiroir as AdminApplicationDeploymentConfiguration,
      ]
    );
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done deleteAndCloseApplicationDeployments")
  }
)


// ##############################################################################################
// ##############################################################################################
// ##############################################################################################

// TODO: duplicate test with ExtractorTemplatePersistenceStoreRunner.integ.test.tsx
describe.sequential("ExtractorOrQueryPersistenceStoreRunner.integ.test", () => {

  // ################################################################################################
  it("get Entity Entity from Miroir", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_selectEntityInstance_selectObjectByDirectReference",
      {},
      async () => {
        console.log("#######################################################################################################");
        console.log("#######################################################################################################");
        console.log("#######################################################################################################");
        console.log("#######################################################################################################");
        console.log("#######################################################################################################");
        console.log("#######################################################################################################");
        const applicationSection:ApplicationSection = "model";

        const queryResult:Action2ReturnType = await localMiroirPersistenceStoreController.handleBoxedExtractorAction(
          {
            actionType: "runBoxedExtractorAction",
            actionName: "runQuery",
            deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            applicationSection: applicationSection,
            query: {
              queryType: "boxedExtractorOrCombinerReturningObject",
              pageParams: {},
              queryParams: {},
              contextResults: {},
              deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
              select: {
                extractorOrCombinerType: "extractorForObjectByDirectReference",
                applicationSection: "model",
                parentName: "Entity",
                parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                instanceUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
              },
            },
          }
        );
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) => ignorePostgresExtraAttributesOnObject((a as any).returnedDomainElement, ["author"]),
      // undefined, // expected result transformation
      undefined, // name to give to result
      undefined,
      {
        uuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
        parentName: "Entity",
        parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
        parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
        name: "Entity",
        selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        conceptLevel: "MetaModel",
        description: "The Metaclass for entities.",
      }
    );
  });

  // ################################################################################################
  it("get Miroir Entities", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_getMiroirEntities",
      {},
      async () => {
        const applicationSection: ApplicationSection = "model";
        const queryResult: Action2ReturnType = await localMiroirPersistenceStoreController.handleBoxedQueryAction({
          actionType: "runBoxedQueryAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractors: {
              entities: {
                extractorOrCombinerType: "extractorByEntityReturningObjectList",
                applicationSection: applicationSection,
                parentName: "Entity",
                parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",

              },
            },
          },
        });
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult; // == "ok" ? queryResult : {status: "error", error: queryResult.error};
      },
      // (a) => ignorePostgresExtraAttributesOnRecord((a as any).returnedDomainElement.entities, ["author"]),
      (a) => ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.entities.sort((a: any,b: any) => a.name.localeCompare(b.name)), ["author"]),
      // (a) => (a as any).returnedDomainElement.entities,
      // undefined, // expected result transformation
      undefined, // name to give to result
      undefined,
      Object.values({
        "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad": {
          uuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          name: "Entity",
          selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "MetaModel",
          description: "The Metaclass for entities.",
        },
        "3d8da4d4-8f76-4bb4-9212-14869d81c00c": {
          uuid: "3d8da4d4-8f76-4bb4-9212-14869d81c00c",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          name: "Endpoint",
          selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "An Endpoint, servicing Actions that are part of a Domain Specific Language",
        },
        "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916": {
          uuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          name: "Report",
          selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "Report, allowing to display model instances",
        },
        "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd": {
          uuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          name: "EntityDefinition",
          selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "MetaModel",
          description: "The Metaclass for the definition of entities.",
        },
        "5e81e1b9-38be-487c-b3e5-53796c57fccf": {
          uuid: "5e81e1b9-38be-487c-b3e5-53796c57fccf",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          name: "JzodSchema",
          selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "Common Jzod Schema definitions, available to all Entity definitions",
        },
        // "7990c0c9-86c3-40a1-a121-036c91b55ed7": {
        //   uuid: "7990c0c9-86c3-40a1-a121-036c91b55ed7",
        //   parentName: "Entity",
        //   parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
        //   parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
        //   name: "StoreBasedConfiguration",
        //   selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        //   conceptLevel: "Model",
        //   description: "A configuration of storage-related aspects of a Model.",
        // },
        "a659d350-dd97-4da9-91de-524fa01745dc": {
          uuid: "a659d350-dd97-4da9-91de-524fa01745dc",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          name: "SelfApplication",
          selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "Self SelfApplication",
        },
        "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24": {
          uuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          name: "SelfApplicationVersion",
          selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "A Version of the Self SelfApplication",
        },
        "cdb0aec6-b848-43ac-a058-fe2dbe5811f1": {
          uuid: "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          name: "ApplicationModelBranch",
          selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "A Branch of an SelfApplication Model",
        },
        "dde4c883-ae6d-47c3-b6df-26bc6e3c1842": {
          uuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          name: "Menu",
          selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "Menu, allowing to display elements useful to navigate the selfApplication",
        },
        "e4320b9e-ab45-4abe-85d8-359604b3c62f": {
          uuid: "e4320b9e-ab45-4abe-85d8-359604b3c62f",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          name: "Query",
          selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "A Query",
        },
      }).sort((a,b) => a.name.localeCompare(b.name))
    );
  });
  
  // ################################################################################################
  it("get Library Entities", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_getLibraryEntities",
      {},
      async () => {
        const applicationSection: ApplicationSection = "model";
        const queryResult: Action2ReturnType = await localAppPersistenceStoreController.handleBoxedQueryAction({
          actionType: "runBoxedQueryAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractors: {
              entities: {
                extractorOrCombinerType: "extractorByEntityReturningObjectList",
                applicationSection: applicationSection,
                parentName: entityEntity.name,
                parentUuid: entityEntity.uuid,
              },
            },
          },
        });
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult; // == "ok" ? queryResult : {status: "error", error: queryResult.error};
      },
      (a) =>
        ignorePostgresExtraAttributesOnList(
          (a as any).returnedDomainElement.entities.sort((a: any, b: any) => a.name.localeCompare(b.name)),
          ["author"]
        ),
      // (a) => (a as any).returnedDomainElement.entities,
      // undefined, // expected result transformation
      undefined, // name to give to result
      undefined,
      [entityAuthor, entityBook, entityPublisher].sort((a, b) => a.name.localeCompare(b.name))
    );
  });
  
  // ################################################################################################
  it("get Library Menus", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_getMenus",
      {},
      async () => {
        const applicationSection: ApplicationSection = "model";
        const queryResult: Action2ReturnType = await localAppPersistenceStoreController.handleBoxedQueryAction({
          actionType: "runBoxedQueryAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractors: {
              menus: {
                extractorOrCombinerType: "extractorByEntityReturningObjectList",
                applicationSection: applicationSection,
                parentName: "Menu",
                parentUuid: entityMenu.uuid,
              },
            },
          },
        });
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult; // == "ok" ? queryResult : {status: "error", error: queryResult.error};
      },
      // (a) => ignorePostgresExtraAttributesOnRecord((a as any).returnedDomainElement.entities, ["author"]),
      (a) => ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.menus, ["author", "parentDefinitionVersionUuid"]),
      // (a) => (a as any).returnedDomainElement.entities,
      // undefined, // expected result transformation
      undefined, // name to give to result
      undefined,
      Object.values({
        "dd168e5a-2a21-4d2d-a443-032c6d15eb22": {
          uuid: "dd168e5a-2a21-4d2d-a443-032c6d15eb22",
          parentName: "Menu",
          parentUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
          name: "LibraryMenu",
          defaultLabel: "Meta-Model",
          description: "This is the default menu allowing to explore the Library SelfApplication.",
          definition: {
            menuType: "complexMenu",
            definition: [
              {
                title: "Library",
                label: "library",
                items: [
                  {
                    label: "Library Entities",
                    section: "model",
                    selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                    reportUuid: "c9ea3359-690c-4620-9603-b5b402e4a2b9",
                    icon: "category",
                  },
                  {
                    label: "Library Entity Definitions",
                    section: "model",
                    selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                    reportUuid: "f9aff35d-8636-4519-8361-c7648e0ddc68",
                    icon: "category",
                  },
                  {
                    label: "Library Reports",
                    section: "model",
                    selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                    reportUuid: "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855",
                    icon: "list",
                  },
                  {
                    label: "Library Books",
                    section: "data",
                    selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                    reportUuid: "74b010b6-afee-44e7-8590-5f0849e4a5c9",
                    icon: "auto_stories",
                  },
                  {
                    label: "Library Authors",
                    section: "data",
                    selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                    reportUuid: "66a09068-52c3-48bc-b8dd-76575bbc8e72",
                    icon: "star",
                  },
                  {
                    label: "Library Publishers",
                    section: "data",
                    selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                    reportUuid: "a77aa662-006d-46cd-9176-01f02a1a12dc",
                    icon: "account_balance",
                  },
                  {
                    label: "Library countries",
                    section: "data",
                    selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                    reportUuid: "08176cc7-43ae-4fca-91b7-bf869d19e4b9",
                    icon: "flag",
                  },
                  {
                    label: "Library Users",
                    section: "data",
                    selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                    reportUuid: "3df9413d-5050-4357-910c-f764aacae7e6",
                    icon: "person",
                  },
                ],
              },
            ],
          },
        },
      })
    );
  });

  // ################################################################################################
  it("get Filtered Entity Entity from Miroir", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_selectObjectListByEntity_filtered",
      {},
      async () => {
        const applicationSection: ApplicationSection = "model";
        const queryResult = await localMiroirPersistenceStoreController.handleBoxedQueryAction({
          actionType: "runBoxedQueryAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractors: {
              entities: {
                extractorOrCombinerType: "extractorByEntityReturningObjectList",
                applicationSection: applicationSection,
                parentName: "Entity",
                parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                filter: {
                  attributeName: "name",
                  // value: "or",
                  value: "en",
                },
              },
            },
          },
        });
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) =>
        ignorePostgresExtraAttributesOnList(
          (a as any).returnedDomainElement.entities.sort((a: any, b: any) => a.name.localeCompare(b.name)),
          ["author"]
        ),
      undefined, // name to give to result
      undefined,
      [entityEndpointVersion, entityEntity, entityEntityDefinition, entityMenu].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );
  });
  
  // ################################################################################################
  it("get Unique Authors from Books in Library with actionRuntimeTransformer", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction({
          actionType: "runBoxedQueryAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractors: {
              books: {
                extractorOrCombinerType: "extractorByEntityReturningObjectList",
                applicationSection: applicationSection,
                parentName: "Book",
                parentUuid: entityBook.uuid,
              },
            },
            runtimeTransformers: {
              uniqueAuthors: {
                transformerType: "unique",
                interpolation: "runtime",
                referencedTransformer: "books",
                attribute: "author",
                orderBy: "author",
              },
            },
          },
        });
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) => (a as any).returnedDomainElement.uniqueAuthors,
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
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractors: {
              books: {
                extractorOrCombinerType: "extractorByEntityReturningObjectList",
                applicationSection: applicationSection,
                parentName: "Book",
                parentUuid: entityBook.uuid,
              },
            },
            runtimeTransformers: {
              uniqueAuthors: {
                interpolation: "runtime",
                transformerType: "count",
                referencedTransformer: "books",
              },
            },
          },
        });
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      // (a) => (a as any).returnedDomainElement.uniqueAuthors,
      (a) => (a as any).returnedDomainElement.uniqueAuthors,
      undefined, // name to give to result
      undefined,
      // 3,
      [{count: 6}],
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
        const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction({
          actionType: "runBoxedQueryAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractors: {
              books: {
                extractorOrCombinerType: "extractorByEntityReturningObjectList",
                applicationSection: applicationSection,
                parentName: "Book",
                parentUuid: entityBook.uuid,
              },
            },
            runtimeTransformers: {
              countBooksByAuthors: {
                referencedTransformer: "books",
                transformerType: "count",
                interpolation: "runtime",
                groupBy: "author",
                orderBy: "author",
              },
            },
          },
        });
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      // (a) => (a as any).returnedDomainElement.countBooksByAuthors,
      (a) => (a as any).returnedDomainElement.countBooksByAuthors,
      undefined, // name to give to result
      undefined,
      [
        { author: "4441169e-0c22-4fbc-81b2-28c87cf48ab2", count: 1 },
        { author: "ce7b601d-be5f-4bc6-a5af-14091594046a", count: 2 },
        { author: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17", count: 2 },
        { author: "e4376314-d197-457c-aa5e-d2da5f8d5977", count: 1 },
      ]
    );
  });
  
  // ################################################################################################
  it("build custom object with actionRuntimeTransformer using object_fullTemplate", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction({
          actionType: "runBoxedQueryAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractors: {
              book: {
                extractorOrCombinerType: "extractorForObjectByDirectReference",
                applicationSection: applicationSection,
                parentName: "Book",
                parentUuid: entityBook.uuid,
                instanceUuid: book2.uuid,
              },
            },
            runtimeTransformers: {
              newBook: {
                transformerType: "object_fullTemplate",
                interpolation: "runtime",
                referencedTransformer: "book",
                definition: [
                  {
                    attributeKey: {
                      interpolation: "runtime",
                      transformerType: "constantString",
                      constantStringValue: "uuid",
                    },
                    attributeValue: {
                      interpolation: "runtime",
                      transformerType: "newUuid",
                    },
                  },
                  {
                    attributeKey: {
                      interpolation: "runtime",
                      transformerType: "constantString",
                      constantStringValue: "name",
                    },
                    attributeValue: {
                      interpolation: "runtime",
                      transformerType: "mustacheStringTemplate",
                      definition: "{{book.name}}",
                    },
                  },
                ],
              },
            },
          },
        });
        console.log(expect.getState().currentTestName, "queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) => ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.newBook, ["uuid"]),
      undefined, // name to give to result
      undefined,
      [
        {
          name: book2.name,
        },
      ]
    );
  });

  // ################################################################################################
  it("select publisher of book: combinerForObjectByRelation combiner", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction({
          actionType: "runBoxedQueryAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractors: {
              book: {
                extractorOrCombinerType: "extractorForObjectByDirectReference",
                applicationSection: applicationSection,
                parentName: "Book",
                parentUuid: entityBook.uuid,
                instanceUuid: book2.uuid
              },
            },
            combiners: {
              publisher: {
                extractorOrCombinerType: "combinerForObjectByRelation",
                parentName: "Publisher",
                parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
                objectReference: "book",
                AttributeOfObjectToCompareToReferenceUuid: "publisher",
              },
            },
          },
        });
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
  it("select Books of Author: combinerByRelationReturningObjectList combiner", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction({
          actionType: "runBoxedQueryAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractors: {
              author: {
                extractorOrCombinerType: "extractorForObjectByDirectReference",
                applicationSection: applicationSection,
                parentName: entityAuthor.name,
                parentUuid: entityAuthor.uuid,
                instanceUuid: author2.uuid
              },
            },
            combiners: {
              booksOfAuthor: { //join with only constant references
                extractorOrCombinerType: "combinerByRelationReturningObjectList",
                parentName: entityBook.name,
                parentUuid: entityBook.uuid,
                objectReference: "author",
                AttributeOfListObjectToCompareToReferenceUuid: "author",
              },
            },
          },
        });
        console.log(expect.getState().currentTestName, "queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) =>
        ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.booksOfAuthor.sort((a: any, b: any) => a.name.localeCompare(b.name)), [
          "conceptLevel", "createdAt", "icon", "updatedAt",
        ]),
      undefined, // name to give to result
      undefined,
      ignorePostgresExtraAttributesOnList([
        book1,
        book6,
      ].sort((a, b) => a.name.localeCompare(b.name)) as any, [
        "conceptLevel", "createdAt", "icon", "updatedAt",
      ])
      
    );
  });

  // // ################################################################################################
  // // TODO: write in UTF-8 on disk / in Database!
  // // TODO: provide implementation for mapperListToList
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
  //               referencedTransformer: "books",
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
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            pageParams: {},
            queryParams: {
              // instanceUuid: "c6852e89-3c3c-447f-b827-4b5b9d830975",
            },
            contextResults: {},
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractors: {
              book: {
                extractorOrCombinerType: "extractorForObjectByDirectReference",
                parentName: "Book",
                parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
                instanceUuid: "c6852e89-3c3c-447f-b827-4b5b9d830975",
              },
            },
            combiners: {
              author: {
                extractorOrCombinerType: "combinerForObjectByRelation",
                parentName: "Author",
                parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
                objectReference: "book",
                AttributeOfObjectToCompareToReferenceUuid: "author",
              },
              booksOfAuthor: {
                extractorOrCombinerType: "combinerByRelationReturningObjectList",
                parentName: "Book",
                parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
                objectReference: "author",
                AttributeOfListObjectToCompareToReferenceUuid: "author",
              },
            },
          },
        });
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) => {
        const result = ignorePostgresExtraAttributesOnList(
          (a as any).returnedDomainElement.booksOfAuthor.sort((a: any, b: any) => a.name.localeCompare(b.name)),
        );
        return result;
      },
      undefined, // name to give to result
      undefined,
      Object.values({
        "c6852e89-3c3c-447f-b827-4b5b9d830975": {
          author: "ce7b601d-be5f-4bc6-a5af-14091594046a",
          conceptLevel: "Data",
          name: "Le Pain et le Cirque",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          publisher: "516a7366-39e7-4998-82cb-80199a7fa667",
          uuid: "c6852e89-3c3c-447f-b827-4b5b9d830975",
        },
        "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": {
          author: "ce7b601d-be5f-4bc6-a5af-14091594046a",
          conceptLevel: "Data",
          name: "Et dans l'éternité je ne m'ennuierai pas",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          publisher: "516a7366-39e7-4998-82cb-80199a7fa667",
          uuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
        },
      }).sort((a, b) => a.name.localeCompare(b.name))
    );
  });

  // ################################################################################################
  it("select first Book in Library with actionRuntimeTransformer", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction({
          actionType: "runBoxedQueryAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractors: {
              books: {
                extractorOrCombinerType: "extractorByEntityReturningObjectList",
                applicationSection: applicationSection,
                parentName: "Book",
                parentUuid: entityBook.uuid,
              },
            },
            runtimeTransformers: {
              firstBook: {
                transformerType: "listPickElement",
                interpolation: "runtime",
                referencedTransformer: "books",
                index: 0,
                orderBy: "name",
              },
            },
          },
        });
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) => ignorePostgresExtraAttributesOnObject((a as any).returnedDomainElement.firstBook),
      undefined, // name to give to result
      undefined,
      // [
        book1,
        // { author: "4441169e-0c22-4fbc-81b2-28c87cf48ab2" },
        // { author: "ce7b601d-be5f-4bc6-a5af-14091594046a" },
        // { author: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17" },
        // { author: "e4376314-d197-457c-aa5e-d2da5f8d5977" },
      // ]
    );
  });
    
  
});
