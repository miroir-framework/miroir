
//#########################################################################################
// SELECTORS
//#########################################################################################
// TODO: precise type for return value of selectInstancesForEntity. This is a Selector, which reselect considers a Dictionnary...
// TODO: should it memoize? Doen't this imply caching the whole value, which can be really large? Or is it just the selector?

import { createSelector } from "@reduxjs/toolkit";
import { MiroirSelectorQueryParams, DomainState, EntityInstancesUuidIndex, LoggerInterface, MiroirLoggerFactory, getLoggerName } from "miroir-core";
import { getLocalCacheSliceIndex, localCacheStateToDomainState } from "./LocalCacheSlice";
import { ReduxStateWithUndoRedo, LocalCacheSliceState } from "./localCacheReduxSliceInterface";
import { packageName } from "../../constants";
import { cleanLevel } from "../constants";

const loggerName: string = getLoggerName(packageName, cleanLevel,"LocalCacheSliceSelector");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

// ################################################################################################
export const selectSelectorParams = (reduxState: ReduxStateWithUndoRedo,params:MiroirSelectorQueryParams) => {
  return params;
}
// ################################################################################################
const selectSelectorReduxState = (reduxState: ReduxStateWithUndoRedo,params:MiroirSelectorQueryParams) => {
  return reduxState;
}

// ################################################################################################
const selectPresentModelSnapshotPlain = (reduxState: ReduxStateWithUndoRedo) => {
  const result = reduxState.presentModelSnapshot
  return result;
}

// ################################################################################################
const selectPresentModelSnapshot = (reduxState: ReduxStateWithUndoRedo,  params:MiroirSelectorQueryParams) => {
  const result = reduxState.presentModelSnapshot
  return result;
}

//#########################################################################################
// DOMAIN SELECTORS
//#########################################################################################
export const selectDomainStatePlain: (
  state: ReduxStateWithUndoRedo,
) => DomainState = createSelector(
  [selectPresentModelSnapshotPlain],
  (state: LocalCacheSliceState) => {
    // log.info("selectInstanceArrayForDeploymentSectionEntity called", params, state);

    return state ? localCacheStateToDomainState(state) : {};
  }
);

// ################################################################################################
export const selectDomainState: (
  state: ReduxStateWithUndoRedo,
  params: MiroirSelectorQueryParams
) => DomainState = createSelector(
  [selectPresentModelSnapshot, selectSelectorParams],
  (state: LocalCacheSliceState, params: MiroirSelectorQueryParams) => {
    // log.info("selectInstanceArrayForDeploymentSectionEntity called", params, state);

    return state ? localCacheStateToDomainState(state) : {};
  }
);

// ################################################################################################
export function applyDomainStateSelector<T>( // TODO: memoize?
  domainStateSelector: (
    domainState: DomainState,
    params: MiroirSelectorQueryParams
  ) => T
): (
  reduxState: ReduxStateWithUndoRedo,
  params: MiroirSelectorQueryParams
) => T { 
  return createSelector(
    [selectDomainStatePlain, selectSelectorParams],
    domainStateSelector
  )
}


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


// ################################################################################################
export const selectEntityInstanceUuidIndexFromLocalCache = (
  reduxState: ReduxStateWithUndoRedo,
  params: MiroirSelectorQueryParams
): EntityInstancesUuidIndex | undefined => {
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
      reduxState.presentModelSnapshot[localEntityIndex]
        ? (reduxState.presentModelSnapshot[localEntityIndex].entities as EntityInstancesUuidIndex)
        : undefined;
    // log.info('selectEntityInstanceUuidIndexFromLocalCache','params',params,'localEntityIndex',localEntityIndex,'state',state,'result',result);
    return result;
  } else {
    return undefined;
  }
};


//#########################################################################################
export const selectInstanceArrayForDeploymentSectionEntity = createSelector(
  [selectEntityInstanceUuidIndexFromLocalCache, selectSelectorParams],
  (state: EntityInstancesUuidIndex, params: MiroirSelectorQueryParams) => {
    log.info("selectInstanceArrayForDeploymentSectionEntity called", params, state);

    return state ? Object.values(state) : [];
  }
);


