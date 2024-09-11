// ################################################################################################

import { Uuid } from "../0_interfaces/1_core/EntityDefinition.js";
import {
  ApplicationSection,
  DomainElement,
  DomainElementInstanceUuidIndex,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObject,
  DomainModelGetEntityDefinitionExtractor,
  DomainModelGetFetchParamJzodSchemaForExtractorTemplate,
  DomainModelGetSingleSelectQueryJzodSchemaForExtractorTemplate,
  DomainModelQueryTemplateJzodSchemaParams,
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
  TransformerForRuntime,
  QueryFailed,
  MiroirQuery,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  AsyncExtractorTemplateRunnerMap,
  ExtractorTemplateRunnerParamsForJzodSchema,
  RecordOfJzodElement,
  RecordOfJzodObject,
  SyncExtractorRunnerMap,
  SyncExtractorTemplateRunnerMap,
  SyncExtractorTemplateRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { cleanLevel } from "./constants.js";
import { innerSelectElementFromQuery } from "./QuerySelectors.js";
import { resolveQueryTemplate } from "./Templates.js";
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
  extractWithExtractorTemplate: undefined as any, 
  extractWithManyExtractorTemplates: undefined as any, 
  extractEntityInstance: undefined as any,
  extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory: undefined as any,
  extractEntityInstanceUuidIndex: undefined as any,
}

const emptyAsyncSelectorMap:AsyncExtractorTemplateRunnerMap = {
  extractorType: "async",
  extractWithExtractorTemplate: undefined as any, 
  extractWithManyExtractorTemplates: undefined as any, 
  extractEntityInstance: undefined as any,
  extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory: undefined as any,
  extractEntityInstanceUuidIndex: undefined as any,
  applyExtractorTransformer: undefined as any,
}

// // ################################################################################################
// export function domainElementToPlainObject(r:DomainElement): any {
//   switch (r.elementType) {
//     case "instanceArray":
//     case "string":
//     case "instanceUuid":
//     case "instanceUuidIndex":
//     case "instance": {
//       return r.elementValue
//     }
//     case "object": {
//       return Object.fromEntries(Object.entries(r.elementValue).map(e => [e[0], domainElementToPlainObject(e[1])]))
//     }
//     case "array": {
//       return r.elementValue.map(e => domainElementToPlainObject(e))
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

