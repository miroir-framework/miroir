import { DomainState, applicationDeploymentLibrary, selectFetchedDataFromDomainState } from "miroir-core";

import { MiroirSelectorFetchDataQueryParams } from "../../src/0_interfaces/2_domain/DomainSelectorInterface"

import domainStateImport from "./domainState.json";

const domainState: DomainState = domainStateImport as DomainState;

describe(
  'domainSelector',
  () => {

    // ###########################################################################################
    it(
      'simplest query: select 1 object from Domain State',
      () => {

        const queryParam: MiroirSelectorFetchDataQueryParams = {
          type: "ManyQueryParams",
          definition: {
            "book": {
              "type": "EntityInstanceQueryParams",
              "definition": {
                "deploymentUuid": applicationDeploymentLibrary.uuid,
                "applicationSection": "data",
                "query": {
                  "type": "objectQuery",
                  "parentName": "Book",
                  "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
                  "instanceUuid": "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
                }
              }
            }
          }
        };

        const result:any = selectFetchedDataFromDomainState(domainState, {}, queryParam);

        expect(result.book).toBe(domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"])
      }
    )

    // ###########################################################################################
    it(
      'select 1 object from the uuid found in an attribute of another object from Domain State',
      () => {

        const queryParam: MiroirSelectorFetchDataQueryParams = {
          type: "ManyQueryParams",
          definition: {
            "book": {
              "type": "EntityInstanceQueryParams",
              "definition": {
                "deploymentUuid": applicationDeploymentLibrary.uuid,
                "applicationSection": "data",
                "query": {
                  "type": "objectQuery",
                  "parentName": "Book",
                  "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
                  "instanceUuid": "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
                }
              }
            },
            "publisher": {
              "type": "EntityInstanceQueryParams",
              "definition": {
                "deploymentUuid": applicationDeploymentLibrary.uuid,
                "applicationSection": "data",
                "query": {
                  "type": "objectQuery",
                  "parentName": "Publisher",
                  "parentUuid": "a027c379-8468-43a5-ba4d-bf618be25cab",
                  "fetchedDataReference": "book",
                  "fetchedDataReferenceAttribute": "publisher"
                }
              }
            }
          }
        };

        const result:any = selectFetchedDataFromDomainState(domainState, {}, queryParam);

        expect(result.publisher).toBe(domainState[applicationDeploymentLibrary.uuid]["data"]["a027c379-8468-43a5-ba4d-bf618be25cab"]["516a7366-39e7-4998-82cb-80199a7fa667"])
      }
    )

    // ###########################################################################################
    it(
      'select Books of Publisher of given Book from Domain State',
      () => {

        const queryParam: MiroirSelectorFetchDataQueryParams = {
          type: "ManyQueryParams",
          definition: {
            "book": {
              "type": "EntityInstanceQueryParams",
              "definition": {
                "deploymentUuid": applicationDeploymentLibrary.uuid,
                "applicationSection": "data",
                "query": {
                  "type": "objectQuery",
                  "parentName": "Book",
                  "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
                  "instanceUuid": "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
                }
              }
            },
            "publisher": {
              "type": "EntityInstanceQueryParams",
              "definition": {
                "deploymentUuid": applicationDeploymentLibrary.uuid,
                "applicationSection": "data",
                "query": {
                  "type": "objectQuery",
                  "parentName": "Publisher",
                  "parentUuid": "a027c379-8468-43a5-ba4d-bf618be25cab",
                  "fetchedDataReference": "book",
                  "fetchedDataReferenceAttribute": "publisher"
                }
              }
            },
            "booksOfPublisher": {
              "type": "EntityInstanceListQueryParams",
              "definition": {
                "deploymentUuid": applicationDeploymentLibrary.uuid,
                "applicationSection": "data",
                "query": {
                  "type": "objectListQuery",
                  "parentName": "Book",
                  "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
                  "rootObjectUuid": "516a7366-39e7-4998-82cb-80199a7fa667",
                  "rootObjectAttribute": "publisher"
                }
              }
            }
          }
        };

        const result:any = selectFetchedDataFromDomainState(domainState, {}, queryParam);

        expect(result.booksOfPublisher).toEqual({
          "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7": domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["4cb917b3-3c53-4f9b-b000-b0e4c07a81f7"],
          "c6852e89-3c3c-447f-b827-4b5b9d830975": domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["c6852e89-3c3c-447f-b827-4b5b9d830975"],
          "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": domainState[applicationDeploymentLibrary.uuid]["data"]["e8ba151b-d68e-4cc3-9a83-3459d309ccf5"]["caef8a59-39eb-48b5-ad59-a7642d3a1e8f"],
        })
      }
    )
  }
)