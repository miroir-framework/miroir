import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface";
import {
  DomainStateJzodSchemaSelectorMap,
  DomainStateJzodSchemaSelectorParams,
  DomainStateSelector,
  DomainStateSelectorMap,
  DomainStateSelectorNew,
  DomainStateSelectorParams,
  RecordOfJzodElement,
  RecordOfJzodObject
} from "../0_interfaces/2_domain/DomainSelectorInterface";

import { createSelector } from "reselect";
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
import entityEntityDefinition from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json';
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { cleanLevel } from "./constants";
import { applyTransformer } from "./Transformers";
import { jzodObject } from "@miroir-framework/jzod-ts";

const loggerName: string = getLoggerName(packageName, cleanLevel,"DomainSelectorNew");
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
export const selectEntityInstanceUuidIndexFromDomainState: DomainStateSelectorNew<
  DomainModelGetSingleSelectObjectListQueryQueryParams, DomainElement
> = (
  domainState: DomainState,
  selectorParams: DomainStateSelectorParams<DomainModelGetSingleSelectObjectListQueryQueryParams>
): DomainElement => {
  const deploymentUuid = selectorParams.query.singleSelectQuery.deploymentUuid;
  const applicationSection = selectorParams.query.singleSelectQuery.select.applicationSection??"data";

  const entityUuid: DomainElement = resolveContextReference(
    selectorParams.query.singleSelectQuery.select.parentUuid,
    selectorParams.query.queryParams,
    selectorParams.query.contextResults
  );

  // log.info("selectEntityInstanceUuidIndexFromDomainState params", selectorParams, deploymentUuid, applicationSection, entityUuid);
  // log.info("selectEntityInstanceUuidIndexFromDomainState domainState", domainState);

  if (!deploymentUuid || !applicationSection || !entityUuid) {
    return { // new object
      elementType: "failure",
      elementValue: {
        queryFailure: "IncorrectParameters",
        queryParameters: JSON.stringify(selectorParams),
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
      return { elementType: "failure", elementValue: { queryFailure: "IncorrectParameters", queryReference: JSON.stringify(selectorParams.query.singleSelectQuery.select.parentUuid)} }
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
 * returns an Entity Instance (Object) from and selectObjectByParameterValue
 * @param domainState 
 * @param selectorParams 
 * @returns 
 */
export const selectEntityInstanceFromObjectQueryAndDomainState:DomainStateSelectorNew<
  DomainModelGetSingleSelectObjectQueryQueryParams, DomainElement
> = (
  domainState: DomainState,
  selectorParams: DomainStateSelectorParams<DomainModelGetSingleSelectObjectQueryQueryParams>
): DomainElement => {
  const querySelectorParams: SelectObjectQuery = selectorParams.query.singleSelectQuery.select as SelectObjectQuery;
  const deploymentUuid = selectorParams.query.singleSelectQuery.deploymentUuid;
  const applicationSection = selectorParams.query.singleSelectQuery.select.applicationSection??"data";

  const entityUuidReference:DomainElement = resolveContextReference(querySelectorParams.parentUuid, selectorParams.query.queryParams, selectorParams.query.contextResults);

  // log.info("selectEntityInstanceFromObjectQueryAndDomainState params", querySelectorParams, deploymentUuid, applicationSection, entityUuidReference);

  // log.info("selectEntityInstanceFromObjectQueryAndDomainState found entityUuidReference", JSON.stringify(entityUuidReference))
  if (entityUuidReference.elementType != "string" && entityUuidReference.elementType != "instanceUuid") {
    return { elementType: "failure", elementValue: { queryFailure: "IncorrectParameters", queryReference: JSON.stringify(querySelectorParams.parentUuid) } }
  }

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
      
      // log.info(
      //   "selectEntityInstanceFromObjectQueryAndDomainState selectObjectByRelation, ############# reference",
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
          domainState[deploymentUuid][applicationSection][entityUuidReference.elementValue][
            (referenceObject.elementValue as any)[
              querySelectorParams.AttributeOfObjectToCompareToReferenceUuid
            ]
          ],
      };
      break;
    }
    case "selectObjectByDirectReference": {
      const instanceUuid = resolveContextReference(querySelectorParams.instanceUuid, selectorParams.query.queryParams, selectorParams.query.contextResults);
      // log.info("selectEntityInstanceFromObjectQueryAndDomainState found instanceUuid", JSON.stringify(instanceUuid))

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
          selectorParams.query.singleSelectQuery.select.queryType
      );
      break;
    }
  }
};

