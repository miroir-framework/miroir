// ################################################################################################

import { Uuid } from "../0_interfaces/1_core/EntityDefinition.js";
import {
  ExtractorForSingleObjectList,
  DomainElement,
  DomainModelExtractor,
  DomainElementObject,
  QuerySelectObjectListByRelation,
  EntityInstance,
  DomainElementInstanceUuidIndex,
  QuerySelectObjectListByManyToManyRelation,
  QuerySelect,
  ApplicationSection,
  ExtractorForRecordOfExtractors,
  DomainModelGetEntityDefinitionExtractor,
  DomainModelGetSingleSelectQueryJzodSchemaExtractor,
  JzodObject,
  DomainModelGetFetchParamJzodSchemaExtractor,
  DomainModelQueryJzodSchemaParams,
  JzodElement,
  QueryObjectReference,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObjectOrFailed,
  DomainElementEntityInstanceOrFailed,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  ExtractorRunnerParams,
  ExtractorRunner,
  ExtractorRunnerMap,
  ExtractorRunnerParamsForJzodSchema,
  RecordOfJzodElement,
  RecordOfJzodObject,
} from "../0_interfaces/2_domain/ExtractorRunnerInterface.js";
import { DeploymentEntityState } from "../0_interfaces/2_domain/DeploymentStateInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { applyTransformer } from "./Transformers.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"ExtractorRunner");
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
export const extractEntityInstanceUuidIndexWithObjectListExtractor
= <StateType>(
  deploymentEntityState: StateType,
  selectorParams: ExtractorRunnerParams<ExtractorForSingleObjectList, StateType>
): DomainElementInstanceUuidIndexOrFailed => {
  // log.info(
  //   "extractEntityInstanceUuidIndexWithObjectListExtractor called with queryType",
  //   selectorParams.query.domainSingleExtractor.select.queryType,
  //   "selectorParams",
  //   selectorParams
  // );
  const emptySelectorMap = {
    extractWithManyExtractors: {} as ExtractorRunner<DomainModelExtractor, StateType, DomainElementObjectOrFailed>, 
    extractEntityInstance: {} as ExtractorRunner<DomainModelExtractor, StateType, DomainElementEntityInstanceOrFailed>,
    extractEntityInstanceUuidIndexWithObjectListExtractor: {} as ExtractorRunner<DomainModelExtractor, StateType, DomainElementInstanceUuidIndexOrFailed>,
    extractEntityInstanceUuidIndex: {} as ExtractorRunner<DomainModelExtractor, StateType, DomainElementInstanceUuidIndexOrFailed>,
  }

  const localSelectorMap: ExtractorRunnerMap<StateType> =
    selectorParams?.extractorRunnerMap ?? emptySelectorMap
  ;

  const selectedInstancesUuidIndex: DomainElementInstanceUuidIndexOrFailed = localSelectorMap.extractEntityInstanceUuidIndex(
    deploymentEntityState,
    selectorParams
  );

  // log.info(
  //   "extractEntityInstanceUuidIndexWithObjectListExtractor found selectedInstances", selectedInstances
  // );


  switch (selectorParams.extractor.select.queryType) {
    case "selectObjectListByEntity": {
      return selectedInstancesUuidIndex;
      break;
    }
    case "selectObjectListByRelation": {
      const relationQuery: QuerySelectObjectListByRelation = selectorParams.extractor.select;

      // log.info("extractEntityInstanceUuidIndexWithObjectListExtractor selectObjectListByRelation", JSON.stringify(selectedInstances))
      // log.info("extractEntityInstanceUuidIndexWithObjectListExtractor selectObjectListByRelation", selectedInstances)
      return { "elementType": "instanceUuidIndex", "elementValue": Object.fromEntries(
        Object.entries(selectedInstancesUuidIndex.elementValue ?? {}).filter(
          (i: [string, EntityInstance]) => {
            const localIndex = relationQuery.AttributeOfListObjectToCompareToReferenceUuid ?? "dummy";

            let otherIndex = undefined
            if (
              relationQuery.objectReference?.referenceType == "queryContextReference" &&
              selectorParams?.extractor.contextResults?.elementType == "object" &&
              selectorParams?.extractor.contextResults.elementValue &&
              selectorParams?.extractor.contextResults.elementValue[relationQuery.objectReference.referenceName ?? ""]
            ) {
              otherIndex = ((selectorParams?.extractor.contextResults?.elementValue[
                relationQuery.objectReference.referenceName
              ].elementValue as any) ?? {})[relationQuery.objectReferenceAttribute ?? "uuid"];
            } else if (relationQuery.objectReference?.referenceType == "constant") {
              otherIndex = relationQuery.objectReference?.referenceUuid
            }


            return (i[1] as any)[localIndex] === otherIndex
          }
        )
      )} as DomainElementInstanceUuidIndex;
    }
    case "selectObjectListByManyToManyRelation": {
      const relationQuery: QuerySelectObjectListByManyToManyRelation = selectorParams.extractor.select;

      // log.info("extractEntityInstanceUuidIndexWithObjectListExtractor selectObjectListByManyToManyRelation", selectedInstances)
      let otherList: DomainElement | undefined = undefined
      if (
        relationQuery.objectListReference?.referenceType == "queryContextReference" &&
        selectorParams?.extractor.contextResults?.elementType == "object" &&
        selectorParams?.extractor.contextResults.elementValue &&
        selectorParams?.extractor.contextResults.elementValue[relationQuery.objectListReference.referenceName ?? ""]
      ) {
        otherList = ((selectorParams?.extractor.contextResults?.elementValue[
          relationQuery.objectListReference.referenceName
        ]) ?? {elementType: "void", elementValue: undefined });
        
        // log.info("extractEntityInstanceUuidIndexWithObjectListExtractor selectObjectListByManyToManyRelation found otherList", otherList);
        
      } else if (relationQuery.objectListReference?.referenceType == "constant") {
        throw new Error(
          "extractEntityInstanceUuidIndexWithObjectListExtractor selectObjectListByManyToManyRelation provided constant for objectListReference. This cannot be a constant, it must be a reference to a List of Objects."
        );
      }

      if (otherList != undefined) {
        return { "elementType": "instanceUuidIndex", "elementValue": Object.fromEntries(
          Object.entries(selectedInstancesUuidIndex.elementValue ?? {}).filter(
            (selectedInstancesEntry: [string, EntityInstance]) => {
              const localOtherList: DomainElement = otherList as DomainElement;
              const otherListAttribute = relationQuery.objectListReferenceAttribute ?? "uuid";
              const rootListAttribute = relationQuery.AttributeOfRootListObjectToCompareToListReferenceUuid ?? "uuid";
  
              switch (localOtherList.elementType) { // TODO: remove useless switch
                case "instanceUuidIndex": {
                  // TODO: take into account!
                  // [relationQuery.objectListReferenceAttribute ?? "uuid"];
                  const result =
                    Object.values((localOtherList as DomainElementInstanceUuidIndex).elementValue).findIndex(
                      (v: any) => v[otherListAttribute] == (selectedInstancesEntry[1] as any)[rootListAttribute]
                    ) >= 0;
                  // log.info(
                  //   "extractEntityInstanceUuidIndexWithObjectListExtractor selectObjectListByManyToManyRelation search otherList for attribute",
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
                    "extractEntityInstanceUuidIndexWithObjectListExtractor selectObjectListByManyToManyRelation can not use objectListReference, selectedInstances elementType=" +
                    selectedInstancesUuidIndex.elementType + " other list elementType" + localOtherList.elementType
                  );
                  break;
                }
              }
            }
          )
        )} as DomainElementInstanceUuidIndex;
      } else {
        throw new Error(
          "extractEntityInstanceUuidIndexWithObjectListExtractor selectObjectListByManyToManyRelation could not find list for objectListReference, selectedInstances elementType=" +
            selectedInstancesUuidIndex.elementType
        );
      }
    }
    default: {
      throw new Error(
        "extractEntityInstanceUuidIndexWithObjectListExtractor could not handle query, selectorParams=" +
          JSON.stringify(selectorParams.extractor.select, undefined, 2)
      );
      break;
    }
  }
};

