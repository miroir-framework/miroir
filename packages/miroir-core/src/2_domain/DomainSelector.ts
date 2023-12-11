import { JzodElement, JzodObject } from "@miroir-framework/jzod-ts";
import { MiroirSelectQuery, SelectObjectInstanceQuery } from "../0_interfaces/1_core/preprocessor-generated/server-generated";
import { DomainState, EntityInstancesUuidIndex } from "../0_interfaces/2_domain/DomainControllerInterface";
import {
  DomainFetchQueryParams,
  DomainModelGetEntityDefinitionQueryParams,
  DomainModelGetFetchParamJzodSchemaQueryParams,
  DomainModelGetSingleSelectQueryJzodSchemaQueryParams,
  DomainModelQueryParams,
  DomainSingleSelectQuery,
  FetchedData,
  RecordOfJzodElement,
  RecordOfJzodObject
} from "../0_interfaces/2_domain/DomainSelectorInterface";

import entityEntityDefinition from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json';
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/Logger";
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { cleanLevel } from "./constants";
import { EntityDefinition, EntityInstance } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

const loggerName: string = getLoggerName(packageName, cleanLevel,"DomainSelector");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

// ################################################################################################
export const selectEntityInstanceUuidIndexFromDomainState = (
  domainState: DomainState,
  // pageParams: Record<string, any>,
  // fetchedData: FetchedData,
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
  log.info('DomainSelector selectEntityInstanceUuidIndexFromDomainState','selectorParams',selectorParams,'domainState',domainState,'result',result);
  return result;
};

// ################################################################################################
export const selectEntityInstancesFromListQueryAndDomainState = (
  domainState: DomainState,
  // selectorParams: DomainSingleSelectQuery
  selectorParams: DomainModelGetSingleSelectQueryJzodSchemaQueryParams
): EntityInstancesUuidIndex | undefined => {

  if (selectorParams.singleSelectQuery.select.type == "objectListQuery") {
    const selectedInstances = selectEntityInstanceUuidIndexFromDomainState(domainState, selectorParams.singleSelectQuery)
    const result = Object.fromEntries(
      Object.entries(selectedInstances ?? {}).filter(
        (i: [string, EntityInstance]) =>
          (i[1] as any)[
            selectorParams.singleSelectQuery.select.type == "objectListQuery"
            // selectorParams.type == "EntityInstanceListQueryParams"
              ? selectorParams.singleSelectQuery.select.rootObjectAttribute ?? "dummy"
              : "dummy"
          ] ===
          (selectorParams.singleSelectQuery.select.type == "objectListQuery"
          // (selectorParams.type == "EntityInstanceListQueryParams"
            ? selectorParams.singleSelectQuery.select.fetchedDataReference && (selectorParams?.fetchedData??{})[selectorParams.singleSelectQuery.select.fetchedDataReference??""]
              ? ((selectorParams?.fetchedData??{})[selectorParams.singleSelectQuery.select.fetchedDataReference??""] as any)["uuid"]
              : selectorParams.singleSelectQuery.select.rootObjectUuid
            : undefined)
      )
    );
    log.info(
      "DomainSelector selectEntityInstancesFromListQueryAndDomainState",
      "selectorParams",
      selectorParams,
      "selectedInstances",
      selectedInstances,
      "domainState",
      domainState,
      "result",
      result
    );
    return result;
  } else {
    return {}
  }
};

