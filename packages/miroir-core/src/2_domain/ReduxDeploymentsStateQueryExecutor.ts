import {
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunner,
  SyncQueryRunnerExtractorAndParams,
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";

import {
  EntityInstance,
  EntityInstancesUuidIndex
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import {
  Uuid,
} from "../0_interfaces/1_core/EntityDefinition";

import {
  ReduxDeploymentsState,
} from "../0_interfaces/2_domain/ReduxDeploymentsStateInterface";

import {
  Domain2QueryReturnType,
} from "../0_interfaces/2_domain/DomainElement";

import {
  extractEntityInstanceListWithObjectListExtractorInMemory,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
  extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
  runQuery,
} from "./QuerySelectors";

import {
  runQueryTemplateWithExtractorCombinerTransformer as runQueryTemplateWithExtractorCombinerTransformerFromTemplateSelectors
} from "./QueryTemplateSelectors";

import {
  getQueryRunnerParamsForReduxDeploymentsState,
  selectEntityInstanceFromReduxDeploymentsState,
  selectEntityInstanceListFromReduxDeploymentsState,
  selectEntityInstanceUuidIndexFromReduxDeploymentsState,
} from "./ReduxDeploymentsStateQuerySelectors";


import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { getApplicationSection } from "../1_core/Model";
import type { ApplicationDeploymentMap } from "../1_core/Deployment";


let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReduxDeploymentsStateQueryExecutor")
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
/**
 * Creates a non-memoized deployment entity state selector map for use outside of React hooks
 */
export function createReduxDeploymentsStateSelectorMap(): SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> {
  return {
    extractorType: "sync",
    extractState: (deploymentEntityState: ReduxDeploymentsState, params: any) => deploymentEntityState,
    extractEntityInstance: selectEntityInstanceFromReduxDeploymentsState,
    extractEntityInstanceUuidIndex: selectEntityInstanceUuidIndexFromReduxDeploymentsState,
    extractEntityInstanceList: selectEntityInstanceListFromReduxDeploymentsState,
    extractEntityInstanceUuidIndexWithObjectListExtractor: extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
    extractEntityInstanceListWithObjectListExtractor: extractEntityInstanceListWithObjectListExtractorInMemory,
    runQuery: runQuery,
    extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
    runQueryTemplateWithExtractorCombinerTransformer: runQueryTemplateWithExtractorCombinerTransformerFromTemplateSelectors,
  };
}

// ################################################################################################
/**
 * Executes a deployment entity state query without React hooks or memoization
 */
export function executeReduxDeploymentsStateQuery<T>(
  deploymentEntityState: ReduxDeploymentsState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState>,
  selectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState>,
): T {
  const queryRunner = selectorMap.runQuery as SyncQueryRunner<
    ReduxDeploymentsState,
    Domain2QueryReturnType<any>
  >;
  
  const result = queryRunner(
    deploymentEntityState,
    applicationDeploymentMap,
    queryParams,
    modelEnvironment
  );
  return result as T;
}

// ################################################################################################
/**
 * Gets entity instances UUID index for a specific entity without hooks
 */
export function getEntityInstancesUuidIndexNonHook(
  deploymentEntityState: ReduxDeploymentsState,
  modelEnvironment: MiroirModelEnvironment,
  application: Uuid,
  applicationDeploymentMap: ApplicationDeploymentMap,
  currentDeploymentUuid: Uuid,
  targetEntity: Uuid,
  orderBy?: string,
// ): EntityInstancesUuidIndex {
): EntityInstance[] {
  log.info(
    "getEntityInstancesUuidIndexNonHook called with",
    "deploymentEntityState",
    deploymentEntityState,
    "currentDeploymentUuid",
    currentDeploymentUuid,
    "targetEntity",
    targetEntity,
    "orderBy",
    orderBy
  );
  // Create selector map (non-memoized)
  const selectorMap = createReduxDeploymentsStateSelectorMap();
  
  // Generate query parameters
  const queryParams = getQueryRunnerParamsForReduxDeploymentsState(
    {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      application,
      deploymentUuid: currentDeploymentUuid,
      pageParams: {},
      queryParams: {},
      contextResults: {},
      extractors: {
        [targetEntity]: {
          extractorOrCombinerType: "extractorByEntityReturningObjectList",
          applicationSection: getApplicationSection(currentDeploymentUuid, targetEntity),
          parentName: "",
          parentUuid: targetEntity,
          orderBy: orderBy ? {
            attributeName: orderBy,
          } : undefined,
        },
      },
    },
    selectorMap
  );
  
  // Execute query
  // const result = executeReduxDeploymentsStateQuery<Record<string, EntityInstancesUuidIndex>>(
  const result = executeReduxDeploymentsStateQuery<Record<string, EntityInstance[]>>(
    deploymentEntityState,
    applicationDeploymentMap,
    modelEnvironment,
    queryParams,
    selectorMap,
  );
  
  return result[targetEntity] || {};
}

// ################################################################################################
/**
 * Gets entity instances UUID index for multiple entities without hooks
 */
export function getMultipleEntityInstancesUuidIndexNonHook(
  deploymentEntityState: ReduxDeploymentsState,
  modelEnvironment: MiroirModelEnvironment,
  application: Uuid,
  applicationDeploymentMap: ApplicationDeploymentMap,
  currentDeploymentUuid: string,
  targetEntities: { entityUuid: string; orderBy?: string }[]
): Record<string, EntityInstancesUuidIndex> {
  
  if (targetEntities.length === 0) {
    return {};
  }
  
  // Create selector map (non-memoized)
  const selectorMap = createReduxDeploymentsStateSelectorMap();
  
  // Generate extractors for all target entities
  const extractors = Object.fromEntries(
    targetEntities.map(({ entityUuid, orderBy }) => [
      entityUuid,
      {
        extractorOrCombinerType: "extractorByEntityReturningObjectList" as const,
        applicationSection: getApplicationSection(currentDeploymentUuid, entityUuid),
        parentName: "",
        parentUuid: entityUuid,
        orderBy: orderBy ? {
          attributeName: orderBy,
        } : undefined,
      }
    ])
  );
  
  // Generate query parameters
  const queryParams = getQueryRunnerParamsForReduxDeploymentsState(
    {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      application,
      deploymentUuid: currentDeploymentUuid,
      pageParams: {},
      queryParams: {},
      contextResults: {},
      extractors,
    },
    selectorMap
  );
  
  // Execute query
  return executeReduxDeploymentsStateQuery<Record<string, EntityInstancesUuidIndex>>(
    deploymentEntityState,
    applicationDeploymentMap,
    modelEnvironment,
    queryParams,
    selectorMap
  );
}
