import { EntityDefinition } from '../../1_core/EntityDefinition.js';
import { Instance, InstanceCollection } from '../../../0_interfaces/1_core/Instance.js';
import { MError } from '../../../0_interfaces/3_controllers/ErrorLogServiceInterface.js';
// import { EntityDefinition } from 'src/0_interfaces/1_core/EntityDefinition.js';
// import { Instance, InstanceCollection } from 'src/0_interfaces/1_core/Instance.js';
// import { MError } from 'src/0_interfaces/3_controllers/ErrorLogServiceInterface.js';

export default {}

export interface StoreReturnType {
  status:'ok'|'error',
  errorMessage?:string, 
  error?:MError,
  instances?: InstanceCollection[]
};


export interface EntityDefinitionLocalStoreInputActionsI {
  // addEntityDefinitions(entityDefinitions:EntityDefinition[]):Promise<void>;
  replaceAllEntityDefinitions(entityDefinitions:EntityDefinition[]):Promise<StoreReturnType>;
  // handleAction(action:DomainAction):Promise<StoreReturnType>;
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
