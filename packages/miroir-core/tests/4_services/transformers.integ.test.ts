import * as vitest from 'vitest';
import { afterAll, describe, expect, it } from 'vitest';
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
  StoreUnitConfiguration,
  TransformerForRuntime
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import entityPublisher from "../../src/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a027c379-8468-43a5-ba4d-bf618be25cab.json";
import entityAuthor from "../../src/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d7a144ff-d1b9-4135-800c-a7cfc1f38733.json";
import entityBook from "../../src/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json";
import entityCountry from "../../src/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d3139a6d-0486-4ec8-bded-2a83a3c3cee4.json";
import reportAuthorList from "../../src/assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/66a09068-52c3-48bc-b8dd-76575bbc8e72.json";
import reportBookList from "../../src/assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/74b010b6-afee-44e7-8590-5f0849e4a5c9.json";
import reportBookInstance from "../../src/assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c3503412-3d8a-43ef-a168-aa36e975e606.json";
import reportPublisherList from "../../src/assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/a77aa662-006d-46cd-9176-01f02a1a12dc.json";
import entityDefinitionBook from "../../src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/797dd185-0155-43fd-b23f-f6d0af8cae06.json";
import entityDefinitionPublisher from "../../src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/7a939fe8-d119-4e7f-ab94-95b2aae30db9.json";
import entityDefinitionAuthor from "../../src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b30b7180-f7dc-4cca-b4e8-e476b77fe61d.json";
import entityDefinitionCountry from "../../src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/56628e31-3db5-4c5c-9328-4ff7ce54c36a.json";

import menuDefaultLibrary from "../../src/assets/library_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json";

import reportAuthorDetails from "../../src/assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/6d9faa54-643c-4aec-87c3-32635ad95902.json";
import reportBookDetails from "../../src/assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c3503412-3d8a-43ef-a168-aa36e975e606.json";
import reportCountryList from "../../src/assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/08176cc7-43ae-4fca-91b7-bf869d19e4b9.json";

import folio from "../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/1f550a2a-33f5-4a56-83ee-302701039494.json";
import penguin from "../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/516a7366-39e7-4998-82cb-80199a7fa667.json";
import springer from "../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/c1c97d54-aba8-4599-883a-7fe8f3874095.json";
import author1 from "../../src/assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/4441169e-0c22-4fbc-81b2-28c87cf48ab2.json";
import author2 from "../../src/assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/ce7b601d-be5f-4bc6-a5af-14091594046a.json";
import author3 from "../../src/assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17.json";
import author4 from "../../src/assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/e4376314-d197-457c-aa5e-d2da5f8d5977.json";
import book1 from "../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f.json";
import book2 from "../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/e20e276b-619d-4e16-8816-b7ec37b53439.json";
import book3 from "../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/4cb917b3-3c53-4f9b-b000-b0e4c07a81f7.json";
import book4 from "../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/6fefa647-7ecf-4f83-b617-69d7d5094c37.json";
import book5 from "../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c97be567-bd70-449f-843e-cd1d64ac1ddd.json";
import book6 from "../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c6852e89-3c3c-447f-b827-4b5b9d830975.json";
import Country1 from "../../src/assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/2eda1207-4dcc-4af9-a3ba-ef75e7f12c11.json";
import Country2 from "../../src/assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/30b8e7c6-b75d-4db0-906f-fa81fa5c4cc0.json";
import Country3 from "../../src/assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/b62fc20b-dcf5-4e3b-a247-62d0475cf60f.json";
import Country4 from "../../src/assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/b6ddfb89-4301-48bf-9ed9-4ed6ee9261fe.json";
import publisher1 from "../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/1f550a2a-33f5-4a56-83ee-302701039494.json";
import publisher2 from "../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/516a7366-39e7-4998-82cb-80199a7fa667.json";
import publisher3 from "../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/c1c97d54-aba8-4599-883a-7fe8f3874095.json";

