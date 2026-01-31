/**
 * LocalCacheInterface.ts
 * 
 * Common types for LocalCache implementations (Redux, Zustand, etc.)
 * These are implementation-agnostic types shared between different state management libraries.
 */

import { Patch } from "immer";
import {
  Commit,
  DomainElementSuccess,
  ModelActionReplayableAction,
  TransactionalInstanceAction
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";
import { Domain2QueryReturnType } from "./DomainElement.js";
import { ReduxDeploymentsState } from "./ReduxDeploymentsStateInterface.js";

//#########################################################################################
//# LocalCacheSliceState
//#########################################################################################
/**
 * State structure for a local cache slice.
 * Contains loading and current deployment states, plus status flags.
 */
export type LocalCacheSliceState = { 
  loading: ReduxDeploymentsState,
  current: ReduxDeploymentsState,
  status: {
    initialLoadDone: boolean,
  }
};

export type LocalCacheSliceStateZone = "loading" | "current";

//#########################################################################################
//# StateChanges (for undo/redo)
//#########################################################################################
/**
 * Stores action + changes + inverse changes for undo/redo capability.
 * Uses Immer patches to track state modifications.
 */
export interface StateChanges {
  action: TransactionalInstanceAction | ModelActionReplayableAction;
  changes: Patch[];
  inverseChanges: Patch[];
}

/**
 * Alias for backward compatibility with Redux implementation
 */
export type ReduxStateChanges = StateChanges;

//#########################################################################################
//# QueriesResultsCache
//#########################################################################################
export type QueriesResultsCache = {[k: string]: Domain2QueryReturnType<DomainElementSuccess>};

//#########################################################################################
//# StateWithUndoRedo
//#########################################################################################
/**
 * Main state structure with undo/redo capabilities.
 * This is the core state interface used by both Redux and Zustand implementations.
 * 
 * In the case of a remote deployment, the whole state goes into the indexedDb of the browser,
 * playing the role of a cache. The cache and presentSnapshot then give the local view 
 * of the client on the global state that is stored in the data store.
 * 
 * In the case of a local deployment, the local state goes in the indexedDb also,
 * although any effect goes to the API to the server, and is performed on the datastore,
 * making the presentState always equal to the datastore state.
 * 
 * The indexedDb is also used to store information that is not kept in the datastore:
 * the previousSnapshot, the pastPatches and futurePatches.
 */
export interface StateWithUndoRedo {
  currentTransaction: Commit;
  previousModelSnapshot: LocalCacheSliceState; // state recorded on the previous commit
  pastModelPatches: StateChanges[]; // list of effects achieved on the previousSnapshot, to reach the presentSnapshot
  presentModelSnapshot: LocalCacheSliceState; // only effects on the current snapshot goes into the undo/redo history
  futureModelPatches: StateChanges[]; // in case an undo has been performed, the list of effects to be achieved to reach the latest state again
  queriesResultsCache: QueriesResultsCache;
}

/**
 * Aliases for backward compatibility with Redux/Zustand specific naming
 */
export type ReduxStateWithUndoRedo = StateWithUndoRedo;
export type ZustandStateWithUndoRedo = StateWithUndoRedo;

//#########################################################################################
//# StoreWithUndoRedo
//#########################################################################################
/**
 * Minimal store interface for undo/redo state management.
 * This is the common interface that both Redux and Zustand stores implement.
 */
export interface StoreWithUndoRedo {
  getState: () => StateWithUndoRedo;
  setState: (fn: (state: StateWithUndoRedo) => StateWithUndoRedo) => void;
  subscribe: (listener: (state: StateWithUndoRedo, prevState: StateWithUndoRedo) => void) => () => void;
}

/**
 * Aliases for backward compatibility
 */
export type ReduxStoreWithUndoRedo = StoreWithUndoRedo;
export type ZustandStoreWithUndoRedo = StoreWithUndoRedo;
