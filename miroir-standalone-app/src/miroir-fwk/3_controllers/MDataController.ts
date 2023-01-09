import { MDataControllerI } from 'src/miroir-fwk/0_interfaces/3_controllers/MDataControllerI';
import { MLocalStoreEvent, MLocalStoreI } from 'src/miroir-fwk/0_interfaces/4-storage/local/MLocalStoreI';


export class MDataController implements MDataControllerI {
  constructor(private mReduxStore: MLocalStoreI) {
    mReduxStore.listenerSubscribe(this);
  }

  public notify(localStoreEvent: MLocalStoreEvent<any>): void {
    console.log(
      "MDataController notify reveived localStoreEvent",
      localStoreEvent,
      this
    );
    this.mReduxStore.fetchInstancesFromDatastoreForEntityList(
      localStoreEvent.param
    );
  }

  public loadDataFromDataStore(): void {
    this.mReduxStore.fetchFromApiAndReplaceInstancesForAllEntities();
  }

  // fetchFromApiAndReplaceInstancesForEntityOK(entityName: string): void {
  //   console.log("MDataController fetchFromApiAndReplaceInstancesForEntityOK");
  // }

  // fetchFromApiAndReplaceInstancesForEntityNOK(entityName: string): void {}

  // fetchFromApiAndReplaceInstancesForAllEntitiesOK(): void {}

  // fetchFromApiAndReplaceInstancesForAllEntitiesNOK(): void {}
}