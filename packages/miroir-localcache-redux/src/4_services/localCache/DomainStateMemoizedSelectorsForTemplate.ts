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
  selectEntityInstanceUuidIndexFromReduxDeploymentsState,
  type MiroirModelEnvironment,
  type ApplicationDeploymentMap
} from "miroir-core";

const deploymentEntityStateSelector = (
  domainState: ReduxDeploymentsState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: any,
  modelEnvironment: MiroirModelEnvironment
) => domainState;
const applicationDeploymentMapSelector = (
  domainState: ReduxDeploymentsState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: any,
  modelEnvironment: MiroirModelEnvironment
) => applicationDeploymentMap;
const deploymentEntityStateSelectorParams = (
  domainState: ReduxDeploymentsState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: any,
  modelEnvironment: MiroirModelEnvironment
) => params;
const miroirModelEnvironmentSelectorParams = (
  deploymentEntityState: ReduxDeploymentsState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: any,
  modelEnvironment: MiroirModelEnvironment
) => modelEnvironment;

export function getMemoizedReduxDeploymentsStateSelectorForTemplateMap(): SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> {
  return {
    extractorType: "sync",
    extractState: createSelector(
      [
        deploymentEntityStateSelector,
        applicationDeploymentMapSelector,
        deploymentEntityStateSelectorParams,
        miroirModelEnvironmentSelectorParams,
      ],
      (deploymentEntityState) => deploymentEntityState
    ),
    extractEntityInstance: createSelector(
      [
        deploymentEntityStateSelector,
        applicationDeploymentMapSelector,
        deploymentEntityStateSelectorParams,
        miroirModelEnvironmentSelectorParams,
      ],
      selectEntityInstanceFromReduxDeploymentsState
    ),
    extractEntityInstanceUuidIndex: createSelector(
      [
        deploymentEntityStateSelector,
        applicationDeploymentMapSelector,
        deploymentEntityStateSelectorParams,
        miroirModelEnvironmentSelectorParams,
      ],
      selectEntityInstanceUuidIndexFromReduxDeploymentsState
    ),
    extractEntityInstanceList: createSelector(
      [
        deploymentEntityStateSelector,
        applicationDeploymentMapSelector,
        deploymentEntityStateSelectorParams,
        miroirModelEnvironmentSelectorParams,
      ],
      selectEntityInstanceListFromReduxDeploymentsState
    ),
    extractEntityInstanceUuidIndexWithObjectListExtractor: createSelector(
      [
        deploymentEntityStateSelector,
        applicationDeploymentMapSelector,
        deploymentEntityStateSelectorParams,
        miroirModelEnvironmentSelectorParams,
      ],
      extractEntityInstanceUuidIndexWithObjectListExtractorInMemory
    ),
    extractEntityInstanceListWithObjectListExtractor: createSelector(
      [
        deploymentEntityStateSelector,
        applicationDeploymentMapSelector,
        deploymentEntityStateSelectorParams,
        miroirModelEnvironmentSelectorParams,
      ],
      extractEntityInstanceListWithObjectListExtractorInMemory
    ),
    runQuery: createSelector(
      [
        deploymentEntityStateSelector,
        applicationDeploymentMapSelector,
        deploymentEntityStateSelectorParams,
        miroirModelEnvironmentSelectorParams,
      ],
      runQuery
    ),
    extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: createSelector(
      [
        deploymentEntityStateSelector,
        applicationDeploymentMapSelector,
        deploymentEntityStateSelectorParams,
        miroirModelEnvironmentSelectorParams,
      ],
      extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList
    ),

    //
    runQueryTemplateWithExtractorCombinerTransformer: createSelector(
      [
        deploymentEntityStateSelector,
        applicationDeploymentMapSelector,
        deploymentEntityStateSelectorParams,
        miroirModelEnvironmentSelectorParams,
      ],
      runQueryTemplateWithExtractorCombinerTransformer
    ),
  };
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
const deploymentEntityStateSelectorForMLS = (
  domainState: ReduxDeploymentsState,
  params: any,
  modelEnvironment: MiroirModelEnvironment
) => domainState;
const deploymentEntityStateSelectorParamsForMLS = (
  domainState: ReduxDeploymentsState,
  params: any,
  modelEnvironment: MiroirModelEnvironment
) => params;
const miroirModelEnvironmentSelectorParamsForMLS = (
  deploymentEntityState: ReduxDeploymentsState,
  params: any,
  modelEnvironment: MiroirModelEnvironment
) => modelEnvironment;

export function getMemoizedReduxDeploymentsStateJzodSchemaSelectorTemplateMap(): QueryTemplateRunnerMapForJzodSchema<ReduxDeploymentsState> {
  return {
    extractJzodSchemaForDomainModelQuery: createSelector(
      [deploymentEntityStateSelectorForMLS, deploymentEntityStateSelectorParamsForMLS, miroirModelEnvironmentSelectorParamsForMLS],
      extractJzodSchemaForDomainModelQuery
    ),
    extractEntityJzodSchema: createSelector(
      [deploymentEntityStateSelectorForMLS, deploymentEntityStateSelectorParamsForMLS, miroirModelEnvironmentSelectorParamsForMLS],
      extractEntityJzodSchemaFromReduxDeploymentsState
    ),
    extractFetchQueryJzodSchema: createSelector(
      [deploymentEntityStateSelectorForMLS, deploymentEntityStateSelectorParamsForMLS, miroirModelEnvironmentSelectorParamsForMLS],
      extractFetchQueryJzodSchema
    ),
    extractzodSchemaForSingleSelectQuery: createSelector(
      [deploymentEntityStateSelectorForMLS, deploymentEntityStateSelectorParamsForMLS, miroirModelEnvironmentSelectorParamsForMLS],
      extractzodSchemaForSingleSelectQuery
    ),
  };
}
