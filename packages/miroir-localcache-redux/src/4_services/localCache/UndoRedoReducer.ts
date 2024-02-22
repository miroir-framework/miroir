import { PayloadAction, createSelector } from "@reduxjs/toolkit";
import produce, { Patch, applyPatches, enablePatches } from "immer";

import {
  CUDActionNamesArray,
  Commit,
  DomainTransactionalReplayableAction,
  LocalCacheInstanceCUDActionWithDeployment,
  LocalCacheModelActionWithDeployment,
  LocalCacheTransactionalActionWithDeployment,
  LoggerInterface,
  MiroirLoggerFactory,
  RemoteStoreCRUDAction,
  getLoggerName
} from "miroir-core";
import { packageName } from "../../constants";
import { cleanLevel } from "../constants";
import {
  InnerReducerInterface,
  LocalCacheSliceState,
  ReduxReducerWithUndoRedoInterface,
  ReduxStateChanges,
  ReduxStateWithUndoRedo,
  localCacheSliceInputActionNamesObject,
  localCacheSliceName,
} from "./localCacheReduxSliceInterface";
enablePatches(); // to gather undo/redo operation history


const TRANSACTIONS_ENABLED: boolean = true;

const loggerName: string = getLoggerName(packageName, cleanLevel,"UndoRedoReducer");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

// ################################################################################################
const undoableSliceUpdateActions: {type:string,actionName:string}[] =
  // the action to be reduced will update a substancial part of the instances in the slice. The whole slice state is saved to be undoable.
    (CUDActionNamesArray as readonly string[]).slice().concat(['updateEntity','UpdateMetaModelInstance']).flatMap(
    a => ([
      // {
      //   type: localCacheSliceName + '/' + localCacheSliceInputActionNamesObject.handleDomainTransactionalAction,
      //   actionName: a
      // },
      {
        type: localCacheSliceName + '/' + localCacheSliceInputActionNamesObject.handleLocalCacheTransactionalAction,
        actionName: a
      },
      // {
      //   type: localCacheSliceName + '/' + localCacheSliceInputActionNamesObject.handleLocalCacheCUDAction,
      //   actionName: a
      // }
    ])
  )
;

// ####################################################################################################
function callNextReducer(
  innerReducer: InnerReducerInterface,
  state: ReduxStateWithUndoRedo,
  action: PayloadAction<
    | LocalCacheTransactionalActionWithDeployment
    | LocalCacheInstanceCUDActionWithDeployment
    | RemoteStoreCRUDAction
  >
): ReduxStateWithUndoRedo {
  const { currentTransaction, previousModelSnapshot, pastModelPatches, presentModelSnapshot, futureModelPatches } = state;
  // because of asyncDispatchMiddleware. to clean up so that asyncDispatchMiddleware does not modify actions that can be replayed!

  const newPresentModelSnapshot: LocalCacheSliceState = produce(
    state.presentModelSnapshot,
    (draftState: LocalCacheSliceState) => innerReducer(draftState, action)
  );
  return {
    currentTransaction,
    previousModelSnapshot,
    pastModelPatches: pastModelPatches,
    presentModelSnapshot: newPresentModelSnapshot,
    futureModelPatches: futureModelPatches,
    queriesResultsCache: {},
  };
};

// ################################################################################################
export function reduxStoreWithUndoRedoGetInitialState(reducer:any):ReduxStateWithUndoRedo {
  return {
    currentTransaction: {} as Commit,
    previousModelSnapshot: {} as LocalCacheSliceState,
    pastModelPatches: [],
    presentModelSnapshot: reducer(undefined, {type:undefined, payload: undefined}),
    futureModelPatches: [],
    queriesResultsCache: {},
  }
}

