import { createSelector } from "@reduxjs/toolkit";
import {
  DeploymentEntityState,
  JzodSchemaQuerySelectorMap,
  MiroirSelectorQueryParams,
  QuerySelectorMap,
  selectByDomainManyQueries,
  selectEntityInstanceFromObjectQueryAndDeploymentEntityState,
  selectEntityInstanceListFromListQuery,
  selectEntityInstanceUuidIndexFromDeploymentEntityState,
  selectEntityJzodSchemaFromDeploymentEntityState,
  selectFetchQueryJzodSchema,
  selectJzodSchemaByDomainModelQuery,
  selectJzodSchemaBySingleSelectQuery
} from "miroir-core";

const deploymentEntityStateSelector = (domainState: DeploymentEntityState, params: any) => domainState;
const deploymentEntityStateSelectorParams = (domainState: DeploymentEntityState, params: any) => params;
// const domainStateSelector = (domainState: DomainState, params: any) => domainState;
// const domainStateSelectorParams = (domainState: DomainState, params: any) => params;

export function getMemoizedDeploymentEntityStateSelectorMap(): QuerySelectorMap<DeploymentEntityState> {
  // return selectorMap;
  return {
    selectEntityInstanceUuidIndex: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectEntityInstanceUuidIndexFromDeploymentEntityState
    ),
    selectEntityInstanceFromObjectQuery: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectEntityInstanceFromObjectQueryAndDeploymentEntityState
    ),
    selectEntityInstanceListFromListQuery: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectEntityInstanceListFromListQuery
    ),
    selectByDomainManyQueries: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectByDomainManyQueries
    ),
  };
}

export function getMemoizedDeploymentEntityStateJzodSchemaSelectorMap(): JzodSchemaQuerySelectorMap<DeploymentEntityState> {
  // return jzodSchemaSelectorMap;
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
