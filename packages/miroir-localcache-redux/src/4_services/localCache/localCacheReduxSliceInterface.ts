import { PayloadAction, Store } from "@reduxjs/toolkit";
import { Patch } from "immer";
import {
  Commit,
  DeploymentEntityState,
  DomainElementSuccess,
  Domain2QueryReturnType,
  InstanceAction,
  LocalCacheAction,
  ModelAction,
  ModelActionReplayableAction,
  RestPersistenceAction,
  TransactionalInstanceAction,
  UndoRedoAction
} from "miroir-core";


//#########################################################################################
//# LocalCacheSliceState
//#########################################################################################

// export type LocalCacheSliceState = { 
//   [DeploymentUuidSectionEntityUuid: string]: ZEntityState 
// }; // TODO: check format of DeploymentUuidSectionEntityUuid?
export type LocalCacheSliceState = { 
  loading: DeploymentEntityState,
  current: DeploymentEntityState
  status: {
    initialLoadDone: boolean,
  }
}; // TODO: check format of DeploymentUuidSectionEntityUuid?

export type LocalCacheSliceStateZone = "loading" | "current";

export const localCacheSliceName: string = "localCache";

export const localCacheSliceInputActionNamesObject = {
  handleAction: "handleAction",
};
export type LocalCacheSliceInputActionNamesObjectTuple = typeof localCacheSliceInputActionNamesObject;
export type LocalCacheSliceInputActionNamesKey = keyof LocalCacheSliceInputActionNamesObjectTuple;
export const localCacheSliceInputActionNames = Object.values(localCacheSliceInputActionNamesObject);
export const localCacheSliceInputFullActionNames = Object.values(localCacheSliceInputActionNamesObject).map(
  (n) => localCacheSliceName + "/" + n
); // TODO: use map type?

//#########################################################################################
//# ReduxStateWithUndoRedo
//#########################################################################################
/**
 * This reducer wraps a "plain" reducer, enhancing it with undo/redo capabilities.
 * It is however not "pure" or "clean", in the sense that it requires the inner 
 * reducer to provide a list of actions for which the undo/redo capability should
 * be added (provided via @makeActionUpdatesUndoable).
 * Adding the capability by default could induce a high memory/cpu footprint, which
 * is deemed inapropriate in the general case.
 * 
 */
export interface ReduxStateChanges {
  action: TransactionalInstanceAction | ModelActionReplayableAction;
  changes: Patch[];
  inverseChanges: Patch[];
}

export type QueriesResultsCache = {[k: string]: Domain2QueryReturnType<DomainElementSuccess>};

/**
 * In the case of a remote deployment, the whole state goes into the indexedDb of the browser, playing the role of a cache.
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
  currentTransaction: Commit,
  previousModelSnapshot: LocalCacheSliceState, // state recorded on the previous commit.
  pastModelPatches: ReduxStateChanges[], // list of effects achieved on the previousSnapshot, to reach the presentSnapshot
  presentModelSnapshot: LocalCacheSliceState, // only effects on the current snapshot goes into the undo/redo history
  futureModelPatches: ReduxStateChanges[], // in case an undo has been performed, the list of effects to be achieved to reach the latest state again
  queriesResultsCache: QueriesResultsCache,
}

export type InnerReducerAction =
  | ModelAction
  | TransactionalInstanceAction
  | UndoRedoAction
  | InstanceAction
  | RestPersistenceAction
  | LocalCacheAction
;

export type InnerReducerInterface = (
  state: LocalCacheSliceState,
  action: PayloadAction<InnerReducerAction>
) => LocalCacheSliceState;

// TODO: make action type explicit!
export type ReduxReducerWithUndoRedoInterface = (
  state: ReduxStateWithUndoRedo,
  action: PayloadAction<InnerReducerAction>
) => ReduxStateWithUndoRedo;

export type ReduxStoreWithUndoRedo = Store<ReduxStateWithUndoRedo, any>; // TODO: precise the type of Actions!


