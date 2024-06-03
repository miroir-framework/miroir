// ################################################################################################

import { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import {
  DomainModelGetSingleSelectObjectListQueryQueryParams,
  DomainElement,
  MiroirSelectorQueryParams,
  DomainElementObject,
  SelectObjectListByRelationQuery,
  EntityInstance,
  DomainElementUuidIndex,
  SelectObjectListByManyToManyRelationQuery,
  MiroirSelectQuery,
  ApplicationSection,
  DomainManyQueriesWithDeploymentUuid,
  DomainModelGetEntityDefinitionQueryParams,
  DomainModelGetSingleSelectQueryJzodSchemaQueryParams,
  JzodObject,
  DomainModelGetFetchParamJzodSchemaQueryParams,
  DomainModelQueryJzodSchemaParams,
  JzodElement,
  QueryObjectReference,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  QuerySelectorParams,
  QuerySelector,
  QuerySelectorMap,
  JzodSchemaQuerySelectorParams,
  RecordOfJzodElement,
  RecordOfJzodObject,
} from "../0_interfaces/2_domain/DeploymentEntityStateQuerySelectorInterface";
import { DeploymentEntityState } from "../0_interfaces/2_domain/DeploymentStateInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/Logger";
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { applyTransformer } from "./Transformers";
import { cleanLevel } from "./constants";

const loggerName: string = getLoggerName(packageName, cleanLevel,"QuerySelector");
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
export const resolveContextReference = (
  queryObjectReference: QueryObjectReference,
  queryParams: DomainElementObject,
  contextResults: DomainElement,
) : DomainElement => {
  // log.info("resolveContextReference for queryObjectReference=", queryObjectReference, "queryParams=", queryParams,"contextResults=", contextResults)
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
      elementValue: { queryFailure: "ReferenceNotFound", queryContext: JSON.stringify(contextResults) },
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
      elementValue: { queryFailure: "ReferenceFoundButUndefined", queryContext: JSON.stringify(contextResults) },
    };
  }

  const reference: DomainElement =
  queryObjectReference.referenceType == "queryContextReference"
    ? (contextResults.elementValue as any)[queryObjectReference.referenceName]
    : queryObjectReference.referenceType == "queryParameterReference"
    ? queryParams.elementValue[queryObjectReference.referenceName]
    : queryObjectReference.referenceType == "constant"
    ? {elementType: "instanceUuid", elementValue: queryObjectReference.referenceUuid } // new object
    : undefined /* this should not happen. Provide "error" value instead?*/;

  return reference
}





// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
/**
 * returns an Entity Instance List, from a ListQuery
 * @param deploymentEntityState 
 * @param selectorParams 
 * @returns 
 */
