import { EntityDefinition } from "src/miroir-fwk/0_interfaces/1_core/Entity";
import { Minstance } from "src/miroir-fwk/0_interfaces/1_core/Instance";

export interface MInstanceDomainInputActionsI {
  addInstancesForEntity(entityName:string,instances:Minstance[]):void;
  modifyInstancesForEntity(entityName:string,instances:Minstance[]):void;
}



export interface MEntityDomainInputActionsI {
  // addInstancesForEntity(entityName:string,instances:Minstance[]):void;
  // modifyInstancesForEntity(entityName:string,instances:Minstance[]):void;
  replaceEntities(entities:EntityDefinition[]):void;
}
