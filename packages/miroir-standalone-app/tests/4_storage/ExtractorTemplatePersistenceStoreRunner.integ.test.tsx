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
  entityPublisher,
  entityDefinitionPublisher,
  publisher1,
  publisher2,
  publisher3,
  queryTemplate
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
        // authors
        {
          entity: entityAuthor as MetaEntity,
          entityDefinition: entityDefinitionAuthor as EntityDefinition,
          instances: [
            author1,
            author2,
            author3 as EntityInstance,
          ],
        },
        // books
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
        // publishers
        {
          entity: entityPublisher as MetaEntity,
          entityDefinition: entityDefinitionPublisher as EntityDefinition,
          instances: [
            publisher1,
            publisher2,
            publisher3 as EntityInstance,
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

describe.sequential("ExtractorTemplatePersistenceStoreRunner.integ.test", () => {

  // ################################################################################################
  it("get Entity Entity from Miroir", async () => {
    await chainVitestSteps(
      "ExtractorTemplatePersistenceStoreRunner_selectEntityInstance_selectObjectByDirectReference",
      {},
      async () => {
        const applicationSection:ApplicationSection = "model";
        const queryResult:ActionReturnType = await localMiroirPersistenceStoreController.handleQueryTemplateForServerONLY(
          {
            actionType: "queryTemplateAction",
            actionName: "runQuery",
            deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
            // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            applicationSection: applicationSection,
            query: {
              queryType: "extractorTemplateForDomainModelObjects",
              pageParams: {},
              queryParams: {},
              contextResults: {},
              deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
              // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              select: {
                queryType: "selectObjectByDirectReference",
                applicationSection: "model",
                parentName: "Entity",
                parentUuid: {
                  transformerType: "constantUuid",
                  constantUuidValue: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                },
                instanceUuid: {
                  transformerType: "constantUuid",
                  constantUuidValue: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                },
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
  it("get Library Entities", async () => {
    await chainVitestSteps(
      "ExtractorTemplatePersistenceStoreRunner_selectEntityInstanceUuidIndex",
      {},
      async () => {
        const applicationSection:ApplicationSection = "model";
        const queryResult:ActionReturnType = await localMiroirPersistenceStoreController.handleQueryTemplateForServerONLY(
          {
            actionType: "queryTemplateAction",
            actionName: "runQuery",
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            applicationSection: applicationSection,
            query: {
              queryType: "extractorTemplateForRecordOfExtractors",
              pageParams: {},
              queryParams: {},
              contextResults: {},
              deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              extractorTemplates: {
                entities: {
                  queryType: "queryTemplateExtractObjectListByEntity",
                  applicationSection: applicationSection,
                  parentName: "Entity",
                  parentUuid: {
                    transformerType: "constantUuid",
                    constantUuidValue: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                  },
                }
              }
            }
          }
        );
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;// == "ok" ? queryResult : {status: "error", error: queryResult.error};
      },
      (a) => ignorePostgresExtraAttributesOnRecord((a as any).returnedDomainElement.elementValue.entities, ["author"]),
      // (a) => (a as any).returnedDomainElement.elementValue.entities.elementValue,
      // undefined, // expected result transformation
      undefined, // name to give to result
      "object",//"instanceUuidIndex",
      {
        "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad": {
          "uuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          "parentName": "Entity",
          "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          "parentDefinitionVersionUuid": "381ab1be-337f-4198-b1d3-f686867fc1dd",
          "name": "Entity",
          "application": "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          "conceptLevel": "MetaModel",
          "description": "The Metaclass for entities."
        },
        "35c5608a-7678-4f07-a4ec-76fc5bc35424": {
          "uuid": "35c5608a-7678-4f07-a4ec-76fc5bc35424",
          "parentName": "Entity",
          "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          "parentDefinitionVersionUuid": "381ab1be-337f-4198-b1d3-f686867fc1dd",
          "name": "SelfApplicationDeploymentConfiguration",
          "application": "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          "conceptLevel": "Model",
          "description": "An Application Deployment"
        },
        "3d8da4d4-8f76-4bb4-9212-14869d81c00c": {
          "uuid": "3d8da4d4-8f76-4bb4-9212-14869d81c00c",
          "parentName": "Entity",
          "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          "parentDefinitionVersionUuid": "381ab1be-337f-4198-b1d3-f686867fc1dd",
          "name": "Endpoint",
          "application": "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          "conceptLevel": "Model",
          "description": "An Endpoint, servicing Actions that are part of a Domain Specific Language"
        },
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
        "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd": {
          "uuid": "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
          "parentName": "Entity",
          "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          "parentDefinitionVersionUuid": "381ab1be-337f-4198-b1d3-f686867fc1dd",
          "name": "EntityDefinition",
          "application": "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          "conceptLevel": "MetaModel",
          "description": "The Metaclass for the definition of entities."
        },
        "5e81e1b9-38be-487c-b3e5-53796c57fccf": {
          "uuid": "5e81e1b9-38be-487c-b3e5-53796c57fccf",
          "parentName": "Entity",
          "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          "parentDefinitionVersionUuid": "381ab1be-337f-4198-b1d3-f686867fc1dd",
          "name": "JzodSchema",
          "application": "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          "conceptLevel": "Model",
          "description": "Common Jzod Schema definitions, available to all Entity definitions"
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
        "a659d350-dd97-4da9-91de-524fa01745dc": {
          "uuid": "a659d350-dd97-4da9-91de-524fa01745dc",
          "parentName": "Entity",
          "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          "parentDefinitionVersionUuid": "381ab1be-337f-4198-b1d3-f686867fc1dd",
          "name": "SelfApplication",
          "application": "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          "conceptLevel": "Model",
          "description": "Self Application"
        },
        "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24": {
          "uuid": "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
          "parentName": "Entity",
          "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          "parentDefinitionVersionUuid": "381ab1be-337f-4198-b1d3-f686867fc1dd",
          "name": "SelfApplicationVersion",
          "application": "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          "conceptLevel": "Model",
          "description": "A Version of the Self Application"
        },
        "cdb0aec6-b848-43ac-a058-fe2dbe5811f1": {
          "uuid": "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
          "parentName": "Entity",
          "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          "parentDefinitionVersionUuid": "381ab1be-337f-4198-b1d3-f686867fc1dd",
          "name": "ApplicationModelBranch",
          "application": "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          "conceptLevel": "Model",
          "description": "A Branch of an Application Model"
        },
        "dde4c883-ae6d-47c3-b6df-26bc6e3c1842": {
          "uuid": "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
          "parentName": "Entity",
          "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          "parentDefinitionVersionUuid": "381ab1be-337f-4198-b1d3-f686867fc1dd",
          "name": "Menu",
          "application": "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          "conceptLevel": "Model",
          "description": "Menu, allowing to display elements useful to navigate the application"
        },
        "e4320b9e-ab45-4abe-85d8-359604b3c62f": {
          "uuid": "e4320b9e-ab45-4abe-85d8-359604b3c62f",
          "parentName": "Entity",
          "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          "parentDefinitionVersionUuid": "381ab1be-337f-4198-b1d3-f686867fc1dd",
          "name": "Query",
          "application": "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          "conceptLevel": "Model",
          "description": "A Query"
        }
      }
    )
  });
  
  // ################################################################################################
  it("get Filtered Entity Entity from Library", async () => {
    await chainVitestSteps(
      "ExtractorTemplatePersistenceStoreRunner_selectObjectListByEntity_filtered",
      {},
      async () => {
        const applicationSection:ApplicationSection = "model";
        const queryResult = await localMiroirPersistenceStoreController.handleQueryTemplateForServerONLY(
          {
            actionType: "queryTemplateAction",
            actionName: "runQuery",
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            applicationSection: applicationSection,
            query: {
              queryType: "extractorTemplateForRecordOfExtractors",
              pageParams: {},
              queryParams: {},
              contextResults: {},
              deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              extractorTemplates: {
                entities: {
                  queryType: "queryTemplateExtractObjectListByEntity",
                  applicationSection: applicationSection,
                  parentName: "Entity",
                  parentUuid: {
                    transformerType: "constantUuid",
                    constantUuidValue: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                  },
                  filter: {
                    attributeName: "name",
                    value: {
                      transformerType: "constantString",
                      constantStringValue: "or",
                    },
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
      "ExtractorTemplatePersistenceStoreRunner_selectUniqueEntityApplication",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult = await localAppPersistenceStoreController.handleQueryTemplateForServerONLY({
          actionType: "queryTemplateAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "extractorTemplateForRecordOfExtractors",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractorTemplates: {
              books: {
                queryType: "queryTemplateExtractObjectListByEntity",
                applicationSection: applicationSection,
                parentName: "Book",
                parentUuid: {
                  transformerType: "constantUuid",
                  // constantUuidValue: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                  constantUuidValue: entityBook.uuid,
                },
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
      "ExtractorTemplatePersistenceStoreRunner_selectUniqueEntityApplication",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult = await localAppPersistenceStoreController.handleQueryTemplateForServerONLY({
          actionType: "queryTemplateAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "extractorTemplateForRecordOfExtractors",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractorTemplates: {
              books: {
                queryType: "queryTemplateExtractObjectListByEntity",
                applicationSection: applicationSection,
                parentName: "Book",
                parentUuid: {
                  transformerType: "constantUuid",
                  constantUuidValue: entityBook.uuid,
                },
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
      "ExtractorTemplatePersistenceStoreRunner_selectUniqueEntityApplication",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult = await localAppPersistenceStoreController.handleQueryTemplateForServerONLY({
          actionType: "queryTemplateAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "extractorTemplateForRecordOfExtractors",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractorTemplates: {
              books: {
                queryType: "queryTemplateExtractObjectListByEntity",
                applicationSection: applicationSection,
                parentName: "Book",
                parentUuid: {
                  transformerType: "constantUuid",
                  constantUuidValue: entityBook.uuid,
                },
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
      "ExtractorTemplatePersistenceStoreRunner_selectUniqueEntityApplication",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult = await localAppPersistenceStoreController.handleQueryTemplateForServerONLY({
          actionType: "queryTemplateAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "extractorTemplateForRecordOfExtractors",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            // pageParams: { elementType: "object", elementValue: {} },
            // queryParams: { elementType: "object", elementValue: {} },
            // contextResults: { elementType: "object", elementValue: {} },
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractorTemplates: {
              books: {
                queryType: "queryTemplateExtractObjectListByEntity",
                applicationSection: applicationSection,
                parentName: "Book",
                parentUuid: {
                  transformerType: "constantUuid",
                  constantUuidValue: entityBook.uuid,
                },
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
                        transformerType: "mustacheStringTemplate",
                        interpolation: "runtime",
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
      "ExtractorTemplatePersistenceStoreRunner_selectUniqueEntityApplication",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult = await localAppPersistenceStoreController.handleQueryTemplateForServerONLY({
          actionType: "queryTemplateAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: applicationSection,
          query: {
            queryType: "extractorTemplateForRecordOfExtractors",
            pageParams: {},
            queryParams: {
              instanceUuid: "c6852e89-3c3c-447f-b827-4b5b9d830975",
            },
            contextResults: {},
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            extractorTemplates: {
              book: {
                queryType: "selectObjectByDirectReference",
                parentName: "Book",
                parentUuid: {
                  transformerType: "constantUuid",
                  constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
                },
                instanceUuid: {
                  transformerType: "parameterReference",
                  referenceName: "instanceUuid",
                },
              },
            },
            combinerTemplates: {
              author: {
                queryType: "selectObjectByRelation",
                parentName: "Author",
                parentUuid: {
                  transformerType: "constantUuid",
                  constantUuidValue: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
                },
                objectReference: {
                  transformerType: "contextReference",
                  interpolation: "runtime",
                  referenceName: "book",
                },
                AttributeOfObjectToCompareToReferenceUuid: "author",
              },
              booksOfAuthor: {
                queryType: "selectObjectListByRelation",
                parentName: "Book",
                parentUuid: {
                  transformerType: "constantUuid",
                  constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
                },
                objectReference: {
                  transformerType: "contextReference",
                  interpolation: "runtime",
                  referenceName: "author",
                },
                AttributeOfListObjectToCompareToReferenceUuid: "author",
              },
            },
          },
        });
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      // (a) => (a as any).returnedDomainElement.elementValue.booksOfAuthor,
      (a) => {
        // console.log("ICI!!!");
        const result = ignorePostgresExtraAttributesOnRecord(
          (a as any).returnedDomainElement.elementValue.booksOfAuthor
        );
        console.log("CORRECTED result", JSON.stringify(result, null, 2));
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
