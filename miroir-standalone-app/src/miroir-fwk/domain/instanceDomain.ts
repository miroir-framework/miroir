import { Minstance } from "../core/Instance";
import { MdomainInstanceInputActionsI, MStoreInstanceInputActionsI } from "./store";

export class InstanceDomain implements MdomainInstanceInputActionsI {
  constructor(
    private store:MStoreInstanceInputActionsI
  ){

  }

  addInstancesForEntity(entityName:string,instances:Minstance[]):void{
    this.store.addInstancesForEntity(entityName,instances);
  };
  modifyInstancesForEntity(entityName:string,instances:Minstance[]):void {
    this.store.modifyInstancesForEntity(entityName,instances);
  };
  replaceInstancesForEntity(entityName:string,instances:Minstance[]):void {
    this.store.replaceInstancesForEntity(entityName,instances);
  };

}