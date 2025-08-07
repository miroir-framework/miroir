import {
  BoxedExtractorTemplateReturningObjectOrObjectList,
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  EntityDefinition,
  JzodObject,
  QueryByEntityUuidGetEntityDefinition
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { ReduxDeploymentsState } from "../0_interfaces/2_domain/ReduxDeploymentsStateInterface";
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
import { getReduxDeploymentsStateIndex } from "./ReduxDeploymentsState";
import {
  selectEntityInstanceFromReduxDeploymentsState,
  selectEntityInstanceListFromReduxDeploymentsState,
  selectEntityInstanceUuidIndexFromReduxDeploymentsState,
} from "./ReduxDeploymentsStateQuerySelectors";
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
    extractorType: "sync",
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
export function getReduxDeploymentsStateJzodSchemaSelectorTemplateMap(): QueryTemplateRunnerMapForJzodSchema<ReduxDeploymentsState> {
  return {
    extractJzodSchemaForDomainModelQuery: extractJzodSchemaForDomainModelQueryTemplate,
    extractEntityJzodSchema: extractEntityJzodSchemaFromReduxDeploymentsStateForTemplate,
    extractFetchQueryJzodSchema: extractFetchQueryTemplateJzodSchema,
    extractzodSchemaForSingleSelectQuery: extractzodSchemaForSingleSelectQueryTemplate,
  };
}

// ################################################################################################
export type GetExtractorTemplateRunnerParamsForReduxDeploymentsState = <QueryType extends BoxedExtractorTemplateReturningObjectOrObjectList>(
  query: QueryType,
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState>
) => SyncBoxedExtractorTemplateRunnerParams<QueryType, ReduxDeploymentsState>;
// ) => SyncExtractorOrQueryTemplateRunnerParams<QueryType, ReduxDeploymentsState>;

export function getExtractorTemplateRunnerParamsForReduxDeploymentsState<QueryType extends BoxedExtractorTemplateReturningObjectOrObjectList>(
  query: QueryType,
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState>
): SyncBoxedExtractorTemplateRunnerParams<QueryType, ReduxDeploymentsState> {
  return {
    extractorOrCombinerTemplate: query,
    extractorRunnerMap: extractorRunnerMap ?? getReduxDeploymentsStateSelectorTemplateMap(),
  };
}

// ################################################################################################
export type GetQueryTemplateRunnerParamsForReduxDeploymentsState = (
  query: BoxedQueryTemplateWithExtractorCombinerTransformer,
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState>
) => SyncQueryTemplateRunnerParams<ReduxDeploymentsState>;

export function getQueryTemplateRunnerParamsForReduxDeploymentsState(
  query: BoxedQueryTemplateWithExtractorCombinerTransformer,
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState>
): SyncQueryTemplateRunnerParams<ReduxDeploymentsState> {
  return {
    extractorOrCombinerTemplate: query,
    extractorRunnerMap: extractorRunnerMap ?? getReduxDeploymentsStateSelectorTemplateMap(),
  };
}


// ################################################################################################
// JZOD SCHEMAs selectors
// ################################################################################################
// ACCESSES deploymentEntityState
export const extractEntityJzodSchemaFromReduxDeploymentsStateForTemplate = (
  deploymentEntityState: ReduxDeploymentsState,
  selectorParams: ExtractorTemplateRunnerParamsForJzodSchema<QueryByEntityUuidGetEntityDefinition, ReduxDeploymentsState>
): JzodObject | undefined => {
  const localQuery: QueryByEntityUuidGetEntityDefinition = selectorParams.query;

  const deploymentEntityStateIndex = getReduxDeploymentsStateIndex(
    localQuery.deploymentUuid,
    "model",
    entityEntityDefinition.uuid
  );

  log.info("extractEntityJzodSchemaFromReduxDeploymentsState called with selectorParams", selectorParams);

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
        "extractEntityJzodSchemaFromReduxDeploymentsState selectorParams",
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

    log.info("extractEntityJzodSchemaFromReduxDeploymentsState selectorParams", selectorParams, "result", result);

    return result;
  } else {
    log.warn(
      "extractEntityJzodSchemaFromReduxDeploymentsState selectorParams",
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
    //   "DomainSelector extractEntityJzodSchemaFromReduxDeploymentsState could not find entity " +
    //     entityEntityDefinition.uuid +
    //     " in deployment " +
    //     localQuery.deploymentUuid +
    //     ""
    // );
    return undefined;
  }
};
