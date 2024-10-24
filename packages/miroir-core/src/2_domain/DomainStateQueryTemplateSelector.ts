// ################################################################################################

import {
  DomainElement,
  DomainElementObject,
  DomainModelGetEntityDefinitionExtractor,
  EntityDefinition,
  ExtractorTemplateForDomainModel,
  ExtractorTemplateForDomainModelObjects,
  ExtractorTemplateForRecordOfExtractors,
  JzodObject
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface";
import {
  ExtractorTemplateRunnerParamsForJzodSchema,
  SyncExtractorRunnerMap,
  SyncExtractorTemplateRunner,
  SyncExtractorTemplateRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/Logger";
import { packageName } from "../constants";
import { entityEntityDefinition } from "../index";
import { getLoggerName } from "../tools";
import { cleanLevel } from "./constants";
import {
  extractEntityInstanceListFromListQueryAndDomainState,
  extractWithManyExtractorsFromDomainState,
  selectEntityInstanceFromObjectQueryAndDomainState,
  selectEntityInstanceUuidIndexFromDomainState,
} from "./DomainStateQuerySelectors";
import { extractWithExtractor } from "./QuerySelectors";
import {
  extractFetchQueryTemplateJzodSchema,
  extractJzodSchemaForDomainModelQueryTemplate,
  extractWithExtractorTemplate,
  extractWithManyExtractorTemplates,
  extractzodSchemaForSingleSelectQueryTemplate
} from "./QueryTemplateSelectors";


const loggerName: string = getLoggerName(packageName, cleanLevel, "DomainStateQueryTemplateSelector");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});


// ################################################################################################
// TODO: used in extractWithExtractorFromDomainStateForTemplate.unit.test and RestServer.ts, provide a better interface?
export const extractWithExtractorFromDomainStateForTemplate: SyncExtractorTemplateRunner<
  ExtractorTemplateForDomainModelObjects | ExtractorTemplateForRecordOfExtractors,
  DomainState,
  DomainElement
> = extractWithExtractorTemplate<DomainState>;


// ################################################################################################
// TODO: used in RestServer.ts (with commented out access in HomePage, to create bundle)
//  provide a better interface?
export const extractWithManyExtractorsFromDomainStateForTemplateREDUNDANT: SyncExtractorTemplateRunner<
  ExtractorTemplateForRecordOfExtractors,
  DomainState,
  DomainElementObject
> = extractWithManyExtractorTemplates<DomainState>;

// ################################################################################################
// #### selector Maps
// ################################################################################################
export function getSelectorMapForTemplate(): SyncExtractorRunnerMap<DomainState> {
  return {
    extractorType: "sync",
    extractEntityInstanceUuidIndex: selectEntityInstanceUuidIndexFromDomainState,
    extractEntityInstance: selectEntityInstanceFromObjectQueryAndDomainState,
    extractEntityInstanceUuidIndexWithObjectListExtractor: extractEntityInstanceListFromListQueryAndDomainState,
    extractWithManyExtractors: extractWithManyExtractorsFromDomainState,
    extractWithExtractor: extractWithExtractor,
    // 
    extractWithManyExtractorTemplates: extractWithManyExtractorsFromDomainStateForTemplateREDUNDANT,
  };
}

// ################################################################################################
export function getSelectorParamsForTemplateOnDomainState<ExtractorTemplateType extends ExtractorTemplateForDomainModel>(
  query: ExtractorTemplateType,
  extractorRunnerMap?: SyncExtractorRunnerMap<DomainState>
): SyncExtractorTemplateRunnerParams<ExtractorTemplateType, DomainState> {
  return {
    extractorTemplate: query,
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
  selectorParams: ExtractorTemplateRunnerParamsForJzodSchema<DomainModelGetEntityDefinitionExtractor, DomainState>
): JzodObject | undefined => {
  const localQuery: DomainModelGetEntityDefinitionExtractor = selectorParams.query;
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

