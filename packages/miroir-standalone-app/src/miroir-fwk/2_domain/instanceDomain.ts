import { InstanceLocalStoreInputActionsI } from 'miroir-core';
import { Instance } from 'miroir-core';
import { MInstanceDomainInputActionsI } from 'miroir-core';

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