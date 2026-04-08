import { describe, expect, it } from 'vitest';
import { z, ZodTypeAny } from "zod";

import {
  CoreTransformerForBuildPlusRuntime,
  coreTransformerForBuildPlusRuntime,
  ZodParseError
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import { zodErrorDeepestIssueLeaves } from "../../src/1_core/zodParseErrorHandler";
import { test_createEntityAndReportFromSpreadsheetAndUpdateMenu } from "miroir-test-app_deployment-miroir";


// ################################################################################################
// TS VALIDATION TESTS ############################################################################
// ################################################################################################
const transformerForBuildTest1: CoreTransformerForBuildPlusRuntime = {
  extractorOrCombinerType: "extractorInstancesByEntity",
  parentName: {
    transformerType: "getFromParameters",
    interpolation: "build",
    referenceName: "newEntityName",
  },
  parentUuid: {
    transformerType: "mustacheStringTemplate",
    interpolation: "build",
    definition: "{{createEntity_newEntity.uuid}}",
  },
};

const transformerForBuildTest2: CoreTransformerForBuildPlusRuntime = {
  transformerType: "createObject",
  interpolation: "build",
  definition: {
    instanceList: {
      extractorOrCombinerType: "extractorInstancesByEntity",
      parentName: {
        transformerType: "getFromParameters",
        interpolation: "build",
        referenceName: "newEntityName",
      },
      parentUuid: {
        transformerType: "mustacheStringTemplate",
        interpolation: "build",
        definition: "{{createEntity_newEntity.uuid}}",
      },
    },
  },
};

const transformerForBuildTest3: CoreTransformerForBuildPlusRuntime = {
  extractors: {
    transformerType: "createObject",
    interpolation: "build",
    definition: {
      instanceList: {
        extractorOrCombinerType: "extractorInstancesByEntity",
        parentName: {
          transformerType: "getFromParameters",
          interpolation: "build",
          referenceName: "newEntityName",
        },
        parentUuid: {
          transformerType: "mustacheStringTemplate",
          interpolation: "build",
          definition: "{{createEntity_newEntity.uuid}}",
        },
      },
    },
  },
};

const transformerForBuildTest4: CoreTransformerForBuildPlusRuntime = {
  transformerType: "createObject",
  interpolation: "build",
  definition: {
    type: {
      transformerType: "returnValue",
      interpolation: "build",
      value: "objectListReportSection",
    },
    definition: {
      label: {
        transformerType: "mustacheStringTemplate",
        interpolation: "build",
        definition: "{{newEntityName}}s",
      },
      parentUuid: {
        transformerType: "mustacheStringTemplate",
        interpolation: "build",
        definition: "{{createEntity_newEntity.uuid}}",
      },
      fetchedDataReference: {
        transformerType: "returnValue",
        interpolation: "build",
        value: "instanceList",
      },
    },
  },
};

const transformerForBuildTest5: CoreTransformerForBuildPlusRuntime = {
  transformerType: "createObject",
  interpolation: "build",
  definition: {
    extractors: {
      transformerType: "createObject",
      interpolation: "build",
      definition: {
        instanceList: {
          extractorOrCombinerType: "extractorInstancesByEntity",
          parentName: {
            transformerType: "getFromParameters",
            interpolation: "build",
            referenceName: "newEntityName",
          },
          parentUuid: {
            transformerType: "mustacheStringTemplate",
            interpolation: "build",
            definition: "{{createEntity_newEntity.uuid}}",
          },
        },
      },
    },
    section: {
      transformerType: "createObject",
      interpolation: "build",
      definition: {
        type: {
          transformerType: "returnValue",
          interpolation: "build",
          value: "objectListReportSection",
        },
        definition: {
          label: {
            transformerType: "mustacheStringTemplate",
            interpolation: "build",
            definition: "{{newEntityName}}s",
          },
          parentUuid: {
            transformerType: "mustacheStringTemplate",
            interpolation: "build",
            definition: "{{createEntity_newEntity.uuid}}",
          },
          fetchedDataReference: {
            transformerType: "returnValue",
            interpolation: "build",
            value: "instanceList",
          },
        },
      },
    },
  },
};

const transformerForBuildPlusRuntimeTest1: CoreTransformerForBuildPlusRuntime = {
  transformerType: "returnValue",
  interpolation: "runtime",
  value: "test",
}

const transformerForBuildPlusRuntimeTest2: CoreTransformerForBuildPlusRuntime = {
  transformerType: "createObject",
  interpolation: "runtime",
  definition: {
    instanceList: {
      extractorOrCombinerType: "extractorInstancesByEntity",
      parentName: {
        transformerType: "getFromParameters",
        interpolation: "build",
        referenceName: "newEntityName",
      },
      parentUuid: {
        transformerType: "mustacheStringTemplate",
        interpolation: "build",
        definition: "{{createEntity_newEntity.uuid}}",
      },
    },
  },
};

const transformerForBuildPlusRuntimeTest3: CoreTransformerForBuildPlusRuntime = {
  transformerType: "mapList",
  label: "countryListMapperToObjectList",
  interpolation: "runtime",
  applyTo: [{ a: "a" }, { b: "b" }],
  referenceToOuterObject: "country",
  elementTransformer: {
    transformerType: "createObject",
    interpolation: "runtime",
    definition: {
      test: "1",
    },
  },
};
// ################################################################################################
// ZOD VALIDATION TESTS ###########################################################################
// ################################################################################################
type ZodParseTest = {
  zodSchema: ZodTypeAny,
  transformer: any
}

const createEntityZodParseTests: Record<string, ZodParseTest> = {
  // simple tests
  "coreTransformerForBuildPlusRuntime: string is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: "test",
  },
  "coreTransformerForBuildPlusRuntime: number is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: 1,
  },
  "coreTransformerForBuildPlusRuntime: object is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: { a: 1, b: "test" },
  },
  "coreTransformerForBuildPlusRuntime: object with sub transformerForBuid is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: {
      a: 1,
      b: {
        transformerType: "returnValue",
        interpolation: "build",
        value: "Report",
      },
    },
  },
  "coreTransformerForBuildPlusRuntime: test1 is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: transformerForBuildTest1,
  },
  "coreTransformerForBuildPlusRuntime: test2 is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: transformerForBuildTest2,
  },
  "coreTransformerForBuildPlusRuntime: test3 is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: transformerForBuildTest3,
  },
  "coreTransformerForBuildPlusRuntime: test4 is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: transformerForBuildTest4,
  },
  "coreTransformerForBuildPlusRuntime: test5 is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: transformerForBuildTest5,
  },
  // // templates.createEntity_newEntity
  "coreTransformerForBuildPlusRuntime: test_createEntityAndReportFromSpreadsheetAndUpdateMenu templates createEntity_newEntity.definition.uuid is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
        "create new Entity and reports from spreadsheet"
      ].compositeActionSequence.payload.templates.createEntity_newEntity.definition.uuid
  },
  "coreTransformerForBuildPlusRuntime: test_createEntityAndReportFromSpreadsheetAndUpdateMenu templates createEntity_newEntity.definition is parsable": {
    zodSchema: z.record(coreTransformerForBuildPlusRuntime),
    transformer: test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
        "create new Entity and reports from spreadsheet"
      ].compositeActionSequence.payload.templates.createEntity_newEntity.definition
  },
  "coreTransformerForBuildPlusRuntime: test_createEntityAndReportFromSpreadsheetAndUpdateMenu templates createEntity_newEntity is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
        "create new Entity and reports from spreadsheet"
      ].compositeActionSequence.payload.templates.createEntity_newEntity
  },
  // templates.createEntity_newEntityDefinition
  "coreTransformerForBuildPlusRuntime: test_createEntityAndReportFromSpreadsheetAndUpdateMenu templates createEntity_newEntityDefinition is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
        "create new Entity and reports from spreadsheet"
      ].compositeActionSequence.payload.templates.createEntity_newEntityDefinition
  },
  // templates.newEntityListReport
  "coreTransformerForBuildPlusRuntime: test_createEntityAndReportFromSpreadsheetAndUpdateMenu templates newEntityListReport.definition.uuid is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
        "create new Entity and reports from spreadsheet"
      ].compositeActionSequence.payload.templates.newEntityListReport.definition.uuid
  },
  "coreTransformerForBuildPlusRuntime: test_createEntityAndReportFromSpreadsheetAndUpdateMenu templates newEntityListReport.definition.conceptLevel is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
        "create new Entity and reports from spreadsheet"
      ].compositeActionSequence.payload.templates.newEntityListReport.definition.conceptLevel
  },
  "coreTransformerForBuildPlusRuntime: test_createEntityAndReportFromSpreadsheetAndUpdateMenu templates newEntityListReport.definition.type is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
        "create new Entity and reports from spreadsheet"
      ].compositeActionSequence.payload.templates.newEntityListReport.definition.type
  },
  "coreTransformerForBuildPlusRuntime: test_createEntityAndReportFromSpreadsheetAndUpdateMenu templates newEntityListReport.definition.definition is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
        "create new Entity and reports from spreadsheet"
      ].compositeActionSequence.payload.templates.newEntityListReport.definition.definition
  },
  "coreTransformerForBuildPlusRuntime: test_createEntityAndReportFromSpreadsheetAndUpdateMenu templates newEntityListReport.definition is parsable": {
    // zodSchema: z.record(z.string(), coreTransformerForBuildPlusRuntime),
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
        "create new Entity and reports from spreadsheet"
      ].compositeActionSequence.payload.templates.newEntityListReport.definition
  },
  "coreTransformerForBuildPlusRuntime: coreTransformerForBuildPlusRuntime: test_createEntityAndReportFromSpreadsheetAndUpdateMenu templates newEntityListReport": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
        "create new Entity and reports from spreadsheet"
      ].compositeActionSequence.payload.templates.newEntityListReport
  },
  "coreTransformerForBuildPlusRuntime: test_createEntityAndReportFromSpreadsheetAndUpdateMenu templates are parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
        "create new Entity and reports from spreadsheet"
      ].compositeActionSequence.payload.templates
  },
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // transformerForRuntime
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
    // simple tests
  "transformerForBuildPlusRuntime: string is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: "test",
  },
  "transformerForBuildPlusRuntime: number is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: 1,
  },
  "transformerForBuildPlusRuntime: object is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: { a: 1, b: "test" },
  },
  "transformerForBuildPlusRuntime: object with sub transformerForBuid is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: {
      a: 1,
      b: {
        transformerType: "returnValue",
        interpolation: "runtime",
        value: "Report",
      },
    },
  },
  "transformerForBuildPlusRuntime: transformerForBuildTest1 is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: transformerForBuildTest1,
  },
  "transformerForBuildPlusRuntime: transformerForBuildTest2 is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: transformerForBuildTest2,
  },
  "transformerForBuildPlusRuntime: transformerForBuildTest3 is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: transformerForBuildTest3,
  },
  "transformerForBuildPlusRuntime: transformerForBuildTest4 is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: transformerForBuildTest4,
  },
  "transformerForBuildPlusRuntime: transformerForBuildTest5 is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: transformerForBuildTest5,
  },
  "transformerForBuildPlusRuntime: transformerForBuildPlusRuntimeTest1 is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: transformerForBuildPlusRuntimeTest1,
  },
  "transformerForBuildPlusRuntime: transformerForBuildPlusRuntimeTest2 is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: transformerForBuildPlusRuntimeTest2,
  },
  "transformerForBuildPlusRuntime: transformerForBuildPlusRuntimeTest3 is parsable": {
    zodSchema: coreTransformerForBuildPlusRuntime,
    transformer: transformerForBuildPlusRuntimeTest3,
  },
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
describe("test_createEntityAndReportFromSpreadsheetAndUpdateMenu", () => {
  it.each(Object.entries(createEntityZodParseTests))("%s", (testName, testParams) => {
    const { zodSchema, transformer } = testParams;
    console.log(expect.getState().currentTestName, "transformer to test=", JSON.stringify(transformer, null, 2));
    try {
      zodSchema.parse(transformer);
      expect(true).toBe(true); // Pass the test if parsing does not throw an error
    } catch (error) {
      const zodParseError = error as ZodParseError;
      console.error("Zod parse error :", JSON.stringify(zodErrorDeepestIssueLeaves(zodParseError), null, 2));
      expect(true).toBe(false); // Fail the test if parsing throws an error
      // throw error; // Re-throw the error to fail the test
    }
    // expect(() => zodSchema.parse(transformer)).not.toThrow();
  });
}, { timeout: 20_000 });


  // it("reportCountryList.definition.extractorTemplates.countries is parsable by extractorOrCombinerTemplate", () => {
  //   const zodSchema = extractorOrCombinerTemplate
  //   const transformer = reportCountryList.definition.extractorTemplates.countries;
  //   console.log("transformer to test=", JSON.stringify(transformer, null, 2));
  //   expect(() => zodSchema.parse(transformer)).not.toThrow();
  // });

  // it("reportCountryList.definition.extractorTemplates is parsable by extractorOrCombinerTemplateRecord", () => {
  //   const zodSchema = extractorOrCombinerTemplateRecord
  //   const transformer = reportCountryList.definition.extractorTemplates;
  //   console.log("transformer to test=", JSON.stringify(transformer, null, 2));
  //   expect(() => zodSchema.parse(transformer)).not.toThrow();
  // });

  // it("reportCountryList.definition is parsable by rootReport", () => {
  //   const zodSchema = rootReport
  //   const transformer = reportCountryList.definition;
  //   console.log("transformer to test=", JSON.stringify(transformer, null, 2));
  //   expect(() => zodSchema.parse(transformer)).not.toThrow();
  // });
// });


// })