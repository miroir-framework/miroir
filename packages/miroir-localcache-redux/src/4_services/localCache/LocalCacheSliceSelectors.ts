
//#########################################################################################
// SELECTORS
//#########################################################################################
// TODO: precise type for return value of selectInstancesForEntity. This is a Selector, which reselect considers a Dictionnary...
// TODO: should it memoize? Doen't this imply caching the whole value, which can be really large? Or is it just the selector?

import { createSelector } from "@reduxjs/toolkit";
import {
  DeploymentEntityState,
  DeploymentEntityStateJzodSchemaSelectorParams,
  DeploymentEntityStateQuerySelector,
  DeploymentEntityStateQuerySelectorParams,
  DomainElement,
  DomainModelQueryJzodSchemaParams,
  DomainState,
  DomainStateJzodSchemaSelector,
  DomainStateJzodSchemaSelectorParams,
  DomainStateQuerySelectorParams,
  DomainStateSelectorNew,
  EntityInstancesUuidIndex,
  JzodElement,
  LoggerInterface,
  MiroirLoggerFactory,
  MiroirSelectorQueryParams,
  RecordOfJzodElement,
  cleanupResultsFromQuery,
  getDeploymentEntityStateIndex,
  getLoggerName
} from "miroir-core";
import { packageName } from "../../constants";
import { cleanLevel } from "../constants";
import { selectDomainStateFromlocalCacheEntityZone } from "./LocalCacheSlice";
import { ReduxStateWithUndoRedo } from "./localCacheReduxSliceInterface";

const loggerName: string = getLoggerName(packageName, cleanLevel,"LocalCacheSliceSelector");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

// ################################################################################################
declare type DomainStateSelectorParamsSelector<Q extends MiroirSelectorQueryParams> = (
  reduxState: ReduxStateWithUndoRedo,
  params: DomainStateQuerySelectorParams<Q>
) => DomainStateQuerySelectorParams<Q>;

declare type DomainStateJzodSchemaSelectorParamsSelector<Q extends DomainModelQueryJzodSchemaParams> = (
  reduxState: ReduxStateWithUndoRedo,
  params: DomainStateJzodSchemaSelectorParams<Q>
) => DomainStateJzodSchemaSelectorParams<Q>;

// ################################################################################################
declare type DeploymentEntityStateSelectorParamsSelector<Q extends MiroirSelectorQueryParams> = (
  reduxState: ReduxStateWithUndoRedo,
  params: DeploymentEntityStateQuerySelectorParams<Q>
) => DeploymentEntityStateQuerySelectorParams<Q>;

declare type DeploymentEntityStateJzodSchemaSelectorParamsSelector<Q extends DomainModelQueryJzodSchemaParams> = (
  reduxState: ReduxStateWithUndoRedo,
  params: DeploymentEntityStateJzodSchemaSelectorParams<Q>
) => DeploymentEntityStateJzodSchemaSelectorParams<Q>;

// ################################################################################################
export const selectCurrentDeploymentEntityStateFromReduxState = (
  reduxState: ReduxStateWithUndoRedo
): DeploymentEntityState => {
  return reduxState.presentModelSnapshot.current;
};

// ################################################################################################
export const selectDeploymentEntityStateSelectorParams /*: DomainStateSelectorParamsSelector<Q> */ = <Q extends MiroirSelectorQueryParams>(
  reduxState: ReduxStateWithUndoRedo,
  params: DeploymentEntityStateQuerySelectorParams<Q>
): DeploymentEntityStateQuerySelectorParams<Q> => {
  return params;
};

// // ################################################################################################
// export const selectDomainStateSelectorParams /*: DomainStateSelectorParamsSelector<Q> */ = <Q extends MiroirSelectorQueryParams>(
//   reduxState: ReduxStateWithUndoRedo,
//   params: DomainStateQuerySelectorParams<Q>
// ): DomainStateQuerySelectorParams<Q> => {
//   return params;
// };

// ################################################################################################
export const selectMiroirSelectorQueryParams = (reduxState: ReduxStateWithUndoRedo, params: MiroirSelectorQueryParams):MiroirSelectorQueryParams => {
  return params;
}


// //#########################################################################################
// export const selectDeploymentEntityStateStateFromReduxState: (
//   state: ReduxStateWithUndoRedo,
// ) => DomainState = createSelector(
//   [selectCurrentDeploymentEntityStateFromReduxState],
//   (state: DeploymentEntityState) => {
//     // log.info("selectInstanceArrayForDeploymentSectionEntity called", params, state);

