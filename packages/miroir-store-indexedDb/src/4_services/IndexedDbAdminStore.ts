import {
  ACTION_OK,
  Action2VoidReturnType,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreAdminSectionInterface,
  StoreSectionConfiguration
} from "miroir-core";
import { packageName } from "../constants.js";
import { IndexedDb } from "./IndexedDb.js";
import { IndexedDbStore } from "./IndexedDbStore.js";
import { cleanLevel } from "./constants.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "SqlDbAdminStore");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {log = logger});

export class IndexedDbAdminStore extends IndexedDbStore implements PersistenceStoreAdminSectionInterface {
  // for the sake of uniformity, we follow the mixin pattern also for this class although it's not mixed in any other class

  // ##############################################################################################
  constructor(
    ...args: any[] // mixin constructors are limited to args:any[] parameters
  ) {
    super(args[0], args[1], args[2]);
  }

  // ##############################################################################################
  async createStore(config: StoreSectionConfiguration): Promise<Action2VoidReturnType> {
    // does not need to do anything, new IndexedDb() is done in the storeSectionFactory, thus called by PersistenceStoreControllerManager.addPersistenceStoreController, where storeSectionFactory is called
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async deleteStore(config: StoreSectionConfiguration): Promise<Action2VoidReturnType> {
    if (config.emulatedServerType !== "indexedDb") {
      return Promise.resolve(ACTION_OK);
    }

    // Browser builds use native IndexedDB — no Level directories to remove.
    if (typeof process === "undefined" || !process.versions?.node) {
      return Promise.resolve(ACTION_OK);
    }

    await this.localUuidIndexedDb.closeObjectStore();

    const root = this.localUuidIndexedDb.getFilesystemDeploymentRootDirectory();
    const { rmSync } = await import("node:fs");
    for (const directoryName of IndexedDb.levelDatabaseDirectoryNames(config.indexedDbName)) {
      const directoryPath = IndexedDb.levelDatabasePath(root, directoryName);
      try {
        rmSync(directoryPath, { recursive: true, force: true });
        log.info(this.logHeader, "deleteStore removed Level directory", directoryPath);
      } catch (error) {
        log.warn(this.logHeader, "deleteStore could not remove Level directory", directoryPath, error);
      }
    }
    return Promise.resolve(ACTION_OK);
  }
}
