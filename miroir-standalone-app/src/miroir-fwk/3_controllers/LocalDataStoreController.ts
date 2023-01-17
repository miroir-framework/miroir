import { EntityDefinition } from 'src/miroir-fwk/0_interfaces/1_core/Entity';
import { DataControllerInterface } from 'src/miroir-fwk/0_interfaces/3_controllers/DataControllerInterface';
import { LocalStoreInterface, StoreReturnType } from 'src/miroir-fwk/0_interfaces/4-storage/local/LocalStoreInterface';
import { RemoteDataStoreInterface } from 'src/miroir-fwk/0_interfaces/4-storage/remote/RemoteDataStoreInterfaceInterface';
import { InstanceActionPayload } from 'src/miroir-fwk/4_storage/local/InstanceSlice';

/**
 * controller should allow configuration of local storage / external storage balance.
 * when data is fetched / purged from local storage.
 * use asynchrony or saga-like implementation for data controller, instead of notifications?
 * allow monitoring of local storage resources.
 */
export class LocalDataStoreController implements DataControllerInterface {

  constructor(
    private localStore: LocalStoreInterface,
    private remoteStore: RemoteDataStoreInterface,
  ) {
  }

  public async loadConfigurationFromRemoteDataStore() {
    try {
      const fetchEntities:StoreReturnType = await this.remoteStore.fetchAllEntityDefinitionsFromRemoteDataStore();
      if (!fetchEntities.errorMessage) {
        const entities:EntityDefinition[] = fetchEntities.instances as EntityDefinition[];
        const instances:InstanceActionPayload[] = await this.remoteStore.fetchInstancesForEntityListFromRemoteDatastore(entities);
        await this.localStore.replaceAllInstances(instances);

      }
      return;
    } catch (error) {
      console.warn("LocalDataStoreController loadConfigurationFromRemoteDataStore",error)
    }
  }
}