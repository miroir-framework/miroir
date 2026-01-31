/**
 * State interfaces for Zustand-based local cache.
 * Re-exports common types from miroir-core for local use.
 */

// Re-export all types from miroir-core for compatibility
export type {
  LocalCacheSliceState,
  LocalCacheSliceStateZone,
  QueriesResultsCache,
  ReduxStateChanges,
  ReduxStateWithUndoRedo,
  ReduxStoreWithUndoRedo,
  StateChanges,
  StateWithUndoRedo,
  StoreWithUndoRedo,
  ZustandStateWithUndoRedo,
  ZustandStoreWithUndoRedo,
} from "miroir-core";