// ################################################################################################
export function innerSelectElementFromQuery<StateType>(
  state: StateType,
  newFetchedData: DomainElementObject,
  pageParams: DomainElementObject,
  queryParams: DomainElementObject,
  extractorRunnerMap:ExtractorRunnerMap<StateType>,
  deploymentUuid: Uuid,
  query: QuerySelect
): DomainElement {
  switch (query.queryType) {
    case "literal": {
      return { elementType: "string", elementValue: query.definition };
      break;
    }
    // ############################################################################################
    // Impure Monads
    case "selectObjectListByEntity":
    case "selectObjectListByRelation": 
    case "selectObjectListByManyToManyRelation": {
      return extractorRunnerMap.extractEntityInstanceUuidIndexWithObjectListExtractor(state, {
        extractorRunnerMap,
        extractor: {
          queryType: "domainModelSingleExtractor",
          deploymentUuid: deploymentUuid,
          contextResults: newFetchedData,
          pageParams: pageParams,
          queryParams,
          select: query.applicationSection
          ? query
          : {
              ...query,
              applicationSection: pageParams.elementValue.applicationSection.elementValue as ApplicationSection,
            },
        },
      });
      break;
    }
    case "selectObjectByRelation":
    case "selectObjectByDirectReference": {
      return extractorRunnerMap.extractEntityInstance(state, {
        extractorRunnerMap,
        extractor: {
          queryType: "domainModelSingleExtractor",
          deploymentUuid: deploymentUuid,
          contextResults: newFetchedData,
          pageParams,
          queryParams,
          select: query.applicationSection // TODO: UGLY!!! WHERE IS THE APPLICATION SECTION PLACED?
          ? query
          : {
              ...query,
              applicationSection: pageParams?.elementValue?.applicationSection?.elementValue as ApplicationSection,
            },
        }
      });
      break;
    }
    // ############################################################################################
    
    case "wrapperReturningObject": { // build object
      return {
        elementType: "object",
        elementValue: Object.fromEntries(
          Object.entries(query.definition).map((e: [string, QuerySelect]) => [
            e[0],
            innerSelectElementFromQuery(
              state,
              newFetchedData,
              pageParams ?? {},
              queryParams ?? {},
              extractorRunnerMap,
              deploymentUuid,
              e[1]
            ),
          ])
        ),
      };
      break;
    }
    case "wrapperReturningList": { // List map
      return {
        elementType: "array",
        elementValue: query.definition.map((e) =>
          innerSelectElementFromQuery(
            state,
            newFetchedData,
            pageParams ?? {},
            queryParams ?? {},
            extractorRunnerMap,
            deploymentUuid,
            e
          )
        ),
      };
      break;
    }
    case "queryCombiner": { // join
      const rootQueryResults = innerSelectElementFromQuery(
        state,
        newFetchedData,
        pageParams,
        queryParams,
        extractorRunnerMap,
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
                  state,
                  newFetchedData,
                  pageParams,
                  {
                    elementType: "object",
                    elementValue: {
                      ...queryParams.elementValue,
                      ...Object.fromEntries(
                        Object.entries(applyTransformer(query.subQuery.rootQueryObjectTransformer, entry[1])).map((e: [string, any]) => [
                          e[0],
                          { elementType: "instanceUuid", elementValue: e[1] },
                        ])
                      ),
                    },
                  },
                  extractorRunnerMap,
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
/**
 * StateType is the type of the deploymentEntityState, which may be a DeploymentEntityState or a DeploymentEntityStateWithUuidIndex
 * 
 * 
 * @param deploymentEntityState: StateType
 * @param selectorParams 
 * @returns 
 */

export const extractWithManyExtractors = <StateType>(
  deploymentEntityState: StateType,
  // selectorParams: ExtractorRunnerParams<ExtractorForRecordOfExtractors, DeploymentEntityState>,
  selectorParams: ExtractorRunnerParams<ExtractorForRecordOfExtractors, StateType>,
): DomainElementObject => {

  // log.info("########## extractWithManyExtractors begin, query", selectorParams);
  const emptySelectorMap = {
    extractWithManyExtractors: {} as ExtractorRunner<DomainModelExtractor, StateType, DomainElementObjectOrFailed>, 
    extractEntityInstance: {} as ExtractorRunner<DomainModelExtractor, StateType, DomainElementEntityInstanceOrFailed>,
    extractEntityInstanceUuidIndexWithObjectListExtractor: {} as ExtractorRunner<DomainModelExtractor, StateType, DomainElementInstanceUuidIndexOrFailed>,
    extractEntityInstanceUuidIndex: {} as ExtractorRunner<DomainModelExtractor, StateType, DomainElementInstanceUuidIndexOrFailed>,
  }

  const context: DomainElementObject = {
    elementType: "object",
    elementValue: { ...selectorParams.extractor.contextResults.elementValue },
  };
  // log.info("########## DomainSelector extractWithManyExtractors will use context", context);
  const localSelectorMap: ExtractorRunnerMap<StateType> =
    selectorParams?.extractorRunnerMap ?? emptySelectorMap;

  for (const query of Object.entries(selectorParams.extractor.fetchQuery.select)) {
    let result = innerSelectElementFromQuery(
      deploymentEntityState,
      context,
      selectorParams.extractor.pageParams,
      {
        elementType: "object",
        elementValue: {
          ...selectorParams.extractor.pageParams.elementValue,
          ...selectorParams.extractor.queryParams.elementValue,
        },
      },
      localSelectorMap as any,
      selectorParams.extractor.deploymentUuid,
      query[1]
    );
    context.elementValue[query[0]] = result; // does side effect!
    // log.info("extractWithManyExtractors done for entry", entry[0], "query", entry[1], "result=", result);
  }

  // not used
  if (selectorParams.extractor.fetchQuery?.crossJoin) {
    // log.info("DomainSelector extractWithManyExtractors fetchQuery?.crossJoin", selectorParams.query.fetchQuery?.crossJoin);

    // performs a cross-join
    // TODO: NOT USED, REALLY? DO WE REALLY NEED THIS?
    context.elementValue["crossJoin"] = {elementType: "instanceUuidIndex", elementValue: Object.fromEntries(
      Object.values(context.elementValue[selectorParams.extractor.fetchQuery?.crossJoin?.a ?? ""] ?? {}).flatMap((a) =>
        Object.values(context.elementValue[selectorParams.extractor.fetchQuery?.crossJoin?.b ?? ""] ?? {}).map((b) => [
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

  // log.info(
  //   "extractWithManyExtractors",
  //   "query",
  //   selectorParams,
  //   "domainState",
  //   deploymentEntityState,
  //   "newFetchedData",
  //   context
  // );
  return context;
};

// ################################################################################################
// ################################################################################################
// JZOD SCHEMAs selectors
// ################################################################################################
// ################################################################################################
export const extractzodSchemaForSingleSelectQuery = <StateType>(
  deploymentEntityState: StateType,
  selectorParams: ExtractorRunnerParamsForJzodSchema<DomainModelGetSingleSelectQueryJzodSchemaExtractor, StateType>
): JzodObject | undefined => {
  if (
    selectorParams.query.select.queryType=="literal" ||
    selectorParams.query.select.queryType=="queryContextReference" ||
    selectorParams.query.select.queryType=="wrapperReturningObject" ||
    selectorParams.query.select.queryType=="wrapperReturningList" ||
    selectorParams.query.select.queryType=="queryCombiner" 
  ) {
    throw new Error(
      "extractzodSchemaForSingleSelectQuery can not deal with context reference: query=" +
        JSON.stringify(selectorParams.query, undefined, 2)
    );
  }

  const entityUuidDomainElement: DomainElement = resolveContextReference(
    selectorParams.query.select.parentUuid,
    selectorParams.query.queryParams,
    selectorParams.query.contextResults
  );
  log.info(
    "extractzodSchemaForSingleSelectQuery called",
    selectorParams.query,
    "found",
    entityUuidDomainElement
  );

  if (typeof entityUuidDomainElement != "object" || entityUuidDomainElement.elementType != "instanceUuid") {
    return undefined
  }

  const result = selectorParams.extractorRunnerMap.extractEntityJzodSchema(deploymentEntityState, {
    extractorRunnerMap: selectorParams.extractorRunnerMap,
    query: {
      queryType: "getEntityDefinition",
      contextResults: { elementType: "object", elementValue: {} },
      pageParams: selectorParams.query.pageParams,
      queryParams: selectorParams.query.queryParams,
      deploymentUuid: selectorParams.query.deploymentUuid ?? "",
      entityUuid: entityUuidDomainElement.elementValue,
    },
  } as ExtractorRunnerParamsForJzodSchema<DomainModelGetEntityDefinitionExtractor,StateType>) as JzodObject | undefined

  return result;
}

// ################################################################################################
export const extractJzodSchemaForDomainModelQuery = <StateType>(
  deploymentEntityState: StateType,
  selectorParams: ExtractorRunnerParamsForJzodSchema<DomainModelQueryJzodSchemaParams, StateType>
): RecordOfJzodElement | JzodElement | undefined => {
  switch (selectorParams.query.queryType) {
    case "getEntityDefinition":{ 
      return selectorParams.extractorRunnerMap.extractEntityJzodSchema(
        deploymentEntityState,
        selectorParams as ExtractorRunnerParamsForJzodSchema<DomainModelGetEntityDefinitionExtractor, StateType>
      );
      break;
    }
    case "getFetchParamsJzodSchema": {
      return selectorParams.extractorRunnerMap.extractFetchQueryJzodSchema(
        deploymentEntityState,
        selectorParams as ExtractorRunnerParamsForJzodSchema<DomainModelGetFetchParamJzodSchemaExtractor, StateType>
      );
      break;
    }
    case "getSingleSelectQueryJzodSchema": {
      return selectorParams.extractorRunnerMap.extractzodSchemaForSingleSelectQuery(
        deploymentEntityState,
        selectorParams as ExtractorRunnerParamsForJzodSchema<DomainModelGetSingleSelectQueryJzodSchemaExtractor, StateType>
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
export const extractFetchQueryJzodSchema = <StateType>(
  deploymentEntityState: StateType,
  selectorParams: ExtractorRunnerParamsForJzodSchema<DomainModelGetFetchParamJzodSchemaExtractor, StateType>
):  RecordOfJzodObject | undefined => {
  const localFetchParams: ExtractorForRecordOfExtractors = selectorParams.query.fetchParams
  // log.info("selectFetchQueryJzodSchemaFromDomainState called", selectorParams.query);
  
  const fetchQueryJzodSchema = Object.fromEntries(
    Object.entries(localFetchParams?.fetchQuery?.select??{}).map((entry: [string, QuerySelect]) => [
      entry[0],
      selectorParams.extractorRunnerMap.extractzodSchemaForSingleSelectQuery(deploymentEntityState, {
        extractorRunnerMap:selectorParams.extractorRunnerMap,
        query: {
          queryType: "getSingleSelectQueryJzodSchema",
          deploymentUuid: localFetchParams.deploymentUuid,
          contextResults: { elementType: "object", elementValue: {} },
          pageParams: selectorParams.query.pageParams,
          queryParams: selectorParams.query.queryParams,
          select: entry[1],
          // domainSingleExtractor: {
          //   queryType: "domainSingleExtractor",
          //   deploymentUuid: localFetchParams.deploymentUuid,
          //   select: entry[1],
          // },
        },
      } as ExtractorRunnerParamsForJzodSchema<DomainModelGetSingleSelectQueryJzodSchemaExtractor, StateType>),
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
