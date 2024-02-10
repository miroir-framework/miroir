import { z } from "zod";

import { Uuid } from "../../0_interfaces/1_core/EntityDefinition.js";
import {
  CUDActionNameSchema,
  CUDActionNamesArray,
  ModelCUDInstanceUpdateSchema,
  WrappedTransactionalEntityUpdateSchema,
  WrappedTransactionalEntityUpdateWithCUDUpdateSchema
} from "../../0_interfaces/2_domain/ModelUpdateInterface.js";


import {
  EntityInstance,
  EntityInstancesUuidIndex,
  MetaModel,
  entityInstanceCollection,
  modelActionCommit,
  modelActionInitModel,
  modelActionResetData,
  modelActionResetModel,
  modelActionRollback
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";
import { LocalCacheModelActionWithDeployment } from "../4-services/LocalCacheInterface.js";
import { RemoteStoreInterface } from "../4-services/RemoteStoreInterface.js";

export interface LocalCacheInfo {
  localCacheSize: number;
}


export const CRUDActionNamesArray = [
  ...CUDActionNamesArray,
  "read",
] as const;
export const CRUDActionNameSchema = z.enum(
  CRUDActionNamesArray
);
export type CRUDActionName = z.infer<typeof CRUDActionNameSchema>;
export const CRUDActionNamesArrayString: string[] = CRUDActionNamesArray.map((a) => a);

// #############################################################################################
export const UndoRedoActionNamesArray = [
  "undo",
  "redo",
] as const;
export const UndoRedoActionNamesSchema = z.enum(
  UndoRedoActionNamesArray
);
export type UndoRedoActionName = z.infer<typeof UndoRedoActionNamesSchema>;

// #############################################################################################
export const DomainDataActionSchema = z.object({
  actionType: z.literal("DomainDataAction"),
  actionName: CUDActionNameSchema,
  steps: z.number().optional(),
  uuid: z.string().optional(),
  objects: z.array(entityInstanceCollection),
});
export type DomainDataAction = z.infer<typeof DomainDataActionSchema>;


// #############################################################################################
// without translation of Entity Updates in CUD updates
export const DomainTransactionalEntityUpdateActionSchema = z.object({
  actionType: z.literal("DomainTransactionalAction"),
  actionName: z.literal("updateEntity"),
  update: WrappedTransactionalEntityUpdateSchema,
});
export type DomainTransactionalEntityUpdateAction = z.infer<typeof DomainTransactionalEntityUpdateActionSchema>;


// #############################################################################################
// with translation of Entity Updates in CUD updates
export const DomainTransactionalUpdateEntityActionWithCUDUpdateSchema = z.object({
  actionType: z.literal("DomainTransactionalAction"),
  actionName: z.literal("updateEntity"),
  update: WrappedTransactionalEntityUpdateWithCUDUpdateSchema,
});
export type DomainTransactionalUpdateEntityActionWithCUDUpdate = z.infer<typeof DomainTransactionalUpdateEntityActionWithCUDUpdateSchema>;


// #############################################################################################
export const DomainTransactionalUpdateMetaModelInstanceActionSchema = z.object({
  actionType: z.literal("DomainTransactionalAction"),
  actionName: z.literal("UpdateMetaModelInstance"),
  update: ModelCUDInstanceUpdateSchema,
});
export type DomainTransactionalUpdateMetaModelInstanceAction = z.infer<typeof DomainTransactionalUpdateMetaModelInstanceActionSchema>;

// #############################################################################################
export const DomainTransactionalActionWithCUDUpdateSchema = z.union([
  DomainTransactionalUpdateEntityActionWithCUDUpdateSchema,
  DomainTransactionalUpdateMetaModelInstanceActionSchema,
]);
export type DomainTransactionalActionWithCUDUpdate = z.infer<typeof DomainTransactionalActionWithCUDUpdateSchema>;
  
// #############################################################################################
export const DomainTransactionalUndoRedoActionSchema = z.object({
  actionType: z.literal("DomainTransactionalAction"),
  actionName: UndoRedoActionNamesSchema,
});
export type DomainTransactionalUndoRedoAction = z.infer<typeof DomainTransactionalUndoRedoActionSchema>;

// #############################################################################################
// without translation of Entity Updates in CUD updates
export const DomainTransactionalActionSchema = z.union([
  DomainTransactionalUndoRedoActionSchema,
  DomainTransactionalUpdateMetaModelInstanceActionSchema,
  DomainTransactionalEntityUpdateActionSchema,
]);
export type DomainTransactionalAction = z.infer<typeof DomainTransactionalActionSchema>;
  
// #############################################################################################
// with translation of Entity Updates in CUD updates
export const DomainTransactionalActionWithEntityUpdateWithCUDUpdateSchema = z.union([
  DomainTransactionalUndoRedoActionSchema,
  DomainTransactionalUpdateMetaModelInstanceActionSchema,
  DomainTransactionalUpdateEntityActionWithCUDUpdateSchema,
]);
export type DomainTransactionalActionWithEntityUpdateWithCUDUpdate = z.infer<typeof DomainTransactionalActionWithEntityUpdateWithCUDUpdateSchema>;
    

// #############################################################################################
// without translation of Entity Updates in CUD updates
export const DomainActionSchema = z.union([
  DomainDataActionSchema,
  DomainTransactionalActionSchema,
  modelActionCommit,
  modelActionInitModel,
  modelActionResetModel,
  modelActionResetData,
  modelActionRollback,
]);
export type DomainAction = z.infer<typeof DomainActionSchema>;

export const DomainActionWithDeploymentSchema = z.object({
  actionType:z.literal("DomainAction"),
  deploymentUuid: z.string().uuid(),
  domainAction: DomainActionSchema,
});
export type DomainActionWithDeployment = z.infer<typeof DomainActionWithDeploymentSchema>;


// #############################################################################################
// export const DomainActionWithTransactionalEntityUpdateWithCUDUpdateSchema = z.union([DomainDataActionSchema, instanceCUDAction, DomainTransactionalActionWithEntityUpdateWithCUDUpdateSchema]);
// with translation of Entity Updates in CUD updates
export const DomainActionWithTransactionalEntityUpdateWithCUDUpdateSchema = z.union([
  DomainDataActionSchema,
  DomainTransactionalActionWithEntityUpdateWithCUDUpdateSchema,
]);
export type DomainActionWithTransactionalEntityUpdateWithCUDUpdate = z.infer<typeof DomainActionWithTransactionalEntityUpdateWithCUDUpdateSchema>;

export const DomainActionWithTransactionalEntityUpdateWithCUDUpdateWithDeploymentSchema = z.object({
  actionType:z.literal("DomainActionWithTransactionalEntityUpdateWithCUDUpdate"),
  deploymentUuid: z.string().uuid(),
  domainAction: DomainActionWithTransactionalEntityUpdateWithCUDUpdateSchema,
});
export type DomainActionWithTransactionalEntityUpdateWithCUDUpdateWithDeployment = z.infer<typeof DomainActionWithTransactionalEntityUpdateWithCUDUpdateWithDeploymentSchema>;


// ###################################################################################
export interface EntitiesDomainState {
  // TODO: to use in redux, this should be the structure of the state manipulated by the client. Right now, the type is duplicated internally within miroir-localcache-redux.
  [entityUuid: string]: EntityInstancesUuidIndex;
}

// ###################################################################################
export interface DeploymentSectionDomainState {
  // TODO: to use in redux, this should be the structure of the state manipulated by the client. Right now, the type is duplicated internally within miroir-localcache-redux.
  [section: string]: EntitiesDomainState;
}

// ###################################################################################
export interface DomainState {
  // TODO: to use in redux, this should be the structure of the state manipulated by the client. Right now, the type is duplicated internally within miroir-localcache-redux.
  [deploymentUuid: string]: DeploymentSectionDomainState;
}

// ###################################################################################
export type EntitiesDomainStateTransformer = (domainState: EntitiesDomainState) => EntitiesDomainState;
export type EntitiesDomainStateEntityInstanceArraySelector = (domainState: EntitiesDomainState) => EntityInstance[];
export type EntitiesDomainStateInstanceSelector = (domainState: EntitiesDomainState) => EntityInstance | undefined;
export type EntitiesDomainStateReducer = (domainState: EntitiesDomainState) => any;

export type DomainStateMetaModelSelector = (domainState: DomainState) => MetaModel | undefined;

export type EntityInstancesUuidIndexEntityInstanceArraySelector = (entityInstancesUuidIndex: EntityInstancesUuidIndex) => EntityInstance[];

// ###################################################################################
export interface DomainControllerInterface {
  handleDomainNonTransactionalAction(deploymentUuid: Uuid, action: DomainDataAction): Promise<void>;
  handleDomainTransactionalAction(
    deploymentUuid: Uuid,
    action: DomainTransactionalAction,
    currentModel?: MetaModel,
  ): Promise<void>;
  handleDomainAction(deploymentUuid: Uuid, action: DomainAction, currentModel?: MetaModel): Promise<void>;
  /**
   * data access must accomodate different styles of access
   * => compile-time dependency on types in miroir-core? Or use "any"?
   * There must be a two-phase process to access data (?)
   * first step: getting one's preferred way of getting data, depending on chosen implementation
   * What does it perform concretely?
   * first function / DomainController factory: takes concrete implementation (Redux, Angular Service...) as input?
   * first function returns either: (a set of) react hooks, an angular Service, an Rxjs Observable?
   * output of first function: function producing object producing data? function producing function producing data?
   * is it possible to have a common interface for these very different implementations?
   * 
   * second step: accessing data
   * input of second function, producing data: jzod schema, context (deployment uuid, application section...)
   * output of second function: 
   * 
   * have a Query interface for a facade to the data-access operations provided by DomainController?
   * - to accomodate for "elaborate" cache-management (performs a remote access in the case the desired data is absent from the cache )
   * - to perform "complex" queries (interpretation required)
   * operations can be asynchronous. 
   * 
   * react hooks wrapping miroir-core functions
   * angular services returning rxjs observables wrapping miroir-core functions
   * 
   * use of Redux + Angular?
   * 
   * 
   * OR:
   * - write "standard" set of functions for each local store implementation providing EntitiesDomainState (or other) to the local data computation function
   * 
   * each computation is split into several parts with asynchronous return of result:
   * estimate if all needed data is present in the local storage
   * - if yes apply computation function directly
   * - if no ask server to perform needed task, wait for results on convened reception point
   * => need to have a standard mechanism for spawning / collecting task results
   * 
   * steps:
   * - collect / compute on server / database, using data from server cache (?)
   * - receive reduced data or Entity instances from server, with residual finishing / consolidation step on client side
   * 
   * 
   */
  currentTransaction(): (DomainTransactionalActionWithCUDUpdate | LocalCacheModelActionWithDeployment)[],
  currentLocalCacheInfo(): LocalCacheInfo,
  getRemoteStore(): RemoteStoreInterface,
  
}
