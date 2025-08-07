// ################################################################################################

import {
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  BoxedExtractorTemplateReturningObjectOrObjectList,
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  BoxedQueryWithExtractorCombinerTransformer,
  DomainElementSuccess,
  DomainModelQueryTemplateJzodSchemaParams,
  ExtractorOrCombinerTemplate,
  JzodElement,
  JzodObject,
  QueryByEntityUuidGetEntityDefinition,
  QueryByQueryTemplateGetParamJzodSchema,
  QueryByTemplateGetParamJzodSchema,
  RunBoxedExtractorAction,
  RunBoxedExtractorTemplateAction,
  RunBoxedQueryTemplateAction,
  RunBoxedQueryTemplateOrBoxedExtractorTemplateAction
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { Action2ReturnType, Domain2ElementFailed, Domain2QueryReturnType } from "../0_interfaces/2_domain/DomainElement";
import {
  AsyncBoxedExtractorOrQueryRunnerMap,
  ExtractorTemplateRunnerParamsForJzodSchema,
  RecordOfJzodElement,
  RecordOfJzodObject,
  SyncBoxedExtractorTemplateRunnerParams,
  SyncQueryTemplateRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/LoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import {
  extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
  handleBoxedExtractorAction,
  handleBoxedQueryAction,
  runQuery,
} from "./QuerySelectors";
import {
  resolveBoxedExtractorOrCombinerTemplateReturningObjectOrObjectList,
  resolveQueryTemplateWithExtractorCombinerTransformer
} from "./Templates";
import { transformer_InnerReference_resolve } from "./TransformersForRuntime";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "QueryTemplateSelectors")
).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
export async function handleQueryTemplateAction(
  origin: string,
  queryTemplateAction: RunBoxedQueryTemplateAction, 
  selectorMap: AsyncBoxedExtractorOrQueryRunnerMap
): Promise<Action2ReturnType> {
  // log.info(
  //   "handleQueryTemplateAction for ",
  //   origin,
  //   "queryTemplateAction",
  //   JSON.stringify(queryTemplateAction, null, 2)
  // );
  const resolvedQuery = resolveQueryTemplateWithExtractorCombinerTransformer( // TODO: separate aas resolvedQueryTemplate and resolvedExtractorTemplate
    queryTemplateAction.payload.query
  );
  log.info(
    "handleQueryTemplateAction for ",
    origin,
    "handleQueryTemplateAction",
    JSON.stringify(queryTemplateAction, null, 2),
    "resolvedQuery",
    JSON.stringify(resolvedQuery, null, 2)
  );

  return handleBoxedQueryAction(
    origin,
    {
      actionType: "runBoxedQueryAction",
      actionName: queryTemplateAction.actionName,
      deploymentUuid: queryTemplateAction.deploymentUuid,
      endpoint: queryTemplateAction.endpoint,
      payload: {
        applicationSection: queryTemplateAction.payload.applicationSection,
        query: resolvedQuery as any,
      }
    },
    selectorMap
  );
}

// ################################################################################################
export async function handleBoxedExtractorTemplateAction(
  origin: string,
  boxedExtractorTemplateAction: RunBoxedExtractorTemplateAction,
  selectorMap: AsyncBoxedExtractorOrQueryRunnerMap,
): Promise<Action2ReturnType> {
  log.info(
    "handleBoxedExtractorTemplateAction for ",
    origin,
    "extractorTemplateAction",
    JSON.stringify(boxedExtractorTemplateAction, null, 2)
  );
  const resolvedQuery = resolveBoxedExtractorOrCombinerTemplateReturningObjectOrObjectList( // TODO: separate aas resolvedQueryTemplate and resolvedExtractorTemplate
    boxedExtractorTemplateAction.payload.query,
  );

  const extractorAction: RunBoxedExtractorAction = {
    actionType: "runBoxedExtractorAction",
    actionName: boxedExtractorTemplateAction.actionName,
    deploymentUuid: boxedExtractorTemplateAction.deploymentUuid,
    endpoint: boxedExtractorTemplateAction.endpoint,
    payload: {
      applicationSection: boxedExtractorTemplateAction.payload.applicationSection,
      query: resolvedQuery as any,
    }
  };

  log.info(
    "handleBoxedExtractorTemplateAction for ",
    origin,
    "extractorTemplateAction",
    JSON.stringify(boxedExtractorTemplateAction, null, 2),
    "resolvedQuery",
    JSON.stringify(resolvedQuery, null, 2),
    "extractorAction",
    JSON.stringify(extractorAction, null, 2)
  );


  return handleBoxedExtractorAction(
    origin,
    extractorAction,
    selectorMap
  );
}

