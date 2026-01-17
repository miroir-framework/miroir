//#########################################################################################
// SELECTORS
//#########################################################################################
// TODO: precise type for return value of selectInstancesForEntity. This is a Selector, which reselect considers a Dictionnary...
// TODO: should it memoize? Doen't this imply caching the whole value, which can be really large? Or is it just the selector?

import { createSelector } from "@reduxjs/toolkit";
import {
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  BoxedQueryWithExtractorCombinerTransformer,
  ReduxDeploymentsState,
  DomainElementSuccess,
  domainElementToPlainObjectDEFUNCT,
  DomainModelQueryTemplateJzodSchemaParams,
  Domain2QueryReturnType,
  DomainState,
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
  SyncBoxedExtractorRunnerParams,
  SyncQueryRunner,
  SyncQueryRunnerExtractorAndParams,
  SyncQueryTemplateRunner,
  SyncQueryTemplateRunnerParams,
  type MiroirModelEnvironment,
  type ApplicationDeploymentMap,
  type EntityInstance
} from "miroir-core";
import { packageName } from "../../constants.js";
import { cleanLevel } from "../constants.js";
import { selectDomainStateFromlocalCacheEntityZone } from "./LocalCacheSlice.js";
import { ReduxStateWithUndoRedo } from "./localCacheReduxSliceInterface.js";
import { useSelector } from "react-redux";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "LocalCacheSliceSelector")
).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
declare type JzodSchemaSelectorParamsSelector<QueryType extends DomainModelQueryTemplateJzodSchemaParams, StateType> = (
  reduxState: ReduxStateWithUndoRedo,
  params: ExtractorTemplateRunnerParamsForJzodSchema<QueryType, StateType>
) => ExtractorTemplateRunnerParamsForJzodSchema<QueryType, StateType>;


// ################################################################################################
// declare type SelectorParamsTemplateSelector<QueryType extends MiroirQueryTemplate, StateType> = (
// declare type SelectorParamsTemplateSelector<QueryType extends BoxedQueryTemplateWithExtractorCombinerTransformer, StateType> = (
declare type SelectorParamsTemplateSelector<StateType> = (
  reduxState: ReduxStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: SyncQueryTemplateRunnerParams<StateType>
) => SyncQueryTemplateRunnerParams<StateType>;

// ################################################################################################
declare type SelectorParamsForQuery<StateType> = (
  reduxState: ReduxStateWithUndoRedo,
  params: SyncQueryRunnerExtractorAndParams<StateType>
) => SyncQueryRunnerExtractorAndParams<StateType>;

// ################################################################################################
declare type SelectorParamsForExtractor<QueryType extends BoxedExtractorOrCombinerReturningObjectOrObjectList, StateType> = (
  reduxState: ReduxStateWithUndoRedo,
  params: SyncBoxedExtractorRunnerParams<QueryType, StateType>
) => SyncBoxedExtractorRunnerParams<QueryType, StateType>;

// ################################################################################################
const selectApplicationDeploymentMapSelector = (
  reduxState: ReduxStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: any,
  modelEnvironment: MiroirModelEnvironment
) => applicationDeploymentMap;


// ################################################################################################
const selectMiroirModelEnvironmentSelectorParams = (
  reduxState: ReduxStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: any,
  modelEnvironment: MiroirModelEnvironment
) => modelEnvironment;

// ################################################################################################
const selectMiroirModelEnvironmentSelectorParamsForMLS = (
  reduxState: ReduxStateWithUndoRedo,
  queryTemplate: any,
  modelEnvironment: MiroirModelEnvironment
) => modelEnvironment;


// ################################################################################################
export const selectCurrentReduxDeploymentsStateFromReduxState = (
  reduxState: ReduxStateWithUndoRedo
): ReduxDeploymentsState => {
  return reduxState.presentModelSnapshot.current;
};

// export const useReduxState = (): ReduxDeploymentsState => {
//   return useSelector<ReduxStateWithUndoRedo, ReduxDeploymentsState>(
//     selectCurrentReduxDeploymentsStateFromReduxState
//   );
// };

