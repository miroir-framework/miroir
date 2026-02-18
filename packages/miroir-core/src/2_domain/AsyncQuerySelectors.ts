// ################################################################################################

import { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import {
  BoxedExtractorOrCombinerReturningObject,
  BoxedExtractorOrCombinerReturningObjectList,
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  BoxedQueryWithExtractorCombinerTransformer,
  DomainElementSuccess,
  EntityInstance,
  EntityInstancesUuidIndex,
  ExtractorOrCombiner,
  QueryFailed,
  TransformerForBuildPlusRuntime
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { Domain2ElementFailed, Domain2QueryReturnType } from "../0_interfaces/2_domain/DomainElement";
import {
  AsyncBoxedExtractorOrQueryRunnerMap,
  AsyncBoxedExtractorRunnerParams,
  AsyncExtractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
  AsyncQueryRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import {
  applyExtractorForSingleObjectListToSelectedInstancesListInMemory,
  applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory,
  applyExtractorTransformerInMemory,
} from "./QuerySelectors";
import { resolveExtractorTemplate } from "./Templates";
import { type MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { applyTransformer } from "./TransformersForRuntime";
import { ApplicationDeploymentMap } from "../1_core/Deployment";
import { getApplicationSection } from "../1_core/Model";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "AsyncQuerySelectors")
).then((logger: LoggerInterface) => {log = logger});


const emptyAsyncSelectorMap:AsyncBoxedExtractorOrQueryRunnerMap = {
  extractorOrCombinerType: "async",
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
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
/**
 * returns an Entity Instance List, from a ListQuery
 * @param deploymentEntityState 
 * @param foreignKeyParams 
 * @returns 
 */
export const asyncExtractEntityInstanceUuidIndexWithObjectListExtractor
= (
  foreignKeyParams: AsyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList>,
  applicationDeploymentMap: ApplicationDeploymentMap,
  modelEnvironment: MiroirModelEnvironment,
): Promise<Domain2QueryReturnType<EntityInstancesUuidIndex>> => {
  const result: Promise<Domain2QueryReturnType<EntityInstancesUuidIndex>> = (
    foreignKeyParams?.extractorRunnerMap ?? emptyAsyncSelectorMap
  )
    .extractEntityInstanceUuidIndex(foreignKeyParams, applicationDeploymentMap, modelEnvironment)
    .then((selectedInstancesUuidIndex: Domain2QueryReturnType<EntityInstancesUuidIndex>) => {
      // log.info(
      //   "asyncExtractEntityInstanceUuidIndexWithObjectListExtractor found selectedInstances",
      //   selectedInstancesUuidIndex
      // );

      return applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory(
        selectedInstancesUuidIndex,
        foreignKeyParams.extractor
      );
    });
  ;

  return result;
};
// ################################################################################################
/**
 * returns an Entity Instance List, from a ListQuery
 * @param deploymentEntityState 
 * @param foreignKeyParams 
 * @returns 
 */
export const asyncExtractEntityInstanceListWithObjectListExtractor
= (
  foreignKeyParams: AsyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList>,
  applicationDeploymentMap: ApplicationDeploymentMap,
  modelEnvironment: MiroirModelEnvironment,
): Promise<Domain2QueryReturnType<EntityInstance[]>> => {
  const result: Promise<Domain2QueryReturnType<EntityInstance[]>> = (
    foreignKeyParams?.extractorRunnerMap ?? emptyAsyncSelectorMap
  )
    .extractEntityInstanceList(foreignKeyParams, applicationDeploymentMap, modelEnvironment)
    .then((selectedInstancesUuidIndex: Domain2QueryReturnType<EntityInstance[]>) => {
      // log.info(
      //   "asyncExtractEntityInstanceUuidIndexWithObjectListExtractor found selectedInstances",
      //   selectedInstancesUuidIndex
      // );

      return applyExtractorForSingleObjectListToSelectedInstancesListInMemory(
        selectedInstancesUuidIndex,
        foreignKeyParams.extractor
      );
    });
  ;

  return result;
};

// ################################################################################################
export async function asyncApplyExtractorTransformerInMemory(
  actionRuntimeTransformer: TransformerForBuildPlusRuntime,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>,
  newFetchedData: Record<string, any>,
  extractors: Record<
    string,
    | BoxedExtractorOrCombinerReturningObjectList
    | BoxedExtractorOrCombinerReturningObject
    | BoxedQueryWithExtractorCombinerTransformer
  >
): Promise<Domain2QueryReturnType<DomainElementSuccess>> {
  return Promise.resolve(
    applyExtractorTransformerInMemory(actionRuntimeTransformer, modelEnvironment, queryParams, newFetchedData)
  );
}

// ################################################################################################
export async function asyncInnerSelectElementFromQuery /*BoxedExtractorTemplateRunner*/(
  newFetchedData: Record<string, any>,
  pageParams: Record<string, any>,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>,
  extractorRunnerMap: AsyncBoxedExtractorOrQueryRunnerMap,
  application: Uuid,
  applicationDeploymentMap: ApplicationDeploymentMap,
  extractors: Record<
    string,
    | BoxedExtractorOrCombinerReturningObjectList
    | BoxedExtractorOrCombinerReturningObject
    | BoxedQueryWithExtractorCombinerTransformer
  >,
  extractorOrCombiner: ExtractorOrCombiner
): Promise<Domain2QueryReturnType<any>> {
  const deploymentUuid = applicationDeploymentMap[application];
  switch (extractorOrCombiner.extractorOrCombinerType) {
    case "literal": {
      return Promise.resolve(extractorOrCombiner.definition);
      break;
    }
    // ############################################################################################
    // Impure Monads
    case "extractorByEntityReturningObjectList":
    case "combinerByRelationReturningObjectList":
    case "combinerByManyToManyRelationReturningObjectList": {
      const applicationSection =
        extractorOrCombiner.applicationSection ??
        getApplicationSection(application, extractorOrCombiner.parentUuid);
      log.info(
        "############ asyncInnerSelectElementFromQuery",
        extractorOrCombiner.extractorOrCombinerType,
        "start",
        "application",
        application,
        "applicationSection",
        applicationSection,
        "extractorOrCombiner",
        JSON.stringify(extractorOrCombiner, null, 2)
      );
      const result = await extractorRunnerMap.extractEntityInstanceListWithObjectListExtractor(
        {
          extractorRunnerMap,
          extractor: {
            queryType: "boxedExtractorOrCombinerReturningObjectList",
            application,
            contextResults: newFetchedData,
            pageParams,
            queryParams,
            select: extractorOrCombiner.applicationSection
              ? extractorOrCombiner
              : {
                  ...extractorOrCombiner,
                  applicationSection,
                },
          },
        },
        applicationDeploymentMap,
        // queryParams, //
        modelEnvironment
      );
      // log.info(
      //   "############ asyncInnerSelectElementFromQuery",
      //   extractorOrCombiner.extractorOrCombinerType,
      //   "done"
      // );
      return Promise.resolve(result);
      break;
    }
    case "combinerForObjectByRelation":
    case "extractorForObjectByDirectReference": {
      // log.info(
      //   "############ asyncInnerSelectElementFromQuery",
      //   extractorOrCombiner.extractorOrCombinerType,
      //   "start, extractorOrCombiner",
      //   JSON.stringify(extractorOrCombiner, null, 2)
      // );
      // log.info("asyncInnerSelectElementFromQuery", JSON.stringify(extractorOrCombiner, null, 2));
      const result = await extractorRunnerMap.extractEntityInstance(
        {
          extractorRunnerMap,
          extractor: {
            queryType: "boxedExtractorOrCombinerReturningObject",
            application,
            contextResults: newFetchedData,
            pageParams,
            queryParams,
            select: extractorOrCombiner.applicationSection // TODO: UGLY!!! WHERE IS THE APPLICATION SECTION PLACED?
              ? extractorOrCombiner
              : {
                  ...extractorOrCombiner,
                  applicationSection: getApplicationSection(application, extractorOrCombiner.parentUuid),
                },
          },
        },
        applicationDeploymentMap,
        modelEnvironment
      ); 
      // log.info(
      //   "############ asyncInnerSelectElementFromQuery",
      //   extractorOrCombiner.extractorOrCombinerType,
      //   "done, result=", JSON.stringify(result, null, 2)
      // );
      return Promise.resolve(result);
      break;
    }
    // ############################################################################################
    case "extractorWrapperReturningObject": {
      // build object
      const entries = Object.entries(extractorOrCombiner.definition);
      const results: Record<string, any> = {};
      for (const [key, extractor] of entries) {
        const result = await asyncInnerSelectElementFromQuery(
          newFetchedData,
          pageParams ?? {},
          modelEnvironment,
          queryParams ?? {},
          extractorRunnerMap,
          application,
          applicationDeploymentMap,
          extractors,
          extractor
        );
        results[key] = result;
      }
      return results;
      break;
    }
    case "extractorWrapperReturningList": {
      // List map
      const results = [];
      for (const e of extractorOrCombiner.definition) {
        const result = await asyncInnerSelectElementFromQuery(
          newFetchedData,
          pageParams ?? {},
          modelEnvironment,
          queryParams ?? {},
          extractorRunnerMap,
          application,
          applicationDeploymentMap,
          extractors,
          e
        );
        results.push(result);
      }
      return results;
      break;
    }
    case "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList": {
      // join
      const rootQueryResults =
        typeof extractorOrCombiner.rootExtractorOrReference === "string"
          ? await asyncInnerSelectElementFromQuery(
              newFetchedData,
              pageParams,
              modelEnvironment,
              queryParams,
              extractorRunnerMap,
              application,
              applicationDeploymentMap,
              extractors,
              {
                extractorOrCombinerType: "extractorOrCombinerContextReference",
                extractorOrCombinerContextReference: extractorOrCombiner.rootExtractorOrReference,
              }
            )
          : await asyncInnerSelectElementFromQuery(
              newFetchedData,
              pageParams,
              modelEnvironment,
              queryParams,
              extractorRunnerMap,
              application,
              applicationDeploymentMap,
              // deploymentUuid,
              extractors,
              extractorOrCombiner.rootExtractorOrReference
            );

      if (typeof rootQueryResults === "object") {
        const entries = Object.entries(rootQueryResults as Record<string, EntityInstance>);
        const results: [string, any][] = [];
        for (const [key, instance] of entries) {
          const innerQueryParams = {
            ...queryParams,
            ...Object.fromEntries(
              Object.entries(
                applyTransformer(
                  extractorOrCombiner.subQueryTemplate.rootQueryObjectTransformer,
                  instance
                )
              )
            ),
          };

          const resolvedQuery: ExtractorOrCombiner | QueryFailed = resolveExtractorTemplate(
            extractorOrCombiner.subQueryTemplate.query,
            modelEnvironment,
            innerQueryParams,
            innerQueryParams
          );
          if ("QueryFailure" in resolvedQuery) {
            results.push([
              (instance as any).uuid ?? "no uuid found for entry " + key,
              resolvedQuery,
            ]);
          } else {
            const result = await asyncInnerSelectElementFromQuery(
              newFetchedData,
              pageParams,
              modelEnvironment,
              innerQueryParams,
              extractorRunnerMap,
              application,
              applicationDeploymentMap,
              extractors,
              resolvedQuery as ExtractorOrCombiner
            );
            results.push([instance.uuid, result]);
          }
        }
        return Object.fromEntries(results);
      } else {
        return new Domain2ElementFailed({
          queryFailure: "IncorrectParameters",
          query: JSON.stringify(extractorOrCombiner.rootExtractorOrReference),
        });
      }

      break;
    }
    case "extractorOrCombinerContextReference": {
      return newFetchedData &&
        newFetchedData[extractorOrCombiner.extractorOrCombinerContextReference]
        ? Promise.resolve(newFetchedData[extractorOrCombiner.extractorOrCombinerContextReference])
        : Promise.resolve(
            new Domain2ElementFailed({
              queryFailure: "ReferenceNotFound",
              failureOrigin: ["AsyncQuerySelectors", "asyncInnerSelectElementFromQuery"],
              failureMessage:
                "could not find extractorOrCombinerContextReference " +
                extractorOrCombiner.extractorOrCombinerContextReference +
                " in context" +
                JSON.stringify(Object.keys(newFetchedData)),
              queryContext: JSON.stringify(newFetchedData),
              query: JSON.stringify(extractorOrCombiner),
            })
          );
      break;
    }
    default: {
      return Promise.resolve(
        new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          failureOrigin: ["AsyncQuerySelectors", "asyncInnerSelectElementFromQuery"],
          failureMessage:
            "could not find extractorOrCombinerType for extractor: " +
            JSON.stringify(extractorOrCombiner),
          query: extractorOrCombiner,
        })
      );
      break;
    }
  }
}

// ################################################################################################
export const asyncExtractWithExtractor: AsyncExtractWithBoxedExtractorOrCombinerReturningObjectOrObjectList /**: SyncBoxedExtractorTemplateRunner */= (
  // foreignKeyParams: SyncExtractorOrQueryTemplateRunnerParams<BoxedQueryTemplateWithExtractorCombinerTransformer, ReduxDeploymentsState>,
  foreignKeyParams: AsyncBoxedExtractorRunnerParams<
    BoxedExtractorOrCombinerReturningObjectOrObjectList
  >,
  applicationDeploymentMap: ApplicationDeploymentMap,
  modelEnvironment: MiroirModelEnvironment,
): Promise<Domain2QueryReturnType<DomainElementSuccess>> => {
  // log.info("########## extractExtractor begin, query", foreignKeyParams);
  const localSelectorMap: AsyncBoxedExtractorOrQueryRunnerMap = foreignKeyParams?.extractorRunnerMap ?? emptyAsyncSelectorMap;

  // const deploymentUuid = applicationDeploymentMap[foreignKeyParams.extractor.application];

  const result = asyncInnerSelectElementFromQuery(
    foreignKeyParams.extractor.contextResults ?? {},
    foreignKeyParams.extractor.pageParams ?? {},
    modelEnvironment,
    foreignKeyParams.extractor.queryParams ?? {},
    localSelectorMap as any,
    foreignKeyParams.extractor.application,
    applicationDeploymentMap,
    // deploymentUuid,
    {},
    foreignKeyParams.extractor.select
  );
  return result;

  // log.info(
  //   "extractExtractor",
  //   "query",
  //   foreignKeyParams,
  //   "domainState",
  //   deploymentEntityState,
  //   "newFetchedData",
  //   context
  // );
  // return result;
};




// ################################################################################################
/**
 * StateType is the type of the deploymentEntityState, which may be a ReduxDeploymentsState or a ReduxDeploymentsStateWithUuidIndex
 * 
 * 
 * @param state: StateType
 * @param query 
 * @returns 
 */

export const asyncRunQuery = async (
  query: AsyncQueryRunnerParams,
  applicationDeploymentMap: ApplicationDeploymentMap,
  modelEnvironment: MiroirModelEnvironment,
): Promise<Domain2QueryReturnType<any>> => {

  // log.info(
  //   "########## asyncRunQuery begin, query",
  //   JSON.stringify(query, null, 2),
  //   "applicationDeploymentMap",
  //   JSON.stringify(applicationDeploymentMap, null, 2),
  // );

  if (!query?.extractor) {
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureMessage: "No extractor found on query",
      query: JSON.stringify(query),
    });
  }
  if (!query?.extractor?.application) {
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureMessage: "No application found on query.extractor",
      query: JSON.stringify(query),
    });
  }
  if (!applicationDeploymentMap[query.extractor.application]) {
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureMessage:
        "No deployment found for application " + query.extractor.application +
        " in applicationDeploymentMap " +
        JSON.stringify(applicationDeploymentMap),
      query: JSON.stringify(query),
    });
  }
  // const deploymentUuid = applicationDeploymentMap[query.extractor.application];

  const context: Record<string, any> = {
    ...query.extractor.contextResults,
  };
  // log.info("########## DomainSelector asyncRunQuery will use context", context);
  const localSelectorMap: AsyncBoxedExtractorOrQueryRunnerMap =
    query?.extractorRunnerMap ?? emptyAsyncSelectorMap;

  // Sequentially execute each extractor and update the context
  for (const [key, extractor] of Object.entries(query.extractor.extractors ?? {})) {
    const result = await asyncInnerSelectElementFromQuery(
      context,
      query.extractor.pageParams ?? {},
      modelEnvironment,
      {
        ...query.extractor.pageParams ?? {},
        ...query.extractor.queryParams ?? {},
      },
      localSelectorMap as any,
      query.extractor.application,
      applicationDeploymentMap,
      query.extractor.extractors ?? {} as any,
      extractor
    );
    // log.info("asyncRunQuery for extractor", key, "result", JSON.stringify(result, null, 2));
    context[key] = result; // sequential side-effect update
  }

  const extractorFailure = Object.values(context).find((e) => e instanceof Domain2ElementFailed);

  if (extractorFailure) {
    return new Domain2ElementFailed({
      queryFailure: "FailedExtractor",
      // queryFailure: "QueryNotExecutable",
      errorStack: extractorFailure as any,
    });
  }
  for (const [key, combiner] of Object.entries(query.extractor.combiners ?? {})) {
    const result = await asyncInnerSelectElementFromQuery(
      context,
      query.extractor.pageParams ?? {},
      modelEnvironment,
      {
        // ...modelEnvironment,
        ...query.extractor.pageParams ?? {},
        ...query.extractor.queryParams ?? {},
      },
      localSelectorMap as any,
      query.extractor.application,
      applicationDeploymentMap,
      // deploymentUuid,
      query.extractor.extractors ?? ({} as any),
      combiner
    );
    // log.info("asyncRunQuery for combiner", key, "result", JSON.stringify(result, null, 2));
    context[key] = result;
  }


  for (const transformer of Object.entries(query.extractor.runtimeTransformers ?? {})) {
    const result = await localSelectorMap
      .applyExtractorTransformer(
        transformer[1],
        modelEnvironment,
        {
          ...query.extractor.pageParams ?? {},
          ...query.extractor.queryParams ?? {},
        },
        context,
        query.extractor.extractors ?? ({} as any)
      )
      .then((result): [string, Domain2QueryReturnType<DomainElementSuccess>] => {
        return [transformer[0], result]; // TODO: check for failure!
      });
    context[result[0]] = result[1]; // does side effect!
    // log.info(
    //   "asyncRunQuery for runtimeTransformer",
    //   result[0],
    //   "result",
    //   // JSON.stringify(Object.keys(context))
    //   JSON.stringify(result[1], null, 2)
    // );
  }
  return context;
};
