import { InstanceCollection } from "../0_interfaces/1_core/Instance.js";
import { DomainAction } from "../0_interfaces/2_domain/DomainLanguageInterface.js";
import { DataControllerInterface } from "../0_interfaces/3_controllers/DataControllerInterface.js";
import { LocalStoreInterface } from "../0_interfaces/4-services/localStore/LocalStoreInterface.js";
import { RemoteDataStoreInterface, RemoteStoreAction, RemoteStoreActionReturnType } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface.js";
import { throwExceptionIfError } from "./ErrorUtils.js";
import { MiroirContextInterface } from "./MiroirContext.js";

export default {}

/**
 * controller should allow configuration of local storage / external storage balance.
 * when data is fetched / purged from local storage.
 * allow monitoring of local storage resources.
 */
export class DataController implements DataControllerInterface {

  constructor(
    private miroirContext: MiroirContextInterface,
    private localStore: LocalStoreInterface,
    private remoteStore: RemoteDataStoreInterface,
  ) {}

  //####################################################################################
  public async handleLocalCacheAction(action:DomainAction) {
    return this.localStore.handleLocalCacheAction(action);
  }


  //####################################################################################
  public async handleRemoteStoreAction(action:RemoteStoreAction):Promise<RemoteStoreActionReturnType>{
    return this.remoteStore.handleRemoteStoreAction(action);
  }

  //####################################################################################
  public async loadConfigurationFromRemoteDataStore() {
    try {
      const entities: InstanceCollection = (await throwExceptionIfError(
        this.miroirContext.errorLogService,
        // this.remoteStore.fetchAllEntityDefinitionsFromRemoteDataStore,
        this.remoteStore.handleRemoteStoreAction,
        this.remoteStore,
        {
          actionName: "read",
          entityName:'Entity'
        } as RemoteStoreAction
      ))[0];
      console.log("DataStoreController loadConfigurationFromRemoteDataStore found entities", entities);

      let instances: InstanceCollection[] = []; //TODO: replace with functional implementation
      for (const e of entities.instances) { // makes sequetial calls to interface. Make parallel calls instead using Promise.all?
        console.log("DataStoreController loadConfigurationFromRemoteDataStore loading instances for entity", e['name']);
        const entityInstances:InstanceCollection[] = await throwExceptionIfError(
          this.miroirContext.errorLogService,
          // this.remoteStore.fetchInstancesForEntityListFromRemoteDatastore,
          this.remoteStore.handleRemoteStoreAction,
          this.remoteStore,
          {
            actionName: "read",
            entityName:e['name'],
          } as RemoteStoreAction
        );
        console.log("DataStoreController loadConfigurationFromRemoteDataStore found instances for entity", e['name'], entityInstances);
        instances.push(entityInstances[0]);
      }

      console.log("DataStoreController loadConfigurationFromRemoteDataStore instances", instances);
      this.localStore.handleLocalCacheAction(
        {
          actionName: "replace",
          // entityName:'Instance',
          objects: instances
        } as DomainAction
      );
      return;
    } catch (error) {
      console.warn("DataStoreController loadConfigurationFromRemoteDataStore", error);
    }
  }
}
