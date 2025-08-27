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
  type MiroirModelEnvironment
} from "miroir-core";

const deploymentEntityStateSelector = (
  deploymentEntityState: ReduxDeploymentsState,
  params: any,
  modelEnvironment: MiroirModelEnvironment
) => deploymentEntityState;
const deploymentEntityStateSelectorParams = (
  deploymentEntityState: ReduxDeploymentsState,
  params: any,
  modelEnvironment: MiroirModelEnvironment
) => params;
const miroirModelEnvironmentSelectorParams = (
  deploymentEntityState: ReduxDeploymentsState,
  params: any,
  modelEnvironment: MiroirModelEnvironment
) => modelEnvironment;

export function getMemoizedReduxDeploymentsStateSelectorMap(): SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> {
  return {
    extractorType: "sync",
    extractState: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams, miroirModelEnvironmentSelectorParams],
      (deploymentEntityState, params) => deploymentEntityState
    ),
    extractEntityInstance: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams, miroirModelEnvironmentSelectorParams],
      selectEntityInstanceFromReduxDeploymentsState
    ),
    extractEntityInstanceUuidIndex: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams, miroirModelEnvironmentSelectorParams],
      selectEntityInstanceUuidIndexFromReduxDeploymentsState
    ),
    extractEntityInstanceList: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams, miroirModelEnvironmentSelectorParams],
      selectEntityInstanceListFromReduxDeploymentsState
    ),
    extractEntityInstanceUuidIndexWithObjectListExtractor: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams, miroirModelEnvironmentSelectorParams],
      extractEntityInstanceUuidIndexWithObjectListExtractorInMemory
    ),
    extractEntityInstanceListWithObjectListExtractor: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams, miroirModelEnvironmentSelectorParams],
      extractEntityInstanceListWithObjectListExtractorInMemory
    ),
    runQuery: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams, miroirModelEnvironmentSelectorParams],
      runQuery
    ),
    extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams, miroirModelEnvironmentSelectorParams],
      extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList
    ),
    // ############################################################################################
    runQueryTemplateWithExtractorCombinerTransformer: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams, miroirModelEnvironmentSelectorParams],
      runQueryTemplateWithExtractorCombinerTransformer
    ),
  };
}

export function getMemoizedReduxDeploymentsStateJzodSchemaSelectorMap(): QueryRunnerMapForJzodSchema<ReduxDeploymentsState> {
  return {
    extractJzodSchemaForDomainModelQuery: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams, miroirModelEnvironmentSelectorParams],
      extractJzodSchemaForDomainModelQuery
    ),
    extractEntityJzodSchema: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams, miroirModelEnvironmentSelectorParams],
      extractEntityJzodSchemaFromReduxDeploymentsState
    ),
    extractFetchQueryJzodSchema: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams, miroirModelEnvironmentSelectorParams],
      extractFetchQueryJzodSchema
    ),
    extractzodSchemaForSingleSelectQuery: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams, miroirModelEnvironmentSelectorParams],
      extractzodSchemaForSingleSelectQuery
    ),
  };
}
