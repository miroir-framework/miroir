import { InstanceLocalStoreInputActionsI } from "src/miroir-fwk/0_interfaces/4-storage/local/LocalStoreInterface";
import { Instance } from "src/miroir-fwk/0_interfaces/1_core/Instance";
import { MInstanceDomainInputActionsI } from "src/miroir-fwk/0_interfaces/2_domain/instanceDomainInterface";

export class InstanceDomain implements MInstanceDomainInputActionsI {
  constructor(
    private store:InstanceLocalStoreInputActionsI
  ){

  }

  addInstancesForEntity(entityName:string,instances:Instance[]):void{
    this.store.addInstancesForEntity(entityName,instances);
  };
  modifyInstancesForEntity(entityName:string,instances:Instance[]):void {
    this.store.modifyInstancesForEntity(entityName,instances);
  };
  // replaceInstancesForEntity(entityName:string,instances:Minstance[]):void {
  //   this.store.replaceInstancesForEntity(entityName,instances);
  // };

}