// ################################################################################################
// ################################################################################################
const domainStateSelector = (domainState: DomainState, params: any) => domainState;
const domainStateSelectorParams = (domainState: DomainState, params: any) => params;


let selectorMap: DomainStateSelectorMap<MiroirSelectorQueryParams> = {}
let jzodSchemaSelectorMap: DomainStateJzodSchemaSelectorMap = {}

export function getSelectorMap(): DomainStateSelectorMap<MiroirSelectorQueryParams> {
  // return selectorMap;
  return {
    selectEntityInstanceUuidIndexFromDomainState: createSelector(
      [domainStateSelector, domainStateSelectorParams],
      selectEntityInstanceUuidIndexFromDomainState
    ),
    selectEntityInstanceFromObjectQueryAndDomainState: createSelector(
      [domainStateSelector, domainStateSelectorParams],
      selectEntityInstanceFromObjectQueryAndDomainState
    ),
    selectEntityInstanceListFromListQueryAndDomainState: createSelector(
      [domainStateSelector, domainStateSelectorParams],
      selectEntityInstanceListFromListQueryAndDomainState
    ),
    selectByDomainManyQueriesFromDomainState: createSelector(
      [domainStateSelector, domainStateSelectorParams],
      selectByDomainManyQueriesFromDomainState
    ),
  };
}

export function getJzodSchemaSelectorMap(): DomainStateJzodSchemaSelectorMap {
  // return jzodSchemaSelectorMap;
  return {
    selectJzodSchemaByDomainModelQueryFromDomainStateNew: createSelector(
      [domainStateSelector, domainStateSelectorParams],
      selectJzodSchemaByDomainModelQueryFromDomainStateNew
    ),
    selectEntityJzodSchemaFromDomainStateNew: createSelector(
      [domainStateSelector, domainStateSelectorParams],
      selectEntityJzodSchemaFromDomainStateNew
    ),
    selectFetchQueryJzodSchemaFromDomainStateNew: createSelector(
      [domainStateSelector, domainStateSelectorParams],
      selectFetchQueryJzodSchemaFromDomainStateNew
    ),
    selectJzodSchemaBySingleSelectQueryFromDomainStateNew: createSelector(
      [domainStateSelector, domainStateSelectorParams],
      selectJzodSchemaBySingleSelectQueryFromDomainStateNew
    ),
  };
}

export function getSelectorParams<Q extends MiroirSelectorQueryParams>(
  query: Q,
  selectorMap?: DomainStateSelectorMap<MiroirSelectorQueryParams>
): DomainStateSelectorParams<Q> {
  return {
    query,
    selectorMap: selectorMap ?? getSelectorMap(),
  };
}


// ################################################################################################
/**
 * returns an Entity Instance List, from a ListQuery
 * @param domainState 
 * @param selectorParams 
 * @returns 
 */
export const selectEntityInstanceListFromListQueryAndDomainState: DomainStateSelectorNew<
  DomainModelGetSingleSelectObjectListQueryQueryParams, DomainElement
