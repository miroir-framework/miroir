import { InstanceCollection } from "../0_interfaces/1_core/Instance.js";
import { DataControllerInterface } from "../0_interfaces/3_controllers/DataControllerInterface.js";
import { MError } from "../0_interfaces/3_controllers/ErrorLogServiceInterface.js";
import { LocalStoreInterface } from "../0_interfaces/4-services/localStore/LocalStoreInterface.js";
import { RemoteDataStoreInterface } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface.js";
import { throwExceptionIfError } from "../3_controllers/ErrorUtils.js";

export default {}

/**
 * controller should allow configuration of local storage / external storage balance.
 * when data is fetched / purged from local storage.
 * use asynchrony or saga-like implementation for data controller, instead of notifications?
 * allow monitoring of local storage resources.
 */
export class LocalDataStoreController implements DataControllerInterface {

  constructor(
    // private errorLog: ErrorLogServiceInterface,
    private localStore: LocalStoreInterface,
    private remoteStore: RemoteDataStoreInterface,
    private pushError:(error:MError)=>void,
    // private getErrorLog:()=>MError[]
  ) {}

  public async loadConfigurationFromRemoteDataStore() {
    try {
      // console.log("LocalDataStoreController loadConfigurationFromRemoteDataStore");
      // const storeEntities:StoreReturnType = await throwExceptionIfError(pushError, this.remoteStore.fetchAllEntityDefinitionsFromRemoteDataStore,this.remoteStore);
      // const entities:InstanceCollection[] = storeEntities.instances;
      // const entities:InstanceCollection[] = (await this.remoteStore.fetchAllEntityDefinitionsFromRemoteDataStore()).instances;
      const entities: InstanceCollection[] = await throwExceptionIfError(
        this.pushError,
        this.remoteStore.fetchAllEntityDefinitionsFromRemoteDataStore,
        this.remoteStore
      );
      console.log("LocalDataStoreController loadConfigurationFromRemoteDataStore entities", entities);
      const instances: InstanceCollection[] = await throwExceptionIfError(
        this.pushError,
        this.remoteStore.fetchInstancesForEntityListFromRemoteDatastore,
        this.remoteStore,
        entities[0].instances
      );
      console.log("LocalDataStoreController loadConfigurationFromRemoteDataStore instances", instances);
      await this.localStore.replaceAllInstances(instances);
      return;
    } catch (error) {
      console.warn("LocalDataStoreController loadConfigurationFromRemoteDataStore", error);
    }
  }
}
