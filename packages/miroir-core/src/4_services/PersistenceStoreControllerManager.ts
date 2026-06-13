import { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import {
  AdminStoreFactoryRegister,
  InitApplicationParameters,
  PersistenceStoreControllerInterface,
  PersistenceStoreDataSectionInterface,
  PersistenceStoreModelSectionInterface,
  StoreSectionFactoryRegister,
} from "../0_interfaces/4-services/PersistenceStoreControllerInterface";
import { PersistenceStoreControllerManagerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerManagerInterface";
import { PersistenceStoreController, storeSectionFactory } from "./PersistenceStoreController";

import {
  StoreUnitConfiguration
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface";
import { LocalCacheInterface } from "../0_interfaces/4-services/LocalCacheInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { PersistenceStoreLocalOrRemoteInterface } from "../0_interfaces/4-services/PersistenceInterface";
import { ACTION_OK } from "../1_core/constants";
import { DomainController } from "../3_controllers/DomainController";
import { packageName } from "../constants";
import { MiroirLoggerFactory } from "./MiroirLoggerFactory";
import { cleanLevel } from "./constants";
import { Action2Error, Action2VoidReturnType, type Action2ReturnType } from "../0_interfaces/2_domain/DomainElement";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "PersistenceStoreControllerManager")
).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
export class PersistenceStoreControllerManager implements PersistenceStoreControllerManagerInterface {
  private persistenceStoreControllers: {
    [deploymentUuid: Uuid]: PersistenceStoreControllerInterface;
  } = {};
  private persistenceStoreLocalOrRemote: PersistenceStoreLocalOrRemoteInterface | undefined; // receives instance of PersistenceReduxSaga
  private localCache: LocalCacheInterface | undefined;
  // private domainController: DomainController | undefined;

  constructor(
    private adminStoreFactoryRegister: AdminStoreFactoryRegister,
    private storeSectionFactoryRegister: StoreSectionFactoryRegister,
    public filesystemDeploymentRootDirectory: string | undefined = undefined,
  ) {}

  // ################################################################################################
  /**
   * this is like prop drilling, this is not directly used by this class, but by the created DomainController (this.domainController)
   * @param persistenceStore
   */
  setPersistenceStoreLocalOrRemote(persistenceStore: PersistenceStoreLocalOrRemoteInterface) {
    this.persistenceStoreLocalOrRemote = persistenceStore;
  }

  // ################################################################################################
  getPersistenceStoreLocalOrRemote(): PersistenceStoreLocalOrRemoteInterface {
    if (this.persistenceStoreLocalOrRemote) {
      return this.persistenceStoreLocalOrRemote;
    } else {
      throw new Error(
        "PersistenceStoreControllerManager getPersistenceStoreLocalOrRemote no persistenceStore yet!",
      );
    }
  }

  // ################################################################################################
  setLocalCache(localCache: LocalCacheInterface) {
    this.localCache = localCache;
  }

  // ################################################################################################
  getLocalCache(): LocalCacheInterface {
    if (this.localCache) {
      return this.localCache;
    } else {
      throw new Error("PersistenceStoreControllerManager getLocalCachae no localCache yet!");
    }
  }

  // ################################################################################################
  /**
   * USED ONLY ON THE SERVER SIDE, INCLUDING EMULATED SIDE, FOR NOW.
   * @returns
   */
  getServerDomainControllerDEFUNCT(): DomainControllerInterface {
    throw new Error(
      "PersistenceStoreControllerManager getServerDomainControllerDEFUNCT not implemented yet!",
    );
  }

  // ################################################################################################
  async addPersistenceStoreController(
    deploymentUuid: string,
    config: StoreUnitConfiguration,
  ): Promise<Action2VoidReturnType> {
    log.info("addPersistenceStoreController called with deploymentUuid:", deploymentUuid, "and config:", config);
    if (this.persistenceStoreControllers[deploymentUuid]) {
      log.info(
        "addPersistenceStoreController for",
        deploymentUuid,
        "already exists, doing nothing!",
      );
    } else {
      if (!config.admin) {
        throw new Error(
          "PersistenceStoreControllerManager addPersistenceStoreController could not find admin section in configuration " +
            JSON.stringify(config),
        );
      }
      const keyForAdminFactory = JSON.stringify({ storageType: config.admin.emulatedServerType });
      const adminStoreFactory = this.adminStoreFactoryRegister.get(keyForAdminFactory);
      log.info(
        "addPersistenceStoreController searched admin store factory for deployment",
        deploymentUuid,
        "with admin.emulatedServerType=",
        config.admin.emulatedServerType,
        " keyForAdminFactory=",
        keyForAdminFactory,
        " result adminStoreFactory=",
        adminStoreFactory,
        !adminStoreFactory,
        // JSON.stringify(adminStoreFactory, undefined, 2),
        " adminStoreFactoryRegister=",
        this.adminStoreFactoryRegister.keys(),
        // JSON.stringify(Array.from(this.adminStoreFactoryRegister.keys()), undefined, 2)
      );

      if (!adminStoreFactory) {
        return Promise.resolve(new Action2Error(
          "FailedToOpenStore",
          "addPersistenceStoreController no admin store factory found for server type " +
            config.admin.emulatedServerType + " in " + JSON.stringify(Array.from(this.adminStoreFactoryRegister.keys()), undefined, 2)
        ));
        // log.info(
        //   "addPersistenceStoreController no admin store factory found for deployment",
        //   deploymentUuid,
        //   " with adminStoreFactoryRegister=",
        //   JSON.stringify(this.adminStoreFactoryRegister, undefined, 2),
        // );
        // throw new Error(
        //   "addPersistenceStoreController no admin store factory found for server type " +
        //     config.admin.emulatedServerType + " in " + JSON.stringify(Array.from(this.adminStoreFactoryRegister.keys()), undefined, 2)
        // );
      }
      if (!this.filesystemDeploymentRootDirectory) {
        log.error(
          "addPersistenceStoreController no filesystemDeploymentRootDirectory provided for deployment",
          deploymentUuid,
          "with config.admin",
          config.admin,
        );
        return Promise.resolve(new Action2Error(
          "FailedToOpenStore",
          "addPersistenceStoreController no filesystemDeploymentRootDirectory provided for deployment " +
            deploymentUuid + ", can not create admin store for server type " + config.admin.emulatedServerType,
        ));
        throw new Error(
          "addPersistenceStoreController no filesystemDeploymentRootDirectory provided for deployment " +
            deploymentUuid + ", can not create admin store for server type " + config.admin.emulatedServerType,
        );
      }
      log.info(
        "addPersistenceStoreController calling adminStoreFactory for deployment",
        deploymentUuid,
        "with config.admin",
        config.admin,
        "and filesystemDeploymentRootDirectory",
        this.filesystemDeploymentRootDirectory,
      );
      const adminStore = await adminStoreFactory(config.admin, this.filesystemDeploymentRootDirectory);
      log.info("addPersistenceStoreController created admin store for deployment", deploymentUuid);
      const dataStore = (await storeSectionFactory(
        this.storeSectionFactoryRegister,
        "data",
        config.data,
        this.filesystemDeploymentRootDirectory,
      )) as PersistenceStoreDataSectionInterface;
      // log.info("addPersistenceStoreController found dataStore", dataStore)
      log.info("addPersistenceStoreController found dataStore ok for deployment", deploymentUuid);
      const modelStore = (await storeSectionFactory(
        this.storeSectionFactoryRegister,
        "model",
        config.model,
        this.filesystemDeploymentRootDirectory,
        dataStore,
      )) as PersistenceStoreModelSectionInterface;

      this.persistenceStoreControllers[deploymentUuid] = new PersistenceStoreController(
        adminStore,
        modelStore,
        dataStore,
      );
      log.info("addPersistenceStoreController DONE for deployment", deploymentUuid);
    }
    return ACTION_OK;
  }

  // ################################################################################################
  getPersistenceStoreControllers(): string[] {
    return Object.keys(this.persistenceStoreControllers);
  }

  // ################################################################################################
  getPersistenceStoreController(
    deploymentUuid: string,
  ): PersistenceStoreControllerInterface | undefined {
    return this.persistenceStoreControllers[deploymentUuid];
  }

  // ################################################################################################
  async deletePersistenceStoreController(deploymentUuid: string): Promise<Action2VoidReturnType> {
    if (this.persistenceStoreControllers[deploymentUuid]) {
      await this.persistenceStoreControllers[deploymentUuid].close();
      delete this.persistenceStoreControllers[deploymentUuid];
    } else {
      log.info(
        "deletePersistenceStoreController for",
        deploymentUuid,
        "does not exist, doing nothing!",
      );
    }
    return ACTION_OK;
  }

  // ################################################################################################
  async deployModule(
    adminPersistenceStoreController: PersistenceStoreControllerInterface,
    newDeploymentUuid: Uuid,
    storeUnitConfiguration: StoreUnitConfiguration,
    initApplicationParameters: InitApplicationParameters,
  ): Promise<Action2VoidReturnType> {
    await this.addPersistenceStoreController(
      newDeploymentUuid,
      storeUnitConfiguration,
    );
    const testLocalMiroirPersistenceStoreController:
      | PersistenceStoreControllerInterface
      | undefined = this.getPersistenceStoreController(newDeploymentUuid);

    if (testLocalMiroirPersistenceStoreController) {
      await testLocalMiroirPersistenceStoreController.clear();
      try {
        console.log(
          "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ initApplication",
          initApplicationParameters.dataStoreType,
          "START",
        );
        await testLocalMiroirPersistenceStoreController.initApplication(
          initApplicationParameters.dataStoreType,
          initApplicationParameters.selfApplication,
          initApplicationParameters.applicationModelBranch,
          initApplicationParameters.applicationVersion,
          initApplicationParameters.metaModel,
        );
        console.log(
          "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ deployModule initApplication",
          initApplicationParameters.dataStoreType,
          "END",
        );
      } catch (error) {
        console.error(
          "could not initApplication for",
          initApplicationParameters.dataStoreType,
          "datastore, can not go further!",
        );
        throw error;
      }
    } else {
      // TODO: inject interface to raise errors!
      // throw new Error("deployModule could not find persistenceStoreController for " + newDeploymentUuid);
      return new Action2Error(
        "FailedToDeployModule",
        "deployModule could not find persistenceStoreController for " + newDeploymentUuid,
      );
    }
    return ACTION_OK;
  }
}