> = (
  domainState: DomainState,
  selectorParams: DomainStateSelectorParams<DomainModelGetSingleSelectObjectListQueryQueryParams>
): DomainElement => {
  // log.info(
  //   "selectEntityInstanceListFromListQueryAndDomainState called with queryType",
  //   selectorParams.query.singleSelectQuery.select.queryType,
  //   "selectorParams",
  //   selectorParams
  // );
  const localSelectorMap:DomainStateSelectorMap<DomainModelGetSingleSelectObjectListQueryQueryParams> = selectorParams?.selectorMap??selectorMap;
  const selectedInstances: DomainElement = localSelectorMap.selectEntityInstanceUuidIndexFromDomainState(domainState, selectorParams);

  switch (selectorParams.query.singleSelectQuery.select.queryType) {
    case "selectObjectListByEntity": {
      return selectedInstances;
      break;
    }
    case "selectObjectListByRelation": {
      const relationQuery: SelectObjectListByRelationQuery = selectorParams.query.singleSelectQuery.select;
      const reference: DomainElement = resolveContextReference(relationQuery.objectReference, selectorParams.query.queryParams, selectorParams.query.contextResults);

      // log.info("selectEntityInstanceListFromListQueryAndDomainState selectObjectListByRelation", JSON.stringify(selectedInstances))
      log.info("selectEntityInstanceListFromListQueryAndDomainState selectObjectListByRelation", selectedInstances)
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
            "selectEntityInstanceListFromListQueryAndDomainState selectObjectListByRelation can not use reference instances with type" +
              selectedInstances.elementType
          );
          break;
        }
      }
    }
    case "selectObjectListByManyToManyRelation": {
      const relationQuery: SelectObjectListByManyToManyRelationQuery = selectorParams.query.singleSelectQuery.select;

      // log.info("selectEntityInstanceListFromListQueryAndDomainState selectObjectListByManyToManyRelation", selectedInstances)
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
            
            // log.info("selectEntityInstanceListFromListQueryAndDomainState selectObjectListByManyToManyRelation found otherList", otherList);
            
          } else if (relationQuery.objectListReference?.referenceType == "constant") {
            throw new Error(
              "selectEntityInstanceListFromListQueryAndDomainState selectObjectListByManyToManyRelation provided constant for objectListReference. This cannot be a constant, it must be a reference to a List of Objects."
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
                      //   "selectEntityInstanceListFromListQueryAndDomainState selectObjectListByManyToManyRelation search otherList for attribute",
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
                        "selectEntityInstanceListFromListQueryAndDomainState selectObjectListByManyToManyRelation can not use objectListReference, selectedInstances elementType=" +
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
              "selectEntityInstanceListFromListQueryAndDomainState selectObjectListByManyToManyRelation could not find list for objectListReference, selectedInstances elementType=" +
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
          throw new Error("selectEntityInstanceListFromListQueryAndDomainState selectObjectListByRelation can not use reference with elementType=" + selectedInstances.elementType);
          break;
        }
      }
    }
    default: {
      throw new Error(
        "selectEntityInstanceListFromListQueryAndDomainState could not handle query, selectorParams=" +
          JSON.stringify(selectorParams.query.singleSelectQuery.select, undefined, 2)
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
  selectorMap:DomainStateSelectorMap<MiroirSelectorQueryParams>,
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
      return selectorMap.selectEntityInstanceListFromListQueryAndDomainState(domainState, {
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
      return selectorMap.selectEntityInstanceFromObjectQueryAndDomainState(domainState, {
        selectorMap,
        query: {
          queryType: "getSingleSelectQuery",
          contextResults: newFetchedData,
          pageParams,
          queryParams,
          singleSelectQuery: {
            queryType: "domainSingleSelectQueryWithDeployment",
            deploymentUuid: deploymentUuid,
            select: query,
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
            innerSelectElementFromQueryAndDomainState(
              domainState,
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
          innerSelectElementFromQueryAndDomainState(
            domainState,
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
      const rootQueryResults = innerSelectElementFromQueryAndDomainState(
        domainState,
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
export const selectByDomainManyQueriesFromDomainState:DomainStateSelectorNew<
  DomainManyQueriesWithDeploymentUuid, DomainElementObject
> = (
  domainState: DomainState,
  selectorParams: DomainStateSelectorParams<DomainManyQueriesWithDeploymentUuid>,
): DomainElementObject => {

  // log.info("########## DomainSelector selectByDomainManyQueriesFromDomainState begin, query", selectorParams);
  
  const context:DomainElementObject = {elementType: "object", elementValue: {...selectorParams.query.contextResults.elementValue}};
  // log.info("########## DomainSelector selectByDomainManyQueriesFromDomainState will use context", context);
  const localSelectorMap:DomainStateSelectorMap<DomainManyQueriesWithDeploymentUuid> = selectorParams?.selectorMap??selectorMap;

  for (const entry of Object.entries(selectorParams.query.fetchQuery?.select??{})) {
    let result = innerSelectElementFromQueryAndDomainState(
      domainState,
      context,
      selectorParams.query.pageParams,
      {elementType: "object", elementValue: { ...selectorParams.query.pageParams.elementValue, ...selectorParams.query.queryParams.elementValue} },
      localSelectorMap as any,
      selectorParams.query.deploymentUuid,
      entry[1]

    );
    context.elementValue[entry[0]] = result;
    // log.info("DomainSelector selectByDomainManyQueriesFromDomainState done for entry", entry[0], "query", entry[1], "result=", result);
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
    "DomainSelector selectByDomainManyQueriesFromDomainState",
    "query",
    selectorParams,
    "domainState",
    domainState,
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
export const selectJzodSchemaBySingleSelectQueryFromDomainStateNew = (
  domainState: DomainState,
  selectorParams: DomainStateJzodSchemaSelectorParams<DomainModelGetSingleSelectQueryJzodSchemaQueryParams>
): JzodObject | undefined => {
  if (
    selectorParams.query.singleSelectQuery.select.queryType=="literal" ||
    selectorParams.query.singleSelectQuery.select.queryType=="queryContextReference" ||
    selectorParams.query.singleSelectQuery.select.queryType=="wrapperReturningObject" ||
    selectorParams.query.singleSelectQuery.select.queryType=="wrapperReturningList" ||
    selectorParams.query.singleSelectQuery.select.queryType=="queryCombiner" 
  ) {
    throw new Error("selectJzodSchemaBySingleSelectQueryFromDomainState can not deal with context reference: query=" + JSON.stringify(selectorParams.query, undefined, 2));
  } else {
    const entityUuidDomainElement: DomainElement = resolveContextReference(
      selectorParams.query.singleSelectQuery.select.parentUuid,
      selectorParams.query.queryParams,
      selectorParams.query.contextResults
    );
    log.info("selectJzodSchemaBySingleSelectQueryFromDomainState called", selectorParams.query, "found", entityUuidDomainElement)

    if (typeof entityUuidDomainElement != "object" || entityUuidDomainElement.elementType != "instanceUuid") {
      return undefined
    }

    return selectorParams.selectorMap.selectEntityJzodSchemaFromDomainStateNew(domainState, {
      selectorMap: selectorParams.selectorMap,
      query: {
        queryType: "getEntityDefinition",
        contextResults: { elementType: "object", elementValue: {} },
        pageParams: selectorParams.query.pageParams,
        queryParams: selectorParams.query.queryParams,
        deploymentUuid: selectorParams.query.singleSelectQuery.deploymentUuid ?? "",
        entityUuid: entityUuidDomainElement.elementValue,
      },
    } as DomainStateJzodSchemaSelectorParams<DomainModelGetEntityDefinitionQueryParams>) as JzodObject | undefined;
  } 
}

// ################################################################################################
export const selectEntityJzodSchemaFromDomainStateNew = (
  domainState: DomainState,
  selectorParams: DomainStateJzodSchemaSelectorParams<DomainModelGetEntityDefinitionQueryParams>
): JzodObject | undefined => {
  const localQuery: DomainModelGetEntityDefinitionQueryParams = selectorParams.query;
  if (
    domainState 
    && domainState[localQuery.deploymentUuid]
    && domainState[localQuery.deploymentUuid]["model"]
    && domainState[localQuery.deploymentUuid]["model"][entityEntityDefinition.uuid]
  ) {
    const values: EntityDefinition[] = Object.values(
      domainState[localQuery.deploymentUuid]["model"][entityEntityDefinition.uuid] ?? {}
    ) as EntityDefinition[];
    const index = values.findIndex(
      (e: EntityDefinition) => e.entityUuid == localQuery.entityUuid
    );

    const result: JzodObject | undefined = index > -1?values[index].jzodSchema: undefined;
  
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
 * @param domainState 
 * @param query 
 * @returns 
 */
export const selectFetchQueryJzodSchemaFromDomainStateNew = (
  domainState: DomainState,
  selectorParams: DomainStateJzodSchemaSelectorParams<DomainModelGetFetchParamJzodSchemaQueryParams>
):  RecordOfJzodObject | undefined => {
  const localFetchParams: DomainManyQueriesWithDeploymentUuid = selectorParams.query.fetchParams
  // log.info("selectFetchQueryJzodSchemaFromDomainState called", selectorParams.query);
  
  const fetchQueryJzodSchema = Object.fromEntries(
    Object.entries(localFetchParams?.fetchQuery?.select??{}).map((entry: [string, MiroirSelectQuery]) => [
      entry[0],
      selectorParams.selectorMap.selectJzodSchemaBySingleSelectQueryFromDomainStateNew(domainState, {
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
      } as DomainStateJzodSchemaSelectorParams<DomainModelGetSingleSelectQueryJzodSchemaQueryParams>),
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
export const selectJzodSchemaByDomainModelQueryFromDomainStateNew = (
  domainState: DomainState,
  selectorParams: DomainStateJzodSchemaSelectorParams<DomainModelQueryJzodSchemaParams>
): RecordOfJzodElement | JzodElement | undefined => {
  switch (selectorParams.query.queryType) {
    case "getEntityDefinition":{ 
      return selectorParams.selectorMap.selectEntityJzodSchemaFromDomainStateNew(
        domainState,
        selectorParams as DomainStateJzodSchemaSelectorParams<DomainModelGetEntityDefinitionQueryParams>
      );
      break;
    }
    case "getFetchParamsJzodSchema": {
      return selectorParams.selectorMap.selectFetchQueryJzodSchemaFromDomainStateNew(
        domainState,
        selectorParams as DomainStateJzodSchemaSelectorParams<DomainModelGetFetchParamJzodSchemaQueryParams>
      );
      break;
    }
    case "getSingleSelectQueryJzodSchema": {
      return selectorParams.selectorMap.selectJzodSchemaBySingleSelectQueryFromDomainStateNew(
        domainState,
        selectorParams as DomainStateJzodSchemaSelectorParams<DomainModelGetSingleSelectQueryJzodSchemaQueryParams>
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
jzodSchemaSelectorMap = {
  "selectJzodSchemaByDomainModelQueryFromDomainStateNew": createSelector([domainStateSelector,domainStateSelectorParams],selectJzodSchemaByDomainModelQueryFromDomainStateNew),
  "selectEntityJzodSchemaFromDomainStateNew": createSelector([domainStateSelector,domainStateSelectorParams],selectEntityJzodSchemaFromDomainStateNew),
  "selectFetchQueryJzodSchemaFromDomainStateNew": createSelector([domainStateSelector,domainStateSelectorParams],selectFetchQueryJzodSchemaFromDomainStateNew),
  "selectJzodSchemaBySingleSelectQueryFromDomainStateNew": createSelector([domainStateSelector,domainStateSelectorParams],selectJzodSchemaBySingleSelectQueryFromDomainStateNew),
}

selectorMap = {
  "selectEntityInstanceUuidIndexFromDomainState": createSelector([domainStateSelector,domainStateSelectorParams],selectEntityInstanceUuidIndexFromDomainState),
  "selectEntityInstanceFromObjectQueryAndDomainState": createSelector([domainStateSelector,domainStateSelectorParams],selectEntityInstanceFromObjectQueryAndDomainState),
  "selectEntityInstanceListFromListQueryAndDomainState": createSelector([domainStateSelector,domainStateSelectorParams],selectEntityInstanceListFromListQueryAndDomainState),
  "selectByDomainManyQueriesFromDomainState": createSelector([domainStateSelector,domainStateSelectorParams],selectByDomainManyQueriesFromDomainState),
}
