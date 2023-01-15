import { DataControllerInterface } from 'src/miroir-fwk/0_interfaces/3_controllers/DataControllerInterface';
import { LocalStoreInterface } from 'src/miroir-fwk/0_interfaces/4-storage/local/LocalStoreInterface';

/**
 * controller should allow configuration of local storage / external storage balance.
 * when data is fetched / purged from local storage.
 * use asynchrony or saga-like implementation for data controller, instead of notifications?
 * allow monitoring of local storage resources.
 */
export class LocalDataStoreController implements DataControllerInterface {

  constructor(private localStore: LocalStoreInterface) {
  }

  public loadConfigurationFromRemoteDataStore(): void {
    this.localStore.fetchAllEntityDefinitionsFromRemoteDataStore().then(
      (entities)=>{
        console.log("DataController received localStoreEvent", entities, "calling fetchInstancesFromDatastoreForEntityList");
        this.localStore.fetchInstancesFromDatastoreForEntityList(
          entities
        );
      }
    )
  }
}