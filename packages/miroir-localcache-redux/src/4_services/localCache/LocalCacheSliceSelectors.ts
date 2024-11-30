
//#########################################################################################
// SELECTORS
//#########################################################################################
// TODO: precise type for return value of selectInstancesForEntity. This is a Selector, which reselect considers a Dictionnary...
// TODO: should it memoize? Doen't this imply caching the whole value, which can be really large? Or is it just the selector?

import { createSelector } from "@reduxjs/toolkit";
import {
  DeploymentEntityState,
  DomainElement,
  DomainModelQueryTemplateJzodSchemaParams,
  DomainState,
  EntityInstancesUuidIndex,
  JzodElement,
  JzodSchemaQueryTemplateSelector,
  ExtractorTemplateRunnerParamsForJzodSchema,
  LoggerInterface,
  MiroirLoggerFactory,
  QueryTemplateDEFUNCT,
  SyncExtractorOrQueryTemplateRunner,
  SyncExtractorOrQueryTemplateRunnerParams,
  RecordOfJzodElement,
  domainElementToPlainObject,
  getDeploymentEntityStateIndex,
  getLoggerName,
  MiroirQuery,
  SyncExtractorOrQueryRunner,
  SyncExtractorOrQueryRunnerParams,
  QueryJzodSchemaParams,
  JzodSchemaQuerySelector,
  ExtractorRunnerParamsForJzodSchema
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
declare type JzodSchemaSelectorParamsSelector<QueryType extends DomainModelQueryTemplateJzodSchemaParams, StateType> = (
  reduxState: ReduxStateWithUndoRedo,
  params: ExtractorTemplateRunnerParamsForJzodSchema<QueryType, StateType>
) => ExtractorTemplateRunnerParamsForJzodSchema<QueryType, StateType>;


// ################################################################################################
declare type SelectorParamsTemplateSelector<QueryType extends QueryTemplateDEFUNCT, StateType> = (
  reduxState: ReduxStateWithUndoRedo,
  params: SyncExtractorOrQueryTemplateRunnerParams<QueryType, StateType>
) => SyncExtractorOrQueryTemplateRunnerParams<QueryType, StateType>;

// ################################################################################################
declare type SelectorParamsSelector<QueryType extends MiroirQuery, StateType> = (
  reduxState: ReduxStateWithUndoRedo,
  params: SyncExtractorOrQueryRunnerParams<QueryType, StateType>
) => SyncExtractorOrQueryRunnerParams<QueryType, StateType>;


// ################################################################################################
export const selectCurrentDeploymentEntityStateFromReduxState = (
  reduxState: ReduxStateWithUndoRedo
): DeploymentEntityState => {
  return reduxState.presentModelSnapshot.current;
};

// ################################################################################################
export const selectDeploymentEntityStateSelectorForQueryTemplateParams /*: DomainStateSelectorParamsSelector<Q> */ = <QueryType extends QueryTemplateDEFUNCT>(
  reduxState: ReduxStateWithUndoRedo,
  params: SyncExtractorOrQueryTemplateRunnerParams<QueryType, DeploymentEntityState>
): SyncExtractorOrQueryTemplateRunnerParams<QueryType, DeploymentEntityState> => {
  return params;
};

// ################################################################################################
export const selectDeploymentEntityStateSelectorParams /*: DomainStateSelectorParamsSelector<Q> */ = <QueryType extends MiroirQuery>(
  reduxState: ReduxStateWithUndoRedo,
  params: SyncExtractorOrQueryRunnerParams<QueryType, DeploymentEntityState>
): SyncExtractorOrQueryRunnerParams<QueryType, DeploymentEntityState> => {
  return params;
};

// ################################################################################################
export const selectMiroirSelectorQueryParams = (
  reduxState: ReduxStateWithUndoRedo,
  params: QueryTemplateDEFUNCT
): QueryTemplateDEFUNCT => {
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
export const selectSelectorParams /*: SelectorParamsSelector*/ = <Q extends QueryTemplateDEFUNCT>(
  reduxState: ReduxStateWithUndoRedo,
  params: Q
) => {
  return params;
};


// ################################################################################################
export const selectDomainStateSelectorParams/*:SelectorParamsSelector<Q, DomainState> */ = <QueryType extends QueryTemplateDEFUNCT>(
  reduxState: ReduxStateWithUndoRedo,
  params: SyncExtractorOrQueryTemplateRunnerParams<QueryType, DomainState>
): SyncExtractorOrQueryTemplateRunnerParams<QueryType, DomainState> => {
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
export function applyDeploymentEntityStateQueryTemplateSelector<ExtractorType extends QueryTemplateDEFUNCT, ResultType>( // TODO: memoize?
  deploymentEntityStateQuerySelector: SyncExtractorOrQueryTemplateRunner<ExtractorType, DeploymentEntityState, ResultType>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: SyncExtractorOrQueryTemplateRunnerParams<ExtractorType, DeploymentEntityState>
) => ResultType { 
  return createSelector(
    [selectCurrentDeploymentEntityStateFromReduxState, selectDeploymentEntityStateSelectorForQueryTemplateParams as SelectorParamsTemplateSelector<ExtractorType, DeploymentEntityState>],
    deploymentEntityStateQuerySelector
  )
}

// ################################################################################################
export function applyDeploymentEntityStateQuerySelector<ExtractorType extends MiroirQuery, ResultType>( // TODO: memoize?
  deploymentEntityStateQuerySelector: SyncExtractorOrQueryRunner<ExtractorType, DeploymentEntityState, ResultType>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: SyncExtractorOrQueryRunnerParams<ExtractorType, DeploymentEntityState>
) => ResultType { 
  return createSelector(
    [selectCurrentDeploymentEntityStateFromReduxState, selectDeploymentEntityStateSelectorParams as SelectorParamsSelector<ExtractorType, DeploymentEntityState>],
    deploymentEntityStateQuerySelector
  )
}

// ################################################################################################
export function applyDeploymentEntityStateQueryTemplateSelectorForCleanedResult<QueryType extends QueryTemplateDEFUNCT>( // TODO: memoize?
  deploymentEntityStateQuerySelector: SyncExtractorOrQueryTemplateRunner<QueryType, DeploymentEntityState, DomainElement>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: SyncExtractorOrQueryTemplateRunnerParams<QueryType, DeploymentEntityState>
) => any { 
  const cleanupFunction = (
    deploymentEntityState: DeploymentEntityState,
    params: SyncExtractorOrQueryTemplateRunnerParams<QueryType, DeploymentEntityState>
  ): DomainElement => {
    const partial: DomainElement = deploymentEntityStateQuerySelector(deploymentEntityState, params);
    const result: any = domainElementToPlainObject(partial);
    return result;
  };

  return createSelector(
    [
      selectCurrentDeploymentEntityStateFromReduxState,
      selectDeploymentEntityStateSelectorForQueryTemplateParams as SelectorParamsTemplateSelector<
        QueryType,
        DeploymentEntityState
      >,
    ],
    cleanupFunction
  );
}

// ################################################################################################
export function applyDeploymentEntityStateQuerySelectorForCleanedResult<QueryType extends MiroirQuery>( // TODO: memoize?
  deploymentEntityStateQuerySelector: SyncExtractorOrQueryRunner<QueryType, DeploymentEntityState, DomainElement>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: SyncExtractorOrQueryRunnerParams<QueryType, DeploymentEntityState>
) => any { 
  const cleanupFunction = (
    deploymentEntityState: DeploymentEntityState,
    params: SyncExtractorOrQueryRunnerParams<QueryType, DeploymentEntityState>
  ): DomainElement => {
    const partial: DomainElement = deploymentEntityStateQuerySelector(deploymentEntityState, params);
    const result: any = domainElementToPlainObject(partial);
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
export function applyDomainStateQueryTemplateSelector<QueryType extends QueryTemplateDEFUNCT, ResultType>( // TODO: memoize?
  domainStateSelector: SyncExtractorOrQueryTemplateRunner<QueryType, DomainState, ResultType>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: SyncExtractorOrQueryTemplateRunnerParams<QueryType, DomainState>
) => ResultType { 
  return createSelector(
    // [selectDomainStateFromReduxState, selectDomainStateSelectorParams],
    [selectDomainStateFromReduxState, selectDomainStateSelectorParams as SelectorParamsTemplateSelector<QueryType, DomainState>],
    domainStateSelector
  )
}

// ################################################################################################
export function applyDomainStateJzodSchemaSelector<QueryType extends DomainModelQueryTemplateJzodSchemaParams>( // TODO: memoize?
  domainStateSelector: JzodSchemaQueryTemplateSelector<QueryType, DomainState>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: ExtractorTemplateRunnerParamsForJzodSchema<QueryType, DomainState>
) => RecordOfJzodElement | JzodElement | undefined { 
  return createSelector(
    [selectDomainStateFromReduxState, selectDomainStateJzodSchemaSelectorParams as JzodSchemaSelectorParamsSelector<QueryType, DomainState>],
    domainStateSelector
  )
}


// ################################################################################################
// TODO: create "generic", StateType-independent version, receiving the state-access function as parameter (here selectCurrentDeploymentEntityStateFromReduxState)
export function applyDeploymentEntityStateJzodSchemaSelectorTemplate<QueryTemplateType extends DomainModelQueryTemplateJzodSchemaParams>( // TODO: memoize?
  domainStateSelector: JzodSchemaQueryTemplateSelector<QueryTemplateType, DeploymentEntityState>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: ExtractorTemplateRunnerParamsForJzodSchema<QueryTemplateType, DeploymentEntityState>
) => RecordOfJzodElement | JzodElement | undefined { 
  return createSelector(
    [
      selectCurrentDeploymentEntityStateFromReduxState,
      selectJzodSchemaSelectorParamsForTemplate<QueryTemplateType, DeploymentEntityState>,
    ],
    domainStateSelector
  );
}

// ################################################################################################
// TODO: create "generic", StateType-independent version, receiving the state-access function as parameter (here selectCurrentDeploymentEntityStateFromReduxState)
export function applyDeploymentEntityStateJzodSchemaSelector<QueryType extends QueryJzodSchemaParams>( // TODO: memoize?
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
export function applyDomainStateQuerySelectorForCleanedResult<QueryType extends QueryTemplateDEFUNCT>( // TODO: memoize?
  domainStateSelector: SyncExtractorOrQueryTemplateRunner<QueryType, DomainState, DomainElement>
): (
  reduxState: ReduxStateWithUndoRedo,
  params: SyncExtractorOrQueryTemplateRunnerParams<QueryType, DomainState>
) => any { 
  const cleanupFunction = (domainState: DomainState, params: SyncExtractorOrQueryTemplateRunnerParams<QueryType, DomainState>):DomainElement => {
    const partial:DomainElement = domainStateSelector(domainState, params);
    const result:any = domainElementToPlainObject(partial)
    return result;
  }

  return createSelector(
    [selectDomainStateFromReduxState, selectDomainStateSelectorParams as SelectorParamsTemplateSelector<QueryType, DomainState>],
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
  params: QueryTemplateDEFUNCT
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
  (state: EntityInstancesUuidIndex, params: QueryTemplateDEFUNCT) => {
    // log.info("selectInstanceArrayForDeploymentSectionEntity called", params, state);

    return state ? Object.values(state) : [];
  }
);


