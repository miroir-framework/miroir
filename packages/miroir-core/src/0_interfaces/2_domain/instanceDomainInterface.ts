// import { EntityDefinition } from "src/miroir-fwk/0_interfaces/1_core/Entity";
// import { Instance } from "src/miroir-fwk/0_interfaces/1_core/Instance";

export interface MInstanceDomainInputActionsI {
  addInstancesForEntity(entityName:string,instances:any[]):void;
  modifyInstancesForEntity(entityName:string,instances:any[]):void;
  // addInstancesForEntity(entityName:string,instances:Instance[]):void;
  // modifyInstancesForEntity(entityName:string,instances:Instance[]):void;
}



export interface MEntityDomainInputActionsI {
  // addInstancesForEntity(entityName:string,instances:Minstance[]):void;
  // modifyInstancesForEntity(entityName:string,instances:Minstance[]):void;
  replaceEntities(entities:any[]):void;
  // replaceEntities(entities:EntityDefinition[]):void;
}
