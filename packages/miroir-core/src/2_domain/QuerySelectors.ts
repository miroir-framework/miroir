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
  QueryTemplateConstantOrAnyReference,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObjectOrFailed,
  DomainElementEntityInstanceOrFailed,
  ExtractorForSingleObject,
  QuerySelectObjectList,
  ExtractObjectListByEntity,
  DomainModelSingleExtractor,
  QueryExtractorTransformer,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  SyncExtractorRunnerParams,
  SyncExtractorRunner,
  SyncExtractorRunnerMap,
  ExtractorRunnerParamsForJzodSchema,
  RecordOfJzodElement,
  RecordOfJzodObject,
  ExtractorRunnerMap,
  AsyncExtractorRunnerMap,
  AsyncExtractorRunnerParams,
} from "../0_interfaces/2_domain/ExtractorRunnerInterface.js";
import { DeploymentEntityState } from "../0_interfaces/2_domain/DeploymentStateInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { applyTransformer } from "./Transformers.js";
import { cleanLevel } from "./constants.js";
import { renderObjectRuntimeTemplate } from "./Templates.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"SyncExtractorRunner");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

const emptySelectorMap:SyncExtractorRunnerMap<any> = {
  extractorType: "sync",
  extractWithExtractor: undefined as any, 
  extractWithManyExtractors: undefined as any, 
  extractEntityInstance: undefined as any,
  extractEntityInstanceUuidIndexWithObjectListExtractor: undefined as any,
  extractEntityInstanceUuidIndex: undefined as any,
}

const emptyAsyncSelectorMap:AsyncExtractorRunnerMap<any> = {
  extractorType: "async",
  extractWithExtractor: undefined as any, 
  extractWithManyExtractors: undefined as any, 
  extractEntityInstance: undefined as any,
  extractEntityInstanceUuidIndexWithObjectListExtractor: undefined as any,
  extractEntityInstanceUuidIndex: undefined as any,
  applyExtractorTransformer: undefined as any,
}

