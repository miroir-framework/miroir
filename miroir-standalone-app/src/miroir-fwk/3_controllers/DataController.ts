import { DataControllerInterface } from 'src/miroir-fwk/0_interfaces/3_controllers/DataControllerInterface';
import { LocalStoreEvent, LocalStoreInterface } from 'src/miroir-fwk/0_interfaces/4-storage/local/MLocalStoreInterface';

/**
 * controller should allow configuration of local storage / external storage balance.
 * when data is fetched / purged from local storage.
 * use asynchrony or saga-like implementation for data controller, instead of notifications?
 * allow monitoring of local storage resources.
 */
export class DataController implements DataControllerInterface {

  constructor(private localStore: LocalStoreInterface) {
    localStore.observerMatcherSubscribe(
      [
        // TODO: handle failed allEntityDefinitionsHaveBeenLocallyStored
        /**
         * whenever allEntityDefinitionsHaveBeenLocallyStored, we need to fetch all
         * instances for the defined entities.
         */ 
        {
          eventName:'allEntityDefinitionsHaveBeenLocallyStored', 
          status:'OK',
          takeEvery: (
            (localStoreEvent: LocalStoreEvent): void => {
              console.log(
                "DataController notify reveived localStoreEvent",
                localStoreEvent,
                this
              );
              this.localStore.fetchInstancesFromDatastoreForEntityList(
                localStoreEvent.param
              );
            }
          ).bind(this)
        }
      ]
    )
  }

  public loadDataFromDataStore(): void {
    console.log("MDataController notify reveived localStoreEvent", this);
    this.localStore.fetchFromApiAndReplaceInstancesForAllEntities();
  }
}