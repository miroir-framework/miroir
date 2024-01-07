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
  ResultsFromQuery,
  JzodElement,
  JzodObject,
  MiroirCustomQueryParams,
  MiroirSelectQuery,
  QueryFailed,
  SelectObjectQuery,
  SelectObjectListByRelationQuery,
  ResultsFromQueryObject,
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

export function cleanupResultsFromQuery(r:ResultsFromQuery): any {
  switch (r.resultType) {
    case "string":
    case "instanceUuidIndex":
    case "instance": {
      return r.resultValue
    }
    case "object": {
      return Object.fromEntries(Object.entries(r.resultValue).map(e => [e[0], cleanupResultsFromQuery(e[1])]))
    }
    case "array": {
      return r.resultValue.map(e => cleanupResultsFromQuery(e))
    }
    case "failure": {
      return undefined
      break;
    }
    default: {
      throw new Error("could not handle Results from query: " + JSON.stringify(r,undefined,2));
      break;
    }
  }
}

// ################################################################################################
export const selectEntityInstanceUuidIndexFromDomainState: DomainStateSelector<
  DomainSingleSelectQueryWithDeployment, ResultsFromQuery
> = (
  domainState: DomainState,
  selectorParams: DomainSingleSelectObjectListQueryWithDeployment
): ResultsFromQuery => {
  const deploymentUuid = selectorParams.deploymentUuid;
  const applicationSection = selectorParams.applicationSection;
  const entityUuid = selectorParams.select.parentUuid;

  // let resultValue: EntityInstancesUuidIndex | QueryFailed | undefined = undefined;
  if (!deploymentUuid || !applicationSection || !entityUuid) {
    return {
      resultType: "failure",
      resultValue: {
        queryFailure: "IncorrectParameters",
        queryParameters: selectorParams,
      },
    };
    // resolving by fetchDataReference, fetchDataReferenceAttribute
  } else if (!domainState) {
    return { resultType: "failure", resultValue: { queryFailure: "DomainStateNotLoaded" } };
  } else if (!domainState[deploymentUuid]) {
    return { resultType: "failure", resultValue: { queryFailure: "DeploymentNotFound", deploymentUuid } };
  } else if (!domainState[deploymentUuid][applicationSection]) {
    return {
      resultType: "failure",
      resultValue: { queryFailure: "ApplicationSectionNotFound", deploymentUuid, applicationSection },
    };
  } else if (!domainState[deploymentUuid][applicationSection][entityUuid]) {
    return {
      resultType: "failure",
      resultValue: {
        queryFailure: "EntityNotFound",
        deploymentUuid,
        applicationSection,
        entityUuid: entityUuid,
      },
    };
  } else {
    return { resultType: "instanceUuidIndex", resultValue: domainState[deploymentUuid][applicationSection][entityUuid] };
  }
};

// ################################################################################################
/**
 * returns an Entity Instance List, from a ListQuery
 * @param domainState 
 * @param selectorParams 
 * @returns 
 */
export const selectEntityInstancesFromListQueryAndDomainState: DomainStateSelector<
  DomainModelGetSingleSelectObjectListQueryQueryParams, ResultsFromQuery
