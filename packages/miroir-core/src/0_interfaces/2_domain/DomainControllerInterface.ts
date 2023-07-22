import { z } from "zod";

import { Uuid } from "../../0_interfaces/1_core/EntityDefinition.js";
import {
  CUDActionNameSchema,
  CUDActionNamesArray,
  ModelCUDInstanceUpdateSchema,
  WrappedTransactionalEntityUpdateSchema,
  WrappedTransactionalEntityUpdateWithCUDUpdateSchema
} from "../../0_interfaces/2_domain/ModelUpdateInterface.js";


import { ApplicationSchema } from "../1_core/Application.js";
import { ApplicationSection, EntityInstance, EntityInstanceCollectionSchema, EntityInstanceSchema } from "../1_core/Instance.js";
import { MiroirMetaModel, MiroirMetaModelSchema } from "../1_core/Model.js";
import { DataStoreApplicationTypeSchema } from "../3_controllers/ApplicationControllerInterface.js";

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
export const ModelEntityUpdateActionNamesArray = [
  "resetModel", // to delete all DB contents. DANGEROUS. TEMPORARY?
  "resetData", // to delete all DB contents. DANGEROUS. TEMPORARY?
  "initModel", // to delete all DB contents. DANGEROUS. TEMPORARY?
  "updateEntity",
] as const;
export const ModelEntityUpdateActionNameSchema = z.enum(
  ModelEntityUpdateActionNamesArray
);
export type ModelEntityUpdateActionName = z.infer<typeof ModelEntityUpdateActionNameSchema>;
export const ModelEntityUpdateActionNamesArrayString: string[] = ModelEntityUpdateActionNamesArray.map((a) => a);

// #############################################################################################
export const DomainDataActionSchema = z.object({
  actionType: z.literal("DomainDataAction"),
  actionName: CUDActionNameSchema,
  steps: z.number().optional(),
  uuid: z.string().optional(),
  objects: z.array(EntityInstanceCollectionSchema),
});
export type DomainDataAction = z.infer<typeof DomainDataActionSchema>;


// #############################################################################################
export const DomainTransactionalEntityUpdateActionSchema = z.object({
  actionType: z.literal("DomainTransactionalAction"),
  actionName: z.literal("updateEntity"),
  update: WrappedTransactionalEntityUpdateSchema,
});
export type DomainTransactionalEntityUpdateAction = z.infer<typeof DomainTransactionalEntityUpdateActionSchema>;


// #############################################################################################
export const DomainTransactionalReplayableEntityUpdateActionSchema = z.object({
  actionType: z.literal("DomainTransactionalAction"),
  actionName: z.literal("updateEntity"),
  update: WrappedTransactionalEntityUpdateWithCUDUpdateSchema,
});
export type DomainTransactionalReplayableEntityUpdateAction = z.infer<typeof DomainTransactionalReplayableEntityUpdateActionSchema>;


// #############################################################################################
export const DomainTransactionalCUDActionSchema = z.object({
  actionType: z.literal("DomainTransactionalAction"),
  actionName: z.literal("UpdateMetaModelInstance"),
  update: ModelCUDInstanceUpdateSchema,
});
export type DomainTransactionalCUDAction = z.infer<typeof DomainTransactionalCUDActionSchema>;

// #############################################################################################
export const DomainTransactionalReplayableActionSchema = z.union([
  DomainTransactionalReplayableEntityUpdateActionSchema,
  DomainTransactionalCUDActionSchema,
]);
export type DomainTransactionalReplayableAction = z.infer<typeof DomainTransactionalReplayableActionSchema>;
  
// #############################################################################################
export const DomainTransactionalCommitActionSchema = z.object({
  actionType: z.literal("DomainTransactionalAction"),
  actionName: z.literal("commit"),
  label: z.string().optional(),
});
export type DomainTransactionalCommitAction = z.infer<typeof DomainTransactionalCommitActionSchema>;


// #############################################################################################
export const DomainTransactionalRollbackActionSchema = z.object({
  actionType: z.literal("DomainTransactionalAction"),
  actionName: z.literal("rollback"),
  label: z.string().optional(),
});
export type DomainTransactionalRollbackAction = z.infer<typeof DomainTransactionalRollbackActionSchema>;

// #############################################################################################
export const DomainTransactionalReplaceLocalCacheActionSchema = z.object({
  actionType: z.literal("DomainTransactionalAction"),
  actionName: z.literal("replaceLocalCache"),
  objects: z.array(EntityInstanceCollectionSchema)
});
export type DomainTransactionalReplaceLocalCacheAction = z.infer<typeof DomainTransactionalReplaceLocalCacheActionSchema>;

// #############################################################################################
export const DomainTransactionalUndoRedoActionSchema = z.object({
  actionType: z.literal("DomainTransactionalAction"),
  actionName: UndoRedoActionNamesSchema,
});
export type DomainTransactionalUndoRedoAction = z.infer<typeof DomainTransactionalUndoRedoActionSchema>;

// #############################################################################################
export const DomainTransactionalResetModelActionSchema = z.object({
  actionType: z.literal("DomainTransactionalAction"),
  actionName: z.literal("resetModel"),
});
export type DomainTransactionalResetModelAction = z.infer<typeof DomainTransactionalResetModelActionSchema>;

