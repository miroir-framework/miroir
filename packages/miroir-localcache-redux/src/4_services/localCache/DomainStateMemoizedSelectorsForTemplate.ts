import { createSelector } from "@reduxjs/toolkit";
import {
  ReduxDeploymentsState,
  QueryTemplateRunnerMapForJzodSchema,
  SyncBoxedExtractorOrQueryRunnerMap,
  extractEntityInstanceListWithObjectListExtractorInMemory,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
  extractEntityJzodSchemaFromReduxDeploymentsState,
  extractFetchQueryJzodSchema,
  extractJzodSchemaForDomainModelQuery,
  extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
  runQueryTemplateWithExtractorCombinerTransformer,
  runQuery,
  extractzodSchemaForSingleSelectQuery,
  selectEntityInstanceFromReduxDeploymentsState,
  selectEntityInstanceListFromReduxDeploymentsState,
  selectEntityInstanceUuidIndexFromReduxDeploymentsState
} from "miroir-core";

const deploymentEntityStateSelector = (domainState: ReduxDeploymentsState, params: any) => domainState;
const deploymentEntityStateSelectorParams = (domainState: ReduxDeploymentsState, params: any) => params;

export function getMemoizedReduxDeploymentsStateSelectorForTemplateMap(): SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> {
  return {
    extractorType: "sync",
    extractState: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      (deploymentEntityState, params) => deploymentEntityState
    ),
    extractEntityInstance: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectEntityInstanceFromReduxDeploymentsState
    ),
    extractEntityInstanceUuidIndex: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectEntityInstanceUuidIndexFromReduxDeploymentsState
    ),
    extractEntityInstanceList: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      selectEntityInstanceListFromReduxDeploymentsState
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
    extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList
    ),

    // 
    runQueryTemplateWithExtractorCombinerTransformer: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      runQueryTemplateWithExtractorCombinerTransformer
    ),
  };
}

export function getMemoizedReduxDeploymentsStateJzodSchemaSelectorTemplateMap(): QueryTemplateRunnerMapForJzodSchema<ReduxDeploymentsState> {
  return {
    extractJzodSchemaForDomainModelQuery: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      extractJzodSchemaForDomainModelQuery
    ),
    extractEntityJzodSchema: createSelector(
      [deploymentEntityStateSelector, deploymentEntityStateSelectorParams],
      extractEntityJzodSchemaFromReduxDeploymentsState
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
