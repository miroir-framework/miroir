import { describe } from 'vitest';

// import { miroirFileSystemStoreSectionStartup } from "../dist/bundle";
import {
  adminConfigurationDeploymentMiroir,
  author1,
  author2,
  author3,
  book1,
  book2,
  book3,
  book4,
  ActionReturnType,
  adminConfigurationDeploymentLibrary,
  ApplicationSection,
  defaultLevels,
  DomainControllerInterface,
  MiroirConfigClient,
  MiroirLoggerFactory,
  PersistenceStoreControllerInterface,
  PersistenceStoreControllerManagerInterface,
  entityAuthor,
  entityBook,
  EntityDefinition,
  entityDefinitionAuthor,
  entityDefinitionBook,
  EntityInstance,
  MetaEntity,
  reportBookList,
  Report,
  book5,
  book6,
  ignorePostgresExtraAttributesOnRecord,
  ignorePostgresExtraAttributesOnList,
  ignorePostgresExtraAttributesOnObject,
  entityMenu,
  entityEntity
} from "miroir-core";


import { miroirFileSystemStoreSectionStartup } from 'miroir-store-filesystem';
import { miroirIndexedDbStoreSectionStartup } from 'miroir-store-indexedDb';
import { miroirPostgresStoreSectionStartup } from 'miroir-store-postgres';
import { setupServer } from "msw/node";
import { loglevelnext } from "../../src/loglevelnextImporter.js";
import {
  addEntitiesAndInstances,
  chainVitestSteps,
  loadTestConfigFiles,
  miroirAfterEach,
  miroirBeforeAll,
  miroirBeforeEach,
} from "../utils/tests-utils.js";
import { LocalCache } from 'miroir-localcache-redux';

let localCache: LocalCache;
let localMiroirPersistenceStoreController: PersistenceStoreControllerInterface;
let localAppPersistenceStoreController: PersistenceStoreControllerInterface;
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface | undefined;
let domainController: DomainControllerInterface;

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
    miroirFileSystemStoreSectionStartup();
    miroirIndexedDbStoreSectionStartup();
    miroirPostgresStoreSectionStartup();
    if (!miroirConfig.client.emulateServer) {
      throw new Error("LocalPersistenceStoreController state do not make sense for real server configurations! Please use only 'emulateServer: true' configurations for this test.");
    } else {
      const wrapped = await miroirBeforeAll(
        miroirConfig as MiroirConfigClient,
        setupServer,
      );
      if (wrapped) {
        if (wrapped.localMiroirPersistenceStoreController && wrapped.localAppPersistenceStoreController) {
          localCache = wrapped.localCache;
          domainController = wrapped.domainController;
          localMiroirPersistenceStoreController = wrapped.localMiroirPersistenceStoreController;
          localAppPersistenceStoreController = wrapped.localAppPersistenceStoreController;
          persistenceStoreControllerManager = wrapped.persistenceStoreControllerManager;
        }
      } else {
        throw new Error("beforeAll failed initialization!");
      }
    }

    return Promise.resolve();
  }
)

// ################################################################################################
beforeEach(
  async  () => {
    await miroirBeforeEach(miroirConfig, undefined, localMiroirPersistenceStoreController,localAppPersistenceStoreController);
    await addEntitiesAndInstances(
      localAppPersistenceStoreController,
      domainController,
      localCache,
      miroirConfig,
      adminConfigurationDeploymentLibrary,
      [
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
        }
      ],
      reportBookList as Report,
    )
  }
)

// ################################################################################################
afterEach(
  async () => {
    await miroirAfterEach(miroirConfig, undefined, localMiroirPersistenceStoreController,localAppPersistenceStoreController);
  }
)

// ################################################################################################
afterAll(
  async () => {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirAfterAll")
    try {
      await localMiroirPersistenceStoreController.close();
      await localAppPersistenceStoreController.close();
    } catch (error) {
      console.error('Error afterAll',error);
    }
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done miroirAfterAll")
  }
)


// ##############################################################################################
// ##############################################################################################
// ##############################################################################################

