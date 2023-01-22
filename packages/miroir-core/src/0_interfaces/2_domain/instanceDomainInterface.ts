// import { EntityDefinition } from 'miroir-core';
// import { Instance } from 'miroir-core';

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

export default {}