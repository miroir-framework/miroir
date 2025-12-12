import { PayloadAction, createSelector } from "@reduxjs/toolkit";
import { Patch, applyPatches, enablePatches, produce } from "immer";

import {
  Commit,
  InstanceAction,
  LoggerInterface,
  MiroirLoggerFactory,
  ModelAction,
  ModelActionReplayableAction,
  RestPersistenceAction,
  TransactionalInstanceAction,
  UndoRedoAction
} from "miroir-core";
import { packageName } from "../../constants.js";
import { cleanLevel } from "../constants.js";
import {
  InnerReducerAction,
  InnerReducerInterface,
  LocalCacheSliceState,
  ReduxReducerWithUndoRedoInterface,
  ReduxStateChanges,
  ReduxStateWithUndoRedo,
  localCacheSliceInputActionNamesObject,
  localCacheSliceName,
} from "./localCacheReduxSliceInterface.js";
enablePatches(); // to gather undo/redo operation history

const TRANSACTIONS_ENABLED: boolean = true;

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "UndoRedoReducer")
).then((logger: LoggerInterface) => {log = logger});

// ####################################################################################################
function callNextReducer(
  innerReducer: InnerReducerInterface,
  state: ReduxStateWithUndoRedo,
  action: PayloadAction<TransactionalInstanceAction | ModelAction | InstanceAction | RestPersistenceAction>
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
  action: PayloadAction<ModelAction | TransactionalInstanceAction>
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
    // case "modelAction": {
    case "initModel":
    case "commit":
    case "rollback":
    case "remoteLocalCacheRollback":
    case "resetModel":
    case "resetData":
    case "alterEntityAttribute":
    case "renameEntity":
    case "createEntity":
    case "dropEntity": {
      return { newSnapshot: newPresentModelSnapshot, changes: changes, inverseChanges: inverseChanges };
      break;
    }
    case "transactionalInstanceAction": {
      // log.info(
      //   "callUndoRedoReducer undoable action type",
      //   action.type,
      //   "action name",
      //   action.payload.instanceAction.actionName,
      //   "action",
      //   action.payload
      // );
      return { newSnapshot: newPresentModelSnapshot, changes: changes, inverseChanges: inverseChanges };
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
  action: PayloadAction<ModelActionReplayableAction | TransactionalInstanceAction>
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
      changes,
      inverseChanges,
    };

    // log.info("callNextReducerWithUndoRedo for", action.type, action.payload, "adding Patch to transaction", newPatch);

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
  action: PayloadAction<ModelActionReplayableAction | TransactionalInstanceAction>
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
  if (presentModelSnapshot === newSnapshot) {
    // log.info('callNextReducerWithUndoRedo presentModelSnapshot === newSnapshot, nothing added to current transaction.');
    return state;
  } else {
    // presentModelSnapshot !== newSnapshot
    const newPatch: ReduxStateChanges = {
      action: action.payload,
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
function handleModelAction(
  innerReducer: InnerReducerInterface,
  state: ReduxStateWithUndoRedo,
  action: PayloadAction<ModelAction>
): ReduxStateWithUndoRedo {
  // log.info("reduceWithUndoRedo handleModelAction treating action", JSON.stringify(action.payload, null, 2));
  log.info("reduceWithUndoRedo handleModelAction treating action", action.payload);
  const {
    currentTransaction,
    previousModelSnapshot,
    pastModelPatches,
    presentModelSnapshot,
    futureModelPatches,
    queriesResultsCache,
  } = state;
  switch (action.payload.actionType) {
    case "rollback": {
      const next = callNextReducer(
        innerReducer,
        state,
        action
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
    case "initModel":
    case "resetModel":
    case "resetData": {
      return callNextReducer(innerReducer, state, action as any);
      // log.debug("reduceWithUndoRedo handleModelAction nothing to do for action", JSON.stringify(action.payload, null, 2))
      break;
    }
    case "alterEntityAttribute":
    case "renameEntity":
    case "createEntity":
    case "dropEntity": {
      if (action.payload.payload.transactional == false) {
        return callNextReducer(innerReducer, state, action as any);        
      } else {
        const localAction: PayloadAction<ModelActionReplayableAction> = action as PayloadAction<ModelActionReplayableAction>;
        return callNextReducerWithUndoRedoForModelAction(
          innerReducer,
          state,
          localAction
        );
      }
    }
    default: {
      // TODO: explicitly handle DomainModelEntityUpdateActions by using their actionName!
      log.warn('UndoRedoReducer handleAction default case for DomainTransactionalInstanceAction action.payload.actionName', JSON.stringify(action.payload, undefined, 2));
      return callNextReducer(innerReducer, state, action as any);        
      break;
    }
  }
}
// ################################################################################################
function handleInstanceAction(
  innerReducer: InnerReducerInterface,
  state: ReduxStateWithUndoRedo,
  action: PayloadAction<InstanceAction>
): ReduxStateWithUndoRedo {
  // log.info("reduceWithUndoRedo handleInstanceAction treating action", JSON.stringify(action.payload, null, 2));
  // log.info("reduceWithUndoRedo handleInstanceAction", action.payload);
  const {
    currentTransaction,
    previousModelSnapshot,
    pastModelPatches,
    presentModelSnapshot,
    futureModelPatches,
    queriesResultsCache,
  } = state;
  // switch (action.payload.actionName) {
  switch (action.payload.actionType) {
    case "loadNewInstancesInLocalCache": {
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
// ################################################################################################
function handleUndoRedoAction(
  innerReducer: InnerReducerInterface,
  state: ReduxStateWithUndoRedo,
  action: PayloadAction<UndoRedoAction>
): ReduxStateWithUndoRedo {
  // log.info("reduceWithUndoRedo handleUndoRedoAction treating action", JSON.stringify(action.payload, null, 2));
  // log.info("reduceWithUndoRedo handleUndoRedoAction", action.payload);
  const {
    currentTransaction,
    previousModelSnapshot,
    pastModelPatches,
    presentModelSnapshot,
    futureModelPatches,
    queriesResultsCache,
  } = state;
  switch (action.payload.actionType) {
    case "undo": {
      if (pastModelPatches.length > 0) {
        const newPast = pastModelPatches.slice(0, pastModelPatches.length - 1);
        const newPresentSnapshot = applyPatches(
          presentModelSnapshot,
          pastModelPatches[pastModelPatches.length - 1].inverseChanges
        );
        // log.info(
        //   "reduceWithUndoRedo handleUndoRedoAction undo patches",
        //   pastModelPatches,
        //   "undo",
        //   pastModelPatches[0],
        //   pastModelPatches[1]
        // );
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
        "reduceWithUndoRedo localCacheSliceInputActionNamesObject.handleUndoRedoAction DomainUndoRedoAction cannot handle action" +
          action.payload
      );
    }
  }
}
// ################################################################################################
export function createUndoRedoReducer(innerReducer: InnerReducerInterface): ReduxReducerWithUndoRedoInterface {
  // Returns a reducer function, that handles undo and redo
  // return reduceWithUndoRedo.bind(undefined,innerReducer)
  return (
    state: ReduxStateWithUndoRedo = reduxStoreWithUndoRedoGetInitialState(innerReducer),
    action: PayloadAction<
      InnerReducerAction
    >
  ): ReduxStateWithUndoRedo => {
    // log.info("reduceWithUndoRedo received action " + action.type + " " + JSON.stringify(action, undefined, 2));

    switch (action.type) {
      case localCacheSliceName + "/" + localCacheSliceInputActionNamesObject.handleAction: {
        // log.info("reduceWithUndoRedo handleAction treating action", action.payload)
        switch (action.payload.actionType) {
          // case "modelAction": {
          case "initModel":
          case "commit":
          case "rollback":
          case "remoteLocalCacheRollback":
          case "resetModel":
          case "resetData":
          case "alterEntityAttribute":
          case "renameEntity":
          case "createEntity":
          case "dropEntity": {
            return handleModelAction(innerReducer, state, action as PayloadAction<ModelAction>)
            break;
          }
          // case "instanceAction": {
          case "createInstance":
          case "deleteInstance":
          case "deleteInstanceWithCascade":
          case "updateInstance":
          case "loadNewInstancesInLocalCache":
          case "getInstance":
          case "getInstances": {
            return handleInstanceAction(innerReducer, state, action as PayloadAction<InstanceAction>)
            break;
          }
          case "transactionalInstanceAction": {
            return callNextReducerWithUndoRedo(
              innerReducer,
              state,
              action as PayloadAction<TransactionalInstanceAction>
            );
            break;
          }
          case "undo":
          case "redo":{
            return handleUndoRedoAction(innerReducer, state, action as PayloadAction<UndoRedoAction>)
            break;
          }
          case "RestPersistenceAction": 
          default: {
            throw new Error(
              "reduceWithUndoRedo handleAction accepts only actionType=modelAction, found " +
                action.payload
            );
            break;
          }
        }
        break;
      }
      default: {
        // log.warn('reduceWithUndoRedo default handling action',JSON.stringify(action, undefined, 2))
        return callNextReducer(innerReducer, state, action as any); //useful? this is an unknown action!
      }
    }
  };
}

//#########################################################################################
// TODO: precise type for return value of selectInstancesForEntity. This is a Selector, which reselect considers a Dictionnary...
// TODO: should it really memoize? Doen't this imply caching the whole value, which can be really large? Or is it juste the selector?
export const selectCurrentTransaction: () => (state: ReduxStateWithUndoRedo) => ReduxStateChanges[] =
  () => {
    return (state: ReduxStateWithUndoRedo) => {
      return state.pastModelPatches;
    };
  };
