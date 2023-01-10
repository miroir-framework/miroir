import { LocalStoreEvent } from "src/miroir-fwk/0_interfaces/4-storage/local/MLocalStoreInterface";
import { Observer } from "src/miroir-fwk/1_core/utils/EventManager";

export interface DataControllerInterface extends Observer<LocalStoreEvent> {
  loadDataFromDataStore():void;
}