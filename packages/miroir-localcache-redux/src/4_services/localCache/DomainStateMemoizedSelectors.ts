import { createSelector } from "@reduxjs/toolkit";
import {
  DeploymentEntityState,
  DeploymentEntityStateJzodSchemaSelectorMap,
  DomainState,
  DomainStateJzodSchemaSelectorMap,
  DomainStateQuerySelectorMap,
  MiroirSelectorQueryParams,
  QuerySelectorMap,
  selectByDomainManyQueriesFromDeploymentEntityState,
  selectByDomainManyQueriesFromDomainState,
  selectEntityInstanceFromObjectQueryAndDeploymentEntityState,
  selectEntityInstanceFromObjectQueryAndDomainState,
  selectEntityInstanceListFromListQueryAndDeploymentEntityState,
  selectEntityInstanceListFromListQueryAndDomainState,
  selectEntityInstanceUuidIndexFromDeploymentEntityState,
  selectEntityInstanceUuidIndexFromDomainState,
  selectEntityJzodSchemaFromDeploymentEntityState,
  selectEntityJzodSchemaFromDomainStateNew,
  selectFetchQueryJzodSchemaFromDeploymentEntityState,
  selectFetchQueryJzodSchemaFromDomainStateNew,
  selectJzodSchemaByDomainModelQueryFromDeploymentEntityState,
  selectJzodSchemaByDomainModelQueryFromDomainStateNew,
  selectJzodSchemaBySingleSelectQueryFromDeploymentEntityState,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNew
} from "miroir-core";

const deploymentEntityStateSelector = (domainState: DeploymentEntityState, params: any) => domainState;
const deploymentEntityStateSelectorParams = (domainState: DeploymentEntityState, params: any) => params;
const domainStateSelector = (domainState: DomainState, params: any) => domainState;
const domainStateSelectorParams = (domainState: DomainState, params: any) => params;

export function getMemoizedSelectorMap(): DomainStateQuerySelectorMap<MiroirSelectorQueryParams> {
  // return selectorMap;
  return {
    selectEntityInstanceUuidIndex: createSelector(
      [domainStateSelector, domainStateSelectorParams],
      selectEntityInstanceUuidIndexFromDomainState
    ),
    selectEntityInstanceFromObject: createSelector(
      [domainStateSelector, domainStateSelectorParams],
      selectEntityInstanceFromObjectQueryAndDomainState
    ),
    selectEntityInstanceListFromListQuery: createSelector(
      [domainStateSelector, domainStateSelectorParams],
      selectEntityInstanceListFromListQueryAndDomainState
    ),
    selectByDomainManyQueries: createSelector(
      [domainStateSelector, domainStateSelectorParams],
      selectByDomainManyQueriesFromDomainState
    ),
  };
}

export function getMemoizedDeploymentEntityStateSelectorMap(): QuerySelectorMap<MiroirSelectorQueryParams,DeploymentEntityState> {
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
      selectEntityInstanceListFromListQueryAndDeploymentEntityState
    ),
    selectByDomainManyQueries: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectByDomainManyQueriesFromDeploymentEntityState
    ),
  };
}

export function getMemoizedDeploymentEntityStateJzodSchemaSelectorMap(): DeploymentEntityStateJzodSchemaSelectorMap {
  // return jzodSchemaSelectorMap;
  return {
    selectJzodSchemaByDomainModelQuery: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectJzodSchemaByDomainModelQueryFromDeploymentEntityState
    ),
    selectEntityJzodSchema: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectEntityJzodSchemaFromDeploymentEntityState
    ),
    selectFetchQueryJzodSchema: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectFetchQueryJzodSchemaFromDeploymentEntityState
    ),
    selectJzodSchemaBySingleSelectQuery: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectJzodSchemaBySingleSelectQueryFromDeploymentEntityState
    ),
  };
}
export function getMemoizedJzodSchemaSelectorMap(): DomainStateJzodSchemaSelectorMap {
  // return jzodSchemaSelectorMap;
  return {
    selectJzodSchemaByDomainModelQuery: createSelector(
      [domainStateSelector, domainStateSelectorParams],
      selectJzodSchemaByDomainModelQueryFromDomainStateNew
    ),
    selectEntityJzodSchema: createSelector(
      [domainStateSelector, domainStateSelectorParams],
      selectEntityJzodSchemaFromDomainStateNew
    ),
    selectFetchQueryJzodSchema: createSelector(
      [domainStateSelector, domainStateSelectorParams],
      selectFetchQueryJzodSchemaFromDomainStateNew
    ),
    selectJzodSchemaBySingleSelectQuery: createSelector(
      [domainStateSelector, domainStateSelectorParams],
      selectJzodSchemaBySingleSelectQueryFromDomainStateNew
    ),
  };
}
