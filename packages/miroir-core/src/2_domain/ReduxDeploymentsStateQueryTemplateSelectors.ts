import {
  BoxedQueryTemplateWithExtractorCombinerTransformer,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { Domain2QueryReturnType } from "../0_interfaces/2_domain/DomainElement";
import {
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryTemplateRunner,
  SyncQueryTemplateRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { ReduxDeploymentsState } from "../0_interfaces/2_domain/ReduxDeploymentsStateInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import type { ApplicationDeploymentMap } from "../1_core/Deployment";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import {
  extractEntityInstanceListWithObjectListExtractorInMemory,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
  extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
  runQuery,
} from "./QuerySelectors";
import {
  runQueryTemplateWithExtractorCombinerTransformer
} from "./QueryTemplateSelectors";
import {
  selectEntityInstanceFromReduxDeploymentsState,
  selectEntityInstanceListFromReduxDeploymentsState,
  selectEntityInstanceUuidIndexFromReduxDeploymentsState,
} from "./ReduxDeploymentsStateQuerySelectors";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReduxDeploymentsStateQueryTemplateSelector")
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
export const runQueryTemplateFromReduxDeploymentsState: SyncQueryTemplateRunner<
  ReduxDeploymentsState,
  Domain2QueryReturnType<Record<string, any>>
> = runQueryTemplateWithExtractorCombinerTransformer<ReduxDeploymentsState>;

// ################################################################################################
// #### selector Maps
// ################################################################################################
export function getReduxDeploymentsStateSelectorTemplateMap(): SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> {
  return {
    extractorOrCombinerType: "sync",
    extractState: (deploymentEntityState: ReduxDeploymentsState, params: any) => deploymentEntityState,
    extractEntityInstanceUuidIndex: selectEntityInstanceUuidIndexFromReduxDeploymentsState,
    extractEntityInstanceList: selectEntityInstanceListFromReduxDeploymentsState,
    extractEntityInstance: selectEntityInstanceFromReduxDeploymentsState,
    extractEntityInstanceUuidIndexWithObjectListExtractor:
      extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
    extractEntityInstanceListWithObjectListExtractor:
      extractEntityInstanceListWithObjectListExtractorInMemory,
    runQuery: runQuery,
    extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
    // 
    runQueryTemplateWithExtractorCombinerTransformer: runQueryTemplateWithExtractorCombinerTransformer,
  };
}

// ################################################################################################
export type GetQueryTemplateRunnerParamsForReduxDeploymentsState = (
  query: BoxedQueryTemplateWithExtractorCombinerTransformer,
  applicationDeploymentMap: ApplicationDeploymentMap,
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState>
) => SyncQueryTemplateRunnerParams<ReduxDeploymentsState>;

export function getQueryTemplateRunnerParamsForReduxDeploymentsState(
  query: BoxedQueryTemplateWithExtractorCombinerTransformer,
  applicationDeploymentMap: ApplicationDeploymentMap,
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState>
): SyncQueryTemplateRunnerParams<ReduxDeploymentsState> {
  return {
    extractorOrCombinerTemplate: query,
    extractorRunnerMap: extractorRunnerMap ?? getReduxDeploymentsStateSelectorTemplateMap(),
  };
}
