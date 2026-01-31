import { PayloadAction, Store } from "@reduxjs/toolkit";
import {
  InstanceAction,
  LocalCacheAction,
  LocalCacheSliceState,
  ModelAction,
  QueriesResultsCache,
  ReduxStateChanges,
  ReduxStateWithUndoRedo,
  RestPersistenceAction,
  TransactionalInstanceAction,
  UndoRedoAction,
  type ApplicationDeploymentMap
} from "miroir-core";

// Re-export types from miroir-core for backward compatibility
export type {
  LocalCacheSliceState,
  LocalCacheSliceStateZone,
  QueriesResultsCache,
  ReduxStateChanges,
  ReduxStateWithUndoRedo,
} from "miroir-core";

export const localCacheSliceName: string = "localCache";

export const localCacheSliceInputActionNamesObject = {
  handleAction: "handleAction",
};

//#########################################################################################
//# Redux-specific types (not shared with other implementations)
//#########################################################################################

export type InnerReducerAction =
  | ModelAction
  | TransactionalInstanceAction
  | UndoRedoAction
  | InstanceAction
  | RestPersistenceAction
  | LocalCacheAction
;

export type ReducerActionBox<T> = {
  // action: InnerReducerAction;
  action: T;
  applicationDeploymentMap: ApplicationDeploymentMap;
};

export type LocalCacheActionBox = ReducerActionBox<LocalCacheAction>;
// export type LocalCacheActionBox = {
//   applicationDeploymentMap: ApplicationDeploymentMap,
//   action: LocalCacheAction,
// }

export type InnerReducerInterface = (
  state: LocalCacheSliceState,
  action: PayloadAction<ReducerActionBox<InnerReducerAction>>
) => LocalCacheSliceState;

// TODO: make action type explicit!
export type ReduxReducerWithUndoRedoInterface = (
  state: ReduxStateWithUndoRedo,
  action: PayloadAction<ReducerActionBox<InnerReducerAction>>
) => ReduxStateWithUndoRedo;

export type ReduxStoreWithUndoRedo = Store<ReduxStateWithUndoRedo, any>; // TODO: precise the type of Actions!


