import adminConfigurationDeploymentLibrary from "../../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json";

import { DomainState } from "../../0_interfaces/2_domain/DomainControllerInterface.js";
import {
  getSelectorParams,
  extractWithManyExtractorsFromDomainState,
  extractWithExtractorFromDomainState
} from "../../2_domain/DomainStateQuerySelectors.js";

import {
  DomainElement,
  ExtractorForRecordOfExtractors,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { circularReplacer } from "../../tools.js";
import domainStateImport from "./domainState.json";

const domainState: DomainState = domainStateImport as DomainState;

describe("domainSelector", () => {
  // ###########################################################################################
  it('error on non-existing Entity: EntityNotFound',
    () => {
      const queryParam: ExtractorForRecordOfExtractors = {
        queryType: "extractorForRecordOfExtractors",
        deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        contextResults: { elementType: "object", elementValue: {} },
        pageParams: { elementType: "object", elementValue: {} },
        queryParams: { elementType: "object", elementValue: {} },
        queryTransformers: {
          book: {
            queryType: "selectObjectByDirectReference",
            parentName: "Book",
            parentUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "XXXXXX"
            },
            instanceUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
            }
          },
        },
      };
      // const result = extractWithManyExtractorsFromDomainState(domainState, getSelectorParams(queryParam));
      const result = extractWithExtractorFromDomainState(domainState, getSelectorParams(queryParam));
      console.info("result", result);
      expect(result).toEqual({
        elementType: "object",
        elementValue: {
          book: {
            elementType: "failure",
            elementValue: {
              applicationSection: "data",
              deploymentUuid: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
              entityUuid: "XXXXXX",
              queryFailure: "EntityNotFound",
            },
          },
        },
      });
    }
  )

  // ###########################################################################################
  it('error on non-existing Entity: EntityNotFound',
    () => {
      const queryParam: ExtractorForRecordOfExtractors = {
        queryType: "extractorForRecordOfExtractors",
        deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        contextResults: { elementType: "object", elementValue: {} },
        pageParams: { elementType: "object", elementValue: {} },
        queryParams: { elementType: "object", elementValue: {} },
        queryTransformers: {
          book: {
            queryType: "selectObjectByDirectReference",
            parentName: "Book",
            parentUuid: {
              "queryTemplateType": "constantUuid",
              "constantUuidValue": "XXXXXX"
            },
            instanceUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
            }
          },
        },
      };
      // const result = extractWithManyExtractorsFromDomainState(domainState, getSelectorParams(queryParam));
      const result = extractWithExtractorFromDomainState(domainState, getSelectorParams(queryParam));
      console.info("result", result);
      expect(result).toEqual({
        elementType: "object",
        elementValue: {
          book: {
            elementType: "failure",
            elementValue: {
              applicationSection: "data",
              deploymentUuid: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
              entityUuid: "XXXXXX",
              queryFailure: "EntityNotFound",
            },
          },
        },
      });
    }
  )

  // ###########################################################################################
  it('error on non-existing object uuid: InstanceNotFound',
    () => {

      const queryParam: ExtractorForRecordOfExtractors = {
        queryType: "extractorForRecordOfExtractors",
        "deploymentUuid": adminConfigurationDeploymentLibrary.uuid,
        "contextResults": { elementType: "object", elementValue: {} },
        pageParams: { elementType: "object", elementValue: {} },
        queryParams: { elementType: "object", elementValue: {} },
        "queryTransformers": {
          "book": {
            queryType: "selectObjectByDirectReference",
            parentName: "Book",
            parentUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
            },
            instanceUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "XXXXXXXXX"
            }
          }
        }
      };

      expect(
        // extractWithManyExtractorsFromDomainState(domainState, getSelectorParams(queryParam)))
        extractWithExtractorFromDomainState(domainState, getSelectorParams(queryParam)))
        .toEqual({
        elementType: "object",
        elementValue: {
          book: {
            elementType: "failure",
            elementValue: {
              applicationSection: "data",
              deploymentUuid: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
              entityUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
              instanceUuid: "XXXXXXXXX",
              queryFailure: "InstanceNotFound",
            },
          },
        },
      });
    }
  )

  // ###########################################################################################
  it('select 1 object from Domain State',
    () => {

      const queryParam: ExtractorForRecordOfExtractors = {
        queryType: "extractorForRecordOfExtractors",
        deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        contextResults: { elementType: "object", elementValue: {} },
        pageParams: { elementType: "object", elementValue: {} },
        queryParams: { elementType: "object", elementValue: {} },
        extractors: {
          book: {
            queryType: "selectObjectByDirectReference",
            parentName: "Book",
            parentUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            },
            instanceUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
            },
          },
        },
      };

      const queryResult:any = extractWithExtractorFromDomainState(domainState, getSelectorParams(queryParam));

      expect(queryResult.elementValue.book.elementValue).toBe(domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"])
    }
  )


  // ###########################################################################################
  it('select 1 object from Domain State using context reference',
    () => {

      const queryParam: ExtractorForRecordOfExtractors = {
        queryType: "extractorForRecordOfExtractors",
        deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        contextResults: { elementType: "object", elementValue: {} },
        pageParams: { elementType: "object", elementValue: {} },
        queryParams: { elementType: "object", elementValue: {} },
        extractors: {
          book: {
            queryType: "selectObjectByDirectReference",
            parentName: "Book",
            parentUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            },
            instanceUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
            },
          },
        },
        queryTransformers: {
          book2: {
            queryType: "queryContextReference",
            queryReference: "book",
          },
        },
      };

      const queryResult:any = extractWithExtractorFromDomainState(domainState, getSelectorParams(queryParam));

      expect(queryResult.elementValue.book2.elementValue).toBe(domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"])
    }
  )

  // ###########################################################################################
  it('select 1 object from Domain State using direct query parameter reference',
    () => {

      const queryParam: ExtractorForRecordOfExtractors = {
        queryType: "extractorForRecordOfExtractors",
        deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        contextResults: { elementType: "object", elementValue: {} },
        pageParams: { elementType: "object", elementValue: {} },
        queryParams: { elementType: "object", elementValue: { wantedBookUuid: { elementType: "instanceUuid", elementValue:"caef8a59-39eb-48b5-ad59-a7642d3a1e8f" } } },
        extractors: {
          book: {
            queryType: "selectObjectByDirectReference",
            parentName: "Book",
            parentUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            },
            instanceUuid: {
              queryTemplateType: "queryParameterReference",
              referenceName: "wantedBookUuid",
            },
          },
        },
        queryTransformers: {
        },
      };

      const queryResult:any = extractWithExtractorFromDomainState(domainState, getSelectorParams(queryParam));
      console.log("queryResult", JSON.stringify(queryResult, circularReplacer(), 2));

      expect(queryResult.elementValue.book.elementValue).toBe(domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"])
    }    
  )

  // ###########################################################################################
  it('select 1 object from the uuid found in an attribute of another object from Domain State',
    () => {

      const queryParam: ExtractorForRecordOfExtractors = {
        queryType: "extractorForRecordOfExtractors",
        deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        contextResults: { elementType: "object", elementValue: {} },
        pageParams: { elementType: "object", elementValue: {} },
        queryParams: { elementType: "object", elementValue: {} },
        extractors: {
          book: {
            queryType: "selectObjectByDirectReference",
            parentName: "Book",
            parentUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            },
            instanceUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
            },
          },
        },
        queryTransformers: {
          publisher: {
            queryType: "selectObjectByRelation",
            parentName: "Publisher",
            parentUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "a027c379-8468-43a5-ba4d-bf618be25cab",
            },
            objectReference: {
              queryTemplateType: "queryContextReference",
              referenceName: "book",
            },
            AttributeOfObjectToCompareToReferenceUuid: "publisher",
          },
        },
      };

      const queryResult:any = extractWithExtractorFromDomainState(domainState, getSelectorParams(queryParam));

      console.log("result XXXXXXXXXXXXXXXXXXXXXXXXXXXXX", JSON.stringify(queryResult, circularReplacer(), 2));
      
      expect(queryResult.elementType).toBe("object")
      expect((queryResult.elementValue as any)["publisher"].elementValue).toBe(
        domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["a027c379-8468-43a5-ba4d-bf618be25cab"][
          "516a7366-39e7-4998-82cb-80199a7fa667"
        ]
      );
    }
  )

  // ###########################################################################################
  it('select Authors',
    () => {

      const queryParam: ExtractorForRecordOfExtractors = {
        queryType: "extractorForRecordOfExtractors",
        deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        contextResults: { elementType: "object", elementValue: {} },
        pageParams: {
          elementType: "object",
          elementValue: {
            applicationSection: {
              elementType: "string",
              elementValue: "data",
            },
          },
        },
        queryParams: { elementType: "object", elementValue: {} },
        extractors: {
          authors: {
            queryType: "extractObjectListByEntity",
            parentName: "Author",
            parentUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
            },
          },
        },
        queryTransformers: {
        },
      };

      const queryResult:any = extractWithExtractorFromDomainState(domainState, getSelectorParams(queryParam));

      console.log("result", queryResult);
      
      expect((queryResult.elementValue as any)["authors"].elementValue).toEqual({
          '4441169e-0c22-4fbc-81b2-28c87cf48ab2': {
            uuid: '4441169e-0c22-4fbc-81b2-28c87cf48ab2',
            parentName: 'Author',
            parentUuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
            name: 'Don Norman'
          },
          'ce7b601d-be5f-4bc6-a5af-14091594046a': {
            uuid: 'ce7b601d-be5f-4bc6-a5af-14091594046a',
            parentName: 'Author',
            parentUuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
            name: 'Paul Veyne'
          },
          'd14c1c0c-eb2e-42d1-8ac1-2d58f5143c17': {
            uuid: 'd14c1c0c-eb2e-42d1-8ac1-2d58f5143c17',
            parentName: 'Author',
            parentUuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
            conceptLevel: 'Data',
            name: 'Cornell Woolrich'
          },
          'e4376314-d197-457c-aa5e-d2da5f8d5977': {
            uuid: 'e4376314-d197-457c-aa5e-d2da5f8d5977',
            parentName: 'Author',
            parentUuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
            conceptLevel: 'Data',
            name: 'Catherine Guérard'
          }
        });
    }
  )

  // ###########################################################################################
  it('select Authors with filter',
    () => {

      const queryParam: ExtractorForRecordOfExtractors = {
        queryType: "extractorForRecordOfExtractors",
        deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        contextResults: { elementType: "object", elementValue: {} },
        pageParams: {
          elementType: "object",
          elementValue: {
            applicationSection: {
              elementType: "string",
              elementValue: "data",
            },
          },
        },
        queryParams: { elementType: "object", elementValue: {} },
        extractors: {
          authors: {
            queryType: "extractObjectListByEntity",
            parentName: "Author",
            parentUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
            },
            filter: {
              attributeName: "name",
              value: {
                queryTemplateType: "constantString",
                definition: "or",
              },
            },
          },
        },
      };

      const queryResult:any = extractWithExtractorFromDomainState(domainState, getSelectorParams(queryParam));

      console.log("result", queryResult);
      
      expect((queryResult.elementValue as any)["authors"].elementValue).toEqual({
          '4441169e-0c22-4fbc-81b2-28c87cf48ab2': {
            uuid: '4441169e-0c22-4fbc-81b2-28c87cf48ab2',
            parentName: 'Author',
            parentUuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
            name: 'Don Norman'
          },
          'd14c1c0c-eb2e-42d1-8ac1-2d58f5143c17': {
            uuid: 'd14c1c0c-eb2e-42d1-8ac1-2d58f5143c17',
            parentName: 'Author',
            parentUuid: 'd7a144ff-d1b9-4135-800c-a7cfc1f38733',
            conceptLevel: 'Data',
            name: 'Cornell Woolrich'
          },
        });
    }
  )
  
  
  // ###########################################################################################
  it('select Books of Publisher of given Book from Domain State',
    () => {

      const queryParam: ExtractorForRecordOfExtractors = {
        queryType: "extractorForRecordOfExtractors",
        deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        contextResults: { elementType: "object", elementValue: {} },
        pageParams: {
          elementType: "object",
          elementValue: {
            applicationSection: {
              elementType: "string",
              elementValue: "data",
            },
          },
        },
        queryParams: { elementType: "object", elementValue: {} },
        extractors: {
          book: {
            queryType: "selectObjectByDirectReference",
            parentName: "Book",
            parentUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            },
            instanceUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
            },
          },
        },
        queryTransformers: {
          publisher: {
            queryType: "selectObjectByRelation",
            parentName: "Publisher",
            parentUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "a027c379-8468-43a5-ba4d-bf618be25cab",
            },
            objectReference: {
              queryTemplateType: "queryContextReference",
              referenceName: "book",
            },
            AttributeOfObjectToCompareToReferenceUuid: "publisher",
          },
          booksOfPublisher: { //join with only constant references
            queryType: "selectObjectListByRelation",
            parentName: "Book",
            parentUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            },
            objectReference: {
              queryTemplateType: "queryContextReference",
              referenceName: "publisher",
            },
            AttributeOfListObjectToCompareToReferenceUuid: "publisher",
          },
        },
      };

      const queryResult:any = extractWithExtractorFromDomainState(domainState, getSelectorParams(queryParam));

      console.log("result", queryResult);
      
      expect((queryResult.elementValue as any)["booksOfPublisher"].elementValue).toEqual({
        "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7": domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["4cb917b3-3c53-4f9b-b000-b0e4c07a81f7"],
        "c6852e89-3c3c-447f-b827-4b5b9d830975": domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["c6852e89-3c3c-447f-b827-4b5b9d830975"],
        "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
      })
    }
  )

  // ###########################################################################################
  it('select custom-built result: Books of Publisher of given Book from Domain State',
    () => {

      const queryParam: ExtractorForRecordOfExtractors = {
        queryType: "extractorForRecordOfExtractors",
        deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        contextResults: { elementType: "object", elementValue: {} },
        pageParams: {
          elementType: "object",
          elementValue: {
            applicationSection: {
              elementType: "string",
              elementValue: "data",
            },
          },
        },
        queryParams: { elementType: "object", elementValue: {} },
        extractors: {
          book: {
            queryType: "selectObjectByDirectReference",
            parentName: "Book",
            parentUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            },
            instanceUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
            },
          },
        },
        queryTransformers: {
          publisher: {
            queryType: "selectObjectByRelation",
            parentName: "Publisher",
            parentUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "a027c379-8468-43a5-ba4d-bf618be25cab",
            },
            objectReference: {
              queryTemplateType: "queryContextReference",
              referenceName: "book",
            },
            AttributeOfObjectToCompareToReferenceUuid: "publisher",
          },
          booksOfPublisher: {
            queryType: "selectObjectListByRelation",
            parentName: "Book",
            parentUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            },
            objectReference: {
              queryTemplateType: "queryContextReference",
              referenceName: "publisher",
            },
            AttributeOfListObjectToCompareToReferenceUuid: "publisher",
          },
          result1: {
            queryType: "wrapperReturningObject",
            definition: {
              "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": {
                queryType: "queryContextReference",
                queryReference: "booksOfPublisher",
              },
            },
          },
          result2: {
            queryType: "wrapperReturningList",
            definition: [
              { queryType: "queryContextReference", queryReference: "booksOfPublisher" },
              { queryType: "queryContextReference", queryReference: "booksOfPublisher" },
            ],
          },
        },
      };

      const queryResult:any = extractWithExtractorFromDomainState(domainState, getSelectorParams(queryParam));

      const expectedValue = {
        "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7": domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["4cb917b3-3c53-4f9b-b000-b0e4c07a81f7"],
        "c6852e89-3c3c-447f-b827-4b5b9d830975": domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["c6852e89-3c3c-447f-b827-4b5b9d830975"],
        "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": domainState[adminConfigurationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
      };

      expect((queryResult.elementValue as any)["result1"].elementValue["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"].elementValue).toEqual(expectedValue)
      
      expect((queryResult.elementValue as any)["result2"].elementValue[0].elementValue).toEqual(expectedValue);
      expect((queryResult.elementValue as any)["result2"].elementValue[1].elementValue).toEqual(expectedValue);
    }
  )

  // ###########################################################################################
  it('select custom-built result with queryCombiner: instances of all Entites from Domain State, indexed by Entity Uuid',
    () => {

      const queryParam: ExtractorForRecordOfExtractors = {
        queryType: "extractorForRecordOfExtractors",
        deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        contextResults: { elementType: "object", elementValue: {} },
        pageParams: {
          elementType: "object",
          elementValue: {
            applicationSection: {
              elementType: "string",
              elementValue: "data",
            },
          },
        },
        queryParams: { elementType: "object", elementValue: {} },
        extractors: {
          entities: {
            queryType: "extractObjectListByEntity",
            applicationSection: "model",
            parentName: "Entity",
            parentUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
            },
          },
        },
        queryTransformers: {
          instancesOfEntities: {
            queryType: "queryCombiner", // heteronomous many-to-many join, not possible with SQL
            rootQuery: {
              queryType: "queryContextReference",
              queryReference: "entities",
            },
            subQuery: {
              query: {
                queryType: "extractObjectListByEntity",
                parentUuid: {
                  queryTemplateType: "queryParameterReference",
                  referenceName: "uuid",
                },
              },
              rootQueryObjectTransformer: {
                transformerType: "recordOfTransformers",
                definition: {
                  uuid: {
                    transformerType: "objectTransformer",
                    attributeName: "uuid",
                  },
                },
              },
            },
          },
        },
      };

      const queryResult:any = extractWithExtractorFromDomainState(domainState, getSelectorParams(queryParam));
      // console.log("result", result.elementValue.instancesOfEntities);
      const expectedValue = {
        elementType: "object",
        elementValue: Object.fromEntries(
          Object.entries(domainState[adminConfigurationDeploymentLibrary.uuid]["data"]).map((e) => [
            e[0],
            { elementType: "instanceUuidIndex", elementValue: e[1] },
          ])
        )
      }
      // console.log("expectedValue", expectedValue);
      expect(queryResult.elementValue.instancesOfEntities).toEqual(expectedValue);
    }
  )


  // ###########################################################################################
  it('select Unique Publisher Uuids of Books',
    () => {

      const queryParam: ExtractorForRecordOfExtractors = {
        queryType: "extractorForRecordOfExtractors",
        deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        contextResults: { elementType: "object", elementValue: {} },
        pageParams: {
          elementType: "object",
          elementValue: {
            applicationSection: {
              elementType: "string",
              elementValue: "data",
            },
          },
        },
        queryParams: { elementType: "object", elementValue: {} },
        extractors: {
          books: {
            queryType: "extractObjectListByEntity",
            parentName: "Book",
            parentUuid: {
              queryTemplateType: "constantUuid",
              constantUuidValue: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            },
          },
        },
        queryTransformers: {
          publishers: {
            queryType: "extractorTransformer",
            referencedQuery: {
              queryTemplateType: "queryContextReference",
              referenceName: "books",
            },
            attribute: "publisher",
          },
        },
      };

      const queryResult:any = extractWithExtractorFromDomainState(domainState, getSelectorParams(queryParam));

      console.log("result", JSON.stringify(queryResult, null, 2));
      
      expect((queryResult.elementValue as any)["publishers"].elementValue).toEqual(
        [
          "516a7366-39e7-4998-82cb-80199a7fa667",
          "c1c97d54-aba8-4599-883a-7fe8f3874095",
          "1f550a2a-33f5-4a56-83ee-302701039494"
        ]
      )
    }
  )



  // // ###########################################################################################
  // it("getEntityDefinition query: get entity definition from entity Uuid", () => {
  //   const queryParam: DomainModelQueryJzodSchemaParams = {
  //     queryType: "getEntityDefinition",
  //     "contextResults": { elementType: "object", elementValue: {} },
  //     pageParams: { elementType: "object", elementValue: {} },
  //     queryParams: { elementType: "object", elementValue: {} },
  //     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //     entityUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //   };

  //   const result: RecordOfJzodElement | JzodElement | undefined = selectJzodSchemaByDomainModelQueryFromDomainState(domainState, queryParam);

  //   expect(result).toBe(
  //     (domainState[adminConfigurationDeploymentLibrary.uuid]["model"]["54b9c72f-d4f3-4db9-9e0e-0dc840b530bd"][
  //       "797dd185-0155-43fd-b23f-f6d0af8cae06"
  //     ] as EntityDefinition).jzodSchema
  //   );
  // });
});
