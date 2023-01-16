import { EntityDefinition } from 'src/miroir-fwk/0_interfaces/1_core/Entity';
import { DataControllerInterface } from 'src/miroir-fwk/0_interfaces/3_controllers/DataControllerInterface';
import { LocalStoreInterface } from 'src/miroir-fwk/0_interfaces/4-storage/local/LocalStoreInterface';
import { RemoteDataStoreInterface } from 'src/miroir-fwk/0_interfaces/4-storage/remote/RemoteDataStoreInterfaceInterface';

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
    return this.remoteStore.fetchAllEntityDefinitionsFromRemoteDataStore()
    .then(
      (
        (entities:EntityDefinition[]) => {
          console.log("DataController loadConfigurationFromRemoteDataStore ", entities, "calling replaceAllEntityDefinitions");
          return this.localStore.replaceAllEntityDefinitions.bind(this.localStore)(entities);
        }
      ).bind(this)
    )
    .then(
      (entities:EntityDefinition[])=>{
        console.log("DataController loadConfigurationFromRemoteDataStore ", entities, "calling fetchInstancesForEntityListFromRemoteDatastore");
        return this.remoteStore.fetchInstancesForEntityListFromRemoteDatastore(
          entities
        );
      }
    )
    .catch(
      error => {
        console.warn("LocalDataStoreController loadConfigurationFromRemoteDataStore",error)
      }
    )
  }
}