// ################################################################################################
export const selectReduxDeploymentsStateSelectorForQueryTemplateParams =
  (
    reduxState: ReduxStateWithUndoRedo,
    applicationDeploymentMap: ApplicationDeploymentMap,
    queryTemplate: SyncQueryTemplateRunnerParams<ReduxDeploymentsState>
  ): SyncQueryTemplateRunnerParams<ReduxDeploymentsState> => {
    return queryTemplate;
  };

// ################################################################################################
export const selectReduxDeploymentsStateSelectorParams /*: DomainStateSelectorParamsSelector<Q> */ = (
  reduxState: ReduxStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState>
): SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState> => {
  return queryTemplate;
};

// ################################################################################################
export const selectReduxDeploymentsStateSelectorParamsForMLS /*: DomainStateSelectorParamsSelector<Q> */ = (
  reduxState: ReduxStateWithUndoRedo,
  queryTemplate: SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState>
): SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState> => {
  return queryTemplate;
};

// ################################################################################################
export const selectApplicationDeploymentMap = (
  reduxState: ReduxStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: MiroirQueryTemplate
): ApplicationDeploymentMap => {
  return applicationDeploymentMap;
};

// ################################################################################################
export const selectMiroirSelectorQueryParams = (
  reduxState: ReduxStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: MiroirQueryTemplate
): MiroirQueryTemplate => {
  return queryTemplate;
};

//#########################################################################################
export const selectDomainStateFromReduxState: (
  state: ReduxStateWithUndoRedo,
) => DomainState = createSelector(
  [selectCurrentReduxDeploymentsStateFromReduxState],
  (state: ReduxDeploymentsState) => {
    // log.info("selectInstanceArrayForDeploymentSectionEntity called", params, state);

    return state ? selectDomainStateFromlocalCacheEntityZone(state) : {};
  }
);


// ################################################################################################
// TODO: UPDATE!
// export const selectQuerySelectorParams /*: SelectorParamsSelector*/ = <Q extends MiroirQueryTemplate>(
export const selectMiroirQueryTemplateSelectorParams /*: SelectorParamsSelector*/ = <Q extends MiroirQueryTemplate>(
  reduxState: ReduxStateWithUndoRedo,
  appliationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: Q
) => {
  return queryTemplate;
};


// ################################################################################################
export const selectDomainStateSelectorParams = (
  reduxState: ReduxStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: SyncQueryTemplateRunnerParams<DomainState>
): SyncQueryTemplateRunnerParams<DomainState> => {
  return queryTemplate;
};

// ################################################################################################
export const selectDomainStateApplicationDeploymentMap = (
  reduxState: ReduxStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: SyncQueryTemplateRunnerParams<DomainState>
): ApplicationDeploymentMap => {
  return applicationDeploymentMap;
};

// ################################################################################################
export const selectDomainStateJzodSchemaSelectorParams = <QueryType extends DomainModelQueryTemplateJzodSchemaParams>(
  reduxState: ReduxStateWithUndoRedo,
  queryTemplate: ExtractorTemplateRunnerParamsForJzodSchema<QueryType, DomainState>
) => {
  return queryTemplate;
};

// ################################################################################################
export const selectJzodSchemaSelectorParamsForTemplate = <QueryTemplateType extends DomainModelQueryTemplateJzodSchemaParams, StateType>(
  reduxState: ReduxStateWithUndoRedo,
  params: ExtractorTemplateRunnerParamsForJzodSchema<QueryTemplateType, StateType>
) => {
  return params;
};

// ################################################################################################
export const selectJzodSchemaSelectorParams = <QueryType extends QueryJzodSchemaParams, StateType>(
  reduxState: ReduxStateWithUndoRedo,
  params: ExtractorRunnerParamsForJzodSchema<QueryType, StateType>
) => {
  return params;
};


// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// DOMAIN STATE SELECTORS
// ################################################################################################
// ################################################################################################
export function applyReduxDeploymentsStateQueryTemplateSelector<
  ResultType
