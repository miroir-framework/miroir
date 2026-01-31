/**
 * Zustand store with undo/redo capabilities using Immer patches.
 */
import { enablePatches, produce, Patch, applyPatches } from "immer";
import { createStore, StoreApi } from "zustand/vanilla";

import {
  Commit,
  LocalCacheAction,
  LoggerInterface,
  MiroirLoggerFactory,
  ModelActionReplayableAction,
  TransactionalInstanceAction,
  type ApplicationDeploymentMap,
} from "miroir-core";

import {
  LocalCacheSliceState,
  StateChanges,
  ZustandStateWithUndoRedo,
} from "./localCacheZustandInterface.js";
import { handleLocalCacheAction } from "./LocalCacheSlice.js";

// Enable Immer patches for undo/redo
enablePatches();

const packageName = "miroir-localcache-zustand";
const cleanLevel = "5_view";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "UndoRedoStore")
).then((logger: LoggerInterface) => {log = logger});

//#########################################################################################
//# Initial State
//#########################################################################################
export function getInitialState(): ZustandStateWithUndoRedo {
  const initialSliceState: LocalCacheSliceState = {
    loading: {},
    current: {},
    status: {
      initialLoadDone: false,
    },
  };

  return {
    currentTransaction: {} as Commit,
    previousModelSnapshot: {} as LocalCacheSliceState,
    pastModelPatches: [],
    presentModelSnapshot: initialSliceState,
    futureModelPatches: [],
    queriesResultsCache: {},
  };
}

//#########################################################################################
//# Store Actions Interface
//#########################################################################################
export interface LocalCacheActions {
  handleAction: (action: LocalCacheAction, applicationDeploymentMap: ApplicationDeploymentMap) => void;
  undo: () => void;
  redo: () => void;
  commit: () => void;
  rollback: () => void;
}

export type LocalCacheStore = ZustandStateWithUndoRedo & LocalCacheActions;

