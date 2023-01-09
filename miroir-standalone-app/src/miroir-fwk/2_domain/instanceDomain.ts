import { MInstanceStoreInputActionsI } from "src/miroir-fwk/0_interfaces/4-storage/local/MLocalStoreI";
import { Minstance } from "src/miroir-fwk/0_interfaces/1_core/Instance";
import { MInstanceDomainInputActionsI } from "src/miroir-fwk/0_interfaces/2_domain/instanceDomainI";

export class InstanceDomain implements MInstanceDomainInputActionsI {
  constructor(
    private store:MInstanceStoreInputActionsI
  ){

  }

  addInstancesForEntity(entityName:string,instances:Minstance[]):void{
    this.store.addInstancesForEntity(entityName,instances);
  };
  modifyInstancesForEntity(entityName:string,instances:Minstance[]):void {
    this.store.modifyInstancesForEntity(entityName,instances);
  };
  // replaceInstancesForEntity(entityName:string,instances:Minstance[]):void {
  //   this.store.replaceInstancesForEntity(entityName,instances);
  // };

}