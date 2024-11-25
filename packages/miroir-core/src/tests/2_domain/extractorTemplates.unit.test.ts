import { v4 as uuidv4 } from 'uuid';
// import { describe, expect } from 'vitest';

import {
  ExtractorTemplateForDomainModelObjects,
  QueryTemplateWithExtractorCombinerTransformer
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { resolveExtractorTemplateForDomainModelObjects } from '../../2_domain/Templates';
import {
  resolveExtractorTemplateForRecordOfExtractors
} from "../../index";
// const env:any = (import.meta as any).env
// console.log("@@@@@@@@@@@@@@@@@@ env", env);

// console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

// describe.sequential("templatesDEFUNCT.unit.test", () => {
describe("extractorTemplates.unit.test", () => {

  // ################################################################################################
  it("convert extractorTemplate to query with resolveExtractorTemplateForRecordOfExtractors", async () => { // TODO: test failure cases!
      console.log("convert queryTemplate to query with resolveExtractorTemplateForRecordOfExtractors START")
      const newApplicationName = "test";
      const newUuid = uuidv4();

      const uniqueRuntimeTemplate: QueryTemplateWithExtractorCombinerTransformer = {
        queryType: "queryTemplateWithExtractorCombinerTransformer",
        deploymentUuid: "xxxxx",
        pageParams: {
          instanceUuid: "xxxxx",
        },
        queryParams: {
          parentUuid: "yyyyy",
        },
        contextResults: {},
        extractorTemplates: {
          book: {
            queryType: "extractorForObjectByDirectReference",
            parentName: "Book",
            parentUuid: {
              transformerType: "constantUuid",
              constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            },
            instanceUuid: {
              transformerType: "parameterReference",
              referenceName: "instanceUuid",
            },
          },
          fountain: {
            queryType: "extractorForObjectByDirectReference",
            parentName: "Fountain",
            parentUuid: {
              transformerType: "parameterReference",
              referenceName: "parentUuid",
            },
            instanceUuid: {
              transformerType: "constantObject",
              constantObjectValue: {
                transformerType: "contextReference",
                interpolation: "runtime",
                referenceName: "instanceUuid",
              }
            },
          },
        },
        combinerTemplates: {
          publisher: {
            queryType: "extractorCombinerForObjectByRelation",
            parentName: "Publisher",
            parentUuid: {
              transformerType: "constantUuid",
              constantUuidValue: "a027c379-8468-43a5-ba4d-bf618be25cab",
            },
            objectReference: {
              transformerType: "contextReference",
              interpolation: "runtime",
              referenceName: "book",
            },
            AttributeOfObjectToCompareToReferenceUuid: "publisher",
          },
          booksOfPublisher: {
            queryType: "combinerByRelationReturningObjectList",
            parentName: "Book",
            parentUuid: {
              transformerType: "constantUuid",
              constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            },
            objectReference: {
              transformerType: "contextReference",
              interpolation: "runtime",
              referenceName: "publisher",
            },
            AttributeOfListObjectToCompareToReferenceUuid: "publisher",
          },
          booksOfAuthor: {
            queryType: "combinerByRelationReturningObjectList",
            parentName: "Book",
            parentUuid: {
              transformerType: "constantUuid",
              constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            },
            objectReference: {
              transformerType: "contextReference",
              interpolation: "runtime",
              referenceName: "author",
            },
            AttributeOfListObjectToCompareToReferenceUuid: "author",
          },
          publishersOfBooks: {
            queryType: "combinerByManyToManyRelationReturningObjectList",
            parentName: "Publisher",
            parentUuid: {
              transformerType: "constantUuid",
              constantUuidValue: "a027c379-8468-43a5-ba4d-bf618be25cab",
            },
            objectListReference: {
              transformerType: "contextReference",
              referenceName: "booksOfAuthor",
            },
            objectListReferenceAttribute: "publisher",
          },
        },
      };

      const testResult = resolveExtractorTemplateForRecordOfExtractors(uniqueRuntimeTemplate); // uuid value is ignored
      console.log(
        "################################ converted extractorTemplate to query with resolveExtractorTemplateForRecordOfExtractors testResults",
        JSON.stringify(testResult, null, 2)
      );
      expect(testResult).toEqual({
        pageParams: {
          instanceUuid: "xxxxx",
        },
        queryParams: {
          parentUuid: "yyyyy",
        },
        contextResults: {},
        deploymentUuid: "xxxxx",
        queryType: "queryWithExtractorCombinerTransformer",
        extractors: {
          book: {
            queryType: "extractorForObjectByDirectReference",
            parentName: "Book",
            parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            instanceUuid: "xxxxx",
          },
          fountain: {
            queryType: "extractorForObjectByDirectReference",
            parentName: "Fountain",
            parentUuid: "yyyyy",
            instanceUuid: {
              transformerType: "contextReference",
              interpolation: "runtime",
              referenceName: "instanceUuid",
            },
          },
        },
        combiners: {
          publisher: {
            queryType: "extractorCombinerForObjectByRelation",
            parentName: "Publisher",
            parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
            objectReference: "book",
            AttributeOfObjectToCompareToReferenceUuid: "publisher",
          },
          booksOfPublisher: {
            queryType: "combinerByRelationReturningObjectList",
            parentName: "Book",
            parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            objectReference: "publisher",
            AttributeOfListObjectToCompareToReferenceUuid: "publisher",
          },
          booksOfAuthor: {
            queryType: "combinerByRelationReturningObjectList",
            parentName: "Book",
            parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            objectReference: "author",
            AttributeOfListObjectToCompareToReferenceUuid: "author",
          },
          publishersOfBooks: {
            queryType: "combinerByManyToManyRelationReturningObjectList",
            parentName: "Publisher",
            parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
            objectListReference: "booksOfAuthor",
            objectListReferenceAttribute: "publisher",
          },
        },
      });
      console.log("convert queryTemplate to query with resolveExtractorTemplateForRecordOfExtractors END")
    }
  );

  // ################################################################################################
  it("convert extractorTemplate to query with resolveExtractorTemplateForDomainModelObjects", async () => { // TODO: test failure cases!
      console.log("convert extractorTemplate to query with resolveExtractorTemplateForDomainModelObjects START")
      const newApplicationName = "test";
      const newUuid = uuidv4();

      const uniqueRuntimeTemplate: ExtractorTemplateForDomainModelObjects = {
        queryType: "extractorTemplateForDomainModelObjects",
        deploymentUuid: "xxxxx",
        pageParams: {
          instanceUuid: "xxxxx",
        },
        queryParams: {
          parentUuid: "yyyyy",
        },
        contextResults: {},
        select: {
            queryType: "extractorForObjectByDirectReference",
            parentName: "Book",
            parentUuid: {
              transformerType: "constantUuid",
              constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            },
            instanceUuid: {
              transformerType: "parameterReference",
              referenceName: "instanceUuid",
            },
        },
      };

      const testResult = resolveExtractorTemplateForDomainModelObjects(uniqueRuntimeTemplate); // uuid value is ignored
      console.log(
        "################################ converted queryTemplate to query with resolveExtractorTemplateForDomainModelObjects testResults",
        JSON.stringify(testResult, null, 2)
      );
      expect(testResult).toEqual({
        pageParams: {
          instanceUuid: "xxxxx",
        },
        queryParams: {
          parentUuid: "yyyyy",
        },
        contextResults: {},
        deploymentUuid: "xxxxx",
        queryType: "queryForExtractorOrCombinerReturningObjectOrObjectList",
        select: {
          queryType: "extractorForObjectByDirectReference",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          instanceUuid: "xxxxx",
        },
      });
      console.log("convert extractorTemplate to query with resolveExtractorTemplateForDomainModelObjects END")
    }
  );

});
