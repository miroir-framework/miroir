import { createSelector } from "@reduxjs/toolkit";
import {
  ReduxDeploymentsState,
  QueryRunnerMapForJzodSchema,
  SyncBoxedExtractorOrQueryRunnerMap,
  extractEntityInstanceListWithObjectListExtractorInMemory,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
  extractEntityJzodSchemaFromReduxDeploymentsState,
  extractFetchQueryJzodSchema,
  extractJzodSchemaForDomainModelQuery,
  extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
  runQueryTemplateWithExtractorCombinerTransformer,
  runQuery,
  extractzodSchemaForSingleSelectQuery,
  selectEntityInstanceFromReduxDeploymentsState,
  selectEntityInstanceListFromReduxDeploymentsState,
  selectEntityInstanceUuidIndexFromReduxDeploymentsState,
  type MiroirModelEnvironment,
  type ApplicationDeploymentMap
} from "miroir-core";

// ################################################################################################
// Selector factories for memoization
// ################################################################################################
const deploymentEntityStateSelector = (
  deploymentEntityState: ReduxDeploymentsState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: any,
  modelEnvironment: MiroirModelEnvironment
) => deploymentEntityState;

const applicationDeploymentMapSelector = (
  deploymentEntityState: ReduxDeploymentsState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: any,
  modelEnvironment: MiroirModelEnvironment
) => applicationDeploymentMap;

const deploymentEntityStateSelectorParams = (
  deploymentEntityState: ReduxDeploymentsState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: any,
  modelEnvironment: MiroirModelEnvironment
) => params;

const miroirModelEnvironmentSelectorParams = (
  deploymentEntityState: ReduxDeploymentsState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: any,
  modelEnvironment: MiroirModelEnvironment
) => modelEnvironment;

// ################################################################################################
/**
 * Returns memoized selectors for ReduxDeploymentsState (Zustand-compatible).
 * Uses the same createSelector from Redux Toolkit for memoization.
 */
export function getMemoizedReduxDeploymentsStateSelectorMap(): SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> {
  return {
    extractorOrCombinerType: "sync",
    extractState: createSelector(
      [
        deploymentEntityStateSelector,
        applicationDeploymentMapSelector,
        deploymentEntityStateSelectorParams,
        miroirModelEnvironmentSelectorParams,
      ],
      (deploymentEntityState, applicationDeploymentMap, params) => deploymentEntityState
    ),
    extractEntityInstance: createSelector(
      [
        deploymentEntityStateSelector,
        applicationDeploymentMapSelector,
        deploymentEntityStateSelectorParams,
        miroirModelEnvironmentSelectorParams,
      ],
      selectEntityInstanceFromReduxDeploymentsState
    ),
    extractEntityInstanceUuidIndex: createSelector(
      [
        deploymentEntityStateSelector,
        applicationDeploymentMapSelector,
        deploymentEntityStateSelectorParams,
        miroirModelEnvironmentSelectorParams,
      ],
      selectEntityInstanceUuidIndexFromReduxDeploymentsState
    ),
    extractEntityInstanceList: createSelector(
      [
        deploymentEntityStateSelector,
        applicationDeploymentMapSelector,
        deploymentEntityStateSelectorParams,
        miroirModelEnvironmentSelectorParams,
      ],
      selectEntityInstanceListFromReduxDeploymentsState
    ),
    extractEntityInstanceUuidIndexWithObjectListExtractor: createSelector(
      [
        deploymentEntityStateSelector,
        applicationDeploymentMapSelector,
        deploymentEntityStateSelectorParams,
        miroirModelEnvironmentSelectorParams,
      ],
      extractEntityInstanceUuidIndexWithObjectListExtractorInMemory
    ),
    extractEntityInstanceListWithObjectListExtractor: createSelector(
      [
        deploymentEntityStateSelector,
        applicationDeploymentMapSelector,
        deploymentEntityStateSelectorParams,
        miroirModelEnvironmentSelectorParams,
      ],
      extractEntityInstanceListWithObjectListExtractorInMemory
    ),
    runQuery: createSelector(
      [
        deploymentEntityStateSelector,
        applicationDeploymentMapSelector,
        deploymentEntityStateSelectorParams,
        miroirModelEnvironmentSelectorParams,
      ],
      runQuery
    ),
    extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: createSelector(
      [
        deploymentEntityStateSelector,
        applicationDeploymentMapSelector,
        deploymentEntityStateSelectorParams,
        miroirModelEnvironmentSelectorParams,
      ],
      extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList
    ),
    runQueryTemplateWithExtractorCombinerTransformer: createSelector(
      [
        deploymentEntityStateSelector,
        applicationDeploymentMapSelector,
        deploymentEntityStateSelectorParams,
        miroirModelEnvironmentSelectorParams,
      ],
      runQueryTemplateWithExtractorCombinerTransformer
    ),
  };
}

// ################################################################################################
/**
 * Returns memoized Jzod schema selectors for ReduxDeploymentsState (Zustand-compatible).
 */
export function getMemoizedReduxDeploymentsStateJzodSchemaSelectorMap(): QueryRunnerMapForJzodSchema<ReduxDeploymentsState> {
  return {
    extractJzodSchemaForDomainModelQuery: createSelector(
      [
        deploymentEntityStateSelector,
        applicationDeploymentMapSelector,
        deploymentEntityStateSelectorParams,
        miroirModelEnvironmentSelectorParams,
      ],
      extractJzodSchemaForDomainModelQuery
    ),
    extractEntityJzodSchema: createSelector(
      [
        deploymentEntityStateSelector,
        applicationDeploymentMapSelector,
        deploymentEntityStateSelectorParams,
        miroirModelEnvironmentSelectorParams,
      ],
      extractEntityJzodSchemaFromReduxDeploymentsState
    ),
    extractFetchQueryJzodSchema: createSelector(
      [
        deploymentEntityStateSelector,
        applicationDeploymentMapSelector,
        deploymentEntityStateSelectorParams,
        miroirModelEnvironmentSelectorParams,
      ],
      extractFetchQueryJzodSchema
    ),
    extractzodSchemaForSingleSelectQuery: createSelector(
      [
        deploymentEntityStateSelector,
        applicationDeploymentMapSelector,
        deploymentEntityStateSelectorParams,
        miroirModelEnvironmentSelectorParams,
      ],
      extractzodSchemaForSingleSelectQuery
    ),
  };
}
