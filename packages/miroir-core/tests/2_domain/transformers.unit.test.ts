import * as vitest from 'vitest';
import {
  currentTestSuite,
} from "./transformersTests_miroir.data";
import { runTransformerTestInMemory, runTransformerTestSuite, transformerTestsDisplayResults } from '../../src/4_services/TestTools';


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

afterAll(async () => {
  if (RUN_TEST) {
    transformerTestsDisplayResults(currentTestSuite, RUN_TEST, testSuiteName);
  }
});

// ################################################################################################
const testSuiteName = "transformers.unit.test";
if (RUN_TEST == testSuiteName) {
  await runTransformerTestSuite(vitest, [], currentTestSuite, runTransformerTestInMemory);
} else {
  console.log("################################ skipping test suite:", testSuiteName);
}












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
