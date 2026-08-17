import {
  ACTION_OK,
  Action2VoidReturnType,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreAdminSectionInterface,
  StoreSectionConfiguration,
} from "miroir-core";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";
import { BundledStore } from "./BundledStore.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "BundledAdminStore");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

export class BundledAdminStore extends BundledStore implements PersistenceStoreAdminSectionInterface {
  constructor(storeName: string) {
    super(storeName, "BundledAdminStore " + storeName);
  }

  async createStore(_config: StoreSectionConfiguration): Promise<Action2VoidReturnType> {
    log.info(this.logHeader, "createStore — no-op for bundled store");
    return Promise.resolve(ACTION_OK);
  }

  async deleteStore(_config: StoreSectionConfiguration): Promise<Action2VoidReturnType> {
    log.info(this.logHeader, "deleteStore — no-op for bundled store");
    return Promise.resolve(ACTION_OK);
  }
}
