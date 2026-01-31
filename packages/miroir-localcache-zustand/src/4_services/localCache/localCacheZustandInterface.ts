/**
 * State interfaces for Zustand-based local cache.
 * These mirror the Redux-based interfaces for compatibility.
 */

import { Patch } from "immer";
import {
  Commit,
  Domain2QueryReturnType,
  DomainElementSuccess,
  ModelActionReplayableAction,
  ReduxDeploymentsState,
  TransactionalInstanceAction,
} from "miroir-core";

//#########################################################################################
//# LocalCacheSliceState
//#########################################################################################
export type LocalCacheSliceState = { 
  loading: ReduxDeploymentsState,
  current: ReduxDeploymentsState
  status: {
    initialLoadDone: boolean,
  }
};

export type LocalCacheSliceStateZone = "loading" | "current";

//#########################################################################################
//# ZustandStateWithUndoRedo
//#########################################################################################
/**
 * Stores action + changes + inverse changes for undo/redo.
 */
export interface StateChanges {
  action: TransactionalInstanceAction | ModelActionReplayableAction;
  changes: Patch[];
  inverseChanges: Patch[];
}

export type QueriesResultsCache = {[k: string]: Domain2QueryReturnType<DomainElementSuccess>};

/**
 * Main state structure with undo/redo capabilities.
 * Mirrors ReduxStateWithUndoRedo for compatibility.
 */
export interface ZustandStateWithUndoRedo {
  currentTransaction: Commit;
  previousModelSnapshot: LocalCacheSliceState;
  pastModelPatches: StateChanges[];
  presentModelSnapshot: LocalCacheSliceState;
  futureModelPatches: StateChanges[];
  queriesResultsCache: QueriesResultsCache;
}

/**
 * Re-export for compatibility with code expecting Redux types
 */
export type ReduxStateWithUndoRedo = ZustandStateWithUndoRedo;
export type ReduxStateChanges = StateChanges;

//#########################################################################################
//# Store type
//#########################################################################################
export type ZustandStoreWithUndoRedo = {
  getState: () => ZustandStateWithUndoRedo;
  setState: (fn: (state: ZustandStateWithUndoRedo) => ZustandStateWithUndoRedo) => void;
  subscribe: (listener: (state: ZustandStateWithUndoRedo, prevState: ZustandStateWithUndoRedo) => void) => () => void;
};

/**
 * Re-export for compatibility
 */
export type ReduxStoreWithUndoRedo = ZustandStoreWithUndoRedo;