>( // TODO: memoize?
  deploymentEntityStateQuerySelector: SyncQueryTemplateRunner<ReduxDeploymentsState, ResultType>
): (
  reduxState: ReduxStateWithUndoRedo,
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
  // ExtractorType extends BoxedQueryWithExtractorCombinerTransformer,
  ResultType
>( // TODO: memoize?
  deploymentEntityStateQuerySelector: SyncQueryRunner<ReduxDeploymentsState, ResultType>
): (
  reduxState: ReduxStateWithUndoRedo,
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
// export function applyReduxDeploymentsStateQueryTemplateSelectorForCleanedResult<QueryType extends BoxedQueryTemplateWithExtractorCombinerTransformer>( // TODO: memoize?
export function applyReduxDeploymentsStateQueryTemplateSelectorForCleanedResult( // TODO: memoize?
  deploymentEntityStateQuerySelector: SyncQueryTemplateRunner<ReduxDeploymentsState, Domain2QueryReturnType<any>>
): (
  reduxState: ReduxStateWithUndoRedo,
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
      selectReduxDeploymentsStateSelectorForQueryTemplateParams as SelectorParamsTemplateSelector<
        ReduxDeploymentsState
      >,
      selectMiroirModelEnvironmentSelectorParams,
    ],
    cleanupFunction
  );
}

// ################################################################################################
export function applyReduxDeploymentsStateQuerySelectorForCleanedResult( // TODO: memoize?
  deploymentEntityStateQuerySelector: SyncQueryRunner<ReduxDeploymentsState, Domain2QueryReturnType<DomainElementSuccess>>
): (
  reduxState: ReduxStateWithUndoRedo,
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
      // selectReduxDeploymentsStateSelectorParams as SelectorParamsForQuery<ReduxDeploymentsState>,
      selectMiroirModelEnvironmentSelectorParams,
    ],
    cleanupFunction
  );
}


