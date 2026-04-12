import { createSelector } from "@reduxjs/toolkit";
import {
  ReduxDeploymentsState,
  SyncBoxedExtractorOrQueryRunnerMap,
  extractEntityInstanceListWithObjectListExtractorInMemory,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
  extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
  runQueryTemplateWithExtractorCombinerTransformer,
  runQuery,
  selectEntityInstanceFromReduxDeploymentsState,
  selectEntityInstanceListFromReduxDeploymentsState,
  selectEntityInstanceUuidIndexFromReduxDeploymentsState,
  type MiroirModelEnvironment,
  type ApplicationDeploymentMap,
  asyncApplyExtractorTransformerInMemory,
  applyExtractorTransformerInMemory
} from "miroir-core";

// TODO: isn't this duplicating ReduxDeploymentsStateQueryTemplateSelectors.ts ?
const deploymentEntityStateSelector = (
  deploymentEntityState: ReduxDeploymentsState,
  appliationDeploymentMap: ApplicationDeploymentMap,
  params: any,
  modelEnvironment: MiroirModelEnvironment
) => deploymentEntityState;
const applicationDeploymentMapSelector = (
  deploymentEntityState: ReduxDeploymentsState,
  appliationDeploymentMap: ApplicationDeploymentMap,
  params: any,
  modelEnvironment: MiroirModelEnvironment
) => appliationDeploymentMap;
const deploymentEntityStateSelectorParams = (
  deploymentEntityState: ReduxDeploymentsState,
  appliationDeploymentMap: ApplicationDeploymentMap,
  params: any,
  modelEnvironment: MiroirModelEnvironment
) => params;
const miroirModelEnvironmentSelectorParams = (
  deploymentEntityState: ReduxDeploymentsState,
  appliationDeploymentMap: ApplicationDeploymentMap,
  params: any,
  modelEnvironment: MiroirModelEnvironment
) => modelEnvironment;

export function getMemoizedReduxDeploymentsStateSelectorMap(): SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> {
  return {
    extractorOrCombinerType: "sync",
    extractState: createSelector(
      [
        deploymentEntityStateSelector,
        applicationDeploymentMapSelector,
        deploymentEntityStateSelectorParams,
        miroirModelEnvironmentSelectorParams,
      ],
      (deploymentEntityState, appliationDeploymentMap, params) => deploymentEntityState
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
    // ############################################################################################
    runQueryTemplateWithExtractorCombinerTransformer: createSelector(
      [
        deploymentEntityStateSelector,
        applicationDeploymentMapSelector,
        deploymentEntityStateSelectorParams,
        miroirModelEnvironmentSelectorParams,
      ],
      runQueryTemplateWithExtractorCombinerTransformer
    ),
    applyExtractorTransformer: applyExtractorTransformerInMemory
    // applyExtractorTransformer: createSelector(
    //   [
    //     deploymentEntityStateSelector,
    //     applicationDeploymentMapSelector,
    //     deploymentEntityStateSelectorParams,
    //     miroirModelEnvironmentSelectorParams,
    //   ],
    //   () => applyExtractorTransformerInMemory
    // ),
  };
}