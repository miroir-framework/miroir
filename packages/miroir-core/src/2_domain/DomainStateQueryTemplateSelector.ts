// ################################################################################################

import {
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  EntityDefinition,
  JzodObject,
  QueryByEntityUuidGetEntityDefinition
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { entityEntityDefinition } from "miroir-test-app_deployment-miroir";

import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface";
import { Domain2QueryReturnType } from "../0_interfaces/2_domain/DomainElement";
import {
  ExtractorTemplateRunnerParamsForJzodSchema,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryTemplateRunner,
  SyncQueryTemplateRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import type { ApplicationDeploymentMap } from "../1_core/Deployment";
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
import { extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList } from "./QuerySelectors";
import {
  extractFetchQueryTemplateJzodSchema,
  extractJzodSchemaForDomainModelQueryTemplate,
  extractzodSchemaForSingleSelectQueryTemplate,
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

// ################################################################################################
// #### JZOD SCHEMAs selectors
// ################################################################################################
export const selectJzodSchemaByDomainModelQueryFromDomainStateNewForTemplate = extractJzodSchemaForDomainModelQueryTemplate<DomainState>;

export const selectFetchQueryJzodSchemaFromDomainStateNewForTemplate = extractFetchQueryTemplateJzodSchema<DomainState>;

export const selectJzodSchemaBySingleSelectQueryFromDomainStateNewForTemplate = extractzodSchemaForSingleSelectQueryTemplate<DomainState>;

// ACCESSES DOMAIN STATE
export const selectEntityJzodSchemaFromDomainStateNewForTemplate = (
  domainState: DomainState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  foreignKeyParams: ExtractorTemplateRunnerParamsForJzodSchema<QueryByEntityUuidGetEntityDefinition, DomainState>
): JzodObject | undefined => {
  const localQuery: QueryByEntityUuidGetEntityDefinition = foreignKeyParams.query;
  const deploymentUuid = applicationDeploymentMap[localQuery.application];
  if (
    domainState &&
    domainState[deploymentUuid] &&
    domainState[deploymentUuid]["model"] &&
    domainState[deploymentUuid]["model"][entityEntityDefinition.uuid]
  ) {
    const values: EntityDefinition[] = Object.values(
      domainState[deploymentUuid]["model"][entityEntityDefinition.uuid] ?? {}
    ) as EntityDefinition[];
    const index = values.findIndex((e: EntityDefinition) => e.entityUuid == localQuery.entityUuid);

    const result: JzodObject | undefined = index > -1 ? values[index].mlSchema : undefined;

    // log.info("DomainSelector selectEntityJzodSchemaFromDomainState result", result);

    return result;
  } else {
    return undefined;
  }
};

