import { DomainState, applicationDeploymentLibrary, selectFetchedDataFromDomainState } from "miroir-core";

import { MiroirSelectorManyQueryParams } from "../../src/0_interfaces/2_domain/DomainSelectorInterface"

import domainStateImport from "./domainState.json";

const domainState: DomainState = domainStateImport as DomainState;

describe(
  'domainSelector',
  () => {

    // ###########################################################################################
    it(
      'simple query domain selector',
      () => {

        const queryParam: MiroirSelectorManyQueryParams = {
          type: "ManyQueryParams",
          definition: {
            "book": {
              "type": "EntityInstanceQueryParams",
              "definition": {
                "deploymentUuid": applicationDeploymentLibrary.uuid,
                "applicationSection": "data",
                "localCacheSelectorParams": {},
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
  }
)