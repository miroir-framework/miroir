import { InstanceCollection } from "../../0_interfaces/1_core/Instance.js";
import { RemoteStoreActionNamesObject } from "../../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface.js";
// import { Instance } from "src/0_interfaces/1_core/Instance";


export const domainActionNamesObject = {
  // 'create': 'create',
  // 'read': 'read',
  // 'update': 'update',
  // 'delete': 'delete',
  ...RemoteStoreActionNamesObject,
  'replace': 'replace', // for local storage
  // 'getRemoteEntityDefinitionList':'getRemoteEntityDefinitionList',
  // 'addEntityDefinition':'addEntityDefinition',
  // 'removeEntityDefinition':'removeEntityDefinition',
  // 'updateEntityDefinition':'updateEntityDefinition',
  // 'getRemoteInstanceList':'getRemoteInstanceList',
  // 'addInstance':'addInstance',
  // 'removeInstance':'removeInstance',
  // 'updateInstance':'updateInstance',
};
export type DomainActionName = keyof typeof domainActionNamesObject;
export const domainActionNamesArray:DomainActionName[] = Object.keys(domainActionNamesObject) as DomainActionName[];


export interface DomainAction {
  actionName: DomainActionName;
  entityName?: string;
  uuid?:string;
  // objects?:Instance[]|InstanceCollection[];
  objects?:InstanceCollection[];
}