import { Instance } from "../../0_interfaces/1_core/Instance.js";
// import { Instance } from "src/0_interfaces/1_core/Instance";

export const domainActionNamesObject = {
  'create': 'create',
  'read': 'read',
  'update': 'update',
  'delete': 'delete',
  'replace': 'replace',
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
  action: DomainActionName;
  entityName: string;
  uuid?:string;
  objects?:Instance[];
}