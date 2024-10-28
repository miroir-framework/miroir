// import { v4 as uuidv4 } from "uuid";
// import Mustache from "mustache";
// import { describe, expect } from 'vitest';

import { DomainElement, entityBook } from "miroir-core";
import { sqlStringForTransformer } from "../src/4_services/SqlDbExtractorRunner";
// import {
//   DomainAction,
//   StoreUnitConfiguration,
//   TransformerForBuild,
//   DomainElementObject,
//   TransformerForRuntime,
//   EntityInstance,
//   TransformerForRuntime_InnerReference,
//   ExtractorTemplateForRecordOfExtractors,
//   DomainElement,
// } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
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
  ignorePostgresExtraAttributesOnList,
  ignorePostgresExtraAttributesOnRecord,
  resolveExtractorTemplateForRecordOfExtractors,
} from "miroir-core";
// import { object } from "zod";
// const env:any = (import.meta as any).env
// console.log("@@@@@@@@@@@@@@@@@@ env", env);

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
 * PROBLEM: this tests implementation details of the extractorTransformerSql function
 */
describe("extractorTransformerSql.unit.test", () => {
  // // ################################################################################################
  // it("apply basic transformer for simple string", async () => { // TODO: test failure cases!
  //     console.log(expect.getState().currentTestName, "START")

  //     const result: DomainElement = extractorTransformerSql(
  //       {
  //         transformerType: "constantString",
  //         interpolation: "runtime",
  //         constantStringValue: "test",
  //       },
  //       {}, // queryParams
  //       {}, // newFetchedData
  //       {}, // extractors
  //     );

  //     const expectedResult: DomainElement = {
  //       elementType: "string",
  //       elementValue: "test",
  //     };

  //     console.log("################################ result", JSON.stringify(result,null,2))
  //     console.log("################################ expectedResult", JSON.stringify(expectedResult,null,2))
  //     expect(result).toEqual(expectedResult);

  //     console.log(expect.getState().currentTestName, "END")
  //   }
  // );

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
        //     queryType: "extractorForDomainModelObjects",
        //     contextResults: {},
        //     deploymentUuid: "deployment1",
        //     pageParams: {},
        //     queryParams: {},
        //     select: {
        //       queryType: "selectObjectByDirectReference",
        //       applicationSection: "data",
        //       parentName: "Book",
        //       parentUuid: entityBook.uuid,
        //       instanceUuid: book2.uuid
        //     }
        //   },
        // }, // extractors
      );

      const expectedResult: DomainElement = {
        elementType: "string",
        elementValue: '"book"."name"',
      };

      console.log("################################",expect.getState().currentTestName, "result", JSON.stringify(result,null,2))
      console.log("################################",expect.getState().currentTestName, "expectedResult", JSON.stringify(expectedResult,null,2))
      expect(result).toEqual(expectedResult);

      console.log(expect.getState().currentTestName, "END")
    }
  );

  // ################################################################################################
  it("apply transformer innerFullObjectTemplate", async () => { // TODO: test failure cases!
      console.log(expect.getState().currentTestName, "START")

      const result: DomainElement = sqlStringForTransformer(
        {
          transformerType: "fullObjectTemplate",
          interpolation: "runtime",
          referencedExtractor: "book",
          definition: [
            {
              attributeKey: {
                interpolation: "runtime",
                transformerType: "constantString",
                constantStringValue: "uuid",
              },
              attributeValue: {
                interpolation: "runtime",
                transformerType: "newUuid",
              },
            },
            {
              attributeKey: {
                interpolation: "runtime",
                transformerType: "constantString",
                constantStringValue: "name",
              },
              attributeValue: {
                interpolation: "runtime",
                transformerType: "mustacheStringTemplate",
                definition: "{{book.name}}",
              },
            },
          ]
        },
        // {}, // queryParams
        // {}, // newFetchedData
        // {
        //   book: {
        //     queryType: "extractorForDomainModelObjects",
        //     contextResults: {},
        //     deploymentUuid: "deployment1",
        //     pageParams: {},
        //     queryParams: {},
        //     select: {
        //       queryType: "selectObjectByDirectReference",
        //       applicationSection: "data",
        //       parentName: "Book",
        //       parentUuid: entityBook.uuid,
        //       instanceUuid: book2.uuid
        //     }
        //   },
        // }, // extractors
      );

      const expectedResult: DomainElement = {
        elementType: "string",
        elementValue: `SELECT row_to_json(t) AS "innerFullObjectTemplate" 
        FROM ( 
          SELECT gen_random_uuid() AS "uuid", "book"."name" AS "name" 
          FROM "book" 
        ) t`,
      };

      console.log("################################ result", JSON.stringify(result,null,2))
      console.log("################################ expectedResult", JSON.stringify(expectedResult,null,2))
      expect(cleanResult(result)).toEqual(cleanResult(expectedResult));

      console.log(expect.getState().currentTestName, "END")
    }
  );

});
