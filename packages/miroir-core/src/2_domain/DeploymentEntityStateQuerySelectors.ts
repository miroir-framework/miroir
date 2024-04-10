import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface";
import {
  DomainStateJzodSchemaSelectorMap,
  DomainStateJzodSchemaSelectorParams,
  DomainStateJzodSchemaSelector,
  DomainStateQuerySelectorMap,
  DomainStateQuerySelector,
  DomainStateQuerySelectorParams,
  RecordOfJzodElement,
  RecordOfJzodObject
} from "../0_interfaces/2_domain/DomainStateQuerySelectorInterface";

import { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import {
  ApplicationSection,
  DomainElement,
  DomainElementObject,
  DomainElementUuidIndex,
  DomainManyQueriesWithDeploymentUuid,
  DomainModelGetEntityDefinitionQueryParams,
  DomainModelGetFetchParamJzodSchemaQueryParams,
  DomainModelGetSingleSelectObjectListQueryQueryParams,
  DomainModelGetSingleSelectObjectQueryQueryParams,
  DomainModelGetSingleSelectQueryJzodSchemaQueryParams,
  DomainModelQueryJzodSchemaParams,
  EntityDefinition,
  EntityInstance,
  JzodElement,
  JzodObject,
  MiroirCustomQueryParams,
  MiroirSelectorQueryParams,
  MiroirSelectQuery,
  QueryObjectReference,
  SelectObjectListByManyToManyRelationQuery,
  SelectObjectListByRelationQuery,
  SelectObjectQuery
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/Logger";
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { cleanLevel } from "./constants";
import { applyTransformer } from "./Transformers";
import entityEntityDefinition from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json';
import { resolveContextReference } from "./DomainStateQuerySelectors";
import { DeploymentEntityState } from "../0_interfaces/2_domain/DeploymentStateInterface";
import { getDeploymentEntityStateIndex } from "./DeploymentEntityState";
import { DeploymentEntityStateJzodSchemaSelector, DeploymentEntityStateJzodSchemaSelectorMap, DeploymentEntityStateJzodSchemaSelectorParams, DeploymentEntityStateQuerySelector, DeploymentEntityStateQuerySelectorMap, DeploymentEntityStateQuerySelectorParams, QuerySelector, QuerySelectorMap, QuerySelectorParams } from "../0_interfaces/2_domain/DeploymentEntityStateQuerySelectorInterface";

const loggerName: string = getLoggerName(packageName, cleanLevel,"DomainSelector");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

let emptySelectorMap: DeploymentEntityStateQuerySelectorMap<MiroirSelectorQueryParams> = {}
let emptyJzodSchemaSelectorMap: DeploymentEntityStateJzodSchemaSelectorMap = {}


// const domainStateSelectorParams = (domainState: DomainState, params: any) => params;

// // ################################################################################################
// export function cleanupResultsFromQuery(r:DomainElement): any {
//   switch (r.elementType) {
//     case "string":
//     case "instanceUuid":
//     case "instanceUuidIndex":
//     case "instance": {
//       return r.elementValue
//     }
//     case "object": {
//       return Object.fromEntries(Object.entries(r.elementValue).map(e => [e[0], cleanupResultsFromQuery(e[1])]))
//     }
//     case "array": {
//       return r.elementValue.map(e => cleanupResultsFromQuery(e))
//     }
//     case "failure": {
//       return undefined
//       break;
//     }
//     default: {
//       throw new Error("could not handle Results from query: " + JSON.stringify(r,undefined,2));
//       break;
//     }
//   }
// }

// ################################################################################################
// ACCESSES deploymentEntityState
/**
 * returns an Entity Instance (Object) from and selectObjectByParameterValue
 * @param deploymentEntityState 
 * @param selectorParams 
 * @returns 
 */
export const selectEntityInstanceFromObjectQueryAndDeploymentEntityState:DeploymentEntityStateQuerySelector<
  DomainModelGetSingleSelectObjectQueryQueryParams, DomainElement
> = (
  deploymentEntityState: DeploymentEntityState,
  selectorParams: DeploymentEntityStateQuerySelectorParams<DomainModelGetSingleSelectObjectQueryQueryParams>
): DomainElement => {
  const querySelectorParams: SelectObjectQuery = selectorParams.query.singleSelectQuery.select as SelectObjectQuery;
  const deploymentUuid = selectorParams.query.singleSelectQuery.deploymentUuid;
  const applicationSection: ApplicationSection =
    selectorParams.query.singleSelectQuery.select.applicationSection ??
    ((selectorParams.query.pageParams?.elementValue?.applicationSection?.elementValue ?? "data") as ApplicationSection);

  const entityUuidReference: DomainElement = resolveContextReference(
    querySelectorParams.parentUuid,
    selectorParams.query.queryParams,
    selectorParams.query.contextResults
  );

  log.info("selectEntityInstanceFromObjectQueryAndDeploymentEntityState params", querySelectorParams, deploymentUuid, applicationSection, entityUuidReference);

  // log.info("selectEntityInstanceFromObjectQueryAndDeploymentEntityState found entityUuidReference", JSON.stringify(entityUuidReference))
  if (entityUuidReference.elementType != "string" && entityUuidReference.elementType != "instanceUuid") {
    return {
      elementType: "failure",
      elementValue: {
        queryFailure: "IncorrectParameters",
        queryReference: JSON.stringify(querySelectorParams.parentUuid),
      },
    };
  }

  const index = getDeploymentEntityStateIndex(
    deploymentUuid,
    applicationSection,
    entityUuidReference.elementValue
  )

  switch (querySelectorParams?.queryType) {
    case "selectObjectByRelation": {
      const referenceObject = resolveContextReference(
        querySelectorParams.objectReference,
        selectorParams.query.queryParams,
        selectorParams.query.contextResults
      );

      if (
        !querySelectorParams.AttributeOfObjectToCompareToReferenceUuid ||
        referenceObject.elementType != "instance"
      ) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "IncorrectParameters",
            queryParameters: JSON.stringify(selectorParams.query.pageParams),
            queryContext: JSON.stringify(selectorParams.query.contextResults),
          },
        };
      }

      if (!deploymentEntityState[index]) {
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
      
      // log.info(
      //   "selectEntityInstanceFromObjectQueryAndDeploymentEntityState selectObjectByRelation, ############# reference",
      //   querySelectorParams,
      //   "######### context entityUuid",
      //   entityUuidReference,
      //   "######### referenceObject",
      //   referenceObject,
      //   "######### queryParams",
      //   JSON.stringify(selectorParams.query.queryParams, undefined, 2),
      //   "######### contextResults",
      //   JSON.stringify(selectorParams.query.contextResults, undefined, 2)
      // );
      return {
        elementType: "instance",
        elementValue:
          deploymentEntityState[index].entities[
            (referenceObject.elementValue as any)[
              querySelectorParams.AttributeOfObjectToCompareToReferenceUuid
            ]
          ],
      };
      break;
    }
    case "selectObjectByDirectReference": {
      const instanceUuid = resolveContextReference(
        querySelectorParams.instanceUuid,
        selectorParams.query.queryParams,
        selectorParams.query.contextResults
      );
      // log.info("selectEntityInstanceFromObjectQueryAndDeploymentEntityState selectObjectByDirectReference found domainState", JSON.stringify(domainState))

      log.info("selectEntityInstanceFromObjectQueryAndDeploymentEntityState found instanceUuid", JSON.stringify(instanceUuid))

      if (instanceUuid.elementType != "string" && instanceUuid.elementType != "instanceUuid") {
        return instanceUuid /* QueryResults, elementType == "failure" */
      }
      log.info("selectEntityInstanceFromObjectQueryAndDeploymentEntityState resolved instanceUuid =", instanceUuid);
      if (!deploymentEntityState[index]) {
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
      if (!deploymentEntityState[index].entities[instanceUuid.elementValue]) {
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
      
        log.info("selectEntityInstanceFromObjectQueryAndDeploymentEntityState selectObjectByDirectReference, ############# reference",
        querySelectorParams,
        "entityUuidReference",
        entityUuidReference,
        "######### context entityUuid",
        entityUuidReference,
        "######### queryParams",
        JSON.stringify(selectorParams.query.queryParams, undefined, 2),
        "######### contextResults",
        JSON.stringify(selectorParams.query.contextResults, undefined, 2),
        "domainState",
        deploymentEntityState
      );
      return {
        elementType: "instance",
        elementValue:
          deploymentEntityState[index].entities[instanceUuid.elementValue],
      };
      break;
    }
    default: {
      throw new Error(
        "selectEntityInstanceFromObjectQueryAndDeploymentEntityState can not handle SelectObjectQuery query with queryType=" +
          selectorParams.query.singleSelectQuery.select.queryType
      );
      break;
    }
  }
};

// ################################################################################################
// ACCESSES deploymentEntityState
export const selectEntityInstanceUuidIndexFromDeploymentEntityState: DeploymentEntityStateQuerySelector<
  DomainModelGetSingleSelectObjectListQueryQueryParams, DomainElement
> = (
  deploymentEntityState: DeploymentEntityState,
  selectorParams: DeploymentEntityStateQuerySelectorParams<DomainModelGetSingleSelectObjectListQueryQueryParams>
): DomainElement => {
  const deploymentUuid = selectorParams.query.singleSelectQuery.deploymentUuid;
  const applicationSection = selectorParams.query.singleSelectQuery.select.applicationSection??"data";

  const entityUuid: DomainElement = resolveContextReference(
    selectorParams.query.singleSelectQuery.select.parentUuid,
    selectorParams.query.queryParams,
    selectorParams.query.contextResults
  );

  log.info("selectEntityInstanceUuidIndexFromDeploymentEntityState params", selectorParams, deploymentUuid, applicationSection, entityUuid);
  log.info("selectEntityInstanceUuidIndexFromDeploymentEntityState deploymentEntityState", deploymentEntityState);

  if (
    !deploymentUuid ||
    !applicationSection ||
    !entityUuid ||
    (entityUuid.elementType != "string" && entityUuid.elementType != "instanceUuid")
  ) {
    return {
      // new object
      elementType: "failure",
      elementValue: {
        queryFailure: "IncorrectParameters",
        queryParameters: JSON.stringify(selectorParams),
      },
    };
    // resolving by fetchDataReference, fetchDataReferenceAttribute
  }
  const deploymentEntityStateIndex = getDeploymentEntityStateIndex(
    deploymentUuid,
    applicationSection,
    entityUuid.elementValue
  )
  switch (entityUuid.elementType) {
    case "string":
    case "instanceUuid": {
      if (!deploymentEntityState[deploymentEntityStateIndex]) {
        log.warn("selectEntityInstanceUuidIndexFromDeploymentEntityState could not find index", deploymentEntityStateIndex, "in deploymentEntityState", deploymentEntityState )
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
    
      // return { elementType: "instanceUuidIndex", elementValue: Object.fromEntries(deploymentEntityState[index].map(e=>[e.uuid,e])) };
      log.info("selectEntityInstanceUuidIndexFromDeploymentEntityState for", deploymentEntityStateIndex, "result", deploymentEntityState[deploymentEntityStateIndex].entities )
      return { elementType: "instanceUuidIndex", elementValue: deploymentEntityState[deploymentEntityStateIndex].entities };
      break;
    }
    default: {
      throw new Error("selectEntityInstanceUuidIndexFromDeploymentEntityState could not handle reference entityUuid=" + entityUuid);
      break;
    }
  }
};




// ################################################################################################
/**
 * returns an Entity Instance List, from a ListQuery
 * @param deploymentEntityState 
 * @param selectorParams 
 * @returns 
 */
export const selectEntityInstanceListFromListQueryAndDeploymentEntityState: DeploymentEntityStateQuerySelector<
  DomainModelGetSingleSelectObjectListQueryQueryParams, DomainElement
> = (
  deploymentEntityState: DeploymentEntityState,
  selectorParams: DeploymentEntityStateQuerySelectorParams<DomainModelGetSingleSelectObjectListQueryQueryParams>
): DomainElement => {
  log.info(
    "selectEntityInstanceListFromListQueryAndDeploymentEntityState called with queryType",
    selectorParams.query.singleSelectQuery.select.queryType,
    "selectorParams",
    selectorParams
  );
  const localSelectorMap: DeploymentEntityStateQuerySelectorMap<DomainModelGetSingleSelectObjectListQueryQueryParams> =
    selectorParams?.selectorMap ?? emptySelectorMap;
  const selectedInstances: DomainElement = localSelectorMap.selectEntityInstanceUuidIndex(
    deploymentEntityState,
    selectorParams
  );

  log.info(
    "selectEntityInstanceListFromListQueryAndDeploymentEntityState found selectedInstances", selectedInstances
  );


  switch (selectorParams.query.singleSelectQuery.select.queryType) {
    case "selectObjectListByEntity": {
      return selectedInstances;
      break;
    }
    case "selectObjectListByRelation": {
      const relationQuery: SelectObjectListByRelationQuery = selectorParams.query.singleSelectQuery.select;
      const reference: DomainElement = resolveContextReference(relationQuery.objectReference, selectorParams.query.queryParams, selectorParams.query.contextResults);

      // log.info("selectEntityInstanceListFromListQueryAndDeploymentEntityState selectObjectListByRelation", JSON.stringify(selectedInstances))
      log.info("selectEntityInstanceListFromListQueryAndDeploymentEntityState selectObjectListByRelation", selectedInstances)
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
            "selectEntityInstanceListFromListQueryAndDeploymentEntityState selectObjectListByRelation can not use reference instances with type" +
              selectedInstances.elementType
          );
          break;
        }
      }
    }
    case "selectObjectListByManyToManyRelation": {
      const relationQuery: SelectObjectListByManyToManyRelationQuery = selectorParams.query.singleSelectQuery.select;

      // log.info("selectEntityInstanceListFromListQueryAndDeploymentEntityState selectObjectListByManyToManyRelation", selectedInstances)
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
            
            // log.info("selectEntityInstanceListFromListQueryAndDeploymentEntityState selectObjectListByManyToManyRelation found otherList", otherList);
            
          } else if (relationQuery.objectListReference?.referenceType == "constant") {
            throw new Error(
              "selectEntityInstanceListFromListQueryAndDeploymentEntityState selectObjectListByManyToManyRelation provided constant for objectListReference. This cannot be a constant, it must be a reference to a List of Objects."
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
                      //   "selectEntityInstanceListFromListQueryAndDeploymentEntityState selectObjectListByManyToManyRelation search otherList for attribute",
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
                        "selectEntityInstanceListFromListQueryAndDeploymentEntityState selectObjectListByManyToManyRelation can not use objectListReference, selectedInstances elementType=" +
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
              "selectEntityInstanceListFromListQueryAndDeploymentEntityState selectObjectListByManyToManyRelation could not find list for objectListReference, selectedInstances elementType=" +
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
          throw new Error("selectEntityInstanceListFromListQueryAndDeploymentEntityState selectObjectListByRelation can not use reference with elementType=" + selectedInstances.elementType);
          break;
        }
      }
    }
    default: {
      throw new Error(
        "selectEntityInstanceListFromListQueryAndDeploymentEntityState could not handle query, selectorParams=" +
          JSON.stringify(selectorParams.query.singleSelectQuery.select, undefined, 2)
      );
      break;
    }
  }
};

