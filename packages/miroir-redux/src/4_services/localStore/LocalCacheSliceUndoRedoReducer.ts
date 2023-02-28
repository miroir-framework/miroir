import { PayloadAction, Store } from "@reduxjs/toolkit";
import produce, { enablePatches, Patch } from "immer";

import { domainActionNamesObject, EntityDefinition, InstanceCollection, LocalCacheAction } from "miroir-core";
import { localCacheSliceInputActionNamesObject, localCacheSliceName, LocalCacheSliceState } from "src/4_services/localStore/LocalCacheSlice";
import { RemoteStoreSagaInputActionNamesArray, RemoteStoreSagaInputActionNamesObject } from "src/4_services/remoteStore/RemoteStoreAccessSaga";
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
  action:PayloadAction<LocalCacheAction>, changes:Patch[]; inverseChanges:Patch[];
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

export type InnerReducerInterface = (state: InnerStoreStateInterface, action:PayloadAction<LocalCacheAction>) => InnerStoreStateInterface;

// TODO: make action type explicit!
export type ReduxReducerWithUndoRedoInterface = (state:ReduxStateWithUndoRedo, action:PayloadAction<LocalCacheAction>) => ReduxStateWithUndoRedo
export type ReduxStoreWithUndoRedo = Store<ReduxStateWithUndoRedo, any>;

const TRANSACTIONS_ENABLED: boolean = true;

const forgetHistoryActionsTypes: string[] = [
  // refresh from database restores the current local state to the one found in the database. All local changes are cancelled.
  // mInstanceSliceActionNames.entityInstancesRefreshed
];
const undoableSliceUpdateActions: {type:string,actionName:string}[] =
  // the action to be reduced will update a substancial part of the instances in the slice. The whole slice state is saved to be undoable.
  [
    domainActionNamesObject.create,
    domainActionNamesObject.delete,
    domainActionNamesObject.update,
  ].map(a => ({
        type: localCacheSliceName + '/' + localCacheSliceInputActionNamesObject.handleLocalCacheAction,
        actionName: a
      })
    )
