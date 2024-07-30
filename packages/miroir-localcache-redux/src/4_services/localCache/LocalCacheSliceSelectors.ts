
//#########################################################################################
// SELECTORS
//#########################################################################################
// TODO: precise type for return value of selectInstancesForEntity. This is a Selector, which reselect considers a Dictionnary...
// TODO: should it memoize? Doen't this imply caching the whole value, which can be really large? Or is it just the selector?

import { createSelector } from "@reduxjs/toolkit";
import {
  DeploymentEntityState,
  DomainElement,
  DomainModelQueryJzodSchemaParams,
  DomainState,
  EntityInstancesUuidIndex,
  JzodElement,
  JzodSchemaQuerySelector,
  ExtractorRunnerParamsForJzodSchema,
  LoggerInterface,
  MiroirLoggerFactory,
  DomainModelExtractor,
  ExtractorRunner,
  ExtractorRunnerParams,
  RecordOfJzodElement,
  cleanupResultsFromQuery,
  getDeploymentEntityStateIndex,
  getLoggerName
} from "miroir-core";
import { packageName } from "../../constants.js";
import { cleanLevel } from "../constants.js";
import { selectDomainStateFromlocalCacheEntityZone } from "./LocalCacheSlice.js";
import { ReduxStateWithUndoRedo } from "./localCacheReduxSliceInterface.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"LocalCacheSliceSelector");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

// ################################################################################################
declare type JzodSchemaSelectorParamsSelector<QueryType extends DomainModelQueryJzodSchemaParams, StateType> = (
  reduxState: ReduxStateWithUndoRedo,
  params: ExtractorRunnerParamsForJzodSchema<QueryType, StateType>
) => ExtractorRunnerParamsForJzodSchema<QueryType, StateType>;


// ################################################################################################
declare type SelectorParamsSelector<QueryType extends DomainModelExtractor, StateType> = (
  reduxState: ReduxStateWithUndoRedo,
  params: ExtractorRunnerParams<QueryType, StateType>
) => ExtractorRunnerParams<QueryType, StateType>;


// ################################################################################################
export const selectCurrentDeploymentEntityStateFromReduxState = (
  reduxState: ReduxStateWithUndoRedo
): DeploymentEntityState => {
  return reduxState.presentModelSnapshot.current;
};

// ################################################################################################
export const selectDeploymentEntityStateSelectorParams /*: DomainStateSelectorParamsSelector<Q> */ = <QueryType extends DomainModelExtractor>(
  reduxState: ReduxStateWithUndoRedo,
  params: ExtractorRunnerParams<QueryType, DeploymentEntityState>
): ExtractorRunnerParams<QueryType, DeploymentEntityState> => {
  return params;
};

// ################################################################################################
export const selectMiroirSelectorQueryParams = (
  reduxState: ReduxStateWithUndoRedo,
  params: DomainModelExtractor
): DomainModelExtractor => {
  return params;
};

//#########################################################################################
export const selectDomainStateFromReduxState: (
  state: ReduxStateWithUndoRedo,
) => DomainState = createSelector(
  [selectCurrentDeploymentEntityStateFromReduxState],
  (state: DeploymentEntityState) => {
    // log.info("selectInstanceArrayForDeploymentSectionEntity called", params, state);

    return state ? selectDomainStateFromlocalCacheEntityZone(state) : {};
  }
);


// ################################################################################################
export const selectSelectorParams /*: SelectorParamsSelector*/ = <Q extends DomainModelExtractor>(
  reduxState: ReduxStateWithUndoRedo,
  params: Q
) => {
  return params;
};


// ################################################################################################
export const selectDomainStateSelectorParams/*:SelectorParamsSelector<Q, DomainState> */ = <QueryType extends DomainModelExtractor>(
  reduxState: ReduxStateWithUndoRedo,
  params: ExtractorRunnerParams<QueryType, DomainState>
): ExtractorRunnerParams<QueryType, DomainState> => {
  return params;
};

// ################################################################################################
export const selectDomainStateJzodSchemaSelectorParams = <QueryType extends DomainModelQueryJzodSchemaParams>(
  reduxState: ReduxStateWithUndoRedo,
  params: ExtractorRunnerParamsForJzodSchema<QueryType, DomainState>
) => {
  return params;
};

