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
export const localCacheOnlyActionNamesArray:DomainCRUDActionName[] = Object.keys(localCacheOnlyActionNamesObject) as DomainCRUDActionName[];


export const remoteStoreOnlyActionNamesObject = {
  'resetModel': 'resetModel', // to delete all DB contents. TEMPORARY.
}
export type RemoteStoreOnlyActionName = keyof typeof remoteStoreOnlyActionNamesObject;
export const remoteStoreOnlyActionNamesArray:DomainCRUDActionName[] = Object.keys(remoteStoreOnlyActionNamesObject) as DomainCRUDActionName[];

export const remoteStoreActionNamesObject = {
  ...CRUDActionNamesObject,
  ...remoteStoreOnlyActionNamesObject,
}
export type RemoteStoreActionName = keyof typeof remoteStoreActionNamesObject;
export const remoteStoreActionNamesArray:DomainCRUDActionName[] = Object.keys(remoteStoreActionNamesObject) as DomainCRUDActionName[];


export const domainActionNamesObject = {
  ...CRUDActionNamesObject,
  ...localCacheOnlyActionNamesObject,
  ...remoteStoreOnlyActionNamesObject,
};
export type DomainCRUDActionName = keyof typeof domainActionNamesObject;
export const domainActionNamesArray:DomainCRUDActionName[] = Object.keys(domainActionNamesObject) as DomainCRUDActionName[];

// export function domainActionToCRUDAction(domainActionName:DomainCRUDActionName):CRUDActionName{
//   if (domainActionName in CRUDActionNamesArray) {
//     return domainActionName as CRUDActionName
//   } else {
//     return undefined;
//   }
// }
export interface DomainCRUDAction {
  actionName: DomainCRUDActionName;
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
  handleDomainCRUDAction(action:DomainCRUDAction):Promise<void>;
  currentTransaction():DomainCRUDAction[];
  currentLocalCacheInfo(): LocalCacheInfo;
}
