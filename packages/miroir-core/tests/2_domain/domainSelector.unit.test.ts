import { applicationDeploymentLibrary } from "../../src/ApplicationDeploymentLibrary";

import { DomainState } from "../../src/0_interfaces/2_domain/DomainControllerInterface";
import {
  DomainManyQueriesWithDeploymentUuid,
  DomainModelQueryJzodSchemaParams,
  RecordOfJzodElement
} from "../../src/0_interfaces/2_domain/DomainSelectorInterface";
import {
  selectByDomainManyQueriesFromDomainState,
  selectJzodSchemaByDomainModelQueryFromDomainState,
} from "../../src/2_domain/DomainSelector";

import { EntityDefinition, JzodElement, DomainElement } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import domainStateImport from "./domainState.json";
import { circularReplacer } from "../../src/tools";

const domainState: DomainState = domainStateImport as DomainState;

describe("domainSelector", () => {
  // ###########################################################################################
  it(
    'error on non-existing Entity: EntityNotFound',
    () => {
      const queryParam: DomainManyQueriesWithDeploymentUuid = {
        queryType: "DomainManyQueries",
        deploymentUuid: applicationDeploymentLibrary.uuid,
        contextResults: { elementType: "object", elementValue: {} },
        pageParams: { elementType: "object", elementValue: {} },
        queryParams: { elementType: "object", elementValue: {} },
        fetchQuery: {
          select: {
            book: {
              queryType: "selectObjectByDirectReference",
              parentName: "Book",
              parentUuid: {
                referenceType: "constant",
                referenceUuid: "XXXXXX"
              },
              instanceUuid: {
                referenceType: "constant",
                referenceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
              }
            },
          },
        },
      };
      const result = selectByDomainManyQueriesFromDomainState(domainState, queryParam);
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
  it(
    'error on non-existing Entity: EntityNotFound',
    () => {
      const queryParam: DomainManyQueriesWithDeploymentUuid = {
        queryType: "DomainManyQueries",
        deploymentUuid: applicationDeploymentLibrary.uuid,
        contextResults: { elementType: "object", elementValue: {} },
        pageParams: { elementType: "object", elementValue: {} },
        queryParams: { elementType: "object", elementValue: {} },
        fetchQuery: {
          select: {
            book: {
              queryType: "selectObjectByDirectReference",
              parentName: "Book",
              parentUuid: {
                "referenceType": "constant",
                "referenceUuid": "XXXXXX"
              },
              instanceUuid: {
                referenceType: "constant",
                referenceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
              }
            },
          },
        },
      };
      const result = selectByDomainManyQueriesFromDomainState(domainState, queryParam);
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
  it(
    'error on non-existing object uuid: InstanceNotFound',
    () => {

      const queryParam: DomainManyQueriesWithDeploymentUuid = {
        queryType: "DomainManyQueries",
        "deploymentUuid": applicationDeploymentLibrary.uuid,
        "contextResults": { elementType: "object", elementValue: {} },
        pageParams: { elementType: "object", elementValue: {} },
        queryParams: { elementType: "object", elementValue: {} },
        "fetchQuery": {
          "select": {
            "book": {
              queryType: "selectObjectByDirectReference",
              parentName: "Book",
              parentUuid: {
                referenceType: "constant",
                referenceUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
              },
              instanceUuid: {
                referenceType: "constant",
                referenceUuid: "XXXXXXXXX"
              }
            }
          }
        }
      };

      expect(selectByDomainManyQueriesFromDomainState(domainState, queryParam)).toEqual({
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
  it(
    'select 1 object from Domain State',
    () => {

      const queryParam: DomainManyQueriesWithDeploymentUuid = {
        queryType: "DomainManyQueries",
        "deploymentUuid": applicationDeploymentLibrary.uuid,
        "contextResults": { elementType: "object", elementValue: {} },
        pageParams: { elementType: "object", elementValue: {} },
        queryParams: { elementType: "object", elementValue: {} },
        "fetchQuery": {
          "select": {
            "book": {
              queryType: "selectObjectByDirectReference",
              parentName: "Book",
              parentUuid: {
                referenceType: "constant",
                "referenceUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
              },
              instanceUuid: {
                referenceType: "constant",
                referenceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
              }
            }
          }
        }
      };

      const queryResult:any = selectByDomainManyQueriesFromDomainState(domainState, queryParam);

      expect(queryResult.elementValue.book.elementValue).toBe(domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"])
    }
  )

  // ###########################################################################################
  it(
    'select 1 object from Domain State using context reference',
    () => {

      const queryParam: DomainManyQueriesWithDeploymentUuid = {
        queryType: "DomainManyQueries",
        "deploymentUuid": applicationDeploymentLibrary.uuid,
        "contextResults": { elementType: "object", elementValue: {} },
        pageParams: { elementType: "object", elementValue: {} },
        queryParams: { elementType: "object", elementValue: {} },
        "fetchQuery": {
          "select": {
            "book": {
              queryType: "selectObjectByDirectReference",
              parentName: "Book",
              parentUuid: {
                "referenceType": "constant",
                referenceUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
              },
              instanceUuid: {
                referenceType: "constant",
                referenceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
              }
            },
            "book2": {
              queryType: "queryContextReference",
              queryReference: "book"
            }
          }
        }
      };

      const queryResult:any = selectByDomainManyQueriesFromDomainState(domainState, queryParam);

      expect(queryResult.elementValue.book2.elementValue).toBe(domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"])
    }
  )

  // ###########################################################################################
  it(
    'select 1 object from Domain State using direct query parameter reference',
    () => {

      const queryParam: DomainManyQueriesWithDeploymentUuid = {
        queryType: "DomainManyQueries",
        deploymentUuid: applicationDeploymentLibrary.uuid,
        contextResults: { elementType: "object", elementValue: {} },
        pageParams: { elementType: "object", elementValue: {} },
        queryParams: { elementType: "object", elementValue: { wantedBookUuid: { elementType: "instanceUuid", elementValue:"caef8a59-39eb-48b5-ad59-a7642d3a1e8f" } } },
        fetchQuery: {
          select: {
            book: {
              queryType: "selectObjectByDirectReference",
              parentName: "Book",
              parentUuid: {
                referenceType: "constant",
                referenceUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
              },
              instanceUuid: {
                referenceType: "queryParameterReference",
                referenceName: "wantedBookUuid",
              },
            },
          },
        },
      };

      const queryResult:any = selectByDomainManyQueriesFromDomainState(domainState, queryParam);
      console.log("queryResult", JSON.stringify(queryResult, circularReplacer(), 2));

      expect(queryResult.elementValue.book.elementValue).toBe(domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"])
    }    
  )

  // ###########################################################################################
  it(
    'select 1 object from the uuid found in an attribute of another object from Domain State',
    () => {

      const queryParam: DomainManyQueriesWithDeploymentUuid = {
        queryType: "DomainManyQueries",
        "deploymentUuid": applicationDeploymentLibrary.uuid,
        "contextResults": { elementType: "object", elementValue: {} },
        pageParams: { elementType: "object", elementValue: {} },
        queryParams: { elementType: "object", elementValue: {} },
        "fetchQuery": {
          "select": {
            "book": {
              queryType: "selectObjectByDirectReference",
              parentName: "Book",
              parentUuid: {
                "referenceType": "constant",
                referenceUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
              },
              instanceUuid: {
                referenceType: "constant",
                referenceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
              }
            },
            "publisher": {
              "queryType": "selectObjectByRelation",
              "parentName": "Publisher",
              parentUuid: {
                "referenceType": "constant",
                referenceUuid: "a027c379-8468-43a5-ba4d-bf618be25cab"
              },
              "objectReference": {
                "referenceType": "queryContextReference",
                "referenceName": "book"
              },
              "AttributeOfObjectToCompareToReferenceUuid": "publisher",
            }
          }
        }
      };

      const result:DomainElement = selectByDomainManyQueriesFromDomainState(domainState, queryParam);

      console.log("result XXXXXXXXXXXXXXXXXXXXXXXXXXXXX", JSON.stringify(result, circularReplacer(), 2));
      
      expect(result.elementType).toBe("object")
      expect((result.elementValue as any)["publisher"].elementValue).toBe(
        domainState[applicationDeploymentLibrary.uuid]["data"]["a027c379-8468-43a5-ba4d-bf618be25cab"][
          "516a7366-39e7-4998-82cb-80199a7fa667"
        ]
      );
    }
  )

  // ###########################################################################################
  it(
    'select Books of Publisher of given Book from Domain State',
    () => {

      const queryParam: DomainManyQueriesWithDeploymentUuid = {
        queryType: "DomainManyQueries",
        "deploymentUuid": applicationDeploymentLibrary.uuid,
        "contextResults": { elementType: "object", elementValue: {} },
        pageParams: { elementType: "object", elementValue: {} },
        queryParams: { elementType: "object", elementValue: {} },
        "fetchQuery": {
          "select": {
            "book": {
              queryType: "selectObjectByDirectReference",
              parentName: "Book",
              parentUuid: {
                "referenceType": "constant",
                referenceUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
              },
              instanceUuid: {
                referenceType: "constant",
                referenceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
              }
            },
            "publisher": {
              "queryType": "selectObjectByRelation",
              "parentName": "Publisher",
              parentUuid: {
                "referenceType": "constant",
                referenceUuid: "a027c379-8468-43a5-ba4d-bf618be25cab"
              },
              "objectReference": {
                "referenceType": "queryContextReference",
                "referenceName": "book"
              },
              "AttributeOfObjectToCompareToReferenceUuid": "publisher",
            },
            "booksOfPublisher": {
              "queryType": "selectObjectListByRelation",
              "parentName": "Book",
              parentUuid: {
                "referenceType": "constant",
                referenceUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
              },
              "objectReference": {
                "referenceType": "constant",
                "referenceUuid": "516a7366-39e7-4998-82cb-80199a7fa667",
              },
              "AttributeOfListObjectToCompareToReferenceUuid": "publisher"
            }
          }
        }
      };

      const result:DomainElement = selectByDomainManyQueriesFromDomainState(domainState, queryParam);

      console.log("result", result);
      
      expect((result.elementValue as any)["booksOfPublisher"].elementValue).toEqual({
        "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7": domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["4cb917b3-3c53-4f9b-b000-b0e4c07a81f7"],
        "c6852e89-3c3c-447f-b827-4b5b9d830975": domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["c6852e89-3c3c-447f-b827-4b5b9d830975"],
        "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
      })
    }
  )

  // ###########################################################################################
  it(
    'select custom-built result: Books of Publisher of given Book from Domain State',
    () => {

      const queryParam: DomainManyQueriesWithDeploymentUuid = {
        queryType: "DomainManyQueries",
        deploymentUuid: applicationDeploymentLibrary.uuid,
        contextResults: { elementType: "object", elementValue: {} },
        pageParams: { elementType: "object", elementValue: {} },
        queryParams: { elementType: "object", elementValue: {} },
        fetchQuery: {
          select: {
            book: {
              queryType: "selectObjectByDirectReference",
              parentName: "Book",
              parentUuid: {
                referenceType: "constant",
                referenceUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
              },
              instanceUuid: {
                referenceType: "constant",
                referenceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
              },
            },
            publisher: {
              queryType: "selectObjectByRelation",
              parentName: "Publisher",
              parentUuid: {
                referenceType: "constant",
                referenceUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
              },
              objectReference: {
                referenceType: "queryContextReference",
                referenceName: "book",
              },
              AttributeOfObjectToCompareToReferenceUuid: "publisher",
            },
            booksOfPublisher: {
              queryType: "selectObjectListByRelation",
              parentName: "Book",
              parentUuid: {
                referenceType: "constant",
                referenceUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
              },
              objectReference: {
                referenceType: "constant",
                referenceUuid: "516a7366-39e7-4998-82cb-80199a7fa667",
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
        },
      };

      const result:DomainElement = selectByDomainManyQueriesFromDomainState(domainState, queryParam);

      const expectedValue = {
        "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7": domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["4cb917b3-3c53-4f9b-b000-b0e4c07a81f7"],
        "c6852e89-3c3c-447f-b827-4b5b9d830975": domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["c6852e89-3c3c-447f-b827-4b5b9d830975"],
        "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
      };

      expect((result.elementValue as any)["result1"].elementValue["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"].elementValue).toEqual(expectedValue)
      
      expect((result.elementValue as any)["result2"].elementValue[0].elementValue).toEqual(expectedValue);
      expect((result.elementValue as any)["result2"].elementValue[1].elementValue).toEqual(expectedValue);
    }
  )

  // ###########################################################################################
  it(
    'select custom-built result with queryCombiner: instances of all Entites from Domain State, indexed by Entity Uuid',
    () => {

      const queryParam: DomainManyQueriesWithDeploymentUuid = {
        queryType: "DomainManyQueries",
        deploymentUuid: applicationDeploymentLibrary.uuid,
        contextResults: { elementType: "object", elementValue: {} },
        pageParams: { elementType: "object", elementValue: {} },
        queryParams: { elementType: "object", elementValue: {} },
        fetchQuery: {
          select: {
            "entities": {
              "queryType": "selectObjectListByEntity",
              "applicationSection": "model",
              "parentName": "Entity",
              "parentUuid": {
                "referenceType": "constant",
                "referenceUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad"
              }
            },
            "instancesOfEntities": {
              "queryType": "queryCombiner",
              "rootQuery": {
                "queryType": "queryContextReference",
                "queryReference": "entities"
              },
              "subQuery": {
                "query": {
                  "queryType":"selectObjectListByEntity",
                  "parentUuid": {
                    "referenceType": "queryParameterReference",
                    "referenceName": "uuid"
                  }
                },
                "parameter": {
                  "transformerType": "recordOfTransformers",
                  "definition": {
                    "uuid": {
                      "transformerType": "objectTransformer",
                      "attributeName": "uuid"
                    }
                  }
                }
              }
            }
          },
        },
      };

      const result:DomainElement = selectByDomainManyQueriesFromDomainState(domainState, queryParam);
      // console.log("result", result.elementValue.instancesOfEntities);
      const expectedValue = {
        elementType: "object",
        elementValue: Object.fromEntries(
          Object.entries(domainState[applicationDeploymentLibrary.uuid]["data"]).map((e) => [
            e[0],
            { elementType: "instanceUuidIndex", elementValue: e[1] },
          ])
        )
      }
      // console.log("expectedValue", expectedValue);
      expect(result.elementValue.instancesOfEntities).toEqual(expectedValue);
    }
  )

  // // ###########################################################################################
  // it("getEntityDefinition query: get entity definition from entity Uuid", () => {
  //   const queryParam: DomainModelQueryJzodSchemaParams = {
  //     queryType: "getEntityDefinition",
  //     "contextResults": { elementType: "object", elementValue: {} },
  //     pageParams: { elementType: "object", elementValue: {} },
  //     queryParams: { elementType: "object", elementValue: {} },
  //     deploymentUuid: applicationDeploymentLibrary.uuid,
  //     entityUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //   };

  //   const result: RecordOfJzodElement | JzodElement | undefined = selectJzodSchemaByDomainModelQueryFromDomainState(domainState, queryParam);

  //   expect(result).toBe(
  //     (domainState[applicationDeploymentLibrary.uuid]["model"]["54b9c72f-d4f3-4db9-9e0e-0dc840b530bd"][
  //       "797dd185-0155-43fd-b23f-f6d0af8cae06"
  //     ] as EntityDefinition).jzodSchema
  //   );
  // });
});
