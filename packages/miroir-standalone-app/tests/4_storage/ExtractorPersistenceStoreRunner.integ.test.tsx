import { describe } from 'vitest';

import {
  type Action2ReturnType,
  ApplicationSection,
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
  deployment_Library_DO_NO_USE,
} from "miroir-test-app_deployment-admin";


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
  ConfigurationService,
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
miroirMongoDbStoreSectionStartup();
miroirPostgresStoreSectionStartup();
ConfigurationService.registerTestImplementation({expect: expect as any});

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

const miroirtDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[deployment_Miroir.uuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Miroir.uuid];

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

const typedAdminConfigurationDeploymentLibrary:AdminApplicationDeploymentConfiguration = deployment_Library_DO_NO_USE as any;

const applicationDeploymentMap: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
};

console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

export const libraryEntitiesAndInstances: ApplicationEntitiesAndInstances = [
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
    miroirContext = localmiroirContext;


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
          // deployment: selfApplicationDeploymentLibrary,
          applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
          // applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationLibrary,
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
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
              payload: {
                application: selfApplicationLibrary.uuid,
                applicationSection: applicationSection,
                query: {
                  queryType: "boxedQueryWithExtractorCombinerTransformer",
                  application: selfApplicationLibrary.uuid,
                  runAsSql,
                  pageParams: {},
                  queryParams: {},
                  contextResults: {},
                  extractors: {
                    entities: {
                      extractorOrCombinerType: "extractorByEntityReturningObjectList",
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
          name: "MlSchema",
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
        "e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd": {
          conceptLevel: "Model",
          description:
            "A Runner, view component responsible for executing Actions defined in an Endpoint",
          name: "Runner",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          uuid: "e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd",
        },
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
          selfApplication: "21840247-b5b1-4344-baec-f818f4797d92",
          conceptLevel: "Model",
          description: "A Query",
        },
      }).sort((a, b) => a.name.localeCompare(b.name))
    );
  });

  // ################################################################################################
  it("get Entity Entity from Miroir", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_selectEntityInstance_selectObjectByDirectReference",
      {},
      async () => {
        console.log("#######################################################################################################");
        const applicationSection:ApplicationSection = "model";

        const queryResult: Action2ReturnType =
          await localMiroirPersistenceStoreController.handleBoxedExtractorAction(
            {
              actionType: "runBoxedExtractorAction",
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
              payload: {
                application: selfApplicationMiroir.uuid,
                applicationSection: applicationSection,
                query: {
                  queryType: "boxedExtractorOrCombinerReturningObject",
                  application: selfApplicationMiroir.uuid,
                  pageParams: {},
                  queryParams: {},
                  contextResults: {},
                  select: {
                    extractorOrCombinerType: "extractorForObjectByDirectReference",
                    applicationSection: "model",
                    parentName: "Entity",
                    parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                    instanceUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                  },
                },
              },
            },
            applicationDeploymentMap
          );
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) => ignorePostgresExtraAttributesOnObject((a as any).returnedDomainElement, ["author", "storageAccess"]),
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
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
              payload: {
                application: selfApplicationLibrary.uuid,
                applicationSection: applicationSection,
                query: {
                  queryType: "boxedQueryWithExtractorCombinerTransformer",
                  application: selfApplicationLibrary.uuid,
                  runAsSql,
                  pageParams: {},
                  queryParams: {},
                  contextResults: {},
                  extractors: {
                    entities: {
                      extractorOrCombinerType: "extractorByEntityReturningObjectList",
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
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
              payload: {
                application: selfApplicationLibrary.uuid,
                // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
                applicationSection: applicationSection,
                query: {
                  queryType: "boxedQueryWithExtractorCombinerTransformer",
                  application: selfApplicationLibrary.uuid,
                  // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
                  runAsSql,
                  pageParams: {},
                  queryParams: {},
                  contextResults: {},
                  extractors: {
                    menus: {
                      extractorOrCombinerType: "extractorByEntityReturningObjectList",
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
      Object.values({
        "dd168e5a-2a21-4d2d-a443-032c6d15eb22": {
          uuid: "dd168e5a-2a21-4d2d-a443-032c6d15eb22",
          parentName: "Menu",
          parentUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
          // parentDefinitionVersionUuid: null,
          name: "LibraryMenu",
          defaultLabel: "Library Menu",
          description: "This is the default menu allowing to explore the Library SelfApplication.",
          definition: {
            menuType: "complexMenu",
            definition: [
              {
                title: "Library",
                label: "library",
                items: [
                  {
                    label: "Library Application",
                    section: "model",
                    selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
                    reportUuid: "cd24df86-204c-4a72-9ac0-87f2b92f25fe",
                    icon: "category",
                    menuItemScope: "model",
                    instanceUuid: "5af03c98-fe5e-490b-b08f-e1230971c57f",
                  },
                  {
                    label: "Library Entities",
                    section: "model",
                    selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
                    reportUuid: "c9ea3359-690c-4620-9603-b5b402e4a2b9",
                    icon: "category",
                    menuItemScope: "model",
                  },
                  {
                    label: "Library Entity Definitions",
                    section: "model",
                    selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
                    reportUuid: "f9aff35d-8636-4519-8361-c7648e0ddc68",
                    icon: "category",
                    menuItemScope: "model",
                  },
                  {
                    label: "Library Queries",
                    section: "model",
                    selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
                    reportUuid: "32e52150-ac95-4d96-91b7-f231b85fe76e",
                    icon: "saved_search",
                    menuItemScope: "model",
                  },
                  {
                    label: "Library Reports",
                    section: "model",
                    selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
                    reportUuid: "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855",
                    icon: "newspaper",
                    menuItemScope: "model",
                  },
                  {
                    label: "Library Menus",
                    section: "model",
                    selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
                    reportUuid: "ecfd8787-09cc-417d-8d2c-173633c9f998",
                    icon: "list",
                    menuItemScope: "model",
                  },
                  {
                    label: "Library Endpoints",
                    section: "model",
                    selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
                    reportUuid: "ace3d5c9-b6a7-43e6-a277-595329e7532a",
                    icon: "list",
                    menuItemScope: "model",
                  },
                  {
                    label: "Library Runners",
                    section: "model",
                    selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
                    reportUuid: "3c26c31e-c988-40b2-af47-d7380e35ba80",
                    icon: "directions_run",
                  },
                  {
                    label: "Library Books",
                    section: "data",
                    selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
                    reportUuid: "74b010b6-afee-44e7-8590-5f0849e4a5c9",
                    icon: "auto_stories",
                  },
                  {
                    label: "Library Authors",
                    section: "data",
                    selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
                    reportUuid: "66a09068-52c3-48bc-b8dd-76575bbc8e72",
                    icon: "star",
                  },
                  {
                    label: "Library Publishers",
                    section: "data",
                    selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
                    reportUuid: "a77aa662-006d-46cd-9176-01f02a1a12dc",
                    icon: "account_balance",
                  },
                  {
                    label: "Library countries",
                    section: "data",
                    selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
                    reportUuid: "08176cc7-43ae-4fca-91b7-bf869d19e4b9",
                    icon: "flag",
                  },
                  {
                    label: "Library Users",
                    section: "data",
                    selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
                    reportUuid: "3df9413d-5050-4357-910c-f764aacae7e6",
                    icon: "person",
                  },
                  {
                    label: "Library Lending History",
                    section: "data",
                    selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
                    reportUuid: "cee26a1e-be58-497c-9d15-fa6832787907",
                    icon: "history",
                  },
                ],
              },
            ],
          },
          // createdAt: "2025-12-30T17:23:52.026Z",
          // updatedAt: "2025-12-30T17:23:52.026Z",
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
        const queryResult = await localMiroirPersistenceStoreController.handleBoxedQueryAction(
          {
            actionType: "runBoxedQueryAction",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            payload: {
              application: selfApplicationLibrary.uuid,
              applicationSection: applicationSection,
              query: {
                queryType: "boxedQueryWithExtractorCombinerTransformer",
                application: selfApplicationLibrary.uuid,
                runAsSql,
                pageParams: {},
                queryParams: {},
                contextResults: {},
                extractors: {
                  entities: {
                    extractorOrCombinerType: "extractorByEntityReturningObjectList",
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
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            payload: {
              application: selfApplicationLibrary.uuid,
              // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
              applicationSection: applicationSection,
              query: {
                application: selfApplicationLibrary.uuid,
                queryType: "boxedQueryWithExtractorCombinerTransformer",
                runAsSql,
                pageParams: {},
                queryParams: {},
                contextResults: {},
                // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
                extractors: {
                  books: {
                    extractorOrCombinerType: "extractorByEntityReturningObjectList",
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
                    // referencedTransformer: "books",
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
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          payload: {
            application: selfApplicationLibrary.uuid,
            // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
            applicationSection: applicationSection,
            query: {
              application: selfApplicationLibrary.uuid,
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              runAsSql,
              pageParams: {},
              queryParams: {},
              contextResults: {},
              // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
              extractors: {
                books: {
                  extractorOrCombinerType: "extractorByEntityReturningObjectList",
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
                  // referencedTransformer: "books",
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
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            payload: {
              application: selfApplicationLibrary.uuid,
              // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
              applicationSection: applicationSection,
              query: {
                application: selfApplicationLibrary.uuid,
                queryType: "boxedQueryWithExtractorCombinerTransformer",
                runAsSql,
                pageParams: {},
                queryParams: {},
                contextResults: {},
                // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
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
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referenceName: "books",
                    },
                    transformerType: "aggregate",
                    interpolation: "runtime",
                    groupBy: "author",
                    // orderBy: "author",
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
      // (a) => (a as any).returnedDomainElement.countBooksByAuthors,
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
  it("select publisher of book: combinerForObjectByRelation combiner", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction(
          {
            actionType: "runBoxedQueryAction",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            payload: {
              application: selfApplicationLibrary.uuid,
              // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
              applicationSection: applicationSection,
              query: {
                application: selfApplicationLibrary.uuid,
                queryType: "boxedQueryWithExtractorCombinerTransformer",
                runAsSql,
                pageParams: {},
                queryParams: {},
                contextResults: {},
                // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
                extractors: {
                  book: {
                    extractorOrCombinerType: "extractorForObjectByDirectReference",
                    applicationSection: applicationSection,
                    parentName: "Book",
                    parentUuid: entityBook.uuid,
                    instanceUuid: book2.uuid,
                  },
                },
                combiners: {
                  publisher: {
                    extractorOrCombinerType: "combinerForObjectByRelation",
                    parentName: "Publisher",
                    parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
                    objectReference: "book",
                    // objectReference: {
                    //   transformerType: "getFromContext"
                    //   referenceName: "book"
                    // },
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
  it("select Books of Author: combinerByRelationReturningObjectList combiner", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult = await localAppPersistenceStoreController.handleBoxedQueryAction(
          {
            actionType: "runBoxedQueryAction",
            // actionName: "runQuery",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            payload: {
              application: selfApplicationLibrary.uuid,
              applicationSection: applicationSection,
              query: {
                queryType: "boxedQueryWithExtractorCombinerTransformer",
                // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
                application: selfApplicationLibrary.uuid,
                runAsSql,
                pageParams: {},
                queryParams: {},
                contextResults: {},
                // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
                extractors: {
                  author: {
                    extractorOrCombinerType: "extractorForObjectByDirectReference",
                    applicationSection: applicationSection,
                    parentName: entityAuthor.name,
                    parentUuid: entityAuthor.uuid,
                    instanceUuid: author2.uuid,
                  },
                },
                combiners: {
                  booksOfAuthor: {
                    //join with only returnValue references
                    extractorOrCombinerType: "combinerByRelationReturningObjectList",
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
  //                 extractorOrCombinerType: "extractorByEntityReturningObjectList",
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
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          payload: {
            application: selfApplicationLibrary.uuid,
            // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
            applicationSection: applicationSection,
            query: {
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              application: selfApplicationLibrary.uuid,
              runAsSql,
              pageParams: {},
              queryParams: {
                // instanceUuid: "c6852e89-3c3c-447f-b827-4b5b9d830975",
              },
              contextResults: {},
              // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
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
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            payload: {
              application: selfApplicationLibrary.uuid,
              // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
              applicationSection: applicationSection,
              query: {
                queryType: "boxedQueryWithExtractorCombinerTransformer",
                application: selfApplicationLibrary.uuid,
                runAsSql,
                pageParams: {},
                queryParams: {},
                contextResults: {},
                // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
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
                    transformerType: "pickFromList",
                    interpolation: "runtime",
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referenceName: "books",
                    },
                    // referencedTransformer: "books",
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
  //                   extractorOrCombinerType: "extractorForObjectByDirectReference",
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
  //                 extractorOrCombinerType: "extractorForObjectByDirectReference",
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
