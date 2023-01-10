import { MEntityDefinition } from "src/miroir-fwk/0_interfaces/1_core/Entity";
import { Minstance } from "src/miroir-fwk/0_interfaces/1_core/Instance";
import { Event, Observer } from "src/miroir-fwk/1_core/utils/EventManager";
import { stringTuple } from "src/miroir-fwk/1_core/utils/utils";



const EntitySagaOutputActionNames = stringTuple(
  'allMEntitiesHaveBeenStored',
);
export type EntitySagaOutputActionTypeString = typeof EntitySagaOutputActionNames[number];


export const LocalStoreEventTypeStringValues:string[] = stringTuple(
  ...EntitySagaOutputActionNames
);
export type LocalStoreEventTypeString = typeof LocalStoreEventTypeStringValues[number];

export type LocalStoreEvent = Event<LocalStoreEventTypeString,any>
// export interface MLocalStoreObserver<T> {
//   dispatch(localStoreEvent:Event<LocalStoreEventTypeString, T>):void;
// }


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
export declare interface LocalStoreInterface extends MInstanceStoreInputActionsI{
  // constructor
  run():void;
  getInnerStore():any; // TODO: local store should not expose its implementation!!
  observerSubscribe(observer:Observer<LocalStoreEvent>);
  observerUnsubscribe(observer:Observer<LocalStoreEvent>);
}
