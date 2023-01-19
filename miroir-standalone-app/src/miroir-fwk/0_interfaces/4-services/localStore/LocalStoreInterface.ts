import { EntityDefinition } from "src/miroir-fwk/0_interfaces/1_core/Entity";
import { Instance, InstanceCollection } from "src/miroir-fwk/0_interfaces/1_core/Instance";
import { MError } from "src/miroir-fwk/0_interfaces/4-view/ErrorLogServiceInterface";


export interface StoreReturnType {
  status:'ok'|'error',
  errorMessage?:string, 
  error?:MError,
  instances?: InstanceCollection[]
};


export interface EntityDefinitionLocalStoreInputActionsI {
  // addEntityDefinitions(entityDefinitions:EntityDefinition[]):Promise<void>;
  replaceAllEntityDefinitions(entityDefinitions:EntityDefinition[]):Promise<StoreReturnType>;
  // modifyEntityDefinitions(entityDefinitions:EntityDefinition[]):Promise<void>;
  //
  // replaceEntityDefinitions(entityDefinitions:EntityDefinition[]):Promise<void>;
  // addEntityDefinition(entityDefinition:EntityDefinition):void;
  // fetchFromApiAndReplaceEntityDefinitions(entityName:string):Promise<void>;
  // fetchFromApiAndReplaceAllEntityDefinitions():Promise<void>;
}

export interface InstanceLocalStoreInputActionsI {
  addInstancesForEntity(entityName:string,instances:Instance[]):void;
  modifyInstancesForEntity(entityName:string,instances:Instance[]):void;
  replaceAllInstances(instances:InstanceCollection[]):Promise<void>;
  // fetchFromApiAndReplaceInstancesForEntity(entityName:string):void;
  // fetchInstancesFromDatastoreForEntityList(entities:EntityDefinition[]):void;
  // // fetchFromApiAndReplaceInstancesForAllEntities():void;
  // fetchAllEntityDefinitionsFromRemoteDataStore():Promise<EntityDefinition[]>;
  // fetchFromApiAndReplaceInstancesForAllEntities():EntityDefinition[];
}

/**
 * Decorator to the Redux Store, handing specific Miroir entity slices
 */
export declare interface LocalStoreInterface extends 
  EntityDefinitionLocalStoreInputActionsI,
  InstanceLocalStoreInputActionsI
{
  // constructor
  run(): void;
  getInnerStore(): any; // TODO: local store should not expose its implementation!!
}