// ################################################################################################
export async function handleBoxedExtractorTemplateOrQueryTemplateAction(
  origin: string,
  queryTemplateOrExtractorTemplateAction: RunBoxedQueryTemplateOrBoxedExtractorTemplateAction, 
  selectorMap: AsyncBoxedExtractorOrQueryRunnerMap
): Promise<Action2ReturnType> {
  log.info(
    "handleBoxedExtractorTemplateOrQueryTemplateAction for ",
    origin,
    "runBoxedQueryTemplateOrBoxedExtractorTemplateAction",
    JSON.stringify(queryTemplateOrExtractorTemplateAction, null, 2)
  );

  if ("queryType" in queryTemplateOrExtractorTemplateAction.payload.query) {
    const resolvedQuery = resolveQueryTemplateWithExtractorCombinerTransformer( // TODO: separate aas resolvedQueryTemplate and resolvedExtractorTemplate
      queryTemplateOrExtractorTemplateAction.payload.query as BoxedQueryTemplateWithExtractorCombinerTransformer,
  
    );
    log.info(
      "handleBoxedExtractorTemplateOrQueryTemplateAction for ",
      origin,
      "runBoxedQueryTemplateOrBoxedExtractorTemplateAction",
      JSON.stringify(queryTemplateOrExtractorTemplateAction, null, 2),
      "resolvedQuery",
      JSON.stringify(resolvedQuery, null, 2)
    );
    return handleBoxedQueryAction(
      origin,
      {
        actionType: "runBoxedQueryAction",
        actionName: queryTemplateOrExtractorTemplateAction.actionName,
        deploymentUuid: queryTemplateOrExtractorTemplateAction.deploymentUuid,
        endpoint: queryTemplateOrExtractorTemplateAction.endpoint,
        payload: {
          applicationSection: queryTemplateOrExtractorTemplateAction.payload.applicationSection,
          query: resolvedQuery as any,
        }
      },
      selectorMap
    );
  } else {
    const localQuery = queryTemplateOrExtractorTemplateAction.payload.query as BoxedExtractorTemplateReturningObjectOrObjectList;
    const resolvedQuery = resolveBoxedExtractorOrCombinerTemplateReturningObjectOrObjectList( // TODO: separate aas resolvedQueryTemplate and resolvedExtractorTemplate
      localQuery,
    );
    log.info(
      "handleBoxedExtractorTemplateOrQueryTemplateAction for",
      origin,
      "runBoxedQueryTemplateOrBoxedExtractorTemplateAction",
      JSON.stringify(queryTemplateOrExtractorTemplateAction, null, 2),
      "resolvedQuery",
      JSON.stringify(resolvedQuery, null, 2)
    );
    const extractorAction: RunBoxedExtractorAction = {
      actionType: "runBoxedExtractorAction",
      actionName: queryTemplateOrExtractorTemplateAction.actionName,
      deploymentUuid: queryTemplateOrExtractorTemplateAction.deploymentUuid,
      endpoint: queryTemplateOrExtractorTemplateAction.endpoint,
      payload: {
        applicationSection: queryTemplateOrExtractorTemplateAction.payload.applicationSection,
        query: resolvedQuery as any,
      }
    };
    log.info(
      "handleBoxedExtractorTemplateOrQueryTemplateAction for ",
      origin,
      "############################################# extractorAction",
      JSON.stringify(extractorAction, null, 2),
    );
    return handleBoxedExtractorAction(
      origin,
      extractorAction,
      selectorMap
    );

  }
}

// ################################################################################################
export const extractWithBoxedExtractorTemplate /**: SyncBoxedExtractorTemplateRunner */= <StateType>(
  state: StateType,
  selectorParams: SyncBoxedExtractorTemplateRunnerParams<
    BoxedExtractorTemplateReturningObjectOrObjectList,
    StateType
  >
): Domain2QueryReturnType<DomainElementSuccess> => {
  // log.info("########## extractExtractor begin, query", selectorParams);
  if (!selectorParams.extractorRunnerMap) {
    throw new Error("extractWithBoxedExtractorTemplate requires extractorRunnerMap");
  }
  const resolvedExtractor: BoxedExtractorOrCombinerReturningObjectOrObjectList =
    resolveBoxedExtractorOrCombinerTemplateReturningObjectOrObjectList(selectorParams.extractorOrCombinerTemplate);

  return extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList(
    state,
    {
      // extractorRunnerMap: {} as any,
      extractorRunnerMap: selectorParams.extractorRunnerMap,
      extractor: resolvedExtractor,
    }
  )
};

// ################################################################################################
/**
 * StateType is the type of the deploymentEntityState, which may be a ReduxDeploymentsState or a ReduxDeploymentsStateWithUuidIndex
 * 
 * 
 * @param selectorParams the array of basic extractor functions
 * @returns 
 */
export const runQueryTemplateWithExtractorCombinerTransformer = <StateType>(
  state: StateType,
  selectorParams: SyncQueryTemplateRunnerParams<StateType>,
): Domain2QueryReturnType<Record<string,any>> => { 

  const resolvedExtractor: BoxedQueryWithExtractorCombinerTransformer =
    resolveQueryTemplateWithExtractorCombinerTransformer(selectorParams.extractorOrCombinerTemplate); 

  return runQuery(
    state,
    {
      extractorRunnerMap: selectorParams.extractorRunnerMap,
      extractor: resolvedExtractor,
    }
  )
};

