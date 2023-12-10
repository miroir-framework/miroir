import { PayloadAction, Store } from "@reduxjs/toolkit";
import { Patch } from "immer";
import {
  Commit,
  DomainActionWithTransactionalEntityUpdateWithCUDUpdateWithDeployment,
  DomainTransactionalActionWithCUDUpdate,
  EntityAction,
  EntityDefinition,
  EntityInstanceCollection,
  FetchedData,
  LocalCacheCUDActionWithDeployment,
  LocalCacheEntityActionWithDeployment,
  LocalCacheTransactionalActionWithDeployment,
  RemoteStoreCRUDAction,
  entityInstance
} from "miroir-core";
import { z } from "zod";


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
  action:DomainTransactionalActionWithCUDUpdate | LocalCacheEntityActionWithDeployment, changes:Patch[]; inverseChanges:Patch[];
}

export type QueriesResultsCache = {[k: string]: FetchedData};

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

export type InnerReducerInterface = (
  state: LocalCacheSliceState,
  action: PayloadAction<
    | DomainActionWithTransactionalEntityUpdateWithCUDUpdateWithDeployment
    | LocalCacheEntityActionWithDeployment
    | LocalCacheTransactionalActionWithDeployment
    | LocalCacheCUDActionWithDeployment
    | RemoteStoreCRUDAction
  >
) => LocalCacheSliceState;

// TODO: make action type explicit!
export type ReduxReducerWithUndoRedoInterface = (
  state: ReduxStateWithUndoRedo,
  action: PayloadAction<
    | DomainActionWithTransactionalEntityUpdateWithCUDUpdateWithDeployment
    | LocalCacheEntityActionWithDeployment
    | LocalCacheTransactionalActionWithDeployment
    | LocalCacheCUDActionWithDeployment
    | RemoteStoreCRUDAction
  >
) => ReduxStateWithUndoRedo;

export type ReduxStoreWithUndoRedo = Store<ReduxStateWithUndoRedo, any>;

export type MinstanceAction = PayloadAction<EntityInstanceCollection,string>;
export type MentityAction = PayloadAction<EntityDefinition[],string>;

export type Maction = MinstanceAction | MentityAction;

//#########################################################################################
//# DATA TYPES
//#########################################################################################
export const ZEntityIdSchema = z.union([z.number(), z.string()]);
export const ZDictionarySchema = z.record(z.string().uuid(), entityInstance.optional());
export type MiroirDictionary = z.infer<typeof ZDictionarySchema>;
export const ZEntityStateSchema = z.object({ ids: z.array(ZEntityIdSchema), entities: ZDictionarySchema });
export type ZEntityState = z.infer<typeof ZEntityStateSchema>; //not used

// export type LocalCacheSliceState = { [DeploymentUuidSectionEntityUuid: string]: EntityState<EntityInstance> }; // TODO: check format of DeploymentUuidSectionEntityUuid?
export type LocalCacheSliceState = { [DeploymentUuidSectionEntityUuid: string]: ZEntityState }; // TODO: check format of DeploymentUuidSectionEntityUuid?

export const localCacheSliceName: string = "localCache";

export const localCacheSliceInputActionNamesObject = {
  handleLocalCacheEntityAction: "handleLocalCacheEntityAction",
  handleLocalCacheTransactionalAction: "handleLocalCacheTransactionalAction",
  handleLocalCacheCUDAction: "handleLocalCacheCUDAction",
};
export type LocalCacheSliceInputActionNamesObjectTuple = typeof localCacheSliceInputActionNamesObject;
export type LocalCacheSliceInputActionNamesKey = keyof LocalCacheSliceInputActionNamesObjectTuple;
export const localCacheSliceInputActionNames = Object.values(localCacheSliceInputActionNamesObject);
export const localCacheSliceInputFullActionNames = Object.values(localCacheSliceInputActionNamesObject).map(
  (n) => localCacheSliceName + "/" + n
); // TODO: use map type?

