// ################################################################################################

import { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import {
  ApplicationSection,
  DomainElement,
  DomainElementInstanceArrayOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObject,
  EntityInstance,
  ExtendedTransformerForRuntime,
  QueryWithExtractorCombinerTransformer,
  QueryForExtractorOrCombinerReturningObject,
  QueryForExtractorOrCombinerReturningObjectList,
  ExtractorOrCombiner,
  QueryFailed,
  ExtractorOrCombinerReturningObjectOrObjectList,
  QueryForExtractorOrCombinerReturningObjectOrObjectList
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  AsyncExtractorOrQueryRunnerMap,
  AsyncExtractorOrQueryRunnerParams,
  AsyncExtractorRunnerParams,
  AsyncExtractWithExtractorOrCombinerReturningObjectOrObjectList
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/Logger";
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { cleanLevel } from "./constants";
import { applyExtractorForSingleObjectListToSelectedInstancesListInMemory, applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory, applyExtractorTransformerInMemory } from "./QuerySelectors";
import { resolveExtractorTemplate } from "./Templates";
import { applyTransformer } from "./Transformers";

const loggerName: string = getLoggerName(packageName, cleanLevel,"AsyncExtractorOrQueryTemplateRunner");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

const emptyAsyncSelectorMap:AsyncExtractorOrQueryRunnerMap = {
  extractorType: "async",
  extractWithExtractorOrCombinerReturningObjectOrObjectList: undefined as any, 
  runQuery: undefined as any, 
  extractEntityInstance: undefined as any,
  extractEntityInstanceUuidIndexWithObjectListExtractor: undefined as any,
  extractEntityInstanceUuidIndex: undefined as any,
  extractEntityInstanceListWithObjectListExtractor: undefined as any,
  extractEntityInstanceList: undefined as any,
  applyExtractorTransformer: undefined as any,
  // ##############################################################################################
  extractWithManyExtractorTemplates: undefined as any,
}

// ################################################################################################
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
export const asyncExtractEntityInstanceUuidIndexWithObjectListExtractor
= (
  selectorParams: AsyncExtractorOrQueryRunnerParams<QueryForExtractorOrCombinerReturningObjectList>
): Promise<DomainElementInstanceUuidIndexOrFailed> => {
  const result: Promise<DomainElementInstanceUuidIndexOrFailed> =
    (selectorParams?.extractorRunnerMap ?? emptyAsyncSelectorMap).extractEntityInstanceUuidIndex(selectorParams)
    .then((selectedInstancesUuidIndex: DomainElementInstanceUuidIndexOrFailed) => {
      log.info(
        "asyncExtractEntityInstanceUuidIndexWithObjectListExtractor found selectedInstances",
        selectedInstancesUuidIndex
      );

      return applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory(
        selectedInstancesUuidIndex,
        selectorParams.extractor,
      );
    });
  ;

  return result;
};
// ################################################################################################
/**
 * returns an Entity Instance List, from a ListQuery
 * @param deploymentEntityState 
 * @param selectorParams 
 * @returns 
 */
export const asyncExtractEntityInstanceListWithObjectListExtractor
= (
  selectorParams: AsyncExtractorOrQueryRunnerParams<QueryForExtractorOrCombinerReturningObjectList>
): Promise<DomainElementInstanceArrayOrFailed> => {
  const result: Promise<DomainElementInstanceArrayOrFailed> =
    (selectorParams?.extractorRunnerMap ?? emptyAsyncSelectorMap).extractEntityInstanceList(selectorParams)
    .then((selectedInstancesUuidIndex: DomainElementInstanceArrayOrFailed) => {
      log.info(
        "asyncExtractEntityInstanceUuidIndexWithObjectListExtractor found selectedInstances",
        selectedInstancesUuidIndex
      );

      return applyExtractorForSingleObjectListToSelectedInstancesListInMemory(
        selectedInstancesUuidIndex,
        selectorParams.extractor,
      );
    });
  ;

  return result;
};

// ################################################################################################
export async function asyncApplyExtractorTransformerInMemory(
  actionRuntimeTransformer: ExtendedTransformerForRuntime,
  queryParams: Record<string, any>,
  newFetchedData: Record<string, any>,
  extractors: Record<string, QueryForExtractorOrCombinerReturningObjectList | QueryForExtractorOrCombinerReturningObject | QueryWithExtractorCombinerTransformer>,
): Promise<DomainElement> {
  return Promise.resolve(applyExtractorTransformerInMemory(actionRuntimeTransformer, queryParams, newFetchedData));
}

// ################################################################################################
export function asyncInnerSelectElementFromQuery/*ExtractorTemplateRunner*/(
  newFetchedData: Record<string, any>,
  pageParams: Record<string, any>,
  queryParams: Record<string, any>,
  extractorRunnerMap:AsyncExtractorOrQueryRunnerMap,
  deploymentUuid: Uuid,
  extractors: Record<string, QueryForExtractorOrCombinerReturningObjectList | QueryForExtractorOrCombinerReturningObject | QueryWithExtractorCombinerTransformer>,
  extractorOrCombiner: ExtractorOrCombiner
): Promise<DomainElement> {
  switch (extractorOrCombiner.extractorOrCombinerType) {
    case "literal": {
      return Promise.resolve({ elementType: "string", elementValue: extractorOrCombiner.definition });
      break;
    }
    // ############################################################################################
    // Impure Monads
    case "extractorByEntityReturningObjectList":
    case "combinerByRelationReturningObjectList": 
    case "combinerByManyToManyRelationReturningObjectList": {
      // return extractorRunnerMap.extractEntityInstanceUuidIndexWithObjectListExtractor({
      return extractorRunnerMap.extractEntityInstanceListWithObjectListExtractor({
        extractorRunnerMap,
        extractor: {
          queryType: "queryForExtractorOrCombinerReturningObjectList",
          deploymentUuid: deploymentUuid,
          contextResults: newFetchedData,
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
      return extractorRunnerMap.extractEntityInstance({
        extractorRunnerMap,
        extractor: {
          queryType: "queryForExtractorOrCombinerReturningObject",
          deploymentUuid: deploymentUuid,
          contextResults: newFetchedData,
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
    case "extractorWrapperReturningObject": { // build object
      const entries = Object.entries(extractorOrCombiner.definition);
      const promises = entries.map((e: [string, ExtractorOrCombiner]) => {
        return asyncInnerSelectElementFromQuery(
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
    case "extractorWrapperReturningList": { // List map
      const promises = extractorOrCombiner.definition.map((e) =>{
        return asyncInnerSelectElementFromQuery(
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
    case "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList": { // join
      const rootQueryResults =
        typeof extractorOrCombiner.rootExtractorOrReference == "string"
          ? asyncInnerSelectElementFromQuery(
              newFetchedData,
              pageParams,
              queryParams,
              extractorRunnerMap,
              deploymentUuid,
              extractors,
              {
                extractorOrCombinerType: "extractorOrCombinerContextReference",
                extractorOrCombinerContextReference: extractorOrCombiner.rootExtractorOrReference,
              }
            )
          : asyncInnerSelectElementFromQuery(
              newFetchedData,
              pageParams,
              queryParams,
              extractorRunnerMap,
              deploymentUuid,
              extractors,
              extractorOrCombiner.rootExtractorOrReference
            );
      return rootQueryResults.then((rootQueryResults) => {
        if (rootQueryResults.elementType == "instanceUuidIndex") {
          const entries = Object.entries(rootQueryResults.elementValue);
          const promises = entries.map((entry: [string, EntityInstance]) => {
            const innerQueryParams =                 {
              ...queryParams.elementValue,
              ...Object.fromEntries(
                Object.entries(applyTransformer(extractorOrCombiner.subQueryTemplate.rootQueryObjectTransformer, entry[1]))
              ),
            };

            // TODO: faking context results here! Should we send empty contextResults instead?
            const resolvedQuery: ExtractorOrCombiner | QueryFailed = resolveExtractorTemplate(extractorOrCombiner.subQueryTemplate.query,innerQueryParams, innerQueryParams); 
            if ("QueryFailure" in resolvedQuery) {
              return [
                (entry[1] as any).uuid??"no uuid found for entry " + entry[0],
                resolvedQuery
              ];
            }

            return asyncInnerSelectElementFromQuery(
              newFetchedData,
              pageParams,
              innerQueryParams,
              // {
              //   elementType: "object",
              //   elementValue: {
              //     ...queryParams.elementValue,
              //     ...Object.fromEntries(
              //       Object.entries(applyTransformer(query.subQueryTemplate.rootQueryObjectTransformer, entry[1])).map(
              //         (e: [string, any]) => [e[0], { elementType: "instanceUuid", elementValue: e[1] }]
              //       )
              //     ),
              //   },
              // },
              extractorRunnerMap,
              deploymentUuid,
              extractors,
              resolvedQuery as ExtractorOrCombiner,
              // query.subQueryTemplate.query
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
          return { elementType: "failure", elementValue: { queryFailure: "IncorrectParameters", query: JSON.stringify(extractorOrCombiner.rootExtractorOrReference) } }
        }
      });

      break;
    }
    case "extractorOrCombinerContextReference": {
      return newFetchedData &&
        newFetchedData[extractorOrCombiner.extractorOrCombinerContextReference]
        ? Promise.resolve(newFetchedData[extractorOrCombiner.extractorOrCombinerContextReference])
        : Promise.resolve({
            elementType: "failure",
            elementValue: { 
              queryFailure: "ReferenceNotFound", 
              failureOrigin: ["AsyncQuerySelectors", "asyncInnerSelectElementFromQuery"],
              failureMessage: "could not find extractorOrCombinerContextReference " + extractorOrCombiner.extractorOrCombinerContextReference + " in context" + JSON.stringify(Object.keys(newFetchedData)),
              queryContext: JSON.stringify(newFetchedData),
              query: JSON.stringify(extractorOrCombiner) 
            },
          });
      break;
    }
    default: {
      return Promise.resolve({ elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable", query: extractorOrCombiner } });
      break;
    }
  }
}

// ################################################################################################
export const asyncExtractWithExtractor: AsyncExtractWithExtractorOrCombinerReturningObjectOrObjectList /**: SyncExtractorOrQueryTemplateRunner */= (
  // selectorParams: SyncExtractorOrQueryTemplateRunnerParams<QueryTemplateWithExtractorCombinerTransformer, DeploymentEntityState>,
  selectorParams: AsyncExtractorRunnerParams<
    QueryForExtractorOrCombinerReturningObjectOrObjectList
  >
): Promise<DomainElement> => {
  // log.info("########## extractExtractor begin, query", selectorParams);
  const localSelectorMap: AsyncExtractorOrQueryRunnerMap = selectorParams?.extractorRunnerMap ?? emptyAsyncSelectorMap;

  const result = asyncInnerSelectElementFromQuery(
    selectorParams.extractor.contextResults,
    selectorParams.extractor.pageParams,
    selectorParams.extractor.queryParams,
    localSelectorMap as any,
    selectorParams.extractor.deploymentUuid,
    {},
    selectorParams.extractor.select
  );
  return result;

  // switch (selectorParams.extractor.queryType) {
  //   // case "queryWithExtractorCombinerTransformer": {
  //   //   return asyncRunQuery(
  //   //     selectorParams as AsyncExtractorOrQueryRunnerParams<QueryWithExtractorCombinerTransformer>
  //   //   );
  //   //   break;
  //   // }
  //   case "queryForExtractorOrCombinerReturningObject":
  //   case "queryForExtractorOrCombinerReturningObjectList": {
  //     const result = asyncInnerSelectElementFromQuery(
  //       selectorParams.extractor.contextResults,
  //       selectorParams.extractor.pageParams,
  //       selectorParams.extractor.queryParams,
  //       localSelectorMap as any,
  //       selectorParams.extractor.deploymentUuid,
  //       {},
  //       selectorParams.extractor.select
  //     );
  //     return result;
  //       break;
  //     }
  //   default: {
  //     return Promise.resolve({ elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } });
  //     break;
  //   }
  // }

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

export const asyncRunQuery = async (
  // state: StateType,
  selectorParams: AsyncExtractorOrQueryRunnerParams<QueryWithExtractorCombinerTransformer>,
): Promise<DomainElementObject> => {

  // log.info("########## asyncRunQuery begin, query", selectorParams);


  // const context: DomainElementObject = {
  //   elementType: "object",
  //   elementValue: { ...selectorParams.extractor.contextResults.elementValue },
  // };
  const context: Record<string, any> = {
    ...selectorParams.extractor.contextResults.elementValue ,
  };
  // log.info("########## DomainSelector asyncRunQuery will use context", context);
  const localSelectorMap: AsyncExtractorOrQueryRunnerMap =
    selectorParams?.extractorRunnerMap ?? emptyAsyncSelectorMap;

  const extractorsPromises = Object.entries(selectorParams.extractor.extractors ?? {}).map(
    (query: [string, ExtractorOrCombiner]) => {
      return asyncInnerSelectElementFromQuery(
        context,
        selectorParams.extractor.pageParams,
        {
          ...selectorParams.extractor.pageParams,
          ...selectorParams.extractor.queryParams,
        },
        localSelectorMap as any,
        selectorParams.extractor.deploymentUuid,
        selectorParams.extractor.extractors ?? ({} as any),
        query[1]
      ).then((result): [string, DomainElement] => {
        return [query[0], result.elementValue]; // TODO: check for failure!
      });
    }
  );

  // TODO: remove await / side effect
  for (const promise of extractorsPromises) {
    const result = await promise;
    log.info("asyncRunQuery for extractor", result[0], "result", JSON.stringify(result[1], null, 2));
    context[result[0]] = result[1]; // does side effect!
  }
  // await Promise.all(extractorsPromises).then((results) => {
  //   results.forEach((result) => {
  //     // context.elementValue[result[0]] = result[1]; // does side effect!
  //     context[result[0]] = result[1]; // does side effect!
  //   });
  //   return context;
  // });

  const combinerPromises = Object.entries(selectorParams.extractor.combiners ?? {})
  .map((query: [string, ExtractorOrCombiner]) => {
    return asyncInnerSelectElementFromQuery(
      context,
      selectorParams.extractor.pageParams,
      {
        ...selectorParams.extractor.pageParams,
        ...selectorParams.extractor.queryParams,
      },
      localSelectorMap as any,
      selectorParams.extractor.deploymentUuid,
      selectorParams.extractor.extractors ?? ({} as any),
      query[1]
    ).then((result): [string, DomainElement] => {
      // log.info("asyncRunQuery for combiner", query[0], "context", JSON.stringify(result.elementValue));
      return [query[0], result.elementValue];
    });
  });

  // for (const [key, value] of combinerPromises) {
  //   const result = await value;
  //   context.elementValue[key] = result; // does side effect!
  // }
  for (const promise of combinerPromises) {
    const result = await promise;
    log.info("asyncRunQuery for combiner", result[0], "result", JSON.stringify(result[1], null, 2));
    context[result[0]] = result[1]; // does side effect!
  }
  // await Promise.all(combinerPromises).then((results) => {
  //   results.forEach((result) => {
  //     context.elementValue[result[0]] = result[1]; // does side effect!
  //   });
  //   return context;
  // });


  for (const transformer of Object.entries(selectorParams.extractor.runtimeTransformers ?? {})) {
    // const result = await promise;
    const result = await localSelectorMap.applyExtractorTransformer(transformer[1], {
      elementType: "object",
      elementValue: {
        ...selectorParams.extractor.pageParams.elementValue,
        ...selectorParams.extractor.queryParams.elementValue,
      },
    }, context, selectorParams.extractor.extractors ?? ({} as any)).then((result): [string, DomainElement] => {
      return [transformer[0], result.elementValue]; // TODO: check for failure!
    });
    context[result[0]] = result[1]; // does side effect!
    log.info(
      "asyncRunQuery for runtimeTransformer",
      result[0],
      "result",
      // JSON.stringify(Object.keys(context))
      JSON.stringify(result[1], null, 2)
    );
  }
  // return context;
  // log.info(
  //   "extractWithManyExtractorTemplates",
  //   "query",
  //   selectorParams,
  //   "domainState",
  //   deploymentEntityState,
  //   "newFetchedData",
  //   context
  // );
  return { elementType: "object", elementValue: context};
};
