import { LocalStoreInterface } from "src/0_interfaces/4-services/localStore/LocalStoreInterface";
import { Instance } from "src/0_interfaces/1_core/Instance";
import { InstanceDomainInputActionsInterface } from "src/0_interfaces/2_domain/instanceDomainInterface";

export class InstanceDomain implements InstanceDomainInputActionsInterface {
  constructor(
    private store:LocalStoreInterface
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