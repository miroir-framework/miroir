import { MiroirContextInterface } from "./MiroirContext.js";
import { InstanceCollection } from "../0_interfaces/1_core/Instance.js";
import { DataControllerInterface } from "../0_interfaces/3_controllers/DataControllerInterface.js";
import { LocalStoreInterface } from "../0_interfaces/4-services/localStore/LocalStoreInterface.js";
import { NetworkCRUDAction, RemoteDataStoreInterface } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface.js";
import { throwExceptionIfError } from "./ErrorUtils.js";
import { DomainAction } from "../0_interfaces/2_domain/DomainLanguageInterface.js";

export default {}

/**
 * controller should allow configuration of local storage / external storage balance.
 * when data is fetched / purged from local storage.
 * use asynchrony or saga-like implementation for data controller, instead of notifications?
 * allow monitoring of local storage resources.
 */
export class DataStoreController implements DataControllerInterface {

  constructor(
    private miroirContext: MiroirContextInterface,
    private localStore: LocalStoreInterface,
    private remoteStore: RemoteDataStoreInterface,
  ) {}

  public async loadConfigurationFromRemoteDataStore() {
    try {
      const entities: InstanceCollection[] = await throwExceptionIfError(
        this.miroirContext.errorLogService,
        // this.remoteStore.fetchAllEntityDefinitionsFromRemoteDataStore,
        this.remoteStore.handleRemoteCRUDAction,
        this.remoteStore,
        {
          actionName: "read",
          entityName:'Entity'
        } as NetworkCRUDAction
      );
      console.log("LocalDataStoreController loadConfigurationFromRemoteDataStore entities", entities);
      const instances: InstanceCollection[] = await throwExceptionIfError(
        this.miroirContext.errorLogService,
        // this.remoteStore.fetchInstancesForEntityListFromRemoteDatastore,
        this.remoteStore.handleRemoteCRUDAction,
        this.remoteStore,
        // entities[0].instances
        {
          actionName: "read",
          entityName:'Instance',
          objects:entities[0].instances
        } as NetworkCRUDAction
      );
      console.log("LocalDataStoreController loadConfigurationFromRemoteDataStore instances", instances);
      // await this.localStore.replaceAllInstances(instances);
      // this.localStore.replaceAllInstances(instances);
      this.localStore.handleDomainAction(
        {
          actionName: "replace",
          entityName:'Instance',
          objects: instances
        } as DomainAction
      );
      return;
    } catch (error) {
      console.warn("LocalDataStoreController loadConfigurationFromRemoteDataStore", error);
    }
  }
}
