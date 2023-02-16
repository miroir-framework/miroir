import { InstanceCollection } from "../../0_interfaces/1_core/Instance.js";

export const CRUDActionNamesObject = {
  'create': 'create',
  'read': 'read',
  'update': 'update',
  'delete': 'delete',
}
export type CRUDActionName = keyof typeof CRUDActionNamesObject;
export const CRUDActionNamesArray:CRUDActionName[] = Object.keys(CRUDActionNamesObject) as CRUDActionName[];

export const domainActionNamesObject = {
  ...CRUDActionNamesObject,
  'replace': 'replace', // to refresh data in local storage
  'commit': 'commit', // to commit currently existing transactions present in local storage. Remote storage is updated upon commit.
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
  // entityName?: string;
  uuid?:string;
  objects?:InstanceCollection[];
}