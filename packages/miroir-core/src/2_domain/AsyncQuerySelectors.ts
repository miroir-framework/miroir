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
  ExtractorForRecordOfExtractors,
  ExtractorForSingleObject,
  ExtractorForSingleObjectList,
  MiroirQuery,
  QueryFailed
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  AsyncExtractorRunnerMap,
  AsyncExtractorRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/Logger";
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { cleanLevel } from "./constants";
import { applyExtractorForSingleObjectListToSelectedInstancesListInMemory, applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory, applyExtractorTransformerInMemory } from "./QuerySelectors";
import { resolveQueryTemplate } from "./Templates";
import { applyTransformer } from "./Transformers";

const loggerName: string = getLoggerName(packageName, cleanLevel,"AsyncExtractorTemplateRunner");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

const emptyAsyncSelectorMap:AsyncExtractorRunnerMap = {
  extractorType: "async",
  extractWithExtractor: undefined as any, 
  extractWithManyExtractors: undefined as any, 
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
  selectorParams: AsyncExtractorRunnerParams<ExtractorForSingleObjectList>
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
  selectorParams: AsyncExtractorRunnerParams<ExtractorForSingleObjectList>
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
  extractors: Record<string, ExtractorForSingleObjectList | ExtractorForSingleObject | ExtractorForRecordOfExtractors>,
): Promise<DomainElement> {
  return Promise.resolve(applyExtractorTransformerInMemory(actionRuntimeTransformer, queryParams, newFetchedData));
}

// ################################################################################################
export function asyncInnerSelectElementFromQuery/*ExtractorTemplateRunner*/(
  newFetchedData: Record<string, any>,
  pageParams: Record<string, any>,
  queryParams: Record<string, any>,
  extractorRunnerMap:AsyncExtractorRunnerMap,
  deploymentUuid: Uuid,
  extractors: Record<string, ExtractorForSingleObjectList | ExtractorForSingleObject | ExtractorForRecordOfExtractors>,
  query: MiroirQuery
): Promise<DomainElement> {
  switch (query.queryType) {
    case "literal": {
      return Promise.resolve({ elementType: "string", elementValue: query.definition });
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
          queryType: "extractorForDomainModelObjects",
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
    case "extractorCombinerForObjectByRelation":
    case "extractorForObjectByDirectReference": {
      return extractorRunnerMap.extractEntityInstance({
        extractorRunnerMap,
        extractor: {
          queryType: "extractorForDomainModelObjects",
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
      const promises = entries.map((e: [string, MiroirQuery]) => {
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
    case "extractorWrapperReturningList":
    case "wrapperReturningList": { // List map
      const promises = query.definition.map((e) =>{
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
        typeof query.rootExtractorOrReference == "string"
          ? asyncInnerSelectElementFromQuery(
              newFetchedData,
              pageParams,
              queryParams,
              extractorRunnerMap,
              deploymentUuid,
              extractors,
              {
                queryType: "queryContextReference",
                queryReference: query.rootExtractorOrReference,
              }
            )
          : asyncInnerSelectElementFromQuery(
              newFetchedData,
              pageParams,
              queryParams,
              extractorRunnerMap,
              deploymentUuid,
              extractors,
              query.rootExtractorOrReference
            );
      return rootQueryResults.then((rootQueryResults) => {
        if (rootQueryResults.elementType == "instanceUuidIndex") {
          const entries = Object.entries(rootQueryResults.elementValue);
          const promises = entries.map((entry: [string, EntityInstance]) => {
            const innerQueryParams =                 {
              ...queryParams.elementValue,
              ...Object.fromEntries(
                Object.entries(applyTransformer(query.subQueryTemplate.rootQueryObjectTransformer, entry[1]))
              ),
            };

            // TODO: faking context results here! Should we send empty contextResults instead?
            const resolvedQuery: MiroirQuery | QueryFailed = resolveQueryTemplate(query.subQueryTemplate.query,innerQueryParams, innerQueryParams); 
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
              resolvedQuery as MiroirQuery,
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
          return { elementType: "failure", elementValue: { queryFailure: "IncorrectParameters", query: JSON.stringify(query.rootExtractorOrReference) } }
        }
      });

      break;
    }
    case "queryContextReference": {
      return newFetchedData &&
        newFetchedData[query.queryReference]
        ? Promise.resolve(newFetchedData[query.queryReference])
        : Promise.resolve({
            elementType: "failure",
            elementValue: { 
              queryFailure: "ReferenceNotFound", 
              failureOrigin: ["AsyncQuerySelectors", "asyncInnerSelectElementFromQuery"],
              failureMessage: "could not find reference " + query.queryReference + " in context" + JSON.stringify(Object.keys(newFetchedData)),
              queryContext: JSON.stringify(newFetchedData),
              query: JSON.stringify(query) 
            },
          });
      break;
    }
    default: {
      return Promise.resolve({ elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable", query } });
      break;
    }
  }
}

// ################################################################################################
export const asyncExtractWithExtractor /**: SyncExtractorTemplateRunner */= (
  // selectorParams: SyncExtractorTemplateRunnerParams<ExtractorTemplateForRecordOfExtractors, DeploymentEntityState>,
  selectorParams: AsyncExtractorRunnerParams<
    ExtractorForSingleObject | ExtractorForSingleObjectList | ExtractorForRecordOfExtractors
  >
): Promise<DomainElement> => {
  // log.info("########## extractExtractor begin, query", selectorParams);
  const localSelectorMap: AsyncExtractorRunnerMap = selectorParams?.extractorRunnerMap ?? emptyAsyncSelectorMap;

  switch (selectorParams.extractor.queryType) {
    case "extractorForRecordOfExtractors": {
      return asyncExtractWithManyExtractors(
        selectorParams as AsyncExtractorRunnerParams<ExtractorForRecordOfExtractors>
      );
      break;
    }
    case "extractorForDomainModelObjects": {
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

export const asyncExtractWithManyExtractors = async (
  // state: StateType,
  selectorParams: AsyncExtractorRunnerParams<ExtractorForRecordOfExtractors>,
): Promise<DomainElementObject> => {

  // log.info("########## asyncExtractWithManyExtractors begin, query", selectorParams);


  // const context: DomainElementObject = {
  //   elementType: "object",
  //   elementValue: { ...selectorParams.extractor.contextResults.elementValue },
  // };
  const context: Record<string, any> = {
    ...selectorParams.extractor.contextResults.elementValue ,
  };
  // log.info("########## DomainSelector asyncExtractWithManyExtractors will use context", context);
  const localSelectorMap: AsyncExtractorRunnerMap =
    selectorParams?.extractorRunnerMap ?? emptyAsyncSelectorMap;

  const extractorsPromises = Object.entries(selectorParams.extractor.extractors ?? {}).map(
    (query: [string, MiroirQuery]) => {
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
  .map((query: [string, MiroirQuery]) => {
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
      return [query[0], result.elementValue];
    });
  });

  // for (const [key, value] of combinerPromises) {
  //   const result = await value;
  //   context.elementValue[key] = result; // does side effect!
  // }
  for (const promise of combinerPromises) {
    const result = await promise;
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
      "asyncExtractWithManyExtractor for result[0]",
      result[0],
      "context",
      JSON.stringify(Object.keys(context))
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
