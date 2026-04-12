// ################################################################################################

import {
  BoxedQueryTemplateWithExtractorCombinerTransformer
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface";
import { Domain2QueryReturnType } from "../0_interfaces/2_domain/DomainElement";
import {
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryTemplateRunner,
  SyncQueryTemplateRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import {
  extractEntityInstanceListFromListQueryAndDomainState,
  extractEntityInstanceUuidIndexFromListQueryAndDomainState,
  runQueryFromDomainState,
  selectEntityInstanceFromObjectQueryAndDomainState,
  selectEntityInstanceListFromDomainState,
  selectEntityInstanceUuidIndexFromDomainState,
} from "./DomainStateQuerySelectors";
import { applyExtractorTransformerInMemory, extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList } from "./QuerySelectors";
import {
  runQueryTemplateWithExtractorCombinerTransformer
} from "./QueryTemplateSelectors";


let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "DomainStateQueryTemplateSelector")
).then((logger: LoggerInterface) => {log = logger});



export type QueryTemplateRunnerForDomainState = SyncQueryTemplateRunner<
  DomainState,
  // Domain2QueryReturnType<DomainElementSuccess>
  Domain2QueryReturnType<any>
>;

export const queryTemplateRunnerForDomainState: QueryTemplateRunnerForDomainState =
  runQueryTemplateWithExtractorCombinerTransformer<DomainState>;

// ################################################################################################
// TODO: used in RestServer.ts (with commented out access in HomePage, to create bundle)
//  provide a better interface?
export const runQueryTemplateFromDomainState: SyncQueryTemplateRunner<
  DomainState,
  Domain2QueryReturnType<Record<string,any>>
> = runQueryTemplateWithExtractorCombinerTransformer<DomainState>;

// ################################################################################################
// #### selector Maps
// ################################################################################################
export function getSelectorMapForTemplate(): SyncBoxedExtractorOrQueryRunnerMap<DomainState> {
  return {
    extractorOrCombinerType: "sync",
    extractState: (domainState: DomainState, params: any) => domainState,
    extractEntityInstanceUuidIndex: selectEntityInstanceUuidIndexFromDomainState,
    extractEntityInstanceList: selectEntityInstanceListFromDomainState,
    extractEntityInstance: selectEntityInstanceFromObjectQueryAndDomainState,
    extractEntityInstanceUuidIndexWithObjectListExtractor: extractEntityInstanceUuidIndexFromListQueryAndDomainState,
    extractEntityInstanceListWithObjectListExtractor: extractEntityInstanceListFromListQueryAndDomainState,
    runQuery: runQueryFromDomainState,
    extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
    // 
    runQueryTemplateWithExtractorCombinerTransformer: runQueryTemplateFromDomainState,
    applyExtractorTransformer: applyExtractorTransformerInMemory,
  };
}


// ################################################################################################
export type GetSelectorParamsForQueryTemplateOnDomainStateType=<QueryTemplateType extends BoxedQueryTemplateWithExtractorCombinerTransformer>(
  query: QueryTemplateType,
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<DomainState>
)=> SyncQueryTemplateRunnerParams<DomainState>;

export const getQueryTemplateRunnerParamsForDomainState: GetSelectorParamsForQueryTemplateOnDomainStateType =
<ExtractorTemplateType extends BoxedQueryTemplateWithExtractorCombinerTransformer>(
    query: ExtractorTemplateType,
    extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<DomainState>,
  ) =>
{
  return {
    extractorOrCombinerTemplate: query,
    extractorRunnerMap: extractorRunnerMap ?? getSelectorMapForTemplate(),
  };
}
