import { createSelector } from "@reduxjs/toolkit";
import {
  DeploymentEntityState,
  ExtractorRunnerMapForJzodSchema,
  SyncExtractorRunnerMap,
  extractWithManyExtractors,
  selectEntityInstanceFromDeploymentEntityState,
  extractEntityInstanceUuidIndexWithObjectListExtractor,
  selectEntityInstanceUuidIndexFromDeploymentEntityState,
  extractEntityJzodSchemaFromDeploymentEntityState,
  extractFetchQueryJzodSchema,
  extractJzodSchemaForDomainModelQuery,
  extractzodSchemaForSingleSelectQuery,
  extractWithExtractor
} from "miroir-core";

const deploymentEntityStateSelector = (domainState: DeploymentEntityState, params: any) => domainState;
const deploymentEntityStateSelectorParams = (domainState: DeploymentEntityState, params: any) => params;

export function getMemoizedDeploymentEntityStateSelectorMap(): SyncExtractorRunnerMap<DeploymentEntityState> {
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
    extractEntityInstanceUuidIndexWithObjectListExtractor: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      extractEntityInstanceUuidIndexWithObjectListExtractor
    ),
    extractWithManyExtractors: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      extractWithManyExtractors
    ),
    extractWithExtractor: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      extractWithExtractor
    ),
  };
}

export function getMemoizedDeploymentEntityStateJzodSchemaSelectorMap(): ExtractorRunnerMapForJzodSchema<DeploymentEntityState> {
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