export const selectEntityInstanceListFromListQuery
// : QuerySelector<
//   DomainModelGetSingleSelectObjectListQueryQueryParams, DeploymentEntityState, DomainElement
// > 
= <StateType>(
  deploymentEntityState: StateType,
  selectorParams: QuerySelectorParams<DomainModelGetSingleSelectObjectListQueryQueryParams, StateType>
): DomainElement => {
  log.info(
    "selectEntityInstanceListFromListQuery called with queryType",
    selectorParams.query.singleSelectQuery.select.queryType,
    "selectorParams",
    selectorParams
  );
  const emptySelectorMap = {
    selectByDomainManyQueries: {} as QuerySelector<MiroirSelectorQueryParams, StateType, DomainElementObject>, 
    selectEntityInstanceFromObjectQuery: {} as QuerySelector<MiroirSelectorQueryParams, StateType, DomainElement>,
    selectEntityInstanceListFromListQuery: {} as QuerySelector<MiroirSelectorQueryParams, StateType, DomainElement>,
    selectEntityInstanceUuidIndex: {} as QuerySelector<MiroirSelectorQueryParams, StateType, DomainElement>,
  }

  const localSelectorMap: QuerySelectorMap<StateType> =
    selectorParams?.selectorMap ?? emptySelectorMap;
  const selectedInstances: DomainElement = localSelectorMap.selectEntityInstanceUuidIndex(
    deploymentEntityState,
    selectorParams
  );

  log.info(
    "selectEntityInstanceListFromListQuery found selectedInstances", selectedInstances
  );


  switch (selectorParams.query.singleSelectQuery.select.queryType) {
    case "selectObjectListByEntity": {
      return selectedInstances;
      break;
    }
    case "selectObjectListByRelation": {
      const relationQuery: SelectObjectListByRelationQuery = selectorParams.query.singleSelectQuery.select;
      // const reference: DomainElement = resolveContextReference(relationQuery.objectReference, selectorParams.query.queryParams, selectorParams.query.contextResults);

      // log.info("selectEntityInstanceListFromListQuery selectObjectListByRelation", JSON.stringify(selectedInstances))
      log.info("selectEntityInstanceListFromListQuery selectObjectListByRelation", selectedInstances)
      switch (selectedInstances.elementType) {
        case "instanceUuidIndex": {
          return { "elementType": "instanceUuidIndex", "elementValue": Object.fromEntries(
            Object.entries(selectedInstances.elementValue ?? {}).filter(
              (i: [string, EntityInstance]) => {
                const localIndex = relationQuery.AttributeOfListObjectToCompareToReferenceUuid ?? "dummy";
    
                let otherIndex = undefined
                if (
                  relationQuery.objectReference?.referenceType == "queryContextReference" &&
                  selectorParams?.query.contextResults?.elementType == "object" &&
                  selectorParams?.query.contextResults.elementValue &&
                  selectorParams?.query.contextResults.elementValue[relationQuery.objectReference.referenceName ?? ""]
                ) {
                  otherIndex = ((selectorParams?.query.contextResults?.elementValue[
                    relationQuery.objectReference.referenceName
                  ].elementValue as any) ?? {})[relationQuery.objectReferenceAttribute ?? "uuid"];
                } else if (relationQuery.objectReference?.referenceType == "constant") {
                  otherIndex = relationQuery.objectReference?.referenceUuid
                }
    
    
                return (i[1] as any)[localIndex] === otherIndex
              }
            )
          )} as DomainElementUuidIndex;
          break;
        }
        case "failure": {
          return selectedInstances
        }
        case "object":
        case "string":
        case "instance":
        case "instanceUuidIndexUuidIndex":
        case "array":
        default: {
          throw new Error(
            "selectEntityInstanceListFromListQuery selectObjectListByRelation can not use reference instances with type" +
              selectedInstances.elementType
          );
          break;
        }
      }
    }
    case "selectObjectListByManyToManyRelation": {
      const relationQuery: SelectObjectListByManyToManyRelationQuery = selectorParams.query.singleSelectQuery.select;

      // log.info("selectEntityInstanceListFromListQuery selectObjectListByManyToManyRelation", selectedInstances)
      switch (selectedInstances.elementType) {
        case "instanceUuidIndex": {
          let otherList: DomainElement | undefined = undefined
          if (
            relationQuery.objectListReference?.referenceType == "queryContextReference" &&
            selectorParams?.query.contextResults?.elementType == "object" &&
            selectorParams?.query.contextResults.elementValue &&
            selectorParams?.query.contextResults.elementValue[relationQuery.objectListReference.referenceName ?? ""]
          ) {
            otherList = ((selectorParams?.query.contextResults?.elementValue[
              relationQuery.objectListReference.referenceName
            ]) ?? {elementType: "void", elementValue: undefined });
            
            // log.info("selectEntityInstanceListFromListQuery selectObjectListByManyToManyRelation found otherList", otherList);
            
          } else if (relationQuery.objectListReference?.referenceType == "constant") {
            throw new Error(
              "selectEntityInstanceListFromListQuery selectObjectListByManyToManyRelation provided constant for objectListReference. This cannot be a constant, it must be a reference to a List of Objects."
            );
          }

          if (otherList != undefined) {
            return { "elementType": "instanceUuidIndex", "elementValue": Object.fromEntries(
              Object.entries(selectedInstances.elementValue ?? {}).filter(
                (selectedInstancesEntry: [string, EntityInstance]) => {
                  const localOtherList: DomainElement = otherList as DomainElement;
                  const otherListAttribute = relationQuery.objectListReferenceAttribute ?? "uuid";
                  const rootListAttribute = relationQuery.AttributeOfRootListObjectToCompareToListReferenceUuid ?? "uuid";
      
                  switch (localOtherList.elementType) {
                    case "instanceUuidIndex": {
                      // TODO: take into account!
                      // [relationQuery.objectListReferenceAttribute ?? "uuid"];
                      const result =
                        Object.values((localOtherList as DomainElementUuidIndex).elementValue).findIndex(
                          (v: any) => v[otherListAttribute] == (selectedInstancesEntry[1] as any)[rootListAttribute]
                        ) >= 0;
                      // log.info(
                      //   "selectEntityInstanceListFromListQuery selectObjectListByManyToManyRelation search otherList for attribute",
                      //   otherListAttribute,
                      //   "on object",
                      //   selectedInstancesEntry[1],
                      //   "uuidToFind",
                      //   (selectedInstancesEntry[1] as any)[otherListAttribute],
                      //   "otherList",
                      //   localOtherList,
                      //   "result",
                      //   result
                      // );

                      return result 
                      break;
                    }
                    case "object":
                    case "string":
                    case "instance":
                    case "instanceUuidIndexUuidIndex":
                    case "failure":
                    case "array":
                    default: {
                      throw new Error(
                        "selectEntityInstanceListFromListQuery selectObjectListByManyToManyRelation can not use objectListReference, selectedInstances elementType=" +
                        selectedInstances.elementType + " other list elementType" + localOtherList.elementType
                      );
                      break;
                    }
                  }
                }
              )
            )} as DomainElementUuidIndex;
          } else {
            throw new Error(
              "selectEntityInstanceListFromListQuery selectObjectListByManyToManyRelation could not find list for objectListReference, selectedInstances elementType=" +
                selectedInstances.elementType
            );
          }
          break;
        }
        case "object":
        case "string":
        case "instance":
        case "instanceUuidIndexUuidIndex":
        case "failure":
        case "array":
        default: {
          throw new Error("selectEntityInstanceListFromListQuery selectObjectListByRelation can not use reference with elementType=" + selectedInstances.elementType);
          break;
        }
      }
    }
    default: {
      throw new Error(
        "selectEntityInstanceListFromListQuery could not handle query, selectorParams=" +
          JSON.stringify(selectorParams.query.singleSelectQuery.select, undefined, 2)
      );
      break;
    }
  }
};

