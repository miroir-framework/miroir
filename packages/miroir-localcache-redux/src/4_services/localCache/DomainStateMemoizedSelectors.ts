import { createSelector } from "@reduxjs/toolkit";
import {
  DeploymentEntityState,
  JzodSchemaQuerySelectorMap,
  ExtractorSelectorMap,
  selectByDomainManyExtractors,
  selectEntityInstanceFromDeploymentEntityState,
  selectEntityInstanceUuidIndexFromObjectListExtractor,
  selectEntityInstanceUuidIndexFromDeploymentEntityState,
  selectEntityJzodSchemaFromDeploymentEntityState,
  selectFetchQueryJzodSchema,
  selectJzodSchemaByDomainModelQuery,
  selectJzodSchemaBySingleSelectQuery
} from "miroir-core";

const deploymentEntityStateSelector = (domainState: DeploymentEntityState, params: any) => domainState;
const deploymentEntityStateSelectorParams = (domainState: DeploymentEntityState, params: any) => params;

export function getMemoizedDeploymentEntityStateSelectorMap(): ExtractorSelectorMap<DeploymentEntityState> {
  return {
    selectEntityInstanceFromState: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectEntityInstanceFromDeploymentEntityState
    ),
    selectEntityInstanceUuidIndexFromState: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectEntityInstanceUuidIndexFromDeploymentEntityState
    ),
    selectEntityInstanceUuidIndexFromObjectListExtractor: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectEntityInstanceUuidIndexFromObjectListExtractor
    ),
    selectByDomainManyExtractors: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectByDomainManyExtractors
    ),
  };
}

export function getMemoizedDeploymentEntityStateJzodSchemaSelectorMap(): JzodSchemaQuerySelectorMap<DeploymentEntityState> {
  return {
    selectJzodSchemaByDomainModelQuery: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectJzodSchemaByDomainModelQuery
    ),
    selectEntityJzodSchema: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectEntityJzodSchemaFromDeploymentEntityState
    ),
    selectFetchQueryJzodSchema: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectFetchQueryJzodSchema
    ),
    selectJzodSchemaBySingleSelectQuery: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectJzodSchemaBySingleSelectQuery
    ),
  };
}
