// ################################################################################################

import {
  DomainElement,
  DomainElementObject,
  EntityDefinition,
  JzodObject,
  MiroirQueryTemplate,
  QueryByEntityUuidGetEntityDefinition,
  BoxedExtractorTemplateReturningObjectOrObjectList,
  BoxedQueryTemplateWithExtractorCombinerTransformer
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface";
import {
  ExtractorTemplateRunnerParamsForJzodSchema,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncBoxedExtractorTemplateRunner,
  SyncBoxedExtractorTemplateRunnerParams,
  SyncQueryTemplateRunner,
  SyncQueryTemplateRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/Logger";
import { packageName } from "../constants";
import { entityEntityDefinition } from "../index";
import { getLoggerName } from "../tools";
import { cleanLevel } from "./constants";
import {
  extractEntityInstanceListFromListQueryAndDomainState,
  extractEntityInstanceUuidIndexFromListQueryAndDomainState,
  runQueryFromDomainState,
  selectEntityInstanceFromObjectQueryAndDomainState,
  selectEntityInstanceListFromDomainState,
  selectEntityInstanceUuidIndexFromDomainState,
} from "./DomainStateQuerySelectors";
import { extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList } from "./QuerySelectors";
import {
  extractFetchQueryTemplateJzodSchema,
  extractJzodSchemaForDomainModelQueryTemplate,
  extractWithBoxedExtractorTemplate,
  extractzodSchemaForSingleSelectQueryTemplate,
  runQueryTemplateWithExtractorCombinerTransformer
} from "./QueryTemplateSelectors";


const loggerName: string = getLoggerName(packageName, cleanLevel, "DomainStateQueryTemplateSelector");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});


// ################################################################################################
// TODO: used in extractorTemplateRunnerForDomainState.unit.test and RestServer.ts, provide a better interface?
export type ExtractorTemplateRunnerForDomainState = SyncBoxedExtractorTemplateRunner<
  BoxedExtractorTemplateReturningObjectOrObjectList,
  DomainState,
  DomainElement
>;

export const extractorTemplateRunnerForDomainState: ExtractorTemplateRunnerForDomainState =
  extractWithBoxedExtractorTemplate<DomainState>;

export type QueryTemplateRunnerForDomainState = SyncQueryTemplateRunner<
  DomainState,
  DomainElement
>;

export const queryTemplateRunnerForDomainState: QueryTemplateRunnerForDomainState =
  runQueryTemplateWithExtractorCombinerTransformer<DomainState>;

// ################################################################################################
// TODO: used in RestServer.ts (with commented out access in HomePage, to create bundle)
//  provide a better interface?
export const runQueryTemplateFromDomainState: SyncQueryTemplateRunner<
  DomainState,
  DomainElementObject
> = runQueryTemplateWithExtractorCombinerTransformer<DomainState>;

// ################################################################################################
// #### selector Maps
// ################################################################################################
export function getSelectorMapForTemplate(): SyncBoxedExtractorOrQueryRunnerMap<DomainState> {
  return {
    extractorType: "sync",
    extractEntityInstanceUuidIndex: selectEntityInstanceUuidIndexFromDomainState,
    extractEntityInstanceList: selectEntityInstanceListFromDomainState,
    extractEntityInstance: selectEntityInstanceFromObjectQueryAndDomainState,
    extractEntityInstanceUuidIndexWithObjectListExtractor: extractEntityInstanceUuidIndexFromListQueryAndDomainState,
    extractEntityInstanceListWithObjectListExtractor: extractEntityInstanceListFromListQueryAndDomainState,
    runQuery: runQueryFromDomainState,
    extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
    // 
    runQueryTemplateWithExtractorCombinerTransformer: runQueryTemplateFromDomainState,
  };
}

// ################################################################################################
export type GetSelectorParamsForExtractorTemplateOnDomainStateType=<ExtractorTemplateType extends BoxedExtractorTemplateReturningObjectOrObjectList>(
  query: ExtractorTemplateType,
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<DomainState>
)=> SyncBoxedExtractorTemplateRunnerParams<ExtractorTemplateType, DomainState>;

export const getExtractorTemplateRunnerParamsForDomainState: GetSelectorParamsForExtractorTemplateOnDomainStateType =
<ExtractorTemplateType extends BoxedExtractorTemplateReturningObjectOrObjectList>(
    query: ExtractorTemplateType,
    extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<DomainState>
  ) =>
{
  return {
    extractorOrCombinerTemplate: query,
    extractorRunnerMap: extractorRunnerMap ?? getSelectorMapForTemplate(),
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
    extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<DomainState>
  ) =>
{
  return {
    extractorOrCombinerTemplate: query,
    extractorRunnerMap: extractorRunnerMap ?? getSelectorMapForTemplate(),
  };
}

// ################################################################################################
// #### JZOD SCHEMAs selectors
// ################################################################################################
export const selectJzodSchemaByDomainModelQueryFromDomainStateNewForTemplate = extractJzodSchemaForDomainModelQueryTemplate<DomainState>;

export const selectFetchQueryJzodSchemaFromDomainStateNewForTemplate = extractFetchQueryTemplateJzodSchema<DomainState>;

export const selectJzodSchemaBySingleSelectQueryFromDomainStateNewForTemplate = extractzodSchemaForSingleSelectQueryTemplate<DomainState>;

// ACCESSES DOMAIN STATE
export const selectEntityJzodSchemaFromDomainStateNewForTemplate = (
  domainState: DomainState,
  selectorParams: ExtractorTemplateRunnerParamsForJzodSchema<QueryByEntityUuidGetEntityDefinition, DomainState>
): JzodObject | undefined => {
  const localQuery: QueryByEntityUuidGetEntityDefinition = selectorParams.query;
  if (
    domainState &&
    domainState[localQuery.deploymentUuid] &&
    domainState[localQuery.deploymentUuid]["model"] &&
    domainState[localQuery.deploymentUuid]["model"][entityEntityDefinition.uuid]
  ) {
    const values: EntityDefinition[] = Object.values(
      domainState[localQuery.deploymentUuid]["model"][entityEntityDefinition.uuid] ?? {}
    ) as EntityDefinition[];
    const index = values.findIndex((e: EntityDefinition) => e.entityUuid == localQuery.entityUuid);

    const result: JzodObject | undefined = index > -1 ? values[index].jzodSchema : undefined;

    // log.info("DomainSelector selectEntityJzodSchemaFromDomainState result", result);

    return result;
  } else {
    return undefined;
  }
};

