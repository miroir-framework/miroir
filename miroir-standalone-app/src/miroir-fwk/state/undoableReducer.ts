import produce, { enablePatches } from "immer";
enablePatches()

/**
 * This reducer wraps a "plain" reducer, enhancing it with undo/redo capabilities.
 * It is however not "pure" or "clean", in the sense that it requires the inner 
 * reducer to provide a list of actions for which the undo/redo capability should
 * be added (provided via @makeActionUpdatesUndoable).
 * Adding the capability by default could induce a high memory/cpu footprint, which
 * is deemed inapropriate in the general case.
 * 
 */

export type ReducerType = (state:any, action:any) => any

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

export function createUndoableReducer(reducer:(state:any, action:any)=>void) {
  // Call the reducer with empty action to populate the initial state
  const initialState:any = {
    previousSnapshot: {},
    pastPatches: [],
    presentSnapshot: reducer(undefined, {}),
    futurePatches: []
  }

  /** decorates passed reducer with undo/redo capabilities, then call it straightaway with given state and action */
  const callUndoRedoReducer = (reducer:(state:any, action:any)=>void,state:any, action:any):void => {
    let changes:any[] = []
    let inverseChanges:any[] = []
    // console.log('callUndoRedoReducer', action.type, JSON.stringify(state), action)
    const newState:any = produce(
      state,
      (draftState:any)=>reducer(draftState, action),
      (patches, inversePatches) => {
        //scope extrusion :-/
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

  const callNextReducer = (state:any, action:any):any => {
    const { previousSnapshot, pastPatches, presentSnapshot, futurePatches } = state;
    // because of asyncDispatchMiddleware. to clean up so that asyncDispatchMiddleware does not modify actions that can be replayed!
    // let cleanAction = Object.assign({},action);
    // delete cleanAction['asyncDispatch'];
    // const newPresentSnapshot = reducer(presentSnapshot, action)
    const newPresentSnapshot:any = callUndoRedoReducer(reducer,presentSnapshot, action)
    if (presentSnapshot === newPresentSnapshot) {
      return state
    } else {
      return {
        previousSnapshot: previousSnapshot,
        pastPatches: newPresentSnapshot['patches']?[...pastPatches, newPresentSnapshot['patches']]:pastPatches,
        presentSnapshot: newPresentSnapshot,
        futurePatches: []
      }
    }
  }


  // Returns a reducer function, that handles undo and redo
  return function (state = initialState, action:any) {
    const { previousSnapshot, pastPatches, presentSnapshot, futurePatches } = state

    if (!TRANSACTIONS_ENABLED) {
      return callNextReducer(state, action)
    } else {
      switch (action.type) {
        case 'UNDO':
          const newPast = pastPatches.slice(0, pastPatches.length - 1)
          const previousState = newPast.reduce((curr:any,acc:any)=>reducer(acc,curr), previousSnapshot)
          return {
            pastPatches: newPast,
            presentSnapshot: previousState,
            futurePatches: [pastPatches[pastPatches.length - 1], ...futurePatches]
          }
        case 'REDO':
          const newPastPatches = futurePatches[0]
          const newFuturePatches = futurePatches.slice(1)
          const newPresentSnapshot = reducer(presentSnapshot, newPastPatches)
          return {
            pastPatches: [...pastPatches, newPastPatches],
            presentSnapshot: newPresentSnapshot,
            futurePatches: newFuturePatches
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