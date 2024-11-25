import { DomainElement } from "miroir-core";
import { sqlStringForTransformer } from "../src/4_services/SqlDbQueryRunner";

// console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

function cleanResult(r:DomainElement) {
  if (r.elementType !== "string") {
    throw new Error("unexpected elementType: "+r.elementType)
  }
  return {
    elementType: r.elementType,
    elementValue: r.elementValue.replace(/\s+/g, ' ').trim()
  }
}

/**
 * PROBLEM: this tests implementation details of the sqlStringForTransformer function
 */
describe("extractorTransformerSql.unit.test", () => {
  // ################################################################################################
  it("apply basic transformer for simple string", async () => { // TODO: test failure cases!
      console.log(expect.getState().currentTestName, "START")

      const result: DomainElement = sqlStringForTransformer(
        {
          transformerType: "constantString",
          interpolation: "runtime",
          constantStringValue: "test",
        },
        // {}, // queryParams
        // {}, // newFetchedData
        // {}, // extractors
      );

      const expectedResult: DomainElement = {
        "elementType": "any",
        "elementValue": {
          "sqlStringOrObject": "test"
        }
      };

      console.log("################################ result", JSON.stringify(result,null,2))
      console.log("################################ expectedResult", JSON.stringify(expectedResult,null,2))
      expect(result).toEqual(expectedResult);

      console.log(expect.getState().currentTestName, "END")
    }
  );

  // ################################################################################################
  it("apply transformer mustacheStringTemplate", async () => { // TODO: test failure cases!
      console.log(expect.getState().currentTestName, "START")

      const result: DomainElement = sqlStringForTransformer(
        {
          transformerType: "mustacheStringTemplate",
          interpolation: "runtime",
          definition: "{{book.name}}",
        },
        // {}, // queryParams
        // {}, // newFetchedData
        // {
        //   book: {
        //     queryType: "queryForExtractorOrCombinerReturningObjectOrObjectList",
        //     contextResults: {},
        //     deploymentUuid: "deployment1",
        //     pageParams: {},
        //     queryParams: {},
        //     select: {
        //       queryType: "extractorForObjectByDirectReference",
        //       applicationSection: "data",
        //       parentName: "Book",
        //       parentUuid: entityBook.uuid,
        //       instanceUuid: book2.uuid
        //     }
        //   },
        // }, // extractors
      );

      const expectedResult: DomainElement = {
        elementType: "any",
        elementValue: {
          sqlStringOrObject: '"book"."name"',
        },
      };

      console.log("################################",expect.getState().currentTestName, "result", JSON.stringify(result,null,2))
      console.log("################################",expect.getState().currentTestName, "expectedResult", JSON.stringify(expectedResult,null,2))
      expect(result).toEqual(expectedResult);

      console.log(expect.getState().currentTestName, "END")
    }
  );

  // // ################################################################################################
  // it("apply transformer innerFullObjectTemplate", async () => { // TODO: test failure cases!
  //     console.log(expect.getState().currentTestName, "START")

  //     const result: DomainElement = sqlStringForTransformer(
  //       {
  //         transformerType: "fullObjectTemplate",
  //         interpolation: "runtime",
  //         referencedExtractor: "book",
  //         definition: [
  //           {
  //             attributeKey: {
  //               interpolation: "runtime",
  //               transformerType: "constantString",
  //               constantStringValue: "uuid",
  //             },
  //             attributeValue: {
  //               interpolation: "runtime",
  //               transformerType: "newUuid",
  //             },
  //           },
  //           {
  //             attributeKey: {
  //               interpolation: "runtime",
  //               transformerType: "constantString",
  //               constantStringValue: "name",
  //             },
  //             attributeValue: {
  //               interpolation: "runtime",
  //               transformerType: "mustacheStringTemplate",
  //               definition: "{{book.name}}",
  //             },
  //           },
  //         ]
  //       },
  //       // {}, // queryParams
  //       // {}, // newFetchedData
  //       // {
  //       //   book: {
  //       //     queryType: "queryForExtractorOrCombinerReturningObjectOrObjectList",
  //       //     contextResults: {},
  //       //     deploymentUuid: "deployment1",
  //       //     pageParams: {},
  //       //     queryParams: {},
  //       //     select: {
  //       //       queryType: "extractorForObjectByDirectReference",
  //       //       applicationSection: "data",
  //       //       parentName: "Book",
  //       //       parentUuid: entityBook.uuid,
  //       //       instanceUuid: book2.uuid
  //       //     }
  //       //   },
  //       // }, // extractors
  //     );

  //     const expectedResult: DomainElement = {
  //       elementType: "string",
  //       elementValue: `SELECT row_to_json(t) AS "innerFullObjectTemplate" 
  //       FROM ( 
  //         SELECT gen_random_uuid() AS "uuid", "book"."name" AS "name" 
  //         FROM "book" 
  //       ) t`,
  //     };

  //     console.log("################################ result", JSON.stringify(result,null,2))
  //     console.log("################################ expectedResult", JSON.stringify(expectedResult,null,2))
  //     expect(cleanResult(result)).toEqual(cleanResult(expectedResult));

  //     console.log(expect.getState().currentTestName, "END")
  //   }
  // );

});
