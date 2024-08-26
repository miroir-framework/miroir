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
import { applyExtractorForSingleObjectListToSelectedInstancesUuidIndex, applyExtractorTransformer, resolveContextReference } from "./QuerySelectors.js";
import { applyTransformer } from "./Transformers.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"AsyncExtractorRunner");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

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

// ################################################################################################
export async function asyncApplyExtractorTransformerInMemory(
  query: QueryExtractorTransformer,
  queryParams: DomainElementObject,
  newFetchedData: DomainElementObject,
  extractors: Record<string, ExtractorForSingleObjectList | ExtractorForSingleObject | ExtractorForRecordOfExtractors>,
): Promise<DomainElement> {
  return Promise.resolve(applyExtractorTransformer(query, queryParams, newFetchedData));
  // const resolvedReference = resolveContextReference(
  //   query.referencedExtractor,
  //   queryParams,
  //   newFetchedData
  // );

  // log.info("asyncInnerSelectElementFromQuery extractorTransformer resolvedReference", resolvedReference);

  // const result = new Set<string>();
  // if (resolvedReference.elementType == "instanceUuidIndex") {
  //   for (const entry of Object.entries(resolvedReference.elementValue)) {
  //     result.add((entry[1] as any)[query.attribute]);
  //   }
  //   log.info("asyncInnerSelectElementFromQuery extractorTransformer result", JSON.stringify(Array.from(result.values())));
  //   return Promise.resolve({ elementType: "any", elementValue: [...result] });
  // }

  // return Promise.resolve({ elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } });
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
      return extractorRunnerMap.applyExtractorTransformer(query, queryParams, newFetchedData, extractors);
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

  const extractorsPromises = Object.entries(selectorParams.extractor.extractors ?? {}).map(
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
        selectorParams.extractor.extractors ?? ({} as any),
        query[1]
      ).then((result): [string, DomainElement] => {
        return [query[0], result];
      });
    }
  );

  // TODO: remove await / side effect
  await Promise.all(extractorsPromises).then((results) => {
    results.forEach((result) => {
      context.elementValue[result[0]] = result[1]; // does side effect!
    });
    return context;
  });

  const combinerAndtransformerPromises = Object.entries(selectorParams.extractor.combiners ?? {})
    .concat(Object.entries(selectorParams.extractor.runtimeTransformers ?? {}))
    .map((query: [string, QuerySelect]) => {
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
        selectorParams.extractor.extractors ?? ({} as any),
        query[1]
      ).then((result): [string, DomainElement] => {
        return [query[0], result];
      });
    });
  await Promise.all(combinerAndtransformerPromises).then((results) => {
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
