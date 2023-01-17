import { EntityDefinition } from "src/miroir-fwk/0_interfaces/1_core/Entity";
import { StoreReturnType } from "src/miroir-fwk/0_interfaces/4-storage/local/LocalStoreInterface";
import { InstanceActionPayload } from "src/miroir-fwk/4_storage/local/InstanceSlice";


export interface EntityDefinitionRemoteDataStoreInputActionsI {
  // fetchEntityDefinitionFromRemoteDataStore(entityName:string):Promise<EntityDefinition>;
  // fetchEntityDefinitionsFromRemoteDataStore():Promise<EntityDefinition[]>;
  fetchAllEntityDefinitionsFromRemoteDataStore():Promise<StoreReturnType>;
}

export interface InstanceRemoteDataStoreInputActionsI {
  // fetchFromApiAndReplaceInstancesForEntity(entityName:string):void;
  fetchInstancesForEntityListFromRemoteDatastore(entities:EntityDefinition[]):Promise<InstanceActionPayload[]>;
}

/**
 * Decorator to the Redux Store, handing specific Miroir entity slices
 */
export declare interface RemoteDataStoreInterface extends 
  EntityDefinitionRemoteDataStoreInputActionsI,
  InstanceRemoteDataStoreInputActionsI
{
  // constructor
  // run(): void;
  // getInnerStore(): any; // TODO: local store should not expose its implementation!!
}