// ################################################################################################
export function innerSelectElementFromQuery<StateType>(
  deploymentEntityState: StateType,
  newFetchedData: DomainElementObject,
  pageParams: DomainElementObject,
  queryParams: DomainElementObject,
  selectorMap:QuerySelectorMap<StateType>,
  deploymentUuid: Uuid,
  query: MiroirSelectQuery
): DomainElement {
  switch (query.queryType) {
    case "literal": {
      return { elementType: "string", elementValue: query.definition };
      break;
    }
    case "selectObjectListByEntity":
    case "selectObjectListByRelation": 
    case "selectObjectListByManyToManyRelation": {
      return selectorMap.selectEntityInstanceListFromListQuery(deploymentEntityState, {
        selectorMap,
        query: {
          queryType: "getSingleSelectQuery",
          contextResults: newFetchedData,
          pageParams: pageParams,
          queryParams,
          singleSelectQuery: {
            queryType: "domainSingleSelectQueryWithDeployment",
            deploymentUuid: deploymentUuid,
            select: query.applicationSection
              ? query
              : {
                  ...query,
                  applicationSection: pageParams.elementValue.applicationSection.elementValue as ApplicationSection,
                },
          },
        },
      });
      break;
    }
    case "selectObjectByRelation":
    case "selectObjectByDirectReference": {
      return selectorMap.selectEntityInstanceFromObjectQuery(deploymentEntityState, {
        selectorMap,
        query: {
          queryType: "getSingleSelectQuery",
          contextResults: newFetchedData,
          pageParams,
          queryParams,
          singleSelectQuery: {
            queryType: "domainSingleSelectQueryWithDeployment",
            deploymentUuid: deploymentUuid,
            select: query.applicationSection // TODO: UGLY!!! WHERE IS THE APPLICATION SECTION PLACED?
            ? query
            : {
                ...query,
                applicationSection: pageParams?.elementValue?.applicationSection?.elementValue as ApplicationSection,
              },
          },
        }
      });
      break;
    }
    case "wrapperReturningObject": {
      return {
        elementType: "object",
        elementValue: Object.fromEntries(
          Object.entries(query.definition).map((e: [string, MiroirSelectQuery]) => [
            e[0],
            innerSelectElementFromQuery(
              deploymentEntityState,
              newFetchedData,
              pageParams ?? {},
              queryParams ?? {},
              selectorMap,
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
          innerSelectElementFromQuery(
            deploymentEntityState,
            newFetchedData,
            pageParams ?? {},
            queryParams ?? {},
            selectorMap,
            deploymentUuid,
            e
          )
        ),
      };
      break;
    }
    case "queryCombiner": {
      const rootQueryResults = innerSelectElementFromQuery(
        deploymentEntityState,
        newFetchedData,
        pageParams,
        queryParams,
        selectorMap,
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
                innerSelectElementFromQuery(
                  deploymentEntityState,
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
                  selectorMap,
                  deploymentUuid,
                  query.subQuery.query
                ),
              ];
            })
          ),
        };
        return result;
      } else {
        return { elementType: "failure", elementValue: { queryFailure: "IncorrectParameters", query: JSON.stringify(query.rootQuery) } }
      }
      break;
    }
    case "queryContextReference": {
      return newFetchedData && newFetchedData.elementType == "object" && newFetchedData.elementValue[query.queryReference]
        ? newFetchedData.elementValue[query.queryReference]
        : { elementType: "failure", elementValue: { queryFailure: "ReferenceNotFound", query: JSON.stringify(query) } };
      break;
    }
    default: {
      return { elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable", query } };
      break;
    }
  }
}

