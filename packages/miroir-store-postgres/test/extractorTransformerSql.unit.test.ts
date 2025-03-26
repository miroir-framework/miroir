import { DomainElement, DomainElementSuccess, Domain2QueryReturnType } from "miroir-core";
import { sqlStringForRuntimeTransformer } from "../src/1_core/SqlGenerator";
// import { sqlStringForRuntimeTransformer } from "../src/4_services/SqlDbQueryRunner";

// console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

/**
 * PROBLEM: this tests implementation details of the sqlStringForRuntimeTransformer function
 * IT IS NOT USED, AS IT IS NOT AT THE "RIGHT" LEVEL.
 */
// describe("extractorTransformerSql.unit.test", () => {
//   // ################################################################################################
//   it("apply basic transformer for simple string", async () => { // TODO: test failure cases!
//       console.log(expect.getState().currentTestName, "START")

//       const result: Domain2QueryReturnType<DomainElementSuccess> = sqlStringForRuntimeTransformer(
//         {
//           transformerType: "constantString",
//           interpolation: "runtime",
//           value: "test",
//         },
//         // {}, // queryParams
//         // {}, // newFetchedData
//         // {}, // extractors
//       );

//       const expectedResult: Domain2QueryReturnType<DomainElementSuccess> = {
//         "elementType": "any",
//         "elementValue": {
//           "sqlStringOrObject": "test"
//         }
//       };

//       console.log("################################ result", JSON.stringify(result,null,2))
//       console.log("################################ expectedResult", JSON.stringify(expectedResult,null,2))
//       expect(result).toEqual(expectedResult);

//       console.log(expect.getState().currentTestName, "END")
//     }
//   );

//   // ################################################################################################
//   it("apply transformer mustacheStringTemplate", async () => { // TODO: test failure cases!
//       console.log(expect.getState().currentTestName, "START")

//       const result: Domain2QueryReturnType<DomainElementSuccess> = sqlStringForRuntimeTransformer(
//         {
//           transformerType: "mustacheStringTemplate",
//           interpolation: "runtime",
//           definition: "{{book.name}}",
//         },
//         // {}, // queryParams
//         // {}, // newFetchedData
//         // {
//         //   book: {
//         //     queryType: "boxedExtractorOrCombinerReturningObjectList",
//         //     contextResults: {},
//         //     deploymentUuid: "deployment1",
//         //     pageParams: {},
//         //     queryParams: {},
//         //     select: {
//         //       extractorTemplateType: "extractorForObjectByDirectReference",
//         //       applicationSection: "data",
//         //       parentName: "Book",
//         //       parentUuid: entityBook.uuid,
//         //       instanceUuid: book2.uuid
//         //     }
//         //   },
//         // }, // extractors
//       );

//       const expectedResult: Domain2QueryReturnType<DomainElementSuccess> = {
//         elementType: "any",
//         elementValue: {
//           sqlStringOrObject: '"book"."name"',
//         },
//       };

//       console.log("################################",expect.getState().currentTestName, "result", JSON.stringify(result,null,2))
//       console.log("################################",expect.getState().currentTestName, "expectedResult", JSON.stringify(expectedResult,null,2))
//       expect(result).toEqual(expectedResult);

//       console.log(expect.getState().currentTestName, "END")
//     }
//   );

//   // // ################################################################################################
//   // it("apply transformer innerFullObjectTemplate", async () => { // TODO: test failure cases!
//   //     console.log(expect.getState().currentTestName, "START")

//   //     const result: Domain2QueryReturnType<DomainElementSuccess> = sqlStringForRuntimeTransformer(
//   //       {
//   //         transformerType: "object_fullTemplate",
//   //         interpolation: "runtime",
//   //         referencedExtractor: "book",
//   //         definition: [
//   //           {
//   //             attributeKey: {
//   //               interpolation: "runtime",
//   //               transformerType: "constantString",
//   //               value: "uuid",
//   //             },
//   //             attributeValue: {
//   //               interpolation: "runtime",
//   //               transformerType: "newUuid",
//   //             },
//   //           },
//   //           {
//   //             attributeKey: {
//   //               interpolation: "runtime",
//   //               transformerType: "constantString",
//   //               value: "name",
//   //             },
//   //             attributeValue: {
//   //               interpolation: "runtime",
//   //               transformerType: "mustacheStringTemplate",
//   //               definition: "{{book.name}}",
//   //             },
//   //           },
//   //         ]
//   //       },
//   //       // {}, // queryParams
//   //       // {}, // newFetchedData
//   //       // {
//   //       //   book: {
//   //       //     queryType: "boxedExtractorOrCombinerReturningObjectList",
//   //       //     contextResults: {},
//   //       //     deploymentUuid: "deployment1",
//   //       //     pageParams: {},
//   //       //     queryParams: {},
//   //       //     select: {
//   //       //       extractorTemplateType: "extractorForObjectByDirectReference",
//   //       //       applicationSection: "data",
//   //       //       parentName: "Book",
//   //       //       parentUuid: entityBook.uuid,
//   //       //       instanceUuid: book2.uuid
//   //       //     }
//   //       //   },
//   //       // }, // extractors
//   //     );

//   //     const expectedResult: Domain2QueryReturnType<DomainElementSuccess> = {
//   //       elementType: "string",
//   //       elementValue: `SELECT row_to_json(t) AS "innerFullObjectTemplate" 
//   //       FROM ( 
//   //         SELECT gen_random_uuid() AS "uuid", "book"."name" AS "name" 
//   //         FROM "book" 
//   //       ) t`,
//   //     };

//   //     console.log("################################ result", JSON.stringify(result,null,2))
//   //     console.log("################################ expectedResult", JSON.stringify(expectedResult,null,2))
//   //     expect(cleanResult(result)).toEqual(cleanResult(expectedResult));

//   //     console.log(expect.getState().currentTestName, "END")
//   //   }
//   // );

// });
