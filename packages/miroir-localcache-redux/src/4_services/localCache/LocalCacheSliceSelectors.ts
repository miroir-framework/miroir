
//#########################################################################################
// SELECTORS
//#########################################################################################
// TODO: precise type for return value of selectInstancesForEntity. This is a Selector, which reselect considers a Dictionnary...
// TODO: should it memoize? Doen't this imply caching the whole value, which can be really large? Or is it just the selector?

import { createSelector } from "@reduxjs/toolkit";
import {
  MiroirSelectorQueryParams,
  DomainState,
  EntityInstancesUuidIndex,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName,
  DomainStateSelector,
  DomainElement,
  cleanupResultsFromQuery,
  DomainStateSelectorNew,
  DomainStateSelectorParams,
  DomainModelQueryJzodSchemaParams,
  DomainStateJzodSchemaSelector,
  DomainStateJzodSchemaSelectorParams,
  JzodElement,
  RecordOfJzodElement,
} from "miroir-core";
import { getLocalCacheSliceIndex, localCacheStateEntityZoneToDomainState, localCacheStateToDomainState } from "./LocalCacheSlice";
import { ReduxStateWithUndoRedo, LocalCacheSliceState, LocalCacheSliceStateEntityZone } from "./localCacheReduxSliceInterface";
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
declare type SelectorParamsSelector<Q extends MiroirSelectorQueryParams> = (reduxState: ReduxStateWithUndoRedo, params: Q) => Q;

export const selectSelectorParams /*: SelectorParamsSelector*/ = <Q extends MiroirSelectorQueryParams>(reduxState: ReduxStateWithUndoRedo, params: Q) => {
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

// ################################################################################################
export const selectLocalCacheCurrentEntityZone = (reduxState: ReduxStateWithUndoRedo, params: MiroirSelectorQueryParams):LocalCacheSliceStateEntityZone => {
  return reduxState.presentModelSnapshot.current;
}

// ################################################################################################
export const selectLocalCacheCurrentEntityZonePlain = (reduxState: ReduxStateWithUndoRedo):LocalCacheSliceStateEntityZone => {
  return reduxState.presentModelSnapshot.current;
}

// ################################################################################################
export const selectMiroirSelectorQueryParams = (reduxState: ReduxStateWithUndoRedo, params: MiroirSelectorQueryParams):MiroirSelectorQueryParams => {
  return params;
}


//#########################################################################################
export const selectDomainStatePlainOld: (
  state: ReduxStateWithUndoRedo,
) => DomainState = createSelector(
  [selectPresentModelSnapshotPlain],
  (state: LocalCacheSliceState) => {
    // log.info("selectInstanceArrayForDeploymentSectionEntity called", params, state);

    return state ? localCacheStateToDomainState(state) : {};
  }
);

//#########################################################################################
export const selectDomainStatePlain: (
  state: ReduxStateWithUndoRedo,
) => DomainState = createSelector(
  [selectLocalCacheCurrentEntityZonePlain],
  (state: LocalCacheSliceStateEntityZone) => {
    // log.info("selectInstanceArrayForDeploymentSectionEntity called", params, state);

    return state ? localCacheStateEntityZoneToDomainState(state) : {};
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

//#########################################################################################
//#########################################################################################
//#########################################################################################
//#########################################################################################
//#########################################################################################
//#########################################################################################
//#########################################################################################
// DOMAIN STATE SELECTORS
//#########################################################################################
// ################################################################################################
export function applyDomainStateSelectorNew<Q extends MiroirSelectorQueryParams, T>( // TODO: memoize?
  domainStateSelector: DomainStateSelectorNew<Q, T>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: DomainStateSelectorParams<Q>
) => T { 
  return createSelector(
    // [selectDomainStatePlainOld, selectDomainStateSelectorParams as DomainStateSelectorParamsSelector<Q>],
    [selectDomainStatePlain, selectDomainStateSelectorParams as DomainStateSelectorParamsSelector<Q>],
    domainStateSelector
  )
}

export function applyDomainStateJzodSchemaSelector<Q extends DomainModelQueryJzodSchemaParams>( // TODO: memoize?
  domainStateSelector: DomainStateJzodSchemaSelector<Q>
// ): DomainStateJzodSchemaSelector<Q> {
): (
  reduxState: ReduxStateWithUndoRedo,
  params: DomainStateJzodSchemaSelectorParams<Q>
// ) => any { 
) => RecordOfJzodElement | JzodElement | undefined { 
  return createSelector(
    [selectDomainStatePlainOld, selectDomainStateJzodSchemaSelectorParams as DomainStateJzodSchemaSelectorParamsSelector<Q>],
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
    [selectDomainStatePlainOld, selectDomainStateSelectorParams as DomainStateSelectorParamsSelector<Q>],
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
export function applyDomainStateSelector<Q extends MiroirSelectorQueryParams, T>( // TODO: memoize?
  domainStateSelector: DomainStateSelector<Q, T>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: MiroirSelectorQueryParams
) => T { 
  return createSelector(
    [selectDomainStatePlainOld, selectSelectorParams as SelectorParamsSelector<Q>],
    domainStateSelector 
  ) as any // TODO: determine exact type! do we need parametered type at all?
}

// ################################################################################################
export function applyDomainStateCleanSelector<Q extends MiroirSelectorQueryParams>( // TODO: memoize?
  domainStateSelector: DomainStateSelector<Q, DomainElement>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: MiroirSelectorQueryParams
) => any { 
  const cleanupFunction = (domainState: DomainState, params: Q):DomainElement => {
    const partial:DomainElement = domainStateSelector(domainState, params);
    const result:any = cleanupResultsFromQuery(partial)
    return result;
  }

  return createSelector(
    [selectDomainStatePlainOld, selectSelectorParams  as SelectorParamsSelector<Q>],
    cleanupFunction
  ) as any
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

const empty = {}

// ################################################################################################
export const selectEntityInstanceUuidIndexFromLocalCache = (
  reduxState: ReduxStateWithUndoRedo,
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
      reduxState.presentModelSnapshot.current[localEntityIndex]
        ? (reduxState.presentModelSnapshot.current[localEntityIndex].entities as EntityInstancesUuidIndex)
        : empty;
    // log.info('selectEntityInstanceUuidIndexFromLocalCache','params',params,'localEntityIndex',localEntityIndex,'state',state,'result',result);
    return result;
  } else {
    // return undefined;
    return empty;
  }
};

// ################################################################################################
export const selectEntityInstanceUuidIndexFromLocalCacheEntityZone = (
  // reduxState: ReduxStateWithUndoRedo,
  reduxState: LocalCacheSliceStateEntityZone,
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


//#########################################################################################
export const selectInstanceArrayForDeploymentSectionEntity = createSelector(
  [selectEntityInstanceUuidIndexFromLocalCache, selectSelectorParams],
  (state: EntityInstancesUuidIndex, params: MiroirSelectorQueryParams) => {
    log.info("selectInstanceArrayForDeploymentSectionEntity called", params, state);

    return state ? Object.values(state) : [];
  }
);


