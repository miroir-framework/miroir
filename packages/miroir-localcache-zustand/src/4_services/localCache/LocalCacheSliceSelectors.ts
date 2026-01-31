//#########################################################################################
// SELECTORS - Zustand version
// Uses reselect createSelector for memoization (same as Redux Toolkit)
//#########################################################################################
import { createSelector } from "@reduxjs/toolkit";
import {
  ApplicationSection,
  ReduxDeploymentsState,
  DomainModelQueryTemplateJzodSchemaParams,
  Domain2QueryReturnType,
  DomainState,
  EntityInstance,
  EntityInstancesUuidIndex,
  ExtractorRunnerParamsForJzodSchema,
  ExtractorTemplateRunnerParamsForJzodSchema,
  getReduxDeploymentsStateIndex,
  JzodElement,
  LoggerInterface,
  MiroirLoggerFactory,
  MiroirQueryTemplate,
  QueryJzodSchemaParams,
  RecordOfJzodElement,
  SyncQueryRunnerExtractorAndParams,
  SyncQueryTemplateRunnerParams,
  type ApplicationDeploymentMap,
} from "miroir-core";
import { localCacheStateToDomainState } from "./LocalCacheSlice.js";
import { ZustandStateWithUndoRedo, LocalCacheSliceState } from "./localCacheZustandInterface.js";

const packageName = "miroir-localcache-zustand";
const cleanLevel = "4_services";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "LocalCacheSliceSelectors")
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
// Type aliases for compatibility with Redux selectors
// ################################################################################################

// Alias for compatibility - Zustand uses the same state shape
export type ReduxStateWithUndoRedo = ZustandStateWithUndoRedo;

// ################################################################################################
// Base Selectors
// ################################################################################################

export const selectCurrentReduxDeploymentsStateFromReduxState = (
  state: ZustandStateWithUndoRedo
): ReduxDeploymentsState => {
  return state.presentModelSnapshot.current;
};

// ################################################################################################
// Select full presentModelSnapshot for localCacheStateToDomainState
const selectPresentModelSnapshot = (
  state: ZustandStateWithUndoRedo
): LocalCacheSliceState => {
  return state.presentModelSnapshot;
};

// ################################################################################################
export const selectReduxDeploymentsStateSelectorForQueryTemplateParams = (
  state: ZustandStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: SyncQueryTemplateRunnerParams<ReduxDeploymentsState>
): SyncQueryTemplateRunnerParams<ReduxDeploymentsState> => {
  return queryTemplate;
};

// ################################################################################################
export const selectReduxDeploymentsStateSelectorParams = (
  state: ZustandStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState>
): SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState> => {
  return queryTemplate;
};

// ################################################################################################
export const selectMiroirSelectorQueryParams = (
  state: ZustandStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: MiroirQueryTemplate
): MiroirQueryTemplate => {
  return queryTemplate;
};

// ################################################################################################
export const selectDomainStateFromReduxState: (
  state: ZustandStateWithUndoRedo,
) => DomainState = createSelector(
  [selectPresentModelSnapshot],
  (presentModelSnapshot: LocalCacheSliceState) => {
    return presentModelSnapshot ? localCacheStateToDomainState(presentModelSnapshot) : {};
  }
);

// ################################################################################################
export const selectMiroirQueryTemplateSelectorParams = <Q extends MiroirQueryTemplate>(
  state: ZustandStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: Q
) => {
  return queryTemplate;
};

// ################################################################################################
export const selectDomainStateSelectorParams = (
  state: ZustandStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: SyncQueryTemplateRunnerParams<DomainState>
): SyncQueryTemplateRunnerParams<DomainState> => {
  return queryTemplate;
};

// ################################################################################################
export const selectJzodSchemaSelectorParamsForTemplate = <Q extends DomainModelQueryTemplateJzodSchemaParams>(
  state: ZustandStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: ExtractorTemplateRunnerParamsForJzodSchema<Q, ReduxDeploymentsState>
): ExtractorTemplateRunnerParamsForJzodSchema<Q, ReduxDeploymentsState> => {
  return params;
};

// ################################################################################################
export const selectDomainStateJzodSchemaSelectorParams = (
  state: ZustandStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: ExtractorRunnerParamsForJzodSchema<QueryJzodSchemaParams, DomainState>
): ExtractorRunnerParamsForJzodSchema<QueryJzodSchemaParams, DomainState> => {
  return params;
};

// ################################################################################################
// Entity Instance Selectors
// ################################################################################################

export const selectInstanceArrayForDeploymentSectionEntity: (
  state: ZustandStateWithUndoRedo,
  deploymentUuid: string,
  section: ApplicationSection,
  entityUuid: string
) => EntityInstance[] = createSelector(
  [
    selectCurrentReduxDeploymentsStateFromReduxState,
    (_: ZustandStateWithUndoRedo, deploymentUuid: string) => deploymentUuid,
    (_: ZustandStateWithUndoRedo, _d: string, section: ApplicationSection) => section,
    (_: ZustandStateWithUndoRedo, _d: string, _s: ApplicationSection, entityUuid: string) => entityUuid,
  ],
  (deploymentsState: ReduxDeploymentsState, deploymentUuid: string, section: ApplicationSection, entityUuid: string) => {
    const index = getReduxDeploymentsStateIndex(deploymentUuid, section, entityUuid);
    const entityState = deploymentsState[index];
    return entityState ? Object.values(entityState.entities) : [];
  }
);

