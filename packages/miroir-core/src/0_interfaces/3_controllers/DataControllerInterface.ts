import { DomainAction } from "../2_domain/DomainControllerInterface";
import { RemoteStoreAction, RemoteStoreActionReturnType } from "../../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";

export interface DataControllerInterface {
  loadConfigurationFromRemoteDataStore():void;
  handleLocalCacheAction(action:DomainAction);
  handleRemoteStoreAction(action:RemoteStoreAction):Promise<RemoteStoreActionReturnType>;
  currentLocalCacheTransaction():any[];

}

export default {}