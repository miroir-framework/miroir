import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface";
import {
  DomainManyQueriesWithDeploymentUuid,
  DomainModelGetEntityDefinitionQueryParams,
  DomainModelGetFetchParamJzodSchemaQueryParams,
  DomainModelGetSingleSelectObjectListQueryQueryParams,
  DomainModelGetSingleSelectObjectQueryQueryParams,
  DomainModelGetSingleSelectQueryJzodSchemaQueryParams,
  DomainModelQueryJzodSchemaParams,
  DomainSingleSelectObjectListQueryWithDeployment,
  DomainSingleSelectQueryWithDeployment,
  DomainStateSelector,
  MiroirSelectorQueryParams,
  RecordOfJzodElement,
  RecordOfJzodObject
} from "../0_interfaces/2_domain/DomainSelectorInterface";

import { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import {
  ApplicationSection,
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
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/Logger";
import entityEntityDefinition from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json';
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { cleanLevel } from "./constants";

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
  // selectorParams: DomainSingleSelectQueryWithDeployment
  selectorParams: DomainSingleSelectObjectListQueryWithDeployment
): EntityInstancesUuidIndex | undefined => {

  const deploymentUuid = selectorParams.deploymentUuid;
  const applicationSection = selectorParams.applicationSection;
  // if (
  //   selectorParams.select.queryType !== "selectObjectListByEntity" &&
  //   selectorParams.select.queryType !== "selectObjectListByRelation"
  // ) {
  //   // TODO: make sure that we get the correct type!
  //   throw new Error(
  //     "selectEntityInstanceUuidIndexFromDomainState could not handle query with queryType:" +
  //       selectorParams.select.queryType +
  //       ", query=" +
  //       JSON.stringify(selectorParams, undefined, 2)
  //   );
  // }
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
  selectorParams: DomainModelGetSingleSelectObjectListQueryQueryParams
): EntityInstancesUuidIndex | undefined => {
    const selectedInstances = selectEntityInstanceUuidIndexFromDomainState(domainState, selectorParams.singleSelectQuery);
    let result
    switch (selectorParams.singleSelectQuery.select.queryType) {
      case "selectObjectListByEntity":{
        result = selectedInstances;
        break;
      }
      case "selectObjectListByRelation":{
        // if (selectorParams.singleSelectQuery.select.objectReference) {
        result = Object.fromEntries(
          Object.entries(selectedInstances ?? {}).filter(
            (i: [string, EntityInstance]) =>
              (i[1] as any)[
                selectorParams.singleSelectQuery.select.queryType == "selectObjectListByRelation"
                  ? // selectorParams.type == "EntityInstanceListQueryParams"
                    selectorParams.singleSelectQuery.select.AttributeOfListObjectToCompareToReferenceUuid ?? "dummy"
                  : "dummy"
              ] ===
              (selectorParams.singleSelectQuery.select.queryType == "selectObjectListByRelation"
                ? // (selectorParams.type == "EntityInstanceListQueryParams"
                  selectorParams.singleSelectQuery.select.objectReference?.referenceType == "queryContextReference" &&
                  (selectorParams?.fetchedData ?? {})[selectorParams.singleSelectQuery.select.objectReference.referenceName ?? ""]
                  ? (
                      (selectorParams?.fetchedData ?? {})[
                        selectorParams.singleSelectQuery.select.objectReference.referenceName ?? ""
                      ] as any
                    )["uuid"]
                  : selectorParams.singleSelectQuery.select.objectReference?.referenceType == "queryParameterReference"?
                    undefined
                  : selectorParams.singleSelectQuery.select.objectReference?.referenceType == "constant"?
                    selectorParams.singleSelectQuery.select.objectReference?.referenceUuid : undefined
                : undefined)
          )
        );
        // } else {
        //   result = Object.fromEntries(
        //     Object.entries(selectedInstances ?? {}).filter(
        //       (i: [string, EntityInstance]) =>
        //         (i[1] as any)[
        //           selectorParams.singleSelectQuery.select.queryType == "selectObjectListByRelation"
        //             ? // selectorParams.type == "EntityInstanceListQueryParams"
        //               selectorParams.singleSelectQuery.select.rootObjectAttribute ?? "dummy"
        //             : "dummy"
        //         ] ===
        //         (selectorParams.singleSelectQuery.select.queryType == "selectObjectListByRelation"
        //           ? // (selectorParams.type == "EntityInstanceListQueryParams"
        //             selectorParams.singleSelectQuery.select.fetchedDataReference &&
        //             (selectorParams?.fetchedData ?? {})[selectorParams.singleSelectQuery.select.fetchedDataReference ?? ""]
        //             ? (
        //                 (selectorParams?.fetchedData ?? {})[
        //                   selectorParams.singleSelectQuery.select.fetchedDataReference ?? ""
        //                 ] as any
        //               )["uuid"]
        //             : selectorParams.singleSelectQuery.select.rootObjectUuid
        //           : undefined)
        //     )
        //   );
        // }
        break;
      }
      default: {
        throw new Error(
          "selectEntityInstancesFromListQueryAndDomainState could not handle query, selectorParams=" +
            JSON.stringify(selectorParams.singleSelectQuery.select, undefined, 2)
        );
        break;
      }
    }
    // filter selectedInstances
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
  // } else {
  //   return {}
  // }
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
  query: DomainModelGetSingleSelectObjectQueryQueryParams
): EntityInstance | undefined => {
  let result = undefined;
  const querySelectorParams: SelectObjectQuery = query.singleSelectQuery.select as SelectObjectQuery;
  const deploymentUuid = query.singleSelectQuery.deploymentUuid;
  const applicationSection = query.singleSelectQuery.applicationSection;

  switch (querySelectorParams?.queryType) {
    case "selectObjectByRelation": {
      if (
        querySelectorParams?.objectReference && 
        querySelectorParams.AttributeOfObjectToCompareToReferenceUuid && 
        querySelectorParams.objectReference.referenceType == "queryContextReference"
      ) {
        // resolving by fetchDataReference, fetchDataReferenceAttribute
        if (
          domainState &&
          domainState[deploymentUuid] &&
          domainState[deploymentUuid][applicationSection] &&
          domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid]
        ) {
          result =
            domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid][
              (query.fetchedData as any)[querySelectorParams.objectReference.referenceName][
                querySelectorParams.AttributeOfObjectToCompareToReferenceUuid
              ]
            ];
        } else {
          throw new Error(
            "selectEntityInstanceFromObjectQueryAndDomainState can not resolve objectReference in selectObjectByRelation objectReference, query=" +
            JSON.stringify(query, undefined, 2)
          );
        }
      } else {
        throw new Error(
          "selectEntityInstanceFromObjectQueryAndDomainState can not resolve objectReference in selectObjectByRelation query=" +
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
export type ElementsFromQuery =
  | ElementsFromQuery[]
  | { [k: string]: ElementsFromQuery }
  | EntityInstancesUuidIndex
  | EntityInstance
  | undefined;

  export const innerSelectElementFromQueryAndDomainState = (
  domainState: DomainState,
  newFetchedData:FetchedData,
  pageParams: Record<string, any>,
  deploymentUuid: Uuid,
  applicationSection: ApplicationSection,
  query: MiroirSelectQuery
): ElementsFromQuery => {
// ): EntityInstancesUuidIndex | EntityInstance | undefined => {
  let result: ElementsFromQuery;
  switch (query.queryType) {
    case "selectObjectListByEntity":
    case "selectObjectListByRelation": {
      result = selectEntityInstancesFromListQueryAndDomainState(domainState, {
        queryType: "getSingleSelectQuery",
        fetchedData: newFetchedData,
        pageParams: pageParams,
        singleSelectQuery: {
          queryType: "domainSingleSelectQueryWithDeployment",
          deploymentUuid: deploymentUuid,
          applicationSection: applicationSection,
          select: query,
        },
      });
      break;
    }
    case "selectObjectByUuid":
    case "selectObjectByRelation":
    case "selectObjectByParameterValue": {
      result = selectEntityInstanceFromObjectQueryAndDomainState(domainState, {
        queryType: "getSingleSelectQuery",
        fetchedData: newFetchedData,
        pageParams: pageParams,
        singleSelectQuery: {
          queryType: "domainSingleSelectQueryWithDeployment",
          applicationSection: applicationSection,
          deploymentUuid: deploymentUuid,
          select: query,
        },
      });
      break;
    }
    case "wrapperReturningObject": {
      result = Object.fromEntries(
        Object.entries(query.definition).map((e: [string, MiroirSelectQuery]) => [
          e[0],
          innerSelectElementFromQueryAndDomainState(
            domainState,
            newFetchedData,
            pageParams ?? {},
            deploymentUuid,
            applicationSection,
            e[1]
          ),
        ])
      );
      break;
    }
    case "wrapperReturningList": {
      result = query.definition.map((e) =>
        innerSelectElementFromQueryAndDomainState(
          domainState,
          newFetchedData,
          pageParams ?? {},
          deploymentUuid,
          applicationSection,
          e
        )
      );
      break;
    }
    case "queryContextReference": {
      result = newFetchedData[query.referenceName];
      break;
    }
    default: {
      result = undefined;
      break;
    }
  }
  return result;
}
// ################################################################################################
export const selectByDomainManyQueriesFromDomainState = (
  domainState: DomainState,
  query: DomainManyQueriesWithDeploymentUuid,
): FetchedData | undefined => {

  // log.info("########## DomainSelector selectByDomainManyQueriesFromDomainState begin");

  const newFetchedData:FetchedData = query.fetchedData??{};

  for (const entry of Object.entries(query.select??{})) {
    let result = innerSelectElementFromQueryAndDomainState(
      domainState,
      newFetchedData,
      query.pageParams ?? {},
      query.deploymentUuid,
      query.applicationSection,
      entry[1]
    );
    newFetchedData[entry[0]] = result;
    log.info("DomainSelector selectByDomainManyQueriesFromDomainState done for entry", entry[0], "query", entry[1], "result=", result);
  }

  if (query.crossJoin) {
    log.info("DomainSelector selectByDomainManyQueriesFromDomainState crossJoin", query.crossJoin);

    // performs a cross-join
    newFetchedData["crossJoin"] = Object.fromEntries(
      Object.values(newFetchedData[query.crossJoin?.a ?? ""] ?? {}).flatMap((a) =>
        Object.values(newFetchedData[query.crossJoin?.b ?? ""] ?? {}).map((b) => [
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
  if (
    query.singleSelectQuery.select.queryType=="queryContextReference" ||
    query.singleSelectQuery.select.queryType=="wrapperReturningObject" ||
    query.singleSelectQuery.select.queryType=="wrapperReturningList"
  ) {
    throw new Error("selectJzodSchemaBySingleSelectQueryFromDomainState can not deal with context reference: query=" + JSON.stringify(query, undefined, 2));
  } else {
    return selectEntityJzodSchemaFromDomainState(domainState, {
      queryType: "getEntityDefinition",
      deploymentUuid: query.singleSelectQuery.deploymentUuid??"",
      entityUuid:  query.singleSelectQuery.select.parentUuid,
    })
  }
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

  if (localFetchParams.crossJoin) {
    // log.info("DomainSelector selectByDomainManyQueriesFromDomainState crossJoin", query.crossJoin);

    fetchQueryJzodSchema["crossJoin"] = {
      type: "object",
      definition: Object.fromEntries(
      Object.entries(fetchQueryJzodSchema[localFetchParams.crossJoin?.a ?? ""]?.definition ?? {}).map((a) => [
        "a-" + a[0],
        a[1]
      ]
      ).concat(
        Object.entries(fetchQueryJzodSchema[localFetchParams.crossJoin?.b ?? ""]?.definition ?? {}).map((b) => [
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

