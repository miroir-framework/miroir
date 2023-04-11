import { MiroirMetaModel } from "../1_core/Model.js";
import { ModelCUDInstanceUpdate, WrappedModelEntityUpdate, WrappedModelEntityUpdateWithCUDUpdate } from "../../0_interfaces/2_domain/ModelUpdateInterface.js";
import { LocalCacheInfo } from "../../0_interfaces/4-services/localCache/LocalCacheInterface.js";
import { EntityInstance, EntityInstanceCollection } from "../1_core/Instance.js";
import { EntityDefinition, MetaEntity } from "../../0_interfaces/1_core/EntityDefinition.js";

export const CUDActionNamesObject = {
  'create': 'create',
  'update': 'update',
  'delete': 'delete',
}
export type CUDActionName = keyof typeof CUDActionNamesObject;
export const CUDActionNamesArray:CRUDActionName[] = Object.keys(CUDActionNamesObject) as CRUDActionName[];
export const CUDActionNamesArrayString:string[] = CUDActionNamesArray.map(a=>a);

// #############################################################################################
export const CRUDActionNamesObject = {
  ...CUDActionNamesObject,
  'read': 'read',
}
export type CRUDActionName = keyof typeof CRUDActionNamesObject;
export const CRUDActionNamesArray:CRUDActionName[] = Object.keys(CRUDActionNamesObject) as CRUDActionName[];
export const CRUDActionNamesArrayString:string[] = CRUDActionNamesArray.map(a=>a);


// #############################################################################################
export const undoRedoActionNamesObject = {
  'undo': 'undo',
  'redo': 'redo',
}
export type UndoRedoActionName = keyof typeof undoRedoActionNamesObject;
export const undoRedoActionNamesArray:UndoRedoActionName[] = Object.keys(undoRedoActionNamesObject) as UndoRedoActionName[];


// // #############################################################################################
export const ModelEntityUpdateActionNamesObject = {
  'resetModel': 'resetModel', // to delete all DB contents. DANGEROUS. TEMPORARY?
  'initModel': 'initModel', // to delete all DB contents. DANGEROUS. TEMPORARY?
  'updateEntity': 'updateEntity',
}
export type ModelEntityUpdateActionName = keyof typeof ModelEntityUpdateActionNamesObject;
export const ModelEntityUpdateActionNamesArray:ModelEntityUpdateActionName[] = Object.keys(ModelEntityUpdateActionNamesObject) as ModelEntityUpdateActionName[];
export const ModelEntityUpdateActionNamesArrayString:string[] = ModelEntityUpdateActionNamesArray.map(a=>a);

// #############################################################################################
export interface DomainDataAction {
  actionType:'DomainDataAction';
  actionName: CUDActionName;
  steps?:number; // for undo / redo
  uuid?:string;
  objects?:EntityInstanceCollection[];
}


export interface DomainModelEntityUpdateAction {
  actionType:'DomainModelAction',
  actionName: 'updateEntity'//`${ModelEntityUpdateActionNamesObject.updateModel}`;
  update:WrappedModelEntityUpdate;
}

export interface DomainModelReplayableEntityUpdateAction {
  actionType:'DomainModelAction',
  actionName: 'updateEntity'//`${ModelEntityUpdateActionNamesObject.updateModel}`;
  update:WrappedModelEntityUpdateWithCUDUpdate;
}

export interface DomainModelCUDAction {
  actionType:'DomainModelAction',
  actionName: 'UpdateMetaModelInstance';
  update: ModelCUDInstanceUpdate;
}

export type DomainModelReplayableAction = 
  | DomainModelReplayableEntityUpdateAction
  | DomainModelCUDAction
;

export interface DomainModelCommitAction {
  actionType:'DomainModelAction',
  actionName: 'commit';
  label?: string;
}

export interface DomainModelRollbackAction {
  actionType:'DomainModelAction',
  actionName: 'replace';
  objects?:EntityInstanceCollection[];
}

export interface DomainModelUndoRedoAction {
  actionType:'DomainModelAction',
  actionName: UndoRedoActionName;
  // objects?:EntityInstanceCollection[]; // for "replace" action only. To separate, for clarification?
}

export interface DomainModelResetAction {
  actionType:'DomainModelAction',
  actionName: 'resetModel';
  // entityDefinitions: EntityDefinition[];
  // entities: MetaEntity[];
}

export interface DomainModelInitAction {
  actionType:'DomainModelAction',
  actionName: 'initModel';
  entityDefinitions: EntityDefinition[];
  entities: MetaEntity[];
}

export type DomainModelAncillaryAction =
  | DomainModelCommitAction
  | DomainModelRollbackAction
  | DomainModelUndoRedoAction
  | DomainModelResetAction
  | DomainModelInitAction
;

export type DomainModelAction =
  | DomainModelAncillaryAction
  | DomainModelCUDAction
  | DomainModelEntityUpdateAction
;

export type DomainModelAncillaryOrReplayableAction =
  | DomainModelAncillaryAction
  | DomainModelCUDAction
  | DomainModelReplayableEntityUpdateAction
;

// #############################################################################################
export const remoteStoreActionNamesObject = {
  ...CRUDActionNamesObject,
  ...ModelEntityUpdateActionNamesObject,
}
export type RemoteStoreActionName = keyof typeof remoteStoreActionNamesObject;
export const remoteStoreActionNamesArray:RemoteStoreActionName[] = Object.keys(remoteStoreActionNamesObject) as RemoteStoreActionName[];


// #############################################################################################
export type DomainAction = DomainDataAction | DomainModelAction;
export type DomainAncillaryOrReplayableAction = DomainDataAction | DomainModelAncillaryOrReplayableAction;

export interface DomainInstancesUuidIndex {
  [uuid: string]: EntityInstance
}
export interface DomainState {
  [entityUuid: string]: DomainInstancesUuidIndex;
}

export type DomainStateTransformer=(domainState:DomainState)=>DomainState
export type DomainStateSelector=(domainState:DomainState)=>EntityInstance[]
export type DomainStateReducer=(domainState:DomainState)=>any

export interface DomainControllerInterface {
  handleDomainDataAction(action:DomainDataAction):Promise<void>;
  handleDomainModelAction(action:DomainModelAction, currentModel?:MiroirMetaModel):Promise<void>;
  handleDomainAction(action:DomainAction, currentModel?:MiroirMetaModel):Promise<void>;
  // currentTransaction():DomainModelEntityUpdateAction[];
  currentTransaction():DomainModelReplayableAction[];
  currentLocalCacheInfo(): LocalCacheInfo;
}
