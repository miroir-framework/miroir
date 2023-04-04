import { MiroirModel } from "../../0_interfaces/1_core/ModelInterface.js";
import { ModelCUDUpdate, ModelEntityUpdate, ModelEntityUpdateWithCUDUpdate } from "../../0_interfaces/2_domain/ModelUpdateInterface.js";
import { LocalCacheInfo } from "../../0_interfaces/4-services/localCache/LocalCacheInterface.js";
import { Instance, InstanceCollection } from "../1_core/Instance.js";

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
  'updateModel': 'updateModel',
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
  objects?:InstanceCollection[];
}


export interface DomainModelEntityUpdateAction {
  actionType:'DomainModelAction',
  actionName: 'updateModel'//`${ModelEntityUpdateActionNamesObject.updateModel}`;
  // actionName: `${ModelEntityUpdateActionNamesObject.updateModel}`;
  update?:ModelEntityUpdateWithCUDUpdate;
}

export interface DomainModelCUDAction {
  actionType:'DomainModelAction',
  actionName: 'CUDupdateModel';
  // objects?:InstanceCollection[];
  update?: ModelCUDUpdate;
}

export type DomainModelReplayableAction = 
  | DomainModelEntityUpdateAction
  | DomainModelCUDAction
;

export interface DomainModelUndoRedoAction {
  actionType:'DomainModelAction',
  actionName: UndoRedoActionName;
  objects?:InstanceCollection[];
}

export interface DomainModelCommitAction {
  actionType:'DomainModelAction',
  actionName: 'commit';
  label?: string;
}

export interface DomainModelRollbackAction {
  actionType:'DomainModelAction',
  actionName: 'replace';
  objects?:InstanceCollection[];
}

export interface DomainModelLocalCacheAndTransactionAction {
  actionType:'DomainModelAction',
  actionName: UndoRedoActionName;
  // objects?:InstanceCollection[]; // for "replace" action only. To separate, for clarification?
}

export interface DomainModelResetAction {
  actionType:'DomainModelAction',
  actionName: 'resetModel';
}

export type DomainModelAction =
  | DomainModelReplayableAction
  | DomainModelCommitAction
  | DomainModelRollbackAction
  | DomainModelUndoRedoAction
  | DomainModelResetAction
  | DomainModelLocalCacheAndTransactionAction;

// #############################################################################################
export const remoteStoreActionNamesObject = {
  ...CRUDActionNamesObject,
  ...ModelEntityUpdateActionNamesObject,
}
export type RemoteStoreActionName = keyof typeof remoteStoreActionNamesObject;
export const remoteStoreActionNamesArray:RemoteStoreActionName[] = Object.keys(remoteStoreActionNamesObject) as RemoteStoreActionName[];


// #############################################################################################
export type DomainAction = DomainDataAction | DomainModelAction;

export interface DomainInstancesUuidIndex {
  [uuid: string]: Instance
}
export interface DomainState {
  [propName: string]: DomainInstancesUuidIndex;
}

export type DomainStateTransformer=(domainState:DomainState)=>DomainState
export type DomainStateSelector=(domainState:DomainState)=>Instance[]
export type DomainStateReducer=(domainState:DomainState)=>any

export interface DomainControllerInterface {
  handleDomainDataAction(action:DomainDataAction):Promise<void>;
  handleDomainModelAction(action:DomainModelAction, currentModel?:MiroirModel):Promise<void>;
  handleDomainAction(action:DomainAction, currentModel?:MiroirModel):Promise<void>;
  // currentTransaction():DomainModelEntityUpdateAction[];
  currentTransaction():DomainModelReplayableAction[];
  currentLocalCacheInfo(): LocalCacheInfo;
}
