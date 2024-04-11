
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
  DomainStateQuerySelectorParams,
  DomainStateSelectorNew,
  EntityInstancesUuidIndex,
  JzodElement,
  JzodSchemaQuerySelector,
  JzodSchemaQuerySelectorParams,
  LoggerInterface,
  MiroirLoggerFactory,
  MiroirSelectorQueryParams,
  QuerySelector,
  QuerySelectorParams,
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

declare type DeploymentEntityStateJzodSchemaSelectorParamsSelector<QueryType extends DomainModelQueryJzodSchemaParams> = (
  reduxState: ReduxStateWithUndoRedo,
  params: JzodSchemaQuerySelectorParams<QueryType, DeploymentEntityState>
) => JzodSchemaQuerySelectorParams<QueryType, DeploymentEntityState>;

// ################################################################################################
declare type SelectorParamsSelector<QueryType extends MiroirSelectorQueryParams, StateType> = (
  reduxState: ReduxStateWithUndoRedo,
  params: QuerySelectorParams<QueryType, StateType>
) => QuerySelectorParams<QueryType, StateType>;


// ################################################################################################
export const selectCurrentDeploymentEntityStateFromReduxState = (
  reduxState: ReduxStateWithUndoRedo
): DeploymentEntityState => {
  return reduxState.presentModelSnapshot.current;
};

// ################################################################################################
export const selectDeploymentEntityStateSelectorParams /*: DomainStateSelectorParamsSelector<Q> */ = <QueryType extends MiroirSelectorQueryParams>(
  reduxState: ReduxStateWithUndoRedo,
  params: QuerySelectorParams<QueryType, DeploymentEntityState>
): QuerySelectorParams<QueryType, DeploymentEntityState> => {
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
export const selectJzodSchemaSelectorParams = <QueryType extends DomainModelQueryJzodSchemaParams, StateType>(
  reduxState: ReduxStateWithUndoRedo,
  params: JzodSchemaQuerySelectorParams<QueryType, StateType>
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
export function applyDeploymentEntityStateQuerySelector<QueryType extends MiroirSelectorQueryParams, ResultType>( // TODO: memoize?
  deploymentEntityStateQuerySelector: QuerySelector<QueryType, DeploymentEntityState, ResultType>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: QuerySelectorParams<QueryType, DeploymentEntityState>
) => ResultType { 
  return createSelector(
    // [selectCurrentDeploymentEntityStateFromReduxState, selectDomainStateSelectorParams as DomainStateSelectorParamsSelector<Q>],
    [selectCurrentDeploymentEntityStateFromReduxState, selectDeploymentEntityStateSelectorParams as SelectorParamsSelector<QueryType, DeploymentEntityState>],
    deploymentEntityStateQuerySelector
  )
}

// ################################################################################################
export function applyDeploymentEntityStateQuerySelectorForCleanedResult<QueryType extends MiroirSelectorQueryParams>( // TODO: memoize?
  deploymentEntityStateQuerySelector: QuerySelector<QueryType, DeploymentEntityState, DomainElement>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: QuerySelectorParams<QueryType, DeploymentEntityState>
) => any { 
  const cleanupFunction = (
    deploymentEntityState: DeploymentEntityState,
    params: QuerySelectorParams<QueryType, DeploymentEntityState>
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
// TODO: create "generic", StateType-independent version, receiving the state-access function as parameter (here selectCurrentDeploymentEntityStateFromReduxState)
export function applyDeploymentEntityStateJzodSchemaSelector<QueryType extends DomainModelQueryJzodSchemaParams>( // TODO: memoize?
  domainStateSelector: JzodSchemaQuerySelector<QueryType, DeploymentEntityState>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: JzodSchemaQuerySelectorParams<QueryType, DeploymentEntityState>
) => RecordOfJzodElement | JzodElement | undefined { 
  return createSelector(
    // [selectDeploymentEntityStateFromReduxState, selectDomainStateJzodSchemaSelectorParams as DomainStateJzodSchemaSelectorParamsSelector<QueryType>],
    [
      selectCurrentDeploymentEntityStateFromReduxState,
      selectJzodSchemaSelectorParams<QueryType, DeploymentEntityState>,
      // selectDomainStateJzodSchemaSelectorParams as DeploymentEntityStateJzodSchemaSelectorParamsSelector,
      // selectDomainStateJzodSchemaSelectorParams as JzodSchemaQuerySelectorParamsSelector<
      //   QueryType,
      //   DeploymentEntityState
      // >,
    ],
    domainStateSelector
  );
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
export const selectEntityInstanceUuidIndexFromLocalCacheQueryAndDeploymentEntityState = (
  deploymentEntityState: DeploymentEntityState,
  params: MiroirSelectorQueryParams
): EntityInstancesUuidIndex => {
  if (params.queryType != "LocalCacheEntityInstancesSelectorParams") {
    log.error(
      "selectEntityInstanceUuidIndexFromLocalCacheQueryAndDeploymentEntityState queryType is not LocalCacheEntityInstancesSelectorParams",
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
  log.info(
    "selectEntityInstanceUuidIndexFromLocalCacheQueryAndDeploymentEntityState",
    "params",
    params,
    "localEntityIndex",
    localEntityIndex,
    "deploymentEntityState",
    deploymentEntityState,
    "result",
    result
  );
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
  (state: EntityInstancesUuidIndex, params: MiroirSelectorQueryParams) => {
    log.info("selectInstanceArrayForDeploymentSectionEntity called", params, state);

    return state ? Object.values(state) : [];
  }
);