//     return state ? selectDomainStateFromlocalCacheEntityZone(state) : {};
//   }
// );

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
export const selectSelectorParams /*: SelectorParamsSelector*/ = <Q extends MiroirSelectorQueryParams>(
  reduxState: ReduxStateWithUndoRedo,
  params: Q
) => {
  return params;
};


// ################################################################################################
export const selectDomainStateSelectorParams /*: DomainStateSelectorParamsSelector<Q> */ = <Q extends MiroirSelectorQueryParams>(
  reduxState: ReduxStateWithUndoRedo,
  params: DomainStateQuerySelectorParams<Q>
): DomainStateQuerySelectorParams<Q> => {
  return params;
};

// ################################################################################################
export const selectDomainStateJzodSchemaSelectorParams = <Q extends DomainModelQueryJzodSchemaParams>(
  reduxState: ReduxStateWithUndoRedo,
  params: DomainStateJzodSchemaSelectorParams<Q>
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
export function applyDeploymentEntityStateQuerySelector<Q extends MiroirSelectorQueryParams, T>( // TODO: memoize?
  deploymentEntityStateQuerySelector: DeploymentEntityStateQuerySelector<Q, T>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: DeploymentEntityStateQuerySelectorParams<Q>
) => T { 
  return createSelector(
    // [selectCurrentDeploymentEntityStateFromReduxState, selectDomainStateSelectorParams as DomainStateSelectorParamsSelector<Q>],
    [selectCurrentDeploymentEntityStateFromReduxState, selectDeploymentEntityStateSelectorParams as DeploymentEntityStateSelectorParamsSelector<Q>],
    deploymentEntityStateQuerySelector
  )
}

export function applyDomainStateQuerySelector<Q extends MiroirSelectorQueryParams, T>( // TODO: memoize?
  domainStateSelector: DomainStateSelectorNew<Q, T>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: DomainStateQuerySelectorParams<Q>
) => T { 
  return createSelector(
    [selectDomainStateFromReduxState, selectDomainStateSelectorParams as DomainStateSelectorParamsSelector<Q>],
    domainStateSelector
  )
}

export function applyDomainStateJzodSchemaSelector<Q extends DomainModelQueryJzodSchemaParams>( // TODO: memoize?
  domainStateSelector: DomainStateJzodSchemaSelector<Q>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: DomainStateJzodSchemaSelectorParams<Q>
) => RecordOfJzodElement | JzodElement | undefined { 
  return createSelector(
    [selectDomainStateFromReduxState, selectDomainStateJzodSchemaSelectorParams as DomainStateJzodSchemaSelectorParamsSelector<Q>],
    domainStateSelector
  )
}


// ################################################################################################
export function applyDomainStateQuerySelectorForCleanedResult<Q extends MiroirSelectorQueryParams>( // TODO: memoize?
  domainStateSelector: DomainStateSelectorNew<Q, DomainElement>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: DomainStateQuerySelectorParams<Q>
) => any { 
  const cleanupFunction = (domainState: DomainState, params: DomainStateQuerySelectorParams<Q>):DomainElement => {
    const partial:DomainElement = domainStateSelector(domainState, params);
    const result:any = cleanupResultsFromQuery(partial)
    return result;
  }

  return createSelector(
    [selectDomainStateFromReduxState, selectDomainStateSelectorParams as DomainStateSelectorParamsSelector<Q>],
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
export const selectEntityInstanceUuidIndexFromDeploymentEntityState = (
  deploymentEntityState: DeploymentEntityState,
  params: MiroirSelectorQueryParams
): EntityInstancesUuidIndex => {
  if (params.queryType == "LocalCacheEntityInstancesSelectorParams") {
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
        ? (deploymentEntityState[localEntityIndex].entities as EntityInstancesUuidIndex)
        : empty;
    // log.info('selectEntityInstanceUuidIndexFromLocalCache','params',params,'localEntityIndex',localEntityIndex,'state',state,'result',result);
    return result;
  } else {
    // return undefined;
    return empty;
  }
};
// ################################################################################################
export const selectEntityInstanceUuidIndexFromLocalCache = createSelector (
  [selectCurrentDeploymentEntityStateFromReduxState,selectMiroirSelectorQueryParams],
  selectEntityInstanceUuidIndexFromDeploymentEntityState
)


//#########################################################################################
export const selectInstanceArrayForDeploymentSectionEntity = createSelector(
  [selectEntityInstanceUuidIndexFromLocalCache, selectSelectorParams],
  (state: EntityInstancesUuidIndex, params: MiroirSelectorQueryParams) => {
    log.info("selectInstanceArrayForDeploymentSectionEntity called", params, state);

    return state ? Object.values(state) : [];
  }
);


