import * as vitest from 'vitest';
import { afterAll } from 'vitest';
// import * as vitest from 'jest';

import {
  SqlDbAdminStore,
  SqlDbDataStoreSection,
  SqlDbModelStoreSection,
} from "miroir-store-postgres";
import {
  EntityDefinition,
  EntityInstance,
  ExtractorOrCombinerRecord,
  StoreUnitConfiguration
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import entityPublisher from "../../src/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a027c379-8468-43a5-ba4d-bf618be25cab.json";
import entityAuthor from "../../src/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d7a144ff-d1b9-4135-800c-a7cfc1f38733.json";
import entityBook from "../../src/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json";
import entityDefinitionBook from "../../src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/797dd185-0155-43fd-b23f-f6d0af8cae06.json";
import entityDefinitionPublisher from "../../src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/7a939fe8-d119-4e7f-ab94-95b2aae30db9.json";
import entityDefinitionAuthor from "../../src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b30b7180-f7dc-4cca-b4e8-e476b77fe61d.json";



import publisher1 from "../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/1f550a2a-33f5-4a56-83ee-302701039494.json";
import publisher2 from "../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/516a7366-39e7-4998-82cb-80199a7fa667.json";
import publisher3 from "../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/c1c97d54-aba8-4599-883a-7fe8f3874095.json";
import author1 from "../../src/assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/4441169e-0c22-4fbc-81b2-28c87cf48ab2.json";
import author2 from "../../src/assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/ce7b601d-be5f-4bc6-a5af-14091594046a.json";
import author3 from "../../src/assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17.json";
import book4 from "../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/6fefa647-7ecf-4f83-b617-69d7d5094c37.json";
import book6 from "../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c6852e89-3c3c-447f-b827-4b5b9d830975.json";
import book5 from "../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c97be567-bd70-449f-843e-cd1d64ac1ddd.json";
import book1 from "../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f.json";
import book2 from "../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/e20e276b-619d-4e16-8816-b7ec37b53439.json";

import { MetaEntity, Uuid } from '../../src/0_interfaces/1_core/EntityDefinition.js';
import {
  InitApplicationParameters,
  PersistenceStoreAdminSectionInterface,
} from "../../src/0_interfaces/4-services/PersistenceStoreControllerInterface.js";
import { defaultMiroirMetaModel } from '../../src/1_core/Model.js';
import { getBasicApplicationConfiguration, getBasicStoreUnitConfiguration } from '../../src/2_domain/Deployment.js';
import { PersistenceStoreController } from '../../src/4_services/PersistenceStoreController.js';
import {
  runTransformerIntegrationTest,
  runTransformerTestSuite,
  transformerTestsDisplayResults
} from "../../src/4_services/TestTools";
import {
  currentTestSuite,
} from "../2_domain/transformersTests_miroir.data";
// const env:any = (import.meta as any).env
// console.log("@@@@@@@@@@@@@@@@@@ env", env);
const RUN_TEST= process.env.RUN_TEST
console.log("@@@@@@@@@@@@@@@@@@ RUN_TEST", RUN_TEST);

// console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

// describe.sequential("templatesDEFUNCT.unit.test", () => {

const testSuiteName = "transformers.integ.test";

const testApplicationName = "testApplication"
const sqlDbStoreName = "testStoreName"
const connectionString = "postgres://postgres:postgres@localhost:5432/postgres"
// const schema = "testSchema"
const schema = testApplicationName;
const paramSelfApplicationUuid = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const paramAdminConfigurationDeploymentUuid: Uuid = "bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const applicationModelBranchUuid: Uuid = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const selfApplicationVersionUuid: Uuid = "dddddddd-dddd-dddd-dddd-dddddddddddd";

// let sqlDbAdminStore: SqlDbAdminStoreSection;
let sqlDbAdminStore: PersistenceStoreAdminSectionInterface;
let sqlDbDataStore: SqlDbDataStoreSection | undefined = undefined;
let sqlDbModelStore: SqlDbModelStoreSection;
let persistenceStoreController: PersistenceStoreController;
const testStoreConfig: StoreUnitConfiguration = getBasicStoreUnitConfiguration(testApplicationName, {
  emulatedServerType: "sql",
  connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
})

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
      // book3 as EntityInstance,
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

const beforeAll = async () => {
  if (RUN_TEST == testSuiteName) {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ beforeAll");
    // sqlDbAdminStore = new SqlDbDataStoreSection("data", sqlDbStoreName, connectionString, schema);
    sqlDbAdminStore = new SqlDbAdminStore("data", sqlDbStoreName, connectionString, schema);
    sqlDbDataStore = new SqlDbDataStoreSection("data", sqlDbStoreName, connectionString, schema);
    sqlDbModelStore = new SqlDbModelStoreSection("model", sqlDbStoreName, connectionString, schema, sqlDbDataStore);

    persistenceStoreController = new PersistenceStoreController(sqlDbAdminStore, sqlDbModelStore, sqlDbDataStore);

    const testApplicationConfig: InitApplicationParameters = getBasicApplicationConfiguration(
      testApplicationName,
      paramSelfApplicationUuid,
      // {
      //   emulatedServerType: "sql",
      //   connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
      // },
      paramAdminConfigurationDeploymentUuid,
      applicationModelBranchUuid,
      selfApplicationVersionUuid
    );
    // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ testApplicationConfig", JSON.stringify(testApplicationConfig, null, 2));

    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ createAdminStore", testStoreConfig.admin);
    await persistenceStoreController.createStore(testStoreConfig.admin);
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ createModelStore", testStoreConfig.model);
    await persistenceStoreController.createStore(testStoreConfig.model);
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ createDataStore", testStoreConfig.data);
    await persistenceStoreController.createStore(testStoreConfig.data);
    
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ stores created, connecting...");
    await persistenceStoreController.open();
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ connected!");

    await persistenceStoreController.initApplication(
      defaultMiroirMetaModel,
      "miroir",
      testApplicationConfig.selfApplication,
      testApplicationConfig.applicationModelBranch,
      testApplicationConfig.applicationVersion
    );

    await persistenceStoreController.handleAction({
      actionType: "resetModel",
      actionLabel: "resetTestStore",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: paramAdminConfigurationDeploymentUuid,
    });
    await persistenceStoreController.handleAction({
      actionType: "initModel",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: paramAdminConfigurationDeploymentUuid,
      payload: {
        params: {
          dataStoreType: "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
          metaModel: defaultMiroirMetaModel,
          // TODO: this is wrong, selfApplication, selfApplication version, etc. must be passed as parameters!!!!!!!!!!!!!!!!!!!!
          selfApplication: testApplicationConfig.selfApplication,
          applicationModelBranch: testApplicationConfig.applicationModelBranch,
          applicationVersion: testApplicationConfig.applicationVersion,
        },
      }
    });
    // }, defaultMiroirMetaModel);
    await persistenceStoreController.handleAction({
      actionType: "createEntity",
      actionLabel: "CreateLibraryStoreEntities",
      deploymentUuid: paramAdminConfigurationDeploymentUuid,
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        entities: libraryEntitesAndInstances,
      }
    });
    await persistenceStoreController.handleAction({
      actionType: "createInstance",
      actionLabel: "CreateLibraryStoreInstances",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      applicationSection: "data",
      deploymentUuid: paramAdminConfigurationDeploymentUuid,
      objects: libraryEntitesAndInstances.map((e) => {
        return {
          parentName: e.entity.name,
          parentUuid: e.entity.uuid,
          applicationSection: "data",
          instances: e.instances,
        };
      }),
    });
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ END beforeAll");
  }
};

