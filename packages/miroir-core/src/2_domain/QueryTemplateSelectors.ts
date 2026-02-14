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
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
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
import { type MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { transformer_extended_apply } from "./TransformersForRuntime";
import type { ApplicationDeploymentMap } from "../1_core/Deployment";
// import { transformer_InnerReference_resolve} from "./TransformersForRuntime";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "QueryTemplateSelectors")
).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
export async function handleQueryTemplateAction(
  origin: string,
  queryTemplateAction: RunBoxedQueryTemplateAction, 
  applicationDeploymentMap: ApplicationDeploymentMap,
  selectorMap: AsyncBoxedExtractorOrQueryRunnerMap,
  modelEnvironment: MiroirModelEnvironment
): Promise<Action2ReturnType> {
  // log.info(
  //   "handleQueryTemplateAction for ",
  //   origin,
  //   "queryTemplateAction",
  //   JSON.stringify(queryTemplateAction, null, 2)
  // );
  const resolvedQuery = resolveQueryTemplateWithExtractorCombinerTransformer( // TODO: separate aas resolvedQueryTemplate and resolvedExtractorTemplate
    queryTemplateAction.payload.query,
    modelEnvironment,
  );
  // log.info(
  //   "handleQueryTemplateAction for ",
  //   origin,
  //   "handleQueryTemplateAction",
  //   JSON.stringify(queryTemplateAction, null, 2),
  //   "resolvedQuery",
  //   JSON.stringify(resolvedQuery, null, 2)
  // );

  return handleBoxedQueryAction(
    origin,
    {
      actionType: "runBoxedQueryAction",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
      payload: {
        application: queryTemplateAction.payload.application,
        applicationSection: queryTemplateAction.payload.applicationSection,
        query: resolvedQuery as any,
      }
    },
    applicationDeploymentMap,
    selectorMap,
    modelEnvironment
  );
}

