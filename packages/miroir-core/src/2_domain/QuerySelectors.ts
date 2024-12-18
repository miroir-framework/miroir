// ################################################################################################

import { Uuid } from "../0_interfaces/1_core/EntityDefinition.js";
import {
  ActionReturnType,
  ApplicationSection,
  BoxedExtractorOrCombinerReturningObjectList,
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  CombinerByManyToManyRelationReturningObjectList,
  CombinerByRelationReturningObjectList,
  DomainElement,
  DomainElementFailed,
  DomainElementInstanceArray,
  DomainElementInstanceArrayOrFailed,
  DomainElementInstanceUuidIndex,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObject,
  EntityInstance,
  ExtendedTransformerForRuntime,
  ExtractorByEntityReturningObjectList,
  ExtractorOrCombiner,
  ExtractorOrCombinerContextReference,
  JzodElement,
  JzodObject,
  QueryByEntityUuidGetEntityDefinition,
  QueryByQuery2GetParamJzodSchema,
  QueryByQueryGetParamJzodSchema,
  QueryFailed,
  QueryJzodSchemaParams,
  BoxedQueryWithExtractorCombinerTransformer,
  RunBoxedExtractorAction,
  RunBoxedQueryAction
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  AsyncBoxedExtractorOrQueryRunnerMap,
  ExtractorRunnerParamsForJzodSchema,
  RecordOfJzodElement,
  RecordOfJzodObject,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncBoxedExtractorRunner,
  SyncBoxedExtractorRunnerParams,
  SyncQueryRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { cleanLevel } from "./constants.js";
import { resolveExtractorTemplate } from "./Templates.js";
import { applyTransformer, transformer_extended_apply } from "./Transformers.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"QuerySelectors");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

const emptySelectorMap:SyncBoxedExtractorOrQueryRunnerMap<any> = {
  extractorType: "sync",
  extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: undefined as any, 
  runQuery: undefined as any, 
  extractEntityInstance: undefined as any,
  extractEntityInstanceUuidIndexWithObjectListExtractor: undefined as any,
  extractEntityInstanceUuidIndex: undefined as any,
  extractEntityInstanceListWithObjectListExtractor: undefined as any,
  extractEntityInstanceList: undefined as any,
  // ##############################################################################################
  runQueryTemplateWithExtractorCombinerTransformer: undefined as any,
}

const emptyAsyncSelectorMap:AsyncBoxedExtractorOrQueryRunnerMap = {
  extractorType: "async",
  extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: undefined as any, 
  runQuery: undefined as any, 
  extractEntityInstance: undefined as any,
  extractEntityInstanceUuidIndexWithObjectListExtractor: undefined as any,
  extractEntityInstanceUuidIndex: undefined as any,
  extractEntityInstanceListWithObjectListExtractor: undefined as any,
  extractEntityInstanceList: undefined as any,
  applyExtractorTransformer: undefined as any,
  // ##############################################################################################
  runQueryTemplateWithExtractorCombinerTransformer: undefined as any,
}

// ################################################################################################
export function domainElementToPlainObject(r:DomainElement): any {
  if (r) {
    switch (typeof r) {
      case "string":
      case "number":
      case "bigint":
      case "undefined":
      case "boolean": {
        return r;
      }
      case "object": {
        if (r && r.elementType) {
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
        } else {
          return Object.fromEntries(Object.entries(r).map(e => [e[0], domainElementToPlainObject(e[1] as any)]))
        }
      }
      case "symbol":
      case "function": 
      default: {
        throw new Error("could not convert domainElement with type: "+ typeof r + " definition: " + JSON.stringify(r,undefined,2));
        break;
      }
    }
  } else {
    return undefined;
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
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export const applyExtractorForSingleObjectListToSelectedInstancesListInMemory = (
  selectedInstancesList: DomainElementInstanceArrayOrFailed,
  query: BoxedExtractorOrCombinerReturningObjectList,
): DomainElementInstanceArrayOrFailed => {
  if (selectedInstancesList.elementType == "failure") {
    return selectedInstancesList;
    // throw new Error("applyExtractorForSingleObjectListToSelectedInstancesListInMemory selectedInstancesList.elementValue is undefined")
  }
  switch (query.select.extractorOrCombinerType) {
    case "extractorByEntityReturningObjectList": {
      const localQuery: ExtractorByEntityReturningObjectList = query.select;
      const filterTest = localQuery.filter
        ? new RegExp(localQuery.filter.value??"", "i") // TODO: check for correct type
        : undefined;
      // TODO: implement orderBy.direction!
      const sortFunction = localQuery.orderBy?(a: EntityInstance, b: EntityInstance) => {
        return (a as any)[localQuery.orderBy?.attributeName ?? ""].localeCompare(
          (b as any)[localQuery.orderBy?.attributeName ?? ""],
          "en",
          { sensitivity: "base" }
        );
      }: undefined;
      // log.info(
      //   "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory filter",
      //   JSON.stringify(localQuery.filter)
      // );
      const filteredResult:DomainElementInstanceArrayOrFailed = localQuery.filter
        ? {
            elementType: "instanceArray",
            elementValue: 
            // Object.fromEntries(
              selectedInstancesList.elementValue.filter((i: EntityInstance) => {
                const matchResult = filterTest?.test(
                  (i as any)[localQuery.filter?.attributeName??""]
                )
                // log.info(
                //   "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory filter",
                //   JSON.stringify(i[1]),
                //   "matchResult",
                //   matchResult
                // );
                return matchResult
              }
              // )
            )
          }
        : selectedInstancesList;
      ;
      const orderResult = sortFunction?filteredResult.elementValue.sort(sortFunction):filteredResult.elementValue;

      // log.info(
      //   "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory  result",
      //   JSON.stringify(result, undefined, 2)
      // );
      return {elementType: "instanceArray", elementValue: orderResult};
      break;
    }
    case "combinerByRelationReturningObjectList": {
      const relationQuery: CombinerByRelationReturningObjectList = query.select;

      let otherIndex:string | undefined = undefined
      if (
        query.contextResults[relationQuery.objectReference]
      ) {
        otherIndex = ((query.contextResults[
          relationQuery.objectReference
        ] as any) ?? {})[relationQuery.objectReferenceAttribute ?? "uuid"];
      // } else if (relationQuery.objectReference?.queryTemplateType == "constantUuid") {
      } else {
        log.error(
          "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory combinerByRelationReturningObjectList could not find objectReference in contextResults, objectReference=",
          relationQuery.objectReference,
          "contextResults",
          query.contextResults
        );
      }

      // log.info("applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory combinerByRelationReturningObjectList", JSON.stringify(selectedInstances))
      // log.info("applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory combinerByRelationReturningObjectList", selectedInstances)
      return {
        elementType: "instanceArray",
        elementValue: 
        // Object.fromEntries(
          selectedInstancesList.elementValue.filter((i: EntityInstance) => {
            const localIndex = relationQuery.AttributeOfListObjectToCompareToReferenceUuid ?? "dummy";

            // TODO: allow for runtime reference, with runtime trnasformer reference
            return (i as any)[localIndex] === otherIndex;
          }
        )
        // ),
      } as DomainElementInstanceArray;
    }
    case "combinerByManyToManyRelationReturningObjectList": {
      const relationQuery: CombinerByManyToManyRelationReturningObjectList = query.select;

      // relationQuery.objectListReference is a queryContextReference
      // log.info("applyExtractorForSingleObjectListToSelectedInstancesListInMemory combinerByManyToManyRelationReturningObjectList", selectedInstances)
      let otherList: Record<string, any> | undefined = undefined
      otherList = ((query.contextResults[
        relationQuery.objectListReference
      ]) ?? {});
      if (otherList) {
        return { 
          // "elementType": "instanceUuidIndex", "elementValue": 
          "elementType": "instanceArray", "elementValue": 
          // Object.fromEntries(
          selectedInstancesList.elementValue.filter(
            (selectedInstance: EntityInstance) => {
              // const localOtherList: DomainElement = otherList as DomainElement;
              const otherListAttribute = relationQuery.objectListReferenceAttribute ?? "uuid";
              const rootListAttribute = relationQuery.AttributeOfRootListObjectToCompareToListReferenceUuid ?? "uuid";
  
              if (typeof otherList == "object") {
                // log.info(
                //   "applyExtractorForSingleObjectListToSelectedInstancesListInMemory combinerByManyToManyRelationReturningObjectList search otherList for attribute",
                //   otherListAttribute,
                //   "on object",
                //   selectedInstancesEntry[1],
                //   "uuidToFind",
                //   (selectedInstancesEntry[1] as any)[rootListAttribute],
                //   "otherList",
                //   otherList
                // );
                if (!Array.isArray(otherList)) {
                  const result =
                    Object.values(otherList).findIndex(
                      (v: any) => v[otherListAttribute] == (selectedInstance as any)[rootListAttribute]
                    ) >= 0;
                  return result;
                } else {
                  const result =
                    otherList.findIndex(
                      (v: any) => v[otherListAttribute] == (selectedInstance as any)[rootListAttribute]
                    ) >= 0;
                  return result;
                }
              } else {
                throw new Error(
                  "applyExtractorForSingleObjectListToSelectedInstancesListInMemory combinerByManyToManyRelationReturningObjectList can not use objectListReference, selectedInstances elementType=" +
                    selectedInstancesList.elementType +
                    " typeof otherList=" +
                    typeof otherList +
                    " other list=" +
                    JSON.stringify(otherList, undefined, 2)
                );
              }
            }
          )
        // )
        } as DomainElementInstanceArray;
      } else {
        throw new Error(
          "applyExtractorForSingleObjectListToSelectedInstancesListInMemory combinerByManyToManyRelationReturningObjectList could not find list for objectListReference, selectedInstances elementType=" +
            selectedInstancesList.elementType
        );
      }
    }
    default: {
      throw new Error(
        "applyExtractorForSingleObjectListToSelectedInstancesListInMemory could not handle query, selectorParams=" +
          JSON.stringify(query.select, undefined, 2)
      );
      break;
    }
  }
};

// ################################################################################################
export const applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory = (
  selectedInstancesUuidIndex: DomainElementInstanceUuidIndexOrFailed,
  query: BoxedExtractorOrCombinerReturningObjectList,
) => {
  switch (query.select.extractorOrCombinerType) {
    case "extractorByEntityReturningObjectList": {
      const localQuery: ExtractorByEntityReturningObjectList = query.select;
      const filterTest = localQuery.filter
        ? new RegExp(localQuery.filter.value??"", "i") // TODO: check for correct type
        : undefined;
      // log.info(
      //   "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory filter",
      //   JSON.stringify(localQuery.filter)
      // );
      // CANNOT APPLY ORDER BY HERE, AS WE ARE WORKING ON AN INDEX
      if (localQuery.orderBy) {
        log.warn(
          "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory orderBy not implemented for instanceUuidIndex, query=",
          JSON.stringify(query, undefined, 2)
        )
      }
      const result:DomainElementInstanceUuidIndexOrFailed = localQuery.filter
        ? {
            elementType: "instanceUuidIndex",
            elementValue: Object.fromEntries(
              Object.entries(selectedInstancesUuidIndex.elementValue).filter((i: [string, EntityInstance]) => {
                const matchResult = filterTest?.test(
                  (i as any)[1][localQuery.filter?.attributeName??""]
                )
                // log.info(
                //   "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory filter",
                //   JSON.stringify(i[1]),
                //   "matchResult",
                //   matchResult
                // );
                return matchResult
              }
              )
            )
          }
        : selectedInstancesUuidIndex;
      ;
      // log.info(
      //   "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory  result",
      //   JSON.stringify(result, undefined, 2)
      // );
      return result;
      break;
    }
    case "combinerByRelationReturningObjectList": {
      const relationQuery: CombinerByRelationReturningObjectList = query.select;

      let otherIndex:string | undefined = undefined
      if (
        query.contextResults[relationQuery.objectReference]
      ) {
        otherIndex = ((query.contextResults[
          relationQuery.objectReference
        ] as any) ?? {})[relationQuery.objectReferenceAttribute ?? "uuid"];
      // } else if (relationQuery.objectReference?.queryTemplateType == "constantUuid") {
      } else {
        log.error(
          "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory combinerByRelationReturningObjectList could not find objectReference in contextResults, objectReference=",
          relationQuery.objectReference,
          "contextResults",
          query.contextResults
        );
      }

      // log.info("applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory combinerByRelationReturningObjectList", JSON.stringify(selectedInstances))
      // log.info("applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory combinerByRelationReturningObjectList", selectedInstances)
      // CAN NOT APPLY FILTER HERE, AS WE ARE WORKING ON AN INDEX
      if (relationQuery.orderBy) {
        log.warn(
          "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory orderBy not implemented for instanceUuidIndex, query=",
          JSON.stringify(query, undefined, 2)
        )
      }
      return { "elementType": "instanceUuidIndex", "elementValue": Object.fromEntries(
        Object.entries(selectedInstancesUuidIndex.elementValue ?? {}).filter(
          (i: [string, EntityInstance]) => {
            const localIndex = relationQuery.AttributeOfListObjectToCompareToReferenceUuid ?? "dummy";


            // TODO: allow for runtime reference, with runtime trnasformer reference
            return (i[1] as any)[localIndex] === otherIndex
          }
        )
      )} as DomainElementInstanceUuidIndex;
    }
    case "combinerByManyToManyRelationReturningObjectList": {
      const relationQuery: CombinerByManyToManyRelationReturningObjectList = query.select;

      // relationQuery.objectListReference is a queryContextReference
      // log.info("applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory combinerByManyToManyRelationReturningObjectList", selectedInstances)
      let otherList: Record<string, any> | undefined = undefined
      otherList = ((query.contextResults[
        relationQuery.objectListReference
      ]) ?? {});
      if (otherList) {
        return { "elementType": "instanceUuidIndex", "elementValue": Object.fromEntries(
          Object.entries(selectedInstancesUuidIndex.elementValue ?? {}).filter(
            (selectedInstancesEntry: [string, EntityInstance]) => {
              // const localOtherList: DomainElement = otherList as DomainElement;
              const otherListAttribute = relationQuery.objectListReferenceAttribute ?? "uuid";
              const rootListAttribute = relationQuery.AttributeOfRootListObjectToCompareToListReferenceUuid ?? "uuid";
  
              if (typeof otherList == "object" && !Array.isArray(otherList)) {
                // log.info(
                //   "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory combinerByManyToManyRelationReturningObjectList search otherList for attribute",
                //   otherListAttribute,
                //   "on object",
                //   selectedInstancesEntry[1],
                //   "uuidToFind",
                //   (selectedInstancesEntry[1] as any)[rootListAttribute],
                //   "otherList",
                //   otherList
                // );
                const result =
                Object.values(otherList).findIndex(
                  (v: any) => v[otherListAttribute] == (selectedInstancesEntry[1] as any)[rootListAttribute]
                ) >= 0;
                // CAN NOT APPLY FILTER HERE, AS WE ARE WORKING ON AN INDEX
                return result;
              } else {
                throw new Error(
                  "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory combinerByManyToManyRelationReturningObjectList can not use objectListReference, selectedInstances elementType=" +
                    selectedInstancesUuidIndex.elementType +
                    " typeof otherList=" +
                    typeof otherList +
                    " otherList is array " +
                    Array.isArray(otherList) +
                    " other list=" +
                    JSON.stringify(otherList, undefined, 2)
                );
              }
            }
          )
        )} as DomainElementInstanceUuidIndex;
      } else {
        throw new Error(
          "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory combinerByManyToManyRelationReturningObjectList could not find list for objectListReference, selectedInstances elementType=" +
            selectedInstancesUuidIndex.elementType
        );
      }
    }
    default: {
      throw new Error(
        "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory could not handle query, selectorParams=" +
          JSON.stringify(query.select, undefined, 2)
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
  selectorParams: SyncBoxedExtractorRunnerParams<
  BoxedExtractorOrCombinerReturningObjectList, 
    StateType
  >
): DomainElementInstanceUuidIndexOrFailed => {
  const selectedInstancesUuidIndex: DomainElementInstanceUuidIndexOrFailed =
    (selectorParams?.extractorRunnerMap ?? emptySelectorMap).extractEntityInstanceUuidIndex(deploymentEntityState, selectorParams);

  // log.info(
  //   "extractEntityInstanceUuidIndexWithObjectListExtractorInMemory found selectedInstances", selectedInstancesUuidIndex
  // );

  return applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory(
    selectedInstancesUuidIndex,
    selectorParams.extractor,
  );

};
// ################################################################################################
/**
 * returns an Entity Instance List, from a ListQuery
 * @param deploymentEntityState 
 * @param selectorParams 
 * @returns 
 */
export const extractEntityInstanceListWithObjectListExtractorInMemory
= <StateType>(
  deploymentEntityState: StateType,
  selectorParams: SyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList, StateType>
): DomainElementInstanceArrayOrFailed => {
  const selectedInstancesUuidIndex: DomainElementInstanceArrayOrFailed =
    (selectorParams?.extractorRunnerMap ?? emptySelectorMap).extractEntityInstanceList(deploymentEntityState, selectorParams);

  // log.info(
  //   "extractEntityInstanceUuidIndexWithObjectListExtractorInMemory found selectedInstances", selectedInstancesUuidIndex
  // );

  return applyExtractorForSingleObjectListToSelectedInstancesListInMemory(
    selectedInstancesUuidIndex,
    selectorParams.extractor,
  );

};

// ################################################################################################
export const applyExtractorTransformerInMemory = (
  actionRuntimeTransformer: ExtendedTransformerForRuntime,
  queryParams: Record<string, any>,
  newFetchedData: Record<string, any>
): DomainElement => {
  log.info("applyExtractorTransformerInMemory  query", JSON.stringify(actionRuntimeTransformer, null, 2));
  return transformer_extended_apply("runtime", "ROOT"/**WHAT?? */, actionRuntimeTransformer, queryParams, newFetchedData);
};

// ################################################################################################
export async function handleBoxedExtractorAction(
  origin: string,
  runBoxedExtractorAction: RunBoxedExtractorAction,
  selectorMap: AsyncBoxedExtractorOrQueryRunnerMap
): Promise<ActionReturnType> {
  log.info(
    "handleBoxedExtractorAction for",
    origin,
    "start",
    "runBoxedExtractorAction",
    JSON.stringify(runBoxedExtractorAction, null, 2)
  );
  let queryResult: DomainElement;
  const extractor = runBoxedExtractorAction.query;
  queryResult = await selectorMap.extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList(
    {
      extractorRunnerMap: selectorMap,
      extractor,
    }
  );
  if (queryResult.elementType == "failure") {
    return {
      status: "error",
      error: { errorType: "FailedToGetInstances", errorMessage: JSON.stringify(queryResult) },
    } as ActionReturnType;
  } else {
    const result: ActionReturnType = { status: "ok", returnedDomainElement: queryResult };
    log.info("handleBoxedExtractorAction for", origin, "runBoxedExtractorAction", runBoxedExtractorAction, "result", JSON.stringify(result, null, 2));
    return result;
  }
}

// ################################################################################################
export async function handleBoxedQueryAction(
  origin: string,
  runBoxedQueryAction: RunBoxedQueryAction,
  selectorMap: AsyncBoxedExtractorOrQueryRunnerMap
): Promise<ActionReturnType> {
  log.info(
    "handleBoxedQueryAction for",
    origin,
    "start",
    "runBoxedQueryAction",
    JSON.stringify(runBoxedQueryAction, null, 2)
  );
  let queryResult: DomainElement;
  queryResult = await selectorMap.runQuery(
    {
      extractor: runBoxedQueryAction.query,
      extractorRunnerMap: selectorMap,
    }
  );
  if (queryResult.elementType == "failure") {
    return {
      status: "error",
      error: { errorType: "FailedToGetInstances", errorMessage: JSON.stringify(queryResult) },
    } as ActionReturnType;
  } else {
    const result: ActionReturnType = { status: "ok", returnedDomainElement: queryResult };
    log.info("handleBoxedQueryAction for", origin, "runBoxedExtractorOrQueryAction", runBoxedQueryAction, "result", JSON.stringify(result, null, 2));
    return result;
  }
}

// ################################################################################################
export function innerSelectDomainElementFromExtractorOrCombiner/*BoxedExtractorTemplateRunner*/<StateType>(
  state: StateType,
  context: Record<string, any>,
  pageParams: Record<string, any>,
  queryParams: Record<string, any>,
  extractorRunnerMap:SyncBoxedExtractorOrQueryRunnerMap<StateType>,
  deploymentUuid: Uuid,
  extractorOrCombiner: ExtractorOrCombiner
): DomainElement | DomainElementFailed {
  switch (extractorOrCombiner.extractorOrCombinerType) {
    case "literal": {
      return { elementType: "string", elementValue: extractorOrCombiner.definition };
      break;
    }
    // ############################################################################################
    // Impure Monads
    case "extractorByEntityReturningObjectList":
    case "combinerByRelationReturningObjectList": 
    case "combinerByManyToManyRelationReturningObjectList": {
      // return extractorRunnerMap.extractEntityInstanceUuidIndexWithObjectListExtractorInMemory(state, {
      return extractorRunnerMap.extractEntityInstanceListWithObjectListExtractor(state, {
        extractorRunnerMap,
        extractor: {
          queryType: "boxedExtractorOrCombinerReturningObjectList",
          deploymentUuid: deploymentUuid,
          contextResults: context,
          pageParams: pageParams,
          queryParams,
          select: extractorOrCombiner.applicationSection
          ? extractorOrCombiner
          : {
              ...extractorOrCombiner,
              applicationSection: pageParams.applicationSection as ApplicationSection,
              // applicationSection: pageParams.elementValue.applicationSection.elementValue as ApplicationSection,
            },
        },
      });
      break;
    }
    case "combinerForObjectByRelation":
    case "extractorForObjectByDirectReference": {
      return extractorRunnerMap.extractEntityInstance(state, {
        extractorRunnerMap,
        extractor: {
          queryType: "boxedExtractorOrCombinerReturningObject",
          deploymentUuid: deploymentUuid,
          contextResults: context,
          pageParams,
          queryParams,
          select: extractorOrCombiner.applicationSection // TODO: UGLY!!! WHERE IS THE APPLICATION SECTION PLACED?
          ? extractorOrCombiner
          : {
              ...extractorOrCombiner,
              applicationSection: pageParams?.elementValue?.applicationSection?.elementValue as ApplicationSection,
            },
        }
      });
      break;
    }
    // ############################################################################################
    case "extractorWrapperReturningObject": {
      return {
        elementType: "object",
        elementValue: Object.fromEntries(
          Object.entries(extractorOrCombiner.definition).map((e: [string, ExtractorOrCombinerContextReference | ExtractorOrCombiner]) => [
            e[0],
            e[1].extractorOrCombinerType == "extractorOrCombinerContextReference"?
              context[e[1].extractorOrCombinerContextReference]??{}
            :
            innerSelectDomainElementFromExtractorOrCombiner( // recursive call
              state,
              context,
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
    case "extractorWrapperReturningList": {
      return {
        elementType: "array",
        elementValue: extractorOrCombiner.definition.map((e) =>
          innerSelectDomainElementFromExtractorOrCombiner( // recursive call
            state,
            context,
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
    case "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList": { // join
      const rootQueryResults =
        typeof extractorOrCombiner.rootExtractorOrReference == "string"
          ? innerSelectDomainElementFromExtractorOrCombiner(state, context, pageParams, queryParams, extractorRunnerMap, deploymentUuid, {
              extractorOrCombinerType: "extractorOrCombinerContextReference",
              extractorOrCombinerContextReference: extractorOrCombiner.rootExtractorOrReference,
            })
          : innerSelectDomainElementFromExtractorOrCombiner(
              state,
              context,
              pageParams,
              queryParams,
              extractorRunnerMap,
              deploymentUuid,
              extractorOrCombiner.rootExtractorOrReference
            );
      if (["instanceUuidIndex", "object", "any"].includes(rootQueryResults.elementType)) {
        const result: DomainElementObject = {
          elementType: "object",
          elementValue: Object.fromEntries(
            Object.entries(rootQueryResults.elementValue).map((entry) => {

              const innerQueryParams = {
                ...queryParams.elementValue,
                ...Object.fromEntries(
                  Object.entries(applyTransformer(extractorOrCombiner.subQueryTemplate.rootQueryObjectTransformer, entry[1]))
                ),
              };

              // TODO: faking context results here! Should we send empty contextResults instead?
              const resolvedQuery: ExtractorOrCombiner | QueryFailed = resolveExtractorTemplate(
                extractorOrCombiner.subQueryTemplate.query,
                innerQueryParams,
                innerQueryParams
              ); 
        
              if ("QueryFailure" in resolvedQuery) {
                return [
                  (entry[1] as any).uuid??"no uuid found for entry " + entry[0],
                  resolvedQuery
                ];
              }
              const innerResult = innerSelectDomainElementFromExtractorOrCombiner( // recursive call
                state,
                context,
                pageParams,
                innerQueryParams,
                extractorRunnerMap,
                deploymentUuid,
                resolvedQuery as ExtractorOrCombiner,
              ).elementValue; // TODO: check for error!
              return [
                (entry[1] as any).uuid??"no uuid found for entry " + entry[0],
                innerResult
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
            query: JSON.stringify(extractorOrCombiner.rootExtractorOrReference),
            queryContext: "innerSelectDomainElementFromExtractorOrCombiner for extractorCombinerByHeteronomousManyToManyReturningListOfObjectList, rootExtractorOrReference is not instanceUuidIndex, rootExtractorOrReference=" + JSON.stringify(rootQueryResults,null,2),
          },
        };
      }
      break;
    }
    case "extractorOrCombinerContextReference": {
      log.info(
        "innerSelectDomainElementFromExtractorOrCombiner queryContextReference",
        extractorOrCombiner,
        "newFetchedData",
        Object.keys(context),
        "result",
        context[extractorOrCombiner.extractorOrCombinerContextReference]
      );
      return context &&
        // newFetchedData.elementType == "object" &&
        context[extractorOrCombiner.extractorOrCombinerContextReference]
        ? { elementType: "any", elementValue: context[extractorOrCombiner.extractorOrCombinerContextReference] }
        : {
            elementType: "failure",
            elementValue: {
              queryFailure: "ReferenceNotFound",
              failureOrigin: ["QuerySelector", "innerSelectDomainElementFromExtractorOrCombiner"],
              queryContext:
                "innerSelectDomainElementFromExtractorOrCombiner could not find " +
                extractorOrCombiner.extractorOrCombinerContextReference +
                " in " +
                JSON.stringify(context),
              query: JSON.stringify(extractorOrCombiner),
            },
          };
      break;
    }
    default: {
      return {
        elementType: "failure",
        elementValue: {
          queryFailure: "QueryNotExecutable",
          query: JSON.stringify(extractorOrCombiner),
          failureMessage: "unsupported queryType for query: " + extractorOrCombiner,
        },
      } as DomainElementFailed;
      break;
    }
  }
}

// ################################################################################################
export type ExtractWithExtractorType<StateType> = SyncBoxedExtractorRunner<
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  StateType,
  DomainElement
>;
export const extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList /*: ExtractWithExtractorType*/ = <StateType>(
  state: StateType,
  selectorParams: SyncBoxedExtractorRunnerParams<
    BoxedExtractorOrCombinerReturningObjectOrObjectList,
    StateType
  >
): DomainElement => {
  // log.info("########## extractExtractor begin, query", selectorParams);
  const localSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<StateType> = selectorParams?.extractorRunnerMap ?? emptySelectorMap;

  const result = innerSelectDomainElementFromExtractorOrCombiner(
    state,
    selectorParams.extractor.contextResults,
    selectorParams.extractor.pageParams,
    selectorParams.extractor.queryParams,
    localSelectorMap as any,
    selectorParams.extractor.deploymentUuid,
    selectorParams.extractor.select
  );
  return result;

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
export const runQuery = <StateType>(
  state: StateType,
  selectorParams: SyncQueryRunnerParams<StateType>,
): DomainElementObject => { 

  // log.info("########## runQuery begin, query", selectorParams);
  const context: Record<string, any> = {
    ...selectorParams.extractor.contextResults
  };
  // const context: DomainElementObject = {
  //   elementType: "object",
  //   elementValue: { ...selectorParams.extractor.contextResults.elementValue },
  // };
  // log.info("########## DomainSelector runQuery will use context", context);
  const localSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<StateType> =
    selectorParams?.extractorRunnerMap ?? emptySelectorMap;

  for (const extractor of Object.entries(
    selectorParams.extractor.extractors ?? {}
  )) {
    let result = innerSelectDomainElementFromExtractorOrCombiner(
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
      log.error("extractWithManyExtractor failed for extractor", extractor[0], "query", extractor[1], "result=", result);
      context[extractor[0]] = result    
    } else {
      context[extractor[0]] = result.elementValue; // does side effect!
    }
    log.info("extractWithManyExtractor done for extractors", extractor[0], "query", extractor[1], "result=", result, "context keys=", Object.keys(context));
  }
  for (const combiner of Object.entries(
    selectorParams.extractor.combiners ?? {}
  )) {
    let result = innerSelectDomainElementFromExtractorOrCombiner(
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
    context[combiner[0]] = result.elementValue; // does side effect!
    // log.info("runQuery done for entry", entry[0], "query", entry[1], "result=", result);
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
        "extractWithManyExtractor failed for transformer",
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
    log.info(
      "runQuery done for transformerForRuntime",
      transformerForRuntime[0],
      "transformerForRuntime",
      transformerForRuntime[1],
      "result=",
      result
    );
  }

  // log.info(
  //   "runQuery",
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
  extractorParams: ExtractorRunnerParamsForJzodSchema<QueryByQueryGetParamJzodSchema, StateType>
): JzodObject | undefined => {
  if (
    extractorParams.query.select.extractorOrCombinerType=="literal" ||
    extractorParams.query.select.extractorOrCombinerType=="extractorOrCombinerContextReference" ||
    extractorParams.query.select.extractorOrCombinerType=="extractorWrapperReturningObject" ||
    extractorParams.query.select.extractorOrCombinerType=="extractorWrapperReturningList" ||
    extractorParams.query.select.extractorOrCombinerType=="extractorCombinerByHeteronomousManyToManyReturningListOfObjectList" 
  ) {
    throw new Error(
      "extractzodSchemaForSingleSelectQuery can not deal with context reference: query=" +
        JSON.stringify(extractorParams.query, undefined, 2)
    );
  }

  const entityUuid = extractorParams.query.select.parentUuid
  log.info(
    "extractzodSchemaForSingleSelectQuery called",
    extractorParams.query,
    "found entityUuid",
    entityUuid
  );

  // if (typeof entityUuidDomainElement != "object" || entityUuidDomainElement.elementType != "instanceUuid") {
  //   return undefined
  // }

  const result = extractorParams.extractorRunnerMap.extractEntityJzodSchema(deploymentEntityState, {
    extractorRunnerMap: extractorParams.extractorRunnerMap,
    query: {
      queryType: "getEntityDefinition",
      contextResults: { elementType: "object", elementValue: {} },
      pageParams: extractorParams.query.pageParams,
      queryParams: extractorParams.query.queryParams,
      deploymentUuid: extractorParams.query.deploymentUuid ?? "",
      entityUuid: entityUuid,
    },
  } as ExtractorRunnerParamsForJzodSchema<QueryByEntityUuidGetEntityDefinition,StateType>) as JzodObject | undefined

  return result;
}

// ################################################################################################
export const extractJzodSchemaForDomainModelQuery = <StateType>(
  deploymentEntityState: StateType,
  selectorParams: ExtractorRunnerParamsForJzodSchema<QueryJzodSchemaParams, StateType>
): RecordOfJzodElement | JzodElement | undefined => {
  switch (selectorParams.query.queryType) {
    case "getEntityDefinition":{ 
      return selectorParams.extractorRunnerMap.extractEntityJzodSchema(
        deploymentEntityState,
        selectorParams as ExtractorRunnerParamsForJzodSchema<QueryByEntityUuidGetEntityDefinition, StateType>
      );
      break;
    }
    case "queryByTemplateGetParamJzodSchema": {
      return selectorParams.extractorRunnerMap.extractFetchQueryJzodSchema(
        deploymentEntityState,
        selectorParams as ExtractorRunnerParamsForJzodSchema<QueryByQuery2GetParamJzodSchema, StateType>
      );
      break;
    }
    case "getQueryJzodSchema": {
      return selectorParams.extractorRunnerMap.extractzodSchemaForSingleSelectQuery(
        deploymentEntityState,
        selectorParams as ExtractorRunnerParamsForJzodSchema<QueryByQueryGetParamJzodSchema, StateType>
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
  selectorParams: ExtractorRunnerParamsForJzodSchema<QueryByQuery2GetParamJzodSchema, StateType>
):  RecordOfJzodObject | undefined => {
  const localFetchParams: BoxedQueryWithExtractorCombinerTransformer = selectorParams.query.fetchParams
  // log.info("selectFetchQueryJzodSchemaFromDomainState called", selectorParams.query);
  
  const fetchQueryJzodSchema = Object.fromEntries(
    Object.entries(localFetchParams?.combiners??{})
    .map((entry: [string, ExtractorOrCombiner]) => [
      entry[0],
      selectorParams.extractorRunnerMap.extractzodSchemaForSingleSelectQuery(deploymentEntityState, {
        extractorRunnerMap:selectorParams.extractorRunnerMap,
        query: {
          queryType: "getQueryJzodSchema",
          deploymentUuid: localFetchParams.deploymentUuid,
          contextResults: { },
          pageParams: selectorParams.query.pageParams,
          queryParams: selectorParams.query.queryParams,
          select: entry[1],
        },
      } as ExtractorRunnerParamsForJzodSchema<QueryByQueryGetParamJzodSchema, StateType>),
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