afterAll(async () => {
  console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ afterAll");
  if (RUN_TEST == testSuiteName) {
    // await persistenceStoreController.deleteStore(testStoreConfig.data);
    // await persistenceStoreController.deleteStore(testStoreConfig.model);
    // await persistenceStoreController.deleteStore(testStoreConfig.admin);
    // await persistenceStoreController.close();
    transformerTestsDisplayResults(currentTestSuite, RUN_TEST, testSuiteName);
  }
  console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ afterAll DONE");
});



const extractors: ExtractorOrCombinerRecord = {
  books: {
    extractorOrCombinerType: "extractorByEntityReturningObjectList",
    applicationSection: "data",
    parentName: "Book",
    parentUuid: entityBook.uuid,
  },
};



// (async () => {
if (RUN_TEST == testSuiteName) {
  await beforeAll(); // beforeAll is a function, not the call to the jest/vitest hook
  // await runTransformerTestSuite(vitest, [], transformerTestSuite_miroirTransformers, runTransformerIntegrationTest);
  if (!sqlDbDataStore) {
    throw new Error("sqlDbDataStore is not defined!");
  }
  await runTransformerTestSuite(vitest, [], currentTestSuite, runTransformerIntegrationTest(sqlDbDataStore));
} else {
  console.log("################################ skipping test suite:", testSuiteName, "RUN_TEST=", RUN_TEST);
}
