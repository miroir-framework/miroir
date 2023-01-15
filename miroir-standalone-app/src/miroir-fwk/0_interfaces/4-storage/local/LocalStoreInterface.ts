import { EntityDefinition } from "src/miroir-fwk/0_interfaces/1_core/Entity";
import { Minstance } from "src/miroir-fwk/0_interfaces/1_core/Instance";
import { Event, EventManagerSubscribeInterface } from "src/miroir-fwk/1_core/utils/EventManager";
import { EntitySagaOutputActionTypeString } from "src/miroir-fwk/4_storage/remote/EntitySagas";
import { instanceSagaOutputActionTypeString } from "src/miroir-fwk/4_storage/remote/InstanceSagas";

export type LocalStoreEventTypeString = EntitySagaOutputActionTypeString | instanceSagaOutputActionTypeString;

export type LocalStoreEvent = Event<LocalStoreEventTypeString,any>


export interface EntityDefinitionLocalStoreInputActionsI {
  addEntityDefinition(entityName:string,instances:Minstance[]):void;
  modifyEntityDefinition(entityName:string,instances:Minstance[]):void;
  fetchFromApiAndReplaceEntityDefinitions(entityName:string):void;
  fetchFromApiAndReplaceAllEntityDefinitions():void;
}

export interface InstanceLocalStoreInputActionsI {
  addInstancesForEntity(entityName:string,instances:Minstance[]):void;
  modifyInstancesForEntity(entityName:string,instances:Minstance[]):void;
  fetchFromApiAndReplaceInstancesForEntity(entityName:string):void;
  fetchInstancesFromDatastoreForEntityList(entities:EntityDefinition[]):void;
  // fetchFromApiAndReplaceInstancesForAllEntities():void;
  fetchAllEntityDefinitionsFromRemoteDataStore():Promise<EntityDefinition[]>;
  // fetchFromApiAndReplaceInstancesForAllEntities():EntityDefinition[];
}

/**
 * Decorator to the Redux Store, handing specific Miroir entity slices
 */
export declare interface LocalStoreInterface
  extends InstanceLocalStoreInputActionsI,
    EventManagerSubscribeInterface<LocalStoreEvent,LocalStoreEventTypeString> 
{
  // constructor
  run(): void;
  getInnerStore(): any; // TODO: local store should not expose its implementation!!
}
