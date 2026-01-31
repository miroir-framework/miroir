//#########################################################################################
// SELECTORS - Zustand version
// Uses reselect createSelector for memoization (same as Redux Toolkit)
//#########################################################################################
import { createSelector } from "@reduxjs/toolkit";
import {
  ReduxDeploymentsState,
  DomainElementSuccess,
  DomainModelQueryTemplateJzodSchemaParams,
  Domain2QueryReturnType,
  DomainState,
  EntityInstance,
  EntityInstancesUuidIndex,
  ExtractorRunnerParamsForJzodSchema,
  ExtractorTemplateRunnerParamsForJzodSchema,
  getReduxDeploymentsStateIndex,
  JzodElement,
  JzodSchemaQuerySelector,
  JzodSchemaQueryTemplateSelector,
  LoggerInterface,
  MiroirLoggerFactory,
  MiroirQueryTemplate,
  QueryJzodSchemaParams,
  RecordOfJzodElement,
  SyncQueryRunner,
  SyncQueryRunnerExtractorAndParams,
  SyncQueryTemplateRunner,
  SyncQueryTemplateRunnerParams,
  type ApplicationDeploymentMap,
  type MiroirModelEnvironment,
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
// Helper selectors for createSelector pattern (matching Redux implementation)
// These must be defined before they are used
// ################################################################################################
const selectApplicationDeploymentMapSelector = (
  state: ZustandStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: any,
  modelEnvironment: MiroirModelEnvironment
) => applicationDeploymentMap;

const selectMiroirModelEnvironmentSelectorParams = (
  state: ZustandStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: any,
  modelEnvironment: MiroirModelEnvironment
) => modelEnvironment;

const selectMiroirModelEnvironmentSelectorParamsForMLS = (
  state: ZustandStateWithUndoRedo,
  queryTemplate: any,
  modelEnvironment: MiroirModelEnvironment
) => modelEnvironment;

const selectDomainStateJzodSchemaSelectorParamsGeneric = <QueryType extends DomainModelQueryTemplateJzodSchemaParams>(
  state: ZustandStateWithUndoRedo,
  queryTemplate: ExtractorTemplateRunnerParamsForJzodSchema<QueryType, DomainState>
) => {
  return queryTemplate;
};

const selectJzodSchemaSelectorParams = <QueryType extends QueryJzodSchemaParams, StateType>(
  state: ZustandStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: ExtractorRunnerParamsForJzodSchema<QueryType, StateType>,
  modelEnvironment: MiroirModelEnvironment
) => {
  return params;
};

const selectApplicationDeploymentMap = (
  state: ZustandStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: MiroirQueryTemplate
): ApplicationDeploymentMap => {
  return applicationDeploymentMap;
};

// ################################################################################################
// selectEntityInstanceUuidIndexFromLocalCacheQueryAndReduxDeploymentsState must be defined before usage
// ################################################################################################
export const selectEntityInstanceUuidIndexFromLocalCacheQueryAndReduxDeploymentsState = (
  deploymentEntityState: ReduxDeploymentsState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: MiroirQueryTemplate,
): EntityInstancesUuidIndex => {
  const empty: EntityInstancesUuidIndex = {};
  if (queryTemplate.queryType != "localCacheEntityInstancesExtractor") {
    log.error(
      "selectEntityInstanceUuidIndexFromLocalCacheQueryAndReduxDeploymentsState queryType is not localCacheEntityInstancesExtractor",
      queryTemplate.queryType,
      "queryTemplate",
      queryTemplate
    );
    return empty;
  }
  const deploymentUuid =
    applicationDeploymentMap[queryTemplate.definition.application];
  if (!queryTemplate.definition.entityUuid) {
    throw new Error(
      "selectEntityInstanceUuidIndexFromLocalCacheQueryAndReduxDeploymentsState no entityUuid in params " + JSON.stringify(queryTemplate)
    );
  }
  const localEntityIndex = getReduxDeploymentsStateIndex(
    deploymentUuid,
    queryTemplate.definition.applicationSection??"data",
    queryTemplate.definition.entityUuid
  );
  const result =
    deploymentUuid &&
    queryTemplate.definition.applicationSection &&
    queryTemplate.definition.entityUuid &&
    deploymentEntityState[localEntityIndex]
      ? (deploymentEntityState[localEntityIndex].entities)
      : empty;
  return result;
};

// ################################################################################################
// Entity Instance Selectors
// ################################################################################################

// ################################################################################################
export const selectEntityInstanceUuidIndexFromLocalCache = createSelector(
  [
    selectCurrentReduxDeploymentsStateFromReduxState,
    selectApplicationDeploymentMap,
    selectMiroirSelectorQueryParams,
  ],
  selectEntityInstanceUuidIndexFromLocalCacheQueryAndReduxDeploymentsState
);

// ################################################################################################
export const selectInstanceArrayForDeploymentSectionEntity: (
  state: ZustandStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: MiroirQueryTemplate
) => EntityInstance[] = createSelector(
  [
    selectEntityInstanceUuidIndexFromLocalCache,
    selectApplicationDeploymentMap,
    selectMiroirQueryTemplateSelectorParams,
  ],
  (
    state: EntityInstancesUuidIndex,
    applicationDeploymentMap: ApplicationDeploymentMap,
    params: MiroirQueryTemplate
  ) => {
    return state ? Object.values(state) : [];
  }
);

// ################################################################################################
// DOMAIN STATE SELECTORS - Higher-order functions matching Redux implementation
// ################################################################################################
export function applyReduxDeploymentsStateQueryTemplateSelector<
  ResultType
>( // TODO: memoize?
  deploymentEntityStateQuerySelector: SyncQueryTemplateRunner<ReduxDeploymentsState, ResultType>
): (
  state: ZustandStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: SyncQueryTemplateRunnerParams<ReduxDeploymentsState>,
  modelEnvironment: MiroirModelEnvironment
) => ResultType {
  return createSelector(
    [
      selectCurrentReduxDeploymentsStateFromReduxState,
      selectApplicationDeploymentMapSelector,
      selectReduxDeploymentsStateSelectorForQueryTemplateParams,
      selectMiroirModelEnvironmentSelectorParams,
    ],
    deploymentEntityStateQuerySelector
  );
}

// ################################################################################################
export function applyReduxDeploymentsStateQuerySelector<
  ResultType
>( // TODO: memoize?
  deploymentEntityStateQuerySelector: SyncQueryRunner<ReduxDeploymentsState, ResultType>
): (
  state: ZustandStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState>,
  modelEnvironment: MiroirModelEnvironment
) => ResultType {
  return createSelector(
    [
      selectCurrentReduxDeploymentsStateFromReduxState,
      selectApplicationDeploymentMapSelector,
      selectReduxDeploymentsStateSelectorParams,
      selectMiroirModelEnvironmentSelectorParams,
    ],
    deploymentEntityStateQuerySelector
  );
}

// ################################################################################################
export function applyReduxDeploymentsStateQueryTemplateSelectorForCleanedResult( // TODO: memoize?
  deploymentEntityStateQuerySelector: SyncQueryTemplateRunner<ReduxDeploymentsState, Domain2QueryReturnType<any>>
): (
  state: ZustandStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: SyncQueryTemplateRunnerParams<ReduxDeploymentsState>,
  modelEnvironment: MiroirModelEnvironment
) => any { 
  const cleanupFunction = (
    deploymentEntityState: ReduxDeploymentsState,
    applicationDeploymentMap: ApplicationDeploymentMap,
    params: SyncQueryTemplateRunnerParams<ReduxDeploymentsState>,
    modelEnvironment: MiroirModelEnvironment
  ): Domain2QueryReturnType<DomainElementSuccess> => {
    const partial: Domain2QueryReturnType<any> = deploymentEntityStateQuerySelector(
      deploymentEntityState,
      applicationDeploymentMap,
      params,
      modelEnvironment
    );
    const result: any = partial;
    return result;
  };

  return createSelector(
    [
      selectCurrentReduxDeploymentsStateFromReduxState,
      selectApplicationDeploymentMap,
      selectReduxDeploymentsStateSelectorForQueryTemplateParams,
      selectMiroirModelEnvironmentSelectorParams,
    ],
    cleanupFunction
  );
}

// ################################################################################################
export function applyReduxDeploymentsStateQuerySelectorForCleanedResult( // TODO: memoize?
  deploymentEntityStateQuerySelector: SyncQueryRunner<ReduxDeploymentsState, Domain2QueryReturnType<DomainElementSuccess>>
): (
  state: ZustandStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState>,
  modelEnvironment: MiroirModelEnvironment
) => any { 
  const cleanupFunction = (
    deploymentEntityState: ReduxDeploymentsState,
    applicationDeploymentMap: ApplicationDeploymentMap,
    params: SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState>,
    modelEnvironment: MiroirModelEnvironment
  ): Domain2QueryReturnType<DomainElementSuccess> => {
    const partial: Domain2QueryReturnType<DomainElementSuccess> =
      deploymentEntityStateQuerySelector(
        deploymentEntityState,
        applicationDeploymentMap,
        params,
        modelEnvironment
      );
    const result: any = partial;
    return result;
  };

  return createSelector(
    [
      selectCurrentReduxDeploymentsStateFromReduxState,
      selectApplicationDeploymentMap,
      selectReduxDeploymentsStateSelectorParams,
      selectMiroirModelEnvironmentSelectorParams,
    ],
    cleanupFunction
  );
}

// ################################################################################################
export function applyDomainStateQueryTemplateSelector<ResultType>( // TODO: memoize?
  domainStateSelector: SyncQueryTemplateRunner<DomainState, ResultType>
): (
  state: ZustandStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: SyncQueryTemplateRunnerParams<DomainState>,
  modelEnvironment: MiroirModelEnvironment
) => ResultType { 
  return createSelector(
    [
      selectDomainStateFromReduxState, 
      selectApplicationDeploymentMapSelector,
      selectDomainStateSelectorParams,
      selectMiroirModelEnvironmentSelectorParams,
    ],
    domainStateSelector
  )
}

// ################################################################################################
export function applyDomainStateJzodSchemaSelector<QueryType extends DomainModelQueryTemplateJzodSchemaParams>( // TODO: memoize?
  domainStateSelector: JzodSchemaQueryTemplateSelector<QueryType, DomainState>
): (
  state: ZustandStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: ExtractorTemplateRunnerParamsForJzodSchema<QueryType, DomainState>,
  modelEnvironment: MiroirModelEnvironment
) => RecordOfJzodElement | JzodElement | undefined { 
  return createSelector(
    [
      selectDomainStateFromReduxState, 
      selectApplicationDeploymentMapSelector,
      selectDomainStateJzodSchemaSelectorParamsGeneric<QueryType>,
      selectMiroirModelEnvironmentSelectorParamsForMLS
    ],
    domainStateSelector
  )
}

// ################################################################################################
export function applyReduxDeploymentsStateJzodSchemaSelectorTemplate<QueryTemplateType extends DomainModelQueryTemplateJzodSchemaParams>( // TODO: memoize?
  domainStateSelector: JzodSchemaQueryTemplateSelector<QueryTemplateType, ReduxDeploymentsState>
): (
  state: ZustandStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: ExtractorTemplateRunnerParamsForJzodSchema<QueryTemplateType, ReduxDeploymentsState>,
  modelEnvironment: MiroirModelEnvironment
) => RecordOfJzodElement | JzodElement | undefined { 
  return createSelector(
    [
      selectCurrentReduxDeploymentsStateFromReduxState,
      selectApplicationDeploymentMapSelector,
      selectJzodSchemaSelectorParamsForTemplate<QueryTemplateType>,
      selectMiroirModelEnvironmentSelectorParamsForMLS,
    ],
    domainStateSelector
  );
}

// ################################################################################################
export function applyReduxDeploymentsStateJzodSchemaSelector<QueryType extends QueryJzodSchemaParams>( // TODO: memoize?
  domainStateSelector: JzodSchemaQuerySelector<QueryType, ReduxDeploymentsState>
): (
  state: ZustandStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: ExtractorRunnerParamsForJzodSchema<QueryType, ReduxDeploymentsState>,
  modelEnvironment: MiroirModelEnvironment
) => RecordOfJzodElement | JzodElement | undefined { 
  return createSelector(
    [
      selectCurrentReduxDeploymentsStateFromReduxState,
      selectApplicationDeploymentMapSelector,
      selectJzodSchemaSelectorParams<QueryType, ReduxDeploymentsState>,
      selectMiroirModelEnvironmentSelectorParamsForMLS,
    ],
    domainStateSelector
  );
}

// ################################################################################################
export function applyDomainStateQuerySelectorForCleanedResult( // TODO: memoize?
  domainStateSelector: SyncQueryTemplateRunner<DomainState, Domain2QueryReturnType<DomainElementSuccess>>
): (
  state: ZustandStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: SyncQueryTemplateRunnerParams<DomainState>,
  modelEnvironment: MiroirModelEnvironment
) => any { 
  const cleanupFunction = (
    domainState: DomainState, 
    applicationDeploymentMap: ApplicationDeploymentMap,
    params: SyncQueryTemplateRunnerParams<DomainState>,
    modelEnvironment: MiroirModelEnvironment
  ):Domain2QueryReturnType<DomainElementSuccess> => {
    const partial: Domain2QueryReturnType<DomainElementSuccess> = domainStateSelector(
      domainState,
      applicationDeploymentMap,
      params,
      modelEnvironment
    );
    const result:any = partial
    return result;
  }

  return createSelector(
    [
      selectDomainStateFromReduxState, 
      selectApplicationDeploymentMap,
      selectDomainStateSelectorParams,
      selectMiroirModelEnvironmentSelectorParams,
    ],
    cleanupFunction
  )
}
