import { InstanceCollection } from "../../0_interfaces/1_core/Instance.js";
import { RemoteStoreActionNamesObject } from "../../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface.js";


export const domainActionNamesObject = {
  ...RemoteStoreActionNamesObject,
  'replace': 'replace', // for local storage
};
export type DomainActionName = keyof typeof domainActionNamesObject;
export const domainActionNamesArray:DomainActionName[] = Object.keys(domainActionNamesObject) as DomainActionName[];


export interface DomainAction {
  actionName: DomainActionName;
  entityName?: string;
  uuid?:string;
  objects?:InstanceCollection[];
}