> = (
  domainState: DomainState,
  selectorParams: DomainModelGetSingleSelectObjectListQueryQueryParams
): ResultsFromQuery => {
  const selectedInstances = selectEntityInstanceUuidIndexFromDomainState(domainState, selectorParams.singleSelectQuery);
  switch (selectorParams.singleSelectQuery.select.queryType) {
    case "selectObjectListByEntity": {
      return selectedInstances;
      break;
    }
    case "selectObjectListByRelation": {
      // if (selectorParams.singleSelectQuery.select.objectReference) {
      const relationQuery: SelectObjectListByRelationQuery = selectorParams.singleSelectQuery.select;
      log.info("selectEntityInstancesFromListQueryAndDomainState selectObjectListByRelation", JSON.stringify(selectedInstances))
      return { "resultType": "instanceUuidIndex", "resultValue": Object.fromEntries(
        Object.entries(selectedInstances.resultValue ?? {}).filter(
          (i: [string, EntityInstance]) => {
            const localIndex = relationQuery.AttributeOfListObjectToCompareToReferenceUuid ?? "dummy";

            let otherIndex = undefined
            if (
              relationQuery.objectReference?.referenceType == "queryContextReference" &&
              selectorParams?.contextResults?.resultType == "object" &&
              selectorParams?.contextResults.resultValue &&
              selectorParams?.contextResults.resultValue[relationQuery.objectReference.referenceName ?? ""]
            ) {
              otherIndex = (selectorParams?.contextResults?.resultValue[relationQuery.objectReference.referenceName].resultValue as any ?? {})["uuid"]
            } else if (relationQuery.objectReference?.referenceType == "constant") {
              otherIndex = relationQuery.objectReference?.referenceUuid
            }


            return (i[1] as any)[localIndex] === otherIndex
          }
        )
      )};
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
};

// ################################################################################################
/**
 * returns an Entity Instance (Object) from and selectObjectByParameterValue
 * @param domainState 
 * @param query 
 * @returns 
 */
export const selectEntityInstanceFromObjectQueryAndDomainState:DomainStateSelector<
  DomainModelGetSingleSelectObjectQueryQueryParams, ResultsFromQuery
> = (
  domainState: DomainState,
  query: DomainModelGetSingleSelectObjectQueryQueryParams
): ResultsFromQuery => {
  const querySelectorParams: SelectObjectQuery = query.singleSelectQuery.select as SelectObjectQuery;
  const deploymentUuid = query.singleSelectQuery.deploymentUuid;
  const applicationSection = query.singleSelectQuery.applicationSection;

  switch (querySelectorParams?.queryType) {
    case "selectObjectByRelation": {
      if (
        !querySelectorParams?.objectReference ||
        !querySelectorParams.AttributeOfObjectToCompareToReferenceUuid ||
        querySelectorParams.objectReference.referenceType !== "queryContextReference"
      ) {
        return {
          resultType: "failure",
          resultValue: {
            queryFailure: "IncorrectParameters",
            queryParameters: query.pageParams,
          },
        };
        // resolving by fetchDataReference, fetchDataReferenceAttribute
      } else if (!domainState) {
        return { resultType: "failure", resultValue: { queryFailure: "DomainStateNotLoaded" } };
      } else if (!domainState[deploymentUuid]) {
        return { resultType: "failure", resultValue: { queryFailure: "DeploymentNotFound", deploymentUuid } };
      } else if (!domainState[deploymentUuid][applicationSection]) {
        return {
          resultType: "failure",
          resultValue: { queryFailure: "ApplicationSectionNotFound", deploymentUuid, applicationSection },
        };
      } else if (!domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid]) {
        return {
          resultType: "failure",
          resultValue: {
            queryFailure: "EntityNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: querySelectorParams.parentUuid,
          },
        };
      } else {
        // log.info(
        //   "selectEntityInstanceFromObjectQueryAndDomainState selectObjectByRelation, reference",
        //   querySelectorParams.objectReference.referenceName,
        //   "context",
        //   JSON.stringify(query.contextResults, undefined, 2)
        // );
        return {
          resultType: "instance",
          resultValue:
            domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid][
              (query.contextResults.resultValue as any)[querySelectorParams.objectReference.referenceName].resultValue[
                querySelectorParams.AttributeOfObjectToCompareToReferenceUuid
              ]
            ],
        };
      }
      break;
    }
    case "selectObjectByParameterValue": {
      if (
        // resolving by queryParameterName
        !querySelectorParams?.queryParameterName ||
        (query.pageParams ?? {})[querySelectorParams?.queryParameterName]
      ) {
        return {resultType: "failure", resultValue:{
          queryFailure: "IncorrectParameters",
          queryParameters: query.pageParams,
        }};
      } else if (!domainState) {
        return {resultType: "failure", resultValue:{ queryFailure: "DomainStateNotLoaded" }};
      } else if (!domainState[deploymentUuid]) {
        return {resultType: "failure", resultValue:{ queryFailure: "DeploymentNotFound", deploymentUuid }};
      } else if (!domainState[deploymentUuid][applicationSection]) {
        return {resultType: "failure", resultValue:{ queryFailure: "ApplicationSectionNotFound", deploymentUuid, applicationSection }};
      } else if (!domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid]) {
        return {resultType: "failure", resultValue:{
          queryFailure: "EntityNotFound",
          deploymentUuid,
          applicationSection,
          entityUuid: querySelectorParams.parentUuid,
        }};
      } else {
        return {resultType: "instance", resultValue: domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid][
          (query.queryParams ?? query.pageParams ?? {})[querySelectorParams?.queryParameterName]
        ]};
      }
      break;
    }
    case "selectObjectByDirectReference": {
      const instanceUuid =
        querySelectorParams.objectReference.referenceType == "queryParameterReference" &&
        (query.queryParams as any)[querySelectorParams?.objectReference.referenceName]
          ? (query.queryParams as any)[querySelectorParams?.objectReference.referenceName]
          : querySelectorParams.objectReference.referenceType == "queryContextReference"
          ? query.contextResults.resultValue[querySelectorParams?.objectReference.referenceName]
          : querySelectorParams.objectReference.referenceType == "constant"
          ? querySelectorParams.objectReference.referenceUuid
          : undefined;
      log.info("selectEntityInstanceFromObjectQueryAndDomainState instanceUuid", instanceUuid);
      if (
        // resolving by queryParameterName
        !querySelectorParams?.objectReference || !instanceUuid
      ) {
        return {
          resultType: "failure",
          resultValue: {
            queryFailure: "IncorrectParameters",
            queryParameters: query.pageParams,
          },
        };
      } else if (!domainState) {
        return { resultType: "failure", resultValue: { queryFailure: "DomainStateNotLoaded" } };
      } else if (!domainState[deploymentUuid]) {
        return { resultType: "failure", resultValue: { queryFailure: "DeploymentNotFound", deploymentUuid } };
      } else if (!domainState[deploymentUuid][applicationSection]) {
        return {
          resultType: "failure",
          resultValue: { queryFailure: "ApplicationSectionNotFound", deploymentUuid, applicationSection },
        };
      } else if (!domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid]) {
        return {
          resultType: "failure",
          resultValue: {
            queryFailure: "EntityNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: querySelectorParams.parentUuid,
          },
        };
      } else {
        return {
          resultType: "instance",
          resultValue:
            domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid][instanceUuid],
        };
      }
      break;
    }
    case "selectObjectByUuid": {
      if (!domainState) {
        return {resultType: "failure", resultValue:{ queryFailure: "DomainStateNotLoaded" }};
      } else if (!domainState[deploymentUuid]) {
        return {resultType: "failure", resultValue:{ queryFailure: "DeploymentNotFound", deploymentUuid }};
      } else if (!domainState[deploymentUuid][applicationSection]) {
        return {resultType: "failure", resultValue:{ queryFailure: "ApplicationSectionNotFound", deploymentUuid, applicationSection }};
      } else if (!domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid]) {
        return {resultType: "failure", resultValue:{
          queryFailure: "EntityNotFound",
          deploymentUuid,
          applicationSection,
          entityUuid: querySelectorParams.parentUuid,
        }};
      } else if (
        !domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid][
          querySelectorParams.instanceUuid
        ]
      ) {
        return {resultType: "failure", resultValue:{
          queryFailure: "InstanceNotFound",
          deploymentUuid,
          applicationSection,
          entityUuid: querySelectorParams.parentUuid,
          instanceUuid: querySelectorParams.instanceUuid,
        }};
      } else {
        return {resultType: "instance", resultValue: domainState[deploymentUuid][applicationSection][querySelectorParams.parentUuid][
          querySelectorParams.instanceUuid
        ]};
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
};

