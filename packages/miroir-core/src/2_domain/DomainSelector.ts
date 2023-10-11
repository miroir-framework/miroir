// 

import { EntityInstance } from "../0_interfaces/1_core/Instance";
import { SelectObjectInstanceQuery } from "../0_interfaces/1_core/preprocessor-generated/server-generated";
import { DomainState, EntityInstancesUuidIndex } from "../0_interfaces/2_domain/DomainControllerInterface";
import {
  FetchedData,
  MiroirSelectorFetchDataQueryParams,
  MiroirSelectorSingleQueryParams
} from "../0_interfaces/2_domain/DomainSelectorInterface";

// ################################################################################################
export const selectEntityInstanceUuidIndexFromDomainState = (
  domainState: DomainState,
  pageParams: Record<string, any>,
  fetchedData: FetchedData,
  params: MiroirSelectorSingleQueryParams
): EntityInstancesUuidIndex | undefined => {

  if (params.type == "DomainEntityInstancesSelectorParams") {
    throw new Error("selectEntityInstanceUuidIndexFromDomainState can not handle DomainEntityInstancesSelectorParams")
  }

  const deploymentUuid =
    params.definition.query.select.type == "objectListQuery"
      ? params.definition.deploymentUuid
      : undefined;
  const applicationSection =
    params.definition.query.select.type == "objectListQuery"
      ? params.definition.applicationSection
      : undefined;
  const entityUuid =
    params.definition.query.select.type == "objectListQuery"
      ? params.definition.query.select.parentUuid
      : undefined;

  const result = 
    deploymentUuid &&
    applicationSection &&
    entityUuid &&
    domainState[deploymentUuid][applicationSection][entityUuid]
      ? domainState[deploymentUuid][applicationSection][entityUuid]
      : undefined;
  // console.log('DomainSelector selectEntityInstanceUuidIndexFromDomainState','params',params,'domainState',domainState,'result',result);
  return result;
};

// ################################################################################################
export const selectEntityInstancesFromListQueryAndDomainState = (
  domainState: DomainState,
  pageParams: Record<string, any>,
  fetchedData: FetchedData,
  selectorParams: MiroirSelectorSingleQueryParams
): EntityInstancesUuidIndex | undefined => {

  if (selectorParams.type == "ObjectQueryParams") {
    const selectedInstances = selectEntityInstanceUuidIndexFromDomainState(domainState, pageParams, fetchedData, selectorParams)
    const result = Object.fromEntries(
      Object.entries(selectedInstances ?? {}).filter(
        (i: [string, EntityInstance]) =>
          (i[1] as any)[
            selectorParams.definition.query.select.type == "objectListQuery"
            // selectorParams.type == "EntityInstanceListQueryParams"
              ? selectorParams.definition.query?.select.rootObjectAttribute ?? "dummy"
              : "dummy"
          ] ===
          (selectorParams.definition.query.select.type == "objectListQuery"
          // (selectorParams.type == "EntityInstanceListQueryParams"
            ? selectorParams.definition.query.select.fetchedDataReference
              ? (fetchedData[selectorParams.definition.query.select.fetchedDataReference] as any)["uuid"]
              : selectorParams.definition.query?.select.rootObjectUuid
            : undefined)
      )
    );
    // console.log(
    //   "DomainSelector selectEntityInstancesFromListQueryAndDomainState",
    //   "selectorParams",
    //   selectorParams,
    //   "selectedInstances",
    //   selectedInstances,
    //   "domainState",
    //   domainState,
    //   "result",
    //   result
    // );
    return result;
  } else {
    return {}
  }
};

// ################################################################################################
export const selectEntityInstanceFromObjectQueryAndDomainState = (
  domainState: DomainState,
  pageParams: Record<string, any>,
  fetchedData: FetchedData,
  query: MiroirSelectorSingleQueryParams
): EntityInstance | undefined => {
  const querySelectorParams: SelectObjectInstanceQuery | undefined =
    query.type == "ObjectQueryParams"
      ? (query.definition.query.select as SelectObjectInstanceQuery)
      : undefined;

  const deploymentUuid = query.type == "ObjectQueryParams" ? query.definition.deploymentUuid : undefined;
  const applicationSection =
    query.type == "ObjectQueryParams" ? query.definition.applicationSection : undefined;

  const result =
    deploymentUuid && applicationSection
      ? querySelectorParams?.parentUuid
        ? querySelectorParams?.fetchedDataReference && querySelectorParams.fetchedDataReferenceAttribute
          ? domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid][
              (fetchedData as any)[querySelectorParams.fetchedDataReference][
                querySelectorParams.fetchedDataReferenceAttribute
              ]
            ]
          : querySelectorParams?.instanceUuid &&
            domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid][
              querySelectorParams.instanceUuid
            ]
          ? domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid][
              querySelectorParams.instanceUuid
            ]
          : querySelectorParams?.paramReference && pageParams[querySelectorParams?.paramReference]
          ? domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid][
              pageParams[querySelectorParams?.paramReference]
            ]
          : undefined
        : undefined
      : undefined;
  console.log(
    "DomainSelector selectEntityInstanceFromDomainState",
    "query",
    query,
    "pageParams",
    pageParams,
    "querySelectorParams.parentUuid",
    querySelectorParams?.parentUuid,
    "pageParams[querySelectorParams?.paramReference]",
    pageParams[querySelectorParams?.paramReference??""],
    "domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid][pageParams[querySelectorParams?.paramReference]]",
    domainState[deploymentUuid??""][applicationSection??"data"][querySelectorParams?.parentUuid??""][
      pageParams[querySelectorParams?.paramReference??""]
    ],
    "fetchedData",
    fetchedData,
    "domainState",
    domainState,
    "result",
    result
  );
  return result;
};

// ################################################################################################
export const selectFetchedDataFromDomainState = (
  domainState: DomainState,
  pageParams: Record<string, any>,
  fetchedData: FetchedData,
  params: MiroirSelectorFetchDataQueryParams
): FetchedData | undefined => {

  // console.log("########## DomainSelector selectFetchedDataFromDomainState begin");
  
  const newFetchedData:FetchedData = fetchedData;

  for (const entry of Object.entries(params.definition)) {
    let result = undefined;
    if (entry[1].type == "DomainEntityInstancesSelectorParams") {
      throw new Error("selectEntityInstanceUuidIndexFromDomainState can not handle DomainEntityInstancesSelectorParams")
    }
    switch (entry[1].type) {
      // case "EntityInstanceQueryParams": 
      // case "EntityInstanceListQueryParams": 
      case "ObjectQueryParams": {
        switch (entry[1].definition?.query?.select.type) {
          case "objectListQuery": {
            result = selectEntityInstancesFromListQueryAndDomainState(domainState, pageParams, newFetchedData, entry[1]);
            break;
          }
          case "objectQuery": {
            result = selectEntityInstanceFromObjectQueryAndDomainState(domainState, pageParams, newFetchedData, entry[1]);
            break;
          }
          default: {
            result = undefined;
            break;
          }
        }
        break;
      }
      default: {
        result = undefined;
        break;
      }
    }
    newFetchedData[entry[0]] = result;
    console.log("DomainSelector selectFetchedDataFromDomainState set", entry[0], "query", entry[1], result);
  } 

  // console.log("########## DomainSelector selectFetchedDataFromDomainState end");

  // console.log(
  //   "DomainSelector selectFetchedDataFromDomainState",
  //   "params",
  //   params,
  //   "domainState",
  //   domainState,
  //   "newFetchedData",
  //   newFetchedData
  // );
  return newFetchedData;
};

