import { createSelector } from "@reduxjs/toolkit";
import {
  DomainStateQuerySelectorMap,
  MiroirSelectorQueryParams,
  selectEntityInstanceUuidIndexFromDomainState,
  selectEntityInstanceFromObjectQueryAndDomainState,
  selectEntityInstanceListFromListQueryAndDomainState,
  selectByDomainManyQueriesFromDomainState,
  DomainStateJzodSchemaSelectorMap,
  selectJzodSchemaByDomainModelQueryFromDomainStateNew,
  selectEntityJzodSchemaFromDomainStateNew,
  selectFetchQueryJzodSchemaFromDomainStateNew,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNew,
  DomainState,
  DeploymentEntityState,
  DeploymentEntityStateQuerySelectorMap,
  selectEntityInstanceFromObjectQueryAndDeploymentEntityState,
  selectEntityInstanceListFromListQueryAndDeploymentEntityState,
  selectByDomainManyQueriesFromDeploymentEntityState,
  selectJzodSchemaByDomainModelQueryFromDeploymentEntityState,
  selectEntityJzodSchemaFromDeploymentEntityState,
  selectFetchQueryJzodSchemaFromDeploymentEntityState,
  selectJzodSchemaBySingleSelectQueryFromDeploymentEntityState,
  DeploymentEntityStateJzodSchemaSelectorMap,
} from "miroir-core";
import { selectEntityInstanceUuidIndexFromDeploymentEntityState } from "./LocalCacheSliceSelectors";

const deploymentEntityStateSelector = (domainState: DeploymentEntityState, params: any) => domainState;
const deploymentEntityStateSelectorParams = (domainState: DeploymentEntityState, params: any) => params;
const domainStateSelector = (domainState: DomainState, params: any) => domainState;
const domainStateSelectorParams = (domainState: DomainState, params: any) => params;

export function getMemoizedSelectorMap(): DomainStateQuerySelectorMap<MiroirSelectorQueryParams> {
  // return selectorMap;
  return {
    selectEntityInstanceUuidIndexFromDomainState: createSelector(
      [domainStateSelector, domainStateSelectorParams],
      selectEntityInstanceUuidIndexFromDomainState
    ),
    selectEntityInstanceFromObjectQueryAndDomainState: createSelector(
      [domainStateSelector, domainStateSelectorParams],
      selectEntityInstanceFromObjectQueryAndDomainState
    ),
    selectEntityInstanceListFromListQueryAndDomainState: createSelector(
      [domainStateSelector, domainStateSelectorParams],
      selectEntityInstanceListFromListQueryAndDomainState
    ),
    selectByDomainManyQueriesFromDomainState: createSelector(
      [domainStateSelector, domainStateSelectorParams],
      selectByDomainManyQueriesFromDomainState
    ),
  };
}

export function getMemoizedDeploymentEntityStateSelectorMap(): DeploymentEntityStateQuerySelectorMap<MiroirSelectorQueryParams> {
  // return selectorMap;
  return {
    selectEntityInstanceUuidIndexFromDeploymentEntityState: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectEntityInstanceUuidIndexFromDeploymentEntityState
    ),
    selectEntityInstanceFromObjectQueryAndDeploymentEntityState: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectEntityInstanceFromObjectQueryAndDeploymentEntityState
    ),
    selectEntityInstanceListFromListQueryAndDeploymentEntityState: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectEntityInstanceListFromListQueryAndDeploymentEntityState
    ),
    selectByDomainManyQueriesFromDeploymentEntityState: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectByDomainManyQueriesFromDeploymentEntityState
    ),
  };
}

export function getMemoizedDeploymentEntityStateJzodSchemaSelectorMap(): DeploymentEntityStateJzodSchemaSelectorMap {
  // return jzodSchemaSelectorMap;
  return {
    selectJzodSchemaByDomainModelQueryFromDeploymentEntityState: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectJzodSchemaByDomainModelQueryFromDeploymentEntityState
    ),
    selectEntityJzodSchemaFromDeploymentEntityState: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectEntityJzodSchemaFromDeploymentEntityState
    ),
    selectFetchQueryJzodSchemaFromDeploymentEntityState: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectFetchQueryJzodSchemaFromDeploymentEntityState
    ),
    selectJzodSchemaBySingleSelectQueryFromDeploymentEntityState: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectJzodSchemaBySingleSelectQueryFromDeploymentEntityState
    ),
  };
}
export function getMemoizedJzodSchemaSelectorMap(): DomainStateJzodSchemaSelectorMap {
  // return jzodSchemaSelectorMap;
  return {
    selectJzodSchemaByDomainModelQueryFromDomainStateNew: createSelector(
      [domainStateSelector, domainStateSelectorParams],
      selectJzodSchemaByDomainModelQueryFromDomainStateNew
    ),
    selectEntityJzodSchemaFromDomainStateNew: createSelector(
      [domainStateSelector, domainStateSelectorParams],
      selectEntityJzodSchemaFromDomainStateNew
    ),
    selectFetchQueryJzodSchemaFromDomainStateNew: createSelector(
      [domainStateSelector, domainStateSelectorParams],
      selectFetchQueryJzodSchemaFromDomainStateNew
    ),
    selectJzodSchemaBySingleSelectQueryFromDomainStateNew: createSelector(
      [domainStateSelector, domainStateSelectorParams],
      selectJzodSchemaBySingleSelectQueryFromDomainStateNew
    ),
  };
}