// ################################################################################################
// export function applyDomainStateQueryTemplateSelector<QueryType extends MiroirQueryTemplate, ResultType>( // TODO: memoize?
export function applyDomainStateQueryTemplateSelector<ResultType>( // TODO: memoize?
  domainStateSelector: SyncQueryTemplateRunner<DomainState, ResultType>
): (
  reduxState: ReduxStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: SyncQueryTemplateRunnerParams<DomainState>,
  modelEnvironment: MiroirModelEnvironment
) => ResultType { 
  return createSelector(
    // [selectDomainStateFromReduxState, selectDomainStateSelectorParams],
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
  reduxState: ReduxStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: ExtractorTemplateRunnerParamsForJzodSchema<QueryType, DomainState>,
  modelEnvironment: MiroirModelEnvironment
) => RecordOfJzodElement | JzodElement | undefined { 
  return createSelector(
    [
      selectDomainStateFromReduxState, 
      selectApplicationDeploymentMapSelector,
      selectDomainStateJzodSchemaSelectorParams<QueryType>,
      selectMiroirModelEnvironmentSelectorParamsForMLS
    ],
    domainStateSelector
  )
}


// ################################################################################################
// TODO: create "generic", StateType-independent version, receiving the state-access function as parameter (here selectCurrentReduxDeploymentsStateFromReduxState)
export function applyReduxDeploymentsStateJzodSchemaSelectorTemplate<QueryTemplateType extends DomainModelQueryTemplateJzodSchemaParams>( // TODO: memoize?
  domainStateSelector: JzodSchemaQueryTemplateSelector<QueryTemplateType, ReduxDeploymentsState>
): (
  reduxState: ReduxStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: ExtractorTemplateRunnerParamsForJzodSchema<QueryTemplateType, ReduxDeploymentsState>,
  modelEnvironment: MiroirModelEnvironment
) => RecordOfJzodElement | JzodElement | undefined { 
  return createSelector(
    [
      selectCurrentReduxDeploymentsStateFromReduxState,
      selectApplicationDeploymentMapSelector,
      selectJzodSchemaSelectorParamsForTemplate<QueryTemplateType, ReduxDeploymentsState>,
      selectMiroirModelEnvironmentSelectorParamsForMLS,
    ],
    domainStateSelector
  );
}

// ################################################################################################
// TODO: create "generic", StateType-independent version, receiving the state-access function as parameter (here selectCurrentReduxDeploymentsStateFromReduxState)
export function applyReduxDeploymentsStateJzodSchemaSelector<QueryType extends QueryJzodSchemaParams>( // TODO: memoize?
  domainStateSelector: JzodSchemaQuerySelector<QueryType, ReduxDeploymentsState>
): (
  reduxState: ReduxStateWithUndoRedo,
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
// export function applyDomainStateQuerySelectorForCleanedResult<QueryType extends MiroirQueryTemplate>( // TODO: memoize?
export function applyDomainStateQuerySelectorForCleanedResult( // TODO: memoize?
  domainStateSelector: SyncQueryTemplateRunner<DomainState, Domain2QueryReturnType<DomainElementSuccess>>
): (
  reduxState: ReduxStateWithUndoRedo,
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




//#########################################################################################
//#########################################################################################
//#########################################################################################
//#########################################################################################
//#########################################################################################
//#########################################################################################
//#########################################################################################
//#########################################################################################
//#########################################################################################
// DOMAIN SELECTORS

// ################################################################################################
/**
 * selector applier with only state parameter returning createSelector of instances,
 * memoized per Entity. Share it among all components?
 * so that a list of Books is refreshed only when at least 1 book is modified.
 * IS THERE A NEED FOR SUCH A FINE-GRAINED REFRESH???
 * DISTINGUISH META-MODEL and MODEL, AT LEAST? (APPLICATIONS / DEPLOYMENTS and SelfApplication Section).
 * -> that would seldom change, and could justify a page reload...
 * assign to a map in the contextService?
 * could it be feasible to have per-Entity dependency in the contextService, which depends on
 * all entities, and provides the needed object depending on the params / id of the report?
 * (given as parameter to the ContextService) 
 * 
 */

const empty = {}

// ################################################################################################
export const selectEntityInstanceUuidIndexFromLocalCacheQueryAndReduxDeploymentsState = (
  deploymentEntityState: ReduxDeploymentsState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: MiroirQueryTemplate,
  // applicationDeploymentMap: ApplicationDeploymentMap
): EntityInstancesUuidIndex => {
  if (queryTemplate.queryType != "localCacheEntityInstancesExtractor") {
    log.error(
      "selectEntityInstanceUuidIndexFromLocalCacheQueryAndReduxDeploymentsState queryType is not localCacheEntityInstancesExtractor",
      queryTemplate.queryType,
      "queryTemplate",
      queryTemplate
    );
    return empty;
  }
  // const applicationDeploymentMap = params.definition.applicationDeploymentMap;
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
  // log.info(
  //   "selectEntityInstanceUuidIndexFromLocalCacheQueryAndReduxDeploymentsState",
  //   "params",
  //   params,
  //   "localEntityIndex",
  //   localEntityIndex,
  //   "deploymentEntityState",
  //   deploymentEntityState,
  //   "result",
  //   result
  // );
  return result;
  // } else {
  //   // return undefined;
  //   return empty;
  // }
};
// ################################################################################################
export const selectEntityInstanceUuidIndexFromLocalCache = createSelector(
  [
    selectCurrentReduxDeploymentsStateFromReduxState,
    selectApplicationDeploymentMap,
    selectMiroirSelectorQueryParams,
  ],
  selectEntityInstanceUuidIndexFromLocalCacheQueryAndReduxDeploymentsState
);


//#########################################################################################
// TODO: is used only with LocalCacheExtractor!
export const selectInstanceArrayForDeploymentSectionEntity: (
  reduxState: ReduxStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: MiroirQueryTemplate
) => EntityInstance[] = createSelector(
  [
    selectEntityInstanceUuidIndexFromLocalCache,
    selectApplicationDeploymentMap,
    selectMiroirQueryTemplateSelectorParams,
  ],
  // (state: EntityInstancesUuidIndex, params: MiroirQueryTemplate) => {
  (
    state: EntityInstancesUuidIndex,
    applicationDeploymentMap: ApplicationDeploymentMap,
    params: MiroirQueryTemplate
  ) => {
    // log.info("selectInstanceArrayForDeploymentSectionEntity called", params, state);

    return state ? Object.values(state) : [];
  }
);


