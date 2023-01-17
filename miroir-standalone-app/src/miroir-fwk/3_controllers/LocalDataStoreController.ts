import { EntityDefinition } from 'src/miroir-fwk/0_interfaces/1_core/Entity';
import { DataControllerInterface } from 'src/miroir-fwk/0_interfaces/3_controllers/DataControllerInterface';
import { LocalStoreInterface } from 'src/miroir-fwk/0_interfaces/4-storage/local/LocalStoreInterface';
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
    return this.remoteStore.fetchAllEntityDefinitionsFromRemoteDataStore()
    .then(
      (
        (entities:EntityDefinition[]) => {
          console.log("DataController loadConfigurationFromRemoteDataStore ", entities, "calling replaceAllEntityDefinitions");
          return this.localStore.replaceAllEntityDefinitions(entities);
        }
      )
    )
    .then(
      (entities:EntityDefinition[])=>{
        console.log("DataController loadConfigurationFromRemoteDataStore ", entities, "calling fetchInstancesForEntityListFromRemoteDatastore");
        return this.remoteStore.fetchInstancesForEntityListFromRemoteDatastore(entities);
      }
    )
    .then(
      (instances:InstanceActionPayload[])=>{
        console.log("DataController loadConfigurationFromRemoteDataStore ", instances, "calling replaceAllInstanceDefinitions");
        return this.localStore.replaceAllInstances(instances);
      }
    )
    .catch(
      error => {
        console.warn("LocalDataStoreController loadConfigurationFromRemoteDataStore",error)
      }
    )
  }
}