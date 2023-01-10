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
    localStore.observerSubscribe(this); // TODO: unsubscribe!?
  }

  public takeEvery(localStoreEvent: LocalStoreEvent): void {
    console.log(
      "MDataController notify reveived localStoreEvent",
      localStoreEvent,
      this
    );
    this.localStore.fetchInstancesFromDatastoreForEntityList(
      localStoreEvent.param
    );
  }

  public loadDataFromDataStore(): void {
    console.log("MDataController notify reveived localStoreEvent", this);
    this.localStore.fetchFromApiAndReplaceInstancesForAllEntities();
  }

  // fetchFromApiAndReplaceInstancesForEntityOK(entityName: string): void {
  //   console.log("MDataController fetchFromApiAndReplaceInstancesForEntityOK");
  // }

  // fetchFromApiAndReplaceInstancesForEntityNOK(entityName: string): void {}

  // fetchFromApiAndReplaceInstancesForAllEntitiesOK(): void {}

  // fetchFromApiAndReplaceInstancesForAllEntitiesNOK(): void {}
}