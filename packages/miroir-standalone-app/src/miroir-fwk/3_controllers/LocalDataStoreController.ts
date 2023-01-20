import { InstanceCollection } from 'src/miroir-fwk/0_interfaces/1_core/Instance';
import { DataControllerInterface } from 'src/miroir-fwk/0_interfaces/3_controllers/DataControllerInterface';
import { LocalStoreInterface, StoreReturnType } from 'src/miroir-fwk/0_interfaces/4-services/localStore/LocalStoreInterface';
import { RemoteDataStoreInterface } from 'src/miroir-fwk/0_interfaces/4-services/remoteStore/RemoteDataStoreInterface';
import { throwExceptionIfError } from 'src/miroir-fwk/3_controllers/ErrorUtils';
import { pushError } from "src/miroir-fwk/3_controllers/ErrorLogService";

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
  ) {
  }

  public async loadConfigurationFromRemoteDataStore() {
    try {
        // console.log("LocalDataStoreController loadConfigurationFromRemoteDataStore");
        // const storeEntities:StoreReturnType = await throwExceptionIfError(pushError, this.remoteStore.fetchAllEntityDefinitionsFromRemoteDataStore,this.remoteStore);
        // const entities:InstanceCollection[] = storeEntities.instances;
        // const entities:InstanceCollection[] = (await this.remoteStore.fetchAllEntityDefinitionsFromRemoteDataStore()).instances;
        const entities:InstanceCollection[] = await throwExceptionIfError(pushError, this.remoteStore.fetchAllEntityDefinitionsFromRemoteDataStore,this.remoteStore);
        console.log("LocalDataStoreController loadConfigurationFromRemoteDataStore entities",entities);
        const instances:InstanceCollection[] = await throwExceptionIfError(pushError, this.remoteStore.fetchInstancesForEntityListFromRemoteDatastore,this.remoteStore,entities[0].instances);
        console.log("LocalDataStoreController loadConfigurationFromRemoteDataStore instances",instances);
        await this.localStore.replaceAllInstances(instances);
      return;
    } catch (error) {
      console.warn("LocalDataStoreController loadConfigurationFromRemoteDataStore",error)
    }
  }
}