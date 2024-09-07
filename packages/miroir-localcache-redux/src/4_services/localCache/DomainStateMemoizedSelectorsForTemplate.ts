import { createSelector } from "@reduxjs/toolkit";
import {
  DeploymentEntityState,
  SyncExtractorTemplateRunnerMap,
  extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory,
  extractWithExtractorTemplate,
  extractWithManyExtractorTemplates,
  selectEntityInstanceFromDeploymentEntityStateForTemplate,
  selectEntityInstanceUuidIndexFromDeploymentEntityStateForTemplate
} from "miroir-core";

const deploymentEntityStateSelector = (domainState: DeploymentEntityState, params: any) => domainState;
const deploymentEntityStateSelectorParams = (domainState: DeploymentEntityState, params: any) => params;

export function getMemoizedDeploymentEntityStateSelectorForTemplateMap(): SyncExtractorTemplateRunnerMap<DeploymentEntityState> {
  return {
    extractorType: "sync",
    extractEntityInstance: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectEntityInstanceFromDeploymentEntityStateForTemplate
    ),
    extractEntityInstanceUuidIndex: createSelector(
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

// export function getMemoizedDeploymentEntityStateJzodSchemaSelectorMap(): ExtractorRunnerMapForJzodSchema<DeploymentEntityState> {
//   return {
//     extractJzodSchemaForDomainModelQuery: createSelector(
//       [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
//       extractJzodSchemaForDomainModelQuery
//     ),
//     extractEntityJzodSchema: createSelector(
//       [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
//       extractEntityJzodSchemaFromDeploymentEntityState
//     ),
//     extractFetchQueryJzodSchema: createSelector(
//       [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
//       extractFetchQueryJzodSchema
//     ),
//     extractzodSchemaForSingleSelectQuery: createSelector(
//       [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
//       extractzodSchemaForSingleSelectQuery
//     ),
//   };
// }
