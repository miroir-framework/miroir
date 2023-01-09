import { MLocalStoreObserver } from "src/miroir-fwk/0_interfaces/4-storage/local/MLocalStoreI";

export interface MDataControllerI extends MLocalStoreObserver {
  loadDataFromDataStore():void;
}