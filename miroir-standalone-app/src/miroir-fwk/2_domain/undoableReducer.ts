import { Store } from "@reduxjs/toolkit";
import produce, { enablePatches } from "immer";
import { InnerReducerInterface, InnerStoreStateInterface } from "src/miroir-fwk/4_storage/local/MReduxStore";
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

export type storageKind = 'browser-IndexedDb' | 'sqlite' | 'postgres' | 'mongodb';
export type DeploymentModes = 'local' | 'remote';
export type cacheInvalidationPolicy = 'routing' | 'never';
export type cacheFetchPolicy = 'onDemand' |'routing' | 'never' | 'periodic';
export type undoRedoHistorization = 'actions' |'snapshot' | 'never' | 'periodic'; // what does it make sense for? An Entity?

// /**
//  * The snapshot type, declaring the global structure of the redux store.
//  * The format is given in store.ts, when assigning staticReducers.
//  */
// export interface MmodelSnapshot {
//   miroirEntities: any;
//   miroirInstances: any;
// };


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
export interface MreduxWithUndoRedoState {
  // dataCache: any; // the cache of data not impacted by commit / rollback / undo / redo.
  previousModelSnapshot: InnerStoreStateInterface, // state recorded on the previous commit.
  pastModelPatches: any[], // list of effects achieved on the previousSnapshot, to reach the presentSnapshot
  presentModelSnapshot: InnerStoreStateInterface, // only effects on the current snapshot goes into the undo/redo history
  futureModelPatches: any[], // in case an undo has been performed, the list of effects to be achieved to reach the latest state again
}

// TODO: make action type explicit!
export type MreduxWithUndoRedoReducer = (state:MreduxWithUndoRedoState, action:any) => MreduxWithUndoRedoState
export type MreduxWithUndoRedoStore = Store<MreduxWithUndoRedoState, any>;

const TRANSACTIONS_ENABLED: boolean = true;

const forgetHistoryActionsTypes: string[] = [
  // refresh from database restores the current local state to the one found in the database. All local changes are cancelled.
  // mInstanceSliceActionNames.entityInstancesRefreshed
];
const undoableSliceUpdateActionsTypes: string[] = [
  // the action to be reduced will update a substancial part of the instances in the slice. The whole slice state is saved to be undoable.
];
const undoableInstanceUpdateActionsTypes: string[] = [
  // the action to be reduced will update very minor part of the instances in the slice. The action is saved, to be replayed from the last consolidated state in history, in case an undo is required.
];

export const makeActionUpdatesUndoable = (action:string) => {
  undoableSliceUpdateActionsTypes.push(action);
}


export function mReduxWithUndoRedoGetInitialState(reducer:any):MreduxWithUndoRedoState {
  return {
    // dataCache:{},
    previousModelSnapshot: {} as InnerStoreStateInterface,
    pastModelPatches: [],
    presentModelSnapshot: reducer(undefined, {type:undefined, payload: undefined}),
    futureModelPatches: []
  }
}


export function createUndoableReducer(
  reducer:InnerReducerInterface
  // reducer:(state:MReduxStateWithUndoRedo, action:any)=>void
):MreduxWithUndoRedoReducer
{
  // Call the reducer with empty action to populate the initial state

  /** decorates passed reducer with undo/redo capabilities, then call it straightaway with given state and action */
  const callUndoRedoReducer = (
    reducer:InnerReducerInterface,
    state:InnerStoreStateInterface,
    action:any
  ):InnerStoreStateInterface => {
  // const callUndoRedoReducer = (reducer:(state:MReduxStateWithUndoRedo, action:any)=>void,state:MReduxStateWithUndoRedo, action:any):void => {
    let changes:any[] = []
    let inverseChanges:any[] = []
    // console.log('callUndoRedoReducer', action.type, JSON.stringify(state), action)
    const newState:InnerStoreStateInterface = produce(
      state,
      (draftState:any)=>reducer(draftState, action),
      (patches, inversePatches) => {
        // side effect, for scope extrusion :-/
        changes.push(...patches)
        inverseChanges.push(...inversePatches)
      }
    );
    if (undoableSliceUpdateActionsTypes.includes(action.type)) {
      const newStateWithPatches:any = produce(
        newState,
        (draftState:any)=>{
          draftState['patches'] = changes;
          draftState['inversePatches'] = inverseChanges;
        },
      );
      console.log('callUndoRedoReducer', action.type, 'newStateWithPatches', JSON.stringify(newStateWithPatches), action,changes,inverseChanges)
      return newStateWithPatches;
    } else {
      // console.log('callUndoRedoReducer not undoable', action.type, 'newState', JSON.stringify(newState), action,changes,inverseChanges)
      return newState;
    }
  }

  const callNextReducer = (state:MreduxWithUndoRedoState, action:any):MreduxWithUndoRedoState => {
    // const { dataCache, previousModelSnapshot, pastModelPatches, presentModelSnapshot, futureModelPatches } = state;
    const { previousModelSnapshot, pastModelPatches, presentModelSnapshot, futureModelPatches } = state;
    // because of asyncDispatchMiddleware. to clean up so that asyncDispatchMiddleware does not modify actions that can be replayed!
    const newPresentSnapshot:any = callUndoRedoReducer(reducer,presentModelSnapshot, action)
    if (presentModelSnapshot === newPresentSnapshot) {
      return state
    } else {
      return {
        // dataCache,
        previousModelSnapshot,
        pastModelPatches: newPresentSnapshot['patches']?[...pastModelPatches, newPresentSnapshot['patches']]:pastModelPatches,
        presentModelSnapshot: newPresentSnapshot,
        futureModelPatches: []
      }
    }
  };


  // Returns a reducer function, that handles undo and redo
  return (state:MreduxWithUndoRedoState = mReduxWithUndoRedoGetInitialState(reducer), action:any):MreduxWithUndoRedoState => {
    const { previousModelSnapshot, pastModelPatches, presentModelSnapshot, futureModelPatches } = state

    if (!TRANSACTIONS_ENABLED) {
      return callNextReducer(state, action)
    } else {
      switch (action.type) {
        case 'UNDO':
          const newPast = pastModelPatches.slice(0, pastModelPatches.length - 1)
          const previousState = newPast.reduce((curr:any,acc:any)=>reducer(acc,curr), previousModelSnapshot)
          return {
            previousModelSnapshot,
            pastModelPatches: newPast,
            presentModelSnapshot: previousState,
            futureModelPatches: [pastModelPatches[pastModelPatches.length - 1], ...futureModelPatches]
          }
        case 'REDO':
          const newPastPatches = futureModelPatches[0]
          const newFuturePatches = futureModelPatches.slice(1)
          const newPresentSnapshot = reducer(presentModelSnapshot, newPastPatches)
          return {
            previousModelSnapshot,
            pastModelPatches: [...pastModelPatches, newPastPatches],
            presentModelSnapshot: newPresentSnapshot,
            futureModelPatches: newFuturePatches
          }
        case 'ROLLBACK':
        case 'COMMIT':
        default:
          return callNextReducer(state, action)
          // Delegate handling the action to the passed reducer
      }
    }
  }
}