// // ################################################################################################
// // export function plainObjectToDomainElement(r:{[k:string]: any}): DomainElementObject {
// export function plainObjectToDomainElement(r:any): DomainElement {
//   switch (typeof r) {
//     case "string": {
//       return {elementType: "string", elementValue: r}
//     }
//     case "number": 
//     case "boolean":
//     case "bigint":
//       {
//         return {elementType: "string", elementValue: r.toString()}
//       }
//     case "symbol": {
//       throw new Error("plainObjectToDomainElement could not convert symbol: " + JSON.stringify(r,undefined,2));
//     }
//     case "undefined": {
//       return {elementType: "void", elementValue: undefined}
//       // throw new Error("plainObjectToDomainElement could not convert undefined: " + JSON.stringify(r,undefined,2));
//     }
//     case "function": {
//       throw new Error("plainObjectToDomainElement could not convert function: " + JSON.stringify(r,undefined,2));
//       // return {elementType: "string", elementValue: r}
//     }
//     case "object": {
//       if (Array.isArray(r)) {
//         return {elementType: "array", elementValue: r.map(e => plainObjectToDomainElement(e))}
//       } else {
//         return {elementType: "object", elementValue: Object.fromEntries(Object.entries(r).map(e => [e[0], plainObjectToDomainElement(e[1])]))}
//       }
//     }
//     default: {
//       throw new Error("plainObjectToDomainElement could not convert object: " + JSON.stringify(r,undefined,2));
//       break;
//     }
//   }
// }

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
export const applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemory = (
  selectedInstancesUuidIndex: DomainElementInstanceUuidIndexOrFailed,
  extractor: ExtractorTemplateForSingleObjectList,
) => {
  log.info(
    "applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemory selectedInstancesUuidIndex",
    selectedInstancesUuidIndex,
    JSON.stringify(extractor, undefined, 2)
  );
  switch (extractor.select.queryType) {
    case "queryTemplateExtractObjectListByEntity": {
      const localQuery: QueryTemplateExtractObjectListByEntity = extractor.select;
      const filterTest = localQuery.filter
        ? new RegExp((localQuery.filter.value as any).definition, "i") // TODO: check for correct type
        : undefined;
      log.info(
        "applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemory queryTemplateExtractObjectListByEntity filter",
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
                  "applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemory queryTemplateExtractObjectListByEntity filter",
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
        "applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemory queryTemplateExtractObjectListByEntity result",
        JSON.stringify(result, undefined, 2)
      );
      return result;
      break;
    }
    case "selectObjectListByRelation": {
      const relationQuery: QueryTemplateSelectObjectListByRelation = extractor.select;

      // log.info("applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemory selectObjectListByRelation", JSON.stringify(selectedInstances))
      // log.info("applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemory selectObjectListByRelation", selectedInstances)
      const result = { "elementType": "instanceUuidIndex", "elementValue": Object.fromEntries(
        Object.entries(selectedInstancesUuidIndex.elementValue ?? {}).filter(
        // Object.entries(selectedInstancesUuidIndex.elementValue ?? {}).filter(
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

            log.info(
              "applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemory selectObjectListByRelation",
              (i[1] as any).name,
              (i[1] as any)[localIndex] === otherIndex,
              "localIndex",
              (i[1] as any)[localIndex],
              "otherIndex",
              otherIndex
            );
            return (i[1] as any)[localIndex] === otherIndex
          }
        )
      )} as DomainElementInstanceUuidIndex;
      log.info("applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemory selectObjectListByRelation query", relationQuery)
      log.info("applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemory selectObjectListByRelation result", result)
      return result;
    }
    case "selectObjectListByManyToManyRelation": {
      // const relationQuery: QueryTemplateSelectObjectListByManyToManyRelation = query;
      // const relationQuery: QueryTemplateSelectObjectListByManyToManyRelation = selectorParams.extractor.select;
      const relationQuery: QueryTemplateSelectObjectListByManyToManyRelation = extractor.select;

      // log.info("applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemory selectObjectListByManyToManyRelation", selectedInstances)
      let otherList: Record<string,any> | undefined = undefined
      if (
        relationQuery.objectListReference?.queryTemplateType == "queryContextReference" &&
        // extractor.contextResults?.elementType == "object" &&
        // extractor.contextResults.elementValue &&
        // extractor.contextResults.elementValue[relationQuery.objectListReference.referenceName ?? ""]
        extractor.contextResults[relationQuery.objectListReference.referenceName ?? ""]
      ) {
        otherList = (extractor.contextResults[
          relationQuery.objectListReference.referenceName
        ]) ?? {};
        // otherList = ((extractor.contextResults?.elementValue[
        //   relationQuery.objectListReference.referenceName
        // ]) ?? {elementType: "void", elementValue: undefined });
        
        // log.info("applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemory selectObjectListByManyToManyRelation found otherList", otherList);
        
      } else if (relationQuery.objectListReference?.queryTemplateType == "constantUuid") {
        throw new Error(
          "applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemory selectObjectListByManyToManyRelation provided constant for objectListReference. This cannot be a constant, it must be a reference to a List of Objects."
        );
      }

      if (!!otherList) {
        return { "elementType": "instanceUuidIndex", "elementValue": Object.fromEntries(
          Object.entries(selectedInstancesUuidIndex.elementValue ?? {}).filter(
            (selectedInstancesEntry: [string, EntityInstance]) => {
              // const localOtherList: DomainElement = otherList as DomainElement;
              const otherListAttribute = relationQuery.objectListReferenceAttribute ?? "uuid";
              const rootListAttribute = relationQuery.AttributeOfRootListObjectToCompareToListReferenceUuid ?? "uuid";
  
              // switch (localOtherList.elementType) { // TODO: remove useless switch
              //   case "instanceUuidIndex": {
                  // TODO: take into account!
                  // [relationQuery.objectListReferenceAttribute ?? "uuid"];
                  const result =
                    Object.values(otherList??{}).findIndex(
                      (v: any) => v[otherListAttribute] == (selectedInstancesEntry[1] as any)[rootListAttribute]
                    ) >= 0;
                  // log.info(
                  //   "applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemory selectObjectListByManyToManyRelation search otherList for attribute",
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
                //   break;
                // }
                // case "object":
                // case "string":
                // case "instance":
                // case "instanceUuidIndexUuidIndex":
                // case "failure":
                // case "array":
                // default: {
                //   throw new Error(
                //     "applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemory selectObjectListByManyToManyRelation can not use objectListReference, selectedInstances elementType=" +
                //     selectedInstancesUuidIndex.elementType + " other list elementType" + localOtherList.elementType
                //   );
                //   break;
                // }
              // }
            }
          )
        )} as DomainElementInstanceUuidIndex;
      } else {
        throw new Error(
          "applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemory selectObjectListByManyToManyRelation could not find list for objectListReference, selectedInstances elementType=" +
            selectedInstancesUuidIndex.elementType
        );
      }
    }
    default: {
      throw new Error(
        "applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemory could not handle query, selectorParams=" +
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
export const extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory
= <StateType>(
  deploymentEntityState: StateType,
  selectorParams: SyncExtractorTemplateRunnerParams<ExtractorTemplateForSingleObjectList, StateType>
): DomainElementInstanceUuidIndexOrFailed => {
  const selectedInstancesUuidIndex: DomainElementInstanceUuidIndexOrFailed =
    (selectorParams?.extractorRunnerMap ?? emptySelectorMap).extractEntityInstanceUuidIndex(deploymentEntityState, selectorParams);

  log.info(
    "extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory found selectedInstances", selectedInstancesUuidIndex
  );

  return applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemory(
    selectedInstancesUuidIndex,
    selectorParams.extractorTemplate,
  );

};

// ################################################################################################
export const applyExtractorTemplateTransformerInMemory = (
  actionRuntimeTransformer: TransformerForRuntime,
  queryParams: Record<string, any>,
  newFetchedData: Record<string, any>
  // queryParams: DomainElementObject,
  // newFetchedData: DomainElementObject
): DomainElement => {
  log.info("applyExtractorTemplateTransformerInMemory  query", JSON.stringify(actionRuntimeTransformer, null, 2));
  return transformer_apply("runtime", "ROOT"/**WHAT?? */, actionRuntimeTransformer, queryParams, newFetchedData);
};

// ################################################################################################
export function innerSelectElementFromQueryTemplate/*ExtractorTemplateRunner*/<StateType>(
  state: StateType,
  newFetchedData: Record<string, any>,
  pageParams: Record<string, any>,
  queryParams: Record<string, any>,
  extractorTemplateRunnerMap:SyncExtractorTemplateRunnerMap<StateType>,
  // extractorRunnerMap:SyncExtractorRunnerMap<StateType>,
  deploymentUuid: Uuid,
  queryTemplate: QueryTemplate
): DomainElement {
  switch (queryTemplate.queryType) {
    case "literal": {
      return { elementType: "string", elementValue: queryTemplate.definition };
      break;
    }
    // ############################################################################################
    // Impure Monads
    case "queryTemplateExtractObjectListByEntity":
    case "selectObjectListByRelation": 
    case "selectObjectListByManyToManyRelation": {
      return extractorTemplateRunnerMap.extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory(state, {
        extractorRunnerMap: extractorTemplateRunnerMap,
        extractorTemplate: {
          queryType: "extractorTemplateForDomainModelObjects",
          deploymentUuid: deploymentUuid,
          contextResults: newFetchedData,
          pageParams: pageParams,
          queryParams,
          select: queryTemplate.applicationSection
          ? queryTemplate
          : {
              ...queryTemplate,
              applicationSection: pageParams.applicationSection as ApplicationSection,
              // applicationSection: pageParams.elementValue.applicationSection.elementValue as ApplicationSection,
            },
        },
      });
      break;
    }
    case "selectObjectByRelation":
    case "selectObjectByDirectReference": {
      return extractorTemplateRunnerMap.extractEntityInstance(state, {
        extractorRunnerMap: extractorTemplateRunnerMap,
        extractorTemplate: {
          queryType: "extractorTemplateForDomainModelObjects",
          deploymentUuid: deploymentUuid,
          contextResults: newFetchedData,
          pageParams,
          queryParams,
          select: queryTemplate.applicationSection // TODO: UGLY!!! WHERE IS THE APPLICATION SECTION PLACED?
          ? queryTemplate
          : {
              ...queryTemplate,
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
          Object.entries(queryTemplate.definition).map((e: [string, QueryTemplate]) => [
            e[0],
            innerSelectElementFromQueryTemplate( // recursive call
              state,
              newFetchedData,
              pageParams ?? {},
              queryParams ?? {},
              extractorTemplateRunnerMap,
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
        elementValue: queryTemplate.definition.map((e) =>
          innerSelectElementFromQueryTemplate( // recursive call
            state,
            newFetchedData,
            pageParams ?? {},
            queryParams ?? {},
            extractorTemplateRunnerMap,
            deploymentUuid,
            e
          ).elementValue // TODO: check for error!
        ),
      };
      break;
    }
    case "queryCombiner": { // join
      const rootQueryResults = innerSelectElementFromQueryTemplate(
        state,
        newFetchedData,
        pageParams,
        queryParams,
        extractorTemplateRunnerMap,
        deploymentUuid,
        queryTemplate.rootQuery
      );
      if (["instanceUuidIndex", "object", "any"].includes(rootQueryResults.elementType)) {
        const result: DomainElementObject = {
          elementType: "object",
          elementValue: Object.fromEntries(
            Object.entries(rootQueryResults.elementValue).map((entry) => {
              return [
                (entry[1] as any).uuid??"no uuid found for entry " + entry[0],
                innerSelectElementFromQueryTemplate( // recursive call
                  state,
                  newFetchedData,
                  pageParams,
                  {
                    ...queryParams.elementValue,
                    ...Object.fromEntries(
                      Object.entries(applyTransformer(queryTemplate.subQuery.rootQueryObjectTransformer, entry[1]))
                    ),
                  },
                  extractorTemplateRunnerMap,
                  deploymentUuid,
                  queryTemplate.subQuery.query
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
            query: JSON.stringify(queryTemplate.rootQuery),
            queryContext: "innerSelectElementFromQueryTemplate for queryCombiner, rootQuery is not instanceUuidIndex, rootQuery=" + JSON.stringify(rootQueryResults,null,2),
          },
        };
      }
      break;
    }
    case "queryContextReference": {
      log.info("innerSelectElementFromQueryTemplate queryContextReference", queryTemplate, "newFetchedData", Object.keys(newFetchedData), "result", newFetchedData[queryTemplate.queryReference]);
      return newFetchedData &&
        // newFetchedData.elementType == "object" &&
        newFetchedData[queryTemplate.queryReference]
        ? { elementType: "any", elementValue:newFetchedData[queryTemplate.queryReference]}
        : {
            elementType: "failure",
            elementValue: {
              queryFailure: "ReferenceNotFound",
              failureOrigin: ["QuerySelector", "innerSelectElementFromQueryTemplate"],
              queryContext: "innerSelectElementFromQueryTemplate could not find " + queryTemplate.queryReference + " in " + JSON.stringify(newFetchedData),
              query: JSON.stringify(queryTemplate),
            },
          };
      break;
    }
    default: {
      return { elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable", query: queryTemplate } };
      break;
    }
  }
}

// ################################################################################################
export const extractWithExtractorTemplate /**: SyncExtractorTemplateRunner */= <StateType>(
  state: StateType,
  // selectorParams: SyncExtractorTemplateRunnerParams<ExtractorTemplateForRecordOfExtractors, DeploymentEntityState>,
  selectorParams: SyncExtractorTemplateRunnerParams<
  ExtractorTemplateForDomainModelObjects | ExtractorTemplateForRecordOfExtractors,
    StateType
  >
): DomainElement => {
  // log.info("########## extractExtractor begin, query", selectorParams);
  const localSelectorMap: SyncExtractorTemplateRunnerMap<StateType> = selectorParams?.extractorRunnerMap ?? emptySelectorMap;

  switch (selectorParams.extractorTemplate.queryType) {
    case "extractorTemplateForRecordOfExtractors": {
      return extractWithManyExtractorTemplates(
        state,
        selectorParams as SyncExtractorTemplateRunnerParams<ExtractorTemplateForRecordOfExtractors, StateType>
      );
      break;
    }
    case "extractorTemplateForDomainModelObjects": {
      const result = innerSelectElementFromQueryTemplate(
        state,
        selectorParams.extractorTemplate.contextResults,
        selectorParams.extractorTemplate.pageParams,
        selectorParams.extractorTemplate.queryParams,
        localSelectorMap as any,
        selectorParams.extractorTemplate.deploymentUuid,
        selectorParams.extractorTemplate.select
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
export const extractWithManyExtractorTemplates = <StateType>(
  state: StateType,
  selectorParams: SyncExtractorTemplateRunnerParams<ExtractorTemplateForRecordOfExtractors, StateType>,
): DomainElementObject => { 

  // log.info("########## extractWithManyExtractorTemplates begin, query", selectorParams);
  const context: Record<string, any> = {
    ...selectorParams.extractorTemplate.contextResults
  };
  // const context: DomainElementObject = {
  //   elementType: "object",
  //   elementValue: { ...selectorParams.extractor.contextResults.elementValue },
  // };
  // log.info("########## DomainSelector extractWithManyExtractorTemplates will use context", context);
  const localSelectorMap: SyncExtractorTemplateRunnerMap<StateType> =
    selectorParams?.extractorRunnerMap ?? emptySelectorMap;

  for (const extractorTemplate of Object.entries(
    selectorParams.extractorTemplate.extractorTemplates ?? {}
  )) {
    const queryParams = {
      ...selectorParams.extractorTemplate.pageParams,
      ...selectorParams.extractorTemplate.queryParams,
    };

    const query = resolveQueryTemplate(extractorTemplate[1], queryParams, context);

    if ((query as any)?.queryFailure) {
      log.error(
        "extractWithManyExtractorTemplates failed for extractor",
        extractorTemplate[0],
        "query",
        extractorTemplate[1],
        "result=",
        query
      );
      // context[extractorTemplate[0]] = query;
      
    }
    let result = innerSelectElementFromQuery(
      state,
      context,
      selectorParams.extractorTemplate.pageParams,
      queryParams,
      localSelectorMap as any,
      selectorParams.extractorTemplate.deploymentUuid,
      query as MiroirQuery
    );
    // let result = innerSelectElementFromQueryTemplate(
    //   state,
    //   context,
    //   selectorParams.extractorTemplate.pageParams,
    //   queryParams,
    //   localSelectorMap as any,
    //   selectorParams.extractorTemplate.deploymentUuid,
    //   extractorTemplate[1]
    // );
    // TODO: test for error!
    if (result.elementType == "failure") {
      log.error(
        "extractWithManyExtractorTemplates failed for extractor",
        extractorTemplate[0],
        "query",
        extractorTemplate[1],
        "result=",
        result
      );
      context[extractorTemplate[0]] = result;
      // return { elementType: "object", elementValue: {
      // }}
      // return result;
    }
    context[extractorTemplate[0]] = result.elementValue; // does side effect!
    log.info(
      "extractWithManyExtractorTemplates done for extractors",
      extractorTemplate[0],
      "query",
      extractorTemplate[1],
      "result=",
      result,
      "context keys=",
      Object.keys(context)
    );
  }
  for (const combiner of Object.entries(
    selectorParams.extractorTemplate.combinerTemplates ?? {}
  )) {
    let result = innerSelectElementFromQueryTemplate(
      state,
      context,
      selectorParams.extractorTemplate.pageParams,
      {
        ...selectorParams.extractorTemplate.pageParams,
        ...selectorParams.extractorTemplate.queryParams,
      },
      localSelectorMap as any,
      selectorParams.extractorTemplate.deploymentUuid,
      combiner[1]
    );
    // context[combiner[0]] = result; // does side effect!
    context[combiner[0]] = result.elementValue; // does side effect!
    // log.info("extractWithManyExtractorTemplates done for entry", entry[0], "query", entry[1], "result=", result);
  }

  for (const transformerForRuntime of 
    Object.entries(
    selectorParams.extractorTemplate.runtimeTransformers ?? {}
  )) {
    let result = applyExtractorTemplateTransformerInMemory(transformerForRuntime[1], {
      ...selectorParams.extractorTemplate.pageParams,
      ...selectorParams.extractorTemplate.queryParams,
    }, context)
    if (result.elementType == "failure") {
      log.error(
        "extractWithManyExtractorTemplates failed for transformer",
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
    // log.info("extractWithManyExtractorTemplates done for entry", entry[0], "query", entry[1], "result=", result);
  }

  // log.info(
  //   "extractWithManyExtractorTemplates",
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
export const extractzodSchemaForSingleSelectQueryTemplate = <StateType>(
  deploymentEntityState: StateType,
  selectorParams: ExtractorTemplateRunnerParamsForJzodSchema<DomainModelGetSingleSelectQueryJzodSchemaForExtractorTemplate, StateType>
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
  } as ExtractorTemplateRunnerParamsForJzodSchema<DomainModelGetEntityDefinitionExtractor,StateType>) as JzodObject | undefined

  return result;
}

// // ################################################################################################
// export const extractJzodSchemaForDomainModelQuery = <StateType>(
//   deploymentEntityState: StateType,
//   selectorParams: ExtractorTemplateRunnerParamsForJzodSchema<DomainModelQueryTemplateJzodSchemaParams, StateType>
// ): RecordOfJzodElement | JzodElement | undefined => {
//   switch (selectorParams.query.queryType) {
//     case "getEntityDefinition":{ 
//       return selectorParams.extractorRunnerMap.extractEntityJzodSchema(
//         deploymentEntityState,
//         selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<DomainModelGetEntityDefinitionExtractor, StateType>
//       );
//       break;
//     }
//     case "getFetchParamsJzodSchema": {
//       return selectorParams.extractorRunnerMap.extractFetchQueryJzodSchema(
//         deploymentEntityState,
//         selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<DomainModelGetFetchParamJzodSchemaForExtractorTemplate, StateType>
//       );
//       break;
//     }
//     case "getSingleSelectQueryJzodSchema": {
//       return selectorParams.extractorRunnerMap.extractzodSchemaForSingleSelectQuery(
//         deploymentEntityState,
//         selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<DomainModelGetSingleSelectQueryJzodSchemaForExtractorTemplate, StateType>
//       );
//       break;
//     }
//     default:
//       return undefined;
//       break;
//   }
// };

// ################################################################################################
export const extractJzodSchemaForDomainModelQueryTemplate = <StateType>(
  deploymentEntityState: StateType,
  selectorParams: ExtractorTemplateRunnerParamsForJzodSchema<DomainModelQueryTemplateJzodSchemaParams, StateType>
): RecordOfJzodElement | JzodElement | undefined => {
  switch (selectorParams.query.queryType) {
    case "getEntityDefinition":{ 
      return selectorParams.extractorRunnerMap.extractEntityJzodSchema(
        deploymentEntityState,
        selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<DomainModelGetEntityDefinitionExtractor, StateType>
      );
      break;
    }
    case "getFetchParamsJzodSchema": {
      return selectorParams.extractorRunnerMap.extractFetchQueryJzodSchema(
        deploymentEntityState,
        selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<DomainModelGetFetchParamJzodSchemaForExtractorTemplate, StateType>
      );
      break;
    }
    case "getSingleSelectQueryJzodSchema": {
      return selectorParams.extractorRunnerMap.extractzodSchemaForSingleSelectQuery(
        deploymentEntityState,
        selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<DomainModelGetSingleSelectQueryJzodSchemaForExtractorTemplate, StateType>
      );
      break;
    }
    default:
      return undefined;
      break;
  }
};

// // ################################################################################################
// /**
//  * the runtimeTransformers and FetchQueryJzodSchema should depend only on the instance of Report at hand
//  * then on the instance of the required entities (which can change over time, on refresh!! Problem: their number can vary!!)
//  * @param deploymentEntityState 
//  * @param query 
//  * @returns 
//  */
export const extractFetchQueryTemplateJzodSchema = <StateType>(
  deploymentEntityState: StateType,
  selectorParams: ExtractorTemplateRunnerParamsForJzodSchema<DomainModelGetFetchParamJzodSchemaForExtractorTemplate, StateType>
):  RecordOfJzodObject | undefined => {
  const localFetchParams: ExtractorTemplateForRecordOfExtractors = selectorParams.query.fetchParams
  // log.info("selectFetchQueryJzodSchemaFromDomainState called", selectorParams.query);
  
  const fetchQueryJzodSchema = Object.fromEntries(
    Object.entries(localFetchParams?.combinerTemplates??{})
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
      } as ExtractorTemplateRunnerParamsForJzodSchema<DomainModelGetSingleSelectQueryJzodSchemaForExtractorTemplate, StateType>),
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
