// ################################################################################################

import { defaultApplicationSection } from "../0_interfaces/1_core/Model";
import {
  BoxedQueryWithExtractorCombinerTransformer,
  RunBoxedQueryTemplateAction
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { type MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { Action2ReturnType, Domain2QueryReturnType } from "../0_interfaces/2_domain/DomainElement";
import {
  AsyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryTemplateRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import type { ApplicationDeploymentMap } from "../1_core/Deployment";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import {
  handleBoxedQueryAction,
  runQuery
} from "./QuerySelectors";
import {
  resolveQueryTemplateWithExtractorCombinerTransformer
} from "./Templates";
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
      endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
      payload: {
        application: queryTemplateAction.payload.application,
        applicationSection: queryTemplateAction.payload.applicationSection ?? defaultApplicationSection,
        query: resolvedQuery as any,
      }
    },
    applicationDeploymentMap,
    selectorMap,
    modelEnvironment
  );
}

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
