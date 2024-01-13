import { AbstractStoreInterface, LoggerInterface, MiroirLoggerFactory, getLoggerName } from "miroir-core";
import { packageName } from "../constants";
import { IndexedDb } from "./IndexedDbSnakeCase";
import { cleanLevel } from "./constants";

const loggerName: string = getLoggerName(packageName, cleanLevel, "SqlDbStore");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class IndexedDbStore implements AbstractStoreInterface {
  // public indexedDbStoreName: string;
  // public localUuidIndexedDb: IndexedDb;
  // public logHeader: string;

  // ##############################################################################################
  constructor(
    public indexedDbStoreName: string,
    public localUuidIndexedDb: IndexedDb,
    public logHeader: string,
  ) {
  }

    // #########################################################################################
    getStoreName(): string {
      return this.indexedDbStoreName;
    }
  
  
  // ##################################################################################################
  async open(): Promise<void> {
    log.info(this.logHeader, "open(): opening");
    await this.localUuidIndexedDb.openObjectStore();
    log.info(this.logHeader, "open(): opened");
    return Promise.resolve();
  }

  // ##############################################################################################
  async close(): Promise<void> {
    log.info(this.logHeader, "close(): closing");
    await this.localUuidIndexedDb.closeObjectStore();
    log.info(this.logHeader, "close(): closed");
    return Promise.resolve();
  }

}
