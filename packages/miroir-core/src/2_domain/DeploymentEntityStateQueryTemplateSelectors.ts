import {
  BoxedExtractorTemplateReturningObjectOrObjectList,
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  EntityDefinition,
  JzodObject,
  QueryByEntityUuidGetEntityDefinition
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { DeploymentEntityState } from "../0_interfaces/2_domain/DeploymentStateInterface";
import { Domain2QueryReturnType } from "../0_interfaces/2_domain/DomainElement";
import {
  ExtractorTemplateRunnerParamsForJzodSchema,
  QueryTemplateRunnerMapForJzodSchema,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncBoxedExtractorTemplateRunnerParams,
  SyncQueryTemplateRunner,
  SyncQueryTemplateRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/LoggerFactory";
const entityEntityDefinition = require("../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json");
import { packageName } from "../constants";
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
  extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
  runQuery,
} from "./QuerySelectors";
import {
  extractFetchQueryTemplateJzodSchema,
  extractJzodSchemaForDomainModelQueryTemplate,
  extractzodSchemaForSingleSelectQueryTemplate,
  runQueryTemplateWithExtractorCombinerTransformer
} from "./QueryTemplateSelectors";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "DeploymentEntityStateQueryTemplateSelector")
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
export const runQueryTemplateFromDeploymentEntityState: SyncQueryTemplateRunner<
  DeploymentEntityState,
  Domain2QueryReturnType<Record<string, any>>
> = runQueryTemplateWithExtractorCombinerTransformer<DeploymentEntityState>;

// ################################################################################################
// #### selector Maps
// ################################################################################################
export function getDeploymentEntityStateSelectorTemplateMap(): SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState> {
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
    extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
    // 
    runQueryTemplateWithExtractorCombinerTransformer: runQueryTemplateWithExtractorCombinerTransformer,
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
export type GetExtractorTemplateRunnerParamsForDeploymentEntityState = <QueryType extends BoxedExtractorTemplateReturningObjectOrObjectList>(
  query: QueryType,
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState>
) => SyncBoxedExtractorTemplateRunnerParams<QueryType, DeploymentEntityState>;
// ) => SyncExtractorOrQueryTemplateRunnerParams<QueryType, DeploymentEntityState>;

export function getExtractorTemplateRunnerParamsForDeploymentEntityState<QueryType extends BoxedExtractorTemplateReturningObjectOrObjectList>(
  query: QueryType,
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState>
): SyncBoxedExtractorTemplateRunnerParams<QueryType, DeploymentEntityState> {
  return {
    extractorOrCombinerTemplate: query,
    extractorRunnerMap: extractorRunnerMap ?? getDeploymentEntityStateSelectorTemplateMap(),
  };
}

// ################################################################################################
export type GetQueryTemplateRunnerParamsForDeploymentEntityState = (
  query: BoxedQueryTemplateWithExtractorCombinerTransformer,
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState>
) => SyncQueryTemplateRunnerParams<DeploymentEntityState>;

export function getQueryTemplateRunnerParamsForDeploymentEntityState(
  query: BoxedQueryTemplateWithExtractorCombinerTransformer,
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState>
): SyncQueryTemplateRunnerParams<DeploymentEntityState> {
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
