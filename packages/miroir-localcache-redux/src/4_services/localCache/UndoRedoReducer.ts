import { PayloadAction, createSelector } from "@reduxjs/toolkit";
import produce, { Patch, applyPatches, enablePatches } from "immer";

import {
  CRUDActionNamesArrayString,
  CUDActionNamesArray,
  DomainAncillaryOrReplayableActionWithDeployment,
  DomainTransactionalReplayableAction,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName
} from "miroir-core";
import { RemoteStoreRestSagaInputActionNamesObject } from "../remoteStore/RemoteStoreRestAccessSaga";
import {
  InnerReducerInterface,
  LocalCacheSliceState,
  ReduxReducerWithUndoRedoInterface,
  ReduxStateChanges,
  ReduxStateWithUndoRedo,
  localCacheSliceInputActionNamesObject,
  localCacheSliceName,
} from "./localCacheInterface";
import { packageName } from "../../constants";
import { cleanLevel } from "../constants";
enablePatches(); // to gather undo/redo operation history


const TRANSACTIONS_ENABLED: boolean = true;

const loggerName: string = getLoggerName(packageName, cleanLevel,"UndoRedoReducer");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

const undoableSliceUpdateActions: {type:string,actionName:string}[] =
  // the action to be reduced will update a substancial part of the instances in the slice. The whole slice state is saved to be undoable.
    (CUDActionNamesArray as readonly string[]).slice().concat(['updateEntity','UpdateMetaModelInstance']).map(
    a => ({
      type: localCacheSliceName + '/' + localCacheSliceInputActionNamesObject.handleLocalCacheDomainAction,
      actionName: a
    })
  )
;


export function reduxStoreWithUndoRedoGetInitialState(reducer:any):ReduxStateWithUndoRedo {
  return {
    previousModelSnapshot: {} as LocalCacheSliceState,
    pastModelPatches: [],
    presentModelSnapshot: reducer(undefined, {type:undefined, payload: undefined}),
    futureModelPatches: [],
    queriesResultsCache: {},
  }
}

// ####################################################################################################
function callUndoRedoReducer(
  reducer:InnerReducerInterface,
  state:LocalCacheSliceState,
  action:PayloadAction<DomainAncillaryOrReplayableActionWithDeployment>
):{newSnapshot:LocalCacheSliceState,changes: Patch[],inverseChanges:Patch[]} {
  // log.info('callUndoRedoReducer called with action', action, 'state', state);
  let changes:Patch[] = [];
  let inverseChanges:Patch[] = [];
  const newPresentModelSnapshot:LocalCacheSliceState = produce(
    state,
    (draftState:LocalCacheSliceState)=>reducer(draftState, action),
    (patches, inversePatches) => {
      // side effect, for scope extrusion :-/
      changes.push(...patches)
      inverseChanges.push(...inversePatches)
    }
  );
  if (undoableSliceUpdateActions.some((item)=>item.type == action?.type && item.actionName == action?.payload?.domainAction.actionName)) {
    // TODO: test can probably be removed, sorting of undoable actions is done before reaching this point
    // log.info('callUndoRedoReducer undoable action type', action.type, 'action name',action.payload.domainAction.actionName, 'action', action.payload)
    return {newSnapshot:newPresentModelSnapshot, changes: changes, inverseChanges: inverseChanges};
  } else {
    log.warn('callUndoRedoReducer not undoable action type', action.type, 'action name',action.payload.domainAction.actionName, 'action', action.payload,'changes',changes,'inverseChanges',inverseChanges)
    log.warn('undoableSliceUpdateActions', undoableSliceUpdateActions)
    log.warn('newPresentModelSnapshot', JSON.stringify(newPresentModelSnapshot))
    return {newSnapshot:newPresentModelSnapshot, changes: [], inverseChanges: []};
  }
}

  // ####################################################################################################
  const callNextReducerWithUndoRedo = (
    innerReducer:InnerReducerInterface,
    state: ReduxStateWithUndoRedo,
    action: PayloadAction<DomainAncillaryOrReplayableActionWithDeployment>,
  ): ReduxStateWithUndoRedo => {
    const { previousModelSnapshot, pastModelPatches, presentModelSnapshot, futureModelPatches } = state;
    // log.info('callNextReducerWithUndoRedo called for', action.type, action.payload.domainAction.actionType, action.payload.domainAction.actionName,'adding Patch to transaction');

    const { newSnapshot, changes, inverseChanges } = callUndoRedoReducer(innerReducer, presentModelSnapshot, action);
    if (presentModelSnapshot === newSnapshot) {
      // log.info('callNextReducerWithUndoRedo presentModelSnapshot === newSnapshot, nothing added to current transaction.');
      return state;
    } else { // presentModelSnapshot !== newSnapshot
      const newPatch:ReduxStateChanges = { action:action.payload.domainAction as DomainTransactionalReplayableAction, changes, inverseChanges };


      // log.info('callNextReducerWithUndoRedo for', action.type, action.payload.domainAction.actionType, action.payload.domainAction.actionName,'adding Patch to transaction', newPatch);
      
      return {
        previousModelSnapshot,
        pastModelPatches:
          changes.length > 0 ? [...pastModelPatches, newPatch] : pastModelPatches,
        presentModelSnapshot: newSnapshot,
        futureModelPatches: [],
        queriesResultsCache: {},
      };
    }
  };

