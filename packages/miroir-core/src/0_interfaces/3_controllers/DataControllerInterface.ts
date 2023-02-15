import { DomainAction } from "src/0_interfaces/2_domain/DomainLanguageInterface";
import { RemoteStoreAction, RemoteStoreActionReturnType } from "src/0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";

export interface DataControllerInterface {
  loadConfigurationFromRemoteDataStore():void;
  handleLocalCacheAction(action:DomainAction);
  handleRemoteStoreAction(action:RemoteStoreAction):Promise<RemoteStoreActionReturnType>;
}

export default {}