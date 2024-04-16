import { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import {
  AdminStoreFactoryRegister,
  InitApplicationParameters,
  PersistenceStoreControllerInterface,
  StoreDataSectionInterface,
  StoreModelSectionInterface,
  StoreSectionFactoryRegister,
} from "../0_interfaces/4-services/PersistenceStoreControllerInterface";
import { PersistenceStoreControllerManagerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerManagerInterface";
import { PersistenceStoreController, storeSectionFactory } from "./PersistenceStoreController";

import {
  ActionVoidReturnType,
  StoreUnitConfiguration
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { ACTION_OK } from "../1_core/constants";
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { MiroirLoggerFactory } from "./Logger";
import { cleanLevel } from "./constants";
import { PersistenceInterface } from "../0_interfaces/4-services/PersistenceInterface";
import { LocalCacheInterface } from "../0_interfaces/4-services/LocalCacheInterface";
import { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface";
import { DomainController } from "../3_controllers/DomainController";
import { Endpoint } from "../3_controllers/Endpoint";
import { MiroirContext } from "../3_controllers/MiroirContext";

const loggerName: string = getLoggerName(packageName, cleanLevel,"PersistenceStoreControllerManager");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

// ################################################################################################
export class PersistenceStoreControllerManager implements PersistenceStoreControllerManagerInterface {
  private persistenceStoreControllers: { [deploymentUuid: Uuid]: PersistenceStoreControllerInterface } = {};
  private persistenceStore: PersistenceInterface | undefined;
  private localCache: LocalCacheInterface | undefined;
  private domainController: DomainController | undefined;

  constructor(
    private adminStoreFactoryRegister: AdminStoreFactoryRegister,
    private storeSectionFactoryRegister: StoreSectionFactoryRegister,
    // private localCache: LocalCacheInterface,
  ) {}

  // ################################################################################################
  setPersistenceStore(persistenceStore: PersistenceInterface)  {
    this.persistenceStore = persistenceStore;
  }

  // ################################################################################################
  getPersistenceStore(): PersistenceInterface {
    if (this.persistenceStore) {
      return this.persistenceStore;
    } else {
      throw new Error("PersistenceStoreControllerManager getPersistenceStore no persistenceStore yet!");
      
    }
  }

  // ################################################################################################
  setLocalCache(localCache: LocalCacheInterface)  {
    this.localCache = localCache;
  }

  // ################################################################################################
  getLocalCache(): LocalCacheInterface {
    if (this.localCache) {
      return this.localCache;
    } else {
      throw new Error("PersistenceStoreControllerManager getLocalCache no localCache yet!");
    }
  }

  // ################################################################################################
  getDomainController(): DomainControllerInterface {
    if (this.domainController) {
      return this.domainController;
    } else {
      throw new Error("PersistenceStoreControllerManager getDomainController no domainController yet!");
    }
  }

  // ################################################################################################
  async addPersistenceStoreController(deploymentUuid: string, config: StoreUnitConfiguration): Promise<void> {
    log.info("addPersistenceStoreController", deploymentUuid, config);
    if (this.persistenceStoreControllers[deploymentUuid]) {
      log.info("addPersistenceStoreController for", deploymentUuid, "already exists, doing nothing!");
    } else {
      if (!config.admin) {
       throw new Error("PersistenceStoreControllerManager addPersistenceStoreController could not find admin section in configuration " + JSON.stringify(config));
      }
      const adminStoreFactory = this.adminStoreFactoryRegister.get(
        JSON.stringify({ storageType: config.admin.emulatedServerType })
      );

      if (!this.localCache || !this.persistenceStore) {
        throw new Error(
          "PersistenceStoreControllerManager getLocalCache no localCache or persitenceStore yet! localCache=" +
            this.localCache +
            " persistenceStore=" +
            this.persistenceStore
        );
      }

      this.domainController = new DomainController(
        true, // we are on the server, use localCache for queries upon receiving "remoteLocalCacheRollback" action
        new MiroirContext(),
        this.localCache, // implements LocalCacheInterface
        this.persistenceStore, // implements PersistenceInterface
        new Endpoint(this.localCache)
      );


      if (!adminStoreFactory) {
        log.info(
          "addPersistenceStoreController no admin store factory found for",
          deploymentUuid,
          JSON.stringify(this.adminStoreFactoryRegister, undefined, 2)
        );
        throw new Error(
          "addPersistenceStoreController no admin store factory found for server type " + config.admin.emulatedServerType
        );
      }
      const adminStore = await adminStoreFactory(config.admin);
      const dataStore = (await storeSectionFactory(
        this.storeSectionFactoryRegister,
        "data",
        config.data
      )) as StoreDataSectionInterface;
      log.info("addPersistenceStoreController found dataStore", dataStore)
      const modelStore = (await storeSectionFactory(
        this.storeSectionFactoryRegister,
        "model",
        config.model,
        dataStore
      )) as StoreModelSectionInterface;

      this.persistenceStoreControllers[deploymentUuid] = new PersistenceStoreController(adminStore, modelStore, dataStore);

    }
  }

  // ################################################################################################
  getPersistenceStoreControllers(): string[] {
    return Object.keys(this.persistenceStoreControllers);
  }

  // ################################################################################################
  getPersistenceStoreController(deploymentUuid: string): PersistenceStoreControllerInterface | undefined {
    return this.persistenceStoreControllers[deploymentUuid];
  }

  // ################################################################################################
  async deletePersistenceStoreController(deploymentUuid: string): Promise<void> {
    if (this.persistenceStoreControllers[deploymentUuid]) {
      await this.persistenceStoreControllers[deploymentUuid].close();
      delete this.persistenceStoreControllers[deploymentUuid];
    } else {
      log.info("deletePersistenceStoreController for", deploymentUuid, "does not exist, doing nothing!");
    }
  }

  // ################################################################################################
  async deployModule(
    adminPersistenceStoreController: PersistenceStoreControllerInterface,
    newDeploymentUuid: Uuid,
    storeUnitConfiguration: StoreUnitConfiguration,
    initApplicationParameters: InitApplicationParameters,
  ): Promise<ActionVoidReturnType> {
    // await adminPersistenceStoreController.deleteStore(storeUnitConfiguration.admin);
    // await adminPersistenceStoreController.createStore(storeUnitConfiguration.admin);
    await this.addPersistenceStoreController(
      newDeploymentUuid,
      storeUnitConfiguration
    );
    const testLocalMiroirPersistenceStoreController: PersistenceStoreControllerInterface | undefined = this.getPersistenceStoreController(newDeploymentUuid);

    if (testLocalMiroirPersistenceStoreController) {
      await testLocalMiroirPersistenceStoreController.clear();
      try {
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ deployModule initApplication',initApplicationParameters.dataStoreType,"START");
        await testLocalMiroirPersistenceStoreController.initApplication(
          initApplicationParameters.metaModel,
          initApplicationParameters.dataStoreType,
          initApplicationParameters.application,
          initApplicationParameters.applicationDeploymentConfiguration,
          initApplicationParameters.applicationModelBranch,
          initApplicationParameters.applicationVersion,
          initApplicationParameters.applicationStoreBasedConfiguration
        );
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ deployModule initApplication',initApplicationParameters.dataStoreType,"END");
      } catch (error) {
        console.error('could not initApplication for',initApplicationParameters.dataStoreType,"datastore, can not go further!");
        throw(error);
      }

    } else { // TODO: inject interface to raise errors!
      // throw new Error("deployModule could not find persistenceStoreController for " + newDeploymentUuid);
      return { status: "error", error: { errorType: "FailedToDeployModule" } }
    }
    return ACTION_OK
  }
}