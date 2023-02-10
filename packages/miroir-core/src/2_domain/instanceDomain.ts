import { Instance } from "../0_interfaces/1_core/Instance";
import { InstanceDomainInputActionsInterface } from "../0_interfaces/2_domain/instanceDomainInterface";
import { InstanceLocalStoreInputActionsI } from "../0_interfaces/4-services/localStore/LocalStoreInterface";

export class InstanceDomain implements InstanceDomainInputActionsInterface {
  constructor(
    private store:InstanceLocalStoreInputActionsI
  ){

  }

  addInstancesForEntity(entityName:string,instances:Instance[]):void{
    // this.store.addInstancesForEntity(entityName,instances);
  };
  modifyInstancesForEntity(entityName:string,instances:Instance[]):void {
    // this.store.modifyInstancesForEntity(entityName,instances);
  };
  // replaceInstancesForEntity(entityName:string,instances:Minstance[]):void {
  //   this.store.replaceInstancesForEntity(entityName,instances);
  // };

}