// ################################################################################################
// export const innerSelectElementFromQuery = <StateTypeParam, StateQuerySelectorMapParam>(
export const innerSelectElementFromQuery = (
  deploymentEntityState: DeploymentEntityState,
  // deploymentEntityState: StateTypeParam,
  newFetchedData: DomainElementObject,
  pageParams: DomainElementObject,
  queryParams: DomainElementObject,
  selectorMap:DeploymentEntityStateQuerySelectorMap<MiroirSelectorQueryParams>,
  // selectorMap:StateQuerySelectorMapParam,
  deploymentUuid: Uuid,
  query: MiroirSelectQuery
): DomainElement => {
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
            select: query.applicationSection
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
export const selectByDomainManyQueriesFromDeploymentEntityState:DeploymentEntityStateQuerySelector<
  DomainManyQueriesWithDeploymentUuid, DomainElementObject
> = (
  deploymentEntityState: DeploymentEntityState,
  selectorParams: DeploymentEntityStateQuerySelectorParams<DomainManyQueriesWithDeploymentUuid>,
): DomainElementObject => {

  log.info("########## selectByDomainManyQueriesFromDomainState begin, query", selectorParams);
  
  const context: DomainElementObject = {
    elementType: "object",
    elementValue: { ...selectorParams.query.contextResults.elementValue },
  };
  // log.info("########## DomainSelector selectByDomainManyQueriesFromDomainState will use context", context);
  const localSelectorMap: DeploymentEntityStateQuerySelectorMap<DomainManyQueriesWithDeploymentUuid> =
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

// // ################################################################################################
// export const selectByCustomQueryFromDomainStateNew = (
//   domainState: DomainState,
//   query: MiroirCustomQueryParams,
// ): DomainElement | undefined => {
//   return undefined
// }

// ################################################################################################
// ################################################################################################
// JZOD SCHEMAs selectors
// ################################################################################################
// ################################################################################################
export const selectJzodSchemaBySingleSelectQueryFromDeploymentEntityState = (
  deploymentEntityState: DeploymentEntityState,
  selectorParams: DeploymentEntityStateJzodSchemaSelectorParams<DomainModelGetSingleSelectQueryJzodSchemaQueryParams>
): JzodObject | undefined => {
  if (
    selectorParams.query.singleSelectQuery.select.queryType=="literal" ||
    selectorParams.query.singleSelectQuery.select.queryType=="queryContextReference" ||
    selectorParams.query.singleSelectQuery.select.queryType=="wrapperReturningObject" ||
    selectorParams.query.singleSelectQuery.select.queryType=="wrapperReturningList" ||
    selectorParams.query.singleSelectQuery.select.queryType=="queryCombiner" 
  ) {
    throw new Error(
      "selectJzodSchemaBySingleSelectQueryFromDomainState can not deal with context reference: query=" +
        JSON.stringify(selectorParams.query, undefined, 2)
    );
  } else {
    const entityUuidDomainElement: DomainElement = resolveContextReference(
      selectorParams.query.singleSelectQuery.select.parentUuid,
      selectorParams.query.queryParams,
      selectorParams.query.contextResults
    );
    log.info(
      "selectJzodSchemaBySingleSelectQueryFromDomainState called",
      selectorParams.query,
      "found",
      entityUuidDomainElement
    );

    if (typeof entityUuidDomainElement != "object" || entityUuidDomainElement.elementType != "instanceUuid") {
      return undefined
    }

    return selectorParams.selectorMap.selectEntityJzodSchema(deploymentEntityState, {
      selectorMap: selectorParams.selectorMap,
      query: {
        queryType: "getEntityDefinition",
        contextResults: { elementType: "object", elementValue: {} },
        pageParams: selectorParams.query.pageParams,
        queryParams: selectorParams.query.queryParams,
        deploymentUuid: selectorParams.query.singleSelectQuery.deploymentUuid ?? "",
        entityUuid: entityUuidDomainElement.elementValue,
      },
    } as DeploymentEntityStateJzodSchemaSelectorParams<DomainModelGetEntityDefinitionQueryParams>) as JzodObject | undefined;
  } 
}

// ################################################################################################
// ACCESSES deploymentEntityState
export const selectEntityJzodSchemaFromDeploymentEntityState = (
  deploymentEntityState: DeploymentEntityState,
  selectorParams: DeploymentEntityStateJzodSchemaSelectorParams<DomainModelGetEntityDefinitionQueryParams>
): JzodObject | undefined => {
  const localQuery: DomainModelGetEntityDefinitionQueryParams = selectorParams.query;

  const deploymentEntityStateIndex = getDeploymentEntityStateIndex(
    localQuery.deploymentUuid,
    "model",
    entityEntityDefinition.uuid
  )

  if (
    deploymentEntityState &&
    deploymentEntityState[deploymentEntityStateIndex] &&
    deploymentEntityState[deploymentEntityStateIndex].entities &&
    deploymentEntityState[deploymentEntityStateIndex].entities[entityEntityDefinition.uuid]
  ) {
    const result: JzodObject = (
      deploymentEntityState[deploymentEntityStateIndex].entities[entityEntityDefinition.uuid] as EntityDefinition
    ).jzodSchema;
  
    // log.info("DomainSelector selectEntityJzodSchemaFromDomainState result", result);
  
    return result
  } else {
    return undefined;
  }
}

// ################################################################################################
/**
 * the fetchQuery and FetchQueryJzodSchema should depend only on the instance of Report at hand
 * then on the instance of the required entities (which can change over time, on refresh!! Problem: their number can vary!!)
 * @param deploymentEntityState 
 * @param query 
 * @returns 
 */
export const selectFetchQueryJzodSchemaFromDeploymentEntityState = (
  deploymentEntityState: DeploymentEntityState,
  selectorParams: DeploymentEntityStateJzodSchemaSelectorParams<DomainModelGetFetchParamJzodSchemaQueryParams>
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
      } as DeploymentEntityStateJzodSchemaSelectorParams<DomainModelGetSingleSelectQueryJzodSchemaQueryParams>),
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

// ################################################################################################
export const selectJzodSchemaByDomainModelQueryFromDeploymentEntityState = (
  deploymentEntityState: DeploymentEntityState,
  selectorParams: DeploymentEntityStateJzodSchemaSelectorParams<DomainModelQueryJzodSchemaParams>
): RecordOfJzodElement | JzodElement | undefined => {
  switch (selectorParams.query.queryType) {
    case "getEntityDefinition":{ 
      return selectorParams.selectorMap.selectEntityJzodSchema(
        deploymentEntityState,
        selectorParams as DeploymentEntityStateJzodSchemaSelectorParams<DomainModelGetEntityDefinitionQueryParams>
      );
      break;
    }
    case "getFetchParamsJzodSchema": {
      return selectorParams.selectorMap.selectFetchQueryJzodSchema(
        deploymentEntityState,
        selectorParams as DeploymentEntityStateJzodSchemaSelectorParams<DomainModelGetFetchParamJzodSchemaQueryParams>
      );
      break;
    }
    case "getSingleSelectQueryJzodSchema": {
      return selectorParams.selectorMap.selectJzodSchemaBySingleSelectQueryFromDeploymentEntityState(
        deploymentEntityState,
        selectorParams as DeploymentEntityStateJzodSchemaSelectorParams<DomainModelGetSingleSelectQueryJzodSchemaQueryParams>
      );
      break;
    }
    default:
      return undefined;
      break;
  }
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// DEPENDENT ON RESELECT / REDUX. TO MOVE TO miroir-localCache-redux!
// ################################################################################################

export function getDeploymentEntityStateSelectorMap<QueryType extends MiroirSelectorQueryParams>(): QuerySelectorMap<
  QueryType,
  DeploymentEntityState
> {
  // return selectorMap;
  return {
    selectEntityInstanceUuidIndex: selectEntityInstanceUuidIndexFromDeploymentEntityState as QuerySelector<
      QueryType,
      DeploymentEntityState,
      DomainElement
    >,
    selectEntityInstanceFromObjectQuery: selectEntityInstanceFromObjectQueryAndDeploymentEntityState as QuerySelector<
      QueryType,
      DeploymentEntityState,
      DomainElement
    >,
    selectEntityInstanceListFromListQuery:
      selectEntityInstanceListFromListQueryAndDeploymentEntityState as QuerySelector<
        QueryType,
        DeploymentEntityState,
        DomainElement
      >,
    selectByDomainManyQueries: selectByDomainManyQueriesFromDeploymentEntityState as QuerySelector<
      QueryType,
      DeploymentEntityState,
      DomainElementObject
    >,
  };
}



export function getDeploymentEntityStateJzodSchemaSelectorMap(): DeploymentEntityStateJzodSchemaSelectorMap {
  // return jzodSchemaSelectorMap;
  return {
    selectJzodSchemaByDomainModelQuery: selectJzodSchemaByDomainModelQueryFromDeploymentEntityState,
    selectEntityJzodSchema:
      selectEntityJzodSchemaFromDeploymentEntityState as DeploymentEntityStateJzodSchemaSelector<DomainModelQueryJzodSchemaParams>,
    selectFetchQueryJzodSchema:
      selectFetchQueryJzodSchemaFromDeploymentEntityState as DeploymentEntityStateJzodSchemaSelector<DomainModelQueryJzodSchemaParams>,
    selectJzodSchemaBySingleSelectQuery:
      selectJzodSchemaBySingleSelectQueryFromDeploymentEntityState as DeploymentEntityStateJzodSchemaSelector<DomainModelQueryJzodSchemaParams>,
  };
}

export function getDeploymentEntityStateSelectorParams<QueryType extends MiroirSelectorQueryParams>(
  query: QueryType,
  selectorMap?: QuerySelectorMap<QueryType, DeploymentEntityState>
): QuerySelectorParams<QueryType, DeploymentEntityState> {
  return {
    query,
    selectorMap: selectorMap ?? getDeploymentEntityStateSelectorMap<QueryType>(),
  };
}
