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

export const CRUDActionNamesObject = {
  ...CUDActionNamesObject,
  'read': 'read',
}
export type CRUDActionName = keyof typeof CRUDActionNamesObject;
export const CRUDActionNamesArray:CRUDActionName[] = Object.keys(CRUDActionNamesObject) as CRUDActionName[];
export const CRUDActionNamesArrayString:string[] = CRUDActionNamesArray.map(a=>a);


export const localCacheOnlyActionNamesObject = {
  'undo': 'undo',
  'redo': 'redo',
  'replace': 'replace', // to refresh data in local storage
  'commit': 'commit', // to commit currently existing transactions present in local storage. Remote storage is updated upon commit.
}
export type LocalCacheOnlyActionName = keyof typeof localCacheOnlyActionNamesObject;
export const localCacheOnlyActionNamesArray:LocalCacheOnlyActionName[] = Object.keys(localCacheOnlyActionNamesObject) as LocalCacheOnlyActionName[];


export const ModelActionNamesObject = {
  // 'resetModel': 'resetModel', // to delete all DB contents. TEMPORARY.
  'updateModel': 'updateModel',
}
export type ModelActionName = keyof typeof ModelActionNamesObject;
export const ModelActionNamesArray:RemoteStoreActionName[] = Object.keys(ModelActionNamesObject) as ModelActionName[];
export const ModelActionNamesArrayString:string[] = ModelActionNamesArray.map(a=>a);

export const remoteStoreActionNamesObject = {
  ...CRUDActionNamesObject,
  ...ModelActionNamesObject,
}
export type RemoteStoreActionName = keyof typeof remoteStoreActionNamesObject;
export const remoteStoreActionNamesArray:RemoteStoreActionName[] = Object.keys(remoteStoreActionNamesObject) as RemoteStoreActionName[];


export const domainDataActionNamesObject = {
  ...CRUDActionNamesObject,
  // ...localCacheOnlyActionNamesObject,
  // ...ModelActionNamesObject,
};
export type DomainDataActionName = keyof typeof domainDataActionNamesObject;
export const domainDataActionNamesArray:DomainDataActionName[] = Object.keys(domainDataActionNamesObject) as DomainDataActionName[];

export const domainModelActionNamesObject = {
  ...CUDActionNamesObject,
  ...localCacheOnlyActionNamesObject,
  ...ModelActionNamesObject,
};
export type DomainModelActionName = keyof typeof domainModelActionNamesObject;
export const domainModelActionNamesArray:DomainModelActionName[] = Object.keys(domainModelActionNamesObject) as DomainModelActionName[];

// export function domainActionToCRUDAction(domainActionName:DomainDataActionName):CRUDActionName{
//   if (domainActionName in CRUDActionNamesArray) {
//     return domainActionName as CRUDActionName
//   } else {
//     return undefined;
//   }
// }
export interface DomainDataAction {
  actionType:'DomainDataAction',
  actionName: DomainDataActionName;
  steps?:number; // for undo / redo
  uuid?:string;
  objects?:InstanceCollection[];
}

export interface DomainModelAction {
  actionType:'DomainModelAction',
  actionName: DomainModelActionName;
  objects?:InstanceCollection[];
  updates?:any[];
}

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
  handleDomainModelAction(action:DomainModelAction):Promise<void>;
  currentTransaction():DomainModelAction[];
  currentLocalCacheInfo(): LocalCacheInfo;
}
