import { LocalCacheInfo } from "../../0_interfaces/4-services/localCache/LocalCacheInterface.js";
import { Instance, InstanceCollection } from "../1_core/Instance.js";

export const CRUDActionNamesObject = {
  'create': 'create',
  'read': 'read',
  'update': 'update',
  'delete': 'delete',
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
export const localCacheOnlyActionNamesArray:DomainActionName[] = Object.keys(localCacheOnlyActionNamesObject) as DomainActionName[];


export const remoteStoreOnlyActionNamesObject = {
  'resetModel': 'resetModel', // to delete all DB contents. TEMPORARY.
}
export type RemoteStoreOnlyActionName = keyof typeof remoteStoreOnlyActionNamesObject;
export const remoteStoreOnlyActionNamesArray:DomainActionName[] = Object.keys(remoteStoreOnlyActionNamesObject) as DomainActionName[];

export const remoteStoreActionNamesObject = {
  ...CRUDActionNamesObject,
  ...remoteStoreOnlyActionNamesObject,
}
export type RemoteStoreActionName = keyof typeof remoteStoreActionNamesObject;
export const remoteStoreActionNamesArray:DomainActionName[] = Object.keys(remoteStoreActionNamesObject) as DomainActionName[];


export const domainActionNamesObject = {
  ...CRUDActionNamesObject,
  ...localCacheOnlyActionNamesObject,
  ...remoteStoreOnlyActionNamesObject,
};
export type DomainActionName = keyof typeof domainActionNamesObject;
export const domainActionNamesArray:DomainActionName[] = Object.keys(domainActionNamesObject) as DomainActionName[];

export function domainActionToCRUDAction(domainActionName:DomainActionName):CRUDActionName{
  if (domainActionName in CRUDActionNamesArray) {
    return domainActionName as CRUDActionName
  } else {
    return undefined;
  }
}
export interface DomainAction {
  actionName: DomainActionName;
  steps?:number; // for undo / redo
  uuid?:string;
  objects?:InstanceCollection[];
}

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
  handleDomainAction(action:DomainAction):Promise<void>;
  currentTransaction():DomainAction[];
  currentLocalCacheInfo(): LocalCacheInfo;
}
