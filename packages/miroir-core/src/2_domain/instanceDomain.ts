import { Instance } from "../0_interfaces/1_core/Instance";
import { InstanceDomainInputActionsInterface } from "../0_interfaces/2_domain/instanceDomainInterface";
import { DataController } from "../3_controllers/DataController";

/**
 * domain level contains "business" logic related to concepts defined whithin the
 * application: entities, reports, reducers, users, etc.
 * example: get the list of reports accessible by a given user.
 */
export class InstanceDomain implements InstanceDomainInputActionsInterface {
  constructor(
    // private store:LocalStoreInterface
    private dataController: DataController
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