// ################################################################################################
export const innerSelectElementFromQueryAndDomainState = (
  domainState: DomainState,
  newFetchedData:ResultsFromQueryObject,
  pageParams: Record<string, any>,
  queryParams: Record<string, any>,
  deploymentUuid: Uuid,
  applicationSection: ApplicationSection,
  query: MiroirSelectQuery
): ResultsFromQuery => {
  switch (query.queryType) {
    case "literal": {
      return { resultType: "string", resultValue: query.definition };
      break;
    }
    case "selectObjectListByEntity":
    case "selectObjectListByRelation": {
      return selectEntityInstancesFromListQueryAndDomainState(domainState, {
        queryType: "getSingleSelectQuery",
        contextResults: newFetchedData,
        pageParams: pageParams,
        queryParams,
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
    case "selectObjectByParameterValue":
    case "selectObjectByDirectReference": {
      return selectEntityInstanceFromObjectQueryAndDomainState(domainState, {
        queryType: "getSingleSelectQuery",
        contextResults: newFetchedData,
        pageParams: pageParams,
        queryParams,
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
      return {
        resultType: "object",
        resultValue: Object.fromEntries(
          Object.entries(query.definition).map((e: [string, MiroirSelectQuery]) => [
            e[0],
            innerSelectElementFromQueryAndDomainState(
              domainState,
              newFetchedData,
              pageParams ?? {},
              queryParams ?? {},
              deploymentUuid,
              applicationSection,
              e[1]
            ),
          ])
        ),
      };
      break;
    }
    case "wrapperReturningList": {
      return {
        resultType: "array",
        resultValue: query.definition.map((e) =>
          innerSelectElementFromQueryAndDomainState(
            domainState,
            newFetchedData,
            pageParams ?? {},
            queryParams ?? {},
            deploymentUuid,
            applicationSection,
            e
          )
        ),
      };
      break;
    }
    case "queryContextReference": {
      return newFetchedData && newFetchedData.resultType == "object" && newFetchedData.resultValue[query.referenceName]
        ? newFetchedData.resultValue[query.referenceName]
        : { resultType: "failure", resultValue: { queryFailure: "ReferenceNotFound", query } };
      break;
    }
    default: {
      return { resultType: "failure", resultValue: { queryFailure: "QueryNotExecutable", query } };
      break;
    }
  }
}
// ################################################################################################
export const selectByDomainManyQueriesFromDomainState:DomainStateSelector<
  DomainManyQueriesWithDeploymentUuid, ResultsFromQueryObject
> = (
  domainState: DomainState,
  query: DomainManyQueriesWithDeploymentUuid,
): ResultsFromQueryObject => {

  log.info("########## DomainSelector selectByDomainManyQueriesFromDomainState begin, query", JSON.stringify(query, undefined, 2));
  
  const newFetchedData:ResultsFromQueryObject = {resultType: "object", resultValue: {...query.contextResults.resultValue}};
  log.info("########## DomainSelector selectByDomainManyQueriesFromDomainState begin, newFetchedData", newFetchedData);
  
  for (const entry of Object.entries(query.fetchQuery.select??{})) {
    let result = innerSelectElementFromQueryAndDomainState(
      domainState,
      newFetchedData,
      query.pageParams ?? {},
      query.queryParams ?? {},
      query.deploymentUuid,
      query.applicationSection,
      entry[1]
    );
    newFetchedData.resultValue[entry[0]] = result;
    log.info("DomainSelector selectByDomainManyQueriesFromDomainState done for entry", entry[0], "query", entry[1], "result=", result);
  }

  if (query.fetchQuery.crossJoin) {
    log.info("DomainSelector selectByDomainManyQueriesFromDomainState fetchQuery?.crossJoin", query.fetchQuery?.crossJoin);

    // performs a cross-join
    newFetchedData.resultValue["crossJoin"] = {resultType: "instanceUuidIndex", resultValue: Object.fromEntries(
      Object.values(newFetchedData.resultValue[query.fetchQuery?.crossJoin?.a ?? ""] ?? {}).flatMap((a) =>
        Object.values(newFetchedData.resultValue[query.fetchQuery?.crossJoin?.b ?? ""] ?? {}).map((b) => [
          a.uuid + "-" + b.uuid,
          Object.fromEntries(
            Object.entries(a)
              .map((eA) => ["a-" + eA[0], eA[1]])
              .concat(Object.entries(b).map((eB) => ["b-" + eB[0], eB[1]]))
          ),
        ])
      )
    )};
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
): ResultsFromQuery | undefined => {
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
    query.singleSelectQuery.select.queryType=="literal" ||
    query.singleSelectQuery.select.queryType=="queryContextReference" ||
    query.singleSelectQuery.select.queryType=="wrapperReturningObject" ||
    query.singleSelectQuery.select.queryType=="wrapperReturningList"
  ) {
    throw new Error("selectJzodSchemaBySingleSelectQueryFromDomainState can not deal with context reference: query=" + JSON.stringify(query, undefined, 2));
  } else {
    return selectEntityJzodSchemaFromDomainState(domainState, {
      queryType: "getEntityDefinition",
      contextResults: { resultType: "object", resultValue: {} },
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

    // const resultValue: JzodElement | undefined = index > -1?values[index].jzodSchema: undefined;
    const result: JzodObject | undefined = index > -1?values[index].jzodSchema: undefined;
  
    log.info("DomainSelector selectEntityJzodSchemaFromDomainState result", result);
  
    return result
  } else {
    return undefined;
  }
}

// ################################################################################################
/**
 * the fetchQuery and FetchQueryJzodSchema should depend only on the instance of Report at hand
 * then on the instance of the required entities (which can change over time, on refresh!! Problem: their number can vary!!)
 * @param domainState 
 * @param query 
 * @returns 
 */
export const selectFetchQueryJzodSchemaFromDomainState = (
  domainState: DomainState,
  query: DomainModelGetFetchParamJzodSchemaQueryParams
):  RecordOfJzodObject | undefined => {
  const localFetchParams: DomainManyQueriesWithDeploymentUuid = query.fetchParams
  // log.info("selectFetchQueryJzodSchemaFromDomainState called", domainState === prevDomainState, query === prevQuery);
  
  const fetchQueryJzodSchema = Object.fromEntries(
    Object.entries(localFetchParams?.fetchQuery?.select??{}).map((entry: [string, MiroirSelectQuery]) => [
      entry[0],
      selectJzodSchemaBySingleSelectQueryFromDomainState(domainState, {
          queryType: "getSingleSelectQueryJzodSchema",
          contextResults: { resultType: "object", resultValue: {} },
          singleSelectQuery: {
            queryType: "domainSingleSelectQueryWithDeployment",
            deploymentUuid: localFetchParams.deploymentUuid,
            applicationSection: localFetchParams.applicationSection,
            select: entry[1],
          },
      }),
    ])
  );

  if (localFetchParams.fetchQuery?.crossJoin) {
    fetchQueryJzodSchema["crossJoin"] = {
      type: "object",
      definition: Object.fromEntries(
      Object.entries(fetchQueryJzodSchema[localFetchParams.fetchQuery?.crossJoin?.a ?? ""]?.definition ?? {}).map((a) => [
        "a-" + a[0],
        a[1]
      ]
      ).concat(
        Object.entries(fetchQueryJzodSchema[localFetchParams.fetchQuery?.crossJoin?.b ?? ""]?.definition ?? {}).map((b) => [
          "b-" + b[0], b[1]
        ])
      )
    )};
  }

  log.info("selectFetchQueryJzodSchemaFromDomainState query", JSON.stringify(query, undefined, 2), "fetchQueryJzodSchema", fetchQueryJzodSchema)
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