;
const undoableInstanceUpdateActionsTypes: string[] = [
  // the action to be reduced will update very minor part of the instances in the slice. The action is saved, to be replayed from the last consolidated state in history, in case an undo is required.
];

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
// ####################################################################################################
// ####################################################################################################
export function createUndoRedoReducer(
  innerReducer:InnerReducerInterface
  // reducer:(state:MReduxStateWithUndoRedo, action:any)=>void
):ReduxReducerWithUndoRedoInterface
{
  // Call the reducer with empty action to populate the initial state

  // ####################################################################################################
  /** decorates passed reducer with undo/redo capabilities, then call it straightaway with given state and action */
  const callUndoRedoReducer:(
    reducer:InnerReducerInterface,
    state:InnerStoreStateInterface,
    action:PayloadAction<LocalCacheAction>
  ) => {newSnapshot:InnerStoreStateInterface,changes: Patch[],inverseChanges:Patch[]} = (
    reducer:InnerReducerInterface,
    state:InnerStoreStateInterface,
    action:PayloadAction<LocalCacheAction>
  ):{newSnapshot:InnerStoreStateInterface,changes: Patch[],inverseChanges:Patch[]} => {
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
      return {newSnapshot:newPresentModelSnapshot, changes: changes, inverseChanges: inverseChanges};
    } else {
      // console.log('callUndoRedoReducer not undoable', action.type, 'newState', JSON.stringify(newState), action,changes,inverseChanges)
      return {newSnapshot:newPresentModelSnapshot, changes: [], inverseChanges: []};
    }
  }

  // ####################################################################################################
  const callNextReducer = (
    state: ReduxStateWithUndoRedo,
    action: PayloadAction<LocalCacheAction>,
    updateUndoRedo: boolean = true,
  ): ReduxStateWithUndoRedo => {
    const { previousModelSnapshot, pastModelPatches, presentModelSnapshot, futureModelPatches } = state;
    // because of asyncDispatchMiddleware. to clean up so that asyncDispatchMiddleware does not modify actions that can be replayed!
    const { newSnapshot, changes, inverseChanges } = callUndoRedoReducer(innerReducer, presentModelSnapshot, action);
    if (presentModelSnapshot === newSnapshot) {
      return state;
    } else {
      return {
        // dataCache,
        previousModelSnapshot,
        pastModelPatches:
          changes.length > 0 ? [...pastModelPatches, { action, changes, inverseChanges }] : pastModelPatches,
        presentModelSnapshot: newSnapshot,
        futureModelPatches: [],
      };
    }
  };


  // Returns a reducer function, that handles undo and redo
  return (
    state:ReduxStateWithUndoRedo = reduxStoreWithUndoRedoGetInitialState(innerReducer), 
    action:PayloadAction<LocalCacheAction>
  ): ReduxStateWithUndoRedo => {
    const { previousModelSnapshot, pastModelPatches, presentModelSnapshot, futureModelPatches } = state

    if (!TRANSACTIONS_ENABLED) {
      return callNextReducer(state, action)
    } else {
      switch (action.type) {
        case 'UNDO':
          const newPast = pastModelPatches.slice(0, pastModelPatches.length - 1)
          const previousState = newPast.reduce((curr:any,acc:any)=>innerReducer(acc,curr), previousModelSnapshot)
          return {
            previousModelSnapshot,
            pastModelPatches: newPast,
            presentModelSnapshot: previousState,
            futureModelPatches: [pastModelPatches[pastModelPatches.length - 1], ...futureModelPatches]
          }
        case 'REDO':
          const newPastPatches = futureModelPatches[0]
          const newFuturePatches = futureModelPatches.slice(1)
          const newPresentSnapshot = innerReducer(presentModelSnapshot, newPastPatches.action)
          return {
            previousModelSnapshot,
            pastModelPatches: [...pastModelPatches, newPastPatches],
            presentModelSnapshot: newPresentSnapshot,
            futureModelPatches: newFuturePatches,
          };
        case 'ROLLBACK': // TODO: here?
        case localCacheSliceName+'/'+RemoteStoreSagaInputActionNamesObject.handleRemoteStoreAction: // TODO: here?
        console.log('UndoRedoReducer localCacheSliceInputActionNamesObject.handleRemoteStoreAction', action)
        const newPresentModelSnapshot:InnerStoreStateInterface = produce(
            state.presentModelSnapshot,
            (draftState:InnerStoreStateInterface)=>innerReducer(draftState, action),
          );
          // innerReducer(state.presentModelSnapshot, action);
          return {
            previousModelSnapshot,
            pastModelPatches: pastModelPatches,
            presentModelSnapshot: newPresentModelSnapshot,
            futureModelPatches: newFuturePatches,
          };;
        case localCacheSliceName+'/'+localCacheSliceInputActionNamesObject.handleLocalCacheAction: // TODO: here?
          console.log('UndoRedoReducer localCacheSliceInputActionNamesObject.handleLocalCacheAction', action)
          if (action.payload.actionName == 'replace') {
            const next = callNextReducer(state, action)
            return {
              // dataCache,
              previousModelSnapshot, //TODO: effectively set previousModelSnapshot
              pastModelPatches: [],
              presentModelSnapshot: next.presentModelSnapshot,
              futureModelPatches: []
            }
          } else if (action.payload.actionName == 'commit') {
            // no effect on local storage contents, just clears the present transaction contents.
            return {
              previousModelSnapshot: state.presentModelSnapshot, //TODO: presentModelSnapshot becomes previousModelSnapshot?
              pastModelPatches: [],
              presentModelSnapshot: state.presentModelSnapshot,
              futureModelPatches: []
            }
          } else {
            return callNextReducer(state, action)
          }
          // break;
        case 'COMMIT': // TODO: here?
        default:
          console.log('UndoRedoReducer default handling action',action)
          return callNextReducer(state, action)
          // Delegate handling the action to the passed reducer
      }
    }
  }
}