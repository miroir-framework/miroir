import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface";
import {
  DomainManyQueriesWithDeploymentUuid,
  DomainModelGetEntityDefinitionQueryParams,
  DomainModelGetFetchParamJzodSchemaQueryParams,
  DomainModelGetSingleSelectObjectListQueryQueryParams,
  DomainModelGetSingleSelectObjectQueryQueryParams,
  DomainModelGetSingleSelectQueryJzodSchemaQueryParams,
  DomainModelQueryJzodSchemaParams,
  DomainStateSelector,
  MiroirSelectorQueryParams,
  RecordOfJzodElement,
  RecordOfJzodObject
} from "../0_interfaces/2_domain/DomainSelectorInterface";

import { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import {
  DomainElement,
  DomainElementObject,
  EntityDefinition,
  EntityInstance,
  JzodElement,
  JzodObject,
  MiroirCustomQueryParams,
  MiroirSelectQuery,
  QueryObjectReference,
  SelectObjectListByRelationQuery,
  SelectObjectQuery
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/Logger";
import entityEntityDefinition from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json';
import { packageName } from "../constants";
import { circularReplacer, getLoggerName } from "../tools";
import { cleanLevel } from "./constants";
import { applyTransformer } from "./Transformers";

const loggerName: string = getLoggerName(packageName, cleanLevel,"DomainSelector");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

// ################################################################################################
export function cleanupResultsFromQuery(r:DomainElement): any {
  switch (r.elementType) {
    case "string":
    case "instanceUuid":
    case "instanceUuidIndex":
    case "instance": {
      return r.elementValue
    }
    case "object": {
      return Object.fromEntries(Object.entries(r.elementValue).map(e => [e[0], cleanupResultsFromQuery(e[1])]))
    }
    case "array": {
      return r.elementValue.map(e => cleanupResultsFromQuery(e))
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
const resolveContextReference = (
  // querySelectorParams: SelectObjectByDirectReferenceQuery,
  queryObjectReference: QueryObjectReference,
  queryParams: DomainElementObject,
  contextResults: DomainElement,
) : DomainElement => {
  // log.info("resolveContextReference for", queryObjectReference)
  if (
    (queryObjectReference.referenceType == "queryContextReference" &&
      (!contextResults.elementValue ||
        !(contextResults.elementValue as any)[queryObjectReference.referenceName])) ||
    (queryObjectReference.referenceType == "queryParameterReference" &&
      (!Object.keys(queryParams.elementValue).includes(queryObjectReference.referenceName)))

  ) {
    // checking that given reference does exist
    return {
      elementType: "failure",
      elementValue: { queryFailure: "ReferenceNotFound", queryContext: contextResults },
    };
  }

  if (
    (
      queryObjectReference.referenceType == "queryContextReference" &&
        !(contextResults.elementValue as any)[queryObjectReference.referenceName].elementValue
    ) ||
    (
      (queryObjectReference.referenceType == "queryParameterReference" &&
      (!queryParams.elementValue[queryObjectReference.referenceName]))
    )
  ) { // checking that given reference does exist
    return {
      elementType: "failure",
      elementValue: { queryFailure: "ReferenceFoundButUndefined", queryContext: contextResults },
    };
  }

  const reference: DomainElement =
  queryObjectReference.referenceType == "queryContextReference"
    ? (contextResults.elementValue as any)[queryObjectReference.referenceName]
    : queryObjectReference.referenceType == "queryParameterReference"
    ? queryParams.elementValue[queryObjectReference.referenceName]
    : queryObjectReference.referenceType == "constant"
    ? {elementType: "instanceUuid", elementValue: queryObjectReference.referenceUuid }
    : undefined /* this should not happen. Provide "error" value instead?*/;

  // if (
  //   !(query.contextResults.elementValue as any)[querySelectorParams.objectReference.referenceName].elementValue[
  //     querySelectorParams.AttributeOfObjectToCompareToReferenceUuid
  //   ]
  // ) { // given reference does exist but does not have the wanted attribute querySelectorParams.AttributeOfObjectToCompareToReferenceUuid
  //   return {
  //     elementType: "failure",
  //     elementValue: { queryFailure: "ReferenceFoundButAttributeUndefinedOnFoundObject", query, queryContext: query.contextResults },
  //   };
  // }  
  // return {elementType: "instanceUuid", elementValue: reference}
  return reference
}


// ################################################################################################
export const selectEntityInstanceUuidIndexFromDomainState: DomainStateSelector<
  DomainModelGetSingleSelectObjectListQueryQueryParams, DomainElement
> = (
  domainState: DomainState,
  selectorParams: DomainModelGetSingleSelectObjectListQueryQueryParams
): DomainElement => {
  const deploymentUuid = selectorParams.singleSelectQuery.deploymentUuid;
  const applicationSection = selectorParams.singleSelectQuery.select.applicationSection??"data";
  // const entityUuid = selectorParams.select.parentUuid;

  const entityUuid: DomainElement = resolveContextReference(selectorParams.singleSelectQuery.select.parentUuid, selectorParams.queryParams, selectorParams.contextResults);


  // if (entityUuid && typeof entityUuid == "object" && entityUuid.elementType == "failure") {
  //   return entityUuid //DomainElement, elementType == "failure"
  // }
  if (!deploymentUuid || !applicationSection || !entityUuid) {
    return {
      elementType: "failure",
      elementValue: {
        queryFailure: "IncorrectParameters",
        queryParameters: selectorParams,
      },
    };
    // resolving by fetchDataReference, fetchDataReferenceAttribute
  }
  if (!domainState) {
    return { elementType: "failure", elementValue: { queryFailure: "DomainStateNotLoaded" } };
  }
  if (!domainState[deploymentUuid]) {
    return { elementType: "failure", elementValue: { queryFailure: "DeploymentNotFound", deploymentUuid } };
  }
  if (!domainState[deploymentUuid][applicationSection]) {
    return {
      elementType: "failure",
      elementValue: { queryFailure: "ApplicationSectionNotFound", deploymentUuid, applicationSection },
    };
  }
  switch (entityUuid.elementType) {
    case "string":
    case "instanceUuid": {
      if (!domainState[deploymentUuid][applicationSection][entityUuid.elementValue]) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "EntityNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuid.elementValue,
          },
        };
      }
    
      return { elementType: "instanceUuidIndex", elementValue: domainState[deploymentUuid][applicationSection][entityUuid.elementValue] };
      break;
    }
    case "object":
    case "instance":
    case "instanceUuidIndex":
    case "instanceUuidIndexUuidIndex":
    case "array": {
      return { elementType: "failure", elementValue: { queryFailure: "IncorrectParameters", queryReference: selectorParams.singleSelectQuery.select.parentUuid } }
    }
    case "failure": {
      return entityUuid;
      break;
    }
    default: {
      throw new Error("selectEntityInstanceUuidIndexFromDomainState could not handle reference entityUuid=" + entityUuid);
      break;
    }
  }
};

// ################################################################################################
/**
 * returns an Entity Instance List, from a ListQuery
 * @param domainState 
 * @param selectorParams 
 * @returns 
 */
export const selectEntityInstanceListFromListQueryAndDomainState: DomainStateSelector<
  DomainModelGetSingleSelectObjectListQueryQueryParams, DomainElement
> = (
  domainState: DomainState,
  selectorParams: DomainModelGetSingleSelectObjectListQueryQueryParams
): DomainElement => {
  const selectedInstances = selectEntityInstanceUuidIndexFromDomainState(domainState, selectorParams);

  switch (selectorParams.singleSelectQuery.select.queryType) {
    case "selectObjectListByEntity": {
      return selectedInstances;
      break;
    }
    case "selectObjectListByRelation": {
      // if (selectorParams.singleSelectQuery.select.objectReference) {
      const relationQuery: SelectObjectListByRelationQuery = selectorParams.singleSelectQuery.select;
      const reference = resolveContextReference(relationQuery.objectReference, selectorParams.queryParams, selectorParams.contextResults);

      log.info("selectEntityInstancesFromListQueryAndDomainState selectObjectListByRelation", JSON.stringify(selectedInstances))
      switch (selectedInstances.elementType) {
        case "instanceUuidIndex": {
          return { "elementType": "instanceUuidIndex", "elementValue": Object.fromEntries(
            Object.entries(selectedInstances.elementValue ?? {}).filter(
              (i: [string, EntityInstance]) => {
                const localIndex = relationQuery.AttributeOfListObjectToCompareToReferenceUuid ?? "dummy";
    
                let otherIndex = undefined
                if (
                  relationQuery.objectReference?.referenceType == "queryContextReference" &&
                  selectorParams?.contextResults?.elementType == "object" &&
                  selectorParams?.contextResults.elementValue &&
                  selectorParams?.contextResults.elementValue[relationQuery.objectReference.referenceName ?? ""]
                ) {
                  otherIndex = ((selectorParams?.contextResults?.elementValue[
                    relationQuery.objectReference.referenceName
                  ].elementValue as any) ?? {})[relationQuery.objectReferenceAttribute ?? "uuid"];
                } else if (relationQuery.objectReference?.referenceType == "constant") {
                  otherIndex = relationQuery.objectReference?.referenceUuid
                }
    
    
                return (i[1] as any)[localIndex] === otherIndex
              }
            )
          )};
          break;
        }
        case "object":
        case "string":
        case "instance":
        case "instanceUuidIndexUuidIndex":
        case "failure":
        case "array":
        default: {
          throw new Error("selectEntityInstanceListFromListQueryAndDomainState selectObjectListByRelation can not use reference");
          break;
        }
      }
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
  DomainModelGetSingleSelectObjectQueryQueryParams, DomainElement
> = (
  domainState: DomainState,
  query: DomainModelGetSingleSelectObjectQueryQueryParams
): DomainElement => {
  const querySelectorParams: SelectObjectQuery = query.singleSelectQuery.select as SelectObjectQuery;
  const deploymentUuid = query.singleSelectQuery.deploymentUuid;
  const applicationSection = query.singleSelectQuery.select.applicationSection??"data";

  const entityUuidReference:DomainElement = resolveContextReference(querySelectorParams.parentUuid, query.queryParams, query.contextResults);

  log.info("selectEntityInstanceFromObjectQueryAndDomainState found entityUuidReference", JSON.stringify(entityUuidReference))
  if (entityUuidReference.elementType != "string" && entityUuidReference.elementType != "instanceUuid") {
    return { elementType: "failure", elementValue: { queryFailure: "IncorrectParameters", queryReference: querySelectorParams.parentUuid } }
  }

  switch (querySelectorParams?.queryType) {
    case "selectObjectByRelation": {
      const referenceObject = resolveContextReference(querySelectorParams.objectReference, query.queryParams, query.contextResults);

      if (
        !querySelectorParams.AttributeOfObjectToCompareToReferenceUuid ||
        referenceObject.elementType != "instance"
        // (referenceObjectUuid.elementType != "string" && referenceObjectUuid.elementType != "instanceUuid")
      ) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "IncorrectParameters",
            queryParameters: query.pageParams,
            queryContext: query.contextResults,
          },
        };
        // resolving by fetchDataReference, fetchDataReferenceAttribute
      }

      if (!domainState) {
        return { elementType: "failure", elementValue: { queryFailure: "DomainStateNotLoaded" } };
      }
      if (!domainState[deploymentUuid]) {
        return { elementType: "failure", elementValue: { queryFailure: "DeploymentNotFound", deploymentUuid } };
      }
      if (!domainState[deploymentUuid][applicationSection]) {
        return {
          elementType: "failure",
          elementValue: { queryFailure: "ApplicationSectionNotFound", deploymentUuid, applicationSection },
        };
      }
      if (!domainState[deploymentUuid][applicationSection][entityUuidReference.elementValue]) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "EntityNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuidReference.elementValue,
          },
        };
      }
      
      log.info(
        "selectEntityInstanceFromObjectQueryAndDomainState selectObjectByRelation, ############# reference",
        querySelectorParams,
        "######### context entityUuid",
        entityUuidReference,
        "######### referenceObject",
        referenceObject,
        "######### queryParams",
        JSON.stringify(query.queryParams, undefined, 2),
        "######### contextResults",
        JSON.stringify(query.contextResults, undefined, 2)
      );
      return {
        elementType: "instance",
        elementValue:
          domainState[deploymentUuid][applicationSection][entityUuidReference.elementValue][
            (referenceObject.elementValue as any)[
              querySelectorParams.AttributeOfObjectToCompareToReferenceUuid
            ]
          ],
      };
      break;
    }
    case "selectObjectByDirectReference": {
      const instanceUuid = resolveContextReference(querySelectorParams.instanceUuid, query.queryParams, query.contextResults);
      log.info("selectEntityInstanceFromObjectQueryAndDomainState found instanceUuid", JSON.stringify(instanceUuid))

      if (instanceUuid.elementType != "string" && instanceUuid.elementType != "instanceUuid") {
        return instanceUuid /* QueryResults, elementType == "failure" */
      }
      log.info("selectEntityInstanceFromObjectQueryAndDomainState resolved instanceUuid =", instanceUuid);
      if (!domainState) {
        return { elementType: "failure", elementValue: { queryFailure: "DomainStateNotLoaded" } };
      }
      if (!domainState[deploymentUuid]) {
        return { elementType: "failure", elementValue: { queryFailure: "DeploymentNotFound", deploymentUuid } };
      }
      if (!domainState[deploymentUuid][applicationSection]) {
        return {
          elementType: "failure",
          elementValue: { queryFailure: "ApplicationSectionNotFound", deploymentUuid, applicationSection },
        };
      }
      if (!domainState[deploymentUuid][applicationSection][entityUuidReference.elementValue]) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "EntityNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuidReference.elementValue,
          },
        };
      }
      if (!domainState[deploymentUuid][applicationSection][entityUuidReference.elementValue][instanceUuid.elementValue]) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "InstanceNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuidReference.elementValue,
            instanceUuid: instanceUuid.elementValue,
          },
        };
      }
      return {
        elementType: "instance",
        elementValue:
          domainState[deploymentUuid][applicationSection][entityUuidReference.elementValue][instanceUuid.elementValue],
      };
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
  newFetchedData: DomainElementObject,
  pageParams: DomainElementObject,
  queryParams: DomainElementObject,
  // pageParams: Record<string, any>,
  // queryParams: Record<string, any>,
  deploymentUuid: Uuid,
  query: MiroirSelectQuery
): DomainElement => {
  switch (query.queryType) {
    case "literal": {
      return { elementType: "string", elementValue: query.definition };
      break;
    }
    case "selectObjectListByEntity":
    case "selectObjectListByRelation": {
      return selectEntityInstanceListFromListQueryAndDomainState(domainState, {
        queryType: "getSingleSelectQuery",
        contextResults: newFetchedData,
        pageParams: pageParams,
        queryParams,
        singleSelectQuery: {
          queryType: "domainSingleSelectQueryWithDeployment",
          deploymentUuid: deploymentUuid,
          select: query,
        },
      });
      break;
    }
    // case "selectObjectByUuid":
    case "selectObjectByRelation":
    // case "selectObjectByParameterValue":
    case "selectObjectByDirectReference": {
      return selectEntityInstanceFromObjectQueryAndDomainState(domainState, {
        queryType: "getSingleSelectQuery",
        contextResults: newFetchedData,
        pageParams,
        queryParams,
        singleSelectQuery: {
          queryType: "domainSingleSelectQueryWithDeployment",
          deploymentUuid: deploymentUuid,
          select: query,
        },
      });
      break;
    }
    case "wrapperReturningObject": {
      return {
        elementType: "object",
        elementValue: Object.fromEntries(
          Object.entries(query.definition).map((e: [string, MiroirSelectQuery]) => [
            e[0],
            innerSelectElementFromQueryAndDomainState(
              domainState,
              newFetchedData,
              pageParams ?? {},
              queryParams ?? {},
              deploymentUuid,
              e[1]
            ),
          ])
        ),
      };
      break;
    }
    case "wrapperReturningList": {
      return {
        elementType: "array",
        elementValue: query.definition.map((e) =>
          innerSelectElementFromQueryAndDomainState(
            domainState,
            newFetchedData,
            pageParams ?? {},
            queryParams ?? {},
            deploymentUuid,
            e
          )
        ),
      };
      break;
    }
    case "queryCombiner": {
      const rootQueryResults = innerSelectElementFromQueryAndDomainState(
        domainState,
        newFetchedData,
        pageParams,
        queryParams,
        deploymentUuid,
        query.rootQuery
      );
      if (rootQueryResults.elementType == "instanceUuidIndex") {
        const result: DomainElementObject = {
          elementType: "object",
          elementValue: Object.fromEntries(
            Object.entries(rootQueryResults.elementValue).map((entry) => {
              return [
                entry[1].uuid,
                innerSelectElementFromQueryAndDomainState(
                  domainState,
                  newFetchedData,
                  pageParams,
                  {
                    elementType: "object",
                    elementValue: {
                      ...queryParams.elementValue,
                      ...Object.fromEntries(
                        Object.entries(applyTransformer(query.subQuery.parameter, entry[1])).map((e: [string, any]) => [
                          e[0],
                          { elementType: "instanceUuid", elementValue: e[1] },
                        ])
                      ),
                    },
                  },
                  deploymentUuid,
                  query.subQuery.query
                ),
              ];
            })
          ),
        };
        return result;
      } else {
        return { elementType: "failure", elementValue: { queryFailure: "IncorrectParameters", query: query.rootQuery } }
      }
      break;
    }
    case "queryContextReference": {
      return newFetchedData && newFetchedData.elementType == "object" && newFetchedData.elementValue[query.queryReference]
        ? newFetchedData.elementValue[query.queryReference]
        : { elementType: "failure", elementValue: { queryFailure: "ReferenceNotFound", query } };
      break;
    }
    default: {
      return { elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable", query } };
      break;
    }
  }
}
// ################################################################################################
export const selectByDomainManyQueriesFromDomainState:DomainStateSelector<
  DomainManyQueriesWithDeploymentUuid, DomainElementObject
> = (
  domainState: DomainState,
  query: DomainManyQueriesWithDeploymentUuid,
): DomainElementObject => {

  // log.info("########## DomainSelector selectByDomainManyQueriesFromDomainState begin, query", JSON.stringify(query, circularReplacer, 2));
  log.info("########## DomainSelector selectByDomainManyQueriesFromDomainState begin, query", JSON.stringify(query, undefined, 2));
  
  const newFetchedData:DomainElementObject = {elementType: "object", elementValue: {...query.contextResults.elementValue}};
  log.info("########## DomainSelector selectByDomainManyQueriesFromDomainState begin, newFetchedData", JSON.stringify(newFetchedData,circularReplacer(), 2));
  
  for (const entry of Object.entries(query.fetchQuery?.select??{})) {
    let result = innerSelectElementFromQueryAndDomainState(
      domainState,
      newFetchedData,
      query.pageParams,
      {elementType: "object", elementValue: { ...query.pageParams.elementValue, ...query.queryParams.elementValue} },
      query.deploymentUuid,
      entry[1]

    );
    newFetchedData.elementValue[entry[0]] = result;
    log.info("DomainSelector selectByDomainManyQueriesFromDomainState done for entry", entry[0], "query", entry[1], "result=", JSON.stringify(result,circularReplacer(), 2));
  }

  if (query.fetchQuery?.crossJoin) {
    log.info("DomainSelector selectByDomainManyQueriesFromDomainState fetchQuery?.crossJoin", query.fetchQuery?.crossJoin);

    // performs a cross-join
    newFetchedData.elementValue["crossJoin"] = {elementType: "instanceUuidIndex", elementValue: Object.fromEntries(
      Object.values(newFetchedData.elementValue[query.fetchQuery?.crossJoin?.a ?? ""] ?? {}).flatMap((a) =>
        Object.values(newFetchedData.elementValue[query.fetchQuery?.crossJoin?.b ?? ""] ?? {}).map((b) => [
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
): DomainElement | undefined => {
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
    query.singleSelectQuery.select.queryType=="wrapperReturningList" ||
    query.singleSelectQuery.select.queryType=="queryCombiner" 
  ) {
    throw new Error("selectJzodSchemaBySingleSelectQueryFromDomainState can not deal with context reference: query=" + JSON.stringify(query, undefined, 2));
  } else {
    const entityUuid = resolveContextReference(query.singleSelectQuery.select.parentUuid, query.queryParams, query.contextResults);
    if (typeof entityUuid != "string") {
      return undefined
    }

    return selectEntityJzodSchemaFromDomainState(domainState, {
      queryType: "getEntityDefinition",
      contextResults: { elementType: "object", elementValue: {} },
      pageParams: query.pageParams,
      queryParams: query.queryParams,
      deploymentUuid: query.singleSelectQuery.deploymentUuid??"",
      entityUuid:  entityUuid,
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

    // const elementValue: JzodElement | undefined = index > -1?values[index].jzodSchema: undefined;
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
          contextResults: { elementType: "object", elementValue: {} },
          pageParams: query.pageParams,
          queryParams: query.queryParams,
          singleSelectQuery: {
            queryType: "domainSingleSelectQueryWithDeployment",
            deploymentUuid: localFetchParams.deploymentUuid,
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

