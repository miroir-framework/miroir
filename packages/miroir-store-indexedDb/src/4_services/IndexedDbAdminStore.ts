import {
  ACTION_OK,
  ActionVoidReturnType,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreAdminSectionInterface,
  StoreSectionConfiguration
} from "miroir-core";
import { packageName } from "../constants.js";
import { IndexedDbStore } from "./IndexedDbStore.js";
import { cleanLevel } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "SqlDbAdminStore")
).then((logger: LoggerInterface) => {log = logger});

export class IndexedDbAdminStore extends IndexedDbStore implements PersistenceStoreAdminSectionInterface {
  // for the sake of uniformity, we follow the mixin pattern also for this class although it's not mixed in any other class

  // ##############################################################################################
  constructor(
    ...args: any[] // mixin constructors are limited to args:any[] parameters
  ) {
    super(args[0], args[1], args[2]);
  }

  // ##############################################################################################
  async createStore(config: StoreSectionConfiguration): Promise<ActionVoidReturnType> {
    // does not need to do anything, new IndexedDb() is done in the storeSectionFactory, thus called by PersistenceStoreControllerManager.addPersistenceStoreController, where storeSectionFactory is called
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async deleteStore(config: StoreSectionConfiguration): Promise<ActionVoidReturnType> {
    // await this.sequelize.dropSchema(this.schema,{});
    // TODO: remove directory when on server?
    // return clear ()
    return Promise.resolve(ACTION_OK);
  }
}
