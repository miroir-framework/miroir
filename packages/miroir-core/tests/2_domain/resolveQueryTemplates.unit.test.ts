import { v4 as uuidv4 } from 'uuid';
// import { describe, expect } from 'vitest';

import {
  BoxedExtractorTemplateReturningObject,
  BoxedQueryTemplateWithExtractorCombinerTransformer
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  resolveBoxedExtractorOrCombinerTemplateReturningObjectOrObjectList,
  resolveQueryTemplateWithExtractorCombinerTransformer,
} from "../../src/2_domain/Templates";
describe("resolveQueryTemplates.unit.test", () => {

  // // ################################################################################################
  // it("convert extractorOrCombinerTemplate to query with resolveQueryTemplateForBoxedExtractorOrCombinerReturningObjectOrObjectList", async () => { // TODO: test failure cases!
  //   console.log("convert extractorOrCombinerTemplate to query with resolveQueryTemplateForBoxedExtractorOrCombinerReturningObjectOrObjectList START")
  //   const newApplicationName = "test";
  //   const newUuid = uuidv4();

  //   const uniqueRuntimeTemplate: BoxedExtractorTemplateReturningObject = {
  //     queryType: "boxedExtractorTemplateReturningObject",
  //     deploymentUuid: "xxxxx",
  //     pageParams: {
  //       instanceUuid: "xxxxx",
  //     },
  //     queryParams: {
  //       parentUuid: "yyyyy",
  //     },
  //     contextResults: {},
  //     select: {
  //         extractorTemplateType: "extractorForObjectByDirectReference",
  //         parentName: "Book",
  //         parentUuid: {
  //           transformerType: "constantUuid",
  //           value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //         },
  //         instanceUuid: {
  //           transformerType: "parameterReference",
  //           referenceName: "instanceUuid",
  //         },
  //     },
  //   };

  //   const testResult = resolveBoxedExtractorOrCombinerTemplateReturningObjectOrObjectList(uniqueRuntimeTemplate); // uuid value is ignored
  //   console.log(
  //     "################################ converted queryTemplate to query with resolveQueryTemplateForBoxedExtractorOrCombinerReturningObjectOrObjectList testResults",
  //     JSON.stringify(testResult, null, 2)
  //   );
  //   expect(testResult).toEqual({
  //     pageParams: {
  //       instanceUuid: "xxxxx",
  //     },
  //     queryParams: {
  //       parentUuid: "yyyyy",
  //     },
  //     contextResults: {},
  //     deploymentUuid: "xxxxx",
  //     queryType: "boxedExtractorOrCombinerReturningObject",
  //     select: {
  //       extractorOrCombinerType: "extractorForObjectByDirectReference",
  //       parentName: "Book",
  //       parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //       instanceUuid: "xxxxx",
  //     },
  //   });
  //   console.log("convert extractorOrCombinerTemplate to query with resolveQueryTemplateForBoxedExtractorOrCombinerReturningObjectOrObjectList END")
  // }
  // );

  // ################################################################################################
  it("convert extractorOrCombinerTemplate to query with resolveQueryTemplateWithExtractorCombinerTransformer", async () => { // TODO: test failure cases!
      console.log("convert queryTemplate to query with resolveQueryTemplateWithExtractorCombinerTransformer START")
      const uniqueRuntimeTemplate: BoxedQueryTemplateWithExtractorCombinerTransformer = {
        queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
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
            extractorTemplateType: "extractorForObjectByDirectReference",
            parentName: "Book",
            parentUuid: {
              transformerType: "constantUuid",
              interpolation: "build",
              value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            },
            instanceUuid: {
              transformerType: "parameterReference",
              interpolation: "build",
              referenceName: "instanceUuid",
            },
          },
          fountain: {
            extractorTemplateType: "extractorForObjectByDirectReference",
            parentName: "Fountain",
            parentUuid: {
              transformerType: "parameterReference",
              interpolation: "build",
              referenceName: "parentUuid",
            },
            instanceUuid: {
              transformerType: "constantObject",
              interpolation: "build",
              value: {
                transformerType: "contextReference",
                interpolation: "runtime",
                referenceName: "instanceUuid",
              }
            },
          },
        },
        combinerTemplates: {
          publisher: {
            extractorTemplateType: "combinerForObjectByRelation",
            parentName: "Publisher",
            parentUuid: {
              transformerType: "constantUuid",
              interpolation: "build",
              value: "a027c379-8468-43a5-ba4d-bf618be25cab",
            },
            objectReference: {
              transformerType: "contextReference",
              interpolation: "runtime",
              referenceName: "book",
            },
            AttributeOfObjectToCompareToReferenceUuid: "publisher",
          },
          booksOfPublisher: {
            extractorTemplateType: "combinerByRelationReturningObjectList",
            parentName: "Book",
            parentUuid: {
              transformerType: "constantUuid",
              interpolation: "build",
              value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            },
            objectReference: {
              transformerType: "contextReference",
              interpolation: "runtime",
              referenceName: "publisher",
            },
            AttributeOfListObjectToCompareToReferenceUuid: "publisher",
          },
          booksOfAuthor: {
            extractorTemplateType: "combinerByRelationReturningObjectList",
            parentName: "Book",
            parentUuid: {
              transformerType: "constantUuid",
              interpolation: "build",
              value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            },
            objectReference: {
              transformerType: "contextReference",
              interpolation: "runtime",
              referenceName: "author",
            },
            AttributeOfListObjectToCompareToReferenceUuid: "author",
          },
          publishersOfBooks: {
            extractorTemplateType: "combinerByManyToManyRelationReturningObjectList",
            parentName: "Publisher",
            parentUuid: {
              transformerType: "constantUuid",
              interpolation: "build",
              value: "a027c379-8468-43a5-ba4d-bf618be25cab",
            },
            objectListReference: {
              transformerType: "contextReference",
              interpolation: "runtime",
              referenceName: "booksOfAuthor",
            },
            objectListReferenceAttribute: "publisher",
          },
        },
      };

      const testResult = resolveQueryTemplateWithExtractorCombinerTransformer(uniqueRuntimeTemplate); // uuid value is ignored
      console.log(
        "################################ converted extractorOrCombinerTemplate to query with resolveQueryTemplateWithExtractorCombinerTransformer testResults",
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
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        extractors: {
          book: {
            extractorOrCombinerType: "extractorForObjectByDirectReference",
            parentName: "Book",
            parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            instanceUuid: "xxxxx",
          },
          fountain: {
            extractorOrCombinerType: "extractorForObjectByDirectReference",
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
            extractorOrCombinerType: "combinerForObjectByRelation",
            parentName: "Publisher",
            parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
            objectReference: "book",
            AttributeOfObjectToCompareToReferenceUuid: "publisher",
          },
          booksOfPublisher: {
            extractorOrCombinerType: "combinerByRelationReturningObjectList",
            parentName: "Book",
            parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            objectReference: "publisher",
            AttributeOfListObjectToCompareToReferenceUuid: "publisher",
          },
          booksOfAuthor: {
            extractorOrCombinerType: "combinerByRelationReturningObjectList",
            parentName: "Book",
            parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            objectReference: "author",
            AttributeOfListObjectToCompareToReferenceUuid: "author",
          },
          publishersOfBooks: {
            extractorOrCombinerType: "combinerByManyToManyRelationReturningObjectList",
            parentName: "Publisher",
            parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
            objectListReference: "booksOfAuthor",
            objectListReferenceAttribute: "publisher",
          },
        },
      });
      console.log("convert queryTemplate to query with resolveQueryTemplateWithExtractorCombinerTransformer END")
    }
  );


});