// ################################################################################################
export const selectEntityInstanceFromObjectQueryAndDomainState = (
  domainState: DomainState,
  query: DomainModelGetSingleSelectQueryJzodSchemaQueryParams
): EntityInstance | undefined => {
  const querySelectorParams: SelectObjectInstanceQuery | undefined =
    query.singleSelectQuery.select.type == "objectQuery" ? query.singleSelectQuery.select : undefined;

  const deploymentUuid = querySelectorParams?.type == "objectQuery" ? query.singleSelectQuery.deploymentUuid : undefined;
  const applicationSection =
    query.singleSelectQuery.select.type == "objectQuery" ? query.singleSelectQuery.applicationSection : undefined;

  let result = undefined;
  if (deploymentUuid && applicationSection) {
    if (querySelectorParams?.parentUuid) {
      if (querySelectorParams?.fetchedDataReference && querySelectorParams.fetchedDataReferenceAttribute) {
        if (
          domainState &&
          domainState[deploymentUuid] &&
          domainState[deploymentUuid][applicationSection] &&
          domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid]
        ) {
          result =
            domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid][
              (query.fetchedData as any)[querySelectorParams.fetchedDataReference][
                querySelectorParams.fetchedDataReferenceAttribute
              ]
            ];
        }
      } else {
        if (
          querySelectorParams?.instanceUuid &&
          domainState &&
          domainState[deploymentUuid] &&
          domainState[deploymentUuid][applicationSection] &&
          domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid] &&
          domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid][querySelectorParams.instanceUuid]
        ) {
          result =
            domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid][querySelectorParams.instanceUuid];
        } else {
          if (
            querySelectorParams?.paramReference && (query.pageParams ?? {})[querySelectorParams?.paramReference] &&
            domainState &&
            domainState[deploymentUuid] &&
            domainState[deploymentUuid][applicationSection] &&
            domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid] &&
            domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid][
              (query.pageParams ?? {})[querySelectorParams?.paramReference]
            ]
            ) {
            result =
              domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid][
                (query.pageParams ?? {})[querySelectorParams?.paramReference]
              ];
          }
        }
      }
    }
  }

  log.info(
    "DomainSelector selectEntityInstanceFromObjectQueryAndDomainState",
    "query",
    query,
    "deploymentUuid",
    deploymentUuid,
    "applicationSection",
    applicationSection,
    "pageParams",
    query.pageParams,
    "querySelectorParams",
    querySelectorParams,
    // "pageParams[querySelectorParams?.paramReference]",
    // (query.pageParams??{})[querySelectorParams?.paramReference??""],
    // "domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid][pageParams[querySelectorParams?.paramReference]]",
    // domainState[deploymentUuid??""][applicationSection??"data"][querySelectorParams?.parentUuid??""][
    //   (query.pageParams??{})[querySelectorParams?.paramReference??""]
    // ],
    "fetchedData",
    query.fetchedData,
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
  query: DomainFetchQueryParams,
): FetchedData | undefined => {

  // log.info("########## DomainSelector selectFetchedDataFromDomainState begin");

  const newFetchedData:FetchedData = query.fetchedData??{};

  for (const entry of Object.entries(query.select??{})) {
    let result = undefined;
    switch (entry[1].type) {
      case "objectListQuery": {
        result = selectEntityInstancesFromListQueryAndDomainState(domainState, {
          type: "getSingleSelectQueryJzodSchema",
          fetchedData: newFetchedData,
          pageParams: query.pageParams,
          singleSelectQuery: {
            deploymentUuid: query.deploymentUuid,
            applicationSection: query.applicationSection,
            select: entry[1],
          }
        });
        break;
      }
      case "objectQuery": {
        result = selectEntityInstanceFromObjectQueryAndDomainState(domainState, {
          type: "getSingleSelectQueryJzodSchema",
          fetchedData: newFetchedData,
          pageParams: query.pageParams,
          singleSelectQuery: {
            applicationSection: query.applicationSection,
            deploymentUuid: query.deploymentUuid,
            select: entry[1],
          }
        });
        break;
      }
      default: {
        result = undefined;
        break;
      }
    }
    newFetchedData[entry[0]] = result;
    log.info("DomainSelector selectFetchedDataFromDomainState set", entry[0], "query", entry[1], result);
  }

  
  if (query.combine) {
    log.info("DomainSelector selectFetchedDataFromDomainState combine", query.combine);

    newFetchedData["combine"] = Object.fromEntries(
      Object.values(newFetchedData[query.combine?.a ?? ""] ?? {}).flatMap((a) =>
        Object.values(newFetchedData[query.combine?.b ?? ""] ?? {}).map((b) => [
          a.uuid + "-" + b.uuid,
          Object.fromEntries(
            Object.entries(a)
              .map((eA) => ["a-" + eA[0], eA[1]])
              .concat(Object.entries(b).map((eB) => ["b-" + eB[0], eB[1]]))
          ),
        ])
      )
    );
  }


  // log.info("########## DomainSelector selectFetchedDataFromDomainState end");

  log.info(
    "DomainSelector selectFetchedDataFromDomainState",
    "query",
    query,
    "domainState",
    domainState,
    "newFetchedData",
    newFetchedData
  );
  return newFetchedData;
};

