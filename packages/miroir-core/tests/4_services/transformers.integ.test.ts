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
  StoreUnitConfiguration
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

// import entityBook from "../../src/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json";
// import entityDefinitionBook from "../../src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/797dd185-0155-43fd-b23f-f6d0af8cae06.json";
// import entityDefinitionPublisher from "../../src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/7a939fe8-d119-4e7f-ab94-95b2aae30db9.json";
// import entityDefinitionAuthor from "../../src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b30b7180-f7dc-4cca-b4e8-e476b77fe61d.json";



import {
  author1,
  author2,
  author3,
  book1,
  book2,
  book4,
  book5,
  book6,
  entityAuthor,
  entityBook,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionPublisher,
  entityPublisher,
  folio as publisher1,
  penguin as publisher2,
  springer as publisher3,
} from "miroir-test-app_deployment-library";

import { MetaEntity, Uuid } from '../../src/0_interfaces/1_core/EntityDefinition.js';
import {
  InitApplicationParameters,
  PersistenceStoreAdminSectionInterface,
} from "../../src/0_interfaces/4-services/PersistenceStoreControllerInterface.js";
import { defaultMetaModelEnvironment, defaultMiroirMetaModel } from '../../src/1_core/Model.js';
import { getBasicApplicationConfiguration, getBasicStoreUnitConfiguration } from '../../src/2_domain/Deployment.js';
import { PersistenceStoreController } from '../../src/4_services/PersistenceStoreController.js';
import {
  runTransformerIntegrationTest,
  runTransformerTestSuite,
  runUnitTransformerTests,
  transformerTestsDisplayResults,
  type RunTransformerTests
} from "../../src/4_services/TestTools";
// import {
//   currentTestSuite,
// } from "../2_domain/transformersTests_miroir.data";
import { MiroirActivityTracker } from '../../src/3_controllers/MiroirActivityTracker';
import { MiroirEventService } from '../../src/3_controllers/MiroirEventService';

import type { TransformerTestSuite } from '../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType';
import { transformerTest_miroirCoreTransformers } from "miroir-test-app_deployment-miroir";
const transformerTestSuite_miroirTransformers: TransformerTestSuite = transformerTest_miroirCoreTransformers.definition as any;

// Access the test file pattern from Vitest's process arguments
const vitestArgs = process.argv.slice(2);
const filePattern = vitestArgs.find(arg => !arg.startsWith('-')) || '';
console.log("@@@@@@@@@@@@@@@@@@ File Pattern:", filePattern);

const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);

// console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

// describe.sequential("templatesDEFUNCT.unit.test", () => {

const testSuiteName = "transformers.integ.test";

// Skip this test when running resolveConditionalSchema pattern
const shouldSkip = filePattern.includes(testSuiteName);

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
  if (!shouldSkip) {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ beforeAll");
    // sqlDbAdminStore = new SqlDbDataStoreSection("data", sqlDbStoreName, connectionString, schema);
    sqlDbAdminStore = new SqlDbAdminStore("data", sqlDbStoreName, connectionString, schema);
    sqlDbDataStore = new SqlDbDataStoreSection("data", sqlDbStoreName, connectionString, schema);
    sqlDbModelStore = new SqlDbModelStoreSection("model", sqlDbStoreName, connectionString, schema, sqlDbDataStore);

    persistenceStoreController = new PersistenceStoreController(sqlDbAdminStore, sqlDbModelStore, sqlDbDataStore);

    const testApplicationConfig: InitApplicationParameters = getBasicApplicationConfiguration(
      testApplicationName,
      paramSelfApplicationUuid,
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
      actionLabel: "resetTestStore",      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: paramSelfApplicationUuid,
        // deploymentUuid: paramAdminConfigurationDeploymentUuid,
      },
    });
    await persistenceStoreController.handleAction({
      actionType: "initModel",      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: paramSelfApplicationUuid,
        // deploymentUuid: paramAdminConfigurationDeploymentUuid,
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
      actionLabel: "CreateLibraryStoreEntities",      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: paramSelfApplicationUuid,
        // deploymentUuid: paramAdminConfigurationDeploymentUuid,
        entities: libraryEntitesAndInstances,
      }
    });
    await persistenceStoreController.handleAction({
      actionType: "createInstance",
      actionLabel: "CreateLibraryStoreInstances",      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: paramSelfApplicationUuid,
        // deploymentUuid: paramAdminConfigurationDeploymentUuid,
        applicationSection: "data",
        parentUuid: entityAuthor.uuid, // IRRELEVANT, will be overridden
        // parentUuid: libraryEntitesAndInstances[].entity.uuid,
        objects: libraryEntitesAndInstances.map((e) => {
          return {
            parentName: e.entity.name,
            parentUuid: e.entity.uuid,
            applicationSection: "data",
            instances: e.instances,
          };
        }),
      }
    });
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ END beforeAll");
  }
};

