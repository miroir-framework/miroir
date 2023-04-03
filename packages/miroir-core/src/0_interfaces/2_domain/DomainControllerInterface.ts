import { MiroirModel } from "../../0_interfaces/1_core/ModelInterface.js";
import { ModelStructureUpdate, ModelUpdateWithCUDUpdate } from "../../0_interfaces/2_domain/ModelUpdateInterface.js";
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
export const localCacheOnlyActionNamesObject = {
  'undo': 'undo',
  'redo': 'redo',
  'replace': 'replace', // to refresh data in local storage
  // 'commit': 'commit', // to commit currently existing transactions present in local storage. Remote storage is updated upon commit.
}
export type LocalCacheOnlyActionName = keyof typeof localCacheOnlyActionNamesObject;
export const localCacheOnlyActionNamesArray:LocalCacheOnlyActionName[] = Object.keys(localCacheOnlyActionNamesObject) as LocalCacheOnlyActionName[];


// #############################################################################################
export const ModelStructureUpdateActionNamesObject = {
  'resetModel': 'resetModel', // to delete all DB contents. DANGEROUS. TEMPORARY?
  'updateModel': 'updateModel',
}
export type ModelStructureUpdateActionName = keyof typeof ModelStructureUpdateActionNamesObject;
export const ModelStructureUpdateActionNamesArray:ModelStructureUpdateActionName[] = Object.keys(ModelStructureUpdateActionNamesObject) as ModelStructureUpdateActionName[];
export const ModelStructureUpdateActionNamesArrayString:string[] = ModelStructureUpdateActionNamesArray.map(a=>a);

// #############################################################################################
export const domainModelUpdateActionNamesObject = {
  // ...CUDActionNamesObject,
  ...localCacheOnlyActionNamesObject,
};
export type DomainModelUpdateActionName = keyof typeof domainModelUpdateActionNamesObject;
export const domainModelUpdateActionNamesArray:DomainModelUpdateActionName[] = Object.keys(domainModelUpdateActionNamesObject) as DomainModelUpdateActionName[];

// #############################################################################################
export interface DomainDataAction {
  actionType:'DomainDataAction';
  actionName: CUDActionName;
  steps?:number; // for undo / redo
  uuid?:string;
  objects?:InstanceCollection[];
}


export interface DomainModelStructureUpdateAction {
  actionType:'DomainModelAction',
  actionName: ModelStructureUpdateActionName;
  // updates?:ModelStructureUpdate[];
  update?:ModelUpdateWithCUDUpdate;
  // updates?:ModelUpdate[];
}

export interface DomainModelCUDAction {
  actionType:'DomainModelAction',
  actionName: DomainModelUpdateActionName;
  objects?:InstanceCollection[];
}


export interface DomainModelCommitAction {
  actionType:'DomainModelAction',
  actionName: 'commit';
  label?: string;
  // objects?:InstanceCollection[]; // for "replace" action only. To separate, for clarification?
}

export interface DomainModelLocalCacheAndTransactionAction {
  actionType:'DomainModelAction',
  actionName: LocalCacheOnlyActionName;
  objects?:InstanceCollection[]; // for "replace" action only. To separate, for clarification?
}

export type DomainModelAction =
    DomainModelCommitAction
  | DomainModelStructureUpdateAction
  | DomainModelCUDAction
  | DomainModelLocalCacheAndTransactionAction;

// #############################################################################################
export const remoteStoreActionNamesObject = {
  ...CRUDActionNamesObject,
  ...ModelStructureUpdateActionNamesObject,
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
  currentTransaction():DomainModelAction[];
  currentLocalCacheInfo(): LocalCacheInfo;
}
