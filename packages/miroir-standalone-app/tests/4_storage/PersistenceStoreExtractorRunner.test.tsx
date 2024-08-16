import { describe } from 'vitest';

// import { miroirFileSystemStoreSectionStartup } from "../dist/bundle";
import {
  ActionReturnType,
  adminConfigurationDeploymentLibrary,
  ApplicationSection,
  defaultLevels,
  DomainControllerInterface,
  MiroirConfigClient,
  MiroirLoggerFactory,
  PersistenceStoreControllerInterface,
  PersistenceStoreControllerManagerInterface
} from "miroir-core";


import { miroirFileSystemStoreSectionStartup } from 'miroir-store-filesystem';
import { miroirIndexedDbStoreSectionStartup } from 'miroir-store-indexedDb';
import { miroirPostgresStoreSectionStartup } from 'miroir-store-postgres';
import { setupServer } from "msw/node";
import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { chainVitestSteps, ignorePostgresExtraAttributesOnObject, ignorePostgresExtraAttributesOnRecord, loadTestConfigFiles, miroirAfterEach, miroirBeforeAll, miroirBeforeEach } from "../utils/tests-utils.js";

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

// // ################################################################################################
// function getExtractorRunner(
//   miroirConfig: MiroirConfigClient,
//   miroirStoreController: PersistenceStoreControllerInterface
// ): PersistenceStoreExtractorRunner {
//   if (!miroirConfig.client.emulateServer) {
//     throw new Error(
//       "LocalPersistenceStoreController state do not make sense for real server configurations! Please use only 'emulateServer: true' configurations for this test."
//     );
//   } else {
//     switch (miroirConfig.client.deploymentStorageConfig.miroir.data.emulatedServerType) {
//       case "indexedDb": {
//         return new IndexedDbExtractorRunner(miroirStoreController);
//         break;
//       }
//       case "sql": {
//         throw new Error(
//           "PersistenceStoreExtractorRunner.getExtractorRunner: sql not implemented yet!"
//         );
//             // return new PostgresE(miroirStoreController);
//         break;
//       }
//       case "filesystem": {
//         throw new Error("PersistenceStoreExtractorRunner.getExtractorRunner: filesystem not implemented yet!");
//       }
//       default:
//         break;
//     }
//   }
//   throw new Error("PersistenceStoreExtractorRunner.getExtractorRunner: unknown emulatedServerType!");
// }

// ##############################################################################################
// ##############################################################################################
// ##############################################################################################

// function ignorePostgresExtraAttributes(instances: EntityInstance[]){
//   return instances.map(i => Object.fromEntries(Object.entries(i).filter(e=>!["createdAt", "updatedAt", "author"].includes(e[0]))))
// }

describe.sequential("PersistenceStoreExtractorRunner.test", () => {

  // ################################################################################################
  it("get Library Entities", async () => {
    await chainVitestSteps(
      "PersistenceStoreExtractorRunner_selectEntityInstanceUuidIndex",
      {},
      async () => {
        const applicationSection:ApplicationSection = "model";
        const queryResult:ActionReturnType = await localMiroirPersistenceStoreController.handleQuery(
          applicationSection,
          {
            actionType: "queryAction",
            actionName: "runQuery",
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            query: {
              queryType: "extractorForRecordOfExtractors",
              pageParams: {elementType: "object", elementValue: {}},
              queryParams: {elementType: "object", elementValue: {}},
              contextResults: {elementType: "object", elementValue: {}},
              deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              extractors: {
                entities: {
                  queryType: "extractObjectListByEntity",
                  applicationSection: applicationSection,
                  parentName: "Entity",
                  parentUuid: {
                    queryTemplateType: "constantUuid",
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
      (a) => ignorePostgresExtraAttributesOnRecord((a as any).returnedDomainElement.elementValue.entities.elementValue),
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
  it("get Entity Entity from Library", async () => {
    await chainVitestSteps(
      "PersistenceStoreExtractorRunner_selectEntityInstance_selectObjectByDirectReference",
      {},
      async () => {
        const applicationSection:ApplicationSection = "model";
        const queryResult:ActionReturnType = await localMiroirPersistenceStoreController.handleQuery(
          applicationSection,
          {
            actionType: "queryAction",
            actionName: "runQuery",
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            query: {
              queryType: "domainModelSingleExtractor",
              pageParams: { elementType: "object", elementValue: {} },
              queryParams: { elementType: "object", elementValue: {} },
              contextResults: { elementType: "object", elementValue: {} },
              deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              select: {
                queryType: "selectObjectByDirectReference",
                applicationSection: "model",
                parentName: "Entity",
                parentUuid: {
                  queryTemplateType: "constantUuid",
                  constantUuidValue: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                },
                instanceUuid: {
                  queryTemplateType: "constantUuid",
                  constantUuidValue: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                },
              },
            },
          }
        );
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) => ignorePostgresExtraAttributesOnObject((a as any).returnedDomainElement.elementValue),
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
  it("get Filtered Entity Entity from Library", async () => {
    await chainVitestSteps(
      "PersistenceStoreExtractorRunner_selectObjectListByEntity_filtered",
      {},
      async () => {
        const applicationSection:ApplicationSection = "model";
        const queryResult = await localMiroirPersistenceStoreController.handleQuery(
          applicationSection,
          {
            actionType: "queryAction",
            actionName: "runQuery",
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            query: {
              queryType: "extractorForRecordOfExtractors",
              pageParams: { elementType: "object", elementValue: {} },
              queryParams: { elementType: "object", elementValue: {} },
              contextResults: { elementType: "object", elementValue: {} },
              deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              extractors: {
                entities: {
                  queryType: "extractObjectListByEntity",
                  applicationSection: applicationSection,
                  parentName: "Entity",
                  parentUuid: {
                    queryTemplateType: "constantUuid",
                    constantUuidValue: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                  },
                  filter: {
                    attributeName: "name",
                    value: {
                      queryTemplateType: "constantString",
                      definition: "or",
                    },
                  },
                },
              },
            },
          }
        );
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        // const result: ActionReturnType =
        //   queryResult.elementType == "instance"
        //     ? {
        //         status: "ok",
        //         returnedDomainElement: queryResult,
        //       }
        //     : {
        //         status: "error",
        //         error: {
        //           errorType: "FailedToGetInstances",
        //           errorMessage: JSON.stringify(queryResult, undefined, 2),
        //         },
        //       };
        return queryResult;
      },
      (a) => ignorePostgresExtraAttributesOnRecord((a as any).returnedDomainElement.elementValue.entities.elementValue),
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
  
});
