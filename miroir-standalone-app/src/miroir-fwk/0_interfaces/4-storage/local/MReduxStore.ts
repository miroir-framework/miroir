import { Minstance } from "src/miroir-fwk/0_interfaces/1_core/Instance";

export interface MInstanceStoreInputActionsI {
  addInstancesForEntity(entityName:string,instances:Minstance[]):void;
  modifyInstancesForEntity(entityName:string,instances:Minstance[]):void;
  fetchFromApiAndReplaceInstancesForEntity(entityName:string):void;
  fetchFromApiAndReplaceInstancesForAllEntities():void;

  // replaceInstancesForEntity(entityName:string,instances:Minstance[]):void;
}

/**
 * Decorator to the Redux Store, handing specific Miroir entity slices
 */
export declare interface MreduxStoreI extends MInstanceStoreInputActionsI{
  run():void;

  // entitySagasObject: EntitySagas,
  // instanceSagasObject: InstanceSagas,
  // instanceStore: MInstanceStoreInputActionsI;
  // dispatch(a:any): any;
}
