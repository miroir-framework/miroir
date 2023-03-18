import { PayloadAction, Store } from "@reduxjs/toolkit";
import produce, { applyPatches, enablePatches, Patch } from "immer";

import {
  CRUDActionNamesArrayString,
  CUDActionName,
  CUDActionNamesArray, DomainAction, DomainModelAction, EntityDefinition,
  InstanceCollection,
  ModelStructureUpdateActionNamesObject
} from "miroir-core";
import { localCacheSliceInputActionNamesObject, localCacheSliceName, LocalCacheSliceState } from "src/4_services/localStore/LocalCacheSlice";
import { RemoteStoreRestSagaInputActionNamesObject } from "src/4_services/remoteStore/RemoteStoreRestAccessSaga";
enablePatches(); // to gather undo/redo operation history

/**
 * This reducer wraps a "plain" reducer, enhancing it with undo/redo capabilities.
 * It is however not "pure" or "clean", in the sense that it requires the inner 
 * reducer to provide a list of actions for which the undo/redo capability should
 * be added (provided via @makeActionUpdatesUndoable).
 * Adding the capability by default could induce a high memory/cpu footprint, which
 * is deemed inapropriate in the general case.
 * 
 */

export interface InnerStoreStateInterface {
  // miroirEntities: EntityState<EntityDefinition>;
  miroirInstances: LocalCacheSliceState;
}

export interface ReduxStateChanges {
  // action:PayloadAction<DomainDataAction|DomainModelAction>, changes:Patch[]; inverseChanges:Patch[];
  // action:PayloadAction<DomainModelAction>, changes:Patch[]; inverseChanges:Patch[];
  action:DomainModelAction, changes:Patch[]; inverseChanges:Patch[];
}
/**
 * In the case of a remote deployment, the whole state goes into the indexedDb.
 * the cache and presentSnapshot then give the local view of the client on the
 * global state that is stored in the data store.
 * In the case of a local deployment, the local state goes in the indexedDb also,
 * although any effect goes to the API to the server, and is performed on the datastore,
 * making the presentState always equal to the datastore state. The cache is
 * also empty (?) or the invalidation policy is automatically altered to 'routing',
 * meaning that any piece of data in the cache can be purged on every page change.
 * In the case of a local deployment, the indexedDb is also used to store information
 * that is not kept in the datastore: the previousSnapshot, the pastPatches and futurePatches.
 * 
 */
export interface ReduxStateWithUndoRedo {
  // dataCache: any; // the cache of data not impacted by commit / rollback / undo / redo.
  previousModelSnapshot: InnerStoreStateInterface, // state recorded on the previous commit.
  pastModelPatches: ReduxStateChanges[], // list of effects achieved on the previousSnapshot, to reach the presentSnapshot
  presentModelSnapshot: InnerStoreStateInterface, // only effects on the current snapshot goes into the undo/redo history
  futureModelPatches: ReduxStateChanges[], // in case an undo has been performed, the list of effects to be achieved to reach the latest state again
}

export type InnerReducerInterface = (state: InnerStoreStateInterface, action:PayloadAction<DomainAction>) => InnerStoreStateInterface;

// TODO: make action type explicit!
export type ReduxReducerWithUndoRedoInterface = (state:ReduxStateWithUndoRedo, action:PayloadAction<DomainAction>) => ReduxStateWithUndoRedo
export type ReduxStoreWithUndoRedo = Store<ReduxStateWithUndoRedo, any>;

const TRANSACTIONS_ENABLED: boolean = true;

const forgetHistoryActionsTypes: string[] = [
  // refresh from database restores the current local state to the one found in the database. All local changes are cancelled.
  // mInstanceSliceActionNames.entityInstancesRefreshed
];
const undoableSliceUpdateActions: {type:string,actionName:string}[] =
  // the action to be reduced will update a substancial part of the instances in the slice. The whole slice state is saved to be undoable.
    (CUDActionNamesArray as string[]).concat([ModelStructureUpdateActionNamesObject.updateModel]).map(
    a => ({
      // type: localCacheSliceName + '/' + localCacheSliceInputActionNamesOb#ject.handleLocalCacheModelAction,
      type: localCacheSliceName + '/' + localCacheSliceInputActionNamesObject.handleLocalCacheAction,
      actionName: a
    })
  )
;

export type MinstanceAction = PayloadAction<InstanceCollection,string>;
export type MentityAction = PayloadAction<EntityDefinition[],string>;

