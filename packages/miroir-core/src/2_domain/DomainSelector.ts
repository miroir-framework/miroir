// 

import { JzodElement } from "@miroir-framework/jzod-ts";
import { EntityInstance } from "../0_interfaces/1_core/Instance";
import { SelectObjectInstanceQuery } from "../0_interfaces/1_core/preprocessor-generated/server-generated";
import { DomainState, EntityInstancesUuidIndex } from "../0_interfaces/2_domain/DomainControllerInterface";
import {
  DomainSingleSelectQuery,
  FetchedData,
  DomainFetchQueryParams,
  LocalCacheQueryParams
} from "../0_interfaces/2_domain/DomainSelectorInterface";

// ################################################################################################
export const selectEntityInstanceUuidIndexFromDomainState = (
  domainState: DomainState,
  pageParams: Record<string, any>,
  fetchedData: FetchedData,
  // params: LocalCacheQueryParams
  selectorParams: DomainSingleSelectQuery
): EntityInstancesUuidIndex | undefined => {

  // if (selectorParams.type == "LocalCacheEntityInstancesSelectorParams") {
  //   throw new Error("selectEntityInstanceUuidIndexFromDomainState can not handle LocalCacheEntityInstancesSelectorParams")
  // }
  const deploymentUuid =
    selectorParams.select.type == "objectListQuery"
      ? selectorParams.deploymentUuid
      : undefined;
  const applicationSection =
    selectorParams.select.type == "objectListQuery"
      ? selectorParams.applicationSection
      : undefined;
  const entityUuid =
    selectorParams.select.type == "objectListQuery"
      ? selectorParams.select.parentUuid
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
  // selectorParams: LocalCacheQueryParams
  selectorParams: DomainSingleSelectQuery
): EntityInstancesUuidIndex | undefined => {

  if (selectorParams.select.type == "objectListQuery") {
    const selectedInstances = selectEntityInstanceUuidIndexFromDomainState(domainState, pageParams, fetchedData, selectorParams)
    const result = Object.fromEntries(
      Object.entries(selectedInstances ?? {}).filter(
        (i: [string, EntityInstance]) =>
          (i[1] as any)[
            selectorParams.select.type == "objectListQuery"
            // selectorParams.type == "EntityInstanceListQueryParams"
              ? selectorParams.select.rootObjectAttribute ?? "dummy"
              : "dummy"
          ] ===
          (selectorParams.select.type == "objectListQuery"
          // (selectorParams.type == "EntityInstanceListQueryParams"
            ? selectorParams.select.fetchedDataReference
              ? (fetchedData[selectorParams.select.fetchedDataReference] as any)["uuid"]
              : selectorParams.select.rootObjectUuid
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
  // query: LocalCacheQueryParams
  query: DomainSingleSelectQuery
): EntityInstance | undefined => {
  const querySelectorParams: SelectObjectInstanceQuery | undefined =
    query.select.type == "objectQuery" ? query.select : undefined;

  const deploymentUuid = query.select.type == "objectQuery" ? query.deploymentUuid : undefined;
  const applicationSection =
    query.select.type == "objectQuery" ? query.applicationSection : undefined;

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
  query: DomainFetchQueryParams
): FetchedData | undefined => {

  // console.log("########## DomainSelector selectFetchedDataFromDomainState begin");
  
  const newFetchedData:FetchedData = fetchedData;

  for (const entry of Object.entries(query.select)) {
    let result = undefined;
    switch (entry[1].type) {
      case "objectListQuery": {
        result = selectEntityInstancesFromListQueryAndDomainState(domainState, pageParams, newFetchedData, {
          applicationSection: query.applicationSection,
          deploymentUuid: query.deploymentUuid,
          select: entry[1],
        });
        break;
      }
      case "objectQuery": {
        result = selectEntityInstanceFromObjectQueryAndDomainState(domainState, pageParams, newFetchedData, {
          applicationSection: query.applicationSection,
          deploymentUuid: query.deploymentUuid,
          select: entry[1],
        });
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

// ################################################################################################
export const selectFetchedDataJzodSchemaFromDomainState = (
  domainState: DomainState,
  pageParams: Record<string, any>,
  fetchedData: FetchedData,
  query: DomainFetchQueryParams
): JzodElement | undefined => {

  // // console.log("########## DomainSelector selectFetchedDataJzodSchemaFromDomainState begin");
  
  // const newFetchedData:FetchedData = fetchedData;

  // for (const entry of Object.entries(query.select)) {
  //   let result = undefined;
  //   switch (entry[1].type) {
  //     case "objectListQuery": {

  //       const selectorParams: DomainSingleSelectQuery = {
  //         applicationSection: query.applicationSection,
  //         deploymentUuid: query.deploymentUuid,
  //         select: {
  //           type: "objectListQuery",
  //           parentUuid: query.select.parentUuid
  //         }
  //       }
  //       const selectedInstances = selectEntityInstanceUuidIndexFromDomainState(domainState, pageParams, fetchedData, selectorParams)

  //       result = selectEntityInstancesFromListQueryAndDomainState(domainState, pageParams, newFetchedData, {
  //         applicationSection: query.applicationSection,
  //         deploymentUuid: query.deploymentUuid,
  //         select: entry[1],
  //       });
  //       break;
  //     }
  //     case "objectQuery": {
  //       result = selectEntityInstanceFromObjectQueryAndDomainState(domainState, pageParams, newFetchedData, {
  //         applicationSection: query.applicationSection,
  //         deploymentUuid: query.deploymentUuid,
  //         select: entry[1],
  //       });
  //       break;
  //     }
  //     default: {
  //       result = undefined;
  //       break;
  //     }
  //   }
  //   newFetchedData[entry[0]] = result;
  //   console.log("DomainSelector selectFetchedDataJzodSchemaFromDomainState set", entry[0], "query", entry[1], result);
  // } 


  // // console.log("########## DomainSelector selectFetchedDataJzodSchemaFromDomainState end");

  // // console.log(
  // //   "DomainSelector selectFetchedDataJzodSchemaFromDomainState",
  // //   "params",
  // //   params,
  // //   "domainState",
  // //   domainState,
  // //   "newFetchedData",
  // //   newFetchedData
  // // );
  return { type: "record", definition: { type: "simpleType", definition: "any"}};
};