afterAll(async () => {
  console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ afterAll");
  if (!shouldSkip) {
    // await persistenceStoreController.deleteStore(testStoreConfig.data);
    // await persistenceStoreController.deleteStore(testStoreConfig.model);
    // await persistenceStoreController.deleteStore(testStoreConfig.admin);
    // await persistenceStoreController.close();
    transformerTestsDisplayResults(transformerTestSuite_miroirTransformers, testSuiteName, testSuiteName, miroirActivityTracker);
  }
  console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ afterAll DONE");
});

// const extractors: ExtractorOrCombinerRecord = {
//   books: {
//     extractorOrCombinerType: "extractorByEntityReturningObjectList",
//     applicationSection: "data",
//     parentName: "Book",
//     parentUuid: entityBook.uuid,
//   },
// };

if (shouldSkip) {
  console.log("################################ skipping test suite:", testSuiteName);
  console.log("################################ File pattern:", filePattern);
} else {
  await beforeAll(); // beforeAll is a function, not the call to the jest/vitest hook
  // await runTransformerTestSuite(vitest, [], transformerTestSuite_miroirTransformers, runTransformerIntegrationTest);
  if (!sqlDbDataStore) {
    throw new Error("sqlDbDataStore is not defined!");
  }
  const runIntegTransformerTests: RunTransformerTests = {
    _runTransformerTestSuiteWithTracking: runUnitTransformerTests._runTransformerTestSuiteWithTracking,
    _runTransformerTestWithTracking: runUnitTransformerTests._runTransformerTestWithTracking,
    _runTransformerTestSuite: runUnitTransformerTests._runTransformerTestSuite,
    _runTransformerTest: runTransformerIntegrationTest(sqlDbDataStore),
  }
  await runTransformerTestSuite(
    vitest,
    [],
    transformerTestSuite_miroirTransformers,
    undefined, // filter
    // {
    //   testList: {
    //     miroirCoreTransformers: {
    //       runtimeTransformerTests: {
    //         "case": [
    //           "case matches first when clause",
    //           "case matches second when clause",
    //           "case falls through to else clause",
    //           "case without else returns undefined when no match",
    //           "case with number discriminator",
    //           "case with complex then transformer",
    //         ],
    //         // "aggregate": [
    //         //   // "count returns number of elements in an object list at runtime",
    //         //   // "count returns number of elements in an object list with a group at runtime",
    //         //   // "count returns number of elements in an object list with a multiple groupBy at runtime",
    //         //   "count returns number of elements in a string list from an extractor at runtime",
    //         // ],
    //         // "dataflowObject": [
    //         //   "dataflowObject with two entries and without target allows to render each entry based on the previous one"
    //         // ],
    //         // "pickFromList": [
    //         //   "pickFromList selects wanted element from a returnValue string list before runtime",
    //         //   "pickFromList selects wanted element from a string list parameter reference before runtime",
    //         //   "pickFromList selects wanted object from a pre-sorted object list before runtime",
    //         //   "pickFromList from extractor selects wanted element from string list context reference at runtime",
    //         //   "pickFromList from extractor selects wanted element from object ordered list at runtime",
    //         //   "pickFromList returns null when index is out of bounds before runtime",
    //         // ],
    //         // ifThenElse: [
    //         //   "ifThenElse equality true - basic string comparison",
    //         //   "ifThenElse equality false - basic string comparison",
    //         //   "ifThenElse not equal true - string comparison",
    //         //   "ifThenElse not equal false - string comparison",
    //         //   "ifThenElse less than true - number comparison",
    //         //   "ifThenElse less than false - number comparison",
    //         //   "ifThenElse less than or equal true - number comparison",
    //         //   "ifThenElse less than or equal false - number comparison",
    //         //   "ifThenElse greater than true - number comparison",
    //         //   "ifThenElse greater than false - number comparison",
    //         //   "ifThenElse greater than or equal true - number comparison",
    //         //   "ifThenElse greater than or equal false - number comparison",
    //         //   "ifThenElse with parameter reference comparison",
    //         // ]
    //         // "object_alter": [
    //         //   "mergeIntoObject should fail when definition fails to resolve correctly",
    //         // ]
    //       },
    //     },
    //   },
    // },
    defaultMetaModelEnvironment,
    miroirActivityTracker,
    undefined, // parentTrackingId,
    true, // trackActionsBelow
    runIntegTransformerTests,
  );
  
  // await transformerTestsDisplayResults(currentTestSuite, filePattern || "", testSuiteName, miroirActivityTracker);
}
