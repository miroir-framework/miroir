// import { v4 as uuidv4 } from "uuid";
// import Mustache from "mustache";
// import { describe, expect } from 'vitest';

import { DomainElement } from "miroir-core";
import { extractorTransformerSql } from "../src/4_services/SqlDbExtractorRunner";
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
// import {
//   author1,
//   author2,
//   author3,
//   author4,
//   book1,
//   book2,
//   book3,
//   book4,
//   book5,
//   book6,
//   Country1,
//   Country2,
//   Country3,
//   Country4,
//   ignorePostgresExtraAttributesOnList,
//   ignorePostgresExtraAttributesOnRecord,
//   resolveExtractorTemplateForRecordOfExtractors,
// } from "../../index.js";
// import { object } from "zod";
// const env:any = (import.meta as any).env
// console.log("@@@@@@@@@@@@@@@@@@ env", env);

// console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

// describe.sequential("templatesDEFUNCT.unit.test", () => {
describe("extractorTransformerSql.unit.test", () => {
  // ################################################################################################
  it("apply basic transformer for simple string", async () => { // TODO: test failure cases!
      console.log("apply basic transformer for simple string START")

      const result: DomainElement = extractorTransformerSql(
        {
          transformerType: "constantString",
          interpolation: "runtime",
          constantStringValue: "test",
        },
        {
          elementType: "object",
          elementValue: {}
        },
        {
          elementType: "object",
          elementValue: {}
        },
        {}, // extractors
        // "runtime",
        // "ROOT",
        // {
        //   transformerType: "contextReference",
        //   interpolation: "runtime",
        //   referencePath: ["Municipality", "municipalities"],
        // },
        // {},
        // {
        //   Municipality: {
        //     municipalities: "test"
        //   },
        // },
      );

      const expectedResult: DomainElement = {
        elementType: "string",
        elementValue: "\"test\"",
      };

      console.log("################################ result", JSON.stringify(result,null,2))
      console.log("################################ expectedResult", JSON.stringify(expectedResult,null,2))
      expect(result).toEqual(expectedResult);

      console.log("apply basic transformer for simple string END")
    }
  );

});