// ################################################################################################
function callUndoRedoReducer(
  reducer: InnerReducerInterface,
  presentModelSnapshot: LocalCacheSliceState,
  action: PayloadAction<
    | LocalCacheModelActionWithDeployment
    | LocalCacheTransactionalActionWithDeployment
  >
): { newSnapshot: LocalCacheSliceState; changes: Patch[]; inverseChanges: Patch[] } {
  // log.info('callUndoRedoReducer called with action', action, 'state', state);
  // log.info("callUndoRedoReducer called with action", JSON.stringify(action, undefined, 2));
  // log.info("callUndoRedoReducer undoableSliceUpdateActions", JSON.stringify(undoableSliceUpdateActions, undefined, 2));

  let changes: Patch[] = [];
  let inverseChanges: Patch[] = [];
  const newPresentModelSnapshot: LocalCacheSliceState = produce(
    presentModelSnapshot,
    (draftState: LocalCacheSliceState) => reducer(draftState, action),
    (patches, inversePatches) => {
      // side effect, for scope extrusion :-/
      changes.push(...patches);
      inverseChanges.push(...inversePatches);
    }
  );

  switch (action.payload.actionType) {
    case "localCacheModelActionWithDeployment": {
      return { newSnapshot: newPresentModelSnapshot, changes: changes, inverseChanges: inverseChanges };
      break;
    }
    case "localCacheTransactionalActionWithDeployment": {
      const localAction = action.payload as LocalCacheTransactionalActionWithDeployment
      if (
        undoableSliceUpdateActions.some(
          (item) => item.type == action?.type && item.actionName == localAction.domainAction.actionName
        )
      ) {
        // TODO: test can probably be removed, sorting of undoable actions is done before reaching this point
        log.info(
          "callUndoRedoReducer undoable action type",
          action.type,
          "action name",
          action.payload.domainAction.actionName,
          "action",
          action.payload
        );
        return { newSnapshot: newPresentModelSnapshot, changes: changes, inverseChanges: inverseChanges };
      } else {
        log.warn(
          "callUndoRedoReducer not undoable action type",
          action.payload.actionType,
          "action",
          action.payload,
          "changes",
          changes,
          "inverseChanges",
          inverseChanges
        );
        log.warn("undoableSliceUpdateActions", undoableSliceUpdateActions);
        // log.warn("newPresentModelSnapshot", JSON.stringify(newPresentModelSnapshot));
        return { newSnapshot: newPresentModelSnapshot, changes: [], inverseChanges: [] };
      }
      break;
    }
    default: {
      return { newSnapshot: presentModelSnapshot, changes: [], inverseChanges: [] };
      break;
    }
  }
}

  // ####################################################################################################
  const callNextReducerWithUndoRedo = (
    innerReducer: InnerReducerInterface,
    state: ReduxStateWithUndoRedo,
    action: PayloadAction<
      | LocalCacheModelActionWithDeployment
      | LocalCacheTransactionalActionWithDeployment
    >
  ): ReduxStateWithUndoRedo => {
    const { currentTransaction, previousModelSnapshot, pastModelPatches, presentModelSnapshot, futureModelPatches } = state;
    // log.info('callNextReducerWithUndoRedo called for', action.type, action.payload.domainAction.actionType, action.payload.domainAction.actionName,'adding Patch to transaction');

    const { newSnapshot, changes, inverseChanges } = callUndoRedoReducer(innerReducer, presentModelSnapshot, action);
    if (presentModelSnapshot === newSnapshot) {
      // log.info('callNextReducerWithUndoRedo presentModelSnapshot === newSnapshot, nothing added to current transaction.');
      return state;
    } else {
      // presentModelSnapshot !== newSnapshot
      const newPatch: ReduxStateChanges = {
        action:
          action.payload.actionType == "localCacheModelActionWithDeployment"
            ? action.payload
            : action.payload.domainAction as DomainTransactionalReplayableAction,
        changes,
        inverseChanges,
      };

      // log.info('callNextReducerWithUndoRedo for', action.type, action.payload.domainAction.actionType, action.payload.domainAction.actionName,'adding Patch to transaction', newPatch);

      return {
        currentTransaction,
        previousModelSnapshot,
        pastModelPatches: changes.length > 0 ? [...pastModelPatches, newPatch] : pastModelPatches,
        presentModelSnapshot: newSnapshot,
        futureModelPatches: [],
        queriesResultsCache: {},
      };
    }
  };

  // ####################################################################################################
  const callNextReducerWithUndoRedoForModelAction = (
    innerReducer: InnerReducerInterface,
    state: ReduxStateWithUndoRedo,
    action: PayloadAction<
      | LocalCacheModelActionWithDeployment
      | LocalCacheTransactionalActionWithDeployment
    >
  ): ReduxStateWithUndoRedo => {
    const { currentTransaction, previousModelSnapshot, pastModelPatches, presentModelSnapshot, futureModelPatches } = state;
    // log.info('callNextReducerWithUndoRedo called for', action.type, action.payload.domainAction.actionType, action.payload.domainAction.actionName,'adding Patch to transaction');

    let callChanges: Patch[] = [];
    let inverseCallChanges: Patch[] = [];
    const newPresentModelSnapshot: LocalCacheSliceState = produce(
      presentModelSnapshot,
      (draftState: LocalCacheSliceState) => innerReducer(draftState, action),
      (patches, inversePatches) => {
        // side effect, for scope extrusion :-/
        callChanges.push(...patches);
        inverseCallChanges.push(...inversePatches);
      }
    );

    const callResult = { newSnapshot: newPresentModelSnapshot, changes: callChanges, inverseChanges: inverseCallChanges };
  
    const { newSnapshot, changes, inverseChanges } = callResult;
    // const { newSnapshot, changes, inverseChanges } = callUndoRedoReducer(innerReducer, presentModelSnapshot, action);
    if (presentModelSnapshot === newSnapshot) {
      // log.info('callNextReducerWithUndoRedo presentModelSnapshot === newSnapshot, nothing added to current transaction.');
      return state;
    } else {
      // presentModelSnapshot !== newSnapshot
      const newPatch: ReduxStateChanges = {
        action:
          action.payload.actionType == "localCacheModelActionWithDeployment"
            ? action.payload
            : (action.payload.domainAction as DomainTransactionalReplayableAction),
        changes,
        inverseChanges,
      };

      // log.info('callNextReducerWithUndoRedo for', action.type, action.payload.domainAction.actionType, action.payload.domainAction.actionName,'adding Patch to transaction', newPatch);

      
      // the model action is NOT passed down further to the next reducer
      
      return {
        currentTransaction,
        previousModelSnapshot,
        pastModelPatches: changes.length > 0 ? [...pastModelPatches, newPatch] : pastModelPatches,
        presentModelSnapshot: newSnapshot,
        futureModelPatches: [],
        queriesResultsCache: {},
      };
    }
  };

