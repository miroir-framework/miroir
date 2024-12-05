import { createSelector } from "@reduxjs/toolkit";
import {
  DeploymentEntityState,
  QueryRunnerMapForJzodSchema,
  SyncBoxedExtractorOrQueryRunnerMap,
  extractEntityInstanceListWithObjectListExtractorInMemory,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
  extractEntityJzodSchemaFromDeploymentEntityState,
  extractFetchQueryJzodSchema,
  extractJzodSchemaForDomainModelQuery,
  extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
  runQueryTemplateWithExtractorCombinerTransformer,
  runQuery,
  extractzodSchemaForSingleSelectQuery,
  selectEntityInstanceFromDeploymentEntityState,
  selectEntityInstanceListFromDeploymentEntityState,
  selectEntityInstanceUuidIndexFromDeploymentEntityState
} from "miroir-core";

const deploymentEntityStateSelector = (deploymentEntityState: DeploymentEntityState, params: any) => deploymentEntityState;
const deploymentEntityStateSelectorParams = (deploymentEntityState: DeploymentEntityState, params: any) => params;

export function getMemoizedDeploymentEntityStateSelectorMap(): SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState> {
  return {
    extractorType: "sync",
    extractEntityInstance: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectEntityInstanceFromDeploymentEntityState
    ),
    extractEntityInstanceUuidIndex: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectEntityInstanceUuidIndexFromDeploymentEntityState
    ),
    extractEntityInstanceList: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectEntityInstanceListFromDeploymentEntityState
    ),
    extractEntityInstanceUuidIndexWithObjectListExtractor: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      extractEntityInstanceUuidIndexWithObjectListExtractorInMemory
    ),
    extractEntityInstanceListWithObjectListExtractor: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      extractEntityInstanceListWithObjectListExtractorInMemory
    ),
    runQuery: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      runQuery
    ),
    extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList
    ),
    // ############################################################################################
    runQueryTemplateWithExtractorCombinerTransformer: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      runQueryTemplateWithExtractorCombinerTransformer
    ),

  };
}

export function getMemoizedDeploymentEntityStateJzodSchemaSelectorMap(): QueryRunnerMapForJzodSchema<DeploymentEntityState> {
  return {
    extractJzodSchemaForDomainModelQuery: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      extractJzodSchemaForDomainModelQuery
    ),
    extractEntityJzodSchema: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      extractEntityJzodSchemaFromDeploymentEntityState
    ),
    extractFetchQueryJzodSchema: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      extractFetchQueryJzodSchema
    ),
    extractzodSchemaForSingleSelectQuery: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      extractzodSchemaForSingleSelectQuery
    ),
  };
}