// ####################################################################################################
function callNextReducer(
  innerReducer:InnerReducerInterface,
  state: ReduxStateWithUndoRedo,
  action: PayloadAction<DomainAncillaryOrReplayableActionWithDeployment>,
): ReduxStateWithUndoRedo {
  const { previousModelSnapshot, pastModelPatches, presentModelSnapshot, futureModelPatches } = state;
  // because of asyncDispatchMiddleware. to clean up so that asyncDispatchMiddleware does not modify actions that can be replayed!

  const newPresentModelSnapshot:LocalCacheSliceState = produce(
    state.presentModelSnapshot,
    (draftState:LocalCacheSliceState)=>innerReducer(draftState, action),
  );
  return {
    previousModelSnapshot,
    pastModelPatches: pastModelPatches,
    presentModelSnapshot: newPresentModelSnapshot,
    futureModelPatches: futureModelPatches,
    queriesResultsCache: {},
  };
};

// ####################################################################################################
/** decorates passed reducer with undo/redo capabilities, then call it straightaway with given state and action */
export function createUndoRedoReducer(
  innerReducer:InnerReducerInterface
):ReduxReducerWithUndoRedoInterface
{
  // Returns a reducer function, that handles undo and redo
  return (
    state:ReduxStateWithUndoRedo = reduxStoreWithUndoRedoGetInitialState(innerReducer), 
    action:PayloadAction<DomainAncillaryOrReplayableActionWithDeployment>
  ): ReduxStateWithUndoRedo => {
    const { previousModelSnapshot, pastModelPatches, presentModelSnapshot, futureModelPatches,    queriesResultsCache } = state

    switch (action.type) {
      case localCacheSliceName+'/'+RemoteStoreRestSagaInputActionNamesObject.handleRemoteStoreRestCRUDAction: // TODO: here?
      case RemoteStoreRestSagaInputActionNamesObject.handleRemoteStoreRestCRUDAction + '/resolved': // TODO: here?
      case RemoteStoreRestSagaInputActionNamesObject.handleRemoteStoreRestCRUDAction: {
        // log.info('UndoRedoReducer handleRemoteStoreCRUDAction', action)
        return callNextReducer(innerReducer, state, action);
      }
      case localCacheSliceName+'/'+localCacheSliceInputActionNamesObject.handleLocalCacheDomainAction: {
        // log.info('UndoRedoReducer localCacheSliceInputActionNamesObject.handleLocalCacheDomainAction with actionType',action.payload.domainAction.actionType,'for action', action);
        switch (action.payload.domainAction.actionType) {
          case "DomainDataAction": {
            if (CRUDActionNamesArrayString.includes(action.payload.domainAction.actionName)) {
              return callNextReducer(innerReducer, state, {
                type:action.type,
                payload: {
                  deploymentUuid: action.payload.deploymentUuid,
                  domainAction:{
                  actionName:action.payload.domainAction.actionName,
                  actionType:"DomainDataAction",
                  objects: action.payload.domainAction.objects
                }}
              });
            } else {
              // TODO: raise exception?
              log.warn('UndoRedoReducer handleLocalCacheDomainAction action not recognized', action)
            }
            break;
          }
          case "DomainTransactionalAction": {
            switch (action.payload.domainAction.actionName) {
              case 'rollback':
              case 'replaceLocalCache': {
                const next = callNextReducer(innerReducer, state, action)
                return {
                  previousModelSnapshot, //TODO: effectively set previousModelSnapshot
                  pastModelPatches: [],
                  presentModelSnapshot: next.presentModelSnapshot,
                  futureModelPatches: [],
                  queriesResultsCache,
                }
              }
              case 'commit': {
                // no effect on local storage contents, just clears the present transaction contents.
                return {
                  previousModelSnapshot: presentModelSnapshot, //TODO: presentModelSnapshot becomes previousModelSnapshot?
                  pastModelPatches: [],
                  presentModelSnapshot: presentModelSnapshot,
                  futureModelPatches: [],
                  queriesResultsCache,
                }
              }
              case 'undo': {
                if (pastModelPatches.length > 0) {
                  const newPast = pastModelPatches.slice(0, pastModelPatches.length - 1)
                  const newPresentSnapshot = applyPatches(presentModelSnapshot,pastModelPatches[pastModelPatches.length-1].inverseChanges)
                  log.info('UndoRedoReducer localCacheSliceInputActionNamesObject.handleLocalCacheModelAction undo patches',pastModelPatches,'undo',pastModelPatches[0],pastModelPatches[1])
                  return {
                    previousModelSnapshot,
                    pastModelPatches: newPast,
                    presentModelSnapshot: newPresentSnapshot,
                    futureModelPatches: [pastModelPatches[pastModelPatches.length - 1], ...futureModelPatches],
                    queriesResultsCache,
                  }
                } else {
                  // do nothing
                  log.warn('UndoRedoReducer localCacheSliceInputActionNamesObject.handleLocalCacheModelAction cannot further undo, ignoring undo action')
                  return {
                    previousModelSnapshot,
                    pastModelPatches,
                    presentModelSnapshot,
                    futureModelPatches,
                    queriesResultsCache,
                  }
                }
              }
              case 'redo': {
                if (futureModelPatches.length > 0) {
                  const newPastPatches = futureModelPatches[0];
                  const newFuturePatches = futureModelPatches.slice(1);
                  const newPresentSnapshot = applyPatches(presentModelSnapshot,newPastPatches.changes);
                  return {
                    previousModelSnapshot,
                    pastModelPatches: [...pastModelPatches, newPastPatches],
                    presentModelSnapshot: newPresentSnapshot,
                    futureModelPatches: newFuturePatches,
                    queriesResultsCache,
                  };
                } else {
                  // do nothing
                  log.warn('UndoRedoReducer localCacheSliceInputActionNamesObject.handleLocalCacheModelAction cannot further redo, ignoring redo action')
                  return {
                    previousModelSnapshot,
                    pastModelPatches,
                    presentModelSnapshot,
                    futureModelPatches,
                    queriesResultsCache,
                  }
                }
                break;
              }
              default: // TODO: explicitly handle DomainModelEntityUpdateActions by using their actionName!
                // log.warn('UndoRedoReducer handleLocalCacheDomainAction default case for DomainTransactionalAction action.payload.actionName', action.payload.domainAction.actionName, action);
                return callNextReducerWithUndoRedo(innerReducer, state, action as PayloadAction<DomainAncillaryOrReplayableActionWithDeployment>)
            }
            break;
          }
          default: {
            log.error('UndoRedoReducer handleLocalCacheDomainAction default case for action', action);
            break;
          }
        }
        break;
      }
      default: {
        // log.warn('UndoRedoReducer default handling action',action)
        return callNextReducer(innerReducer, state, action)
      }
    }
    log.error('UndoRedoReducer out of switch handling action', action);
    return callNextReducer(innerReducer, state, action);
  }
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