// ################################################################################################
export function domainElementToPlainObject(r:DomainElement): any {
  switch (r.elementType) {
    case "string":
    case "instanceUuid":
    case "instanceUuidIndex":
    case "instance": {
      return r.elementValue
    }
    case "object": {
      return Object.fromEntries(Object.entries(r.elementValue).map(e => [e[0], domainElementToPlainObject(e[1])]))
    }
    case "array": {
      return r.elementValue.map(e => domainElementToPlainObject(e))
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
  queryTemplateConstantOrAnyReference: QueryTemplateConstantOrAnyReference,
  queryParams: DomainElementObject,
  contextResults: DomainElement,
) : DomainElement => {
  // log.info("resolveContextReference for queryTemplateConstantOrAnyReference=", queryTemplateConstantOrAnyReference, "queryParams=", queryParams,"contextResults=", contextResults)
  if (
    (queryTemplateConstantOrAnyReference.queryTemplateType == "queryContextReference" &&
      (!contextResults.elementValue ||
        !(contextResults.elementValue as any)[queryTemplateConstantOrAnyReference.referenceName])) ||
    (queryTemplateConstantOrAnyReference.queryTemplateType == "queryParameterReference" &&
      (!Object.keys(queryParams.elementValue).includes(queryTemplateConstantOrAnyReference.referenceName)))

  ) {
    // checking that given reference does exist
    return {
      elementType: "failure",
      elementValue: { queryFailure: "ReferenceNotFound", queryContext: JSON.stringify(contextResults) },
    };
  }

  if (
    (
      queryTemplateConstantOrAnyReference.queryTemplateType == "queryContextReference" &&
        !(contextResults.elementValue as any)[queryTemplateConstantOrAnyReference.referenceName].elementValue
    ) ||
    (
      (queryTemplateConstantOrAnyReference.queryTemplateType == "queryParameterReference" &&
      (!queryParams.elementValue[queryTemplateConstantOrAnyReference.referenceName]))
    )
  ) { // checking that given reference does exist
    return {
      elementType: "failure",
      elementValue: { queryFailure: "ReferenceFoundButUndefined", queryContext: JSON.stringify(contextResults) },
    };
  }

  const reference: DomainElement =
  queryTemplateConstantOrAnyReference.queryTemplateType == "queryContextReference"
    ? (contextResults.elementValue as any)[queryTemplateConstantOrAnyReference.referenceName]
    : queryTemplateConstantOrAnyReference.queryTemplateType == "queryParameterReference"
    ? queryParams.elementValue[queryTemplateConstantOrAnyReference.referenceName]
    : queryTemplateConstantOrAnyReference.queryTemplateType == "constantUuid"
    ? {elementType: "instanceUuid", elementValue: queryTemplateConstantOrAnyReference.constantUuidValue } // new object
    : undefined /* this should not happen. Provide "error" value instead?*/;

  return reference
}





// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export const applyExtractorForSingleObjectListToSelectedInstancesUuidIndex = (
  selectedInstancesUuidIndex: DomainElementInstanceUuidIndexOrFailed,
  extractor: ExtractorForSingleObjectList,
) => {
  switch (extractor.select.queryType) {
    case "extractObjectListByEntity": {
      const localQuery: ExtractObjectListByEntity = extractor.select;
      const filterTest = localQuery.filter
        ? new RegExp((localQuery.filter.value as any).definition, "i") // TODO: check for correct type
        : undefined;
      log.info(
        "applyExtractorForSingleObjectListToSelectedInstancesUuidIndex extractObjectListByEntity filter",
        JSON.stringify(localQuery.filter)
      );
      const result:DomainElementInstanceUuidIndexOrFailed = localQuery.filter
        ? {
            elementType: "instanceUuidIndex",
            elementValue: Object.fromEntries(
              Object.entries(selectedInstancesUuidIndex.elementValue).filter((i: [string, EntityInstance]) => {
                const matchResult = filterTest?.test(
                  (i as any)[1][localQuery.filter?.attributeName??""]
                )
                log.info(
                  "applyExtractorForSingleObjectListToSelectedInstancesUuidIndex extractObjectListByEntity filter",
                  JSON.stringify(i[1]),
                  "matchResult",
                  matchResult
                );
                return matchResult
              }
              )
            )
          }
        // }
        // Object.fromEntries(
        //     Object.entries(selectedInstancesUuidIndex.elementValue).filter((i: [string, EntityInstance]) =>
        //       (selectorParams as any).extractor.select.filter.value.match(
        //         (i as any)[1][(selectorParams as any).extractor.select.filter.attributeName]
        //       )
        //     )
        //   )
        : selectedInstancesUuidIndex;
      ;

      return result;
      break;
    }
    case "selectObjectListByRelation": {
      const relationQuery: QuerySelectObjectListByRelation = extractor.select;

      // log.info("applyExtractorForSingleObjectListToSelectedInstancesUuidIndex selectObjectListByRelation", JSON.stringify(selectedInstances))
      // log.info("applyExtractorForSingleObjectListToSelectedInstancesUuidIndex selectObjectListByRelation", selectedInstances)
      return { "elementType": "instanceUuidIndex", "elementValue": Object.fromEntries(
        Object.entries(selectedInstancesUuidIndex.elementValue ?? {}).filter(
          (i: [string, EntityInstance]) => {
            const localIndex = relationQuery.AttributeOfListObjectToCompareToReferenceUuid ?? "dummy";

            let otherIndex = undefined
            if (
              relationQuery.objectReference?.queryTemplateType == "queryContextReference" &&
              extractor.contextResults?.elementType == "object" &&
              extractor.contextResults.elementValue &&
              extractor.contextResults.elementValue[relationQuery.objectReference.referenceName ?? ""]
            ) {
              otherIndex = ((extractor.contextResults?.elementValue[
                relationQuery.objectReference.referenceName
              ].elementValue as any) ?? {})[relationQuery.objectReferenceAttribute ?? "uuid"];
            } else if (relationQuery.objectReference?.queryTemplateType == "constantUuid") {
              otherIndex = relationQuery.objectReference?.constantUuidValue;
            }


            return (i[1] as any)[localIndex] === otherIndex
          }
        )
      )} as DomainElementInstanceUuidIndex;
    }
    case "selectObjectListByManyToManyRelation": {
      // const relationQuery: QuerySelectObjectListByManyToManyRelation = query;
      // const relationQuery: QuerySelectObjectListByManyToManyRelation = selectorParams.extractor.select;
      const relationQuery: QuerySelectObjectListByManyToManyRelation = extractor.select;

      // log.info("applyExtractorForSingleObjectListToSelectedInstancesUuidIndex selectObjectListByManyToManyRelation", selectedInstances)
      let otherList: DomainElement | undefined = undefined
      if (
        relationQuery.objectListReference?.queryTemplateType == "queryContextReference" &&
        extractor.contextResults?.elementType == "object" &&
        extractor.contextResults.elementValue &&
        extractor.contextResults.elementValue[relationQuery.objectListReference.referenceName ?? ""]
      ) {
        otherList = ((extractor.contextResults?.elementValue[
          relationQuery.objectListReference.referenceName
        ]) ?? {elementType: "void", elementValue: undefined });
        
        // log.info("applyExtractorForSingleObjectListToSelectedInstancesUuidIndex selectObjectListByManyToManyRelation found otherList", otherList);
        
      } else if (relationQuery.objectListReference?.queryTemplateType == "constantUuid") {
        throw new Error(
          "applyExtractorForSingleObjectListToSelectedInstancesUuidIndex selectObjectListByManyToManyRelation provided constant for objectListReference. This cannot be a constant, it must be a reference to a List of Objects."
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
                  //   "applyExtractorForSingleObjectListToSelectedInstancesUuidIndex selectObjectListByManyToManyRelation search otherList for attribute",
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
                    "applyExtractorForSingleObjectListToSelectedInstancesUuidIndex selectObjectListByManyToManyRelation can not use objectListReference, selectedInstances elementType=" +
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
          "applyExtractorForSingleObjectListToSelectedInstancesUuidIndex selectObjectListByManyToManyRelation could not find list for objectListReference, selectedInstances elementType=" +
            selectedInstancesUuidIndex.elementType
        );
      }
    }
    default: {
      throw new Error(
        "applyExtractorForSingleObjectListToSelectedInstancesUuidIndex could not handle query, selectorParams=" +
          JSON.stringify(extractor.select, undefined, 2)
      );
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
export const extractEntityInstanceUuidIndexWithObjectListExtractor
= <StateType>(
  deploymentEntityState: StateType,
  selectorParams: SyncExtractorRunnerParams<ExtractorForSingleObjectList, StateType>
): DomainElementInstanceUuidIndexOrFailed => {
  const selectedInstancesUuidIndex: DomainElementInstanceUuidIndexOrFailed =
    (selectorParams?.extractorRunnerMap ?? emptySelectorMap).extractEntityInstanceUuidIndex(deploymentEntityState, selectorParams);

  log.info(
    "extractEntityInstanceUuidIndexWithObjectListExtractor found selectedInstances", selectedInstancesUuidIndex
  );

  return applyExtractorForSingleObjectListToSelectedInstancesUuidIndex(
    selectedInstancesUuidIndex,
    selectorParams.extractor,
  );

};

// ################################################################################################
export const applyExtractorTransformer = (
  query: QueryExtractorTransformer,
  queryParams: DomainElementObject,
  newFetchedData: DomainElementObject
): DomainElement => {
  log.info("applyExtractorTransformer  query", JSON.stringify(query, null, 2));

  const resolvedReference = resolveContextReference(
    { queryTemplateType: "queryContextReference", referenceName:query.referencedExtractor },
    queryParams,
    newFetchedData
  );
  
  log.info("innerSelectElementFromQuery extractorTransformer referencedExtractor resolvedReference", resolvedReference);

  if (resolvedReference.elementType != "instanceUuidIndex") {
    return { elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } }; // TODO: improve error message / queryFailure
  }

  const sortByAttribute = query.orderBy?(a: any[])=>a.sort((a, b) => a[query.orderBy??""].localeCompare(b[query.orderBy??""], "en", { sensitivity: "base" })):(a: any[])=>a;
  switch (query.queryName) {
    case "actionRuntimeTransformer": {
      // return { elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } };
      return renderObjectRuntimeTemplate("ROOT"/**WHAT?? */, query.actionRuntimeTransformer, queryParams, newFetchedData);
      break;
    }
    case "unique": {
      const result = new Set<string>();
        for (const entry of Object.entries(resolvedReference.elementValue)) {
          result.add((entry[1] as any)[query.attribute]);
        }
        return { elementType: "any", elementValue: sortByAttribute([...result].map(e => ({[query.attribute]: e}))) };
      break;
    }
    case "count": {
      if (query.groupBy) {
        const result = new Map<string, number>();
        for (const entry of Object.entries(resolvedReference.elementValue)) {
          const key = (entry[1] as any)[query.groupBy];
          if (result.has(key)) {
            result.set(key, (result.get(key)??0) + 1);
          } else {
            result.set(key, 1);
          }
        }
        return {
          elementType: "any",
          elementValue: sortByAttribute([...result.entries()].map((e) => ({ [query.groupBy as any]: e[0], count: e[1] }))),
        };
      } else {
        return { elementType: "any" /* TODO: number? */, elementValue: [{count: Object.keys(resolvedReference.elementValue).length}] };
      }
      break;
    }
    default: {
      return { elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } };
      break;
    }
  }

  log.info("innerSelectElementFromQuery extractorTransformer resolvedReference", resolvedReference);

  return { elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } };
};

// ################################################################################################
export function innerSelectElementFromQuery/*ExtractorRunner*/<StateType>(
  state: StateType,
  newFetchedData: DomainElementObject,
  pageParams: DomainElementObject,
  queryParams: DomainElementObject,
  extractorRunnerMap:SyncExtractorRunnerMap<StateType>,
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
    case "extractObjectListByEntity":
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
    case "extractorWrapperReturningObject":
    case "wrapperReturningObject": { // build object
      return {
        elementType: "object",
        elementValue: Object.fromEntries(
          Object.entries(query.definition).map((e: [string, QuerySelect]) => [
            e[0],
            innerSelectElementFromQuery( // recursive call
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
    case "extractorWrapperReturningList":
    case "wrapperReturningList": { // List map
      return {
        elementType: "array",
        elementValue: query.definition.map((e) =>
          innerSelectElementFromQuery( // recursive call
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
                innerSelectElementFromQuery( // recursive call
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
    case "extractorTransformer": {
      return applyExtractorTransformer(query, queryParams, newFetchedData);
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
export const extractWithExtractor /**: SyncExtractorRunner */= <StateType>(
  state: StateType,
  // selectorParams: SyncExtractorRunnerParams<ExtractorForRecordOfExtractors, DeploymentEntityState>,
  selectorParams: SyncExtractorRunnerParams<
  DomainModelSingleExtractor | ExtractorForRecordOfExtractors,
    StateType
  >
): DomainElement => {
  // log.info("########## extractExtractor begin, query", selectorParams);
  const localSelectorMap: SyncExtractorRunnerMap<StateType> = selectorParams?.extractorRunnerMap ?? emptySelectorMap;

  switch (selectorParams.extractor.queryType) {
    case "extractorForRecordOfExtractors": {
      return extractWithManyExtractors(
        state,
        selectorParams as SyncExtractorRunnerParams<ExtractorForRecordOfExtractors, StateType>
      );
      break;
    }
    case "domainModelSingleExtractor": {
      const result = innerSelectElementFromQuery(
        state,
        selectorParams.extractor.contextResults,
        selectorParams.extractor.pageParams,
        selectorParams.extractor.queryParams,
        localSelectorMap as any,
        selectorParams.extractor.deploymentUuid,
        selectorParams.extractor.select
      );
      return result;
        break;
      }
    default: {
      return { elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } };
      break;
    }
  }

  // log.info(
  //   "extractExtractor",
  //   "query",
  //   selectorParams,
  //   "domainState",
  //   deploymentEntityState,
  //   "newFetchedData",
  //   context
  // );
  // return result;
};

// ################################################################################################
/**
 * StateType is the type of the deploymentEntityState, which may be a DeploymentEntityState or a DeploymentEntityStateWithUuidIndex
 * 
 * 
 * @param state: StateType
 * @param selectorParams 
 * @returns 
 */

export const extractWithManyExtractors = <StateType>(
  state: StateType,
  // selectorParams: SyncExtractorRunnerParams<ExtractorForRecordOfExtractors, DeploymentEntityState>,
  selectorParams: SyncExtractorRunnerParams<ExtractorForRecordOfExtractors, StateType>,
): DomainElementObject => {

  // log.info("########## extractWithManyExtractors begin, query", selectorParams);


  const context: DomainElementObject = {
    elementType: "object",
    elementValue: { ...selectorParams.extractor.contextResults.elementValue },
  };
  // log.info("########## DomainSelector extractWithManyExtractors will use context", context);
  const localSelectorMap: SyncExtractorRunnerMap<StateType> =
    selectorParams?.extractorRunnerMap ?? emptySelectorMap;

  for (const query of Object.entries(
    selectorParams.extractor.extractors ?? {}
  )) {
    let result = innerSelectElementFromQuery(
      state,
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
    log.info("extractWithManyExtractors done for extractors", query[0], "query", query[1], "result=", result);
  }
  for (const combiner of Object.entries(
    selectorParams.extractor.combiners ?? {}
  )) {
    let result = innerSelectElementFromQuery(
      state,
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
      combiner[1]
    );
    context.elementValue[combiner[0]] = result; // does side effect!
    // log.info("extractWithManyExtractors done for entry", entry[0], "query", entry[1], "result=", result);
  }

  for (const query of 
    Object.entries(
    selectorParams.extractor.runtimeTransformers ?? {}
  )) {
    let result = innerSelectElementFromQuery(
      state,
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
    selectorParams.query.select.queryType=="extractorTransformer" ||
    selectorParams.query.select.queryType=="extractorWrapperReturningObject" ||
    selectorParams.query.select.queryType=="wrapperReturningObject" ||
    selectorParams.query.select.queryType=="extractorWrapperReturningList" ||
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
 * the runtimeTransformers and FetchQueryJzodSchema should depend only on the instance of Report at hand
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
    Object.entries(localFetchParams?.combiners??{}).concat(
    Object.entries(localFetchParams?.runtimeTransformers??{})).map((entry: [string, QuerySelect]) => [
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

  // if (localFetchParams.runtimeTransformers?.crossJoin) {
  //   fetchQueryJzodSchema["crossJoin"] = {
  //     type: "object",
  //     definition: Object.fromEntries(
  //     Object.entries(fetchQueryJzodSchema[localFetchParams.runtimeTransformers?.crossJoin?.a ?? ""]?.definition ?? {}).map((a) => [
  //       "a-" + a[0],
  //       a[1]
  //     ]
  //     ).concat(
  //       Object.entries(fetchQueryJzodSchema[localFetchParams.runtimeTransformers?.crossJoin?.b ?? ""]?.definition ?? {}).map((b) => [
  //         "b-" + b[0], b[1]
  //       ])
  //     )
  //   )};
  // }

  // log.info("selectFetchQueryJzodSchemaFromDomainState query", JSON.stringify(selectorParams.query, undefined, 2), "fetchQueryJzodSchema", fetchQueryJzodSchema)
  return fetchQueryJzodSchema;
};
