import { createSelector } from "@reduxjs/toolkit";
import {
  DeploymentEntityState,
  JzodSchemaQuerySelectorMap,
  QuerySelectorMap,
  selectByDomainManyQueries,
  selectEntityInstanceFromObjectQueryAndDeploymentEntityState,
  selectEntityInstanceUuidIndexFromListQuery,
  selectEntityInstanceUuidIndexFromDeploymentEntityState,
  selectEntityJzodSchemaFromDeploymentEntityState,
  selectFetchQueryJzodSchema,
  selectJzodSchemaByDomainModelQuery,
  selectJzodSchemaBySingleSelectQuery
} from "miroir-core";

const deploymentEntityStateSelector = (domainState: DeploymentEntityState, params: any) => domainState;
const deploymentEntityStateSelectorParams = (domainState: DeploymentEntityState, params: any) => params;

export function getMemoizedDeploymentEntityStateSelectorMap(): QuerySelectorMap<DeploymentEntityState> {
  return {
    selectEntityInstanceUuidIndex: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectEntityInstanceUuidIndexFromDeploymentEntityState
    ),
    selectEntityInstanceFromObjectQuery: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectEntityInstanceFromObjectQueryAndDeploymentEntityState
    ),
    selectEntityInstanceUuidIndexFromListQuery: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectEntityInstanceUuidIndexFromListQuery
    ),
    selectByDomainManyQueries: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectByDomainManyQueries
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
