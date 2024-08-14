import {
  ACTION_OK,
  ActionReturnType,
  ActionVoidReturnType,
  PersistenceStoreAdminSectionInterface,
  LoggerInterface,
  MiroirLoggerFactory,
  StoreSectionConfiguration,
  getLoggerName,
} from "miroir-core";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants";
import { FileSystemStore } from "./FileSystemStore";

const loggerName: string = getLoggerName(packageName, cleanLevel, "SqlDbAdminStore");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class FileSystemAdminStore extends FileSystemStore implements PersistenceStoreAdminSectionInterface {
  // for the sake of uniformity, we follow the mixin pattern also for this class although it's not mixed in any other class

  // ##############################################################################################
  constructor(
    // applicationSection: ApplicationSection,
    // filesystemStoreName: string,
    // directory: string,
    // logHeader: string,
    ...args: any[] // mixin constructors are limited to args:any[] parameters
  ) {
    super(args[0], args[1], args[2], args[3]);
  }

  // ##############################################################################################
  async createStore(config: StoreSectionConfiguration): Promise<ActionVoidReturnType> {
    // does not need to do anything, new IndexedDb() is done in the storeSectionFactory, thus called by PersistenceStoreControllerManager.addPersistenceStoreController, where storeSectionFactory is called
    return Promise.resolve(ACTION_OK)
  }

  // ##############################################################################################
  async deleteStore(config: StoreSectionConfiguration): Promise<ActionVoidReturnType> {
    // TODO: remove directory when on server?
    // return clear ()
    return Promise.resolve(ACTION_OK)
  }
}