// import {
//   Action2Error,
//   Action2Success,
//   author1,
//   author2,
//   author3,
//   book1,
//   book2,
//   book4,
//   book5,
//   book6,
//   defaultMiroirMetaModel,
//   entityAuthor,
//   entityBook,
//   entityDefinitionAuthor,
//   entityDefinitionBook,
//   entityDefinitionPublisher,
//   entityPublisher,
//   getBasicApplicationConfiguration,
//   getBasicStoreUnitConfiguration,
//   ignorePostgresExtraAttributes,
//   InitApplicationParameters,
//   MetaEntity,
//   PersistenceStoreController,
//   publisher1,
//   publisher2,
//   publisher3,
//   TestSuiteContext,
//   displayTestSuiteResults,
//   Uuid,
// } from "miroir-core";
import {
  runTransformerTestSuite,
  transformerTestsDisplayResults,
  testSuites,
  TransformerTest,
  transformerTestSuite_miroirTransformers,
  TransformerTestSuite,
  currentTestSuite,
} from "../2_domain/transformersTests_miroir.data";
import { MetaEntity, Uuid } from '../../src/0_interfaces/1_core/EntityDefinition.js';
import {
  InitApplicationParameters,
  PersistenceStoreAdminSectionInterface,
} from "../../src/0_interfaces/4-services/PersistenceStoreControllerInterface.js";
import { PersistenceStoreController } from '../../src/4_services/PersistenceStoreController.js';
import { getBasicApplicationConfiguration, getBasicStoreUnitConfiguration } from '../../src/2_domain/Deployment.js';
import { defaultMiroirMetaModel } from '../../src/1_core/Model.js';
import { TestSuiteContext } from '../../src/4_services/TestSuiteContext.js';
import {
  Action2Error,
  Action2ReturnType,
  Action2Success,
  Domain2ElementFailed,
  Domain2QueryReturnType,
} from "../../src/0_interfaces/2_domain/DomainElement.js";
import { ignorePostgresExtraAttributes } from '../../src/4_services/otherTools.js';
import { transformer_apply_wrapper, transformer_extended_apply_wrapper } from '../../src/2_domain/TransformersForRuntime.js';
import { transformerTestSuite_spreadsheet } from '../2_domain/transformersTests_spreadsheet.data.js';
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
let sqlDbDataStore: SqlDbDataStoreSection;
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

    // sqlDbDataStore = new SqlDbDataStoreSection("data", sqlDbStoreName, connectionString, schema);
    // sqlDbModelStore = new SqlDbModelStoreSection("model", sqlDbStoreName, connectionString, schema, sqlDbDataStore);

    await persistenceStoreController.initApplication(
      defaultMiroirMetaModel,
      "miroir",
      testApplicationConfig.selfApplication,
      testApplicationConfig.applicationModelBranch,
      testApplicationConfig.applicationVersion
    );

    await persistenceStoreController.handleAction({
      actionType: "modelAction",
      actionName: "resetModel",
      actionLabel: "resetTestStore",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: paramAdminConfigurationDeploymentUuid,
    });
    await persistenceStoreController.handleAction({
      actionType: "modelAction",
      actionName: "initModel",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: paramAdminConfigurationDeploymentUuid,
      params: {
        dataStoreType: "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
        metaModel: defaultMiroirMetaModel,
        // TODO: this is wrong, selfApplication, selfApplication version, etc. must be passed as parameters!!!!!!!!!!!!!!!!!!!!
        selfApplication: testApplicationConfig.selfApplication,
        applicationModelBranch: testApplicationConfig.applicationModelBranch,
        applicationVersion: testApplicationConfig.applicationVersion,
      },
    });
    // }, defaultMiroirMetaModel);
    await persistenceStoreController.handleAction({
      actionType: "modelAction",
      actionName: "createEntity",
      actionLabel: "CreateLibraryStoreEntities",
      deploymentUuid: paramAdminConfigurationDeploymentUuid,
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      entities: libraryEntitesAndInstances,
    });
    await persistenceStoreController.handleAction({
      actionType: "instanceAction",
      actionName: "createInstance",
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
    await persistenceStoreController.deleteStore(testStoreConfig.data);
    await persistenceStoreController.deleteStore(testStoreConfig.model);
    await persistenceStoreController.deleteStore(testStoreConfig.admin);
    await persistenceStoreController.close();
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

function isJson(t:any) {
  // return t == "json" || t == "json_array" || t == "tableOf1JsonColumn";
  return typeof t == "object" && t !== null;
}

// ################################################################################################
async function runTransformerIntegrationTest(vitest: any, testNameArray: string[], transformerTest: TransformerTest) {
  const testSuitePathName = TestSuiteContext.testSuitePathName(testNameArray);
  const testRunStep = transformerTest.runTestStep ?? "runtime";
  // const runAsSql = false;
  const runAsSql = true;

  console.log("runTransformerIntegrationTest called for", testSuitePathName, "START");

  let queryResult: Action2ReturnType;
  console.log("runTransformerIntegrationTest", testSuitePathName, "running runtime on sql transformerTest", transformerTest);

  // resolve the transformer to be used in the test
  const resolvedTransformer:Domain2QueryReturnType<TransformerForRuntime> = transformer_extended_apply_wrapper(
    "build",
    (transformerTest.transformer as any)?.label,
    transformerTest.transformer,
    transformerTest.transformerParams,
    transformerTest.transformerRuntimeContext ?? {},
    'value', // resolveBuildTransformerTo
  );

  console.log("runTransformerIntegrationTest", testSuitePathName, "resolvedTransformer", JSON.stringify(resolvedTransformer, null, 2));

  if (resolvedTransformer instanceof Domain2ElementFailed) {
    console.log("runTransformerIntegrationTest", testSuitePathName, "build step found failed: resolvedTransformer", resolvedTransformer);
    try {
      const resultToCompare = ignorePostgresExtraAttributes(resolvedTransformer as any, transformerTest.ignoreAttributes);

      vitest.expect(resultToCompare, testSuitePathName).toEqual(transformerTest.expectedValue);
      TestSuiteContext.setTestAssertionResult({
        assertionName: testSuitePathName,
        assertionResult: "ok",
      });
    } catch (error) {
      TestSuiteContext.setTestAssertionResult({
        assertionName: testSuitePathName,
        assertionResult: "error",
        assertionExpectedValue: transformerTest.expectedValue,
        assertionActualValue: resolvedTransformer,
      });
    }
    return;
  }

  if (testRunStep == "build") {
    queryResult = {
      status: "ok",
      returnedDomainElement: resolvedTransformer as any
    };
  } else {
    queryResult = await sqlDbDataStore.handleBoxedQueryAction({
      actionType: "runBoxedQueryAction",
      actionName: "runQuery",
      deploymentUuid: "",
      endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
      applicationSection: "data",
      query: {
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        runAsSql,
        pageParams: {},
        queryParams: {
          ...transformerTest.transformerParams,
          ...transformerTest.transformerRuntimeContext,
        },
        contextResults: runAsSql
          ? Object.fromEntries(
              // there's a trick for runAsSql in order to be able to test transformers taking context parameters
              Object.entries(transformerTest.transformerRuntimeContext ?? {}).map(
                (e: [string, any]) => [
                  e[0],
                  {
                    type: isJson(e[1]) ? "json" : typeof e[1],
                  },
                ]
              )
            )
          : transformerTest.transformerRuntimeContext ?? {},
        deploymentUuid: "",
        runtimeTransformers: {
          // transformer: (transformerTest as any).transformer,
          transformer: resolvedTransformer,
        },
      },
    });
  }

  // console.log(testSuitePathName, "WWWWWWWWWWWWWWWWWW queryResult", JSON.stringify(queryResult, null, 2));
  console.log(testSuitePathName, "WWWWWWWWWWWWWWWWWW queryResult", JSON.stringify(queryResult, null, 2));
  // console.log(testSuitePathName, "WWWWWWWWWWWWWWWWWW queryResult cannot use 'instanceof' to determine error", queryResult instanceof Action2Error, Object.hasOwn(queryResult,"errorType"));
  let resultToCompare: any
  try {
      // if (queryResult instanceof Action2Error) { // DOES NOT WORK, because we use the local version of the class, not the version of the class that is available in the miroir-core package
      if (queryResult["status"] == "error") { // cannot use 'instanceof' to determine error because we use the local version of the class, not the version of the class that is available in the miroir-core package
      resultToCompare = ignorePostgresExtraAttributes((queryResult as any).innerError, transformerTest.ignoreAttributes);
      console.log(
        testSuitePathName,
        "WWWWWWWWWWWWWWWWWW queryResult instance of Action2Error:",
        JSON.stringify(resultToCompare, null, 2)
      );

      vitest
        .expect(
          resultToCompare,
          testSuitePathName + "comparing received query error to expected result"
        )
        .toEqual(transformerTest.expectedValue);
    } else {
      console.log(
        testSuitePathName,
        "WWWWWWWWWWWWWWWWWW query Succeeded!"
      );
      resultToCompare =
        testRunStep == "runtime"
          ? ignorePostgresExtraAttributes(
              (queryResult as Action2Success).returnedDomainElement.transformer,
              transformerTest.ignoreAttributes
            )
          : (queryResult as Action2Success).returnedDomainElement;
      console.log(testSuitePathName, "testResult", JSON.stringify(resultToCompare, null, 2));
      console.log(testSuitePathName, "expectedValue", transformerTest.expectedValue);
      vitest.expect(resultToCompare, testSuitePathName).toEqual(transformerTest.expectedValue);
    }
    TestSuiteContext.setTestAssertionResult({
      assertionName: testSuitePathName,
      assertionResult: "ok",
    });
  } catch (error) {
    TestSuiteContext.setTestAssertionResult({
      assertionName: testSuitePathName,
      assertionResult: "error",
      assertionExpectedValue: transformerTest.expectedValue,
      assertionActualValue: resultToCompare,
    });
  }

  console.log(testNameArray, "END");
}

// (async () => {
if (RUN_TEST == testSuiteName) {
  await beforeAll(); // beforeAll is a function, not the call to the jest/vitest hook
  // await runTransformerTestSuite(vitest, [], transformerTestSuite_miroirTransformers, runTransformerIntegrationTest);
  await runTransformerTestSuite(vitest, [], currentTestSuite, runTransformerIntegrationTest);
} else {
  console.log("################################ skipping test suite:", testSuiteName, "RUN_TEST=", RUN_TEST);
}
// })()

  // // ################################################################################################
  // it("build custom UuidIndex object from object list with runtime transformer", async () => { // TODO: test failure cases!
  //     console.log("build custom UuidIndex object from object list with runtime transformer START")
  //     // const newApplicationName = "test";
  //     // const newUuid = uuidv4();

  //     const uniqueRuntimeTemplate:TransformerForRuntime = {
  //       transformerType: "listReducerToIndexObject",
  //       interpolation: "runtime",
  //       referencedTransformer: "countries",
  //       indexAttribute: "uuid",
  //     }

  //     // const preTestResult: {[k: string]: {[l:string]: any}} = transformer_apply(
  //     const preTestResult: {[k: string]: {[l:string]: any}} = transformer_apply(
  //       "runtime",
  //       undefined,
  //       // uniqueRuntimeTemplate,
  //       uniqueRuntimeTemplate as any,
  //       {
  //         // newUuid: newUuid ,
  //       }, // queryParams
  //       {
  //         countries: [
  //             Country1 as EntityInstance,
  //             Country2 as EntityInstance,
  //             Country3 as EntityInstance,
  //             Country4 as EntityInstance,
  //         ],
  //       } // context
  //     );

  // console.log("################################", expect.getState().currentTestName, "preTestResult", preTestResult)
      // expect(testResult).toEqual(
  //       {
  //         [Country1.uuid]: Country1 as EntityInstance,
  //         [Country2.uuid]: Country2 as EntityInstance,
  //         [Country3.uuid]: Country3 as EntityInstance,
  //         [Country4.uuid]: Country4 as EntityInstance,
  //       }
  //       // [
  //       //   { name: 'US' },
  //       //   { name: 'DE' },
  //       //   { name: 'FR' },
  //       //   { name: 'GB' },
  //       // ]
  //     );
  //     console.log(expect.getState().currentTestName, "END")
  //   }
  // );

  // // ################################################################################################
  // it("objectDynamicAccess: object dynamic access runtime transformer", async () => {
  //   // TODO: test failure cases!
  //   console.log(expect.getState().currentTestName, "START")
  //   const newApplicationName = "test";
  //   const newUuid = uuidv4();

  //   const uniqueBuildTemplate: TransformerForBuild = {
  //     transformerType: "objectDynamicAccess",
  //     objectAccessPath: [
  //       {
  //         transformerType: "contextReference",
  //         referenceName: "municipalitiesIndexedByName",
  //       },
  //       {
  //         transformerType: "objectDynamicAccess",
  //         objectAccessPath: [
  //           {
  //             transformerType: "contextReference",
  //             referenceName: "fountain",
  //           },
  //           "Commune",
  //         ]
  //       }
  //     ]
  //   };

  //   const preTestResult: { [k: string]: { [l: string]: any } } = transformer_apply(
  //     "build",
  //     undefined,
  //     uniqueBuildTemplate as any,
  //     {
  //       // newUuid: newUuid,
  //     }, // queryParams
  //     {
  //       municipalitiesIndexedByName: {
  //         "PARIS 20EME ARRONDISSEMENT": {
  //           parentUuid: "f6de3d66-37ee-42ac-bb81-72973222f006",
  //           uuid: "33f90390-cc41-4d7a-ab3a-0cfad11e428c",
  //           name: "PARIS 20EME ARRONDISSEMENT",
  //         },
  //         "PARIS 12EME ARRONDISSEMENT": {
  //           parentUuid: "f6de3d66-37ee-42ac-bb81-72973222f006",
  //           uuid: "0ed8a80e-7d88-45bc-8323-b1387a0e88d6",
  //           name: "PARIS 12EME ARRONDISSEMENT",
  //         },
  //         "PARIS 19EME ARRONDISSEMENT": {
  //           parentUuid: "f6de3d66-37ee-42ac-bb81-72973222f006",
  //           uuid: "be47e605-cafb-4ecb-b238-166ad38ba7f6",
  //           name: "PARIS 19EME ARRONDISSEMENT",
  //         },
  //         "PARIS 10EME ARRONDISSEMENT": {
  //           parentUuid: "f6de3d66-37ee-42ac-bb81-72973222f006",
  //           uuid: "9e54eafe-566f-4104-a577-3377f2826f17",
  //           name: "PARIS 10EME ARRONDISSEMENT",
  //         },
  //         "PARIS 5EME ARRONDISSEMENT": {
  //           parentUuid: "f6de3d66-37ee-42ac-bb81-72973222f006",
  //           uuid: "895d601f-77ad-4450-9eaa-8aba5adcbe7e",
  //           name: "PARIS 5EME ARRONDISSEMENT",
  //         },
  //         "PARIS 15EME ARRONDISSEMENT": {
  //           parentUuid: "f6de3d66-37ee-42ac-bb81-72973222f006",
  //           uuid: "1e5f01a2-5e3b-4c7f-996e-6db79ca49585",
  //           name: "PARIS 15EME ARRONDISSEMENT",
  //         },
  //         "PARIS 14EME ARRONDISSEMENT": {
  //           parentUuid: "f6de3d66-37ee-42ac-bb81-72973222f006",
  //           uuid: "987269be-829b-4cd1-96bb-33dffed9ad6b",
  //           name: "PARIS 14EME ARRONDISSEMENT",
  //         },
  //         "PARIS 16EME ARRONDISSEMENT": {
  //           parentUuid: "f6de3d66-37ee-42ac-bb81-72973222f006",
  //           uuid: "cc725af0-df42-4293-84ca-14edafdf9147",
  //           name: "PARIS 16EME ARRONDISSEMENT",
  //         },
  //         "PARIS 13EME ARRONDISSEMENT": {
  //           parentUuid: "f6de3d66-37ee-42ac-bb81-72973222f006",
  //           uuid: "50479755-c8a4-4dd9-b870-67ebb6a763ed",
  //           name: "PARIS 13EME ARRONDISSEMENT",
  //         },
  //         "PARIS 18EME ARRONDISSEMENT": {
  //           parentUuid: "f6de3d66-37ee-42ac-bb81-72973222f006",
  //           uuid: "ec9f6fb8-7de4-4757-ae92-8e95b3bc2434",
  //           name: "PARIS 18EME ARRONDISSEMENT",
  //         },
  //       },
  //       fountain: {
  //         Voie: "BOULEVARD DE BELLEVILLE",
  //         uuid: "16bbf3cf-6550-4823-989a-a10f67c0f377",
  //         Commune: "PARIS 20EME ARRONDISSEMENT",
  //         Modèle: "GHM Ville de Paris",
  //         geo_shape: '{"coordinates":[2.381807425006663,48.86840357208106],"type":"Point"}',
  //         "Type Objet": "BORNE_FONTAINE",
  //         parentName: "Fountain",
  //         parentUuid: "26a8fdde-a70c-4f22-9d62-1f49ed09041e",
  //         Identifiant: "450080676",
  //         geo_point_2d: "48.86840357208106, 2.381807425006663",
  //         "N° Voie Pair": "36",
  //         Disponibilité: "OUI",
  //         "N° Voie Impair": null,
  //         "Fin Indisponibilité": null,
  //         "Motif Indisponibilité": null,
  //         "Début Indisponibilité": null,
  //         Municipality: null,
  //         createdAt: "2024-10-01T20:28:59.705Z",
  //         updatedAt: "2024-10-01T20:28:59.705Z",
  //       },
  //     } // context
  //   );

  //   console.log(
    // console.log("################################", expect.getState().currentTestName, "preTestResult", preTestResult)
    //     undefined,
  //     uniqueBuildTemplate as any,
  //     {
  //       // newUuid: newUuid,
  //     }, // queryParams
  //     {
  //       municipalitiesIndexedByName: {
  //         "PARIS 20EME ARRONDISSEMENT": {
  //           parentUuid: "f6de3d66-37ee-42ac-bb81-72973222f006",
  //           uuid: "33f90390-cc41-4d7a-ab3a-0cfad11e428c",
  //           name: "PARIS 20EME ARRONDISSEMENT",
  //         },
  //         "PARIS 12EME ARRONDISSEMENT": {
  //           parentUuid: "f6de3d66-37ee-42ac-bb81-72973222f006",
  //           uuid: "0ed8a80e-7d88-45bc-8323-b1387a0e88d6",
  //           name: "PARIS 12EME ARRONDISSEMENT",
  //         },
  //       },
  //       fountains: [
  //         {
  //           Voie: "PLACE FELIX EBOUE",
  //           uuid: "de79cf8b-60f6-45ad-a4f2-9e373c84d231",
  //           Commune: "PARIS 12EME ARRONDISSEMENT",
  //           Modèle: "Fontaine Arceau",
  //           geo_shape: '{"coordinates":[2.394950933604463,48.840063263659],"type":"Point"}',
  //           "Type Objet": "FONTAINE_ARCEAU",
  //           parentName: "Fountain",
  //           parentUuid: "26a8fdde-a70c-4f22-9d62-1f49ed09041e",
  //           Identifiant: "450072983",
  //           geo_point_2d: "48.840063263659, 2.394950933604463",
  //           "N° Voie Pair": null,
  //           Disponibilité: "OUI",
  //           "N° Voie Impair": null,
  //           "Fin Indisponibilité": null,
  //           "Motif Indisponibilité": null,
  //           "Début Indisponibilité": null,
  //           Municipality: null,
  //           createdAt: "2024-10-01T20:28:59.748Z",
  //           updatedAt: "2024-10-01T20:28:59.748Z",
  //         },
  //         {
  //           Voie: "BOULEVARD DE BELLEVILLE",
  //           uuid: "16bbf3cf-6550-4823-989a-a10f67c0f377",
  //           Commune: "PARIS 20EME ARRONDISSEMENT",
  //           Modèle: "GHM Ville de Paris",
  //           geo_shape: '{"coordinates":[2.381807425006663,48.86840357208106],"type":"Point"}',
  //           "Type Objet": "BORNE_FONTAINE",
  //           parentName: "Fountain",
  //           parentUuid: "26a8fdde-a70c-4f22-9d62-1f49ed09041e",
  //           Identifiant: "450080676",
  //           geo_point_2d: "48.86840357208106, 2.381807425006663",
  //           "N° Voie Pair": "36",
  //           Disponibilité: "OUI",
  //           "N° Voie Impair": null,
  //           "Fin Indisponibilité": null,
  //           "Motif Indisponibilité": null,
  //           "Début Indisponibilité": null,
  //           Municipality: null,
  //           createdAt: "2024-10-01T20:28:59.705Z",
  //           updatedAt: "2024-10-01T20:28:59.705Z",
  //         },
  //       ],
  //     } // context
  //   );

  // console.log("################################", expect.getState().currentTestName, "preTestResult", preTestResult)
  //     "################################ alter existing object list with mapperListToList-objectAlter with object dynamic access runtime transformer testResult",
  //     testResult
  //   );
  //   expect(testResult).toEqual(
  //     [
  //       {
  //         Voie: "PLACE FELIX EBOUE",
  //         uuid: "de79cf8b-60f6-45ad-a4f2-9e373c84d231",
  //         Commune: "PARIS 12EME ARRONDISSEMENT",
  //         Modèle: "Fontaine Arceau",
  //         geo_shape: '{"coordinates":[2.394950933604463,48.840063263659],"type":"Point"}',
  //         "Type Objet": "FONTAINE_ARCEAU",
  //         parentName: "Fountain",
  //         parentUuid: "26a8fdde-a70c-4f22-9d62-1f49ed09041e",
  //         Identifiant: "450072983",
  //         geo_point_2d: "48.840063263659, 2.394950933604463",
  //         "N° Voie Pair": null,
  //         Disponibilité: "OUI",
  //         "N° Voie Impair": null,
  //         "Fin Indisponibilité": null,
  //         "Motif Indisponibilité": null,
  //         "Début Indisponibilité": null,
  //         Municipality: "0ed8a80e-7d88-45bc-8323-b1387a0e88d6",
  //         createdAt: "2024-10-01T20:28:59.748Z",
  //         updatedAt: "2024-10-01T20:28:59.748Z",
  //       },
  //       {
  //         Voie: "BOULEVARD DE BELLEVILLE",
  //         uuid: "16bbf3cf-6550-4823-989a-a10f67c0f377",
  //         Commune: "PARIS 20EME ARRONDISSEMENT",
  //         Modèle: "GHM Ville de Paris",
  //         geo_shape: '{"coordinates":[2.381807425006663,48.86840357208106],"type":"Point"}',
  //         "Type Objet": "BORNE_FONTAINE",
  //         parentName: "Fountain",
  //         parentUuid: "26a8fdde-a70c-4f22-9d62-1f49ed09041e",
  //         Identifiant: "450080676",
  //         geo_point_2d: "48.86840357208106, 2.381807425006663",
  //         "N° Voie Pair": "36",
  //         Disponibilité: "OUI",
  //         "N° Voie Impair": null,
  //         "Fin Indisponibilité": null,
  //         "Motif Indisponibilité": null,
  //         "Début Indisponibilité": null,
  //         Municipality: "33f90390-cc41-4d7a-ab3a-0cfad11e428c",
  //         createdAt: "2024-10-01T20:28:59.705Z",
  //         updatedAt: "2024-10-01T20:28:59.705Z",
  //       },
  //     ]
  //   );
  //   console.log(expect.getState().currentTestName, "END")
  // });



  



    

  // // ################################################################################################
  // it("build an EntityDefinition from spreadsheet with transformers", async () => { // TODO: test failure cases!
  //   console.log(expect.getState().currentTestName, "START")
  //   const newApplicationName = "test";
  //   const newUuid = uuidv4();

  //   // const extractColumnDefinitionRow:TransformerForRuntime = {
  //   //   transformerType: "listPickElement",
  //   //   interpolation: "runtime",
  //   //   referencedTransformer: "fileData",
  //   //   index: 0
  //   // }
  //   const fileData:any[] = [
  //     {a: "A", b: "B"},
  //     {a: "1", b: "2"},
  //     {a: "3", b: "4"},
  //   ];

  //   // const columnDefinitionRow = transformer_apply(
  //   //   "runtime",
  //   //   undefined,
  //   //   // extractColumnDefinitionRow,
  //   //   {
  //   //     transformerType: "listPickElement",
  //   //     interpolation: "runtime",
  //   //     referencedTransformer: "fileData",
  //   //     index: 0
  //   //   },
  //   //   {
  //   //     newUuid: newUuid,
  //   //   }, // queryParams
  //   //   {
  //   //     fileData: [
  //   //       {a: "A", b: "B"},
  //   //       {a: "1", b: "2"},
  //   //       {a: "3", b: "4"},
  //   //     ],
  //   //   } // context
  //   // );

  //   const uniqueRuntimeTemplate: TransformerForBuild = {
  //     transformerType: "dataflowObject",
  //     definition: {
  //       fileData: {
  //         transformerType: "parameterReference",
  //         referenceName: "fileData",
  //       },
  //       columns: {
  //         transformerType: "dataflowObject",
  //         definition: {
  //           columnDefinitionRowObject: {
  //             transformerType: "listPickElement",
  //             label: "selectColumnDefinitionRowFromSpreadsheet",
  //             referencedTransformer: "fileData",
  //             index: 0,
  //           },
  //           columnDefinitionRowEntries: {
  //             transformerType: "objectEntries",
  //             label: "extractEntriesForColumnDefinitionObject",
  //             referencedTransformer: {
  //               transformerType: "contextReference",
  //               referencePath: ["columns", "columnDefinitionRowObject"],
  //             },
  //           },
  //           columnDefinitionRowNames: {
  //             transformerType: "mapperListToList",
  //             label: "selectColumnNamesAsStrings",
  //             referencedTransformer: {
  //               transformerType: "contextReference",
  //               referencePath: ["columns", "columnDefinitionRowEntries"],
  //             },
  //             referenceToOuterObject: "columnDefinitionRowEntry",
  //             elementTransformer: {
  //               transformerType: "listPickElement",
  //               label: "selectColumnNamesAsString",
  //               referencedTransformer: "columnDefinitionRowEntry",
  //               index: 1,
  //             },
  //           }
  //         },
  //       },
  //       schema: {
  //         transformerType: "dataflowObject",
  //         definition: {
  //           // type: {
  //           //   transformerType: "constantString",
  //           //   value: "object",
  //           // },
  //           arrayOfArrayAttributeDefinitions: {
  //             transformerType: "mapperListToList",
  //             label: "mapColumnNamesToAttributes",
  //             referencedTransformer: {
  //               transformerType: "contextReference",
  //               referencePath: ["columns", "columnDefinitionRowNames"],
  //             },
  //             referenceToOuterObject: "attributeName",
  //             elementTransformer: {
  //               transformerType: "object_fullTemplate",
  //               referencedTransformer: "attributeName",
  //               definition: [
  //                 {
  //                   attributeKey: {
  //                     transformerType: "contextReference",
  //                     referenceName: "attributeName",
  //                   },
  //                   attributeValue: {
  //                     transformerType: "freeObjectTemplate",
  //                     definition: {
  //                       type: "string",
  //                       optional: true,
  //                       tag: {
  //                         id: 2,
  //                         defaultLabel: {
  //                           transformerType: "contextReference",
  //                           referenceName: "attributeName",
  //                         },
  //                         editable: true,
  //                       },
  //                     } as any,
  //                   },
  //                 },
  //               ],
  //             },
  //           },
  //           arrayOfAttributeDefinitions: {
  //             transformerType: "mapperListToList",
  //             label: "extractAttributeDefinitions",
  //             referencedTransformer: {
  //               transformerType: "contextReference",
  //               referencePath: ["schema", "arrayOfArrayAttributeDefinitions"],
  //             },
  //             referenceToOuterObject: "attributeDefinitionArray",
  //             elementTransformer: {
  //               transformerType: "listPickElement",
  //               label: "selectAttributeDefinition",
  //               referencedTransformer: "attributeDefinitionArray",
  //               index: 0,
  //             },
  //           },
  //           // objectAttributeDefinitions: {
  //           //   transformerType: "listReducerToIndexObject",
  //           //   label: "mapAttributeDefinitionsToObject",
  //           //   referencedTransformer: {
  //           //     transformerType: "contextReference",
  //           //     referencePath: ["schema", "arrayOfAttributeDefinitions"],
  //           //   },
  //           // }
  //           // entityJzodSchema: {
  //           //   transformerType: "freeObjectTemplate",
  //           //   definition: {
  //           //     type: "object",
  //           //     definition: {
  //           //       transformerType: "listReducerToIndexObject",
  //           //       // transformerType: "contextReference",
  //           //       // referencePath: ["schema", "arrayOfAttributeDefinitions"],
  //           //     },
  //           //   },
  //           // }
  //         }
  //       }
  //     },
  //   };
  //   // {
  //   //   transformerType: "mapperListToList",
  //   //   referencedTransformer: {
  //   //     transformerType: "mapperListToList",
  //   //     referencedTransformer: {
  //   //       transformerType: "objectEntries",
  //   //       label: "extractEntriesForColumnDefinitionObject",
  //   //       referencedTransformer: {
  //   //         transformerType: "listPickElement",
  //   //         label: "selectColumnDefinitionRowFromSpreadsheet",
  //   //         referencedTransformer: "fileData",
  //   //         index: 0,
  //   //       },
  //   //     },
  //   //     referenceToOuterObject: "columnDefinition",
  //   //     elementTransformer: {
  //   //       transformerType: "listPickElement",
  //   //       label: "selectColumnNamesAsStrings",
  //   //       referencedTransformer: "columnDefinition",
  //   //       index: 1,
  //   //     },
  //   //   },
  //   //   referenceToOuterObject: "attributeName",
  //   //   elementTransformer: {
  //   //     transformerType: "object_fullTemplate",
  //   //     referencedTransformer: "attributeName",
  //   //     definition: [
  //   //       {
  //   //         attributeKey: {
  //   //           transformerType: "contextReference",
  //   //           referenceName: "attributeName",
  //   //         },
  //   //         attributeValue: {
  //   //           transformerType: "freeObjectTemplate",
  //   //           definition: {
  //   //             type: "string",
  //   //             optional: true,
  //   //             tag: {
  //   //               id: 2,
  //   //               defaultLabel: {
  //   //                 transformerType: "contextReference",
  //   //                 referenceName: "attributeName",
  //   //               },
  //   //               editable: true,
  //   //             },
  //   //           } as any,
  //   //         },
  //   //       },
  //   //     ],
  //   //   },
  //   // };


  //       // transformerType: "innerFullObjectTemplate",
  //       // referenceToOuterObject: "columnDefinition",
  //       // definition: [
  //       //   {
  //       //     attributeKey: {
  //       //       transformerType: "",
  //       //       objectAccessPath: 
  //       //       definition: "{{columnDefinition}}"
  //       //     },
  //       //     attributeValue: newDeploymentStoreConfigurationTemplate
  //       //   }
  //       // ]

  // // Municipality: {
  // //             transformerType: "objectDynamicAccess",
  // //             objectAccessPath: [
  // //               {
  // //                 transformerType: "contextReference",
  // //                 referenceName: "municipalitiesIndexedByName",
  // //               },
  // //               {
  // //                 transformerType: "objectDynamicAccess",
  // //                 objectAccessPath: [
  // //                   {
  // //                     transformerType: "contextReference",
  // //                     referenceName: "fountain",
  // //                   },
  // //                   "Commune",
  // //                 ],
  // //               },
  // //               "uuid"
  // //             ],
  // //           },
  //         // },
  //       // },
  //     // }
  //   // }

  //   const preTestResult: { [k: string]: { [l: string]: any } } = transformer_apply(
  //     "build",
  //     undefined,
  //     uniqueRuntimeTemplate as any,
  //     {
  //       newUuid: newUuid,
  //       fileData,
  //     }, // queryParams
  //     {
  //       // columnDefinitionRow,
  //     } // context
  //   );

  //   console.log("################################", expect.getState().currentTestName, "preTestResult", JSON.stringify(preTestResult, null, 2))
  //   // const testResult = ignorePostgresExtraAttributesOnList(preTestResult as any,["uuid"]); // uuid value is ignored
  //   const testResult = preTestResult; // uuid value is ignored
  // // console.log("################################", expect.getState().currentTestName, "testResult", preTestResult)
  //   expect(testResult).toEqual(
  //     // {a: "A", b: "B"},
  //     {
  //       fileData,
  //       columns: {
  //         columnDefinitionRowObject: { a: "A", b: "B" },
  //         columnDefinitionRowEntries: [
  //           ["a", "A"],
  //           ["b", "B"],
  //         ],
  //         columnDefinitionRowNames: ["A", "B"],
  //       },
  //       schema: {
  //         arrayOfArrayAttributeDefinitions: [
  //           [
  //             {
  //               A: {
  //                 type: "string",
  //                 optional: true,
  //                 tag: {
  //                   id: 2,
  //                   defaultLabel: "A",
  //                   editable: true,
  //                 },
  //               },
  //             },
  //           ],
  //           [
  //             {
  //               B: {
  //                 type: "string",
  //                 optional: true,
  //                 tag: {
  //                   id: 2,
  //                   defaultLabel: "B",
  //                   editable: true,
  //                 },
  //               },
  //             },
  //           ],
  //         ],
  //         arrayOfAttributeDefinitions: [
  //           {
  //             A: {
  //               type: "string",
  //               optional: true,
  //               tag: {
  //                 id: 2,
  //                 defaultLabel: "A",
  //                 editable: true,
  //               },
  //             },
  //           },
  //           {
  //             B: {
  //               type: "string",
  //               optional: true,
  //               tag: {
  //                 id: 2,
  //                 defaultLabel: "B",
  //                 editable: true,
  //               },
  //             },
  //           },
  //         ],
  //         // entityJzodSchema: {
  //         //   type: "object",
  //         //   definition: {
  //         //     A: {
  //         //       type: "string",
  //         //       optional: true,
  //         //       tag: {
  //         //         id: 2,
  //         //         defaultLabel: "A",
  //         //         editable: true,
  //         //       },
  //         //     },
  //         //     B: {
  //         //       type: "string",
  //         //       optional: true,
  //         //       tag: {
  //         //         id: 2,
  //         //         defaultLabel: "B",
  //         //         editable: true,
  //         //       },
  //         //     },
  //         //   },
  //         // },


  //         // type: "object",
  //         // definition: {
  //         //   A: {
  //         //     type: "string",
  //         //     optional: true,
  //         //     tag: {
  //         //       id: 2,
  //         //       defaultLabel: "A",
  //         //       editable: true,
  //         //     },
  //         //   },
  //         //   B: {
  //         //     type: "string",
  //         //     optional: true,
  //         //     tag: {
  //         //       id: 2,
  //         //       defaultLabel: "B",
  //         //       editable: true,
  //         //     },
  //         //   },
  //         // },
  //       },
  //       //   type: "object",
  //       //   definition: {
  //       //     // uuid: {
  //       //     //   type: "string",
  //       //     //   validations: [
  //       //     //     {
  //       //     //       type: "uuid",
  //       //     //     },
  //       //     //   ],
  //       //     //   tag: {
  //       //     //     id: 1,
  //       //     //     defaultLabel: "Uuid",
  //       //     //     editable: false,
  //       //     //   },
  //       //     // },
  //       //     // parentName: {
  //       //     //   type: "string",
  //       //     //   optional: true,
  //       //     //   tag: {
  //       //     //     id: 1,
  //       //     //     defaultLabel: "Uuid",
  //       //     //     editable: false,
  //       //     //   },
  //       //     // },
  //       //     // parentUuid: {
  //       //     //   type: "string",
  //       //     //   validations: [
  //       //     //     {
  //       //     //       type: "uuid",
  //       //     //     },
  //       //     //   ],
  //       //     //   tag: {
  //       //     //     id: 1,
  //       //     //     defaultLabel: "parentUuid",
  //       //     //     editable: false,
  //       //     //   },
  //       //     // },
  //       // A: {
  //       //   type: "string",
  //       //   optional: true,
  //       //   tag: {
  //       //     id: 2,
  //       //     defaultLabel: "A",
  //       //     editable: true,
  //       //   },
  //       // },
  //       // B: {
  //       //   type: "string",
  //       //   optional: true,
  //       //   tag: {
  //       //     id: 3,
  //       //     defaultLabel: "B",
  //       //     editable: true,
  //       //   },
  //       // },
  //     }
  //     // }
  //   );

  //   const sqlQuery = sqlStringForRuntimeTransformer(
  //     {
  //       transformerType: "listPickElement",
  //       interpolation: "runtime",
  //       referencedTransformer: "Fountains",
  //       index: 0,
  //     }
  //     // {}, // queryParams
  //     // {}, // newFetchedData
  //     // {}, // extractors
  //   );
  //   console.log("################################", expect.getState().currentTestName, "sqlQuery", JSON.stringify(sqlQuery, null, 2))
  //   console.log(expect.getState().currentTestName, "END")
  // }
  // );

// });
