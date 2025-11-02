import { describe, expect } from 'vitest';
import { z, ZodTypeAny } from "zod";

import {
  TransformerForBuild,
  transformerForBuild,
  TransformerForBuildPlusRuntime,
  transformerForBuildPlusRuntime,
  ZodParseError
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import { zodErrorDeepestIssueLeaves } from "../../src/1_core/zodParseErrorHandler";
import test_createEntityAndReportFromSpreadsheetAndUpdateMenu from "../../src/assets/miroir_data/c37625c7-0b35-4d6a-811d-8181eb978301/ffe6ab3c-8296-4293-8aaf-ebbad1f0ac9a.json";


// ################################################################################################
// TS VALIDATION TESTS ############################################################################
// ################################################################################################
const transformerForBuildTest1: TransformerForBuild = {
  extractorOrCombinerType: "extractorByEntityReturningObjectList",
  parentName: {
    transformerType: "parameterReference",
    interpolation: "build",
    referenceName: "newEntityName",
  },
  parentUuid: {
    transformerType: "mustacheStringTemplate",
    interpolation: "build",
    definition: "{{createEntity_newEntity.uuid}}",
  },
};

const transformerForBuildTest2: TransformerForBuild = {
  transformerType: "freeObjectTemplate",
  interpolation: "build",
  definition: {
    instanceList: {
      extractorOrCombinerType: "extractorByEntityReturningObjectList",
      parentName: {
        transformerType: "parameterReference",
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

const transformerForBuildTest3: TransformerForBuild = {
  extractors: {
    transformerType: "freeObjectTemplate",
    interpolation: "build",
    definition: {
      instanceList: {
        extractorOrCombinerType: "extractorByEntityReturningObjectList",
        parentName: {
          transformerType: "parameterReference",
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

const transformerForBuildTest4: TransformerForBuild = {
  transformerType: "freeObjectTemplate",
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

const transformerForBuildTest5: TransformerForBuild = {
  transformerType: "freeObjectTemplate",
  interpolation: "build",
  definition: {
    extractors: {
      transformerType: "freeObjectTemplate",
      interpolation: "build",
      definition: {
        instanceList: {
          extractorOrCombinerType: "extractorByEntityReturningObjectList",
          parentName: {
            transformerType: "parameterReference",
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
      transformerType: "freeObjectTemplate",
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

const transformerForBuildPlusRuntimeTest1: TransformerForBuildPlusRuntime = {
  transformerType: "returnValue",
  interpolation: "runtime",
  value: "test",
}

const transformerForBuildPlusRuntimeTest2: TransformerForBuildPlusRuntime = {
  transformerType: "freeObjectTemplate",
  interpolation: "runtime",
  definition: {
    instanceList: {
      extractorOrCombinerType: "extractorByEntityReturningObjectList",
      parentName: {
        transformerType: "parameterReference",
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

const transformerForBuildPlusRuntimeTest3: TransformerForBuildPlusRuntime = {
  transformerType: "mapperListToList",
  label: "countryListMapperToObjectList",
  interpolation: "runtime",
  applyTo: [{ a: "a" }, { b: "b" }],
  referenceToOuterObject: "country",
  elementTransformer: {
    transformerType: "freeObjectTemplate",
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
  "transformerForBuild: string is parsable": {
    zodSchema: transformerForBuild,
    transformer: "test",
  },
  "transformerForBuild: number is parsable": {
    zodSchema: transformerForBuild,
    transformer: 1,
  },
  "transformerForBuild: object is parsable": {
    zodSchema: transformerForBuild,
    transformer: { a: 1, b: "test" },
  },
  "transformerForBuild: object with sub transformerForBuid is parsable": {
    zodSchema: transformerForBuild,
    transformer: {
      a: 1,
      b: {
        transformerType: "returnValue",
        interpolation: "build",
        value: "Report",
      },
    },
  },
  "transformerForBuild: test1 is parsable": {
    zodSchema: transformerForBuild,
    transformer: transformerForBuildTest1,
  },
  "transformerForBuild: test2 is parsable": {
    zodSchema: transformerForBuild,
    transformer: transformerForBuildTest2,
  },
  "transformerForBuild: test3 is parsable": {
    zodSchema: transformerForBuild,
    transformer: transformerForBuildTest3,
  },
  "transformerForBuild: test4 is parsable": {
    zodSchema: transformerForBuild,
    transformer: transformerForBuildTest4,
  },
  "transformerForBuild: test5 is parsable": {
    zodSchema: transformerForBuild,
    transformer: transformerForBuildTest5,
  },
  // // templates.createEntity_newEntity
  "transformerForBuild: test_createEntityAndReportFromSpreadsheetAndUpdateMenu templates createEntity_newEntity.definition.uuid is parsable": {
    zodSchema: transformerForBuild,
    transformer: test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
        "create new Entity and reports from spreadsheet"
      ].compositeAction.templates.createEntity_newEntity.definition.uuid
  },
  "transformerForBuild: test_createEntityAndReportFromSpreadsheetAndUpdateMenu templates createEntity_newEntity.definition is parsable": {
    zodSchema: z.record(transformerForBuild),
    transformer: test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
        "create new Entity and reports from spreadsheet"
      ].compositeAction.templates.createEntity_newEntity.definition
  },
  "transformerForBuild: test_createEntityAndReportFromSpreadsheetAndUpdateMenu templates createEntity_newEntity is parsable": {
    zodSchema: transformerForBuild,
    transformer: test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
        "create new Entity and reports from spreadsheet"
      ].compositeAction.templates.createEntity_newEntity
  },
  // templates.createEntity_newEntityDefinition
  "transformerForBuild: test_createEntityAndReportFromSpreadsheetAndUpdateMenu templates createEntity_newEntityDefinition is parsable": {
    zodSchema: transformerForBuild,
    transformer: test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
        "create new Entity and reports from spreadsheet"
      ].compositeAction.templates.createEntity_newEntityDefinition
  },
  // templates.newEntityListReport
  "transformerForBuild: test_createEntityAndReportFromSpreadsheetAndUpdateMenu templates newEntityListReport.definition.uuid is parsable": {
    zodSchema: transformerForBuild,
    transformer: test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
        "create new Entity and reports from spreadsheet"
      ].compositeAction.templates.newEntityListReport.definition.uuid
  },
  "transformerForBuild: test_createEntityAndReportFromSpreadsheetAndUpdateMenu templates newEntityListReport.definition.conceptLevel is parsable": {
    zodSchema: transformerForBuild,
    transformer: test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
        "create new Entity and reports from spreadsheet"
      ].compositeAction.templates.newEntityListReport.definition.conceptLevel
  },
  "transformerForBuild: test_createEntityAndReportFromSpreadsheetAndUpdateMenu templates newEntityListReport.definition.type is parsable": {
    zodSchema: transformerForBuild,
    transformer: test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
        "create new Entity and reports from spreadsheet"
      ].compositeAction.templates.newEntityListReport.definition.type
  },
  "transformerForBuild: test_createEntityAndReportFromSpreadsheetAndUpdateMenu templates newEntityListReport.definition.definition is parsable": {
    zodSchema: transformerForBuild,
    transformer: test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
        "create new Entity and reports from spreadsheet"
      ].compositeAction.templates.newEntityListReport.definition.definition
  },
  "transformerForBuild: test_createEntityAndReportFromSpreadsheetAndUpdateMenu templates newEntityListReport.definition is parsable": {
    // zodSchema: z.record(z.string(), transformerForBuild),
    zodSchema: transformerForBuild,
    transformer: test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
        "create new Entity and reports from spreadsheet"
      ].compositeAction.templates.newEntityListReport.definition
  },
  "transformerForBuild: transformerForBuild: test_createEntityAndReportFromSpreadsheetAndUpdateMenu templates newEntityListReport": {
    zodSchema: transformerForBuild,
    transformer: test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
        "create new Entity and reports from spreadsheet"
      ].compositeAction.templates.newEntityListReport
  },
  "transformerForBuild: test_createEntityAndReportFromSpreadsheetAndUpdateMenu templates are parsable": {
    zodSchema: transformerForBuild,
    transformer: test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions[
        "create new Entity and reports from spreadsheet"
      ].compositeAction.templates
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
    zodSchema: transformerForBuildPlusRuntime,
    transformer: "test",
  },
  "transformerForBuildPlusRuntime: number is parsable": {
    zodSchema: transformerForBuildPlusRuntime,
    transformer: 1,
  },
  "transformerForBuildPlusRuntime: object is parsable": {
    zodSchema: transformerForBuildPlusRuntime,
    transformer: { a: 1, b: "test" },
  },
  "transformerForBuildPlusRuntime: object with sub transformerForBuid is parsable": {
    zodSchema: transformerForBuildPlusRuntime,
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
    zodSchema: transformerForBuildPlusRuntime,
    transformer: transformerForBuildTest1,
  },
  "transformerForBuildPlusRuntime: transformerForBuildTest2 is parsable": {
    zodSchema: transformerForBuildPlusRuntime,
    transformer: transformerForBuildTest2,
  },
  "transformerForBuildPlusRuntime: transformerForBuildTest3 is parsable": {
    zodSchema: transformerForBuildPlusRuntime,
    transformer: transformerForBuildTest3,
  },
  "transformerForBuildPlusRuntime: transformerForBuildTest4 is parsable": {
    zodSchema: transformerForBuildPlusRuntime,
    transformer: transformerForBuildTest4,
  },
  "transformerForBuildPlusRuntime: transformerForBuildTest5 is parsable": {
    zodSchema: transformerForBuildPlusRuntime,
    transformer: transformerForBuildTest5,
  },
  "transformerForBuildPlusRuntime: transformerForBuildPlusRuntimeTest1 is parsable": {
    zodSchema: transformerForBuildPlusRuntime,
    transformer: transformerForBuildPlusRuntimeTest1,
  },
  "transformerForBuildPlusRuntime: transformerForBuildPlusRuntimeTest2 is parsable": {
    zodSchema: transformerForBuildPlusRuntime,
    transformer: transformerForBuildPlusRuntimeTest2,
  },
  "transformerForBuildPlusRuntime: transformerForBuildPlusRuntimeTest3 is parsable": {
    zodSchema: transformerForBuildPlusRuntime,
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