// ################################################################################################
export async function handleBoxedExtractorTemplateAction(
  origin: string,
  boxedExtractorTemplateAction: RunBoxedExtractorTemplateAction,
  applicationDeploymentMap: ApplicationDeploymentMap,
  selectorMap: AsyncBoxedExtractorOrQueryRunnerMap,
  modelEnvironment: MiroirModelEnvironment
): Promise<Action2ReturnType> {
  log.info(
    "handleBoxedExtractorTemplateAction for ",
    origin,
    "extractorTemplateAction",
    JSON.stringify(boxedExtractorTemplateAction, null, 2)
  );
  const resolvedQuery = resolveBoxedExtractorOrCombinerTemplateReturningObjectOrObjectList( // TODO: separate aas resolvedQueryTemplate and resolvedExtractorTemplate
    boxedExtractorTemplateAction.payload.query,
    modelEnvironment,
  );

  const extractorAction: RunBoxedExtractorAction = {
    actionType: "runBoxedExtractorAction",
    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
    payload: {
      application: boxedExtractorTemplateAction.payload.application,
      // deploymentUuid: boxedExtractorTemplateAction.payload.deploymentUuid,
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
    applicationDeploymentMap,
    selectorMap,
    modelEnvironment
  );
}

// ################################################################################################
export async function handleBoxedExtractorTemplateOrQueryTemplateAction(
  origin: string,
  queryTemplateOrExtractorTemplateAction: RunBoxedQueryTemplateOrBoxedExtractorTemplateAction,
  applicationDeploymentMap: ApplicationDeploymentMap,
  selectorMap: AsyncBoxedExtractorOrQueryRunnerMap,
  modelEnvironment: MiroirModelEnvironment
): Promise<Action2ReturnType> {
  // log.info(
  //   "handleBoxedExtractorTemplateOrQueryTemplateAction for ",
  //   origin,
  //   "runBoxedQueryTemplateOrBoxedExtractorTemplateAction",
  //   JSON.stringify(queryTemplateOrExtractorTemplateAction, null, 2)
  // );

  if ("queryType" in queryTemplateOrExtractorTemplateAction.payload.query) {
    const resolvedQuery = resolveQueryTemplateWithExtractorCombinerTransformer( // TODO: separate aas resolvedQueryTemplate and resolvedExtractorTemplate
      queryTemplateOrExtractorTemplateAction.payload.query as BoxedQueryTemplateWithExtractorCombinerTransformer,
      modelEnvironment,
    );
    // log.info(
    //   "handleBoxedExtractorTemplateOrQueryTemplateAction for ",
    //   origin,
    //   "runBoxedQueryTemplateOrBoxedExtractorTemplateAction",
    //   JSON.stringify(queryTemplateOrExtractorTemplateAction, null, 2),
    //   "resolvedQuery",
    //   JSON.stringify(resolvedQuery, null, 2)
    // );
    return handleBoxedQueryAction(
      origin,
      {
        actionType: "runBoxedQueryAction",
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        endpoint: queryTemplateOrExtractorTemplateAction.endpoint,
        payload: {
          application: queryTemplateOrExtractorTemplateAction.payload.application,
          applicationSection: queryTemplateOrExtractorTemplateAction.payload.applicationSection,
          query: resolvedQuery as any,
        }
      },
      applicationDeploymentMap,
      selectorMap,
      modelEnvironment
    );
  } else {
    const localQuery = queryTemplateOrExtractorTemplateAction.payload.query as BoxedExtractorTemplateReturningObjectOrObjectList;
    const resolvedQuery = resolveBoxedExtractorOrCombinerTemplateReturningObjectOrObjectList( // TODO: separate aas resolvedQueryTemplate and resolvedExtractorTemplate
      localQuery,
      modelEnvironment,
    );
    // log.info(
    //   "handleBoxedExtractorTemplateOrQueryTemplateAction for",
    //   origin,
    //   "runBoxedQueryTemplateOrBoxedExtractorTemplateAction",
    //   JSON.stringify(queryTemplateOrExtractorTemplateAction, null, 2),
    //   "resolvedQuery",
    //   JSON.stringify(resolvedQuery, null, 2)
    // );
    const extractorAction: RunBoxedExtractorAction = {
      actionType: "runBoxedExtractorAction",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: queryTemplateOrExtractorTemplateAction.endpoint,
      payload: {
        application: queryTemplateOrExtractorTemplateAction.payload.application,
        applicationSection: queryTemplateOrExtractorTemplateAction.payload.applicationSection,
        query: resolvedQuery as any,
      }
    };
    // log.info(
    //   "handleBoxedExtractorTemplateOrQueryTemplateAction for ",
    //   origin,
    //   "############################################# extractorAction",
    //   JSON.stringify(extractorAction, null, 2),
    // );
    return handleBoxedExtractorAction(
      origin,
      extractorAction,
      applicationDeploymentMap,
      selectorMap,
      modelEnvironment
    );

  }
}

// ################################################################################################
export const extractWithBoxedExtractorTemplate /**: SyncBoxedExtractorTemplateRunner */= <StateType>(
  state: StateType,
  applicationDeploymentMap: ApplicationDeploymentMap,
  foreignKeyParams: SyncBoxedExtractorTemplateRunnerParams<
    BoxedExtractorTemplateReturningObjectOrObjectList,
    StateType
  >,
  modelEnvironment: MiroirModelEnvironment
): Domain2QueryReturnType<DomainElementSuccess> => {
  if (!foreignKeyParams.extractorRunnerMap) {
    throw new Error("extractWithBoxedExtractorTemplate requires extractorRunnerMap");
  }
  const resolvedExtractor: BoxedExtractorOrCombinerReturningObjectOrObjectList =
    resolveBoxedExtractorOrCombinerTemplateReturningObjectOrObjectList(
      foreignKeyParams.extractorOrCombinerTemplate,
      modelEnvironment
    );

  return extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList(
    state,
    applicationDeploymentMap,
    {
      extractorRunnerMap: foreignKeyParams.extractorRunnerMap,
      extractor: resolvedExtractor,
    },
    modelEnvironment
  )
};

// ################################################################################################
/**
 * StateType is the type of the deploymentEntityState, which may be a ReduxDeploymentsState or a ReduxDeploymentsStateWithUuidIndex
 * 
 * 
 * @param foreignKeyParams the array of basic extractor functions
 * @returns 
 */
export const runQueryTemplateWithExtractorCombinerTransformer = <StateType>(
  state: StateType,
  applicationDeploymentMap: ApplicationDeploymentMap,
  foreignKeyParams: SyncQueryTemplateRunnerParams<StateType>,
  modelEnvironment: MiroirModelEnvironment,
): Domain2QueryReturnType<Record<string,any>> => { 

  const resolvedExtractor: BoxedQueryWithExtractorCombinerTransformer =
    resolveQueryTemplateWithExtractorCombinerTransformer(
      foreignKeyParams.extractorOrCombinerTemplate,
      modelEnvironment
    ); 

  // log.info(
  //   "runQueryTemplateWithExtractorCombinerTransformer called",
  //   foreignKeyParams,
  //   "resolvedExtractor",
  //   resolvedExtractor,
  //   "applicationDeploymentMap",
  //   applicationDeploymentMap,
  // );

  return runQuery(
    state,
    applicationDeploymentMap,
    {
      extractorRunnerMap: foreignKeyParams.extractorRunnerMap,
      extractor: resolvedExtractor,
    },
    modelEnvironment
  )
};

// ################################################################################################
// ################################################################################################
// JZOD SCHEMAs selectors
// ################################################################################################
// ################################################################################################
export const extractzodSchemaForSingleSelectQueryTemplate = <StateType>(
  deploymentEntityState: StateType,
  applicationDeploymentMap: ApplicationDeploymentMap,
  foreignKeyParams: ExtractorTemplateRunnerParamsForJzodSchema<QueryByQueryTemplateGetParamJzodSchema, StateType>,
  modelEnvironment: MiroirModelEnvironment
): JzodObject | undefined => {
  if (
    foreignKeyParams.query.select.extractorOrCombinerType=="literal" ||
    foreignKeyParams.query.select.extractorOrCombinerType=="extractorByExtractorWrapperReturningObject" ||
    foreignKeyParams.query.select.extractorOrCombinerType=="extractorByExtractorWrapperReturningList" ||
    foreignKeyParams.query.select.extractorOrCombinerType=="extractorCombinerByHeteronomousManyToManyReturningListOfObjectList" 
  ) {
    throw new Error(
      "extractzodSchemaForSingleSelectQuery can not deal with context reference: query=" +
        JSON.stringify(foreignKeyParams.query, undefined, 2)
    );
  }

  const entityUuidDomainElement =
    typeof foreignKeyParams.query.select.parentUuid == "string"
      ? foreignKeyParams.query.select.parentUuid
      // : transformer_InnerReference_resolve(
      : transformer_extended_apply(
          "build",
          [], // transformerPath
          foreignKeyParams.query.select.label??foreignKeyParams.query.select.extractorOrCombinerType,
          foreignKeyParams.query.select.parentUuid,
          "value",
          // {...modelEnvironment, ...foreignKeyParams.query.queryParams},
          modelEnvironment,
          foreignKeyParams.query.queryParams,
          foreignKeyParams.query.contextResults
        );

  log.info(
    "extractzodSchemaForSingleSelectQuery called",
    foreignKeyParams.query,
    "found",
    entityUuidDomainElement
  );

  if (entityUuidDomainElement instanceof Domain2ElementFailed) {
    log.error(
      "extractzodSchemaForSingleSelectQuery called",
      foreignKeyParams.query,
      "error on resolving entityUuid",
      entityUuidDomainElement
    );
    return undefined
  }

  const result = foreignKeyParams.extractorRunnerMap.extractEntityJzodSchema(
    deploymentEntityState,
    applicationDeploymentMap,
    {
      extractorRunnerMap: foreignKeyParams.extractorRunnerMap,
      query: {
        queryType: "getEntityDefinition",
        contextResults: {},
        pageParams: foreignKeyParams.query.pageParams,
        queryParams: foreignKeyParams.query.queryParams,
        entityUuid: entityUuidDomainElement,
      },
    } as ExtractorTemplateRunnerParamsForJzodSchema<
      QueryByEntityUuidGetEntityDefinition,
      StateType
    >,
    modelEnvironment
  ) as JzodObject | undefined;

  return result;
}


// ################################################################################################
export const extractJzodSchemaForDomainModelQueryTemplate = <StateType>(
  deploymentEntityState: StateType,
  applicationDeploymentMap: ApplicationDeploymentMap,
  foreignKeyParams: ExtractorTemplateRunnerParamsForJzodSchema<DomainModelQueryTemplateJzodSchemaParams, StateType>,
  modelEnvironment: MiroirModelEnvironment
): RecordOfJzodElement | JzodElement | undefined => {
  switch (foreignKeyParams.query.queryType) {
    case "getEntityDefinition":{ 
      return foreignKeyParams.extractorRunnerMap.extractEntityJzodSchema(
        deploymentEntityState,
        applicationDeploymentMap,
        foreignKeyParams as ExtractorTemplateRunnerParamsForJzodSchema<QueryByEntityUuidGetEntityDefinition, StateType>,
        modelEnvironment
      );
      break;
    }
    case "queryByTemplateGetParamJzodSchema": {
      return foreignKeyParams.extractorRunnerMap.extractFetchQueryJzodSchema(
        deploymentEntityState,
        applicationDeploymentMap,
        foreignKeyParams as ExtractorTemplateRunnerParamsForJzodSchema<QueryByTemplateGetParamJzodSchema, StateType>,
        modelEnvironment
      );
      break;
    }
    case "getQueryJzodSchema": {
      return foreignKeyParams.extractorRunnerMap.extractzodSchemaForSingleSelectQuery(
        deploymentEntityState,
        applicationDeploymentMap,
        foreignKeyParams as ExtractorTemplateRunnerParamsForJzodSchema<QueryByQueryTemplateGetParamJzodSchema, StateType>,
        modelEnvironment
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
  applicationDeploymentMap: ApplicationDeploymentMap,
  foreignKeyParams: ExtractorTemplateRunnerParamsForJzodSchema<QueryByTemplateGetParamJzodSchema, StateType>,
  modelEnvironment: MiroirModelEnvironment
):  RecordOfJzodObject | undefined => {
  const localFetchParams: BoxedQueryTemplateWithExtractorCombinerTransformer = foreignKeyParams.query.fetchParams
  
  const fetchQueryJzodSchema = Object.fromEntries(
    Object.entries(localFetchParams?.combinerTemplates ?? {}).map(
      (entry: [string, ExtractorOrCombinerTemplate]) => [
        entry[0],
        foreignKeyParams.extractorRunnerMap.extractzodSchemaForSingleSelectQuery(
          deploymentEntityState,
          applicationDeploymentMap,
          {
            extractorRunnerMap: foreignKeyParams.extractorRunnerMap,
            query: {
              queryType: "getQueryJzodSchema",
              contextResults: {},
              pageParams: foreignKeyParams.query.pageParams,
              queryParams: foreignKeyParams.query.queryParams,
              select: entry[1],
            },
          } as ExtractorTemplateRunnerParamsForJzodSchema<
            QueryByQueryTemplateGetParamJzodSchema,
            StateType
          >,
          modelEnvironment
        ),
      ]
    )
  ) as RecordOfJzodObject;

  return fetchQueryJzodSchema;
};
