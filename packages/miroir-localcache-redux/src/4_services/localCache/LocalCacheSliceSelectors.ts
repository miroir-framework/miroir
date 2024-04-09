
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
  DomainStateJzodSchemaSelector,
  DomainStateJzodSchemaSelectorParams,
  DomainStateSelectorNew,
  DomainStateSelectorParams,
  EntityInstancesUuidIndex,
  JzodElement,
  LoggerInterface,
  MiroirLoggerFactory,
  MiroirSelectorQueryParams,
  RecordOfJzodElement,
  cleanupResultsFromQuery,
  getLoggerName
} from "miroir-core";
import { packageName } from "../../constants";
import { cleanLevel } from "../constants";
import { getLocalCacheSliceIndex, selectDomainStateFromlocalCacheEntityZone } from "./LocalCacheSlice";
import { LocalCacheSliceState, ReduxStateWithUndoRedo } from "./localCacheReduxSliceInterface";

const loggerName: string = getLoggerName(packageName, cleanLevel,"LocalCacheSliceSelector");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

// ################################################################################################
declare type SelectorParamsSelector<Q extends MiroirSelectorQueryParams> = (reduxState: ReduxStateWithUndoRedo, params: Q) => Q;

export const selectSelectorParams /*: SelectorParamsSelector*/ = <Q extends MiroirSelectorQueryParams>(
  reduxState: ReduxStateWithUndoRedo,
  params: Q
) => {
  return params;
};

declare type DomainStateSelectorParamsSelector<Q extends MiroirSelectorQueryParams> = (
  reduxState: ReduxStateWithUndoRedo,
  params: DomainStateSelectorParams<Q>
) => DomainStateSelectorParams<Q>;

// ################################################################################################
export const selectDomainStateSelectorParams /*: DomainStateSelectorParamsSelector<Q> */ = <Q extends MiroirSelectorQueryParams>(
  reduxState: ReduxStateWithUndoRedo,
  params: DomainStateSelectorParams<Q>
): DomainStateSelectorParams<Q> => {
  return params;
};

declare type DomainStateJzodSchemaSelectorParamsSelector<Q extends DomainModelQueryJzodSchemaParams> = (
  reduxState: ReduxStateWithUndoRedo,
  params: DomainStateJzodSchemaSelectorParams<Q>
) => DomainStateJzodSchemaSelectorParams<Q>;

// ################################################################################################
export const selectDomainStateJzodSchemaSelectorParams = <Q extends DomainModelQueryJzodSchemaParams>(
  reduxState: ReduxStateWithUndoRedo,
  params: DomainStateJzodSchemaSelectorParams<Q>
) => {
  return params;
};

// // ################################################################################################
// const selectPresentModelSnapshot = (reduxState: ReduxStateWithUndoRedo,  params:MiroirSelectorQueryParams) => {
//   const result = reduxState.presentModelSnapshot
//   return result;
// }

// // ################################################################################################
// export const selectLocalCacheCurrentEntityZone = (reduxState: ReduxStateWithUndoRedo, params: MiroirSelectorQueryParams):DeploymentEntityState => {
//   return reduxState.presentModelSnapshot.current;
// }

// ################################################################################################
export const selectCurrentEntityZoneFromReduxState = (reduxState: ReduxStateWithUndoRedo):DeploymentEntityState => {
  return reduxState.presentModelSnapshot.current;
}

// ################################################################################################
export const selectMiroirSelectorQueryParams = (reduxState: ReduxStateWithUndoRedo, params: MiroirSelectorQueryParams):MiroirSelectorQueryParams => {
  return params;
}


//#########################################################################################
export const selectDomainStatePlainFromReduxState: (
  state: ReduxStateWithUndoRedo,
) => DomainState = createSelector(
  [selectCurrentEntityZoneFromReduxState],
  (state: DeploymentEntityState) => {
    // log.info("selectInstanceArrayForDeploymentSectionEntity called", params, state);

    return state ? selectDomainStateFromlocalCacheEntityZone(state) : {};
  }
);

// // ################################################################################################
// export const selectDomainState: (
//   state: ReduxStateWithUndoRedo,
//   params: MiroirSelectorQueryParams
// ) => DomainState = createSelector(
//   [selectPresentModelSnapshot, selectSelectorParams],
//   (state: LocalCacheSliceState, params: MiroirSelectorQueryParams) => {
//     // log.info("selectInstanceArrayForDeploymentSectionEntity called", params, state);

//     return state ? localCacheStateToDomainState(state) : {};
//   }
// );

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// DOMAIN STATE SELECTORS
// ################################################################################################
// ################################################################################################
export function applyDomainStateSelectorNew<Q extends MiroirSelectorQueryParams, T>( // TODO: memoize?
  domainStateSelector: DomainStateSelectorNew<Q, T>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: DomainStateSelectorParams<Q>
) => T { 
  return createSelector(
    [selectDomainStatePlainFromReduxState, selectDomainStateSelectorParams as DomainStateSelectorParamsSelector<Q>],
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
    [selectDomainStatePlainFromReduxState, selectDomainStateJzodSchemaSelectorParams as DomainStateJzodSchemaSelectorParamsSelector<Q>],
    domainStateSelector
  )
}


// ################################################################################################
export function applyDomainStateCleanSelectorNew<Q extends MiroirSelectorQueryParams>( // TODO: memoize?
  domainStateSelector: DomainStateSelectorNew<Q, DomainElement>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: DomainStateSelectorParams<Q>
) => any { 
  const cleanupFunction = (domainState: DomainState, params: DomainStateSelectorParams<Q>):DomainElement => {
    const partial:DomainElement = domainStateSelector(domainState, params);
    const result:any = cleanupResultsFromQuery(partial)
    return result;
  }

  return createSelector(
    [selectDomainStatePlainFromReduxState, selectDomainStateSelectorParams as DomainStateSelectorParamsSelector<Q>],
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
export const selectEntityInstanceUuidIndexFromLocalCacheEntityZone = (
  reduxState: DeploymentEntityState,
  params: MiroirSelectorQueryParams
): EntityInstancesUuidIndex => {
  if (params.queryType == "LocalCacheEntityInstancesSelectorParams") {
    const localEntityIndex = getLocalCacheSliceIndex(
      params.definition.deploymentUuid,
      params.definition.applicationSection,
      params.definition.entityUuid
    );
    const result =
      params.definition.deploymentUuid &&
      params.definition.applicationSection &&
      params.definition.entityUuid &&
      reduxState[localEntityIndex]
        ? (reduxState[localEntityIndex].entities as EntityInstancesUuidIndex)
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
  [selectCurrentEntityZoneFromReduxState,selectMiroirSelectorQueryParams],
  selectEntityInstanceUuidIndexFromLocalCacheEntityZone
)


//#########################################################################################
export const selectInstanceArrayForDeploymentSectionEntity = createSelector(
  [selectEntityInstanceUuidIndexFromLocalCache, selectSelectorParams],
  (state: EntityInstancesUuidIndex, params: MiroirSelectorQueryParams) => {
    log.info("selectInstanceArrayForDeploymentSectionEntity called", params, state);

    return state ? Object.values(state) : [];
  }
);


