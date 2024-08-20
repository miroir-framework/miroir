// ################################################################################################

import { Uuid } from "../0_interfaces/1_core/EntityDefinition.js";
import {
  ApplicationSection,
  DomainElement,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObject,
  EntityInstance,
  ExtractorForRecordOfExtractors,
  ExtractorForSingleObject,
  ExtractorForSingleObjectList,
  QueryExtractorTransformer,
  QuerySelect
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  AsyncExtractorRunnerMap,
  AsyncExtractorRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { cleanLevel } from "./constants.js";
import { applyExtractorForSingleObjectListToSelectedInstancesUuidIndex, resolveContextReference } from "./QuerySelectors.js";
import { applyTransformer } from "./Transformers.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"AsyncExtractorRunner");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

// const emptySelectorMap:SyncExtractorRunnerMap<any> = {
//   extractorType: "sync",
//   extractWithExtractor: undefined as any, 
//   extractWithManyExtractors: undefined as any, 
//   extractEntityInstance: undefined as any,
//   extractEntityInstanceUuidIndexWithObjectListExtractor: undefined as any,
//   extractEntityInstanceUuidIndex: undefined as any,
// }

const emptyAsyncSelectorMap:AsyncExtractorRunnerMap<any> = {
  extractorType: "async",
  extractWithExtractor: undefined as any, 
  extractWithManyExtractors: undefined as any, 
  extractEntityInstance: undefined as any,
  extractEntityInstanceUuidIndexWithObjectListExtractor: undefined as any,
  extractEntityInstanceUuidIndex: undefined as any,
  processExtractorTransformer: undefined as any,
}

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

// // ################################################################################################
// export const resolveContextReference = (
//   queryTemplateConstantOrAnyReference: QueryTemplateConstantOrAnyReference,
//   queryParams: DomainElementObject,
//   contextResults: DomainElement,
// ) : DomainElement => {
//   // log.info("resolveContextReference for queryTemplateConstantOrAnyReference=", queryTemplateConstantOrAnyReference, "queryParams=", queryParams,"contextResults=", contextResults)
//   if (
//     (queryTemplateConstantOrAnyReference.queryTemplateType == "queryContextReference" &&
//       (!contextResults.elementValue ||
//         !(contextResults.elementValue as any)[queryTemplateConstantOrAnyReference.referenceName])) ||
//     (queryTemplateConstantOrAnyReference.queryTemplateType == "queryParameterReference" &&
//       (!Object.keys(queryParams.elementValue).includes(queryTemplateConstantOrAnyReference.referenceName)))

//   ) {
//     // checking that given reference does exist
//     return {
//       elementType: "failure",
//       elementValue: { queryFailure: "ReferenceNotFound", queryContext: JSON.stringify(contextResults) },
//     };
//   }

//   if (
//     (
//       queryTemplateConstantOrAnyReference.queryTemplateType == "queryContextReference" &&
//         !(contextResults.elementValue as any)[queryTemplateConstantOrAnyReference.referenceName].elementValue
//     ) ||
//     (
//       (queryTemplateConstantOrAnyReference.queryTemplateType == "queryParameterReference" &&
//       (!queryParams.elementValue[queryTemplateConstantOrAnyReference.referenceName]))
//     )
//   ) { // checking that given reference does exist
//     return {
//       elementType: "failure",
//       elementValue: { queryFailure: "ReferenceFoundButUndefined", queryContext: JSON.stringify(contextResults) },
//     };
//   }

//   const reference: DomainElement =
//   queryTemplateConstantOrAnyReference.queryTemplateType == "queryContextReference"
//     ? (contextResults.elementValue as any)[queryTemplateConstantOrAnyReference.referenceName]
//     : queryTemplateConstantOrAnyReference.queryTemplateType == "queryParameterReference"
//     ? queryParams.elementValue[queryTemplateConstantOrAnyReference.referenceName]
//     : queryTemplateConstantOrAnyReference.queryTemplateType == "constantUuid"
//     ? {elementType: "instanceUuid", elementValue: queryTemplateConstantOrAnyReference.constantUuidValue } // new object
//     : undefined /* this should not happen. Provide "error" value instead?*/;

//   return reference
// }





// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// const applyExtractorForSingleObjectListToSelectedInstancesUuidIndex = (
//   selectedInstancesUuidIndex: DomainElementInstanceUuidIndexOrFailed,
//   extractor: ExtractorForSingleObjectList,
// ) => {
//   switch (extractor.select.queryType) {
//     case "extractObjectListByEntity": {
//       const localQuery: ExtractObjectListByEntity = extractor.select;
//       const filterTest = localQuery.filter
//         ? new RegExp((localQuery.filter.value as any).definition, "i") // TODO: check for correct type
//         : undefined;
//       log.info(
//         "applyExtractorForSingleObjectListToSelectedInstancesUuidIndex extractObjectListByEntity filter",
//         JSON.stringify(localQuery.filter)
//       );
//       const result:DomainElementInstanceUuidIndexOrFailed = localQuery.filter
//         ? {
//             elementType: "instanceUuidIndex",
//             elementValue: Object.fromEntries(
//               Object.entries(selectedInstancesUuidIndex.elementValue).filter((i: [string, EntityInstance]) => {
//                 const matchResult = filterTest?.test(
//                   (i as any)[1][localQuery.filter?.attributeName??""]
//                 )
//                 log.info(
//                   "applyExtractorForSingleObjectListToSelectedInstancesUuidIndex extractObjectListByEntity filter",
//                   JSON.stringify(i[1]),
//                   "matchResult",
//                   matchResult
//                 );
//                 return matchResult
//               }
//               )
//             )
//           }
//         // }
//         // Object.fromEntries(
//         //     Object.entries(selectedInstancesUuidIndex.elementValue).filter((i: [string, EntityInstance]) =>
//         //       (selectorParams as any).extractor.select.filter.value.match(
//         //         (i as any)[1][(selectorParams as any).extractor.select.filter.attributeName]
//         //       )
//         //     )
//         //   )
//         : selectedInstancesUuidIndex;
//       ;

//       return result;
//       break;
//     }
//     case "selectObjectListByRelation": {
//       const relationQuery: QuerySelectObjectListByRelation = extractor.select;

//       // log.info("applyExtractorForSingleObjectListToSelectedInstancesUuidIndex selectObjectListByRelation", JSON.stringify(selectedInstances))
//       // log.info("applyExtractorForSingleObjectListToSelectedInstancesUuidIndex selectObjectListByRelation", selectedInstances)
//       return { "elementType": "instanceUuidIndex", "elementValue": Object.fromEntries(
//         Object.entries(selectedInstancesUuidIndex.elementValue ?? {}).filter(
//           (i: [string, EntityInstance]) => {
//             const localIndex = relationQuery.AttributeOfListObjectToCompareToReferenceUuid ?? "dummy";

//             let otherIndex = undefined
//             if (
//               relationQuery.objectReference?.queryTemplateType == "queryContextReference" &&
//               extractor.contextResults?.elementType == "object" &&
//               extractor.contextResults.elementValue &&
//               extractor.contextResults.elementValue[relationQuery.objectReference.referenceName ?? ""]
//             ) {
//               otherIndex = ((extractor.contextResults?.elementValue[
//                 relationQuery.objectReference.referenceName
//               ].elementValue as any) ?? {})[relationQuery.objectReferenceAttribute ?? "uuid"];
//             } else if (relationQuery.objectReference?.queryTemplateType == "constantUuid") {
//               otherIndex = relationQuery.objectReference?.constantUuidValue;
//             }


//             return (i[1] as any)[localIndex] === otherIndex
//           }
//         )
//       )} as DomainElementInstanceUuidIndex;
//     }
//     case "selectObjectListByManyToManyRelation": {
//       // const relationQuery: QuerySelectObjectListByManyToManyRelation = query;
//       // const relationQuery: QuerySelectObjectListByManyToManyRelation = selectorParams.extractor.select;
//       const relationQuery: QuerySelectObjectListByManyToManyRelation = extractor.select;

//       // log.info("applyExtractorForSingleObjectListToSelectedInstancesUuidIndex selectObjectListByManyToManyRelation", selectedInstances)
//       let otherList: DomainElement | undefined = undefined
//       if (
//         relationQuery.objectListReference?.queryTemplateType == "queryContextReference" &&
//         extractor.contextResults?.elementType == "object" &&
//         extractor.contextResults.elementValue &&
//         extractor.contextResults.elementValue[relationQuery.objectListReference.referenceName ?? ""]
//       ) {
//         otherList = ((extractor.contextResults?.elementValue[
//           relationQuery.objectListReference.referenceName
//         ]) ?? {elementType: "void", elementValue: undefined });
        
//         // log.info("applyExtractorForSingleObjectListToSelectedInstancesUuidIndex selectObjectListByManyToManyRelation found otherList", otherList);
        
//       } else if (relationQuery.objectListReference?.queryTemplateType == "constantUuid") {
//         throw new Error(
//           "applyExtractorForSingleObjectListToSelectedInstancesUuidIndex selectObjectListByManyToManyRelation provided constant for objectListReference. This cannot be a constant, it must be a reference to a List of Objects."
//         );
//       }

//       if (otherList != undefined) {
//         return { "elementType": "instanceUuidIndex", "elementValue": Object.fromEntries(
//           Object.entries(selectedInstancesUuidIndex.elementValue ?? {}).filter(
//             (selectedInstancesEntry: [string, EntityInstance]) => {
//               const localOtherList: DomainElement = otherList as DomainElement;
//               const otherListAttribute = relationQuery.objectListReferenceAttribute ?? "uuid";
//               const rootListAttribute = relationQuery.AttributeOfRootListObjectToCompareToListReferenceUuid ?? "uuid";
  
//               switch (localOtherList.elementType) { // TODO: remove useless switch
//                 case "instanceUuidIndex": {
//                   // TODO: take into account!
//                   // [relationQuery.objectListReferenceAttribute ?? "uuid"];
//                   const result =
//                     Object.values((localOtherList as DomainElementInstanceUuidIndex).elementValue).findIndex(
//                       (v: any) => v[otherListAttribute] == (selectedInstancesEntry[1] as any)[rootListAttribute]
//                     ) >= 0;
//                   // log.info(
//                   //   "applyExtractorForSingleObjectListToSelectedInstancesUuidIndex selectObjectListByManyToManyRelation search otherList for attribute",
//                   //   otherListAttribute,
//                   //   "on object",
//                   //   selectedInstancesEntry[1],
//                   //   "uuidToFind",
//                   //   (selectedInstancesEntry[1] as any)[otherListAttribute],
//                   //   "otherList",
//                   //   localOtherList,
//                   //   "result",
//                   //   result
//                   // );

//                   return result 
//                   break;
//                 }
//                 case "object":
//                 case "string":
//                 case "instance":
//                 case "instanceUuidIndexUuidIndex":
//                 case "failure":
//                 case "array":
//                 default: {
//                   throw new Error(
//                     "applyExtractorForSingleObjectListToSelectedInstancesUuidIndex selectObjectListByManyToManyRelation can not use objectListReference, selectedInstances elementType=" +
//                     selectedInstancesUuidIndex.elementType + " other list elementType" + localOtherList.elementType
//                   );
//                   break;
//                 }
//               }
//             }
//           )
//         )} as DomainElementInstanceUuidIndex;
//       } else {
//         throw new Error(
//           "applyExtractorForSingleObjectListToSelectedInstancesUuidIndex selectObjectListByManyToManyRelation could not find list for objectListReference, selectedInstances elementType=" +
//             selectedInstancesUuidIndex.elementType
//         );
//       }
//     }
//     default: {
//       throw new Error(
//         "applyExtractorForSingleObjectListToSelectedInstancesUuidIndex could not handle query, selectorParams=" +
//           JSON.stringify(extractor.select, undefined, 2)
//       );
//       break;
//     }
//   }
// };


// // ################################################################################################
// /**
//  * returns an Entity Instance List, from a ListQuery
//  * @param deploymentEntityState 
//  * @param selectorParams 
//  * @returns 
//  */
// export const extractEntityInstanceUuidIndexWithObjectListExtractor
// = <StateType>(
//   deploymentEntityState: StateType,
//   selectorParams: SyncExtractorRunnerParams<ExtractorForSingleObjectList, StateType>
// ): DomainElementInstanceUuidIndexOrFailed => {
//   const selectedInstancesUuidIndex: DomainElementInstanceUuidIndexOrFailed =
//     (selectorParams?.extractorRunnerMap ?? emptySelectorMap).extractEntityInstanceUuidIndex(deploymentEntityState, selectorParams);

//   log.info(
//     "extractEntityInstanceUuidIndexWithObjectListExtractor found selectedInstances", selectedInstancesUuidIndex
//   );

//   return applyExtractorForSingleObjectListToSelectedInstancesUuidIndex(
//     selectedInstancesUuidIndex,
//     selectorParams.extractor,
//   );

// };

// ################################################################################################
/**
 * returns an Entity Instance List, from a ListQuery
 * @param deploymentEntityState 
 * @param selectorParams 
 * @returns 
 */
export const asyncExtractEntityInstanceUuidIndexWithObjectListExtractor
= <StateType>(
  deploymentEntityState: StateType,
  selectorParams: AsyncExtractorRunnerParams<ExtractorForSingleObjectList, StateType>
): Promise<DomainElementInstanceUuidIndexOrFailed> => {
  const result: Promise<DomainElementInstanceUuidIndexOrFailed> =
    (selectorParams?.extractorRunnerMap ?? emptyAsyncSelectorMap).extractEntityInstanceUuidIndex(deploymentEntityState, selectorParams)
    .then((selectedInstancesUuidIndex: DomainElementInstanceUuidIndexOrFailed) => {
      log.info(
        "extractEntityInstanceUuidIndexWithObjectListExtractor found selectedInstances", selectedInstancesUuidIndex
      );

      return applyExtractorForSingleObjectListToSelectedInstancesUuidIndex(
        selectedInstancesUuidIndex,
        selectorParams.extractor,
      );
    });
  ;

  return result;
};

// // ################################################################################################
// export function innerSelectElementFromQuery/*ExtractorRunner*/<StateType>(
//   state: StateType,
//   newFetchedData: DomainElementObject,
//   pageParams: DomainElementObject,
//   queryParams: DomainElementObject,
//   extractorRunnerMap:SyncExtractorRunnerMap<StateType>,
//   deploymentUuid: Uuid,
//   query: QuerySelect
// ): DomainElement {
//   switch (query.queryType) {
//     case "literal": {
//       return { elementType: "string", elementValue: query.definition };
//       break;
//     }
//     // ############################################################################################
//     // Impure Monads
//     case "extractObjectListByEntity":
//     case "selectObjectListByRelation": 
//     case "selectObjectListByManyToManyRelation": {
//       return extractorRunnerMap.extractEntityInstanceUuidIndexWithObjectListExtractor(state, {
//         extractorRunnerMap,
//         extractor: {
//           queryType: "domainModelSingleExtractor",
//           deploymentUuid: deploymentUuid,
//           contextResults: newFetchedData,
//           pageParams: pageParams,
//           queryParams,
//           select: query.applicationSection
//           ? query
//           : {
//               ...query,
//               applicationSection: pageParams.elementValue.applicationSection.elementValue as ApplicationSection,
//             },
//         },
//       });
//       break;
//     }
//     case "selectObjectByRelation":
//     case "selectObjectByDirectReference": {
//       return extractorRunnerMap.extractEntityInstance(state, {
//         extractorRunnerMap,
//         extractor: {
//           queryType: "domainModelSingleExtractor",
//           deploymentUuid: deploymentUuid,
//           contextResults: newFetchedData,
//           pageParams,
//           queryParams,
//           select: query.applicationSection // TODO: UGLY!!! WHERE IS THE APPLICATION SECTION PLACED?
//           ? query
//           : {
//               ...query,
//               applicationSection: pageParams?.elementValue?.applicationSection?.elementValue as ApplicationSection,
//             },
//         }
//       });
//       break;
//     }
//     // ############################################################################################
//     case "extractorWrapperReturningObject":
//     case "wrapperReturningObject": { // build object
//       return {
//         elementType: "object",
//         elementValue: Object.fromEntries(
//           Object.entries(query.definition).map((e: [string, QuerySelect]) => [
//             e[0],
//             innerSelectElementFromQuery( // recursive call
//               state,
//               newFetchedData,
//               pageParams ?? {},
//               queryParams ?? {},
//               extractorRunnerMap,
//               deploymentUuid,
//               e[1]
//             ),
//           ])
//         ),
//       };
//       break;
//     }
//     case "extractorWrapperReturningList":
//     case "wrapperReturningList": { // List map
//       return {
//         elementType: "array",
//         elementValue: query.definition.map((e) =>
//           innerSelectElementFromQuery( // recursive call
//             state,
//             newFetchedData,
//             pageParams ?? {},
//             queryParams ?? {},
//             extractorRunnerMap,
//             deploymentUuid,
//             e
//           )
//         ),
//       };
//       break;
//     }
//     case "queryCombiner": { // join
//       const rootQueryResults = innerSelectElementFromQuery(
//         state,
//         newFetchedData,
//         pageParams,
//         queryParams,
//         extractorRunnerMap,
//         deploymentUuid,
//         query.rootQuery
//       );
//       if (rootQueryResults.elementType == "instanceUuidIndex") {
//         const result: DomainElementObject = {
//           elementType: "object",
//           elementValue: Object.fromEntries(
//             Object.entries(rootQueryResults.elementValue).map((entry) => {
//               return [
//                 entry[1].uuid,
//                 innerSelectElementFromQuery( // recursive call
//                   state,
//                   newFetchedData,
//                   pageParams,
//                   {
//                     elementType: "object",
//                     elementValue: {
//                       ...queryParams.elementValue,
//                       ...Object.fromEntries(
//                         Object.entries(applyTransformer(query.subQuery.rootQueryObjectTransformer, entry[1])).map((e: [string, any]) => [
//                           e[0],
//                           { elementType: "instanceUuid", elementValue: e[1] },
//                         ])
//                       ),
//                     },
//                   },
//                   extractorRunnerMap,
//                   deploymentUuid,
//                   query.subQuery.query
//                 ),
//               ];
//             })
//           ),
//         };
//         return result;
//       } else {
//         return { elementType: "failure", elementValue: { queryFailure: "IncorrectParameters", query: JSON.stringify(query.rootQuery) } }
//       }
//       break;
//     }
//     case "extractorTransformer": {
//       const resolvedReference = resolveContextReference(
//         query.referencedQuery,
//         queryParams,
//         newFetchedData
//       );

//       log.info("innerSelectElementFromQuery extractorTransformer resolvedReference", resolvedReference);
//       const result = new Set<string>();
//       if (resolvedReference.elementType == "instanceUuidIndex") {
//         for (const entry of Object.entries(resolvedReference.elementValue)) {
//             result.add((entry[1] as any)[query.attribute]);
//         }
//         return { elementType: "any", elementValue: [...result] };
//       }

//       // // Object.entries(resolvedReference.elementValue).map(
//       // //   (entry: [string, DomainElement]) => {
//       // //   }
//       // // );
//       // )
//       log.info("innerSelectElementFromQuery extractorTransformer resolvedReference", resolvedReference);

//       return { elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } };
//       break;
//     }
//     case "queryContextReference": {
//       return newFetchedData && newFetchedData.elementType == "object" && newFetchedData.elementValue[query.queryReference]
//         ? newFetchedData.elementValue[query.queryReference]
//         : { elementType: "failure", elementValue: { queryFailure: "ReferenceNotFound", query: JSON.stringify(query) } };
//       break;
//     }
//     default: {
//       return { elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable", query } };
//       break;
//     }
//   }
// }

// ################################################################################################
export async function processExtractorTransformerInMemory(
  query: QueryExtractorTransformer,
  queryParams: DomainElementObject,
  newFetchedData: DomainElementObject,
  extractors: Record<string, ExtractorForSingleObjectList | ExtractorForSingleObject | ExtractorForRecordOfExtractors>,
): Promise<DomainElement> {
  const resolvedReference = resolveContextReference(
    query.referencedQuery,
    queryParams,
    newFetchedData
  );

  log.info("asyncInnerSelectElementFromQuery extractorTransformer resolvedReference", resolvedReference);
  const result = new Set<string>();
  if (resolvedReference.elementType == "instanceUuidIndex") {
    for (const entry of Object.entries(resolvedReference.elementValue)) {
      result.add((entry[1] as any)[query.attribute]);
    }
    log.info("asyncInnerSelectElementFromQuery extractorTransformer result", JSON.stringify(Array.from(result.values())));
    return Promise.resolve({ elementType: "any", elementValue: [...result] });
  }

  return Promise.resolve({ elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } });
}

