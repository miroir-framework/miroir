import { describe, expect } from 'vitest';
import { z } from "zod";

import {
  entity,
  entityDefinition,
  extractorOrCombinerTemplate,
  extractorOrCombinerTemplateRecord,
  report,
  rootReport,
  transformerForBuildPlusRuntime_InnerReference,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import {
  entityPublisher,
  entityUser,
  entityCountry,
  entityAuthor,
  entityBook,
  entityDefinitionCountry,
  entityDefinitionBook,
  entityDefinitionPublisher,
  entityDefinitionUser,
  entityDefinitionAuthor,
  reportAuthorList,
  reportBookList,
  reportPublisherList,
  reportCountryList,
  reportAuthorDetails,
  reportBookDetails,
} from "miroir-example-library";
// import reportBookInstance from "../../src/assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c3503412-3d8a-43ef-a168-aa36e975e606.json";



const libraryEntities = [
  "author",
  "book",
  "country",
  "publisher",
  "user",
]

const reports = [
  "list",
  "details",
]

const libraryAppEntityDefinitionsByName = {
  author: entityDefinitionAuthor,
  book: entityDefinitionBook,
  country: entityDefinitionCountry,
  publisher: entityDefinitionPublisher,
  user: entityDefinitionUser,
};
const libraryAppEntitiesByName = {
  author: entityAuthor,
  book: entityBook,
  country: entityCountry,
  publisher: entityPublisher,
  user: entityUser,
};

const libraryAppReportsByEntityName = {
  author: [reportAuthorList, reportAuthorDetails],
  book: [
    reportBookList, 
    reportBookDetails,
  ],
  country: [reportCountryList],
  publisher: [reportPublisherList],
};

// TODO: check menus, check actions / services, check tests
describe('check library entities', () => {
  describe("check library entities definitions", () => {
    it.each(Object.entries(libraryAppEntityDefinitionsByName))(
      "should parse entity %s using entityDefinition schema",
      (entityName, entityDef) => {
        expect(() => entityDefinition.parse(entityDef)).not.toThrow();
        // expect(entityDef).toHaveProperty('name', entityName);
      }
    );
  });
  describe("check library entities", () => {
    it.each(Object.entries(libraryAppEntitiesByName))(
      "should parse entity %s using entity schema",
      (entityToTestName, entityToTest) => {
        expect(() => entity.parse(entityToTest)).not.toThrow();
        // expect(entity).toHaveProperty('name', entityName);
      }
    );
  });

  describe("reportCountryList",
    ()  => {
      it("reportCountryList.definition.extractorTemplates.countries.parentUuid is parsable by transformerForBuild_InnerReference", () => {
        const zodSchema = z.union([z.string(), z.lazy(() => transformerForBuildPlusRuntime_InnerReference)])
        const transformer = reportCountryList.definition.extractorTemplates.countries.parentUuid;
        console.log("transformer to test=", JSON.stringify(transformer, null, 2));
        expect(() => zodSchema.parse(transformer)).not.toThrow();
      });
    
      it("reportCountryList.definition.extractorTemplates.countries is parsable by extractorOrCombinerTemplate", () => {
        const zodSchema = extractorOrCombinerTemplate
        const transformer = reportCountryList.definition.extractorTemplates.countries;
        console.log("transformer to test=", JSON.stringify(transformer, null, 2));
        expect(() => zodSchema.parse(transformer)).not.toThrow();
      });
    
      it("reportCountryList.definition.extractorTemplates is parsable by extractorOrCombinerTemplateRecord", () => {
        const zodSchema = extractorOrCombinerTemplateRecord
        const transformer = reportCountryList.definition.extractorTemplates;
        console.log("transformer to test=", JSON.stringify(transformer, null, 2));
        expect(() => zodSchema.parse(transformer)).not.toThrow();
      });
    
      it("reportCountryList.definition is parsable by rootReport", () => {
        const zodSchema = rootReport
        const transformer = reportCountryList.definition;
        console.log("transformer to test=", JSON.stringify(transformer, null, 2));
        expect(() => zodSchema.parse(transformer)).not.toThrow();
      });
    }
  )

  describe("reportAuthorList", () => {
    it("reportBookDetails.definition.combinerTemplates.publisher is parsable by extractorOrCombinerTemplate", () => {
      const zodSchema = extractorOrCombinerTemplate;
      const transformer = reportBookDetails.definition.combinerTemplates.publisher;
      console.log("transformer to test=", JSON.stringify(transformer, null, 2));
      expect(() => zodSchema.parse(transformer)).not.toThrow();
    });
  });

  it.each(Object.entries(libraryAppReportsByEntityName))(
    "should parse report %s using report schema",
    (reportName, reportList) => {
      reportList.forEach((reportToTest) => {
        let result = undefined;
        try {
          report.parse(reportToTest);
          result = true;
        } catch (e) {
          // console.error(`Error parsing report ${reportName}:`, JSON.stringify(e, null, 2));
          const firstIssue = (e as any).issues[0];
          console.error(
            `Error parsing report ${reportName}, ${firstIssue.code}, path ${
              firstIssue.path.join(".")
            }, message ${firstIssue.message}`
          );
        }
        expect(result, `Report ${reportName} failed to parse`).toBe(true);
      });
    }
  );
})