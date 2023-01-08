import { MDataControllerI } from 'src/miroir-fwk/0_interfaces/3_controllers/MDataController';
import { MreduxStoreI } from 'src/miroir-fwk/0_interfaces/4-storage/local/MReduxStore';


export class MDataController implements MDataControllerI {

  constructor (
    private mReduxStore:MreduxStoreI,
  ) {}

  public loadDataFromDataStore():void {
    this.mReduxStore.fetchFromApiAndReplaceInstancesForAllEntities();
  }

}