import {
  ACTION_OK,
  PersistenceStoreAbstractInterface,
  ActionReturnType,
  ActionVoidReturnType,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName,
} from "miroir-core";
import { packageName } from "../constants.js";
import { IndexedDb } from "./IndexedDb.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel, "IndexedDbStore");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class IndexedDbStore implements PersistenceStoreAbstractInterface {
  // public indexedDbStoreName: string;
  // public localUuidIndexedDb: IndexedDb;
  // public logHeader: string;

  // ##############################################################################################
  constructor(public indexedDbStoreName: string, public localUuidIndexedDb: IndexedDb, public logHeader: string) {}

  // #########################################################################################
  getStoreName(): string {
    return this.indexedDbStoreName;
  }

  // ##################################################################################################
  async open(): Promise<ActionVoidReturnType> {
    log.info("open()", this.indexedDbStoreName, ": opening...");
    await this.localUuidIndexedDb.openObjectStore();
    log.info("open()", this.indexedDbStoreName, ": opened");
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async close(): Promise<ActionVoidReturnType> {
    log.info("close()", this.indexedDbStoreName, ": closing...");
    await this.localUuidIndexedDb.closeObjectStore();
    log.info("close()", this.indexedDbStoreName, ": closed");
    return Promise.resolve(ACTION_OK);
  }
}
