import {
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  EntityDefinition,
  JzodObject,
  QueryByEntityUuidGetEntityDefinition
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { Domain2QueryReturnType } from "../0_interfaces/2_domain/DomainElement";
import {
  ExtractorTemplateRunnerParamsForJzodSchema,
  QueryTemplateRunnerMapForJzodSchema,
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
  extractFetchQueryTemplateJzodSchema,
  extractJzodSchemaForDomainModelQueryTemplate,
  extractzodSchemaForSingleSelectQueryTemplate,
  runQueryTemplateWithExtractorCombinerTransformer
} from "./QueryTemplateSelectors";
import { getReduxDeploymentsStateIndex } from "./ReduxDeploymentsState";
import {
  selectEntityInstanceFromReduxDeploymentsState,
  selectEntityInstanceListFromReduxDeploymentsState,
  selectEntityInstanceUuidIndexFromReduxDeploymentsState,
} from "./ReduxDeploymentsStateQuerySelectors";
import { entityEntityDefinition } from "miroir-test-app_deployment-miroir";

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
export function getReduxDeploymentsStateJzodSchemaSelectorTemplateMap(): QueryTemplateRunnerMapForJzodSchema<ReduxDeploymentsState> {
  return {
    extractJzodSchemaForDomainModelQuery: extractJzodSchemaForDomainModelQueryTemplate,
    extractEntityJzodSchema: extractEntityJzodSchemaFromReduxDeploymentsStateForTemplate,
    extractFetchQueryJzodSchema: extractFetchQueryTemplateJzodSchema,
    extractzodSchemaForSingleSelectQuery: extractzodSchemaForSingleSelectQueryTemplate,
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


// ################################################################################################
// JZOD SCHEMAs selectors
// ################################################################################################
// ACCESSES deploymentEntityState
export const extractEntityJzodSchemaFromReduxDeploymentsStateForTemplate = (
  deploymentEntityState: ReduxDeploymentsState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  foreignKeyParams: ExtractorTemplateRunnerParamsForJzodSchema<QueryByEntityUuidGetEntityDefinition, ReduxDeploymentsState>
): JzodObject | undefined => {
  const localQuery: QueryByEntityUuidGetEntityDefinition = foreignKeyParams.query;
  const deploymentUuid = applicationDeploymentMap[localQuery.application]??"DEPLOYMENT_UUID_NOT_FOUND";
  const deploymentEntityStateIndex = getReduxDeploymentsStateIndex(
    deploymentUuid,
    "model",
    entityEntityDefinition.uuid
  );

  log.info("extractEntityJzodSchemaFromReduxDeploymentsState called with foreignKeyParams", foreignKeyParams);

  if (
    deploymentEntityState &&
    deploymentEntityState[deploymentEntityStateIndex] &&
    deploymentEntityState[deploymentEntityStateIndex].entities
  ) {
    const entityDefinition: EntityDefinition | undefined = Object.values(
      deploymentEntityState[deploymentEntityStateIndex].entities as Record<string, EntityDefinition>
    ).find((e: EntityDefinition) => e.entityUuid == foreignKeyParams.query.entityUuid);
    if (!entityDefinition) {
      log.warn(
        "extractEntityJzodSchemaFromReduxDeploymentsState foreignKeyParams",
        foreignKeyParams,
        "could not find entity definition for index",
        deploymentEntityStateIndex,
        "in state",
        deploymentEntityState,
        "for entity",
        foreignKeyParams.query.entityUuid,
        "in deployment",
        deploymentUuid
      );
      return undefined;
    }
    const result: JzodObject = entityDefinition.mlSchema;

    // log.info("extractEntityJzodSchemaFromReduxDeploymentsState foreignKeyParams", foreignKeyParams, "result", result);

    return result;
  } else {
    log.warn(
      "extractEntityJzodSchemaFromReduxDeploymentsState foreignKeyParams",
      foreignKeyParams,
      "could not find index",
      deploymentEntityStateIndex,
      "in state",
      deploymentEntityState,
      "for entity",
      foreignKeyParams.query.entityUuid,
      "in deployment",
      deploymentUuid
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
