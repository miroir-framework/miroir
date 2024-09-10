// ################################################################################################

import { Uuid } from "../0_interfaces/1_core/EntityDefinition.js";
import {
  ApplicationSection,
  DomainElement,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObject,
  EntityInstance,
  ExtractorTemplateForRecordOfExtractors,
  ExtractorTemplateForSingleObject,
  ExtractorTemplateForSingleObjectList,
  MiroirQuery,
  QueryExtractObjectByDirectReference,
  QueryFailed,
  QuerySelectExtractorWrapperReturningList,
  QuerySelectExtractorWrapperReturningObject,
  QueryTemplate,
  TransformerForRuntime
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  AsyncExtractorTemplateRunnerMap,
  AsyncExtractorTemplateRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { cleanLevel } from "./constants.js";
import {
  applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemory,
  applyExtractorTemplateTransformerInMemory,
  resolveContextReference,
} from "./QueryTemplateSelectors.js";
import { applyTransformer } from "./Transformers.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"AsyncExtractorTemplateRunner");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

const emptyAsyncSelectorMap:AsyncExtractorTemplateRunnerMap = {
  extractorType: "async",
  extractWithExtractorTemplate: undefined as any, 
  extractWithManyExtractorTemplates: undefined as any, 
  extractEntityInstance: undefined as any,
  extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory: undefined as any,
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
export const asyncExtractEntityInstanceUuidIndexWithObjectListExtractorTemplate
= (
  selectorParams: AsyncExtractorTemplateRunnerParams<ExtractorTemplateForSingleObjectList>
): Promise<DomainElementInstanceUuidIndexOrFailed> => {
  const result: Promise<DomainElementInstanceUuidIndexOrFailed> =
    (selectorParams?.extractorRunnerMap ?? emptyAsyncSelectorMap).extractEntityInstanceUuidIndex(selectorParams)
    .then((selectedInstancesUuidIndex: DomainElementInstanceUuidIndexOrFailed) => {
      log.info(
        "extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory found selectedInstances", selectedInstancesUuidIndex
      );

      return applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemory(
        selectedInstancesUuidIndex,
        selectorParams.extractorTemplate,
      );
    });
  ;

  return result;
};

// ################################################################################################
export async function asyncApplyExtractorTemplateTransformerInMemory(
  actionRuntimeTransformer: TransformerForRuntime,
  queryParams: Record<string, any>,
  newFetchedData: Record<string, any>,
  // queryParams: DomainElementObject,
  // newFetchedData: DomainElementObject,
  extractorTemplates: Record<string, ExtractorTemplateForSingleObjectList | ExtractorTemplateForSingleObject | ExtractorTemplateForRecordOfExtractors>,
): Promise<DomainElement> {
  return Promise.resolve(applyExtractorTemplateTransformerInMemory(actionRuntimeTransformer, queryParams, newFetchedData));
}

// ################################################################################################
export function asyncInnerSelectElementFromQueryTemplate/*ExtractorTemplateRunner*/(
  newFetchedData: Record<string, any>,
  pageParams: Record<string, any>,
  queryParams: Record<string, any>,
  // newFetchedData: DomainElementObject,
  // pageParams: DomainElementObject,
  // queryParams: DomainElementObject,
  extractorRunnerMap:AsyncExtractorTemplateRunnerMap,
  deploymentUuid: Uuid,
  extractorTemplates: Record<string, ExtractorTemplateForSingleObjectList | ExtractorTemplateForSingleObject | ExtractorTemplateForRecordOfExtractors>,
  query: QueryTemplate
): Promise<DomainElement> {
  switch (query.queryType) {
    case "literal": {
      return Promise.resolve({ elementType: "string", elementValue: query.definition });
      break;
    }
    // ############################################################################################
    // Impure Monads
    case "queryTemplateExtractObjectListByEntity":
    case "selectObjectListByRelation": 
    case "selectObjectListByManyToManyRelation": {
      return extractorRunnerMap.extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory({
        extractorRunnerMap,
        extractorTemplate: {
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
      return extractorRunnerMap.extractEntityInstance({
        extractorRunnerMap,
        extractorTemplate: {
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
      const entries = Object.entries(query.definition);
      const promises = entries.map((e: [string, QueryTemplate]) => {
        return asyncInnerSelectElementFromQueryTemplate(
          newFetchedData,
          pageParams ?? {},
          queryParams ?? {},
          extractorRunnerMap,
          deploymentUuid,
          extractorTemplates,
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
        return asyncInnerSelectElementFromQueryTemplate(
          newFetchedData,
          pageParams ?? {},
          queryParams ?? {},
          extractorRunnerMap,
          deploymentUuid,
          extractorTemplates,
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
      const rootQueryResults = asyncInnerSelectElementFromQueryTemplate(
        newFetchedData,
        pageParams,
        queryParams,
        extractorRunnerMap,
        deploymentUuid,
        extractorTemplates,
        query.rootQuery
      );
      return rootQueryResults.then((rootQueryResults) => {
        if (rootQueryResults.elementType == "instanceUuidIndex") {
          const entries = Object.entries(rootQueryResults.elementValue);
          const promises = entries.map((entry: [string, EntityInstance]) => {
            return asyncInnerSelectElementFromQueryTemplate(
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
              extractorTemplates,
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
    case "queryContextReference": {
      return newFetchedData &&
        // newFetchedData.elementType == "object" &&
        // newFetchedData.elementValue[query.queryReference]
        newFetchedData[query.queryReference]
        ? Promise.resolve(newFetchedData[query.queryReference])
        : Promise.resolve({
            elementType: "failure",
            elementValue: { 
              queryFailure: "ReferenceNotFound", 
              failureOrigin: ["AsyncQuerySelectors", "asyncInnerSelectElementFromQueryTemplate"],
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
export const asyncExtractWithExtractorTemplate /**: SyncExtractorTemplateRunner */= (
  // selectorParams: SyncExtractorTemplateRunnerParams<ExtractorTemplateForRecordOfExtractors, DeploymentEntityState>,
  selectorParams: AsyncExtractorTemplateRunnerParams<
    ExtractorTemplateForSingleObject | ExtractorTemplateForSingleObjectList | ExtractorTemplateForRecordOfExtractors
  >
): Promise<DomainElement> => {
  // log.info("########## extractExtractor begin, query", selectorParams);
  const localSelectorMap: AsyncExtractorTemplateRunnerMap = selectorParams?.extractorRunnerMap ?? emptyAsyncSelectorMap;

  switch (selectorParams.extractorTemplate.queryType) {
    case "extractorTemplateForRecordOfExtractors": {
      return asyncExtractWithManyExtractorTemplates(
        selectorParams as AsyncExtractorTemplateRunnerParams<ExtractorTemplateForRecordOfExtractors>
      );
      break;
    }
    case "extractorTemplateForDomainModelObjects": {
      const result = asyncInnerSelectElementFromQueryTemplate(
        selectorParams.extractorTemplate.contextResults,
        selectorParams.extractorTemplate.pageParams,
        selectorParams.extractorTemplate.queryParams,
        localSelectorMap as any,
        selectorParams.extractorTemplate.deploymentUuid,
        {},
        selectorParams.extractorTemplate.select
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
function resolveQueryTemplate(
  queryTemplate:QueryTemplate,
  queryParams: Record<string, any>,
  contextResults: Record<string, any>,
): MiroirQuery | QueryFailed {
  switch (queryTemplate.queryType) {
    case "literal": {
      return queryTemplate;
    }
    case "queryTemplateExtractObjectListByEntity": {
      if (queryTemplate.filter) {
        return {
          ...queryTemplate,
          queryType: "queryExtractObjectListByEntity",
          parentUuid: resolveContextReference(queryTemplate.parentUuid, queryParams, contextResults).elementValue, // TODO: check for failure!
          filter: {
            attributeName: queryTemplate.filter.attributeName,
            value: resolveContextReference(queryTemplate.filter.value, queryParams, contextResults).elementValue, // TODO: check for failure!
          } 
        } 
      } else {
        return {
          ...queryTemplate,
          queryType: "queryExtractObjectListByEntity",
          parentUuid: resolveContextReference(queryTemplate.parentUuid, queryParams, contextResults).elementValue, // TODO: check for failure!
        } 
      }
      break;
    }
    case "selectObjectByDirectReference": {
      return {
        ...queryTemplate,
        queryType: "selectObjectByDirectReference",
        parentUuid: resolveContextReference(queryTemplate.parentUuid, queryParams, contextResults).elementValue, // TODO: check for failure!
        instanceUuid: resolveContextReference(queryTemplate.parentUuid, queryParams, contextResults).elementValue, // TODO: check for failure!
      }
      break;
    }
    case "extractorWrapperReturningObject": {
      return {
        ...queryTemplate,
        queryType: "extractorWrapperReturningObject",
        definition: Object.fromEntries(Object.entries(queryTemplate.definition).map((e: [string, QueryTemplate]) => [
          e[0],
          resolveQueryTemplate(e[1], queryParams, contextResults) as QueryExtractObjectByDirectReference, // TODO: generalize to MiroirQuery & check for failure!
        ])),
      };
      break;
    }
    case "extractorWrapperReturningList":{
      return {
        ...queryTemplate,
        queryType: "extractorWrapperReturningList",
        definition: queryTemplate.definition.map((e:QueryTemplate) => resolveQueryTemplate(e, queryParams, contextResults) as QuerySelectExtractorWrapperReturningList),
      }
      break;
    }
    case "wrapperReturningObject": {
      return {
        ...queryTemplate,
        // queryType: "wrapperReturningObject",
        definition: Object.fromEntries(Object.entries(queryTemplate.definition).map((e: [string, QueryTemplate]) => [
          e[0],
          resolveQueryTemplate(e[1], queryParams, contextResults) as MiroirQuery, // TODO: generalize to MiroirQuery & check for failure!
        ])),
      };
      break;
    }
    case "wrapperReturningList": {
      return {
        ...queryTemplate,
        // queryType: "extractorWrapperReturningList",
        definition: queryTemplate.definition.map((e:QueryTemplate) => resolveQueryTemplate(e, queryParams, contextResults) as MiroirQuery),
      }
      break;
    }
    case "selectObjectListByRelation": {
      return {
        ...queryTemplate,
        parentUuid: resolveContextReference(queryTemplate.parentUuid, queryParams, contextResults).elementValue, // TODO: check for failure!
        objectReference: resolveContextReference(queryTemplate.objectReference, queryParams, contextResults).elementValue, // TODO: check for failure!
      }
      break;
    }
    case "selectObjectListByManyToManyRelation": {
      return {
        ...queryTemplate,
        parentUuid: resolveContextReference(queryTemplate.parentUuid, queryParams, contextResults).elementValue, // TODO: check for failure!
        objectListReference: resolveContextReference(queryTemplate.objectListReference, queryParams, contextResults).elementValue, // TODO: check for failure!
      }
      break;
    }
    case "selectObjectByRelation": {
      return {
        ...queryTemplate,
        parentUuid: resolveContextReference(queryTemplate.parentUuid, queryParams, contextResults).elementValue, // TODO: check for failure!
        objectReference: resolveContextReference(queryTemplate.objectReference, queryParams, contextResults).elementValue, // TODO: check for failure!
      }
      break;
    }
    case "queryCombiner": {
      return {
        ...queryTemplate,
        rootQuery: resolveQueryTemplate(queryTemplate.rootQuery, queryParams, contextResults) as MiroirQuery, // TODO: check for failure!
        subQuery: {
          ...queryTemplate.subQuery,
          query: resolveQueryTemplate(queryTemplate.subQuery.query, queryParams, contextResults) as MiroirQuery, // TODO: check for failure!
        }
      }
      break;
    }
    case "queryContextReference": {
      return queryTemplate;
      break;
    }
    default: {
      return {
        queryFailure: "QueryNotExecutable",
        failureOrigin: ["AsyncQuerySelectors", "resolveQueryTemplate"],
        query: JSON.stringify(queryTemplate),
      };
      break;
    }
  }
  
}


// ################################################################################################
/**
 * StateType is the type of the deploymentEntityState, which may be a DeploymentEntityState or a DeploymentEntityStateWithUuidIndex
 * 
 * 
 * @param state: StateType
 * @param selectorParams 
 * @returns 
 */

export const asyncExtractWithManyExtractorTemplates = async (
  // state: StateType,
  selectorParams: AsyncExtractorTemplateRunnerParams<ExtractorTemplateForRecordOfExtractors>,
): Promise<DomainElementObject> => {

  log.info("########## asyncExtractWithManyExtractorTemplates begin, selectorParams", JSON.stringify(selectorParams, null, 2));


  // const context: DomainElementObject = {
  //   elementType: "object",
  //   elementValue: { ...selectorParams.extractor.contextResults.elementValue },
  // };
  const context: Record<string, any> = {
    ...selectorParams.extractorTemplate.contextResults.elementValue ,
  };
  // log.info("########## DomainSelector asyncExtractWithManyExtractorTemplates will use context", context);
  const localSelectorMap: AsyncExtractorTemplateRunnerMap =
    selectorParams?.extractorRunnerMap ?? emptyAsyncSelectorMap;

  const extractorsPromises = Object.entries(selectorParams.extractorTemplate.extractorTemplates ?? {}).map(
    (query: [string, QueryTemplate]) => {
      return asyncInnerSelectElementFromQueryTemplate(
        context,
        selectorParams.extractorTemplate.pageParams,
        {
          ...selectorParams.extractorTemplate.pageParams,
          ...selectorParams.extractorTemplate.queryParams,
        },
        localSelectorMap as any,
        selectorParams.extractorTemplate.deploymentUuid,
        selectorParams.extractorTemplate.extractorTemplates ?? ({} as any),
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
  log.info("########## asyncExtractWithManyExtractorTemplates combinerTemplates", JSON.stringify(selectorParams.extractorTemplate.combinerTemplates));
  const combinerPromises = Object.entries(selectorParams.extractorTemplate.combinerTemplates ?? {})
  .map((query: [string, QueryTemplate]) => {
    return asyncInnerSelectElementFromQueryTemplate(
      context,
      selectorParams.extractorTemplate.pageParams,
      {
        ...selectorParams.extractorTemplate.pageParams,
        ...selectorParams.extractorTemplate.queryParams,
      },
      localSelectorMap as any,
      selectorParams.extractorTemplate.deploymentUuid,
      selectorParams.extractorTemplate.extractorTemplates ?? ({} as any),
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

  log.info("########## asyncExtractWithManyExtractorTemplates runtimeTransformers", JSON.stringify(selectorParams.extractorTemplate.runtimeTransformers));
  for (const transformer of Object.entries(selectorParams.extractorTemplate.runtimeTransformers ?? {})) {
    // const result = await promise;
    const result = await localSelectorMap.applyExtractorTransformer(transformer[1], {
      elementType: "object",
      elementValue: {
        ...selectorParams.extractorTemplate.pageParams.elementValue,
        ...selectorParams.extractorTemplate.queryParams.elementValue,
      },
    }, context, selectorParams.extractorTemplate.extractorTemplates ?? ({} as any)).then((result): [string, DomainElement] => {
      return [transformer[0], result.elementValue]; // TODO: check for failure!
    });
    context[result[0]] = result[1]; // does side effect!
    log.info(
      "asyncExtractWithManyExtractorTemplates for result[0]",
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
