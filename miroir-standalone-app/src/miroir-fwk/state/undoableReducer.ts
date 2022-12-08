import { any } from "prop-types";
import { RootState } from "./store";

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

export function undoableReducer(reducer:(state:RootState, action:any)=>void) {
  // Call the reducer with empty action to populate the initial state
  const initialState:any = {
    previousSnapshot: {},
    pastEvents: [],
    presentSnapshot: reducer(undefined, {}),
    futureEvents: []
  }

  const callNextReducer =(state:any, action:any):any => {
    const { previousSnapshot, pastEvents, presentSnapshot, futureEvents } = state
    const newPresentSnapshot = reducer(presentSnapshot, action)
    if (presentSnapshot === newPresentSnapshot) {
      return state
    } else {
      return {
        previousSnapshot: previousSnapshot,
        pastEvents: [...pastEvents, action],
        present: newPresentSnapshot,
        futureEvents: []
      }
    }
  }

  // Return a reducer that handles undo and redo
  return function (state = initialState, action:any) {
    const { previousSnapshot, pastEvents, presentSnapshot, futureEvents } = state

    if (!TRANSACTIONS_ENABLED) {
      return callNextReducer(state, action)
    } else {
      switch (action.type) {
        case 'UNDO':
          const newPast = pastEvents.slice(0, pastEvents.length - 1)
          const previous = newPast.reduce((curr:any,acc:any)=>reducer(acc,curr), previousSnapshot)
          return {
            pastEvents: newPast,
            presentState: previous,
            futureEvents: [pastEvents[pastEvents.length - 1], ...futureEvents]
          }
        case 'REDO':
          const newPastEvent = futureEvents[0]
          const newFutureEvents = futureEvents.slice(1)
          const newPresentSnapshot = reducer(presentSnapshot, newPastEvent)
          return {
            pastEvents: [...pastEvents, newPastEvent],
            presentState: newPresentSnapshot,
            futureEvents: newFutureEvents
          }
        default:
          return callNextReducer(state, action)
          // Delegate handling the action to the passed reducer
      }
    }
  }
}