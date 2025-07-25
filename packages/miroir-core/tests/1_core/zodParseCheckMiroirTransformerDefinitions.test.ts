"use strict";

import { describe, expect } from 'vitest';
import { z, ZodError, ZodSchema, ZodTypeAny } from "zod";

import {
  entity,
  entityDefinition,
  extractorOrCombinerTemplate,
  extractorOrCombinerTemplateRecord,
  report,
  rootReport,
  TransformerForBuild,
  transformerForBuild,
  transformerForBuild_constantUuid,
  transformerForBuild_InnerReference,
  TransformerForBuildPlusRuntime,
  transformerForBuildPlusRuntime,
  transformerForRuntime,
  ZodParseError,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import entityPublisher from "../../src/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a027c379-8468-43a5-ba4d-bf618be25cab.json";
import entityUser from "../../src/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/ca794e28-b2dc-45b3-8137-00151557eea8.json";
import entityCountry from "../../src/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d3139a6d-0486-4ec8-bded-2a83a3c3cee4.json";
import entityAuthor from "../../src/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d7a144ff-d1b9-4135-800c-a7cfc1f38733.json";
import entityBook from "../../src/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json";

import entityDefinitionCountry from "../../src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/56628e31-3db5-4c5c-9328-4ff7ce54c36a.json";
import entityDefinitionBook from "../../src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/797dd185-0155-43fd-b23f-f6d0af8cae06.json";
import entityDefinitionPublisher from "../../src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/7a939fe8-d119-4e7f-ab94-95b2aae30db9.json";
import entityDefinitionUser from "../../src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/8a4b9e9f-ae19-489f-977f-f3062107e066.json";
import entityDefinitionAuthor from "../../src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b30b7180-f7dc-4cca-b4e8-e476b77fe61d.json";

import reportAuthorList from "../../src/assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/66a09068-52c3-48bc-b8dd-76575bbc8e72.json";
import reportBookList from "../../src/assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/74b010b6-afee-44e7-8590-5f0849e4a5c9.json";
import reportPublisherList from "../../src/assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/a77aa662-006d-46cd-9176-01f02a1a12dc.json";
// import reportBookInstance from "../../src/assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c3503412-3d8a-43ef-a168-aa36e975e606.json";

import reportCountryList from "../../src/assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/08176cc7-43ae-4fca-91b7-bf869d19e4b9.json";
import reportAuthorDetails from "../../src/assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/6d9faa54-643c-4aec-87c3-32635ad95902.json";
import reportBookDetails from "../../src/assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c3503412-3d8a-43ef-a168-aa36e975e606.json";


import test_createEntityAndReportFromSpreadsheetAndUpdateMenu from "../../src/assets/miroir_data/c37625c7-0b35-4d6a-811d-8181eb978301/ffe6ab3c-8296-4293-8aaf-ebbad1f0ac9a.json";
import { zodErrorDeepestIssueLeaves } from "../../src/1_core/zodParseErrorHandler";


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
      transformerType: "constant",
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
        transformerType: "constant",
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
          transformerType: "constant",
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
            transformerType: "constant",
            interpolation: "build",
            value: "instanceList",
          },
        },
      },
    },
  },
};

const transformerForBuildPlusRuntimeTest1: TransformerForBuildPlusRuntime = {
  transformerType: "constant",
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
        transformerType: "constant",
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
        transformerType: "constant",
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
});


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