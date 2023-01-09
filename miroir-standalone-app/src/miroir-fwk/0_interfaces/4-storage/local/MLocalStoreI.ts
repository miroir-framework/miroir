import { MEntityDefinition } from "src/miroir-fwk/0_interfaces/1_core/Entity";
import { Minstance } from "src/miroir-fwk/0_interfaces/1_core/Instance";

function stringTuple<T extends [string] | string[]>(...data: T): T {
  return data;
}


const EntitySagaOutputActionNames = stringTuple(
  'allMEntitiesHaveBeenStored',
);
export type EntitySagaOutputActionTypeString = typeof EntitySagaOutputActionNames[number];

export const StatusTypeStringValues:string[] = stringTuple('OK', 'Fail');
export type StatusTypeString = typeof StatusTypeStringValues[number];

export const LocalStoreEventTypeStringValues:string[] = stringTuple(
  ...EntitySagaOutputActionNames
);
export type LocalStoreEventTypeString = typeof StatusTypeStringValues[number];

export interface MLocalStoreEvent<T> {
  eventName:LocalStoreEventTypeString, status: StatusTypeString, param?:T
}

export interface MLocalStoreObserver {
  notify(localStoreEvent:MLocalStoreEvent<any>):void;
}

export interface MEntityDefinitionStoreInputActionsI {
  addEntityDefinition(entityName:string,instances:Minstance[]):void;
  modifyEntityDefinition(entityName:string,instances:Minstance[]):void;
  fetchFromApiAndReplaceEntityDefinitions(entityName:string):void;
  fetchFromApiAndReplaceAllEntityDefinitions():void;
}

export interface MInstanceStoreInputActionsI {
  addInstancesForEntity(entityName:string,instances:Minstance[]):void;
  modifyInstancesForEntity(entityName:string,instances:Minstance[]):void;
  fetchFromApiAndReplaceInstancesForEntity(entityName:string):void;
  fetchInstancesFromDatastoreForEntityList(entities:MEntityDefinition[]):void;
  fetchFromApiAndReplaceInstancesForAllEntities():void;
}

/**
 * Decorator to the Redux Store, handing specific Miroir entity slices
 */
export declare interface MLocalStoreI extends MInstanceStoreInputActionsI{
  // constructor
  run():void;
  getInnerStore():any; // TODO: local store should not expose its implementation!!
  listenerSubscribe(listener:MLocalStoreObserver);
  listenerUnsubscribe(listener:MLocalStoreObserver);
}
