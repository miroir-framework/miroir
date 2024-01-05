import { applicationDeploymentLibrary } from "../../src/ApplicationDeploymentLibrary";

import { DomainState } from "../../src/0_interfaces/2_domain/DomainControllerInterface";
import {
  DomainManyQueriesWithDeploymentUuid,
  DomainModelGetFetchParamJzodSchemaQueryParams,
  DomainModelQueryJzodSchemaParams,
  MiroirSelectorQueryParams,
  RecordOfJzodElement
} from "../../src/0_interfaces/2_domain/DomainSelectorInterface";
import {
  selectJzodSchemaByDomainModelQueryFromDomainState,
  selectByDomainManyQueriesFromDomainState,
} from "../../src/2_domain/DomainSelector";

import domainStateImport from "./domainState.json";
import { EntityDefinition, JzodElement } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

const domainState: DomainState = domainStateImport as DomainState;

describe("domainSelector", () => {
  // ###########################################################################################
  it(
    'error on non-existing Entity',
    () => {

      const queryParam: DomainManyQueriesWithDeploymentUuid = {
        queryType: "DomainManyQueries",
        "deploymentUuid": applicationDeploymentLibrary.uuid,
        "applicationSection": "data",
        select: {
          "book": {
            "queryType": "selectObjectByUuid",
            "parentName": "Book",
            "parentUuid": "XXXXXX",
            "instanceUuid": "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
          }
        }
      };

      expect(()=>selectByDomainManyQueriesFromDomainState(domainState, queryParam)).toThrowError("selectEntityInstanceFromObjectQueryAndDomainState could not resolve query")
    }
  )

  // ###########################################################################################
  it(
    'error on non-existing object uuid',
    () => {

      const queryParam: DomainManyQueriesWithDeploymentUuid = {
        queryType: "DomainManyQueries",
        "deploymentUuid": applicationDeploymentLibrary.uuid,
        "applicationSection": "data",
        select: {
          "book": {
            "queryType": "selectObjectByUuid",
            "parentName": "Book",
            "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            "instanceUuid": "XXXXXXXXX"
          }
        }
      };

      expect(()=>selectByDomainManyQueriesFromDomainState(domainState, queryParam)).toThrowError("selectEntityInstanceFromObjectQueryAndDomainState could not resolve query")
    }
  )

  // ###########################################################################################
  it(
    'select 1 object from Domain State',
    () => {

      const queryParam: DomainManyQueriesWithDeploymentUuid = {
        queryType: "DomainManyQueries",
        "deploymentUuid": applicationDeploymentLibrary.uuid,
        "applicationSection": "data",
        select: {
          "book": {
            "queryType": "selectObjectByUuid",
            "parentName": "Book",
            "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            "instanceUuid": "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
          }
        }
      };

      const result:any = selectByDomainManyQueriesFromDomainState(domainState, queryParam);

      expect(result.book).toBe(domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"])
    }
  )

  // ###########################################################################################
  it(
    'select 1 object from Domain State using context reference',
    () => {

      const queryParam: DomainManyQueriesWithDeploymentUuid = {
        queryType: "DomainManyQueries",
        "deploymentUuid": applicationDeploymentLibrary.uuid,
        "applicationSection": "data",
        select: {
          "book": {
            "queryType": "selectObjectByUuid",
            "parentName": "Book",
            "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            "instanceUuid": "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
          },
          "book2": {
            queryType: "queryContextReference",
            referenceName: "book"
          }
        }
      };

      const result:any = selectByDomainManyQueriesFromDomainState(domainState, queryParam);

      expect(result.book2).toBe(domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"])
    }
  )

  // ###########################################################################################
  it(
    'select 1 object from the uuid found in an attribute of another object from Domain State',
    () => {

      const queryParam: DomainManyQueriesWithDeploymentUuid = {
        queryType: "DomainManyQueries",
        "deploymentUuid": applicationDeploymentLibrary.uuid,
        "applicationSection": "data",
        "select": {
          "book": {
            "queryType": "selectObjectByUuid",
            "parentName": "Book",
            "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            "instanceUuid": "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
          },
          "publisher": {
            "queryType": "selectObjectByRelation",
            "parentName": "Publisher",
            "parentUuid": "a027c379-8468-43a5-ba4d-bf618be25cab",
            "objectReference": {
              "referenceType": "queryContextReference",
              "referenceName": "book"
            },
            "AttributeOfObjectToCompareToReferenceUuid": "publisher",
          }
        }
      };

      const result:any = selectByDomainManyQueriesFromDomainState(domainState, queryParam);

      expect(result.publisher).toBe(domainState[applicationDeploymentLibrary.uuid]["data"]["a027c379-8468-43a5-ba4d-bf618be25cab"]["516a7366-39e7-4998-82cb-80199a7fa667"])
    }
  )

  // ###########################################################################################
  it(
    'select Books of Publisher of given Book from Domain State',
    () => {

      const queryParam: DomainManyQueriesWithDeploymentUuid = {
        queryType: "DomainManyQueries",
        "deploymentUuid": applicationDeploymentLibrary.uuid,
        "applicationSection": "data",
        "select": {
          "book": {
            "queryType": "selectObjectByUuid",
            "parentName": "Book",
            "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            "instanceUuid": "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
          },
          "publisher": {
            "queryType": "selectObjectByRelation",
            "parentName": "Publisher",
            "parentUuid": "a027c379-8468-43a5-ba4d-bf618be25cab",
            "objectReference": {
              "referenceType": "queryContextReference",
              "referenceName": "book"
            },
            "AttributeOfObjectToCompareToReferenceUuid": "publisher",
          },
          "booksOfPublisher": {
            "queryType": "selectObjectListByRelation",
            "parentName": "Book",
            "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            "objectReference": {
              "referenceType": "constant",
              "referenceUuid": "516a7366-39e7-4998-82cb-80199a7fa667",
            },
            "AttributeOfListObjectToCompareToReferenceUuid": "publisher"
          }
        }
      };

      const result:any = selectByDomainManyQueriesFromDomainState(domainState, queryParam);

      expect(result.booksOfPublisher).toEqual({
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
        "deploymentUuid": applicationDeploymentLibrary.uuid,
        "applicationSection": "data",
        "select": {
          "book": {
            "queryType": "selectObjectByUuid",
            "parentName": "Book",
            "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            "instanceUuid": "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
          },
          "publisher": {
            "queryType": "selectObjectByRelation",
            "parentName": "Publisher",
            "parentUuid": "a027c379-8468-43a5-ba4d-bf618be25cab",
            "objectReference": {
              "referenceType": "queryContextReference",
              "referenceName": "book"
            },
            "AttributeOfObjectToCompareToReferenceUuid": "publisher",
          },
          "booksOfPublisher": {
            "queryType": "selectObjectListByRelation",
            "parentName": "Book",
            "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
            "objectReference": {
              "referenceType": "constant",
              "referenceUuid": "516a7366-39e7-4998-82cb-80199a7fa667",
            },
            "AttributeOfListObjectToCompareToReferenceUuid": "publisher"
          }
        },
        "result": {
          "queryResultType":"object",
          "definition": {
            "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": {queryResultType: "queryContextReference", "referenceName":"booksOfPublisher"}
          }
        }
      };

      const result:any = selectByDomainManyQueriesFromDomainState(domainState, queryParam);

      expect(result.result["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"]).toEqual({
        "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7": domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["4cb917b3-3c53-4f9b-b000-b0e4c07a81f7"],
        "c6852e89-3c3c-447f-b827-4b5b9d830975": domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["c6852e89-3c3c-447f-b827-4b5b9d830975"],
        "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
      })
    }
  )

  // ###########################################################################################
  it("getEntityDefinition query: get entity definition from entity Uuid", () => {
    const queryParam: DomainModelQueryJzodSchemaParams = {
        queryType: "getEntityDefinition",
        deploymentUuid: applicationDeploymentLibrary.uuid,
        entityUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
    };

    const result: RecordOfJzodElement | JzodElement | undefined = selectJzodSchemaByDomainModelQueryFromDomainState(domainState, queryParam);

    expect(result).toBe(
      (domainState[applicationDeploymentLibrary.uuid]["model"]["54b9c72f-d4f3-4db9-9e0e-0dc840b530bd"][
        "797dd185-0155-43fd-b23f-f6d0af8cae06"
      ] as EntityDefinition).jzodSchema
    );
  });
});