// ################################################################################################
export const selectJzodSchemaSelectorParams = <QueryType extends DomainModelQueryJzodSchemaParams, StateType>(
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
export function applyDeploymentEntityStateQuerySelector<ExtractorType extends DomainModelExtractor, ResultType>( // TODO: memoize?
  deploymentEntityStateQuerySelector: ExtractorRunner<ExtractorType, DeploymentEntityState, ResultType>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: ExtractorRunnerParams<ExtractorType, DeploymentEntityState>
) => ResultType { 
  return createSelector(
    [selectCurrentDeploymentEntityStateFromReduxState, selectDeploymentEntityStateSelectorParams as SelectorParamsSelector<ExtractorType, DeploymentEntityState>],
    deploymentEntityStateQuerySelector
  )
}

// ################################################################################################
export function applyDeploymentEntityStateQuerySelectorForCleanedResult<QueryType extends DomainModelExtractor>( // TODO: memoize?
  deploymentEntityStateQuerySelector: ExtractorRunner<QueryType, DeploymentEntityState, DomainElement>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: ExtractorRunnerParams<QueryType, DeploymentEntityState>
) => any { 
  const cleanupFunction = (
    deploymentEntityState: DeploymentEntityState,
    params: ExtractorRunnerParams<QueryType, DeploymentEntityState>
  ): DomainElement => {
    const partial: DomainElement = deploymentEntityStateQuerySelector(deploymentEntityState, params);
    const result: any = cleanupResultsFromQuery(partial);
    return result;
  };

  return createSelector(
    [
      selectCurrentDeploymentEntityStateFromReduxState,
      selectDeploymentEntityStateSelectorParams as SelectorParamsSelector<
        QueryType,
        DeploymentEntityState
      >,
    ],
    cleanupFunction
  );
}


// ################################################################################################
export function applyDomainStateQuerySelector<QueryType extends DomainModelExtractor, ResultType>( // TODO: memoize?
  domainStateSelector: ExtractorRunner<QueryType, DomainState, ResultType>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: ExtractorRunnerParams<QueryType, DomainState>
) => ResultType { 
  return createSelector(
    // [selectDomainStateFromReduxState, selectDomainStateSelectorParams],
    [selectDomainStateFromReduxState, selectDomainStateSelectorParams as SelectorParamsSelector<QueryType, DomainState>],
    domainStateSelector
  )
}

// ################################################################################################
export function applyDomainStateJzodSchemaSelector<QueryType extends DomainModelQueryJzodSchemaParams>( // TODO: memoize?
  domainStateSelector: JzodSchemaQuerySelector<QueryType, DomainState>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: ExtractorRunnerParamsForJzodSchema<QueryType, DomainState>
) => RecordOfJzodElement | JzodElement | undefined { 
  return createSelector(
    [selectDomainStateFromReduxState, selectDomainStateJzodSchemaSelectorParams as JzodSchemaSelectorParamsSelector<QueryType, DomainState>],
    domainStateSelector
  )
}


// ################################################################################################
// TODO: create "generic", StateType-independent version, receiving the state-access function as parameter (here selectCurrentDeploymentEntityStateFromReduxState)
export function applyDeploymentEntityStateJzodSchemaSelector<QueryType extends DomainModelQueryJzodSchemaParams>( // TODO: memoize?
  domainStateSelector: JzodSchemaQuerySelector<QueryType, DeploymentEntityState>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: ExtractorRunnerParamsForJzodSchema<QueryType, DeploymentEntityState>
) => RecordOfJzodElement | JzodElement | undefined { 
  return createSelector(
    [
      selectCurrentDeploymentEntityStateFromReduxState,
      selectJzodSchemaSelectorParams<QueryType, DeploymentEntityState>,
    ],
    domainStateSelector
  );
}


// ################################################################################################
export function applyDomainStateQuerySelectorForCleanedResult<QueryType extends DomainModelExtractor>( // TODO: memoize?
  domainStateSelector: ExtractorRunner<QueryType, DomainState, DomainElement>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: ExtractorRunnerParams<QueryType, DomainState>
) => any { 
  const cleanupFunction = (domainState: DomainState, params: ExtractorRunnerParams<QueryType, DomainState>):DomainElement => {
    const partial:DomainElement = domainStateSelector(domainState, params);
    const result:any = cleanupResultsFromQuery(partial)
    return result;
  }

  return createSelector(
    [selectDomainStateFromReduxState, selectDomainStateSelectorParams as SelectorParamsSelector<QueryType, DomainState>],
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
 * DISTINGUISH META-MODEL and MODEL, AT LEAST? (APPLICATIONS / DEPLOYMENTS and Application Section).
 * -> that would seldom change, and could justify a page reload...
 * assign to a map in the contextService?
 * could it be feasible to have per-Entity dependency in the contextService, which depends on
 * all entities, and provides the needed object depending on the params / id of the report?
 * (given as parameter to the ContextService) 
 * 
 */

const empty = {}

// ################################################################################################
export const selectEntityInstanceUuidIndexFromLocalCacheQueryAndDeploymentEntityState = (
  deploymentEntityState: DeploymentEntityState,
  params: DomainModelExtractor
): EntityInstancesUuidIndex => {
  if (params.queryType != "localCacheEntityInstancesExtractor") {
    log.error(
      "selectEntityInstanceUuidIndexFromLocalCacheQueryAndDeploymentEntityState queryType is not localCacheEntityInstancesExtractor",
      params.queryType,
      "params",
      params
    );
    return empty;
  }
  const localEntityIndex = getDeploymentEntityStateIndex(
    params.definition.deploymentUuid,
    params.definition.applicationSection,
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
  //   "selectEntityInstanceUuidIndexFromLocalCacheQueryAndDeploymentEntityState",
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
  [selectCurrentDeploymentEntityStateFromReduxState,selectMiroirSelectorQueryParams],
  selectEntityInstanceUuidIndexFromLocalCacheQueryAndDeploymentEntityState
)


//#########################################################################################
export const selectInstanceArrayForDeploymentSectionEntity = createSelector(
  [selectEntityInstanceUuidIndexFromLocalCache, selectSelectorParams],
  (state: EntityInstancesUuidIndex, params: DomainModelExtractor) => {
    // log.info("selectInstanceArrayForDeploymentSectionEntity called", params, state);

    return state ? Object.values(state) : [];
  }
);