// ################################################################################################
export function asyncInnerSelectElementFromQuery/*ExtractorRunner*/<StateType>(
  state: StateType,
  newFetchedData: DomainElementObject,
  pageParams: DomainElementObject,
  queryParams: DomainElementObject,
  extractorRunnerMap:AsyncExtractorRunnerMap<StateType>,
  deploymentUuid: Uuid,
  extractors: Record<string, ExtractorForSingleObjectList | ExtractorForSingleObject | ExtractorForRecordOfExtractors>,
  query: QuerySelect
): Promise<DomainElement> {
  switch (query.queryType) {
    case "literal": {
      return Promise.resolve({ elementType: "string", elementValue: query.definition });
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
      const entries = Object.entries(query.definition);
      const promises = entries.map((e: [string, QuerySelect]) => {
        return asyncInnerSelectElementFromQuery(
          state,
          newFetchedData,
          pageParams ?? {},
          queryParams ?? {},
          extractorRunnerMap,
          deploymentUuid,
          extractors,
          e[1]
        ).then((result) => {
          return [e[0], result];
        });
      });
      return Promise.all(promises).then((results) => {
        return Promise.resolve({
          elementType: "object",
          elementValue: Object.fromEntries(results),
        });
      });
      break;
    }
    case "extractorWrapperReturningList":
    case "wrapperReturningList": { // List map
      const promises = query.definition.map((e) =>{
        return asyncInnerSelectElementFromQuery(
          state,
          newFetchedData,
          pageParams ?? {},
          queryParams ?? {},
          extractorRunnerMap,
          deploymentUuid,
          extractors,
          e
        );
      })
      return Promise.all(promises).then((results) => {
        return Promise.resolve({
          elementType: "array",
          elementValue: results,
        });
      });
      break;
    }
    case "queryCombiner": { // join
      const rootQueryResults = asyncInnerSelectElementFromQuery(
        state,
        newFetchedData,
        pageParams,
        queryParams,
        extractorRunnerMap,
        deploymentUuid,
        extractors,
        query.rootQuery
      );
      return rootQueryResults.then((rootQueryResults) => {
        if (rootQueryResults.elementType == "instanceUuidIndex") {
          const entries = Object.entries(rootQueryResults.elementValue);
          const promises = entries.map((entry: [string, EntityInstance]) => {
            return asyncInnerSelectElementFromQuery(
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
              extractors,
              query.subQuery.query
            ).then((result) => {
              return [entry[1].uuid, result];
            });
          });

          return Promise.all(promises).then((results) => {
            return {
              elementType: "object",
              elementValue: Object.fromEntries(results),
            };
          });
        } else {
          return { elementType: "failure", elementValue: { queryFailure: "IncorrectParameters", query: JSON.stringify(query.rootQuery) } }
        }
      });

      break;
    }
    case "extractorTransformer": {
      // return processExtractorTransformerInMemory(query, queryParams, newFetchedData, extractors);
      return extractorRunnerMap.processExtractorTransformer(query, queryParams, newFetchedData, extractors);
    }
    case "queryContextReference": {
      return newFetchedData && newFetchedData.elementType == "object" && newFetchedData.elementValue[query.queryReference]
        ? Promise.resolve(newFetchedData.elementValue[query.queryReference])
        : Promise.resolve({ elementType: "failure", elementValue: { queryFailure: "ReferenceNotFound", query: JSON.stringify(query) } });
      break;
    }
    default: {
      return Promise.resolve({ elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable", query } });
      break;
    }
  }
}

// ################################################################################################
export const asyncExtractWithExtractor /**: SyncExtractorRunner */= <StateType>(
  state: StateType,
  // selectorParams: SyncExtractorRunnerParams<ExtractorForRecordOfExtractors, DeploymentEntityState>,
  selectorParams: AsyncExtractorRunnerParams<
    ExtractorForSingleObject | ExtractorForSingleObjectList | ExtractorForRecordOfExtractors,
    StateType
  >
): Promise<DomainElement> => {
  // log.info("########## extractExtractor begin, query", selectorParams);
  const localSelectorMap: AsyncExtractorRunnerMap<StateType> = selectorParams?.extractorRunnerMap ?? emptyAsyncSelectorMap;

  switch (selectorParams.extractor.queryType) {
    case "extractorForRecordOfExtractors": {
      return asyncExtractWithManyExtractors(
        state,
        selectorParams as AsyncExtractorRunnerParams<ExtractorForRecordOfExtractors, StateType>
      );
      break;
    }
    case "domainModelSingleExtractor": {
      const result = asyncInnerSelectElementFromQuery(
        state,
        selectorParams.extractor.contextResults,
        selectorParams.extractor.pageParams,
        selectorParams.extractor.queryParams,
        localSelectorMap as any,
        selectorParams.extractor.deploymentUuid,
        {},
        selectorParams.extractor.select
      );
      return result;
        break;
      }
    default: {
      return Promise.resolve({ elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } });
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

export const asyncExtractWithManyExtractors = async <StateType>(
  state: StateType,
  selectorParams: AsyncExtractorRunnerParams<ExtractorForRecordOfExtractors, StateType>,
): Promise<DomainElementObject> => {

  // log.info("########## extractWithManyExtractors begin, query", selectorParams);


  const context: DomainElementObject = {
    elementType: "object",
    elementValue: { ...selectorParams.extractor.contextResults.elementValue },
  };
  // log.info("########## DomainSelector extractWithManyExtractors will use context", context);
  const localSelectorMap: AsyncExtractorRunnerMap<StateType> =
    selectorParams?.extractorRunnerMap ?? emptyAsyncSelectorMap;

  const extractorsPromises = Object.entries(selectorParams.extractor.extractors ?? {}).map((query: [string, QuerySelect]) => {
    return asyncInnerSelectElementFromQuery(
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
      selectorParams.extractor.extractors??{} as any,
      query[1]
    ).then((result):[string, DomainElement] => {
      return [query[0], result];
    });
  });

  // TODO: remove await / side effect
  await Promise.all(extractorsPromises).then((results) => {
    results.forEach((result) => {
      context.elementValue[result[0]] = result[1]; // does side effect!
    });
    return context;
  });

  const transformerPromises = Object.entries(selectorParams.extractor.queryTransformers ?? {}).map(
    (query: [string, QuerySelect]) => {
      return asyncInnerSelectElementFromQuery(
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
        selectorParams.extractor.extractors??{} as any,
        query[1]
      ).then((result): [string, DomainElement] => {
        return [query[0], result];
      });
    }
  );
  await Promise.all(transformerPromises).then((results) => {
    results.forEach((result) => {
      context.elementValue[result[0]] = result[1]; // does side effect!
    });
    return context;
  });
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

// // ################################################################################################
// // ################################################################################################
// // JZOD SCHEMAs selectors
// // ################################################################################################
// // ################################################################################################
// export const extractzodSchemaForSingleSelectQuery = <StateType>(
//   deploymentEntityState: StateType,
//   selectorParams: ExtractorRunnerParamsForJzodSchema<DomainModelGetSingleSelectQueryJzodSchemaExtractor, StateType>
// ): JzodObject | undefined => {
//   if (
//     selectorParams.query.select.queryType=="literal" ||
//     selectorParams.query.select.queryType=="queryContextReference" ||
//     selectorParams.query.select.queryType=="extractorTransformer" ||
//     selectorParams.query.select.queryType=="extractorWrapperReturningObject" ||
//     selectorParams.query.select.queryType=="wrapperReturningObject" ||
//     selectorParams.query.select.queryType=="extractorWrapperReturningList" ||
//     selectorParams.query.select.queryType=="wrapperReturningList" ||
//     selectorParams.query.select.queryType=="queryCombiner" 
//   ) {
//     throw new Error(
//       "extractzodSchemaForSingleSelectQuery can not deal with context reference: query=" +
//         JSON.stringify(selectorParams.query, undefined, 2)
//     );
//   }

//   const entityUuidDomainElement: DomainElement = resolveContextReference(
//     selectorParams.query.select.parentUuid,
//     selectorParams.query.queryParams,
//     selectorParams.query.contextResults
//   );
//   log.info(
//     "extractzodSchemaForSingleSelectQuery called",
//     selectorParams.query,
//     "found",
//     entityUuidDomainElement
//   );

//   if (typeof entityUuidDomainElement != "object" || entityUuidDomainElement.elementType != "instanceUuid") {
//     return undefined
//   }

//   const result = selectorParams.extractorRunnerMap.extractEntityJzodSchema(deploymentEntityState, {
//     extractorRunnerMap: selectorParams.extractorRunnerMap,
//     query: {
//       queryType: "getEntityDefinition",
//       contextResults: { elementType: "object", elementValue: {} },
//       pageParams: selectorParams.query.pageParams,
//       queryParams: selectorParams.query.queryParams,
//       deploymentUuid: selectorParams.query.deploymentUuid ?? "",
//       entityUuid: entityUuidDomainElement.elementValue,
//     },
//   } as ExtractorRunnerParamsForJzodSchema<DomainModelGetEntityDefinitionExtractor,StateType>) as JzodObject | undefined

//   return result;
// }

// // ################################################################################################
// export const extractJzodSchemaForDomainModelQuery = <StateType>(
//   deploymentEntityState: StateType,
//   selectorParams: ExtractorRunnerParamsForJzodSchema<DomainModelQueryJzodSchemaParams, StateType>
// ): RecordOfJzodElement | JzodElement | undefined => {
//   switch (selectorParams.query.queryType) {
//     case "getEntityDefinition":{ 
//       return selectorParams.extractorRunnerMap.extractEntityJzodSchema(
//         deploymentEntityState,
//         selectorParams as ExtractorRunnerParamsForJzodSchema<DomainModelGetEntityDefinitionExtractor, StateType>
//       );
//       break;
//     }
//     case "getFetchParamsJzodSchema": {
//       return selectorParams.extractorRunnerMap.extractFetchQueryJzodSchema(
//         deploymentEntityState,
//         selectorParams as ExtractorRunnerParamsForJzodSchema<DomainModelGetFetchParamJzodSchemaExtractor, StateType>
//       );
//       break;
//     }
//     case "getSingleSelectQueryJzodSchema": {
//       return selectorParams.extractorRunnerMap.extractzodSchemaForSingleSelectQuery(
//         deploymentEntityState,
//         selectorParams as ExtractorRunnerParamsForJzodSchema<DomainModelGetSingleSelectQueryJzodSchemaExtractor, StateType>
//       );
//       break;
//     }
//     default:
//       return undefined;
//       break;
//   }
// };

// // ################################################################################################
// /**
//  * the queryTransformers and FetchQueryJzodSchema should depend only on the instance of Report at hand
//  * then on the instance of the required entities (which can change over time, on refresh!! Problem: their number can vary!!)
//  * @param deploymentEntityState 
//  * @param query 
//  * @returns 
//  */
// export const extractFetchQueryJzodSchema = <StateType>(
//   deploymentEntityState: StateType,
//   selectorParams: ExtractorRunnerParamsForJzodSchema<DomainModelGetFetchParamJzodSchemaExtractor, StateType>
// ):  RecordOfJzodObject | undefined => {
//   const localFetchParams: ExtractorForRecordOfExtractors = selectorParams.query.fetchParams
//   // log.info("selectFetchQueryJzodSchemaFromDomainState called", selectorParams.query);
  
//   const fetchQueryJzodSchema = Object.fromEntries(
//     Object.entries(localFetchParams?.queryTransformers??{}).map((entry: [string, QuerySelect]) => [
//       entry[0],
//       selectorParams.extractorRunnerMap.extractzodSchemaForSingleSelectQuery(deploymentEntityState, {
//         extractorRunnerMap:selectorParams.extractorRunnerMap,
//         query: {
//           queryType: "getSingleSelectQueryJzodSchema",
//           deploymentUuid: localFetchParams.deploymentUuid,
//           contextResults: { elementType: "object", elementValue: {} },
//           pageParams: selectorParams.query.pageParams,
//           queryParams: selectorParams.query.queryParams,
//           select: entry[1],
//           // domainSingleExtractor: {
//           //   queryType: "domainSingleExtractor",
//           //   deploymentUuid: localFetchParams.deploymentUuid,
//           //   select: entry[1],
//           // },
//         },
//       } as ExtractorRunnerParamsForJzodSchema<DomainModelGetSingleSelectQueryJzodSchemaExtractor, StateType>),
//     ])
//   ) as RecordOfJzodObject;

//   // if (localFetchParams.queryTransformers?.crossJoin) {
//   //   fetchQueryJzodSchema["crossJoin"] = {
//   //     type: "object",
//   //     definition: Object.fromEntries(
//   //     Object.entries(fetchQueryJzodSchema[localFetchParams.queryTransformers?.crossJoin?.a ?? ""]?.definition ?? {}).map((a) => [
//   //       "a-" + a[0],
//   //       a[1]
//   //     ]
//   //     ).concat(
//   //       Object.entries(fetchQueryJzodSchema[localFetchParams.queryTransformers?.crossJoin?.b ?? ""]?.definition ?? {}).map((b) => [
//   //         "b-" + b[0], b[1]
//   //       ])
//   //     )
//   //   )};
//   // }

//   // log.info("selectFetchQueryJzodSchemaFromDomainState query", JSON.stringify(selectorParams.query, undefined, 2), "fetchQueryJzodSchema", fetchQueryJzodSchema)
//   return fetchQueryJzodSchema;
// };
