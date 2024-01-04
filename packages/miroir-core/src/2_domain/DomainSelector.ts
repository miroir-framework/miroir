import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface";
import {
  DomainManyQueriesWithDeploymentUuid,
  DomainModelGetEntityDefinitionQueryParams,
  DomainModelGetFetchParamJzodSchemaQueryParams,
  DomainModelGetSingleSelectQueryJzodSchemaQueryParams,
  DomainModelGetSingleSelectQueryQueryParams,
  DomainModelQueryJzodSchemaParams,
  DomainSingleSelectQueryWithDeployment,
  DomainStateSelector,
  MiroirSelectorQueryParams,
  RecordOfJzodElement,
  RecordOfJzodObject
} from "../0_interfaces/2_domain/DomainSelectorInterface";

import entityEntityDefinition from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json';
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/Logger";
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { cleanLevel } from "./constants";
import {
  EntityDefinition,
  EntityInstance,
  EntityInstancesUuidIndex,
  FetchedData,
  JzodElement,
  JzodObject,
  MiroirCustomQueryParams,
  MiroirSelectQuery,
  SelectObjectQuery,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

const loggerName: string = getLoggerName(packageName, cleanLevel,"DomainSelector");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

// ################################################################################################
export const selectEntityInstanceUuidIndexFromDomainState: DomainStateSelector<DomainSingleSelectQueryWithDeployment, EntityInstancesUuidIndex | undefined> = (
  domainState: DomainState,
  selectorParams: DomainSingleSelectQueryWithDeployment
): EntityInstancesUuidIndex | undefined => {

  const deploymentUuid = selectorParams.deploymentUuid;
  const applicationSection = selectorParams.applicationSection;
  const entityUuid = selectorParams.select.parentUuid;

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
/**
 * returns an Entity Instance List, from a ListQuery
 * @param domainState 
 * @param selectorParams 
 * @returns 
 */
export const selectEntityInstancesFromListQueryAndDomainState = (
  domainState: DomainState,
  selectorParams: DomainModelGetSingleSelectQueryQueryParams
): EntityInstancesUuidIndex | undefined => {
 const listQueryTypes = [ "selectObjectListByOtherWay", "selectObjectListByEntity"]
  if (listQueryTypes.includes(selectorParams.singleSelectQuery.select.queryType)) {
    const selectedInstances = selectEntityInstanceUuidIndexFromDomainState(domainState, selectorParams.singleSelectQuery)
    const result = Object.fromEntries(
      Object.entries(selectedInstances ?? {}).filter(
        (i: [string, EntityInstance]) =>
          (i[1] as any)[
            selectorParams.singleSelectQuery.select.queryType == "selectObjectListByOtherWay"
            // selectorParams.type == "EntityInstanceListQueryParams"
              ? selectorParams.singleSelectQuery.select.rootObjectAttribute ?? "dummy"
              : "dummy"
          ] ===
          (selectorParams.singleSelectQuery.select.queryType == "selectObjectListByOtherWay"
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
/**
 * returns an Entity Instance (Object) from and selectObjectByParameterValue
 * @param domainState 
 * @param query 
 * @returns 
 */
export const selectEntityInstanceFromObjectQueryAndDomainState = (
  domainState: DomainState,
  query: DomainModelGetSingleSelectQueryQueryParams
): EntityInstance | undefined => {
  let result = undefined;
  const querySelectorParams: SelectObjectQuery = query.singleSelectQuery.select as SelectObjectQuery;
  const deploymentUuid = query.singleSelectQuery.deploymentUuid;
  const applicationSection = query.singleSelectQuery.applicationSection;

  switch (querySelectorParams?.queryType) {
    case "selectObjectByFetchedObjectRelation": {
      if (querySelectorParams?.fetchedObjectReference && querySelectorParams.fetchedObjectAttribute) {
        // resolving by fetchDataReference, fetchDataReferenceAttribute
        if (
          domainState &&
          domainState[deploymentUuid] &&
          domainState[deploymentUuid][applicationSection] &&
          domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid]
        ) {
          result =
            domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid][
              (query.fetchedData as any)[querySelectorParams.fetchedObjectReference][
                querySelectorParams.fetchedObjectAttribute
              ]
            ];
        }
      } else {
        throw new Error(
          "selectEntityInstanceFromObjectQueryAndDomainState can not resolve selectObjectByFetchedObjectRelation query=" +
          JSON.stringify(query, undefined, 2)
        );
      }
      break;
    }
    case "selectObjectByParameterValue": {
      if (
        // resolving by queryParameterName
        querySelectorParams?.queryParameterName && (query.pageParams ?? {})[querySelectorParams?.queryParameterName] &&
        domainState &&
        domainState[deploymentUuid] &&
        domainState[deploymentUuid][applicationSection] &&
        domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid] &&
        domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid][
          (query.pageParams ?? {})[querySelectorParams?.queryParameterName]
        ]
        ) {
        result =
          domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid][
            (query.pageParams ?? {})[querySelectorParams?.queryParameterName]
          ];
      } else {
        throw new Error(
          "selectEntityInstanceFromObjectQueryAndDomainState can not resolve SelectObjectQuery query=" +
          JSON.stringify(query, undefined, 2)
        );
      }
      break;
    }
    case "selectObjectByUuid": {
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
        throw new Error("selectEntityInstanceFromObjectQueryAndDomainState could not resolve query=" + JSON.stringify(query, undefined, 2));
      }
      break;
    }
    default: {
      throw new Error(
        "selectEntityInstanceFromObjectQueryAndDomainState can not handle SelectObjectQuery query with queryType=" +
          query.singleSelectQuery.select.queryType
      );
      break;
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
export const selectByDomainManyQueriesFromDomainState = (
  domainState: DomainState,
  query: DomainManyQueriesWithDeploymentUuid,
): FetchedData | undefined => {

  // log.info("########## DomainSelector selectByDomainManyQueriesFromDomainState begin");

  const newFetchedData:FetchedData = query.fetchedData??{};

  for (const entry of Object.entries(query.select??{})) {
    let result = undefined;
    switch (entry[1].queryType) {
      case "selectObjectListByEntity":
      case "selectObjectListByOtherWay": {
        result = selectEntityInstancesFromListQueryAndDomainState(domainState, {
          queryType: "getSingleSelectQuery",
          fetchedData: newFetchedData,
          pageParams: query.pageParams,
          singleSelectQuery: {
            queryType: "domainSingleSelectQueryWithDeployment",
            deploymentUuid: query.deploymentUuid,
            applicationSection: query.applicationSection,
            select: entry[1],
          }
        });
        break;
      }
      case "selectObjectByUuid":
      case "selectObjectByFetchedObjectRelation":
      case "selectObjectByParameterValue": {
        result = selectEntityInstanceFromObjectQueryAndDomainState(domainState, {
          queryType: "getSingleSelectQuery",
          fetchedData: newFetchedData,
          pageParams: query.pageParams,
          singleSelectQuery: {
            queryType: "domainSingleSelectQueryWithDeployment",
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
    log.info("DomainSelector selectByDomainManyQueriesFromDomainState done for entry", entry[0], "query", entry[1], "result=", result);
  }

  
  if (query.combine) {
    log.info("DomainSelector selectByDomainManyQueriesFromDomainState combine", query.combine);

    // performs a cross-join
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

  log.info(
    "DomainSelector selectByDomainManyQueriesFromDomainState",
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
export const selectByCustomQueryFromDomainState = (
  domainState: DomainState,
  query: MiroirCustomQueryParams,
): FetchedData | undefined => {
  return undefined
}

// ################################################################################################
export const selectByDomainModelQueryFromDomainState = (
  domainState: DomainState,
  query: MiroirSelectorQueryParams
): any => {
  switch (query.queryType) {
    case "domainSingleSelectQueryWithDeployment":
    case "getSingleSelectQuery":
    case "DomainManyQueries":
    case "LocalCacheEntityInstancesSelectorParams":
    case "custom":
    // case "getEntityDefinition":{ 
    //   return selectEntityJzodSchemaFromDomainState(domainState, query);
    //   break;
    // }
    // case "getFetchParamsJzodSchema": {
    //   return selectFetchQueryJzodSchemaFromDomainState(domainState, query)
    //   break;
    // }
    // case "getSingleSelectQueryJzodSchema": {
    //   return selectJzodSchemaBySingleSelectQueryFromDomainState(domainState, query)
    //   break;
    // }
    default:
      return undefined;
      break;
  }
};


// ################################################################################################
// ################################################################################################
// JZOD SCHEMAs selectors
// ################################################################################################
// ################################################################################################
export const selectJzodSchemaBySingleSelectQueryFromDomainState = (
  domainState: DomainState,
  query: DomainModelGetSingleSelectQueryJzodSchemaQueryParams
// ): JzodElement | undefined => {
): JzodObject | undefined => {
  return selectEntityJzodSchemaFromDomainState(domainState, {
    queryType: "getEntityDefinition",
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
  const localFetchParams: DomainManyQueriesWithDeploymentUuid = query.fetchParams
  // log.info("selectFetchQueryJzodSchemaFromDomainState called", domainState === prevDomainState, query === prevQuery);
  
  const fetchQueryJzodSchema = Object.fromEntries(
    Object.entries(localFetchParams?.select??{}).map((entry: [string, MiroirSelectQuery]) => [
      entry[0],
      selectJzodSchemaBySingleSelectQueryFromDomainState(domainState, {
          queryType: "getSingleSelectQueryJzodSchema",
          singleSelectQuery: {
            queryType: "domainSingleSelectQueryWithDeployment",
            deploymentUuid: localFetchParams.deploymentUuid,
            applicationSection: localFetchParams.applicationSection,
            select: entry[1],
          },
      }),
    ])
  );

  if (localFetchParams.combine) {
    // log.info("DomainSelector selectByDomainManyQueriesFromDomainState combine", query.combine);

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
export const selectJzodSchemaByDomainModelQueryFromDomainState = (
  domainState: DomainState,
  query: DomainModelQueryJzodSchemaParams
): RecordOfJzodElement | JzodElement | undefined => {
  switch (query.queryType) {
    case "getEntityDefinition":{ 
      return selectEntityJzodSchemaFromDomainState(domainState, query);
      break;
    }
    case "getFetchParamsJzodSchema": {
      return selectFetchQueryJzodSchemaFromDomainState(domainState, query)
      break;
    }
    case "getSingleSelectQueryJzodSchema": {
      return selectJzodSchemaBySingleSelectQueryFromDomainState(domainState, query)
      break;
    }
    default:
      return undefined;
      break;
  }
};