export type Maction = MinstanceAction | MentityAction;


// export const makeActionUpdatesUndoable = (action:string) => {
//   undoableSliceUpdateActions.push(action.type);
// }


export function reduxStoreWithUndoRedoGetInitialState(reducer:any):ReduxStateWithUndoRedo {
  return {
    previousModelSnapshot: {} as InnerStoreStateInterface,
    pastModelPatches: [],
    presentModelSnapshot: reducer(undefined, {type:undefined, payload: undefined}),
    futureModelPatches: []
  }
}

// ####################################################################################################
function callUndoRedoReducer(
  reducer:InnerReducerInterface,
  state:InnerStoreStateInterface,
  action:PayloadAction<DomainModelAction>
):{newSnapshot:InnerStoreStateInterface,changes: Patch[],inverseChanges:Patch[]} {
  console.log('callUndoRedoReducer called with action', action, 'state', state);
  let changes:Patch[] = [];
  let inverseChanges:Patch[] = [];
  const newPresentModelSnapshot:InnerStoreStateInterface = produce(
    state,
    (draftState:InnerStoreStateInterface)=>reducer(draftState, action),
    (patches, inversePatches) => {
      // side effect, for scope extrusion :-/
      changes.push(...patches)
      inverseChanges.push(...inversePatches)
    }
  );
  if (undoableSliceUpdateActions.some((item)=>item.type == action?.type && item.actionName == action?.payload?.actionName)) {
    // TODO: test can probably be removed, sorting of undoable actions is done before reaching this point
    return {newSnapshot:newPresentModelSnapshot, changes: changes, inverseChanges: inverseChanges};
  } else {
    console.warn('callUndoRedoReducer not undoable action type', action.type, 'action name',action.payload.actionName, 'action', action.payload,'changes',changes,'inverseChanges',inverseChanges)
    console.warn('newPresentModelSnapshot', JSON.stringify(newPresentModelSnapshot))
    return {newSnapshot:newPresentModelSnapshot, changes: [], inverseChanges: []};
  }
}

  // ####################################################################################################
  const callNextReducerWithUndoRedo = (
    innerReducer:InnerReducerInterface,
    state: ReduxStateWithUndoRedo,
    action: PayloadAction<DomainModelAction>,
  ): ReduxStateWithUndoRedo => {
    const { previousModelSnapshot, pastModelPatches, presentModelSnapshot, futureModelPatches } = state;

    const { newSnapshot, changes, inverseChanges } = callUndoRedoReducer(innerReducer, presentModelSnapshot, action);
    if (presentModelSnapshot === newSnapshot) {
      return state;
    } else { // presentModelSnapshot !== newSnapshot
      const newPatch:ReduxStateChanges = { action:action.payload, changes, inverseChanges };


      console.log('callNextReducerWithUndoRedo for', action.type, action.payload.actionType, action.payload.actionName,'adding Patch to transaction', newPatch);
      
      return {
        previousModelSnapshot,
        pastModelPatches:
          changes.length > 0 ? [...pastModelPatches, newPatch] : pastModelPatches,
        presentModelSnapshot: newSnapshot,
        futureModelPatches: [],
      };
    }
  };

