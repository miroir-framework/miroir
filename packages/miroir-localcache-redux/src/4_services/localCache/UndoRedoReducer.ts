import { PayloadAction, createSelector } from "@reduxjs/toolkit";
import produce, { Patch, applyPatches, enablePatches } from "immer";

import {
  Commit,
  InstanceAction,
  LocalCacheTransactionalInstanceActionWithDeployment,
  LocalCacheUndoRedoAction,
  LoggerInterface,
  MiroirLoggerFactory,
  ModelAction,
  RemoteStoreCRUDAction,
  getLoggerName,
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

const loggerName: string = getLoggerName(packageName, cleanLevel, "UndoRedoReducer");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

// ####################################################################################################
function callNextReducer(
  innerReducer: InnerReducerInterface,
  state: ReduxStateWithUndoRedo,
  action: PayloadAction<LocalCacheTransactionalInstanceActionWithDeployment | InstanceAction | RemoteStoreCRUDAction>
): ReduxStateWithUndoRedo {
  const { currentTransaction, previousModelSnapshot, pastModelPatches, presentModelSnapshot, futureModelPatches } =
    state;
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
}

// ################################################################################################
export function reduxStoreWithUndoRedoGetInitialState(reducer: any): ReduxStateWithUndoRedo {
  return {
    currentTransaction: {} as Commit,
    previousModelSnapshot: {} as LocalCacheSliceState,
    pastModelPatches: [],
    presentModelSnapshot: reducer(undefined, { type: undefined, payload: undefined }),
    futureModelPatches: [],
    queriesResultsCache: {},
  };
}

// ################################################################################################
function callUndoRedoReducer(
  reducer: InnerReducerInterface,
  presentModelSnapshot: LocalCacheSliceState,
  action: PayloadAction<ModelAction | LocalCacheTransactionalInstanceActionWithDeployment>
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
    // case "localCacheModelActionWithDeployment": {
    case "modelAction": {
      return { newSnapshot: newPresentModelSnapshot, changes: changes, inverseChanges: inverseChanges };
      break;
    }
    case "localCacheTransactionalInstanceActionWithDeployment": {
      // const localAction = action.payload as LocalCacheTransactionalInstanceActionWithDeployment
      // if (
      //   undoableSliceUpdateActions.some(
      //     (item) => item.type == action?.type && item.actionName == localAction.instanceAction.actionName
      //   )
      // ) {
      // TODO: test can probably be removed, sorting of undoable actions is done before reaching this point
      log.info(
        "callUndoRedoReducer undoable action type",
        action.type,
        "action name",
        action.payload.instanceAction.actionName,
        "action",
        action.payload
      );
      return { newSnapshot: newPresentModelSnapshot, changes: changes, inverseChanges: inverseChanges };
      // } else {
      //   log.warn(
      //     "callUndoRedoReducer not undoable action type",
      //     action.payload.actionType,
      //     "action",
      //     action.payload,
      //     "changes",
      //     changes,
      //     "inverseChanges",
      //     inverseChanges
      //   );
      //   log.warn("undoableSliceUpdateActions", undoableSliceUpdateActions);
      //   // log.warn("newPresentModelSnapshot", JSON.stringify(newPresentModelSnapshot));
      //   return { newSnapshot: newPresentModelSnapshot, changes: [], inverseChanges: [] };
      // }
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
  action: PayloadAction<ModelAction | LocalCacheTransactionalInstanceActionWithDeployment>
): ReduxStateWithUndoRedo => {
  const { currentTransaction, previousModelSnapshot, pastModelPatches, presentModelSnapshot, futureModelPatches } =
    state;
  // log.info('callNextReducerWithUndoRedo called for', action.type, action.payload.domainAction.actionType, action.payload.domainAction.actionName,'adding Patch to transaction');

  const { newSnapshot, changes, inverseChanges } = callUndoRedoReducer(innerReducer, presentModelSnapshot, action);
  if (presentModelSnapshot === newSnapshot) {
    // log.info('callNextReducerWithUndoRedo presentModelSnapshot === newSnapshot, nothing added to current transaction.');
    return state;
  } else {
    // presentModelSnapshot !== newSnapshot
    const newPatch: ReduxStateChanges = {
      action: action.payload,
      // action.payload.actionType == "localCacheModelActionWithDeployment"
      //   ? action.payload
      //   : action.payload.instanceAction as DomainTransactionalInstanceAction,
      changes,
      inverseChanges,
    };

    log.info("callNextReducerWithUndoRedo for", action.type, action.payload, "adding Patch to transaction", newPatch);

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
  action: PayloadAction<ModelAction | LocalCacheTransactionalInstanceActionWithDeployment>
): ReduxStateWithUndoRedo => {
  const { currentTransaction, previousModelSnapshot, pastModelPatches, presentModelSnapshot, futureModelPatches } =
    state;
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
      action: action.payload,
      // action.payload.actionType == "localCacheModelActionWithDeployment"
      //   ? action.payload
      //   : action.payload as DomainTransactionalInstanceAction),
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
export function createUndoRedoReducer(innerReducer: InnerReducerInterface): ReduxReducerWithUndoRedoInterface {
  // Returns a reducer function, that handles undo and redo
  // return reduceWithUndoRedo.bind(undefined,innerReducer)
  return (
    state: ReduxStateWithUndoRedo = reduxStoreWithUndoRedoGetInitialState(innerReducer),
    action: PayloadAction<
      InstanceAction | ModelAction | LocalCacheTransactionalInstanceActionWithDeployment | LocalCacheUndoRedoAction
      // | RemoteStoreCRUDAction
    >
  ): ReduxStateWithUndoRedo => {
    const {
      currentTransaction,
      previousModelSnapshot,
      pastModelPatches,
      presentModelSnapshot,
      futureModelPatches,
      queriesResultsCache,
    } = state;

    // log.info("reduceWithUndoRedo received action " + action.type + " " + JSON.stringify(action, undefined, 2));

    switch (action.type) {
      case localCacheSliceName + "/" + localCacheSliceInputActionNamesObject.handleInstanceAction: {
        // no undo/redo
        if (action.payload.actionType != "instanceAction") {
          throw new Error(
            "reduceWithUndoRedo handleInstanceAction accepts only actionType=LocalCacheInstanceAction, found " +
              action.payload.actionType
          );
        } else {
          log.info("reduceWithUndoRedo handleInstanceAction", action.payload);
          switch (action.payload.actionName) {
            case "replaceLocalCache": {
              const next = callNextReducer(innerReducer, state, action as PayloadAction<InstanceAction>);
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
              return callNextReducer(innerReducer, state, action as PayloadAction<InstanceAction>);
              break;
            }
          }
        }
      }
      case localCacheSliceName + "/" + localCacheSliceInputActionNamesObject.handleModelAction: {
        // if (action.payload.actionType != "localCacheModelActionWithDeployment") {
        if (action.payload.actionType != "modelAction") {
          throw new Error(
            "reduceWithUndoRedo handleModelAction accepts only actionType=modelAction, found " +
              action.payload.actionType
          );
        } else {
          // throw new Error(
          //   "reduceWithUndoRedo handleModelAction not treated yet!" + action.payload.actionType
          // );
          // log.info("reduceWithUndoRedo handleModelAction treating action", action.payload)
          log.info(
            "reduceWithUndoRedo handleModelAction treating action",
            JSON.stringify(action.payload, null, 2)
          );
          switch (action.payload.actionName) {
            case "rollback": {
              const next = callNextReducer(
                innerReducer,
                state,
                action as PayloadAction<LocalCacheTransactionalInstanceActionWithDeployment>
              );
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
            default: {
              // TODO: explicitly handle DomainModelEntityUpdateActions by using their actionName!
              // log.warn('UndoRedoReducer handleDomainAction default case for DomainTransactionalInstanceAction action.payload.actionName', action.payload.domainAction.actionName, action);
              return callNextReducerWithUndoRedoForModelAction(
                innerReducer,
                state,
                action as PayloadAction<LocalCacheTransactionalInstanceActionWithDeployment>
              );
              break;
            }
          }
          // return callNextReducerWithUndoRedoForModelAction(innerReducer, state, action as PayloadAction<LocalCacheModelActionWithDeployment>);
        }
        break;
      }
      case localCacheSliceName + "/" + localCacheSliceInputActionNamesObject.handleUndoRedoAction: {
        // log.info('UndoRedoReducer localCacheSliceInputActionNamesObject.handleDomainAction with actionType',action.payload.domainAction.actionType'for action', action);
        log.info("reduceWithUndoRedo handleDomainAction for action", JSON.stringify(action, undefined, 2));
        if (action.payload.actionType !== "localCacheUndoRedoAction") {
          throw new Error(
            "reduceWithUndoRedo handleUndoRedoAction does not accept actionType=" + action.payload.actionType
          );
        } else {
          // const localAction = (action.payload as LocalCacheTransactionalInstanceActionWithDeployment)
          // switch (action.payload.actionType) {
          //   case "localCacheUndoRedoAction": {
          switch (action.payload.undoRedoAction) {
            case "undo": {
              if (pastModelPatches.length > 0) {
                const newPast = pastModelPatches.slice(0, pastModelPatches.length - 1);
                const newPresentSnapshot = applyPatches(
                  presentModelSnapshot,
                  pastModelPatches[pastModelPatches.length - 1].inverseChanges
                );
                log.info(
                  "reduceWithUndoRedo handleUndoRedoAction undo patches",
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
                log.warn("reduceWithUndoRedo handleUndoRedoAction cannot further undo, ignoring undo action");
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
                  "reduceWithUndoRedo localCacheSliceInputActionNamesObject.handleUndoRedoAction cannot further redo, ignoring redo action"
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
            default: {
              throw new Error(
                "reduceWithUndoRedo localCacheSliceInputActionNamesObject.handleUndoRedoAction DomainUndoRedoAction cannot handle action:" +
                  action.payload.undoRedoAction
              );
            }
          }
          break;
          // }
          // default: {
          //   throw new Error("createUndoRedoReducer must not be called for action: " + JSON.stringify(action, undefined, 2));
          //   log.error("reduceWithUndoRedo handleDomainAction default case for action", action);
          //   break;
          // }
          // }
        }
        break;
      }
      case localCacheSliceName +
        "/" +
        localCacheSliceInputActionNamesObject.handleLocalCacheTransactionalInstanceAction: {
        // log.info('UndoRedoReducer localCacheSliceInputActionNamesObject.handleDomainAction with actionType',action.payload.domainAction.actionType'for action', action);
        log.info(
          "reduceWithUndoRedo handleLocalCacheTransactionalInstanceAction for action",
          JSON.stringify(action, undefined, 2)
        );
        // log.info("reduceWithUndoRedo handleLocalCacheTransactionalInstanceAction for action.payload", JSON.stringify(action, undefined, 2));
        if (action.payload.actionType !== "localCacheTransactionalInstanceActionWithDeployment") {
          throw new Error(
            "reduceWithUndoRedo handleLocalCacheTransactionalInstanceAction does not accept actionType=" +
              action.payload.actionType
          );
        } else {
          // const localAction = (action.payload as LocalCacheTransactionalInstanceActionWithDeployment)
          // switch (action.payload.domainAction.actionType) {
          //   case "DomainTransactionalInstanceAction": {
          //     switch (action.payload.domainAction.actionName) {
          //       case "UpdateMetaModelInstance":
          //       default: // TODO: explicitly handle DomainModelEntityUpdateActions by using their actionName!
          //         // log.warn('UndoRedoReducer handleDomainAction default case for DomainTransactionalInstanceAction action.payload.actionName', action.payload.domainAction.actionName, action);
          return callNextReducerWithUndoRedo(
            innerReducer,
            state,
            action as PayloadAction<LocalCacheTransactionalInstanceActionWithDeployment>
          );
          // }
          //   break;
          // }
          // default: {
          //   throw new Error("createUndoRedoReducer must not be called for action: " + JSON.stringify(action, undefined, 2));
          //   log.error("reduceWithUndoRedo handleDomainAction default case for action", action);
          //   break;
          // }
          // }
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