//#########################################################################################
//# Create Store
//#########################################################################################
export function createLocalCacheStore(): StoreApi<LocalCacheStore> {
  return createStore<LocalCacheStore>()((set, get) => ({
    // Initial state
    ...getInitialState(),

    // Handle local cache action with undo/redo tracking
    handleAction: (action: LocalCacheAction, applicationDeploymentMap: ApplicationDeploymentMap) => {
      const currentState = get();
      const actionType = (action as any).actionType;
      
      log.info("UndoRedoStore handleAction called with actionType:", actionType);
      
      // Handle special actions that control transaction state
      switch (actionType) {
        case "rollback": {
          // Rollback: apply action to state, then clear transaction history
          let changes: Patch[] = [];
          let inverseChanges: Patch[] = [];
          
          const newPresentModelSnapshot = produce(
            currentState.presentModelSnapshot,
            (draftState: LocalCacheSliceState) => {
              handleLocalCacheAction(draftState, action, applicationDeploymentMap);
            },
            (patches: Patch[], inversePatches: Patch[]) => {
              changes = patches;
              inverseChanges = inversePatches;
            }
          );
          
          set({
            ...currentState,
            presentModelSnapshot: newPresentModelSnapshot,
            pastModelPatches: [], // Clear transaction on rollback
            futureModelPatches: [],
            queriesResultsCache: {},
          });
          return;
        }
        
        case "commit": {
          // Commit: clear transaction history, set previousModelSnapshot
          set({
            ...currentState,
            previousModelSnapshot: currentState.presentModelSnapshot,
            pastModelPatches: [], // Clear transaction on commit
            futureModelPatches: [],
            queriesResultsCache: {},
          });
          return;
        }
        
        case "initModel":
        case "resetModel":
        case "resetData": {
          // Non-transactional actions: just apply, don't track
          const newPresentModelSnapshot = produce(
            currentState.presentModelSnapshot,
            (draftState: LocalCacheSliceState) => {
              handleLocalCacheAction(draftState, action, applicationDeploymentMap);
            }
          );
          
          set({
            ...currentState,
            presentModelSnapshot: newPresentModelSnapshot,
            queriesResultsCache: {},
          });
          return;
        }
        
        case "loadNewInstancesInLocalCache": {
          // Loading instances: apply but keep existing transaction
          const newPresentModelSnapshot = produce(
            currentState.presentModelSnapshot,
            (draftState: LocalCacheSliceState) => {
              handleLocalCacheAction(draftState, action, applicationDeploymentMap);
            }
          );
          
          set({
            ...currentState,
            presentModelSnapshot: newPresentModelSnapshot,
            // Keep pastModelPatches and futureModelPatches unchanged
            queriesResultsCache: {},
          });
          return;
        }
      }
      
      // For potentially transactional actions, track patches
      let changes: Patch[] = [];
      let inverseChanges: Patch[] = [];

      const newPresentModelSnapshot = produce(
        currentState.presentModelSnapshot,
        (draftState: LocalCacheSliceState) => {
          handleLocalCacheAction(draftState, action, applicationDeploymentMap);
        },
        (patches: Patch[], inversePatches: Patch[]) => {
          changes = patches;
          inverseChanges = inversePatches;
        }
      );

      // Check if this is a transactional action that should be added to undo history
      const isTransactional = isActionTransactional(action);

      if (isTransactional && changes.length > 0) {
        // Create state change entry for undo history
        const stateChange: StateChanges = {
          action: action as TransactionalInstanceAction | ModelActionReplayableAction,
          changes,
          inverseChanges,
        };

        set({
          ...currentState,
          presentModelSnapshot: newPresentModelSnapshot,
          pastModelPatches: [...currentState.pastModelPatches, stateChange],
          futureModelPatches: [], // Clear redo stack on new action
          queriesResultsCache: {},
        });
      } else {
        set({
          ...currentState,
          presentModelSnapshot: newPresentModelSnapshot,
          queriesResultsCache: {},
        });
      }
    },

    // Undo last action
    undo: () => {
      const currentState = get();
      if (currentState.pastModelPatches.length === 0) {
        return;
      }

      const lastPatch = currentState.pastModelPatches[currentState.pastModelPatches.length - 1];
      const newPresentSnapshot = applyPatches(
        currentState.presentModelSnapshot,
        lastPatch.inverseChanges
      );

      set({
        ...currentState,
        presentModelSnapshot: newPresentSnapshot as LocalCacheSliceState,
        pastModelPatches: currentState.pastModelPatches.slice(0, -1),
        futureModelPatches: [lastPatch, ...currentState.futureModelPatches],
        queriesResultsCache: {},
      });
    },

    // Redo last undone action
    redo: () => {
      const currentState = get();
      if (currentState.futureModelPatches.length === 0) {
        return;
      }

      const nextPatch = currentState.futureModelPatches[0];
      const newPresentSnapshot = applyPatches(
        currentState.presentModelSnapshot,
        nextPatch.changes
      );

      set({
        ...currentState,
        presentModelSnapshot: newPresentSnapshot as LocalCacheSliceState,
        pastModelPatches: [...currentState.pastModelPatches, nextPatch],
        futureModelPatches: currentState.futureModelPatches.slice(1),
        queriesResultsCache: {},
      });
    },

    // Commit transaction
    commit: () => {
      const currentState = get();
      set({
        ...currentState,
        previousModelSnapshot: currentState.presentModelSnapshot,
        pastModelPatches: [],
        futureModelPatches: [],
        queriesResultsCache: {},
      });
    },

    // Rollback to previous snapshot
    rollback: () => {
      const currentState = get();
      set({
        ...currentState,
        presentModelSnapshot: currentState.previousModelSnapshot,
        pastModelPatches: [],
        futureModelPatches: [],
        queriesResultsCache: {},
      });
    },
  }));
}

//#########################################################################################
//# Helper to determine if action is transactional (should be added to undo history)
//#########################################################################################
function isActionTransactional(action: LocalCacheAction): boolean {
  if (!action || typeof action !== 'object') {
    return false;
  }
  
  const actionType = (action as any).actionType;
  const payload = (action as any).payload;
  
  // TransactionalInstanceAction is always transactional
  if (actionType === "transactionalInstanceAction") {
    return true;
  }
  
  // Model actions with transactional flag
  const transactionalModelActionTypes = [
    "alterEntityAttribute",
    "renameEntity",
    "createEntity",
    "dropEntity",
  ];
  
  if (transactionalModelActionTypes.includes(actionType)) {
    // Check if explicitly marked as transactional (defaults to true if not specified)
    return payload?.transactional !== false;
  }

  return false;
}

//#########################################################################################
//# Selector for current transaction
//#########################################################################################
export const selectCurrentTransaction = () => (state: ZustandStateWithUndoRedo): StateChanges[] => {
  return state.pastModelPatches;
};