// ####################################################################################################
function callNextReducer(
  innerReducer:InnerReducerInterface,
  state: ReduxStateWithUndoRedo,
  action: PayloadAction<DomainAction>,
): ReduxStateWithUndoRedo {
  const { previousModelSnapshot, pastModelPatches, presentModelSnapshot, futureModelPatches } = state;
  // because of asyncDispatchMiddleware. to clean up so that asyncDispatchMiddleware does not modify actions that can be replayed!

  const newPresentModelSnapshot:InnerStoreStateInterface = produce(
    state.presentModelSnapshot,
    (draftState:InnerStoreStateInterface)=>innerReducer(draftState, action),
  );
  return {
    previousModelSnapshot,
    pastModelPatches: pastModelPatches,
    presentModelSnapshot: newPresentModelSnapshot,
    futureModelPatches: futureModelPatches,
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
    action:PayloadAction<DomainAction>
  ): ReduxStateWithUndoRedo => {
    const { previousModelSnapshot, pastModelPatches, presentModelSnapshot, futureModelPatches } = state

    switch (action.type) {
      case localCacheSliceName+'/'+RemoteStoreRestSagaInputActionNamesObject.handleRemoteStoreCRUDAction: // TODO: here?
      case RemoteStoreRestSagaInputActionNamesObject.handleRemoteStoreCRUDAction + '/resolved': // TODO: here?
      case RemoteStoreRestSagaInputActionNamesObject.handleRemoteStoreCRUDAction: {
        console.log('UndoRedoReducer handleRemoteStoreCRUDAction', action)
        return callNextReducer(innerReducer, state, action);
      }
      case localCacheSliceName+'/'+localCacheSliceInputActionNamesObject.handleLocalCacheAction: {
        console.log('UndoRedoReducer localCacheSliceInputActionNamesObject.handleLocalCacheAction with actionType',action.payload.actionType,'for action', action);
        switch (action.payload.actionType) {
          case "DomainDataAction":{
            // return callNextLocalCacheDataReducer(innerReducer, state, action as PayloadAction<DomainDataAction>)
            if (CRUDActionNamesArrayString.includes(action.payload.actionName)) {
              return callNextReducer(innerReducer, state, {
                type:action.type,
                payload: {
                  actionName:action.payload.actionName as CUDActionName,
                  actionType:"DomainDataAction",
                  objects: action.payload.objects
                }
              });
            } else {
              // TODO: raise exception?
              console.warn('UndoRedoReducer handleLocalCacheAction action not recognized', action)
            }
            break;
          }
          case "DomainModelAction": {
            switch (action.payload.actionName) {
              case 'replace': {
                const next = callNextReducer(innerReducer, state, action as PayloadAction<DomainModelAction>)
                return {
                  // dataCache,
                  previousModelSnapshot, //TODO: effectively set previousModelSnapshot
                  pastModelPatches: [],
                  presentModelSnapshot: next.presentModelSnapshot,
                  futureModelPatches: []
                }
              }
              case 'commit': {
                // no effect on local storage contents, just clears the present transaction contents.
                return {
                  previousModelSnapshot: state.presentModelSnapshot, //TODO: presentModelSnapshot becomes previousModelSnapshot?
                  pastModelPatches: [],
                  presentModelSnapshot: state.presentModelSnapshot,
                  futureModelPatches: []
                }
              }
              case 'undo': {
                if (pastModelPatches.length > 0) {
                  const newPast = pastModelPatches.slice(0, pastModelPatches.length - 1)
                  // const previousState = newPast.reduce((curr:any,acc:any)=>innerReducer(acc,curr), previousModelSnapshot)
                  const newPresentSnapshot = applyPatches(presentModelSnapshot,pastModelPatches[pastModelPatches.length-1].inverseChanges)
                  console.log('UndoRedoReducer localCacheSliceInputActionNamesObject.handleLocalCacheModelAction undo patches',pastModelPatches,'undo',pastModelPatches[0],pastModelPatches[1])
                  return {
                    previousModelSnapshot,
                    pastModelPatches: newPast,
                    presentModelSnapshot: newPresentSnapshot,
                    futureModelPatches: [pastModelPatches[pastModelPatches.length - 1], ...futureModelPatches]
                  }
                } else {
                  // do nothing
                  console.warn('UndoRedoReducer localCacheSliceInputActionNamesObject.handleLocalCacheModelAction cannot further undo, ignoring undo action')
                  return {
                    previousModelSnapshot,
                    pastModelPatches,
                    presentModelSnapshot,
                    futureModelPatches
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
                  };
                } else {
                  // do nothing
                  console.warn('UndoRedoReducer localCacheSliceInputActionNamesObject.handleLocalCacheModelAction cannot further redo, ignoring redo action')
                  return {
                    previousModelSnapshot,
                    pastModelPatches,
                    presentModelSnapshot,
                    futureModelPatches
                  }
                }
                break;
              }
              default:
                console.warn('UndoRedoReducer handleLocalCacheAction default case for DomainModelAction action.payload.actionName', action.payload.actionName, action);
                return callNextReducerWithUndoRedo(innerReducer, state, action as PayloadAction<DomainModelAction>)
            }
            break;
          }
          default: {
            console.error('UndoRedoReducer handleLocalCacheAction default case for action', action);
            // return callNextReducerWithUndoRedo(innerReducer, state, action as PayloadAction<DomainModelAction>)
            break;
          }
        }
        break;
      }
      default: {
        console.warn('UndoRedoReducer default handling action',action)
        return callNextReducer(innerReducer, state, action as PayloadAction<DomainModelAction>)
      }
    }
  }
}