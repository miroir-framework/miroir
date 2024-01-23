import { AbstractStoreInterface, ActionReturnType, LoggerInterface, MiroirLoggerFactory, getLoggerName } from "miroir-core";
import { packageName } from "../constants";
import { IndexedDb } from "./IndexedDb";
import { cleanLevel } from "./constants";

const loggerName: string = getLoggerName(packageName, cleanLevel, "IndexedDbStore");
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
  async open(): Promise<ActionReturnType> {
    log.info("open()",this.indexedDbStoreName,": opening...");
    await this.localUuidIndexedDb.openObjectStore();
    log.info("open()",this.indexedDbStoreName,": opened");
    return Promise.resolve( { status: "ok" } );
  }

  // ##############################################################################################
  async close(): Promise<ActionReturnType> {
    log.info("close()",this.indexedDbStoreName,": closing...");
    await this.localUuidIndexedDb.closeObjectStore();
    log.info("close()",this.indexedDbStoreName,": closed");
    return Promise.resolve( { status: "ok" } );
  }

}
