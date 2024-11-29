import { createSelector } from "@reduxjs/toolkit";
import {
  DeploymentEntityState,
  QueryTemplateRunnerMapForJzodSchema,
  SyncExtractorOrQueryRunnerMap,
  extractEntityInstanceListWithObjectListExtractorInMemory,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
  extractEntityJzodSchemaFromDeploymentEntityState,
  extractFetchQueryJzodSchema,
  extractJzodSchemaForDomainModelQuery,
  extractWithExtractor,
  extractWithManyExtractorTemplates,
  runQuery,
  extractzodSchemaForSingleSelectQuery,
  selectEntityInstanceFromDeploymentEntityState,
  selectEntityInstanceListFromDeploymentEntityState,
  selectEntityInstanceUuidIndexFromDeploymentEntityState
} from "miroir-core";

const deploymentEntityStateSelector = (domainState: DeploymentEntityState, params: any) => domainState;
const deploymentEntityStateSelectorParams = (domainState: DeploymentEntityState, params: any) => params;

export function getMemoizedDeploymentEntityStateSelectorForTemplateMap(): SyncExtractorOrQueryRunnerMap<DeploymentEntityState> {
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

export function getMemoizedDeploymentEntityStateJzodSchemaSelectorTemplateMap(): QueryTemplateRunnerMapForJzodSchema<DeploymentEntityState> {
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
