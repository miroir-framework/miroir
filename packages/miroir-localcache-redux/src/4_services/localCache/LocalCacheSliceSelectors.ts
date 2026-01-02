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
  SyncQueryRunnerParams,
  SyncQueryTemplateRunner,
  SyncQueryTemplateRunnerParams,
  type MiroirModelEnvironment,
  type ApplicationDeploymentMap
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
declare type SelectorParamsTemplateSelector<QueryType extends BoxedQueryTemplateWithExtractorCombinerTransformer, StateType> = (
  reduxState: ReduxStateWithUndoRedo,
  params: SyncQueryTemplateRunnerParams<StateType>
) => SyncQueryTemplateRunnerParams<StateType>;

// ################################################################################################
declare type SelectorParamsForQuery<QueryType extends BoxedQueryWithExtractorCombinerTransformer, StateType> = (
  reduxState: ReduxStateWithUndoRedo,
  params: SyncQueryRunnerParams<StateType>
) => SyncQueryRunnerParams<StateType>;

// ################################################################################################
declare type SelectorParamsForExtractor<QueryType extends BoxedExtractorOrCombinerReturningObjectOrObjectList, StateType> = (
  reduxState: ReduxStateWithUndoRedo,
  params: SyncBoxedExtractorRunnerParams<QueryType, StateType>
) => SyncBoxedExtractorRunnerParams<QueryType, StateType>;

