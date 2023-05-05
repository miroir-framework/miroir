import { Uuid } from "../../0_interfaces/1_core/EntityDefinition";
import { DomainAncillaryOrReplayableAction, DomainDataAction, DomainModelAncillaryOrReplayableAction, DomainModelReplayableAction } from "../2_domain/DomainControllerInterface";
import { LocalCacheInfo } from "../4-services/localCache/LocalCacheInterface";
import {
  RemoteStoreAction,
  RemoteStoreCRUDActionReturnType,
  RemoteStoreModelAction,
} from "../4-services/remoteStore/RemoteDataStoreInterface";

export interface LocalAndRemoteControllerInterface {
  loadConfigurationFromRemoteDataStore(deploymentUuid: string,): Promise<void>;
  handleLocalCacheModelAction(deploymentUuid:Uuid, action: DomainModelAncillaryOrReplayableAction);
  handleLocalCacheDataAction(deploymentUuid:Uuid, action: DomainDataAction);
  handleLocalCacheAction(deploymentUuid:Uuid, action: DomainAncillaryOrReplayableAction);
  handleRemoteStoreCRUDAction(action: RemoteStoreAction): Promise<RemoteStoreCRUDActionReturnType>;
  handleRemoteStoreModelAction(action: RemoteStoreModelAction): Promise<RemoteStoreCRUDActionReturnType>;
  handleRemoteStoreCRUDActionWithDeployment(deploymentUuid:string, action: RemoteStoreAction): Promise<RemoteStoreCRUDActionReturnType>;
  handleRemoteStoreModelActionWithDeployment(deploymentUuid:string, action: RemoteStoreModelAction): Promise<RemoteStoreCRUDActionReturnType>;
  currentLocalCacheTransaction(): DomainModelReplayableAction[];
  currentLocalCacheInfo(): LocalCacheInfo;
}

export default {};