// ################################################################################################
export const selectByDomainManyQueries
 = <StateType>(
  deploymentEntityState: StateType,
  // selectorParams: QuerySelectorParams<DomainManyQueriesWithDeploymentUuid, DeploymentEntityState>,
  selectorParams: QuerySelectorParams<DomainManyQueriesWithDeploymentUuid, StateType>,
): DomainElementObject => {

  log.info("########## selectByDomainManyQueriesFromDomainState begin, query", selectorParams);
  const emptySelectorMap = {
    selectByDomainManyQueries: {} as QuerySelector<MiroirSelectorQueryParams, StateType, DomainElementObject>, 
    selectEntityInstanceFromObjectQuery: {} as QuerySelector<MiroirSelectorQueryParams, StateType, DomainElement>,
    selectEntityInstanceListFromListQuery: {} as QuerySelector<MiroirSelectorQueryParams, StateType, DomainElement>,
    selectEntityInstanceUuidIndex: {} as QuerySelector<MiroirSelectorQueryParams, StateType, DomainElement>,
  }

  const context: DomainElementObject = {
    elementType: "object",
    elementValue: { ...selectorParams.query.contextResults.elementValue },
  };
  // log.info("########## DomainSelector selectByDomainManyQueriesFromDomainState will use context", context);
  // const localSelectorMap: QuerySelectorMap<DomainManyQueriesWithDeploymentUuid, DeploymentEntityState> =
  const localSelectorMap: QuerySelectorMap<StateType> =
    selectorParams?.selectorMap ?? emptySelectorMap;

  for (const entry of Object.entries(selectorParams.query.fetchQuery.select)) {
    let result = innerSelectElementFromQuery(
      deploymentEntityState,
      context,
      selectorParams.query.pageParams,
      {
        elementType: "object",
        elementValue: {
          ...selectorParams.query.pageParams.elementValue,
          ...selectorParams.query.queryParams.elementValue,
        },
      },
      localSelectorMap as any,
      selectorParams.query.deploymentUuid,
      entry[1]
    );
    context.elementValue[entry[0]] = result;
    log.info("selectByDomainManyQueriesFromDomainState done for entry", entry[0], "query", entry[1], "result=", result);
  }

  if (selectorParams.query.fetchQuery?.crossJoin) {
    // log.info("DomainSelector selectByDomainManyQueriesFromDomainState fetchQuery?.crossJoin", selectorParams.query.fetchQuery?.crossJoin);

    // performs a cross-join
    // TODO: NOT USED, REALLY? DO WE REALLY NEED THIS?
    context.elementValue["crossJoin"] = {elementType: "instanceUuidIndex", elementValue: Object.fromEntries(
      Object.values(context.elementValue[selectorParams.query.fetchQuery?.crossJoin?.a ?? ""] ?? {}).flatMap((a) =>
        Object.values(context.elementValue[selectorParams.query.fetchQuery?.crossJoin?.b ?? ""] ?? {}).map((b) => [
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
    "selectByDomainManyQueriesFromDomainState",
    "query",
    selectorParams,
    "domainState",
    deploymentEntityState,
    "newFetchedData",
    context
  );
  return context;
};

// ################################################################################################
// ################################################################################################
// JZOD SCHEMAs selectors
// ################################################################################################
// ################################################################################################
export const selectJzodSchemaBySingleSelectQuery = <StateType>(
  deploymentEntityState: StateType,
  selectorParams: JzodSchemaQuerySelectorParams<DomainModelGetSingleSelectQueryJzodSchemaQueryParams, StateType>
): JzodObject | undefined => {
  if (
    selectorParams.query.singleSelectQuery.select.queryType=="literal" ||
    selectorParams.query.singleSelectQuery.select.queryType=="queryContextReference" ||
    selectorParams.query.singleSelectQuery.select.queryType=="wrapperReturningObject" ||
    selectorParams.query.singleSelectQuery.select.queryType=="wrapperReturningList" ||
    selectorParams.query.singleSelectQuery.select.queryType=="queryCombiner" 
  ) {
    throw new Error(
      "selectJzodSchemaBySingleSelectQuery can not deal with context reference: query=" +
        JSON.stringify(selectorParams.query, undefined, 2)
    );
  }

  const entityUuidDomainElement: DomainElement = resolveContextReference(
    selectorParams.query.singleSelectQuery.select.parentUuid,
    selectorParams.query.queryParams,
    selectorParams.query.contextResults
  );
  log.info(
    "selectJzodSchemaBySingleSelectQuery called",
    selectorParams.query,
    "found",
    entityUuidDomainElement
  );

  if (typeof entityUuidDomainElement != "object" || entityUuidDomainElement.elementType != "instanceUuid") {
    return undefined
  }

  const result = selectorParams.selectorMap.selectEntityJzodSchema(deploymentEntityState, {
    selectorMap: selectorParams.selectorMap,
    query: {
      queryType: "getEntityDefinition",
      contextResults: { elementType: "object", elementValue: {} },
      pageParams: selectorParams.query.pageParams,
      queryParams: selectorParams.query.queryParams,
      deploymentUuid: selectorParams.query.singleSelectQuery.deploymentUuid ?? "",
      entityUuid: entityUuidDomainElement.elementValue,
    },
  } as JzodSchemaQuerySelectorParams<DomainModelGetEntityDefinitionQueryParams,StateType>) as JzodObject | undefined

  return result;
}

// ################################################################################################
export const selectJzodSchemaByDomainModelQuery = <StateType>(
  deploymentEntityState: StateType,
  selectorParams: JzodSchemaQuerySelectorParams<DomainModelQueryJzodSchemaParams, StateType>
): RecordOfJzodElement | JzodElement | undefined => {
  switch (selectorParams.query.queryType) {
    case "getEntityDefinition":{ 
      return selectorParams.selectorMap.selectEntityJzodSchema(
        deploymentEntityState,
        selectorParams as JzodSchemaQuerySelectorParams<DomainModelGetEntityDefinitionQueryParams, StateType>
      );
      break;
    }
    case "getFetchParamsJzodSchema": {
      return selectorParams.selectorMap.selectFetchQueryJzodSchema(
        deploymentEntityState,
        selectorParams as JzodSchemaQuerySelectorParams<DomainModelGetFetchParamJzodSchemaQueryParams, StateType>
      );
      break;
    }
    case "getSingleSelectQueryJzodSchema": {
      return selectorParams.selectorMap.selectJzodSchemaBySingleSelectQuery(
        deploymentEntityState,
        selectorParams as JzodSchemaQuerySelectorParams<DomainModelGetSingleSelectQueryJzodSchemaQueryParams, StateType>
      );
      break;
    }
    default:
      return undefined;
      break;
  }
};

// ################################################################################################
/**
 * the fetchQuery and FetchQueryJzodSchema should depend only on the instance of Report at hand
 * then on the instance of the required entities (which can change over time, on refresh!! Problem: their number can vary!!)
 * @param deploymentEntityState 
 * @param query 
 * @returns 
 */
export const selectFetchQueryJzodSchema = <StateType>(
  deploymentEntityState: StateType,
  selectorParams: JzodSchemaQuerySelectorParams<DomainModelGetFetchParamJzodSchemaQueryParams, StateType>
):  RecordOfJzodObject | undefined => {
  const localFetchParams: DomainManyQueriesWithDeploymentUuid = selectorParams.query.fetchParams
  // log.info("selectFetchQueryJzodSchemaFromDomainState called", selectorParams.query);
  
  const fetchQueryJzodSchema = Object.fromEntries(
    Object.entries(localFetchParams?.fetchQuery?.select??{}).map((entry: [string, MiroirSelectQuery]) => [
      entry[0],
      selectorParams.selectorMap.selectJzodSchemaBySingleSelectQuery(deploymentEntityState, {
        selectorMap:selectorParams.selectorMap,
        query: {
          queryType: "getSingleSelectQueryJzodSchema",
          contextResults: { elementType: "object", elementValue: {} },
          pageParams: selectorParams.query.pageParams,
          queryParams: selectorParams.query.queryParams,
          singleSelectQuery: {
            queryType: "domainSingleSelectQueryWithDeployment",
            deploymentUuid: localFetchParams.deploymentUuid,
            select: entry[1],
          },
        },
      } as JzodSchemaQuerySelectorParams<DomainModelGetSingleSelectQueryJzodSchemaQueryParams, StateType>),
    ])
  ) as RecordOfJzodObject;

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

  // log.info("selectFetchQueryJzodSchemaFromDomainState query", JSON.stringify(selectorParams.query, undefined, 2), "fetchQueryJzodSchema", fetchQueryJzodSchema)
  return fetchQueryJzodSchema;
};
