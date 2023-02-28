import { MiroirContextInterface } from "../0_interfaces/3_controllers/MiroirContextInterface.js";
import { InstanceCollection } from "../0_interfaces/1_core/Instance.js";
import { DomainAction } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import { DataControllerInterface } from "../0_interfaces/3_controllers/DataControllerInterface.js";
import { LocalCacheAction, LocalCacheInfo, LocalCacheInterface } from "../0_interfaces/4-services/localCache/LocalCacheInterface.js";
import { RemoteDataStoreInterface, RemoteStoreAction, RemoteStoreActionReturnType } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface.js";
import { throwExceptionIfError } from "./ErrorUtils.js";

export default {}

/**
 * controller should allow configuration of local storage / external storage balance.
 * when data is fetched / purged from local storage.
 * allow monitoring of local storage resources.
 */
export class DataController implements DataControllerInterface {

  constructor(
    private miroirContext: MiroirContextInterface,
    private localCache: LocalCacheInterface,
    private remoteStore: RemoteDataStoreInterface,
  ) {}

  //####################################################################################
  public async handleLocalCacheModelAction(action:LocalCacheAction) {
    return this.localCache.handleLocalCacheModelAction(action);
  }

  //####################################################################################
  public async handleLocalCacheDataAction(action:LocalCacheAction) {
    return this.localCache.handleLocalCacheDataAction(action);
  }


  //####################################################################################
  public async handleRemoteStoreAction(action:RemoteStoreAction):Promise<RemoteStoreActionReturnType>{
    return this.remoteStore.handleRemoteStoreAction(action);
  }

  //####################################################################################
  /**
   * .
   * @returns the content of the current local cache transaction, not typed so as not to impose any implementation details
   */
  currentLocalCacheTransaction():LocalCacheAction[]{
    return this.localCache.currentTransaction();
  }

  //####################################################################################
  /**
   * .
   * @returns the stats about the current local cache.
   */
  currentLocalCacheInfo():LocalCacheInfo{
    return this.localCache.currentInfo();
  }


  //####################################################################################
  /**
   * performs remote update before local update, so that whenever remote update fails, local value is not modified (going into the "catch").
   * @returns undefined when loading is finished
   */
  public async loadConfigurationFromRemoteDataStore():Promise<void> {
    try {
      const entities: InstanceCollection = (await throwExceptionIfError(
        this.miroirContext.errorLogService,
        this.remoteStore.handleRemoteStoreAction,
        this.remoteStore,
        {
          actionName: "read",
          entityName:'Entity'
        } as RemoteStoreAction
      ))[0];
      console.log("DataController loadConfigurationFromRemoteDataStore found entities", entities);

      let instances: InstanceCollection[] = []; //TODO: replace with functional implementation
      for (const e of entities.instances) { // makes sequetial calls to interface. Make parallel calls instead using Promise.all?
        console.log("DataController loadConfigurationFromRemoteDataStore loading instances for entity", e['name']);
        const entityInstances:InstanceCollection[] = await throwExceptionIfError(
          this.miroirContext.errorLogService,
          this.remoteStore.handleRemoteStoreAction,
          this.remoteStore,
          {
            actionName: "read",
            entityName:e['name'],
          } as RemoteStoreAction
        );
        console.log("DataController loadConfigurationFromRemoteDataStore found instances for entity", e['name'], entityInstances);
        instances.push(entityInstances[0]);
      }
      
      console.log("DataController loadConfigurationFromRemoteDataStore instances", instances);
      this.localCache.handleLocalCacheModelAction(
        {
          actionName: "replace",
          objects: instances
        } as DomainAction
      );
      return Promise.resolve();
    } catch (error) {
      console.warn("DataController loadConfigurationFromRemoteDataStore", error);
    }
  }
}
