import { v4 as uuidv4 } from 'uuid';
// import { describe, expect } from 'vitest';

import { transformer_apply } from "../../2_domain/Transformers.js";
import {
  DomainAction,
  StoreUnitConfiguration,
  TransformerForBuild,
  DomainElementObject,
  TransformerForRuntime,
  EntityInstance,
  TransformerForRuntime_InnerReference,
  ExtractorTemplateForRecordOfExtractors,
  ExtractorTemplateForDomainModelObjects,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
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
} from "../../index.js";
import { object } from 'zod';
import { resolveExtractorTemplateForDomainModelObjects } from '../../2_domain/Templates.js';
// const env:any = (import.meta as any).env
// console.log("@@@@@@@@@@@@@@@@@@ env", env);

// console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

// describe.sequential("templatesDEFUNCT.unit.test", () => {
describe("queryTemplates.unit.test", () => {

  // ################################################################################################
  it("convert queryTemplate to query with resolveExtractorTemplateForRecordOfExtractors", async () => { // TODO: test failure cases!
      console.log("convert queryTemplate to query with resolveExtractorTemplateForRecordOfExtractors START")
      const newApplicationName = "test";
      const newUuid = uuidv4();

      const uniqueRuntimeTemplate: ExtractorTemplateForRecordOfExtractors = {
        queryType: "extractorTemplateForRecordOfExtractors",
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
            queryType: "selectObjectByDirectReference",
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
            queryType: "selectObjectByDirectReference",
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
            queryType: "selectObjectByRelation",
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
            queryType: "selectObjectListByRelation",
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
            queryType: "selectObjectListByRelation",
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
            queryType: "selectObjectListByManyToManyRelation",
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
        "################################ converted queryTemplate to query with resolveExtractorTemplateForRecordOfExtractors testResults",
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
        queryType: "extractorForRecordOfExtractors",
        extractors: {
          book: {
            queryType: "selectObjectByDirectReference",
            parentName: "Book",
            parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            instanceUuid: "xxxxx",
          },
          fountain: {
            queryType: "selectObjectByDirectReference",
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
            queryType: "selectObjectByRelation",
            parentName: "Publisher",
            parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
            objectReference: "book",
            AttributeOfObjectToCompareToReferenceUuid: "publisher",
          },
          booksOfPublisher: {
            queryType: "selectObjectListByRelation",
            parentName: "Book",
            parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            objectReference: "publisher",
            AttributeOfListObjectToCompareToReferenceUuid: "publisher",
          },
          booksOfAuthor: {
            queryType: "selectObjectListByRelation",
            parentName: "Book",
            parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            objectReference: "author",
            AttributeOfListObjectToCompareToReferenceUuid: "author",
          },
          publishersOfBooks: {
            queryType: "selectObjectListByManyToManyRelation",
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
  it("convert queryTemplate to query with resolveExtractorTemplateForDomainModelObjects", async () => { // TODO: test failure cases!
      console.log("convert queryTemplate to query with resolveExtractorTemplateForDomainModelObjects START")
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
            queryType: "selectObjectByDirectReference",
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
        queryType: "extractorForDomainModelObjects",
        select: {
          queryType: "selectObjectByDirectReference",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          instanceUuid: "xxxxx",
        },
      });
      console.log("convert queryTemplate to query with resolveExtractorTemplateForDomainModelObjects END")
    }
  );

});
