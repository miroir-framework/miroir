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

import { EntityDefinition, JzodElement, ResultsFromQuery } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import domainStateImport from "./domainState.json";

const domainState: DomainState = domainStateImport as DomainState;

describe("domainSelector", () => {
  // // ###########################################################################################
  // it(
  //   'error on non-existing Entity',
  //   () => {
  //     const queryParam: DomainManyQueriesWithDeploymentUuid = {
  //       queryType: "DomainManyQueries",
  //       deploymentUuid: applicationDeploymentLibrary.uuid,
  //       applicationSection: "data",
  //       contextResults: { resultType: "object", resultValue: {} },
  //       fetchQuery: {
  //         select: {
  //           book: {
  //             queryType: "selectObjectByUuid",
  //             parentName: "Book",
  //             parentUuid: "XXXXXX",
  //             instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
  //           },
  //         },
  //       },
  //     };
  //     const result = selectByDomainManyQueriesFromDomainState(domainState, queryParam);
  //     console.info("result", result);
  //     expect(result).toEqual({
  //       resultType: "object",
  //       resultValue: {
  //         book: {
  //           resultType: "failure",
  //           resultValue: {
  //             applicationSection: "data",
  //             deploymentUuid: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  //             entityUuid: "XXXXXX",
  //             queryFailure: "EntityNotFound",
  //           },
  //         },
  //       },
  //     });
  //   }
  // )

  // // ###########################################################################################
  // it(
  //   'error on non-existing object uuid',
  //   () => {

  //     const queryParam: DomainManyQueriesWithDeploymentUuid = {
  //       queryType: "DomainManyQueries",
  //       "deploymentUuid": applicationDeploymentLibrary.uuid,
  //       "applicationSection": "data",
  //       "contextResults": { resultType: "object", resultValue: {} },
  //       "fetchQuery": {
  //         "select": {
  //           "book": {
  //             "queryType": "selectObjectByUuid",
  //             "parentName": "Book",
  //             "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //             "instanceUuid": "XXXXXXXXX"
  //           }
  //         }
  //       }
  //     };

  //     expect(selectByDomainManyQueriesFromDomainState(domainState, queryParam)).toEqual({
  //       resultType: "object",
  //       resultValue: {
  //         book: {
  //           resultType: "failure",
  //           resultValue: {
  //             applicationSection: "data",
  //             deploymentUuid: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  //             entityUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //             instanceUuid: "XXXXXXXXX",
  //             queryFailure: "InstanceNotFound",
  //           },
  //         },
  //       },
  //     });
  //   }
  // )

  // // ###########################################################################################
  // it(
  //   'select 1 object from Domain State',
  //   () => {

  //     const queryParam: DomainManyQueriesWithDeploymentUuid = {
  //       queryType: "DomainManyQueries",
  //       "deploymentUuid": applicationDeploymentLibrary.uuid,
  //       "applicationSection": "data",
  //       "contextResults": { resultType: "object", resultValue: {} },
  //       "fetchQuery": {
  //         "select": {
  //           "book": {
  //             "queryType": "selectObjectByUuid",
  //             "parentName": "Book",
  //             "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //             "instanceUuid": "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
  //           }
  //         }
  //       }
  //     };

  //     const queryResult:any = selectByDomainManyQueriesFromDomainState(domainState, queryParam);

  //     expect(queryResult.resultValue.book.resultValue).toBe(domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"])
  //   }
  // )

  // // ###########################################################################################
  // it(
  //   'select 1 object from Domain State using context reference',
  //   () => {

  //     const queryParam: DomainManyQueriesWithDeploymentUuid = {
  //       queryType: "DomainManyQueries",
  //       "deploymentUuid": applicationDeploymentLibrary.uuid,
  //       "applicationSection": "data",
  //       "contextResults": { resultType: "object", resultValue: {} },
  //       "fetchQuery": {
  //         "select": {
  //           "book": {
  //             "queryType": "selectObjectByUuid",
  //             "parentName": "Book",
  //             "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //             "instanceUuid": "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
  //           },
  //           "book2": {
  //             queryType: "queryContextReference",
  //             referenceName: "book"
  //           }
  //         }
  //       }
  //     };

  //     const queryResult:any = selectByDomainManyQueriesFromDomainState(domainState, queryParam);

  //     expect(queryResult.resultValue.book2.resultValue).toBe(domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"])
  //   }
  // )

  // ###########################################################################################
  it(
    'select 1 object from Domain State using direct query parameter reference',
    () => {

      const queryParam: DomainManyQueriesWithDeploymentUuid = {
        queryType: "DomainManyQueries",
        "deploymentUuid": applicationDeploymentLibrary.uuid,
        "applicationSection": "data",
        "contextResults": { resultType: "object", resultValue: {} },
        "queryParams": { "wantedBookUuid": "caef8a59-39eb-48b5-ad59-a7642d3a1e8f" },
        "fetchQuery": {
          "select": {
            "book": {
              "queryType": "selectObjectByDirectReference",
              "parentName": "Book",
              "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
              "objectReference": {
                "referenceType": "queryParameterReference",
                "referenceName": "wantedBookUuid"
              }
            },
          }
        }
      };

      const queryResult:any = selectByDomainManyQueriesFromDomainState(domainState, queryParam);

      console.log("queryResult", JSON.stringify(queryResult, undefined, 2));

      expect(queryResult.resultValue.book.resultValue).toBe(domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"])
    }    
  )

  // // ###########################################################################################
  // it(
  //   'select 1 object from the uuid found in an attribute of another object from Domain State',
  //   () => {

  //     const queryParam: DomainManyQueriesWithDeploymentUuid = {
  //       queryType: "DomainManyQueries",
  //       "deploymentUuid": applicationDeploymentLibrary.uuid,
  //       "applicationSection": "data",
  //       "contextResults": { resultType: "object", resultValue: {} },
  //       "fetchQuery": {
  //         "select": {
  //           "book": {
  //             "queryType": "selectObjectByUuid",
  //             "parentName": "Book",
  //             "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //             "instanceUuid": "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
  //           },
  //           "publisher": {
  //             "queryType": "selectObjectByRelation",
  //             "parentName": "Publisher",
  //             "parentUuid": "a027c379-8468-43a5-ba4d-bf618be25cab",
  //             "objectReference": {
  //               "referenceType": "queryContextReference",
  //               "referenceName": "book"
  //             },
  //             "AttributeOfObjectToCompareToReferenceUuid": "publisher",
  //           }
  //         }
  //       }
  //     };

  //     const result:ResultsFromQuery = selectByDomainManyQueriesFromDomainState(domainState, queryParam);

  //     console.log("result XXXXXXXXXXXXXXXXXXXXXXXXXXXXX", result);
      
  //     expect(result.resultType).toBe("object")
  //     expect((result.resultValue as any)["publisher"].resultValue).toBe(
  //       domainState[applicationDeploymentLibrary.uuid]["data"]["a027c379-8468-43a5-ba4d-bf618be25cab"][
  //         "516a7366-39e7-4998-82cb-80199a7fa667"
  //       ]
  //     );
  //   }
  // )

  // // ###########################################################################################
  // it(
  //   'select Books of Publisher of given Book from Domain State',
  //   () => {

  //     const queryParam: DomainManyQueriesWithDeploymentUuid = {
  //       queryType: "DomainManyQueries",
  //       "deploymentUuid": applicationDeploymentLibrary.uuid,
  //       "applicationSection": "data",
  //       "contextResults": { resultType: "object", resultValue: {} },
  //       "fetchQuery": {
  //         "select": {
  //           "book": {
  //             "queryType": "selectObjectByUuid",
  //             "parentName": "Book",
  //             "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //             "instanceUuid": "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
  //           },
  //           "publisher": {
  //             "queryType": "selectObjectByRelation",
  //             "parentName": "Publisher",
  //             "parentUuid": "a027c379-8468-43a5-ba4d-bf618be25cab",
  //             "objectReference": {
  //               "referenceType": "queryContextReference",
  //               "referenceName": "book"
  //             },
  //             "AttributeOfObjectToCompareToReferenceUuid": "publisher",
  //           },
  //           "booksOfPublisher": {
  //             "queryType": "selectObjectListByRelation",
  //             "parentName": "Book",
  //             "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //             "objectReference": {
  //               "referenceType": "constant",
  //               "referenceUuid": "516a7366-39e7-4998-82cb-80199a7fa667",
  //             },
  //             "AttributeOfListObjectToCompareToReferenceUuid": "publisher"
  //           }
  //         }
  //       }
  //     };

  //     const result:ResultsFromQuery = selectByDomainManyQueriesFromDomainState(domainState, queryParam);

  //     console.log("result", result);
      
  //     expect((result.resultValue as any)["booksOfPublisher"].resultValue).toEqual({
  //       "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7": domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["4cb917b3-3c53-4f9b-b000-b0e4c07a81f7"],
  //       "c6852e89-3c3c-447f-b827-4b5b9d830975": domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["c6852e89-3c3c-447f-b827-4b5b9d830975"],
  //       "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
  //     })
  //   }
  // )

  // // ###########################################################################################
  // it(
  //   'select custom-built result: Books of Publisher of given Book from Domain State',
  //   () => {

  //     const queryParam: DomainManyQueriesWithDeploymentUuid = {
  //       queryType: "DomainManyQueries",
  //       "deploymentUuid": applicationDeploymentLibrary.uuid,
  //       "applicationSection": "data",
  //       "contextResults": { resultType: "object", resultValue: {} },
  //       "fetchQuery": {
  //         "select": {
  //           "book": {
  //             "queryType": "selectObjectByUuid",
  //             "parentName": "Book",
  //             "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //             "instanceUuid": "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
  //           },
  //           "publisher": {
  //             "queryType": "selectObjectByRelation",
  //             "parentName": "Publisher",
  //             "parentUuid": "a027c379-8468-43a5-ba4d-bf618be25cab",
  //             "objectReference": {
  //               "referenceType": "queryContextReference",
  //               "referenceName": "book"
  //             },
  //             "AttributeOfObjectToCompareToReferenceUuid": "publisher",
  //           },
  //           "booksOfPublisher": {
  //             "queryType": "selectObjectListByRelation",
  //             "parentName": "Book",
  //             "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //             "objectReference": {
  //               "referenceType": "constant",
  //               "referenceUuid": "516a7366-39e7-4998-82cb-80199a7fa667",
  //             },
  //             "AttributeOfListObjectToCompareToReferenceUuid": "publisher"
  //           },
  //           "result1": {
  //             "queryType":"wrapperReturningObject",
  //             "definition": {
  //               "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": {"queryType": "queryContextReference", "referenceName":"booksOfPublisher"}
  //             }
  //           },
  //           "result2": {
  //             "queryType":"wrapperReturningList",
  //             "definition": [
  //               {"queryType": "queryContextReference", "referenceName":"booksOfPublisher"},
  //               {"queryType": "queryContextReference", "referenceName":"booksOfPublisher"},
  //             ]
  //           }
  //         }
  //       }
  //     };

  //     const result:ResultsFromQuery = selectByDomainManyQueriesFromDomainState(domainState, queryParam);

  //     const expectedValue = {
  //       "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7": domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["4cb917b3-3c53-4f9b-b000-b0e4c07a81f7"],
  //       "c6852e89-3c3c-447f-b827-4b5b9d830975": domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["c6852e89-3c3c-447f-b827-4b5b9d830975"],
  //       "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
  //     };

  //     expect((result.resultValue as any)["result1"].resultValue["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"].resultValue).toEqual(expectedValue)
      
  //     expect((result.resultValue as any)["result2"].resultValue[0].resultValue).toEqual(expectedValue);
  //     expect((result.resultValue as any)["result2"].resultValue[1].resultValue).toEqual(expectedValue);
  //   }
  // )

  // // ###########################################################################################
  // it("getEntityDefinition query: get entity definition from entity Uuid", () => {
  //   const queryParam: DomainModelQueryJzodSchemaParams = {
  //       queryType: "getEntityDefinition",
  //       "contextResults": { resultType: "object", resultValue: {} },
  //       deploymentUuid: applicationDeploymentLibrary.uuid,
  //       entityUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //   };

  //   const result: RecordOfJzodElement | JzodElement | undefined = selectJzodSchemaByDomainModelQueryFromDomainState(domainState, queryParam);

  //   expect(result).toBe(
  //     (domainState[applicationDeploymentLibrary.uuid]["model"]["54b9c72f-d4f3-4db9-9e0e-0dc840b530bd"][
  //       "797dd185-0155-43fd-b23f-f6d0af8cae06"
  //     ] as EntityDefinition).jzodSchema
  //   );
  // });
});