// ################################################################################################
const selectMiroirModelEnvironmentSelectorParams = (
  reduxState: ReduxStateWithUndoRedo,
  params: any,
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
export const selectReduxDeploymentsStateSelectorForQueryTemplateParams /*: DomainStateSelectorParamsSelector<Q> */ = <QueryType extends BoxedQueryTemplateWithExtractorCombinerTransformer>(
  reduxState: ReduxStateWithUndoRedo,
  params: SyncQueryTemplateRunnerParams<ReduxDeploymentsState>
): SyncQueryTemplateRunnerParams<ReduxDeploymentsState> => {
  return params;
};

// ################################################################################################
// export const selectReduxDeploymentsStateSelectorParams /*: DomainStateSelectorParamsSelector<Q> */ = <QueryType extends MiroirQuery>(
export const selectReduxDeploymentsStateSelectorParams /*: DomainStateSelectorParamsSelector<Q> */ = <QueryType extends BoxedQueryWithExtractorCombinerTransformer>(
  reduxState: ReduxStateWithUndoRedo,
  params: SyncQueryRunnerParams<ReduxDeploymentsState>
): SyncQueryRunnerParams<ReduxDeploymentsState> => {
  return params;
};

// ################################################################################################
export const selectMiroirSelectorQueryParams = (
  reduxState: ReduxStateWithUndoRedo,
  params: MiroirQueryTemplate
): MiroirQueryTemplate => {
  return params;
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
  params: Q
) => {
  return params;
};


// ################################################################################################
export const selectDomainStateSelectorParams /*:SelectorParamsSelector<Q, DomainState> */ = <
  QueryType extends BoxedQueryTemplateWithExtractorCombinerTransformer
>(
  reduxState: ReduxStateWithUndoRedo,
  params: SyncQueryTemplateRunnerParams<DomainState>
): SyncQueryTemplateRunnerParams<DomainState> => {
  return params;
};

// ################################################################################################
export const selectDomainStateJzodSchemaSelectorParams = <QueryType extends DomainModelQueryTemplateJzodSchemaParams>(
  reduxState: ReduxStateWithUndoRedo,
  params: ExtractorTemplateRunnerParamsForJzodSchema<QueryType, DomainState>
) => {
  return params;
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
// export function applyReduxDeploymentsStateQueryTemplateSelector<ExtractorType extends MiroirQueryTemplate, ResultType>( // TODO: memoize?
export function applyReduxDeploymentsStateQueryTemplateSelector<
  QueryType extends BoxedQueryTemplateWithExtractorCombinerTransformer,
  ResultType
>( // TODO: memoize?
  deploymentEntityStateQuerySelector: SyncQueryTemplateRunner<ReduxDeploymentsState, ResultType>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: SyncQueryTemplateRunnerParams<ReduxDeploymentsState>,
  modelEnvironment: MiroirModelEnvironment
) => ResultType {
  return createSelector(
    [
      selectCurrentReduxDeploymentsStateFromReduxState,
      selectReduxDeploymentsStateSelectorForQueryTemplateParams as SelectorParamsTemplateSelector<
        QueryType,
        ReduxDeploymentsState
      >,
      selectMiroirModelEnvironmentSelectorParams,
    ],
    deploymentEntityStateQuerySelector
  );
}

// ################################################################################################
export function applyReduxDeploymentsStateQuerySelector<
  ExtractorType extends BoxedQueryWithExtractorCombinerTransformer,
  ResultType
>( // TODO: memoize?
  deploymentEntityStateQuerySelector: SyncQueryRunner<ReduxDeploymentsState, ResultType>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: SyncQueryRunnerParams<ReduxDeploymentsState>,
  modelEnvironment: MiroirModelEnvironment
) => ResultType {
  return createSelector(
    [
      selectCurrentReduxDeploymentsStateFromReduxState,
      selectReduxDeploymentsStateSelectorParams as SelectorParamsForQuery<ExtractorType, ReduxDeploymentsState>,
      selectMiroirModelEnvironmentSelectorParams,
    ],
    deploymentEntityStateQuerySelector
  );
}

// ################################################################################################
// export function applyReduxDeploymentsStateQueryTemplateSelectorForCleanedResult<QueryType extends MiroirQueryTemplate>( // TODO: memoize?
export function applyReduxDeploymentsStateQueryTemplateSelectorForCleanedResult<QueryType extends BoxedQueryTemplateWithExtractorCombinerTransformer>( // TODO: memoize?
  // deploymentEntityStateQuerySelector: SyncQueryTemplateRunner<ReduxDeploymentsState, Domain2QueryReturnType<DomainElementSuccess>>
  deploymentEntityStateQuerySelector: SyncQueryTemplateRunner<ReduxDeploymentsState, Domain2QueryReturnType<any>>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: SyncQueryTemplateRunnerParams<ReduxDeploymentsState>,
  modelEnvironment: MiroirModelEnvironment
) => any { 
  const cleanupFunction = (
    deploymentEntityState: ReduxDeploymentsState,
    params: SyncQueryTemplateRunnerParams<ReduxDeploymentsState>,
    modelEnvironment: MiroirModelEnvironment
  ): Domain2QueryReturnType<DomainElementSuccess> => {
    const partial: Domain2QueryReturnType<any> = deploymentEntityStateQuerySelector(deploymentEntityState, params, modelEnvironment);
    const result: any = partial;
    return result;
  };

  return createSelector(
    [
      selectCurrentReduxDeploymentsStateFromReduxState,
      selectReduxDeploymentsStateSelectorForQueryTemplateParams as SelectorParamsTemplateSelector<
        QueryType,
        ReduxDeploymentsState
      >,
      selectMiroirModelEnvironmentSelectorParams,
    ],
    cleanupFunction
  );
}

// ################################################################################################
export function applyReduxDeploymentsStateQuerySelectorForCleanedResult<QueryType extends BoxedQueryWithExtractorCombinerTransformer>( // TODO: memoize?
  deploymentEntityStateQuerySelector: SyncQueryRunner<ReduxDeploymentsState, Domain2QueryReturnType<DomainElementSuccess>>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: SyncQueryRunnerParams<ReduxDeploymentsState>,
  modelEnvironment: MiroirModelEnvironment
) => any { 
  const cleanupFunction = (
    deploymentEntityState: ReduxDeploymentsState,
    params: SyncQueryRunnerParams<ReduxDeploymentsState>,
    modelEnvironment: MiroirModelEnvironment
  ): Domain2QueryReturnType<DomainElementSuccess> => {
    const partial: Domain2QueryReturnType<DomainElementSuccess> = deploymentEntityStateQuerySelector(deploymentEntityState, params, modelEnvironment);
    const result: any = partial;
    return result;
  };

  return createSelector(
    [
      selectCurrentReduxDeploymentsStateFromReduxState,
      selectReduxDeploymentsStateSelectorParams as SelectorParamsForQuery<
        QueryType,
        ReduxDeploymentsState
      >,
      selectMiroirModelEnvironmentSelectorParams,
    ],
    cleanupFunction
  );
}


// ################################################################################################
// export function applyDomainStateQueryTemplateSelector<QueryType extends MiroirQueryTemplate, ResultType>( // TODO: memoize?
export function applyDomainStateQueryTemplateSelector<QueryType extends BoxedQueryTemplateWithExtractorCombinerTransformer, ResultType>( // TODO: memoize?
  domainStateSelector: SyncQueryTemplateRunner<DomainState, ResultType>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: SyncQueryTemplateRunnerParams<DomainState>,
  modelEnvironment: MiroirModelEnvironment
) => ResultType { 
  return createSelector(
    // [selectDomainStateFromReduxState, selectDomainStateSelectorParams],
    [
      selectDomainStateFromReduxState, 
      selectDomainStateSelectorParams as SelectorParamsTemplateSelector<QueryType, DomainState>,
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
  params: ExtractorTemplateRunnerParamsForJzodSchema<QueryType, DomainState>,
  modelEnvironment: MiroirModelEnvironment
) => RecordOfJzodElement | JzodElement | undefined { 
  return createSelector(
    [
      selectDomainStateFromReduxState, 
      selectDomainStateJzodSchemaSelectorParams as JzodSchemaSelectorParamsSelector<QueryType, DomainState>,
      selectMiroirModelEnvironmentSelectorParams,
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
  params: ExtractorTemplateRunnerParamsForJzodSchema<QueryTemplateType, ReduxDeploymentsState>,
  modelEnvironment: MiroirModelEnvironment
) => RecordOfJzodElement | JzodElement | undefined { 
  return createSelector(
    [
      selectCurrentReduxDeploymentsStateFromReduxState,
      selectJzodSchemaSelectorParamsForTemplate<QueryTemplateType, ReduxDeploymentsState>,
      selectMiroirModelEnvironmentSelectorParams,
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
  params: ExtractorRunnerParamsForJzodSchema<QueryType, ReduxDeploymentsState>,
  modelEnvironment: MiroirModelEnvironment
) => RecordOfJzodElement | JzodElement | undefined { 
  return createSelector(
    [
      selectCurrentReduxDeploymentsStateFromReduxState,
      selectJzodSchemaSelectorParams<QueryType, ReduxDeploymentsState>,
      selectMiroirModelEnvironmentSelectorParams,
    ],
    domainStateSelector
  );
}


// ################################################################################################
// export function applyDomainStateQuerySelectorForCleanedResult<QueryType extends MiroirQueryTemplate>( // TODO: memoize?
export function applyDomainStateQuerySelectorForCleanedResult<QueryType extends BoxedQueryTemplateWithExtractorCombinerTransformer>( // TODO: memoize?
  domainStateSelector: SyncQueryTemplateRunner<DomainState, Domain2QueryReturnType<DomainElementSuccess>>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: SyncQueryTemplateRunnerParams<DomainState>,
  modelEnvironment: MiroirModelEnvironment
) => any { 
  const cleanupFunction = (
    domainState: DomainState, 
    params: SyncQueryTemplateRunnerParams<DomainState>,
    modelEnvironment: MiroirModelEnvironment
  ):Domain2QueryReturnType<DomainElementSuccess> => {
    const partial:Domain2QueryReturnType<DomainElementSuccess> = domainStateSelector(domainState, params, modelEnvironment);
    const result:any = partial
    return result;
  }

  return createSelector(
    [
      selectDomainStateFromReduxState, 
      selectDomainStateSelectorParams as SelectorParamsTemplateSelector<QueryType, DomainState>,
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
  params: MiroirQueryTemplate,
  // applicationDeploymentMap: ApplicationDeploymentMap
): EntityInstancesUuidIndex => {
  if (params.queryType != "localCacheEntityInstancesExtractor") {
    log.error(
      "selectEntityInstanceUuidIndexFromLocalCacheQueryAndReduxDeploymentsState queryType is not localCacheEntityInstancesExtractor",
      params.queryType,
      "params",
      params
    );
    return empty;
  }
  const applicationDeploymentMap = params.definition.applicationDeploymentMap;
  const deploymentUuid = applicationDeploymentMap[params.definition.application];
  if (!params.definition.entityUuid) {
    throw new Error(
      "selectEntityInstanceUuidIndexFromLocalCacheQueryAndReduxDeploymentsState no entityUuid in params " + JSON.stringify(params)
    );
  }
  const localEntityIndex = getReduxDeploymentsStateIndex(
    deploymentUuid,
    params.definition.applicationSection??"data",
    params.definition.entityUuid
  );
  const result =
    params.definition.deploymentUuid &&
    params.definition.applicationSection &&
    params.definition.entityUuid &&
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
export const selectEntityInstanceUuidIndexFromLocalCache = createSelector (
  [selectCurrentReduxDeploymentsStateFromReduxState,selectMiroirSelectorQueryParams],
  selectEntityInstanceUuidIndexFromLocalCacheQueryAndReduxDeploymentsState
)


//#########################################################################################
// TODO: is used only with LocalCacheExtractor!
export const selectInstanceArrayForDeploymentSectionEntity = createSelector(
  [selectEntityInstanceUuidIndexFromLocalCache, selectMiroirQueryTemplateSelectorParams],
  // (state: EntityInstancesUuidIndex, params: MiroirQueryTemplate) => {
  (state: EntityInstancesUuidIndex, params: MiroirQueryTemplate) => {
    // log.info("selectInstanceArrayForDeploymentSectionEntity called", params, state);

    return state ? Object.values(state) : [];
  }
);


