import {
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunner,
  SyncQueryRunnerParams,
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";

import {
  EntityInstancesUuidIndex,
  EntityInstance,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import {
  Uuid,
} from "../0_interfaces/1_core/EntityDefinition";

import {
  DeploymentEntityState,
} from "../0_interfaces/2_domain/DeploymentStateInterface";

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
  getQueryRunnerParamsForDeploymentEntityState,
  selectEntityInstanceFromDeploymentEntityState,
  selectEntityInstanceListFromDeploymentEntityState,
  selectEntityInstanceUuidIndexFromDeploymentEntityState,
} from "./DeploymentEntityStateQuerySelectors";

import { 
  dummyDomainManyQueryWithDeploymentUuid 
} from "./DomainStateQuerySelectors";

import { 
  getApplicationSection 
} from "../1_core/AdminApplication";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/LoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";


let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "DeploymentEntityStateQueryExecutor")
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
/**
 * Creates a non-memoized deployment entity state selector map for use outside of React hooks
 */
export function createDeploymentEntityStateSelectorMap(): SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState> {
  return {
    extractorType: "sync",
    extractState: (deploymentEntityState: DeploymentEntityState, params: any) => deploymentEntityState,
    extractEntityInstance: selectEntityInstanceFromDeploymentEntityState,
    extractEntityInstanceUuidIndex: selectEntityInstanceUuidIndexFromDeploymentEntityState,
    extractEntityInstanceList: selectEntityInstanceListFromDeploymentEntityState,
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
export function executeDeploymentEntityStateQuery<T>(
  deploymentEntityState: DeploymentEntityState,
  queryParams: SyncQueryRunnerParams<DeploymentEntityState>,
  selectorMap: SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState>
): T {
  const queryRunner = selectorMap.runQuery as SyncQueryRunner<
    DeploymentEntityState,
    Domain2QueryReturnType<any>
  >;
  
  const result = queryRunner(deploymentEntityState, queryParams);
  return result as T;
}

// ################################################################################################
/**
 * Gets entity instances UUID index for a specific entity without hooks
 */
export function getEntityInstancesUuidIndexNonHook(
  deploymentEntityState: DeploymentEntityState,
  currentDeploymentUuid: Uuid,
  targetEntity: Uuid,
  orderBy?: string
): EntityInstancesUuidIndex {
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
  const selectorMap = createDeploymentEntityStateSelectorMap();
  
  // Generate query parameters
  const queryParams = getQueryRunnerParamsForDeploymentEntityState(
    {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
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
  const result = executeDeploymentEntityStateQuery<Record<string, EntityInstancesUuidIndex>>(
    deploymentEntityState,
    queryParams,
    selectorMap
  );
  
  return result[targetEntity] || {};
}

// ################################################################################################
/**
 * Gets entity instances UUID index for multiple entities without hooks
 */
export function getMultipleEntityInstancesUuidIndexNonHook(
  deploymentEntityState: DeploymentEntityState,
  currentDeploymentUuid: string,
  targetEntities: { entityUuid: string; orderBy?: string }[]
): Record<string, EntityInstancesUuidIndex> {
  
  if (targetEntities.length === 0) {
    return {};
  }
  
  // Create selector map (non-memoized)
  const selectorMap = createDeploymentEntityStateSelectorMap();
  
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
  const queryParams = getQueryRunnerParamsForDeploymentEntityState(
    {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      deploymentUuid: currentDeploymentUuid,
      pageParams: {},
      queryParams: {},
      contextResults: {},
      extractors,
    },
    selectorMap
  );
  
  // Execute query
  return executeDeploymentEntityStateQuery<Record<string, EntityInstancesUuidIndex>>(
    deploymentEntityState,
    queryParams,
    selectorMap
  );
}
