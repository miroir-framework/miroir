import { createSelector } from "@reduxjs/toolkit";
import {
  DeploymentEntityState,
  ExtractorTemplateRunnerMapForJzodSchema,
  SyncExtractorTemplateRunnerMap,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
  extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory,
  extractEntityJzodSchemaFromDeploymentEntityState,
  extractFetchQueryJzodSchema,
  extractJzodSchemaForDomainModelQuery,
  extractWithExtractor,
  extractWithExtractorTemplate,
  extractWithManyExtractorTemplates,
  extractWithManyExtractors,
  extractzodSchemaForSingleSelectQuery,
  selectEntityInstanceFromDeploymentEntityState,
  selectEntityInstanceFromDeploymentEntityStateForTemplate,
  selectEntityInstanceUuidIndexFromDeploymentEntityState,
  selectEntityInstanceUuidIndexFromDeploymentEntityStateForTemplate
} from "miroir-core";

const deploymentEntityStateSelector = (domainState: DeploymentEntityState, params: any) => domainState;
const deploymentEntityStateSelectorParams = (domainState: DeploymentEntityState, params: any) => params;

export function getMemoizedDeploymentEntityStateSelectorForTemplateMap(): SyncExtractorTemplateRunnerMap<DeploymentEntityState> {
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
    extractEntityInstanceUuidIndexWithObjectListExtractorInMemory: createSelector(
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
    extractEntityInstanceForTemplate: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectEntityInstanceFromDeploymentEntityStateForTemplate
    ),
    extractEntityInstanceUuidIndexForTemplate: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectEntityInstanceUuidIndexFromDeploymentEntityStateForTemplate
    ),
    extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory
    ),
    extractWithManyExtractorTemplates: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      extractWithManyExtractorTemplates
    ),
    extractWithExtractorTemplate: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      extractWithExtractorTemplate
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
