import { v4 as uuidv4 } from "uuid";
import { describe, expect } from 'vitest';
import * as vitest from 'vitest';

import {
  DomainAction,
  EntityInstance,
  StoreUnitConfiguration,
  TransformerForBuild,
  TransformerForBuild_dataflowObject,
  TransformerForRuntime
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { transformer_apply, transformer_apply_wrapper } from "../../2_domain/Transformers.js";
import {
  author1,
  author2,
  author3,
  author4,
  book1,
  book2,
  book3,
  book4,
  book5,
  book6,
  Country1,
  Country2,
  Country3,
  Country4,
  displayTestSuiteResults,
  Domain2QueryReturnType,
  ignorePostgresExtraAttributes,
  ignorePostgresExtraAttributesOnList,
  ignorePostgresExtraAttributesOnObject,
  TestSuiteContext
} from "miroir-core";
import { runTransformerTestSuite, transformerTestsDisplayResults, testSuites, TransformerTest, transformerTests } from "./transformersTests.data.js";


// const env:any = (import.meta as any).env
// const env:any = (process as any).env
// console.log("@@@@@@@@@@@@@@@@@@ env", JSON.stringify(env, null, 2));

const RUN_TEST= process.env.RUN_TEST
console.log("@@@@@@@@@@@@@@@@@@ RUN_TEST", RUN_TEST);
function getCommandLineArgs() {
  const args = process.argv.slice(2);
  const params: { [key: string]: string } = {};
  args.forEach(arg => {
    const [key, value] = arg.split('=');
    if (key.startsWith('--')) {
      params[key.slice(2)] = value;
    }
  });
  return params;
}

// Get command line parameters
const params = getCommandLineArgs();
// // console.log('@@@@@@@@@@@@@@@@@@@@@@@ Command line parameters:', JSON.stringify(params, null, 2));
// console.log('@@@@@@@@@@@@@@@@@@@@@@@ Command line parameters:', JSON.stringify(process.argv, null, 2));
// // console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);
// console.log("@@@@@@@@@@@@@@@@@@ vitest",vitest.describe)
// describe.sequential("templatesDEFUNCT.unit.test", () => {

// const testApplicationName = "testApplication"
// const sqlDbStoreName = "testStoreName"
// const connectionString = "postgres://postgres:postgres@localhost:5432/postgres"
// // const schema = "testSchema"
// const schema = testApplicationName;
// const paramSelfApplicationUuid = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
// const paramAdminConfigurationDeploymentUuid: Uuid = "bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
// const applicationModelBranchUuid: Uuid = "cccccccc-cccc-cccc-cccc-cccccccccccc";
// const selfApplicationVersionUuid: Uuid = "dddddddd-dddd-dddd-dddd-dddddddddddd";

// // let sqlDbAdminStore: SqlDbAdminStoreSection;
// let sqlDbAdminStore: PersistenceStoreAdminSectionInterface;
// let sqlDbDataStore: SqlDbDataStoreSection;
// let sqlDbModelStore: SqlDbModelStoreSection;
// let persistenceStoreController: PersistenceStoreController;
// const testStoreConfig: StoreUnitConfiguration = getBasicStoreUnitConfiguration(testApplicationName, {
//   emulatedServerType: "sql",
//   connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
// })

// const libraryEntitesAndInstances = [
//   {
//     entity: entityAuthor as MetaEntity,
//     entityDefinition: entityDefinitionAuthor as EntityDefinition,
//     instances: [
//       author1,
//       author2,
//       author3 as EntityInstance,
//     ]
//   },
//   {
//     entity: entityBook as MetaEntity,
//     entityDefinition: entityDefinitionBook as EntityDefinition,
//     instances: [
//       book1 as EntityInstance,
//       book2 as EntityInstance,
//       // book3 as EntityInstance,
//       book4 as EntityInstance,
//       book5 as EntityInstance,
//       book6 as EntityInstance,
//     ]
//   },
//   {
//     entity: entityPublisher as MetaEntity,
//     entityDefinition: entityDefinitionPublisher as EntityDefinition,
//     instances: [
//       publisher1 as EntityInstance,
//       publisher2 as EntityInstance,
//       publisher3 as EntityInstance,
//     ]
//   }
// ];

afterAll(async () => {
  if (RUN_TEST) {
    transformerTestsDisplayResults(RUN_TEST, testSuiteName);
  }
});

// ################################################################################################
async function runTransformerTest(vitest: any, testSuiteNamePath: string[], transformerTest: TransformerTest) {
  const assertionName = transformerTest.transformerTestLabel ?? transformerTest.transformerName;
  console.log("#################################### test", assertionName, "START");
  // TestSuiteContext.setTest(transformerTest.transformerTestLabel);

  if (!transformerTests) {
    throw new Error("transformerTests is undefined");
  }
  console.log(
    "################################ transformerTestParams",
    JSON.stringify(transformerTest, null, 2)
  );
  const transformer: TransformerForBuild | TransformerForRuntime = transformerTest.transformer;

  // const rawResult: Domain2QueryReturnType<any> = transformer_apply(
  const rawResult: Domain2QueryReturnType<any> = transformer_apply_wrapper(
    "build",
    undefined,
    transformer,
    transformerTest.transformerParams,
    transformerTest.transformerRuntimeContext??{}
    // Object.hasOwn(transformerTest,"transformerRuntimeContext")?transformerTest.transformerRuntimeContext:{}
  );


  console.log("################################ raw result", JSON.stringify(rawResult, null, 2));
  console.log(
    "################################ expectedResult",
    JSON.stringify(transformerTest.expectedValue, null, 2)
  );
  const result = ignorePostgresExtraAttributes(rawResult, transformerTest.ignoreAttributes);
  console.log("################################ result", JSON.stringify(result, null, 2));
  const testSuiteNamePathAsString = TestSuiteContext.testSuitePathName(testSuiteNamePath);
  try {
    vitest.expect(
      result,
      `${testSuiteNamePathAsString} > ${assertionName}`
    ).toEqual(transformerTest.expectedValue);
    TestSuiteContext.setTestAssertionResult({
      assertionName,
      assertionResult: "ok",
    });
  } catch (error) {
    TestSuiteContext.setTestAssertionResult({
      assertionName,
      assertionResult: "error",
      assertionExpectedValue: transformerTest.expectedValue,
      assertionActualValue: result,
    });
  }

  console.log("############################ test", assertionName, "END");
  return Promise.resolve();
}

// ################################################################################################
const testSuiteName = "transformers.unit.test";
if (RUN_TEST == testSuiteName) {
  // await runTransformerTestSuite(vitest, [transformerTests.transformerTestLabel ?? transformerTests.transformerTestType], transformerTests, runTransformerTest);
  await runTransformerTestSuite(vitest, [], transformerTests, runTransformerTest);
  
} else {
  console.log("################################ skipping test suite:", testSuiteName);
}









  // // ################################################################################################
  // it("unique authors from books transformer", async () => { // TODO: test failure cases!
  //     // if (miroirConfig.client.emulateServer) {
  //     console.log(expect.getState().currentTestName, "START")
  //     const newApplicationName = "test";

  //     const testResult: string = transformer_apply(
  //       "runtime",
  //       undefined,
  //       {
  //         transformerType: "unique",
  //         interpolation: "runtime",
  //         referencedExtractor: "books",
  //         attribute: "author",
  //         orderBy: "author",
  //       },
  //       { }, // queryParams
  //       {
  //         books: [
  //             book1 as EntityInstance,
  //             book2 as EntityInstance,
  //             book3 as EntityInstance,
  //             book4 as EntityInstance,
  //             book5 as EntityInstance,
  //             book6 as EntityInstance,
  //         ], // expected value
  //         // books: Object.fromEntries(
  //         //   [
  //         //     book1 as EntityInstance,
  //         //     book2 as EntityInstance,
  //         //     book3 as EntityInstance,
  //         //     book4 as EntityInstance,
  //         //     book5 as EntityInstance,
  //         //     book6 as EntityInstance,
  //         //   ].map((book: EntityInstance) => {
  //         //     return [book.uuid, book];
  //         //   })
  //         // ), // expected value
  //       }, // context
  //     );

  //     console.log("################################ converted template", testResult)
  //     expect(testResult).toEqual(
  //       [
  //         { author: "4441169e-0c22-4fbc-81b2-28c87cf48ab2" },
  //         { author: "ce7b601d-be5f-4bc6-a5af-14091594046a" },
  //         { author: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17" },
  //         { author: "e4376314-d197-457c-aa5e-d2da5f8d5977" },
  //       ]
  //     );
  //     console.log(expect.getState().currentTestName, "END")
  //   }
  // );

  // // ################################################################################################
  // // TODO: allow count for build transformers
  // it("count books by author build template", async () => { // TODO: test failure cases!
  //     // if (miroirConfig.client.emulateServer) {
  //     console.log(expect.getState().currentTestName, "START")
  //     const newApplicationName = "test";

  //     const uniqueRuntimeTemplate:TransformerForRuntime = {
  //       transformerType: "count",
  //       interpolation: "runtime",
  //       referencedExtractor: "books",
  //       groupBy: "author",
  //       orderBy: "author",
  //     }

  //     const testResult: string = transformer_apply(
  //       "runtime",
  //       undefined,
  //       uniqueRuntimeTemplate,
  //       { }, // queryParams
  //       {
  //         books: [
  //           book1 as EntityInstance,
  //           book2 as EntityInstance,
  //           book3 as EntityInstance,
  //           book4 as EntityInstance,
  //           book5 as EntityInstance,
  //           book6 as EntityInstance,
  //         ]
  //       } // context
  //     );

  //     console.log("################################ count books by author runtime transformer", testResult)
  //     expect(testResult).toEqual(
  //       [
  //         { author: "4441169e-0c22-4fbc-81b2-28c87cf48ab2", count: 1 },
  //         { author: "ce7b601d-be5f-4bc6-a5af-14091594046a", count: 2 },
  //         { author: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17", count: 2 },
  //         { author: "e4376314-d197-457c-aa5e-d2da5f8d5977", count: 1 },
  //       ]
  //     );
  //     console.log(expect.getState().currentTestName, "END")
  //   }
  // );

  // // ################################################################################################
  // it("count books by author runtime transformer", async () => { // TODO: test failure cases!
  //     // if (miroirConfig.client.emulateServer) {
  //     console.log("count books by author runtime transformer START")
  //     const newApplicationName = "test";

  //     const uniqueRuntimeTemplate:TransformerForRuntime = {
  //       transformerType: "count",
  //       interpolation: "runtime",
  //       referencedExtractor: "books",
  //       groupBy: "author",
  //       orderBy: "author",
  //     }

  //     const testResult: string = transformer_apply(
  //       "runtime",
  //       undefined,
  //       uniqueRuntimeTemplate,
  //       { }, // queryParams
  //       {
  //         books: [
  //           book1 as EntityInstance,
  //           book2 as EntityInstance,
  //           book3 as EntityInstance,
  //           book4 as EntityInstance,
  //           book5 as EntityInstance,
  //           book6 as EntityInstance,
  //         ],
  //       } // context
  //       // undefined
  //     );

  //     console.log("################################ count books by author runtime transformer", testResult)
  //     expect(testResult).toEqual(
  //       [
  //         { author: author1.uuid, count: 1 },
  //         { author: author2.uuid, count: 2 },
  //         { author: author3.uuid, count: 2 },
  //         { author: author4.uuid, count: 1 },
  //         // { author: "4441169e-0c22-4fbc-81b2-28c87cf48ab2", count: 1 },
  //         // { author: "ce7b601d-be5f-4bc6-a5af-14091594046a", count: 2 },
  //         // { author: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17", count: 2 },
  //         // { author: "e4376314-d197-457c-aa5e-d2da5f8d5977", count: 1 },
  //       ]
  //     );
  //     console.log(expect.getState().currentTestName, "END")
  //   }
  // );

  // // ################################################################################################
  // it("built custom object with runtime transformer object_fullTemplate", async () => { // TODO: test failure cases!
  //     // if (miroirConfig.client.emulateServer) {
  //     // console.log("built custom object with runtime transformer START")
  //     console.log(expect.getState().currentTestName, "START")

  //     const newApplicationName = "test";
  //     const newUuid = uuidv4();

  //     const uniqueRuntimeTemplate:TransformerForRuntime = {
  //       transformerType: "object_fullTemplate",
  //       interpolation: "runtime",
  //       referencedExtractor: "country",
  //       definition: [
  //         {
  //           attributeKey: {
  //             interpolation: "runtime",
  //             transformerType: "constantUuid",
  //             constantUuidValue: "uuid"
  //           },
  //           attributeValue: {
  //             interpolation: "runtime",
  //             transformerType: "parameterReference",
  //             referenceName: "newUuid"
  //           }
  //         },
  //         {
  //           attributeKey: {
  //             interpolation: "runtime",
  //             transformerType: "constantUuid",
  //             constantUuidValue: "name"
  //           },
  //           attributeValue: {
  //             transformerType: "mustacheStringTemplate",
  //             interpolation: "runtime",
  //             definition: "{{country.iso3166-1Alpha-2}}"
  //           }
  //         }
  //       ]
  //     }

  //     const testResult: string = transformer_apply(
  //       "runtime",
  //       undefined,
  //       uniqueRuntimeTemplate,
  //       { newUuid },
  //       {
  //         country: Country1 as EntityInstance,
  //       } // context
  //     );

  //     console.log("################################ count books by author runtime transformer", testResult)
  //     expect(testResult).toEqual(
  //       { uuid: newUuid, name: "US"  }
  //     );
  //     console.log(expect.getState().currentTestName, "END")
  //   }
  // );

  // // ################################################################################################
  // it("build custom object list with runtime transformer", async () => { // TODO: test failure cases!
  //     console.log("build custom object list with runtime transformer START")
  //     const newApplicationName = "test";
  //     const newUuid = uuidv4();

  //     const uniqueRuntimeTemplate:TransformerForRuntime = {
  //       transformerType: "mapperListToList",
  //       interpolation: "runtime",
  //       referencedExtractor: "countries",
  //       referenceToOuterObject: "country",
  //       elementTransformer: {
  //         transformerType: "object_fullTemplate",
  //         interpolation: "runtime",
  //         referencedExtractor: "country",
  //         definition: [
  //           {
  //             attributeKey: {
  //               interpolation: "runtime",
  //               transformerType: "constantUuid",
  //               constantUuidValue: "uuid"
  //             },
  //             attributeValue: {
  //               interpolation: "runtime",
  //               transformerType: "newUuid",
  //             }
  //           },
  //           {
  //             attributeKey: {
  //               interpolation: "runtime",
  //               transformerType: "constantUuid",
  //               constantUuidValue: "name"
  //             },
  //             attributeValue: {
  //               transformerType: "mustacheStringTemplate",
  //               interpolation: "runtime",
  //               definition: "{{country.iso3166-1Alpha-2}}"
  //             }
  //           }
  //         ]
  //       }
  //     }

  //     // const preTestResult: {[k: string]: {[l:string]: any}} = transformer_apply(
  //     const preTestResult: {[k: string]: {[l:string]: any}} = transformer_apply(
  //       "runtime",
  //       undefined,
  //       uniqueRuntimeTemplate as any,
  //       {
  //         newUuid: newUuid ,
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

  //     console.log("################################", expect.getState().currentTestName, "preTestResult", preTestResult)
  //     // const testResult = ignorePostgresExtraAttributesOnObject(preTestResult as any,["uuid"]); // uuid value is ignored
  //     const testResult = ignorePostgresExtraAttributesOnList(preTestResult as any,["uuid"]); // uuid value is ignored
  //     const expectedTestResult = [
  //       { name: Country1["iso3166-1Alpha-2"] },
  //       { name: Country2["iso3166-1Alpha-2"] },
  //       { name: Country3["iso3166-1Alpha-2"] },
  //       { name: Country4["iso3166-1Alpha-2"] },
  //     ]

  //     console.log("################################", expect.getState().currentTestName, "expectedTestResult", expectedTestResult)
  //     console.log("################################", expect.getState().currentTestName, "testResult", testResult)
  //     expect(testResult).toEqual(expectedTestResult);
  //     console.log(expect.getState().currentTestName, "END")
  //   }
  // );









  // // ################################################################################################
  // it("build custom UuidIndex object from object list with runtime transformer", async () => { // TODO: test failure cases!
  //     console.log("build custom UuidIndex object from object list with runtime transformer START")
  //     // const newApplicationName = "test";
  //     // const newUuid = uuidv4();

  //     const uniqueRuntimeTemplate:TransformerForRuntime = {
  //       transformerType: "listReducerToIndexObject",
  //       interpolation: "runtime",
  //       referencedExtractor: "countries",
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

  //     console.log("################################", expect.getState().currentTestName, "preTestResult", preTestResult)
  //     const testResult = ignorePostgresExtraAttributesOnObject(preTestResult as any,["uuid"]); // uuid value is ignored
  //     expect(testResult).toEqual(
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
  // it("build freeObject with build transformer", async () => { // TODO: test failure cases!
  //   console.log(expect.getState().currentTestName, "START")
  //   const newApplicationName = "test";
  //   const newUuid = uuidv4();

  //   const uniqueRuntimeTemplate:TransformerForBuild = {
  //     transformerType: "freeObjectTemplate",
  //     definition: {
  //       name: "test",
  //     }
  //   }

  //   const preTestResult: {[k: string]: {[l:string]: any}} = transformer_apply(
  //     "build",
  //     undefined,
  //     uniqueRuntimeTemplate as any,
  //     {
  //       newUuid: newUuid ,
  //     }, // queryParams
  //     {
  //       country: Country1 as EntityInstance,
  //       countries: [
  //           Country1 as EntityInstance,
  //           Country2 as EntityInstance,
  //           Country3 as EntityInstance,
  //           Country4 as EntityInstance,
  //       ],
  //     } // context
  //   );

  // console.log("################################", expect.getState().currentTestName, "preTestResult", preTestResult)
  //   // const testResult = ignorePostgresExtraAttributesOnList(preTestResult as any,["uuid"]); // uuid value is ignored
  //   const testResult = preTestResult; // uuid value is ignored
  //   console.log("################################ build freeObject with build transformer testResult", testResult)
  //   expect(testResult).toEqual(
  //     {
  //       name: "test",
  //     }
  //   );
  //   console.log(expect.getState().currentTestName, "END")
  // }
  // );

  // // ################################################################################################
  // it("alter existing object with objectAlter runtime transformer", async () => { // TODO: test failure cases!
  //   console.log(expect.getState().currentTestName, "START")
  //   const newApplicationName = "test";
  //   const newUuid = uuidv4();

  //   const uniqueRuntimeTemplate:TransformerForRuntime = {
  //     transformerType: "objectAlter",
  //     interpolation: "runtime",
  //     referenceToOuterObject: "country",
  //     definition: {
  //       transformerType: "freeObjectTemplate",
  //       interpolation: "runtime",
  //       definition: {
  //         name: "test",
  //       }
  //     }
  //   }

  //   // const preTestResult: {[k: string]: {[l:string]: any}} = transformer_apply(
  //   const preTestResult: {[k: string]: {[l:string]: any}} = transformer_apply(
  //     "runtime",
  //     undefined,
  //     // uniqueRuntimeTemplate,
  //     uniqueRuntimeTemplate as any,
  //     {
  //       newUuid: newUuid ,
  //     }, // queryParams
  //     {
  //       country: Country1 as EntityInstance,
  //       // countries: [
  //       //     Country1 as EntityInstance,
  //       //     Country2 as EntityInstance,
  //       //     Country3 as EntityInstance,
  //       //     Country4 as EntityInstance,
  //       // ],
  //     } // context
  //   );

  //   const testResult = ignorePostgresExtraAttributesOnObject(preTestResult as any); // uuid value is ignored
  //   const expectedResult = {
  //     ...Country1,
  //     name: "test",
  //   };
  //   console.log("################################", expect.getState().currentTestName, "testResult", testResult)
  //   console.log("################################", expect.getState().currentTestName, "expectedResult", expectedResult)

  //   expect(testResult).toEqual(expectedResult);
  //   console.log(expect.getState().currentTestName, "END")
  // });

  // // ################################################################################################
  // it("mapperListToList / objectAlter: alter existing object list with mapperListToList-objectAlter runtime transformer", async () => { // TODO: test failure cases!
  //   console.log(expect.getState().currentTestName, "START")
  //   const newApplicationName = "test";
  //   const newUuid = uuidv4();

  //   const uniqueRuntimeTemplate:TransformerForRuntime = {
  //     transformerType: "mapperListToList",
  //     interpolation: "runtime",
  //     referencedExtractor: "countries",
  //     referenceToOuterObject: "country",
  //     elementTransformer: {
  //       transformerType: "objectAlter",
  //       interpolation: "runtime",
  //       referenceToOuterObject: "country",
  //       definition: {
  //         transformerType: "freeObjectTemplate",
  //         interpolation: "runtime",
  //         definition: {
  //           // name: "test",
  //           name: {
  //             transformerType: "mustacheStringTemplate",
  //             interpolation: "runtime",
  //             definition: "{{country.iso3166-1Alpha-2}}",
  //           },
  //         }
  //       }
  //     }
  //   }

  //   const preTestResult: {[k: string]: {[l:string]: any}} = transformer_apply(
  //     "runtime",
  //     undefined,
  //     uniqueRuntimeTemplate as any,
  //     {
  //       newUuid: newUuid ,
  //     }, // queryParams
  //     {
  //       country: Country1 as EntityInstance,
  //       countries: [
  //           Country1 as EntityInstance,
  //           Country2 as EntityInstance,
  //           Country3 as EntityInstance,
  //           Country4 as EntityInstance,
  //       ],
  //     } // context
  //   );

  // console.log("################################", expect.getState().currentTestName, "preTestResult", preTestResult)
  //   // const testResult = ignorePostgresExtraAttributesOnList(preTestResult as any,["uuid"]); // uuid value is ignored
  //   const testResult = preTestResult; // uuid value is ignored
  //   console.log("################################ alter existing object list with mapperListToList-objectAlter runtime transformer testResult", testResult)
  //   expect(testResult).toEqual(
  //     [
  //       {
  //         ...Country1,
  //         name: "US",
  //       },
  //       {
  //         ...Country2,
  //         name: "DE",
  //       },
  //       {
  //         ...Country3,
  //         name: "FR",
  //       },
  //       {
  //         ...Country4,
  //         name: "GB",
  //       },
  //     ]
  //   );
  //   console.log(expect.getState().currentTestName, "END")
  // }
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
  //     "################################ object dynamic access runtime transformer preTestResult",
  //     preTestResult
  //   );
  //   const testResult = preTestResult; // uuid value is ignored
  //   console.log("################################ object dynamic access runtime transformer testResult", testResult);
  //   expect(testResult).toEqual(
  //     {
  //       parentUuid: 'f6de3d66-37ee-42ac-bb81-72973222f006',
  //       uuid: '33f90390-cc41-4d7a-ab3a-0cfad11e428c',
  //       name: 'PARIS 20EME ARRONDISSEMENT'
  //     }
  //   );
  //   console.log("object dynamic access runtime transformer END");
  // });

  // // ################################################################################################
  // it("mapperListToList / objectAlter: alter existing object list with mapperListToList-objectAlter with object dynamic access runtime transformer", async () => {
  //   // TODO: test failure cases!
  //   console.log(expect.getState().currentTestName, "START")

  //   const uniqueBuildTemplate: TransformerForRuntime = {
  //     transformerType: "mapperListToList",
  //     interpolation: "runtime",
  //     referencedExtractor: "fountains",
  //     referenceToOuterObject: "fountain",
  //     elementTransformer: {
  //       transformerType: "objectAlter",
  //       interpolation: "runtime",
  //       referenceToOuterObject: "fountain",
  //       definition: {
  //         transformerType: "freeObjectTemplate",
  //         interpolation: "runtime",
  //         definition: {
  //           // name: "test",
  //           Municipality: {
  //             transformerType: "objectDynamicAccess",
  //             interpolation: "runtime",
  //             objectAccessPath: [
  //               {
  //                 transformerType: "contextReference",
  //                 interpolation: "runtime",
  //                 referenceName: "municipalitiesIndexedByName",
  //               },
  //               {
  //                 transformerType: "objectDynamicAccess",
  //                 interpolation: "runtime",
  //                 objectAccessPath: [
  //                   {
  //                     transformerType: "contextReference",
  //                     interpolation: "runtime",
  //                     referenceName: "fountain",
  //                   },
  //                   "Commune",
  //                 ],
  //               },
  //               "uuid"
  //             ],
  //           },
  //         },
  //       },
  //     },
  //   };
  //   const preTestResult: { [k: string]: { [l: string]: any } } = transformer_apply(
  //     "runtime",
  //       undefined,
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
  // const testResult = preTestResult; // uuid value is ignored
  // console.log(
  //   "################################ alter existing object list with mapperListToList-objectAlter with object dynamic access runtime transformer testResult",
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
  // it("listPickElement - pick item with runtime transformer", async () => {
  //   // TODO: test failure cases!
  //   console.log("list - pick item with runtime transformer START");
  //   const newApplicationName = "test";
  //   const newUuid = uuidv4();

  //   const uniqueRuntimeTemplate: TransformerForRuntime = {
  //     transformerType: "listPickElement",
  //     interpolation: "runtime",
  //     referencedExtractor: "Fountains",
  //     index: 0,
  //   };

  //   // const preTestResult: {[k: string]: {[l:string]: any}} = transformer_apply(
  //   const preTestResult: { [k: string]: { [l: string]: any } } = transformer_apply(
  //     "runtime",
  //     undefined,
  //     uniqueRuntimeTemplate as any,
  //     {
  //       newUuid: newUuid,
  //     }, // queryParams
  //     {
  //       Fountains: [
  //         {
  //           Voie: "BOULEVARD DE BELLEVILLE",
  //           uuid: "a849eda6-6f80-4178-8ea1-4f2d6c0e8c08",
  //           Commune: "PARIS 20EME ARRONDISSEMENT",
  //           Modèle: "GHM Ville de Paris",
  //           geo_shape: '{"coordinates":[2.381807425006663,48.86840357208106],"type":"Point"}',
  //           "Type Objet": "BORNE_FONTAINE",
  //           parentName: "Fountain",
  //           parentUuid: "56848f20-d585-4d76-ade6-155907f5edfc",
  //           Identifiant: "450080676",
  //           geo_point_2d: "48.86840357208106, 2.381807425006663",
  //           "N° Voie Pair": "36",
  //           Disponibilité: "OUI",
  //           "N° Voie Impair": null,
  //           "Fin Indisponibilité": null,
  //           "Motif Indisponibilité": null,
  //           "Début Indisponibilité": null,
  //           Municipality: null,
  //           createdAt: "2024-10-03T17:11:24.380Z",
  //           updatedAt: "2024-10-03T17:11:24.380Z",
  //         },
  //         {
  //           Voie: "PLACE FELIX EBOUE",
  //           uuid: "6e6d55e3-ea68-4efe-ae28-a0ef28680deb",
  //           Commune: "PARIS 12EME ARRONDISSEMENT",
  //           Modèle: "Fontaine Arceau",
  //           geo_shape: '{"coordinates":[2.394950933604463,48.840063263659],"type":"Point"}',
  //           "Type Objet": "FONTAINE_ARCEAU",
  //           parentName: "Fountain",
  //           parentUuid: "56848f20-d585-4d76-ade6-155907f5edfc",
  //           Identifiant: "450072983",
  //           geo_point_2d: "48.840063263659, 2.394950933604463",
  //           "N° Voie Pair": null,
  //           Disponibilité: "OUI",
  //           "N° Voie Impair": null,
  //           "Fin Indisponibilité": null,
  //           "Motif Indisponibilité": null,
  //           "Début Indisponibilité": null,
  //           Municipality: null,
  //           createdAt: "2024-10-03T17:11:24.396Z",
  //           updatedAt: "2024-10-03T17:11:24.396Z",
  //         },
  //         {
  //           Voie: "RUE GASTON TESSIER",
  //           uuid: "5e012a4c-4bce-4e97-865e-a21613c02160",
  //           Commune: "PARIS 19EME ARRONDISSEMENT",
  //           Modèle: "Fontaine Arceau",
  //           geo_shape: '{"coordinates":[2.3739455668258342,48.8960092708196],"type":"Point"}',
  //           "Type Objet": "FONTAINE_ARCEAU",
  //           parentName: "Fountain",
  //           parentUuid: "56848f20-d585-4d76-ade6-155907f5edfc",
  //           Identifiant: "450073322",
  //           geo_point_2d: "48.8960092708196, 2.3739455668258342",
  //           "N° Voie Pair": null,
  //           Disponibilité: "OUI",
  //           "N° Voie Impair": "39",
  //           "Fin Indisponibilité": null,
  //           "Motif Indisponibilité": null,
  //           "Début Indisponibilité": null,
  //           Municipality: null,
  //           createdAt: "2024-10-03T17:11:24.398Z",
  //           updatedAt: "2024-10-03T17:11:24.398Z",
  //         },
  //         {
  //           Voie: "AVENUE DAUMESNIL",
  //           uuid: "7e8526c6-8376-4e0e-b91e-3c50b5499e65",
  //           Commune: "PARIS 12EME ARRONDISSEMENT",
  //           Modèle: "Wallace Bois",
  //           geo_shape: '{"coordinates":[2.4194189756068725,48.83471831212431],"type":"Point"}',
  //           "Type Objet": "FONTAINE_BOIS",
  //           parentName: "Fountain",
  //           parentUuid: "56848f20-d585-4d76-ade6-155907f5edfc",
  //           Identifiant: "450025381",
  //           geo_point_2d: "48.83471831212431, 2.4194189756068725",
  //           "N° Voie Pair": null,
  //           Disponibilité: "OUI",
  //           "N° Voie Impair": null,
  //           "Fin Indisponibilité": null,
  //           "Motif Indisponibilité": null,
  //           "Début Indisponibilité": null,
  //           Municipality: null,
  //           createdAt: "2024-10-03T17:11:24.401Z",
  //           updatedAt: "2024-10-03T17:11:24.401Z",
  //         },
  //       ],
  //     } // context
  //   );

  //   console.log("################################", expect.getState().currentTestName, "preTestResult", preTestResult);
  //   // const testResult = ignorePostgresExtraAttributesOnList(preTestResult as any,["uuid"]); // uuid value is ignored
  //   const testResult = preTestResult; // uuid value is ignored
  //   console.log("################################ list - pick item with runtime transformer testResult", testResult);
  //   expect(testResult).toEqual({
  //     Voie: "BOULEVARD DE BELLEVILLE",
  //     uuid: "a849eda6-6f80-4178-8ea1-4f2d6c0e8c08",
  //     Commune: "PARIS 20EME ARRONDISSEMENT",
  //     Modèle: "GHM Ville de Paris",
  //     geo_shape: '{"coordinates":[2.381807425006663,48.86840357208106],"type":"Point"}',
  //     "Type Objet": "BORNE_FONTAINE",
  //     parentName: "Fountain",
  //     parentUuid: "56848f20-d585-4d76-ade6-155907f5edfc",
  //     Identifiant: "450080676",
  //     geo_point_2d: "48.86840357208106, 2.381807425006663",
  //     "N° Voie Pair": "36",
  //     Disponibilité: "OUI",
  //     "N° Voie Impair": null,
  //     "Fin Indisponibilité": null,
  //     "Motif Indisponibilité": null,
  //     "Début Indisponibilité": null,
  //     Municipality: null,
  //     createdAt: "2024-10-03T17:11:24.380Z",
  //     updatedAt: "2024-10-03T17:11:24.380Z",
  //   });
  //   console.log(expect.getState().currentTestName, "END");
  // });


  // // ################################################################################################
  // describe("dataflowObject transformer", () => {
  //   it("should apply dataflowObject transformer correctly", () => {
  //     const transformer: TransformerForBuild_dataflowObject = {
  //       transformerType: "dataflowObject",
  //       definition: {
  //         name: {
  //           transformerType: "constantString",
  //           constantStringValue: "testName",
  //         },
  //         uuid: {
  //           transformerType: "newUuid",
  //         },
  //         doubleName: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "{{name}}-{{name}}",
  //         },
  //         object: {
  //           transformerType: "dataflowObject",
  //           definition: {
  //             reDoubleName: {
  //               transformerType: "contextReference",
  //               referenceName: "doubleName",
  //             },
  //             reReDoubleName: {
  //               transformerType: "contextReference",
  //               referencePath: ["object", "reDoubleName"],
  //             },
  //           },
  //         },
  //       },
  //     };

  //     const queryParams = {};
  //     const contextResults = {};

  //     const result: Domain2QueryReturnType<any> = transformer_apply(
  //       "build",
  //       undefined,
  //       transformer,
  //       queryParams,
  //       contextResults
  //     );

  //     expect(result.name).toBe("testName");
  //     expect(result.uuid).toMatch(
  //       /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  //     );
  //     expect(result.doubleName).toBe("testName-testName");
  //     expect(result.object.reDoubleName).toEqual("testName-testName");
  //     expect(result.object.reReDoubleName).toEqual("testName-testName");
  //   });
  // });
    








  // ################################################################################################
  // ################################################################################################
  // ################################################################################################
  // ################################################################################################
  // ################################################################################################
  // it("build an EntityDefinition from spreadsheet with transformers", async () => { // TODO: test failure cases!
  //   console.log(expect.getState().currentTestName, "START")
  //   const newApplicationName = "test";
  //   const newUuid = uuidv4();

  //   // const extractColumnDefinitionRow:TransformerForRuntime = {
  //   //   transformerType: "listPickElement",
  //   //   interpolation: "runtime",
  //   //   referencedExtractor: "fileData",
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
  //   //     referencedExtractor: "fileData",
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
  //   // ).elementValue;

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
  //             referencedExtractor: "fileData",
  //             index: 0,
  //           },
  //           columnDefinitionRowEntries: {
  //             transformerType: "objectEntries",
  //             label: "extractEntriesForColumnDefinitionObject",
  //             referencedExtractor: {
  //               transformerType: "contextReference",
  //               referencePath: ["columns", "columnDefinitionRowObject"],
  //             },
  //           },
  //           columnDefinitionRowNames: {
  //             transformerType: "mapperListToList",
  //             label: "selectColumnNamesAsStrings",
  //             referencedExtractor: {
  //               transformerType: "contextReference",
  //               referencePath: ["columns", "columnDefinitionRowEntries"],
  //             },
  //             referenceToOuterObject: "columnDefinitionRowEntry",
  //             elementTransformer: {
  //               transformerType: "listPickElement",
  //               label: "selectColumnNamesAsString",
  //               referencedExtractor: "columnDefinitionRowEntry",
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
  //           //   constantStringValue: "object",
  //           // },
  //           arrayOfArrayAttributeDefinitions: {
  //             transformerType: "mapperListToList",
  //             label: "mapColumnNamesToAttributes",
  //             referencedExtractor: {
  //               transformerType: "contextReference",
  //               referencePath: ["columns", "columnDefinitionRowNames"],
  //             },
  //             referenceToOuterObject: "attributeName",
  //             elementTransformer: {
  //               transformerType: "object_fullTemplate",
  //               referencedExtractor: "attributeName",
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
  //             referencedExtractor: {
  //               transformerType: "contextReference",
  //               referencePath: ["schema", "arrayOfArrayAttributeDefinitions"],
  //             },
  //             referenceToOuterObject: "attributeDefinitionArray",
  //             elementTransformer: {
  //               transformerType: "listPickElement",
  //               label: "selectAttributeDefinition",
  //               referencedExtractor: "attributeDefinitionArray",
  //               index: 0,
  //             },
  //           },
  //           // objectAttributeDefinitions: {
  //           //   transformerType: "listReducerToIndexObject",
  //           //   label: "mapAttributeDefinitionsToObject",
  //           //   referencedExtractor: {
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
  //   //   referencedExtractor: {
  //   //     transformerType: "mapperListToList",
  //   //     referencedExtractor: {
  //   //       transformerType: "objectEntries",
  //   //       label: "extractEntriesForColumnDefinitionObject",
  //   //       referencedExtractor: {
  //   //         transformerType: "listPickElement",
  //   //         label: "selectColumnDefinitionRowFromSpreadsheet",
  //   //         referencedExtractor: "fileData",
  //   //         index: 0,
  //   //       },
  //   //     },
  //   //     referenceToOuterObject: "columnDefinition",
  //   //     elementTransformer: {
  //   //       transformerType: "listPickElement",
  //   //       label: "selectColumnNamesAsStrings",
  //   //       referencedExtractor: "columnDefinition",
  //   //       index: 1,
  //   //     },
  //   //   },
  //   //   referenceToOuterObject: "attributeName",
  //   //   elementTransformer: {
  //   //     transformerType: "object_fullTemplate",
  //   //     referencedExtractor: "attributeName",
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
  //   ).elementValue;

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

  //   const sqlQuery = sqlStringForTransformer(
  //     {
  //       transformerType: "listPickElement",
  //       interpolation: "runtime",
  //       referencedExtractor: "Fountains",
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
