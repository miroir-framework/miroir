// ################################################################################################

import {
  BoxedExtractorTemplateReturningObjectOrObjectList,
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  DomainElementSuccess,
  EntityDefinition,
  JzodObject,
  QueryByEntityUuidGetEntityDefinition
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
const entityEntityDefinition = require('../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json');

import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface";
import { Domain2QueryReturnType } from "../0_interfaces/2_domain/DomainElement";
import {
  ExtractorTemplateRunnerParamsForJzodSchema,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncBoxedExtractorTemplateRunner,
  SyncBoxedExtractorTemplateRunnerParams,
  SyncQueryTemplateRunner,
  SyncQueryTemplateRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/LoggerFactory";
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
import { extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList } from "./QuerySelectors";
import {
  extractFetchQueryTemplateJzodSchema,
  extractJzodSchemaForDomainModelQueryTemplate,
  extractWithBoxedExtractorTemplate,
  extractzodSchemaForSingleSelectQueryTemplate,
  runQueryTemplateWithExtractorCombinerTransformer
} from "./QueryTemplateSelectors";


let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "DomainStateQueryTemplateSelector")
).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
// TODO: used in extractorTemplateRunnerForDomainState.unit.test and RestServer.ts, provide a better interface?
export type ExtractorTemplateRunnerForDomainState = SyncBoxedExtractorTemplateRunner<
  BoxedExtractorTemplateReturningObjectOrObjectList,
  DomainState,
  Domain2QueryReturnType<DomainElementSuccess>
>;

export const extractorTemplateRunnerForDomainState: ExtractorTemplateRunnerForDomainState =
  extractWithBoxedExtractorTemplate<DomainState>;

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

