// ################################################################################################

import { Uuid } from "../0_interfaces/1_core/EntityDefinition.js";
import {
  ApplicationSection,
  DomainElement,
  DomainElementInstanceUuidIndex,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObject,
  DomainModelGetEntityDefinitionExtractor,
  DomainModelGetFetchParamJzodSchemaExtractor,
  DomainModelGetSingleSelectQueryJzodSchemaExtractor,
  DomainModelQueryJzodSchemaParams,
  ExtractorTemplateForDomainModelObjects,
  EntityInstance,
  QueryTemplateExtractObjectListByEntity,
  ExtractorTemplateForRecordOfExtractors,
  ExtractorTemplateForSingleObjectList,
  JzodElement,
  JzodObject,
  QueryTemplate,
  QueryTemplateSelectObjectListByManyToManyRelation,
  QueryTemplateSelectObjectListByRelation,
  QueryTemplateConstantOrAnyReference,
  TransformerForRuntime
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  AsyncExtractorTemplateRunnerMap,
  ExtractorRunnerParamsForJzodSchema,
  RecordOfJzodElement,
  RecordOfJzodObject,
  SyncExtractorTemplateRunnerMap,
  SyncExtractorTemplateRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { cleanLevel } from "./constants.js";
import { applyTransformer, transformer_apply } from "./Transformers.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"SyncExtractorTemplateRunner");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

const emptySelectorMap:SyncExtractorTemplateRunnerMap<any> = {
  extractorType: "sync",
  extractWithExtractor: undefined as any, 
  extractWithManyExtractors: undefined as any, 
  extractEntityInstance: undefined as any,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory: undefined as any,
  extractEntityInstanceUuidIndex: undefined as any,
}

const emptyAsyncSelectorMap:AsyncExtractorTemplateRunnerMap = {
  extractorType: "async",
  extractWithExtractor: undefined as any, 
  extractWithManyExtractors: undefined as any, 
  extractEntityInstance: undefined as any,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory: undefined as any,
  extractEntityInstanceUuidIndex: undefined as any,
  applyExtractorTransformer: undefined as any,
}

// ################################################################################################
export function domainElementToPlainObject(r:DomainElement): any {
  switch (r.elementType) {
    case "instanceArray":
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
// export function plainObjectToDomainElement(r:{[k:string]: any}): DomainElementObject {
export function plainObjectToDomainElement(r:any): DomainElement {
  switch (typeof r) {
    case "string": {
      return {elementType: "string", elementValue: r}
    }
    case "number": 
    case "boolean":
    case "bigint":
      {
        return {elementType: "string", elementValue: r.toString()}
      }
    case "symbol": {
      throw new Error("plainObjectToDomainElement could not convert symbol: " + JSON.stringify(r,undefined,2));
    }
    case "undefined": {
      return {elementType: "void", elementValue: undefined}
      // throw new Error("plainObjectToDomainElement could not convert undefined: " + JSON.stringify(r,undefined,2));
    }
    case "function": {
      throw new Error("plainObjectToDomainElement could not convert function: " + JSON.stringify(r,undefined,2));
      // return {elementType: "string", elementValue: r}
    }
    case "object": {
      if (Array.isArray(r)) {
        return {elementType: "array", elementValue: r.map(e => plainObjectToDomainElement(e))}
      } else {
        return {elementType: "object", elementValue: Object.fromEntries(Object.entries(r).map(e => [e[0], plainObjectToDomainElement(e[1])]))}
      }
    }
    default: {
      throw new Error("plainObjectToDomainElement could not convert object: " + JSON.stringify(r,undefined,2));
      break;
    }
  }
}

// ################################################################################################
// TODO: almost the same as in Transformes.ts: transformer_InnerReference_resolve
export const resolveContextReferenceDEFUNCT = (
  queryTemplateConstantOrAnyReference: QueryTemplateConstantOrAnyReference,
  // queryParams: Record<string, any>,
  // contextResults: Record<string, any>,
  queryParams: DomainElementObject,
  contextResults: DomainElement,
) : DomainElement => {
  // log.info("resolveContextReferenceDEFUNCT for queryTemplateConstantOrAnyReference=", queryTemplateConstantOrAnyReference, "queryParams=", queryParams,"contextResults=", contextResults)
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
      elementValue: {
        queryFailure: "ReferenceNotFound",
        failureOrigin: ["QuerySelector", "resolveContextReferenceDEFUNCT"],
        failureMessage:
          "resolvedContextReference failed to find " +
          queryTemplateConstantOrAnyReference.referenceName +
          " in " +
          (queryTemplateConstantOrAnyReference.queryTemplateType == "queryContextReference"
            ? JSON.stringify(Object.keys(contextResults.elementValue))
            : JSON.stringify(Object.keys(queryParams.elementValue))),
      },
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
// TODO: almost the same as in Transformes.ts: transformer_InnerReference_resolve
export const resolveContextReference = (
  queryTemplateConstantOrAnyReference: QueryTemplateConstantOrAnyReference,
  queryParams: Record<string, any>,
  contextResults: Record<string, any>,
) : DomainElement => {
  // log.info("resolveContextReferenceDEFUNCT for queryTemplateConstantOrAnyReference=", queryTemplateConstantOrAnyReference, "queryParams=", queryParams,"contextResults=", contextResults)
  if (
    (queryTemplateConstantOrAnyReference.queryTemplateType == "queryContextReference" &&
      (!contextResults || !(contextResults as any)[queryTemplateConstantOrAnyReference.referenceName])) ||
    (queryTemplateConstantOrAnyReference.queryTemplateType == "queryParameterReference" &&
      !Object.keys(queryParams).includes(queryTemplateConstantOrAnyReference.referenceName))
  ) {
    // checking that given reference does exist
    return {
      elementType: "failure",
      elementValue: {
        queryFailure: "ReferenceNotFound",
        failureOrigin: ["QuerySelector", "resolveContextReference"],
        queryContext:
          "resolvedContextReference failed to find " +
          queryTemplateConstantOrAnyReference.referenceName +
          " in " +
          (queryTemplateConstantOrAnyReference.queryTemplateType == "queryContextReference"
            ? JSON.stringify(Object.keys(contextResults))
            : JSON.stringify(Object.keys(queryParams))),
      },
    };
  }

  if (
    (queryTemplateConstantOrAnyReference.queryTemplateType == "queryContextReference" &&
      !(contextResults as any)[queryTemplateConstantOrAnyReference.referenceName]) ||
    (queryTemplateConstantOrAnyReference.queryTemplateType == "queryParameterReference" &&
      !queryParams[queryTemplateConstantOrAnyReference.referenceName])
  ) {
    // checking that given reference does exist
    return {
      elementType: "failure",
      elementValue: { queryFailure: "ReferenceFoundButUndefined", queryContext: JSON.stringify(contextResults) },
    };
  }

  const reference: DomainElement =
    queryTemplateConstantOrAnyReference.queryTemplateType == "queryContextReference"
      ? {
          elementType:
            typeof (contextResults as any)[queryTemplateConstantOrAnyReference.referenceName] == "string"
              ? "string"
              : "any",
          elementValue: (contextResults as any)[queryTemplateConstantOrAnyReference.referenceName],
        }
      : queryTemplateConstantOrAnyReference.queryTemplateType == "queryParameterReference"
      ? {
          elementType:
            typeof queryParams[queryTemplateConstantOrAnyReference.referenceName] == "string" ? "string" : "any",
          elementValue: queryParams[queryTemplateConstantOrAnyReference.referenceName],
        }
      : queryTemplateConstantOrAnyReference.queryTemplateType == "constantUuid"
      ? { elementType: "instanceUuid", elementValue: queryTemplateConstantOrAnyReference.constantUuidValue } // new object
      : {
          elementType: "failure",
          elementValue: {
            queryFailure: "QueryNotExecutable",
            failureOrigin: ["QuerySelector", "resolveContextReference"],
            failureMessage: "could not resolve " +
              queryTemplateConstantOrAnyReference +
              " in parameters " +
              JSON.stringify(queryParams) +
              " and context results" +
              JSON.stringify(contextResults),
            // queryContext:,
          }
        }; /* this should not happen. Provide "error" value instead?*/

  return reference;
}





// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export const applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory = (
  selectedInstancesUuidIndex: DomainElementInstanceUuidIndexOrFailed,
  extractor: ExtractorTemplateForSingleObjectList,
) => {
  switch (extractor.select.queryType) {
    case "queryTemplateExtractObjectListByEntity": {
      const localQuery: QueryTemplateExtractObjectListByEntity = extractor.select;
      const filterTest = localQuery.filter
        ? new RegExp((localQuery.filter.value as any).definition, "i") // TODO: check for correct type
        : undefined;
      log.info(
        "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory queryTemplateExtractObjectListByEntity filter",
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
                  "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory queryTemplateExtractObjectListByEntity filter",
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
      log.info(
        "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory queryTemplateExtractObjectListByEntity result",
        JSON.stringify(result, undefined, 2)
      );
      return result;
      break;
    }
    case "selectObjectListByRelation": {
      const relationQuery: QueryTemplateSelectObjectListByRelation = extractor.select;

      // log.info("applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory selectObjectListByRelation", JSON.stringify(selectedInstances))
      // log.info("applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory selectObjectListByRelation", selectedInstances)
      return { "elementType": "instanceUuidIndex", "elementValue": Object.fromEntries(
        Object.entries(selectedInstancesUuidIndex.elementValue ?? {}).filter(
          (i: [string, EntityInstance]) => {
            const localIndex = relationQuery.AttributeOfListObjectToCompareToReferenceUuid ?? "dummy";

            let otherIndex = undefined
            if (
              relationQuery.objectReference?.queryTemplateType == "queryContextReference" &&
              // extractor.contextResults?.elementType == "object" &&
              // extractor.contextResults.elementValue &&
              // extractor.contextResults.elementValue[relationQuery.objectReference.referenceName ?? ""]
              extractor.contextResults[relationQuery.objectReference.referenceName ?? ""]
            ) {
              otherIndex = ((extractor.contextResults[
                relationQuery.objectReference.referenceName
              ] as any) ?? {})[relationQuery.objectReferenceAttribute ?? "uuid"];
            } else if (relationQuery.objectReference?.queryTemplateType == "constantUuid") {
              otherIndex = relationQuery.objectReference?.constantUuidValue;
            }


            return (i[1] as any)[localIndex] === otherIndex
          }
        )
      )} as DomainElementInstanceUuidIndex;
    }
    case "selectObjectListByManyToManyRelation": {
      // const relationQuery: QueryTemplateSelectObjectListByManyToManyRelation = query;
      // const relationQuery: QueryTemplateSelectObjectListByManyToManyRelation = selectorParams.extractor.select;
      const relationQuery: QueryTemplateSelectObjectListByManyToManyRelation = extractor.select;

      // log.info("applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory selectObjectListByManyToManyRelation", selectedInstances)
      let otherList: DomainElement | undefined = undefined
      if (
        relationQuery.objectListReference?.queryTemplateType == "queryContextReference" &&
        // extractor.contextResults?.elementType == "object" &&
        // extractor.contextResults.elementValue &&
        // extractor.contextResults.elementValue[relationQuery.objectListReference.referenceName ?? ""]
        extractor.contextResults[relationQuery.objectListReference.referenceName ?? ""]
      ) {
        otherList = ((extractor.contextResults[
          relationQuery.objectListReference.referenceName
        ]) ?? {elementType: "void", elementValue: undefined });
        // otherList = ((extractor.contextResults?.elementValue[
        //   relationQuery.objectListReference.referenceName
        // ]) ?? {elementType: "void", elementValue: undefined });
        
        // log.info("applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory selectObjectListByManyToManyRelation found otherList", otherList);
        
      } else if (relationQuery.objectListReference?.queryTemplateType == "constantUuid") {
        throw new Error(
          "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory selectObjectListByManyToManyRelation provided constant for objectListReference. This cannot be a constant, it must be a reference to a List of Objects."
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
                  //   "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory selectObjectListByManyToManyRelation search otherList for attribute",
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
                    "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory selectObjectListByManyToManyRelation can not use objectListReference, selectedInstances elementType=" +
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
          "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory selectObjectListByManyToManyRelation could not find list for objectListReference, selectedInstances elementType=" +
            selectedInstancesUuidIndex.elementType
        );
      }
    }
    default: {
      throw new Error(
        "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory could not handle query, selectorParams=" +
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
export const extractEntityInstanceUuidIndexWithObjectListExtractorInMemory
= <StateType>(
  deploymentEntityState: StateType,
  selectorParams: SyncExtractorTemplateRunnerParams<ExtractorTemplateForSingleObjectList, StateType>
): DomainElementInstanceUuidIndexOrFailed => {
  const selectedInstancesUuidIndex: DomainElementInstanceUuidIndexOrFailed =
    (selectorParams?.extractorRunnerMap ?? emptySelectorMap).extractEntityInstanceUuidIndex(deploymentEntityState, selectorParams);

  log.info(
    "extractEntityInstanceUuidIndexWithObjectListExtractorInMemory found selectedInstances", selectedInstancesUuidIndex
  );

  return applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory(
    selectedInstancesUuidIndex,
    selectorParams.extractor,
  );

};

// ################################################################################################
export const applyExtractorTransformerInMemory = (
  actionRuntimeTransformer: TransformerForRuntime,
  queryParams: Record<string, any>,
  newFetchedData: Record<string, any>
  // queryParams: DomainElementObject,
  // newFetchedData: DomainElementObject
): DomainElement => {
  log.info("applyExtractorTransformerInMemory  query", JSON.stringify(actionRuntimeTransformer, null, 2));
  return transformer_apply("runtime", "ROOT"/**WHAT?? */, actionRuntimeTransformer, queryParams, newFetchedData);
};

// ################################################################################################
export function innerSelectElementFromQuery/*ExtractorTemplateRunner*/<StateType>(
  state: StateType,
  newFetchedData: Record<string, any>,
  pageParams: Record<string, any>,
  queryParams: Record<string, any>,
  extractorRunnerMap:SyncExtractorTemplateRunnerMap<StateType>,
  deploymentUuid: Uuid,
  query: QueryTemplate
): DomainElement {
  switch (query.queryType) {
    case "literal": {
      return { elementType: "string", elementValue: query.definition };
      break;
    }
    // ############################################################################################
    // Impure Monads
    case "queryTemplateExtractObjectListByEntity":
    case "selectObjectListByRelation": 
    case "selectObjectListByManyToManyRelation": {
      return extractorRunnerMap.extractEntityInstanceUuidIndexWithObjectListExtractorInMemory(state, {
        extractorRunnerMap,
        extractor: {
          queryType: "extractorTemplateForDomainModelObjects",
          deploymentUuid: deploymentUuid,
          contextResults: newFetchedData,
          pageParams: pageParams,
          queryParams,
          select: query.applicationSection
          ? query
          : {
              ...query,
              applicationSection: pageParams.applicationSection as ApplicationSection,
              // applicationSection: pageParams.elementValue.applicationSection.elementValue as ApplicationSection,
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
          queryType: "extractorTemplateForDomainModelObjects",
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
          Object.entries(query.definition).map((e: [string, QueryTemplate]) => [
            e[0],
            innerSelectElementFromQuery( // recursive call
              state,
              newFetchedData,
              pageParams ?? {},
              queryParams ?? {},
              extractorRunnerMap,
              deploymentUuid,
              e[1]
            ).elementValue, // TODO: check for error!
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
          ).elementValue // TODO: check for error!
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
      if (["instanceUuidIndex", "object", "any"].includes(rootQueryResults.elementType)) {
        const result: DomainElementObject = {
          elementType: "object",
          elementValue: Object.fromEntries(
            Object.entries(rootQueryResults.elementValue).map((entry) => {
              return [
                (entry[1] as any).uuid??"no uuid found for entry " + entry[0],
                innerSelectElementFromQuery( // recursive call
                  state,
                  newFetchedData,
                  pageParams,
                  {
                    ...queryParams.elementValue,
                    ...Object.fromEntries(
                      Object.entries(applyTransformer(query.subQuery.rootQueryObjectTransformer, entry[1]))
                    ),
                  },
                  extractorRunnerMap,
                  deploymentUuid,
                  query.subQuery.query
                ).elementValue, // TODO: check for error!
              ];
            })
          ),
        };
        return result;
      } else {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "IncorrectParameters",
            query: JSON.stringify(query.rootQuery),
            queryContext: "innerSelectElementFromQuery for queryCombiner, rootQuery is not instanceUuidIndex, rootQuery=" + JSON.stringify(rootQueryResults,null,2),
          },
        };
      }
      break;
    }
    case "queryContextReference": {
      log.info("innerSelectElementFromQuery queryContextReference", query, "newFetchedData", Object.keys(newFetchedData), "result", newFetchedData[query.queryReference]);
      return newFetchedData &&
        // newFetchedData.elementType == "object" &&
        newFetchedData[query.queryReference]
        ? { elementType: "any", elementValue:newFetchedData[query.queryReference]}
        : {
            elementType: "failure",
            elementValue: {
              queryFailure: "ReferenceNotFound",
              failureOrigin: ["QuerySelector", "innerSelectElementFromQuery"],
              queryContext: "innerSelectElementFromQuery could not find " + query.queryReference + " in " + JSON.stringify(newFetchedData),
              query: JSON.stringify(query),
            },
          };
      break;
    }
    default: {
      return { elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable", query } };
      break;
    }
  }
}

// ################################################################################################
export const extractWithExtractor /**: SyncExtractorTemplateRunner */= <StateType>(
  state: StateType,
  // selectorParams: SyncExtractorTemplateRunnerParams<ExtractorTemplateForRecordOfExtractors, DeploymentEntityState>,
  selectorParams: SyncExtractorTemplateRunnerParams<
  ExtractorTemplateForDomainModelObjects | ExtractorTemplateForRecordOfExtractors,
    StateType
  >
): DomainElement => {
  // log.info("########## extractExtractor begin, query", selectorParams);
  const localSelectorMap: SyncExtractorTemplateRunnerMap<StateType> = selectorParams?.extractorRunnerMap ?? emptySelectorMap;

  switch (selectorParams.extractor.queryType) {
    case "extractorTemplateForRecordOfExtractors": {
      return extractWithManyExtractors(
        state,
        selectorParams as SyncExtractorTemplateRunnerParams<ExtractorTemplateForRecordOfExtractors, StateType>
      );
      break;
    }
    case "extractorTemplateForDomainModelObjects": {
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
 * @param selectorParams the array of basic extractor functions
 * @returns 
 */
export const extractWithManyExtractors = <StateType>(
  state: StateType,
  selectorParams: SyncExtractorTemplateRunnerParams<ExtractorTemplateForRecordOfExtractors, StateType>,
): DomainElementObject => { 

  // log.info("########## extractWithManyExtractors begin, query", selectorParams);
  const context: Record<string, any> = {
    ...selectorParams.extractor.contextResults
  };
  // const context: DomainElementObject = {
  //   elementType: "object",
  //   elementValue: { ...selectorParams.extractor.contextResults.elementValue },
  // };
  // log.info("########## DomainSelector extractWithManyExtractors will use context", context);
  const localSelectorMap: SyncExtractorTemplateRunnerMap<StateType> =
    selectorParams?.extractorRunnerMap ?? emptySelectorMap;

  for (const extractor of Object.entries(
    selectorParams.extractor.extractors ?? {}
  )) {
    let result = innerSelectElementFromQuery(
      state,
      context,
      selectorParams.extractor.pageParams,
      {
        ...selectorParams.extractor.pageParams,
        ...selectorParams.extractor.queryParams,
      },
      localSelectorMap as any,
      selectorParams.extractor.deploymentUuid,
      extractor[1]
    );
    // TODO: test for error!
    if (result.elementType == "failure") {
      log.error("extractWithManyExtractors failed for extractor", extractor[0], "query", extractor[1], "result=", result);
      context[extractor[0]] = result    
      // return { elementType: "object", elementValue: {
      // }}
      // return result;
    }
    context[extractor[0]] = result.elementValue; // does side effect!
    log.info("extractWithManyExtractors done for extractors", extractor[0], "query", extractor[1], "result=", result, "context keys=", Object.keys(context));
  }
  for (const combiner of Object.entries(
    selectorParams.extractor.combiners ?? {}
  )) {
    let result = innerSelectElementFromQuery(
      state,
      context,
      selectorParams.extractor.pageParams,
      {
        ...selectorParams.extractor.pageParams,
        ...selectorParams.extractor.queryParams,
      },
      localSelectorMap as any,
      selectorParams.extractor.deploymentUuid,
      combiner[1]
    );
    // context[combiner[0]] = result; // does side effect!
    context[combiner[0]] = result.elementValue; // does side effect!
    // log.info("extractWithManyExtractors done for entry", entry[0], "query", entry[1], "result=", result);
  }

  for (const transformerForRuntime of 
    Object.entries(
    selectorParams.extractor.runtimeTransformers ?? {}
  )) {
    let result = applyExtractorTransformerInMemory(transformerForRuntime[1], {
      ...selectorParams.extractor.pageParams,
      ...selectorParams.extractor.queryParams,
    }, context)
    if (result.elementType == "failure") {
      log.error(
        "extractWithManyExtractors failed for transformer",
        transformerForRuntime[0],
        "query",
        transformerForRuntime[1],
        "result=",
        result
      );
      return { elementType: "object", elementValue: {}}
      
    }
    context[transformerForRuntime[0]] = result.elementValue; // does side effect!
    // context.elementValue[transformerForRuntime[0]] = result; // does side effect!
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
  // return { elementType: "object", elementValue: context};
  return { elementType: "object", elementValue: context};
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
  const localFetchParams: ExtractorTemplateForRecordOfExtractors = selectorParams.query.fetchParams
  // log.info("selectFetchQueryJzodSchemaFromDomainState called", selectorParams.query);
  
  const fetchQueryJzodSchema = Object.fromEntries(
    Object.entries(localFetchParams?.combiners??{})
    .map((entry: [string, QueryTemplate]) => [
      entry[0],
      selectorParams.extractorRunnerMap.extractzodSchemaForSingleSelectQuery(deploymentEntityState, {
        extractorRunnerMap:selectorParams.extractorRunnerMap,
        query: {
          queryType: "getSingleSelectQueryJzodSchema",
          deploymentUuid: localFetchParams.deploymentUuid,
          contextResults: { },
          pageParams: selectorParams.query.pageParams,
          queryParams: selectorParams.query.queryParams,
          select: entry[1],
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