// ################################################################################################
export const selectEntityInstanceUuidIndexFromLocalCache: (
  state: ZustandStateWithUndoRedo,
  deploymentUuid: string,
  section: ApplicationSection,
  entityUuid: string
) => EntityInstancesUuidIndex | undefined = createSelector(
  [
    selectCurrentReduxDeploymentsStateFromReduxState,
    (_: ZustandStateWithUndoRedo, deploymentUuid: string) => deploymentUuid,
    (_: ZustandStateWithUndoRedo, _d: string, section: ApplicationSection) => section,
    (_: ZustandStateWithUndoRedo, _d: string, _s: ApplicationSection, entityUuid: string) => entityUuid,
  ],
  (deploymentsState: ReduxDeploymentsState, deploymentUuid: string, section: ApplicationSection, entityUuid: string) => {
    const index = getReduxDeploymentsStateIndex(deploymentUuid, section, entityUuid);
    const entityState = deploymentsState[index];
    return entityState?.entities;
  }
);

// ################################################################################################
export const selectEntityInstanceUuidIndexFromLocalCacheQueryAndReduxDeploymentsState = (
  state: ZustandStateWithUndoRedo,
  query: SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState>
): EntityInstancesUuidIndex | undefined => {
  const deploymentUuid = (query as any).deploymentUuid;
  const section = (query as any).section as ApplicationSection;
  const entityUuid = (query as any).entityUuid;
  return selectEntityInstanceUuidIndexFromLocalCache(state, deploymentUuid, section, entityUuid);
};

// ################################################################################################
// Query and Template Selectors (stub implementations)
// ################################################################################################

export const applyReduxDeploymentsStateQuerySelector = (
  state: ReduxDeploymentsState,
  params: SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState>
): Domain2QueryReturnType<any> => {
  throw new Error("applyReduxDeploymentsStateQuerySelector: Not implemented - use domain query runners");
};

// ################################################################################################
export const applyReduxDeploymentsStateQueryTemplateSelector = (
  state: ReduxDeploymentsState,
  params: SyncQueryTemplateRunnerParams<ReduxDeploymentsState>
): Domain2QueryReturnType<any> => {
  throw new Error("applyReduxDeploymentsStateQueryTemplateSelector: Not implemented - use domain query runners");
};

// ################################################################################################
export const applyReduxDeploymentsStateQueryTemplateSelectorForCleanedResult = (
  state: ReduxDeploymentsState,
  params: SyncQueryTemplateRunnerParams<ReduxDeploymentsState>
): any => {
  throw new Error("applyReduxDeploymentsStateQueryTemplateSelectorForCleanedResult: Not implemented");
};

// ################################################################################################
export const applyReduxDeploymentsStateQuerySelectorForCleanedResult = (
  state: ReduxDeploymentsState,
  params: SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState>
): any => {
  throw new Error("applyReduxDeploymentsStateQuerySelectorForCleanedResult: Not implemented");
};

// ################################################################################################
export const applyDomainStateQueryTemplateSelector = (
  state: DomainState,
  params: SyncQueryTemplateRunnerParams<DomainState>
): Domain2QueryReturnType<any> => {
  throw new Error("applyDomainStateQueryTemplateSelector: Not implemented - use domain query runners");
};

// ################################################################################################
export const applyDomainStateQuerySelectorForCleanedResult = (
  state: DomainState,
  params: SyncQueryTemplateRunnerParams<DomainState>
): any => {
  throw new Error("applyDomainStateQuerySelectorForCleanedResult: Not implemented");
};

// ################################################################################################
// Jzod Schema Selectors (stub implementations)
// ################################################################################################

export const applyDomainStateJzodSchemaSelector = (
  state: DomainState,
  params: ExtractorRunnerParamsForJzodSchema<QueryJzodSchemaParams, DomainState>
): RecordOfJzodElement | JzodElement | undefined => {
  throw new Error("applyDomainStateJzodSchemaSelector: Not implemented - use domain schema selectors");
};

// ################################################################################################
export const applyReduxDeploymentsStateJzodSchemaSelectorTemplate = (
  state: ReduxDeploymentsState,
  params: ExtractorTemplateRunnerParamsForJzodSchema<DomainModelQueryTemplateJzodSchemaParams, ReduxDeploymentsState>
): RecordOfJzodElement | JzodElement | undefined => {
  throw new Error("applyReduxDeploymentsStateJzodSchemaSelectorTemplate: Not implemented");
};

// ################################################################################################
export const applyReduxDeploymentsStateJzodSchemaSelector = (
  state: ReduxDeploymentsState,
  params: ExtractorRunnerParamsForJzodSchema<QueryJzodSchemaParams, ReduxDeploymentsState>
): RecordOfJzodElement | JzodElement | undefined => {
  throw new Error("applyReduxDeploymentsStateJzodSchemaSelector: Not implemented");
};