// ################################################################################################
export const selectSingleSelectQueryJzodSchemaFromDomainState = (
  domainState: DomainState,
  query: DomainModelGetSingleSelectQueryJzodSchemaQueryParams
// ): JzodElement | undefined => {
): JzodObject | undefined => {
  return selectEntityJzodSchemaFromDomainState(domainState, {
    type: "getEntityDefinition",
    deploymentUuid: query.singleSelectQuery.deploymentUuid??"",
    entityUuid: query.singleSelectQuery.select.parentUuid,
  })
}

// ################################################################################################
export const selectEntityJzodSchemaFromDomainState = (
  domainState: DomainState,
  query: DomainModelGetEntityDefinitionQueryParams
// ): JzodElement | undefined => {
): JzodObject | undefined => {
  const localQuery: DomainModelGetEntityDefinitionQueryParams = query;
  if (
    domainState 
    && domainState[localQuery.deploymentUuid]
    && domainState[localQuery.deploymentUuid]["model"]
    && domainState[localQuery.deploymentUuid]["model"][entityEntityDefinition.uuid]
  ) {
    const values: EntityDefinition[] = Object.values(domainState[localQuery.deploymentUuid]["model"][entityEntityDefinition.uuid]??{}) as EntityDefinition[];
    const index = values.findIndex(
      (e: EntityDefinition) => e.entityUuid == localQuery.entityUuid
    );

    // const result: JzodElement | undefined = index > -1?values[index].jzodSchema: undefined;
    const result: JzodObject | undefined = index > -1?values[index].jzodSchema: undefined;
  
    log.info("DomainSelector selectEntityJzodSchemaFromDomainState result", result);
  
    return result
  } else {
    return undefined;
  }
}

// ################################################################################################
/**
 * the FetchData and FetchQueryJzodSchema should depend only on the instance of Report at hand
 * then on the instance of the required entities (which can change over time, on refresh!! Problem: their number can vary!!)
 * @param domainState 
 * @param query 
 * @returns 
 */
export const selectFetchQueryJzodSchemaFromDomainState = (
  domainState: DomainState,
  query: DomainModelGetFetchParamJzodSchemaQueryParams
// ):  RecordOfJzodElement | undefined => {
):  RecordOfJzodObject | undefined => {
  const localFetchParams: DomainFetchQueryParams = query.fetchParams
  // log.info("selectFetchQueryJzodSchemaFromDomainState called", domainState === prevDomainState, query === prevQuery);
  
  const fetchQueryJzodSchema = Object.fromEntries(
    Object.entries(localFetchParams?.select??{}).map((entry: [string, MiroirSelectQuery]) => [
      entry[0],
      selectSingleSelectQueryJzodSchemaFromDomainState(domainState, {
          type: "getSingleSelectQueryJzodSchema",
          singleSelectQuery: {
            deploymentUuid: localFetchParams.deploymentUuid,
            applicationSection: localFetchParams.applicationSection,
            select: entry[1],
          },
      }),
    ])
  );

  if (localFetchParams.combine) {
    // log.info("DomainSelector selectFetchedDataFromDomainState combine", query.combine);

    fetchQueryJzodSchema["combine"] = {
      type: "object",
      definition: Object.fromEntries(
      Object.entries(fetchQueryJzodSchema[localFetchParams.combine?.a ?? ""]?.definition ?? {}).map((a) => [
        "a-" + a[0],
        a[1]
      ]
      ).concat(
        Object.entries(fetchQueryJzodSchema[localFetchParams.combine?.b ?? ""]?.definition ?? {}).map((b) => [
          "b-" + b[0], b[1]
        ])
      )
    )};
  }


  return fetchQueryJzodSchema;
};

// ################################################################################################
export const selectDomainModelMetaInformationFromDomainState = (
  domainState: DomainState,
  query: DomainModelQueryParams
): RecordOfJzodElement | JzodElement | undefined => {
  switch (query.type) {
    case "getEntityDefinition":{ 
      return selectEntityJzodSchemaFromDomainState(domainState, query);
      break;
    }
    case "getFetchParamsJzodSchema": {
      return selectFetchQueryJzodSchemaFromDomainState(domainState, query)
      break;
    }
    case "getSingleSelectQueryJzodSchema": {
      return selectSingleSelectQueryJzodSchemaFromDomainState(domainState, query)
      break;
    }
    default:
      return undefined;
      break;
  }
};

