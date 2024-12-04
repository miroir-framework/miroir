// ################################################################################################

import {
  ActionReturnType,
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  BoxedExtractorTemplateReturningObjectOrObjectList,
  DomainElement,
  DomainElementObject,
  DomainModelQueryTemplateJzodSchemaParams,
  extractor,
  ExtractorOrCombinerTemplate,
  JzodElement,
  JzodObject,
  QueryByEntityUuidGetEntityDefinition,
  QueryByQueryTemplateGetParamJzodSchema,
  QueryByTemplateGetParamJzodSchema,
  QueryTemplateWithExtractorCombinerTransformer,
  QueryWithExtractorCombinerTransformer,
  RunExtractorAction,
  RunExtractorTemplateAction,
  RunQueryTemplateAction,
  RunQueryTemplateOrExtractorTemplateAction
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  AsyncExtractorOrQueryRunnerMap,
  ExtractorTemplateRunnerParamsForJzodSchema,
  RecordOfJzodElement,
  RecordOfJzodObject,
  SyncExtractorTemplateRunnerParams,
  SyncQueryTemplateRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/Logger";
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { cleanLevel } from "./constants";
import {
  extractWithExtractorOrCombinerReturningObjectOrObjectList,
  handleExtractorAction,
  handleQueryAction,
  runQuery,
} from "./QuerySelectors";
import {
  resolveExtractorOrQueryTemplate,
  resolveQueryTemplateForExtractorOrCombinerReturningObjectOrObjectList,
  resolveQueryTemplateWithExtractorCombinerTransformer,
} from "./Templates";
import { transformer_InnerReference_resolve } from "./Transformers";

const loggerName: string = getLoggerName(packageName, cleanLevel,"QueryTemplateSelectors");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

// ################################################################################################
export async function handleQueryTemplateAction(
  origin: string,
  queryTemplateAction: RunQueryTemplateAction, 
  selectorMap: AsyncExtractorOrQueryRunnerMap
): Promise<ActionReturnType> {
  log.info(
    "handleQueryTemplateAction for ",
    origin,
    "queryTemplateAction",
    JSON.stringify(queryTemplateAction, null, 2)
  );
  const resolvedQuery = resolveExtractorOrQueryTemplate( // TODO: separate aas resolvedQueryTemplate and resolvedExtractorTemplate
    queryTemplateAction.query
  );
  log.info(
    "handleQueryTemplateAction for ",
    origin,
    "queryTemplateOrExtractorTemplateAction",
    JSON.stringify(queryTemplateAction, null, 2),
    "resolvedQuery",
    JSON.stringify(resolvedQuery, null, 2)
  );

  return handleQueryAction(
    origin,
    {
      actionType: "runQueryAction",
      actionName: queryTemplateAction.actionName,
      deploymentUuid: queryTemplateAction.deploymentUuid,
      endpoint: queryTemplateAction.endpoint,
      applicationSection: queryTemplateAction.applicationSection,
      query: resolvedQuery as any,
    },
    selectorMap
  );
}

// ################################################################################################
export async function handleExtractorTemplateAction(
  origin: string,
  extractorTemplateAction: RunExtractorTemplateAction,
  selectorMap: AsyncExtractorOrQueryRunnerMap
): Promise<ActionReturnType> {
  log.info(
    "handleExtractorTemplateAction for ",
    origin,
    "extractorTemplateAction",
    JSON.stringify(extractorTemplateAction, null, 2)
  );
  const resolvedQuery = resolveExtractorOrQueryTemplate( // TODO: separate aas resolvedQueryTemplate and resolvedExtractorTemplate
    extractorTemplateAction.query
  );

  const extractorAction: RunExtractorAction = {
    actionType: "runExtractorAction",
    actionName: extractorTemplateAction.actionName,
    deploymentUuid: extractorTemplateAction.deploymentUuid,
    endpoint: extractorTemplateAction.endpoint,
    applicationSection: extractorTemplateAction.applicationSection,
    query: resolvedQuery as any,
  };

  log.info(
    "handleExtractorTemplateAction for ",
    origin,
    "extractorTemplateAction",
    JSON.stringify(extractorTemplateAction, null, 2),
    "resolvedQuery",
    JSON.stringify(resolvedQuery, null, 2),
    "extractorAction",
    JSON.stringify(extractorAction, null, 2)
  );


  return handleExtractorAction(
    origin,
    extractorAction,
    // {
    //   actionType: "runExtractorAction",
    //   actionName: extractorTemplateAction.actionName,
    //   deploymentUuid: extractorTemplateAction.deploymentUuid,
    //   endpoint: extractorTemplateAction.endpoint,
    //   applicationSection: extractorTemplateAction.applicationSection,
    //   query: resolvedQuery as any,
    // },
    selectorMap
  );
}

// ################################################################################################
export async function handleExtractorOrQueryTemplateAction(
  origin: string,
  queryTemplateOrExtractorTemplateAction: RunQueryTemplateOrExtractorTemplateAction, 
  selectorMap: AsyncExtractorOrQueryRunnerMap
): Promise<ActionReturnType> {
  log.info(
    "handleExtractorOrQueryTemplateAction for ",
    origin,
    "runQueryTemplateOrExtractorTemplateAction",
    JSON.stringify(queryTemplateOrExtractorTemplateAction, null, 2)
  );
  const resolvedQuery = resolveExtractorOrQueryTemplate( // TODO: separate aas resolvedQueryTemplate and resolvedExtractorTemplate
    queryTemplateOrExtractorTemplateAction.query
  );
  log.info(
    "handleExtractorOrQueryTemplateAction for ",
    origin,
    "runQueryTemplateOrExtractorTemplateAction",
    JSON.stringify(queryTemplateOrExtractorTemplateAction, null, 2),
    "resolvedQuery",
    JSON.stringify(resolvedQuery, null, 2)
  );

  switch (queryTemplateOrExtractorTemplateAction.query.queryType) {
    case "boxedExtractorTemplateReturningObject":
    case "boxedExtractorTemplateReturningObjectList": {
      const extractorAction: RunExtractorAction = {
        actionType: "runExtractorAction",
        actionName: queryTemplateOrExtractorTemplateAction.actionName,
        deploymentUuid: queryTemplateOrExtractorTemplateAction.deploymentUuid,
        endpoint: queryTemplateOrExtractorTemplateAction.endpoint,
        applicationSection: queryTemplateOrExtractorTemplateAction.applicationSection,
        query: resolvedQuery as any,
      };
      log.info(
        "handleExtractorOrQueryTemplateAction for ",
        origin,
        "############################################# extractorAction",
        JSON.stringify(extractorAction, null, 2),
      );
      return handleExtractorAction(
        origin,
        extractorAction,
        selectorMap
      );
    
    }
    case "queryTemplateWithExtractorCombinerTransformer":{
      return handleQueryAction(
        origin,
        {
          actionType: "runQueryAction",
          actionName: queryTemplateOrExtractorTemplateAction.actionName,
          deploymentUuid: queryTemplateOrExtractorTemplateAction.deploymentUuid,
          endpoint: queryTemplateOrExtractorTemplateAction.endpoint,
          applicationSection: queryTemplateOrExtractorTemplateAction.applicationSection,
          query: resolvedQuery as any,
        },
        selectorMap
      );
      break;
    }
    default: {
      throw new Error("handleExtractorOrQueryTemplateAction: unknown queryType for query: " + JSON.stringify(queryTemplateOrExtractorTemplateAction.query));
      break;
    }
  }
}

// ################################################################################################
export const extractWithExtractorTemplate /**: SyncExtractorTemplateRunner */= <StateType>(
  state: StateType,
  selectorParams: SyncExtractorTemplateRunnerParams<
  BoxedExtractorTemplateReturningObjectOrObjectList,
    StateType
  >
): DomainElement => {
  // log.info("########## extractExtractor begin, query", selectorParams);
  if (!selectorParams.extractorRunnerMap) {
    throw new Error("extractWithExtractorTemplate requires extractorRunnerMap");
  }
  const resolvedExtractor: BoxedExtractorOrCombinerReturningObjectOrObjectList = resolveQueryTemplateForExtractorOrCombinerReturningObjectOrObjectList(
    selectorParams.extractorOrCombinerTemplate
  ); 
  // const resolvedExtractor: QueryWithExtractorCombinerTransformer = resolveQueryTemplateWithExtractorCombinerTransformer(
  //   selectorParams.extractorOrCombinerTemplate
  // ); 

  return extractWithExtractorOrCombinerReturningObjectOrObjectList(
    state,
    {
      // extractorRunnerMap: {} as any,
      extractorRunnerMap: selectorParams.extractorRunnerMap,
      extractor: resolvedExtractor,
    }
  )

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
export const runQueryTemplateWithExtractorCombinerTransformer = <StateType>(
  state: StateType,
  selectorParams: SyncQueryTemplateRunnerParams<StateType>,
): DomainElementObject => { 

  const resolvedExtractor: QueryWithExtractorCombinerTransformer = resolveQueryTemplateWithExtractorCombinerTransformer(
    selectorParams.extractorOrCombinerTemplate
  ); 

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
    selectorParams.query.select.queryType=="literal" ||
    selectorParams.query.select.queryType=="extractorTemplateByExtractorWrapperReturningObject" ||
    selectorParams.query.select.queryType=="extractorTemplateByExtractorWrapperReturningList" ||
    selectorParams.query.select.queryType=="extractorCombinerByHeteronomousManyToManyReturningListOfObjectList" 
  ) {
    throw new Error(
      "extractzodSchemaForSingleSelectQuery can not deal with context reference: query=" +
        JSON.stringify(selectorParams.query, undefined, 2)
    );
  }

  const entityUuidDomainElement = typeof selectorParams.query.select.parentUuid == "string"?selectorParams.query.select.parentUuid:transformer_InnerReference_resolve(
    "build",
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
  const localFetchParams: QueryTemplateWithExtractorCombinerTransformer = selectorParams.query.fetchParams
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