describe.sequential("ExtractorPersistenceStoreRunner.integ.test", () => {

  // ################################################################################################
  it("get Entity Entity from Miroir", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_selectEntityInstance_selectObjectByDirectReference",
      {},
      async () => {
        const applicationSection:ApplicationSection = "model";
        const queryResult:ActionReturnType = await localMiroirPersistenceStoreController.handleQuery(
          {
            actionType: "queryAction",
            actionName: "runQuery",
            deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            applicationSection: applicationSection,
            query: {
              queryType: "extractorForDomainModelObjects",
              pageParams: {},
              queryParams: {},
              contextResults: {},
              deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
              select: {
                queryType: "selectObjectByDirectReference",
                applicationSection: "model",
                parentName: "Entity",
                parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                // parentUuid: {
                //   transformerType: "constantUuid",
                //   constantUuidValue: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                // },
                instanceUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                // instanceUuid: {
                //   transformerType: "constantUuid",
                //   constantUuidValue: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                // },
              },
            },
          }
        );
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) => ignorePostgresExtraAttributesOnObject((a as any).returnedDomainElement.elementValue, ["author"]),
      // undefined, // expected result transformation
      undefined, // name to give to result
      "instance",
      {
        uuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
        parentName: "Entity",
        parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
        parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
        name: "Entity",
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
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
        const queryResult: ActionReturnType = await localMiroirPersistenceStoreController.handleQuery({
          actionType: "queryAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "extractorForRecordOfExtractors",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractors: {
              entities: {
                queryType: "queryExtractObjectListByEntity",
                applicationSection: applicationSection,
                parentName: "Entity",
                parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                // parentUuid: {
                //   transformerType: "constantUuid",
                //   constantUuidValue: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                // },
              },
            },
          },
        });
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult; // == "ok" ? queryResult : {status: "error", error: queryResult.error};
      },
      (a) => ignorePostgresExtraAttributesOnRecord((a as any).returnedDomainElement.elementValue.entities, ["author"]),
      // (a) => (a as any).returnedDomainElement.elementValue.entities.elementValue,
      // undefined, // expected result transformation
      undefined, // name to give to result
      "object", //"instanceUuidIndex",
      {
        "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad": {
          uuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          name: "Entity",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "MetaModel",
          description: "The Metaclass for entities.",
        },
        "35c5608a-7678-4f07-a4ec-76fc5bc35424": {
          uuid: "35c5608a-7678-4f07-a4ec-76fc5bc35424",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          name: "SelfApplicationDeploymentConfiguration",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "An Application Deployment",
        },
        "3d8da4d4-8f76-4bb4-9212-14869d81c00c": {
          uuid: "3d8da4d4-8f76-4bb4-9212-14869d81c00c",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          name: "Endpoint",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "An Endpoint, servicing Actions that are part of a Domain Specific Language",
        },
        "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916": {
          uuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          name: "Report",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "Report, allowing to display model instances",
        },
        "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd": {
          uuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          name: "EntityDefinition",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "MetaModel",
          description: "The Metaclass for the definition of entities.",
        },
        "5e81e1b9-38be-487c-b3e5-53796c57fccf": {
          uuid: "5e81e1b9-38be-487c-b3e5-53796c57fccf",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          name: "JzodSchema",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "Common Jzod Schema definitions, available to all Entity definitions",
        },
        "7990c0c9-86c3-40a1-a121-036c91b55ed7": {
          uuid: "7990c0c9-86c3-40a1-a121-036c91b55ed7",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          name: "StoreBasedConfiguration",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "A configuration of storage-related aspects of a Model.",
        },
        "a659d350-dd97-4da9-91de-524fa01745dc": {
          uuid: "a659d350-dd97-4da9-91de-524fa01745dc",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          name: "SelfApplication",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "Self Application",
        },
        "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24": {
          uuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          name: "SelfApplicationVersion",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "A Version of the Self Application",
        },
        "cdb0aec6-b848-43ac-a058-fe2dbe5811f1": {
          uuid: "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          name: "ApplicationModelBranch",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "A Branch of an Application Model",
        },
        "dde4c883-ae6d-47c3-b6df-26bc6e3c1842": {
          uuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          name: "Menu",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "Menu, allowing to display elements useful to navigate the application",
        },
        "e4320b9e-ab45-4abe-85d8-359604b3c62f": {
          uuid: "e4320b9e-ab45-4abe-85d8-359604b3c62f",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          name: "Query",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          conceptLevel: "Model",
          description: "A Query",
        },
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
        const queryResult: ActionReturnType = await localAppPersistenceStoreController.handleQuery({
          actionType: "queryAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "extractorForRecordOfExtractors",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractors: {
              entities: {
                queryType: "queryExtractObjectListByEntity",
                applicationSection: applicationSection,
                parentName: entityEntity.name,
                parentUuid: entityEntity.uuid,
                // parentUuid: {
                //   transformerType: "constantUuid",
                //   constantUuidValue: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                // },
              },
            },
          },
        });
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult; // == "ok" ? queryResult : {status: "error", error: queryResult.error};
      },
      (a) => ignorePostgresExtraAttributesOnRecord((a as any).returnedDomainElement.elementValue.entities, ["author"]),
      // (a) => (a as any).returnedDomainElement.elementValue.entities.elementValue,
      // undefined, // expected result transformation
      undefined, // name to give to result
      "object", //"instanceUuidIndex",
      {
        "d7a144ff-d1b9-4135-800c-a7cfc1f38733": {
          uuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          application: "5af03c98-fe5e-490b-b08f-e1230971c57f",
          name: "Author",
          conceptLevel: "Model",
          description: "The Author of a book.",
        },
        "e8ba151b-d68e-4cc3-9a83-3459d309ccf5": {
          uuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          parentName: "Entity",
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          application: "5af03c98-fe5e-490b-b08f-e1230971c57f",
          name: "Book",
          conceptLevel: "Model",
          description: "A book.",
        },
      }
    );
  });
  
  // ################################################################################################
  it("get Library Menus", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_getMenus",
      {},
      async () => {
        const applicationSection: ApplicationSection = "model";
        const queryResult: ActionReturnType = await localAppPersistenceStoreController.handleQuery({
          actionType: "queryAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "extractorForRecordOfExtractors",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractors: {
              menus: {
                queryType: "queryExtractObjectListByEntity",
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
      // (a) => ignorePostgresExtraAttributesOnRecord((a as any).returnedDomainElement.elementValue.entities, ["author"]),
      (a) => ignorePostgresExtraAttributesOnRecord((a as any).returnedDomainElement.elementValue.menus, ["author", "parentDefinitionVersionUuid"]),
      // (a) => (a as any).returnedDomainElement.elementValue.entities.elementValue,
      // undefined, // expected result transformation
      undefined, // name to give to result
      "object", //"instanceUuidIndex",
      {
        "dd168e5a-2a21-4d2d-a443-032c6d15eb22": {
          uuid: "dd168e5a-2a21-4d2d-a443-032c6d15eb22",
          parentName: "Menu",
          parentUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
          name: "LibraryMenu",
          defaultLabel: "Meta-Model",
          description: "This is the default menu allowing to explore the Library Application.",
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
                    application: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                    reportUuid: "c9ea3359-690c-4620-9603-b5b402e4a2b9",
                    icon: "category",
                  },
                  {
                    label: "Library Entity Definitions",
                    section: "model",
                    application: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                    reportUuid: "f9aff35d-8636-4519-8361-c7648e0ddc68",
                    icon: "category",
                  },
                  {
                    label: "Library Reports",
                    section: "model",
                    application: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                    reportUuid: "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855",
                    icon: "list",
                  },
                  {
                    label: "Library Books",
                    section: "data",
                    application: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                    reportUuid: "74b010b6-afee-44e7-8590-5f0849e4a5c9",
                    icon: "auto_stories",
                  },
                  {
                    label: "Library Authors",
                    section: "data",
                    application: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                    reportUuid: "66a09068-52c3-48bc-b8dd-76575bbc8e72",
                    icon: "star",
                  },
                  {
                    label: "Library Publishers",
                    section: "data",
                    application: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                    reportUuid: "a77aa662-006d-46cd-9176-01f02a1a12dc",
                    icon: "account_balance",
                  },
                  {
                    label: "Library countries",
                    section: "data",
                    application: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                    reportUuid: "08176cc7-43ae-4fca-91b7-bf869d19e4b9",
                    icon: "flag",
                  },
                  {
                    label: "Library Users",
                    section: "data",
                    application: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                    reportUuid: "3df9413d-5050-4357-910c-f764aacae7e6",
                    icon: "person",
                  },
                ],
              },
            ],
          },
        },
      }
      //   }
      // }
      // {
      //   "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad": {
      //     uuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      //     parentName: "Entity",
      //     parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      //     parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
      //     name: "Entity",
      //     application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      //     conceptLevel: "MetaModel",
      //     description: "The Metaclass for entities.",
      //   },
      //   "35c5608a-7678-4f07-a4ec-76fc5bc35424": {
      //     uuid: "35c5608a-7678-4f07-a4ec-76fc5bc35424",
      //     parentName: "Entity",
      //     parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      //     parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
      //     name: "SelfApplicationDeploymentConfiguration",
      //     application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      //     conceptLevel: "Model",
      //     description: "An Application Deployment",
      //   },
      //   "3d8da4d4-8f76-4bb4-9212-14869d81c00c": {
      //     uuid: "3d8da4d4-8f76-4bb4-9212-14869d81c00c",
      //     parentName: "Entity",
      //     parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      //     parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
      //     name: "Endpoint",
      //     application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      //     conceptLevel: "Model",
      //     description: "An Endpoint, servicing Actions that are part of a Domain Specific Language",
      //   },
      //   "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916": {
      //     uuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
      //     parentName: "Entity",
      //     parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      //     parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
      //     name: "Report",
      //     application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      //     conceptLevel: "Model",
      //     description: "Report, allowing to display model instances",
      //   },
      //   "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd": {
      //     uuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
      //     parentName: "Entity",
      //     parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      //     parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
      //     name: "EntityDefinition",
      //     application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      //     conceptLevel: "MetaModel",
      //     description: "The Metaclass for the definition of entities.",
      //   },
      //   "5e81e1b9-38be-487c-b3e5-53796c57fccf": {
      //     uuid: "5e81e1b9-38be-487c-b3e5-53796c57fccf",
      //     parentName: "Entity",
      //     parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      //     parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
      //     name: "JzodSchema",
      //     application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      //     conceptLevel: "Model",
      //     description: "Common Jzod Schema definitions, available to all Entity definitions",
      //   },
      //   "7990c0c9-86c3-40a1-a121-036c91b55ed7": {
      //     uuid: "7990c0c9-86c3-40a1-a121-036c91b55ed7",
      //     parentName: "Entity",
      //     parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      //     parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
      //     name: "StoreBasedConfiguration",
      //     application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      //     conceptLevel: "Model",
      //     description: "A configuration of storage-related aspects of a Model.",
      //   },
      //   "a659d350-dd97-4da9-91de-524fa01745dc": {
      //     uuid: "a659d350-dd97-4da9-91de-524fa01745dc",
      //     parentName: "Entity",
      //     parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      //     parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
      //     name: "SelfApplication",
      //     application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      //     conceptLevel: "Model",
      //     description: "Self Application",
      //   },
      //   "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24": {
      //     uuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
      //     parentName: "Entity",
      //     parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      //     parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
      //     name: "SelfApplicationVersion",
      //     application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      //     conceptLevel: "Model",
      //     description: "A Version of the Self Application",
      //   },
      //   "cdb0aec6-b848-43ac-a058-fe2dbe5811f1": {
      //     uuid: "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
      //     parentName: "Entity",
      //     parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      //     parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
      //     name: "ApplicationModelBranch",
      //     application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      //     conceptLevel: "Model",
      //     description: "A Branch of an Application Model",
      //   },
      //   "dde4c883-ae6d-47c3-b6df-26bc6e3c1842": {
      //     uuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
      //     parentName: "Entity",
      //     parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      //     parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
      //     name: "Menu",
      //     application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      //     conceptLevel: "Model",
      //     description: "Menu, allowing to display elements useful to navigate the application",
      //   },
      //   "e4320b9e-ab45-4abe-85d8-359604b3c62f": {
      //     uuid: "e4320b9e-ab45-4abe-85d8-359604b3c62f",
      //     parentName: "Entity",
      //     parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      //     parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
      //     name: "Query",
      //     application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      //     conceptLevel: "Model",
      //     description: "A Query",
      //   },
      // }
    );
  });

  // ################################################################################################
  it("get Filtered Entity Entity from Miroir", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_selectObjectListByEntity_filtered",
      {},
      async () => {
        const applicationSection:ApplicationSection = "model";
        const queryResult = await localMiroirPersistenceStoreController.handleQuery(
          {
            actionType: "queryAction",
            actionName: "runQuery",
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            applicationSection: applicationSection,
            query: {
              queryType: "extractorForRecordOfExtractors",
              pageParams: {},
              queryParams: {},
              contextResults: {},
              deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              extractors: {
                entities: {
                  queryType: "queryExtractObjectListByEntity",
                  applicationSection: applicationSection,
                  parentName: "Entity",
                  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                  filter: {
                    attributeName: "name",
                    value: "or"
                  },
                },
              },
            },
          }
        );
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) => ignorePostgresExtraAttributesOnRecord((a as any).returnedDomainElement.elementValue.entities, ["author"]),
      undefined, // name to give to result
      "object",
      {
        "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916": {
          "uuid": "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
          "parentName": "Entity",
          "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          "parentDefinitionVersionUuid": "381ab1be-337f-4198-b1d3-f686867fc1dd",
          "name": "Report",
          "application": "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          "conceptLevel": "Model",
          "description": "Report, allowing to display model instances"
        },
        "7990c0c9-86c3-40a1-a121-036c91b55ed7": {
          "uuid": "7990c0c9-86c3-40a1-a121-036c91b55ed7",
          "parentName": "Entity",
          "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          "parentDefinitionVersionUuid": "381ab1be-337f-4198-b1d3-f686867fc1dd",
          "name": "StoreBasedConfiguration",
          "application": "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          "conceptLevel": "Model",
          "description": "A configuration of storage-related aspects of a Model."
        },
      }
    );
  });
  
  // ################################################################################################
  it("get Unique Authors from Books in Library with actionRuntimeTransformer", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult = await localAppPersistenceStoreController.handleQuery({
          actionType: "queryAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "extractorForRecordOfExtractors",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractors: {
              books: {
                queryType: "queryExtractObjectListByEntity",
                applicationSection: applicationSection,
                parentName: "Book",
                parentUuid: entityBook.uuid,
                // parentUuid: {
                //   transformerType: "constantUuid",
                //   // constantUuidValue: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                //   constantUuidValue: entityBook.uuid,
                // },
              },
            },
            runtimeTransformers: {
              uniqueAuthors: {
                transformerType: "unique",
                interpolation: "runtime",
                referencedExtractor: "books",
                attribute: "author",
                orderBy: "author",
              },
            },
          },
        });
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) => (a as any).returnedDomainElement.elementValue.uniqueAuthors,
      undefined, // name to give to result
      "object",
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
        const queryResult = await localAppPersistenceStoreController.handleQuery({
          actionType: "queryAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "extractorForRecordOfExtractors",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractors: {
              books: {
                queryType: "queryExtractObjectListByEntity",
                applicationSection: applicationSection,
                parentName: "Book",
                parentUuid: entityBook.uuid,
                // parentUuid: {
                //   transformerType: "constantUuid",
                //   constantUuidValue: entityBook.uuid,
                // },
              },
            },
            runtimeTransformers: {
              uniqueAuthors: {
                referencedExtractor: "books",
                interpolation: "runtime",
                transformerType: "count",
              },
            },
          },
        });
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) => (a as any).returnedDomainElement.elementValue.uniqueAuthors,
      undefined, // name to give to result
      "object",// must equal a.returnedDomainElement.elementType
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
        const queryResult = await localAppPersistenceStoreController.handleQuery({
          actionType: "queryAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "extractorForRecordOfExtractors",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractors: {
              books: {
                queryType: "queryExtractObjectListByEntity",
                applicationSection: applicationSection,
                parentName: "Book",
                parentUuid: entityBook.uuid,
                // parentUuid: {
                //   transformerType: "constantUuid",
                //   constantUuidValue: entityBook.uuid,
                // },
              },
            },
            runtimeTransformers: {
              countBooksByAuthors: {
                referencedExtractor: "books",
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
      (a) => (a as any).returnedDomainElement.elementValue.countBooksByAuthors,
      undefined, // name to give to result
      "object", // must equal a.returnedDomainElement.elementType
      [
        { author: "4441169e-0c22-4fbc-81b2-28c87cf48ab2", count: 1 },
        { author: "ce7b601d-be5f-4bc6-a5af-14091594046a", count: 2 },
        { author: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17", count: 2 },
        { author: "e4376314-d197-457c-aa5e-d2da5f8d5977", count: 1 },
      ]
    );
  });
  
  // ################################################################################################
  it("get country list with new uuids with actionRuntimeTransformer", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_selectUniqueEntityApplication",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult = await localAppPersistenceStoreController.handleQuery({
          actionType: "queryAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "extractorForRecordOfExtractors",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            // pageParams: { elementType: "object", elementValue: {} },
            // queryParams: { elementType: "object", elementValue: {} },
            // contextResults: { elementType: "object", elementValue: {} },
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractors: {
              books: {
                queryType: "queryExtractObjectListByEntity",
                applicationSection: applicationSection,
                parentName: "Book",
                parentUuid: entityBook.uuid,
                // parentUuid: {
                //   transformerType: "constantUuid",
                //   constantUuidValue: entityBook.uuid,
                // },
              },
            },
            runtimeTransformers: {
              countries: {
                transformerType: "mapperListToList",
                interpolation: "runtime",
                referencedExtractor: "books",
                orderBy: "name",
                elementTransformer: {
                  transformerType: "fullObjectTemplate",
                  interpolation: "runtime",
                  referencedExtractor: "book",
                  definition: [
                    {
                      attributeKey: {
                        interpolation: "runtime",
                        transformerType: "constantUuid",
                        constantUuidValue: "uuid",
                      },
                      attributeValue: {
                        interpolation: "runtime",
                        transformerType: "newUuid",
                      },
                    },
                    {
                      attributeKey: {
                        interpolation: "runtime",
                        transformerType: "constantUuid",
                        constantUuidValue: "name",
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
          },
        });
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) =>
        ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.elementValue.countries, [
        // ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.elementValue.countries.elementValue, [
          "uuid",
        ]),
      // (a) =>
      //   ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.elementValue.countries.elementValue, [
      //     "uuid",
      //   ]).sort((a, b) =>
      //     a["name"].localeCompare(b["name"], "en", {
      //       sensitivity: "base",
      //     })
      //   ),
      undefined, // name to give to result
      "object", // must equal a.returnedDomainElement.elementType
      [
        {
          name: "Et dans l&#39;éternité je ne m&#39;ennuierai pas",
        },
        {
          name: "Le Pain et le Cirque",
        },
        {
          name: "Rear Window",
        },
        {
          name: "Renata n&#39;importe quoi",
        },
        {
          name: "The Bride Wore Black",
        },
        {
          name: "The Design of Everyday Things",
        },
      ]
    );
  });

  // ################################################################################################
  it("get books of an author with combiner", async () => {
    await chainVitestSteps(
      "ExtractorPersistenceStoreRunner_getBooksOfAuthorWithCombiner",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult = await localAppPersistenceStoreController.handleQuery({
          actionType: "queryAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "extractorForRecordOfExtractors",
            pageParams: {},
            queryParams: {
              // instanceUuid: "c6852e89-3c3c-447f-b827-4b5b9d830975",
            },
            contextResults: {},
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractors: {
              book: {
                queryType: "selectObjectByDirectReference",
                parentName: "Book",
                parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
                instanceUuid: "c6852e89-3c3c-447f-b827-4b5b9d830975",
              },
            },
            combiners: {
              author: {
                queryType: "selectObjectByRelation",
                parentName: "Author",
                parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
                objectReference: "book",
                AttributeOfObjectToCompareToReferenceUuid: "author",
              },
              booksOfAuthor: {
                queryType: "selectObjectListByRelation",
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
        const result = ignorePostgresExtraAttributesOnRecord(
          (a as any).returnedDomainElement.elementValue.booksOfAuthor
        );
        return result;
      },
      undefined, // name to give to result
      "object", // must equal a.returnedDomainElement.elementType
      {
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
      }
    );
  });
  
});
