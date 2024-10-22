import { createSelector } from "@reduxjs/toolkit";
import {
  DeploymentEntityState,
  ExtractorTemplateRunnerMapForJzodSchema,
  SyncExtractorRunnerMap,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
  extractEntityJzodSchemaFromDeploymentEntityState,
  extractFetchQueryJzodSchema,
  extractJzodSchemaForDomainModelQuery,
  extractWithExtractor,
  extractWithManyExtractorTemplates,
  extractWithManyExtractors,
  extractzodSchemaForSingleSelectQuery,
  selectEntityInstanceFromDeploymentEntityState,
  selectEntityInstanceUuidIndexFromDeploymentEntityState
} from "miroir-core";

const deploymentEntityStateSelector = (domainState: DeploymentEntityState, params: any) => domainState;
const deploymentEntityStateSelectorParams = (domainState: DeploymentEntityState, params: any) => params;

export function getMemoizedDeploymentEntityStateSelectorForTemplateMap(): SyncExtractorRunnerMap<DeploymentEntityState> {
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
      extractEntityInstanceUuidIndexWithObjectListExtractorInMemory
    ),
    extractWithManyExtractors: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      extractWithManyExtractors
    ),
    extractWithExtractor: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      extractWithExtractor
    ),

    // 
    extractWithManyExtractorTemplates: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      extractWithManyExtractorTemplates
    ),
  };
}

export function getMemoizedDeploymentEntityStateJzodSchemaSelectorTemplateMap(): ExtractorTemplateRunnerMapForJzodSchema<DeploymentEntityState> {
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