// ################################################################################################
export function createUndoRedoReducer(
  innerReducer:InnerReducerInterface
):ReduxReducerWithUndoRedoInterface
{
  // Returns a reducer function, that handles undo and redo
  // return reduceWithUndoRedo.bind(undefined,innerReducer)
  return (
    state: ReduxStateWithUndoRedo = reduxStoreWithUndoRedoGetInitialState(innerReducer),
    action: PayloadAction<
      | LocalCacheInstanceCUDActionWithDeployment
      | LocalCacheModelActionWithDeployment
      | LocalCacheTransactionalActionWithDeployment
      // | RemoteStoreCRUDAction
    >
  ): ReduxStateWithUndoRedo => {
    const { currentTransaction, previousModelSnapshot, pastModelPatches, presentModelSnapshot, futureModelPatches, queriesResultsCache } = state;
  
    // log.info("reduceWithUndoRedo received action " + action.type + " " + JSON.stringify(action, undefined, 2));
    
    switch (action.type) {
      case localCacheSliceName + "/" + localCacheSliceInputActionNamesObject.handleLocalCacheCUDAction: {
        // no undo/redo
        if (action.payload.actionType != "LocalCacheInstanceCUDActionWithDeployment") {
          throw new Error(
            "reduceWithUndoRedo handleLocalCacheCUDAction accepts only actionType=LocalCacheInstanceCUDActionWithDeployment, found " + action.payload.actionType
          );
        } else {
          // const instanceCUDAction: InstanceCUDAction = action.payload.instanceCUDAction;
          log.info("reduceWithUndoRedo handleLocalCacheCUDAction", action.payload.instanceCUDAction);
          switch (action.payload.instanceCUDAction.actionName) {
            case "replaceLocalCache": {
              const next = callNextReducer(innerReducer, state, action as PayloadAction<LocalCacheInstanceCUDActionWithDeployment>);
              return {
                currentTransaction,
                previousModelSnapshot, //TODO: effectively set previousModelSnapshot
                pastModelPatches,
                presentModelSnapshot: next.presentModelSnapshot,
                futureModelPatches,
                queriesResultsCache,
              };
              break;
            }
            default: { 
              return callNextReducer(innerReducer, state, action as PayloadAction<LocalCacheInstanceCUDActionWithDeployment>);
              break;
            }
          }
        }
      }
      case localCacheSliceName + "/" + localCacheSliceInputActionNamesObject.handleLocalCacheModelAction: {
        if (action.payload.actionType != "localCacheModelActionWithDeployment") {
          throw new Error(
            "reduceWithUndoRedo handleLocalCacheModelAction accepts only actionType=localCacheModelActionWithDeployment, found " + action.payload.actionType
          );
        } else {
          // throw new Error(
          //   "reduceWithUndoRedo handleLocalCacheModelAction not treated yet!" + action.payload.actionType
          // );
          // log.info("reduceWithUndoRedo handleLocalCacheModelAction treating action", action.payload)
          log.info("reduceWithUndoRedo handleLocalCacheModelAction treating action", JSON.stringify(action.payload, null, 2))
          return callNextReducerWithUndoRedoForModelAction(innerReducer, state, action as PayloadAction<LocalCacheModelActionWithDeployment>);
        }
        break;
      }
      case localCacheSliceName + "/" + localCacheSliceInputActionNamesObject.handleLocalCacheTransactionalAction: {
        // log.info('UndoRedoReducer localCacheSliceInputActionNamesObject.handleDomainAction with actionType',action.payload.domainAction.actionType'for action', action);
        log.info("reduceWithUndoRedo handleDomainAction for action", JSON.stringify(action, undefined, 2));
        if (action.payload.actionType !== "localCacheTransactionalActionWithDeployment") {
          throw new Error("reduceWithUndoRedo handleDomainTransactionalAction does not accept actionType=InstanceCUDAction!");
        } else {
          // const localAction = (action.payload as LocalCacheTransactionalActionWithDeployment)
          switch (action.payload.domainAction.actionType) {
            case "DomainTransactionalAction": {
              switch (action.payload.domainAction.actionName) {
                case "undo": {
                  if (pastModelPatches.length > 0) {
                    const newPast = pastModelPatches.slice(0, pastModelPatches.length - 1);
                    const newPresentSnapshot = applyPatches(
                      presentModelSnapshot,
                      pastModelPatches[pastModelPatches.length - 1].inverseChanges
                    );
                    log.info(
                      "reduceWithUndoRedo handleDomainAction undo patches",
                      pastModelPatches,
                      "undo",
                      pastModelPatches[0],
                      pastModelPatches[1]
                    );
                    return {
                      currentTransaction,
                      previousModelSnapshot,
                      pastModelPatches: newPast,
                      presentModelSnapshot: newPresentSnapshot,
                      futureModelPatches: [pastModelPatches[pastModelPatches.length - 1], ...futureModelPatches],
                      queriesResultsCache,
                    };
                  } else {
                    // do nothing
                    log.warn("reduceWithUndoRedo handleDomainAction cannot further undo, ignoring undo action");
                    return {
                      currentTransaction,
                      previousModelSnapshot,
                      pastModelPatches,
                      presentModelSnapshot,
                      futureModelPatches,
                      queriesResultsCache,
                    };
                  }
                }
                case "redo": {
                  if (futureModelPatches.length > 0) {
                    const newPastPatches = futureModelPatches[0];
                    const newFuturePatches = futureModelPatches.slice(1);
                    const newPresentSnapshot = applyPatches(presentModelSnapshot, newPastPatches.changes);
                    return {
                      currentTransaction,
                      previousModelSnapshot,
                      pastModelPatches: [...pastModelPatches, newPastPatches],
                      presentModelSnapshot: newPresentSnapshot,
                      futureModelPatches: newFuturePatches,
                      queriesResultsCache,
                    };
                  } else {
                    // do nothing
                    log.warn(
                      "reduceWithUndoRedo localCacheSliceInputActionNamesObject.handleDomainTransactionalAction cannot further redo, ignoring redo action"
                    );
                    return {
                      currentTransaction,
                      previousModelSnapshot,
                      pastModelPatches,
                      presentModelSnapshot,
                      futureModelPatches,
                      queriesResultsCache,
                    };
                  }
                  break;
                }
                case "updateEntity":
                case "UpdateMetaModelInstance":
                default: // TODO: explicitly handle DomainModelEntityUpdateActions by using their actionName!
                  // log.warn('UndoRedoReducer handleDomainAction default case for DomainTransactionalAction action.payload.actionName', action.payload.domainAction.actionName, action);
                  return callNextReducerWithUndoRedo(
                    innerReducer,
                    state,
                    action as PayloadAction<LocalCacheTransactionalActionWithDeployment>
                  );
              }
              break;
            }
            case "modelAction": { // this is a modelAction wrapped in transactional action!
              switch (action.payload.domainAction.actionName) {
                case "rollback": {
                  const next = callNextReducer(innerReducer, state, action as PayloadAction<LocalCacheTransactionalActionWithDeployment>);
                  return {
                    currentTransaction,
                    previousModelSnapshot, //TODO: effectively set previousModelSnapshot
                    pastModelPatches: [],
                    presentModelSnapshot: next.presentModelSnapshot,
                    futureModelPatches: [],
                    queriesResultsCache,
                  };
                  break;
                }
                case "commit": {
                  // no effect on local storage contents, just clears the present transaction contents.
                  return {
                    currentTransaction,
                    previousModelSnapshot: presentModelSnapshot, //TODO: presentModelSnapshot becomes previousModelSnapshot?
                    pastModelPatches: [],
                    presentModelSnapshot: presentModelSnapshot,
                    futureModelPatches: [],
                    queriesResultsCache,
                  };
                  break;
                }
                default: {// TODO: explicitly handle DomainModelEntityUpdateActions by using their actionName!
                  // log.warn('UndoRedoReducer handleDomainAction default case for DomainTransactionalAction action.payload.actionName', action.payload.domainAction.actionName, action);
                  return callNextReducerWithUndoRedo(
                    innerReducer,
                    state,
                    action as PayloadAction<LocalCacheTransactionalActionWithDeployment>
                  );
                  break;
                }
              }
              break;
            }
            default: {
              throw new Error("createUndoRedoReducer must not be called for action: " + JSON.stringify(action, undefined, 2));
              log.error("reduceWithUndoRedo handleDomainAction default case for action", action);
              break;
            }
          }
        }
        break;
      }
      default: {
        // log.warn('reduceWithUndoRedo default handling action',JSON.stringify(action, undefined, 2))
        // throw new Error("createUndoRedoReducer must not be called for action: " + JSON.stringify(action, undefined, 2));
        return callNextReducer(innerReducer, state, action as any); //useful? this is an unknown action!
      }
    }
    // log.error("UndoRedoReducer handleDomainAction out of switch handling action", action);
    // throw new Error("createUndoRedoReducer must not be called for action: " + JSON.stringify(action, undefined, 2));
    
    // return callNextReducer(innerReducer, state, action);
  };
}

//#########################################################################################
// TODO: precise type for return value of selectInstancesForEntity. This is a Selector, which reselect considers a Dictionnary...
// TODO: should it really memoize? Doen't this imply caching the whole value, which can be really large? Or is it juste the selector?
export const selectCurrentTransaction: () => (state: ReduxStateWithUndoRedo) => ReduxStateChanges[] =
  // _memoize(
  () => {
    // return createSelector(
    return createSelector(
      (state: ReduxStateWithUndoRedo) => {
        return state.pastModelPatches;
      },
      (items: ReduxStateChanges[]) => items
    );
  };
// )
