import { createSelector } from "@reduxjs/toolkit";
import { DomainStateQuerySelectorMap, MiroirSelectorQueryParams, selectEntityInstanceUuidIndexFromDomainState, selectEntityInstanceFromObjectQueryAndDomainState, selectEntityInstanceListFromListQueryAndDomainState, selectByDomainManyQueriesFromDomainState, DomainStateJzodSchemaSelectorMap, selectJzodSchemaByDomainModelQueryFromDomainStateNew, selectEntityJzodSchemaFromDomainStateNew, selectFetchQueryJzodSchemaFromDomainStateNew, selectJzodSchemaBySingleSelectQueryFromDomainStateNew, DomainState } from "miroir-core";

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