// #############################################################################################
export const DomainTransactionalResetDataActionSchema = z.object({
  actionType: z.literal("DomainTransactionalAction"),
  actionName: z.literal("resetData"),
});
export type DomainTransactionalResetDataAction = z.infer<typeof DomainTransactionalResetDataActionSchema>;

// #############################################################################################
export const DomainModelInitActionParamsSchema = z.object({
  metaModel: MiroirMetaModelSchema,
  dataStoreType: DataStoreApplicationTypeSchema,
  application: ApplicationSchema,
  applicationDeployment: EntityInstanceSchema,
  applicationModelBranch: EntityInstanceSchema,
  applicationVersion: EntityInstanceSchema,
  applicationStoreBasedConfiguration: EntityInstanceSchema,
});
export type DomainModelInitActionParams = z.infer<typeof DomainModelInitActionParamsSchema>;



// #############################################################################################
export const DomainModelInitActionSchema = z.object({
  actionType: z.literal("DomainTransactionalAction"),
  actionName: z.literal("initModel"),
  params: DomainModelInitActionParamsSchema
});
export type DomainModelInitAction = z.infer<typeof DomainModelInitActionSchema>;

// #############################################################################################
export const DomainAncillaryActionSchema = z.union([
  DomainTransactionalCommitActionSchema,
  DomainTransactionalRollbackActionSchema,
  DomainTransactionalReplaceLocalCacheActionSchema,
  DomainTransactionalUndoRedoActionSchema,
  DomainTransactionalResetModelActionSchema,
  DomainTransactionalResetDataActionSchema,
  DomainModelInitActionSchema,
]);
export type DomainAncillaryAction = z.infer<typeof DomainAncillaryActionSchema>;
  

// #############################################################################################
export const DomainTransactionalActionSchema = z.union([
  DomainAncillaryActionSchema,
  DomainTransactionalCUDActionSchema,
  DomainTransactionalEntityUpdateActionSchema,
]);
export type DomainTransactionalAction = z.infer<typeof DomainTransactionalActionSchema>;
  
// #############################################################################################
export const DomainTransactionalAncillaryOrReplayableActionSchema = z.union([
  DomainAncillaryActionSchema,
  DomainTransactionalCUDActionSchema,
  DomainTransactionalReplayableEntityUpdateActionSchema,
]);
export type DomainTransactionalAncillaryOrReplayableAction = z.infer<typeof DomainTransactionalAncillaryOrReplayableActionSchema>;
    

// #############################################################################################
export const remoteStoreActionNamesArray = [
  ...CRUDActionNamesArray,
  ...ModelEntityUpdateActionNamesArray,
] as const;
export const remoteStoreActionNamesSchema = z.enum(
  remoteStoreActionNamesArray
);

export type RemoteStoreActionName = z.infer<typeof remoteStoreActionNamesSchema>;


// #############################################################################################
export const DomainActionSchema = z.union([DomainDataActionSchema, DomainTransactionalActionSchema]);
export type DomainAction = z.infer<typeof DomainActionSchema>;


// #############################################################################################
export const DomainActionWithDeploymentSchema = z.object({
  deploymentUuid: z.string().uuid(),
  domainAction: DomainActionSchema,
});
export type DomainActionWithDeployment = z.infer<typeof DomainActionWithDeploymentSchema>;


export const DomainAncillaryOrReplayableActionSchema = z.union([DomainDataActionSchema, DomainTransactionalAncillaryOrReplayableActionSchema]);
export type DomainAncillaryOrReplayableAction = z.infer<typeof DomainAncillaryOrReplayableActionSchema>;


// #############################################################################################
export const DomainAncillaryOrReplayableActionWithDeploymentSchema = z.object({
  deploymentUuid: z.string().uuid(),
  domainAction: DomainAncillaryOrReplayableActionSchema,
});
export type DomainAncillaryOrReplayableActionWithDeployment = z.infer<typeof DomainAncillaryOrReplayableActionWithDeploymentSchema>;


// ###################################################################################
export interface DomainInstancesUuidIndex {
  [uuid: string]: EntityInstance;
}
// ###################################################################################
export interface EntitiesDomainState {
  // TODO: to use in redux, this should be the structure of the state manipulated by the client. Right now, the type is duplicated internally within miroir-redux.
  [entityUuid: string]: DomainInstancesUuidIndex;
}

// ###################################################################################
export type DomainStateTransformer = (domainState: EntitiesDomainState) => EntitiesDomainState;
export type DomainStateEntityInstanceArraySelector = (domainState: EntitiesDomainState) => EntityInstance[];
export type DomainStateInstanceSelector = (domainState: EntitiesDomainState) => EntityInstance | undefined;
export type DomainStateReducer = (domainState: EntitiesDomainState) => any;

// ###################################################################################
export interface DomainControllerInterface {
  handleDomainNonTransactionalAction(deploymentUuid: Uuid, action: DomainDataAction): Promise<void>;
  handleDomainTransactionalAction(
    deploymentUuid: Uuid,
    action: DomainTransactionalAction,
    currentModel?: MiroirMetaModel
  ): Promise<void>;
  handleDomainAction(deploymentUuid: Uuid, action: DomainAction, currentModel?: MiroirMetaModel): Promise<void>;
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
  currentTransaction(): DomainTransactionalReplayableAction[];
  currentLocalCacheInfo(): LocalCacheInfo;

  
}