// ################################################################################################
// ################################################################################################
// JZOD SCHEMAs selectors
// ################################################################################################
// ################################################################################################
export const extractzodSchemaForSingleSelectQueryTemplate = <StateType>(
  deploymentEntityState: StateType,
  selectorParams: ExtractorTemplateRunnerParamsForJzodSchema<QueryByQueryTemplateGetParamJzodSchema, StateType>
): JzodObject | undefined => {
  if (
    selectorParams.query.select.extractorTemplateType=="literal" ||
    selectorParams.query.select.extractorTemplateType=="extractorTemplateByExtractorWrapperReturningObject" ||
    selectorParams.query.select.extractorTemplateType=="extractorTemplateByExtractorWrapperReturningList" ||
    selectorParams.query.select.extractorTemplateType=="extractorCombinerByHeteronomousManyToManyReturningListOfObjectList" 
  ) {
    throw new Error(
      "extractzodSchemaForSingleSelectQuery can not deal with context reference: query=" +
        JSON.stringify(selectorParams.query, undefined, 2)
    );
  }

  const entityUuidDomainElement =
    typeof selectorParams.query.select.parentUuid == "string"
      ? selectorParams.query.select.parentUuid
      : transformer_InnerReference_resolve(
          "build",
          selectorParams.query.select.parentUuid,
          "value",
          selectorParams.query.queryParams,
          selectorParams.query.contextResults
        );

  log.info(
    "extractzodSchemaForSingleSelectQuery called",
    selectorParams.query,
    "found",
    entityUuidDomainElement
  );

  if (entityUuidDomainElement instanceof Domain2ElementFailed) {
  // if (typeof entityUuidDomainElement != "object" || entityUuidDomainElement.elementType != "instanceUuid") {
    log.error(
      "extractzodSchemaForSingleSelectQuery called",
      selectorParams.query,
      "error on resolving entityUuid",
      entityUuidDomainElement
    );
    return undefined
  }

  const result = selectorParams.extractorRunnerMap.extractEntityJzodSchema(deploymentEntityState, {
    extractorRunnerMap: selectorParams.extractorRunnerMap,
    query: {
      queryType: "getEntityDefinition",
      contextResults: {},
      pageParams: selectorParams.query.pageParams,
      queryParams: selectorParams.query.queryParams,
      deploymentUuid: selectorParams.query.deploymentUuid ?? "",
      entityUuid: entityUuidDomainElement,
    },
  } as ExtractorTemplateRunnerParamsForJzodSchema<QueryByEntityUuidGetEntityDefinition,StateType>) as JzodObject | undefined

  return result;
}


// ################################################################################################
export const extractJzodSchemaForDomainModelQueryTemplate = <StateType>(
  deploymentEntityState: StateType,
  selectorParams: ExtractorTemplateRunnerParamsForJzodSchema<DomainModelQueryTemplateJzodSchemaParams, StateType>
): RecordOfJzodElement | JzodElement | undefined => {
  switch (selectorParams.query.queryType) {
    case "getEntityDefinition":{ 
      return selectorParams.extractorRunnerMap.extractEntityJzodSchema(
        deploymentEntityState,
        selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<QueryByEntityUuidGetEntityDefinition, StateType>
      );
      break;
    }
    case "queryByTemplateGetParamJzodSchema": {
      return selectorParams.extractorRunnerMap.extractFetchQueryJzodSchema(
        deploymentEntityState,
        selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<QueryByTemplateGetParamJzodSchema, StateType>
      );
      break;
    }
    case "getQueryJzodSchema": {
      return selectorParams.extractorRunnerMap.extractzodSchemaForSingleSelectQuery(
        deploymentEntityState,
        selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<QueryByQueryTemplateGetParamJzodSchema, StateType>
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
  selectorParams: ExtractorTemplateRunnerParamsForJzodSchema<QueryByTemplateGetParamJzodSchema, StateType>
):  RecordOfJzodObject | undefined => {
  const localFetchParams: BoxedQueryTemplateWithExtractorCombinerTransformer = selectorParams.query.fetchParams
  // log.info("selectFetchQueryJzodSchemaFromDomainState called", selectorParams.query);
  
  const fetchQueryJzodSchema = Object.fromEntries(
    Object.entries(localFetchParams?.combinerTemplates??{})
    .map((entry: [string, ExtractorOrCombinerTemplate]) => [
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
      } as ExtractorTemplateRunnerParamsForJzodSchema<QueryByQueryTemplateGetParamJzodSchema, StateType>),
    ])
  ) as RecordOfJzodObject;

  // log.info("selectFetchQueryJzodSchemaFromDomainState query", JSON.stringify(selectorParams.query, undefined, 2), "fetchQueryJzodSchema", fetchQueryJzodSchema)
  return fetchQueryJzodSchema;
};
