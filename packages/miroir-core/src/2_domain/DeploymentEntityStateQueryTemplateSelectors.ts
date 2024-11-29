import {
  QueryByEntityUuidGetEntityDefinition,
  EntityDefinition,
  QueryTemplateDEFUNCT,
  JzodObject
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { DeploymentEntityState } from "../0_interfaces/2_domain/DeploymentStateInterface";
import {
  QueryTemplateRunnerMapForJzodSchema,
  ExtractorTemplateRunnerParamsForJzodSchema,
  SyncExtractorOrQueryRunnerMap,
  SyncExtractorOrQueryTemplateRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/Logger";
import entityEntityDefinition from "../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json";
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { cleanLevel } from "./constants";
import { getDeploymentEntityStateIndex } from "./DeploymentEntityState";
import {
  selectEntityInstanceFromDeploymentEntityState,
  selectEntityInstanceListFromDeploymentEntityState,
  selectEntityInstanceUuidIndexFromDeploymentEntityState,
} from "./DeploymentEntityStateQuerySelectors";
import {
  extractEntityInstanceListWithObjectListExtractorInMemory,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
  extractWithExtractor,
  runQuery,
} from "./QuerySelectors";
import {
  extractFetchQueryTemplateJzodSchema,
  extractJzodSchemaForDomainModelQueryTemplate,
  extractWithManyExtractorTemplates,
  extractzodSchemaForSingleSelectQueryTemplate
} from "./QueryTemplateSelectors";

const loggerName: string = getLoggerName(packageName, cleanLevel, "DeploymentEntityStateQueryTemplateSelector");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

// ################################################################################################
// #### selector Maps
// ################################################################################################
export function getDeploymentEntityStateSelectorTemplateMap(): SyncExtractorOrQueryRunnerMap<DeploymentEntityState> {
  return {
    extractorType: "sync",
    extractEntityInstanceUuidIndex: selectEntityInstanceUuidIndexFromDeploymentEntityState,
    extractEntityInstanceList: selectEntityInstanceListFromDeploymentEntityState,
    extractEntityInstance: selectEntityInstanceFromDeploymentEntityState,
    extractEntityInstanceUuidIndexWithObjectListExtractor:
      extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
    extractEntityInstanceListWithObjectListExtractor:
      extractEntityInstanceListWithObjectListExtractorInMemory,
    runQuery: runQuery,
    extractWithExtractor: extractWithExtractor,
    // 
    extractWithManyExtractorTemplates: extractWithManyExtractorTemplates,
  };
}

// ################################################################################################
export function getDeploymentEntityStateJzodSchemaSelectorTemplateMap(): QueryTemplateRunnerMapForJzodSchema<DeploymentEntityState> {
  return {
    extractJzodSchemaForDomainModelQuery: extractJzodSchemaForDomainModelQueryTemplate,
    extractEntityJzodSchema: extractEntityJzodSchemaFromDeploymentEntityStateForTemplate,
    extractFetchQueryJzodSchema: extractFetchQueryTemplateJzodSchema,
    extractzodSchemaForSingleSelectQuery: extractzodSchemaForSingleSelectQueryTemplate,
  };
}

// ################################################################################################
export type GetExtractorTemplateRunnerParamsForDeploymentEntityState = <QueryType extends QueryTemplateDEFUNCT>(
  query: QueryType,
  extractorRunnerMap?: SyncExtractorOrQueryRunnerMap<DeploymentEntityState>
) => SyncExtractorOrQueryTemplateRunnerParams<QueryType, DeploymentEntityState>;

export function getExtractorTemplateRunnerParamsForDeploymentEntityState<QueryType extends QueryTemplateDEFUNCT>(
  query: QueryType,
  extractorRunnerMap?: SyncExtractorOrQueryRunnerMap<DeploymentEntityState>
): SyncExtractorOrQueryTemplateRunnerParams<QueryType, DeploymentEntityState> {
  return {
    extractorOrCombinerTemplate: query,
    extractorRunnerMap: extractorRunnerMap ?? getDeploymentEntityStateSelectorTemplateMap(),
  };
}


// ################################################################################################
// JZOD SCHEMAs selectors
// ################################################################################################
// ACCESSES deploymentEntityState
export const extractEntityJzodSchemaFromDeploymentEntityStateForTemplate = (
  deploymentEntityState: DeploymentEntityState,
  selectorParams: ExtractorTemplateRunnerParamsForJzodSchema<QueryByEntityUuidGetEntityDefinition, DeploymentEntityState>
): JzodObject | undefined => {
  const localQuery: QueryByEntityUuidGetEntityDefinition = selectorParams.query;

  const deploymentEntityStateIndex = getDeploymentEntityStateIndex(
    localQuery.deploymentUuid,
    "model",
    entityEntityDefinition.uuid
  );

  log.info("extractEntityJzodSchemaFromDeploymentEntityState called with selectorParams", selectorParams);

  if (
    deploymentEntityState &&
    deploymentEntityState[deploymentEntityStateIndex] &&
    deploymentEntityState[deploymentEntityStateIndex].entities
    // deploymentEntityState[deploymentEntityStateIndex].entities[entityEntityDefinition.uuid]
    // deploymentEntityState[deploymentEntityStateIndex].entities[selectorParams.query.entityUuid]
  ) {
    const entityDefinition: EntityDefinition | undefined = Object.values(
      deploymentEntityState[deploymentEntityStateIndex].entities as Record<string, EntityDefinition>
    ).find((e: EntityDefinition) => e.entityUuid == selectorParams.query.entityUuid);
    if (!entityDefinition) {
      log.warn(
        "extractEntityJzodSchemaFromDeploymentEntityState selectorParams",
        selectorParams,
        "could not find entity definition for index",
        deploymentEntityStateIndex,
        "in state",
        deploymentEntityState,
        "for entity",
        selectorParams.query.entityUuid,
        "in deployment",
        localQuery.deploymentUuid
      );
      return undefined;
    }
    const result: JzodObject = entityDefinition.jzodSchema;
    // const result: JzodObject = (
    //   deploymentEntityState[deploymentEntityStateIndex].entities[selectorParams.query.entityUuid] as EntityDefinition
    // ).jzodSchema;

    log.info("extractEntityJzodSchemaFromDeploymentEntityState selectorParams", selectorParams, "result", result);

    return result;
  } else {
    log.warn(
      "extractEntityJzodSchemaFromDeploymentEntityState selectorParams",
      selectorParams,
      "could not find index",
      deploymentEntityStateIndex,
      "in state",
      deploymentEntityState,
      "for entity",
      selectorParams.query.entityUuid,
      "in deployment",
      localQuery.deploymentUuid
    );
    // throw new Error(
    //   "DomainSelector extractEntityJzodSchemaFromDeploymentEntityState could not find entity " +
    //     entityEntityDefinition.uuid +
    //     " in deployment " +
    //     localQuery.deploymentUuid +
    //     ""
    // );
    return undefined;
  }
};
