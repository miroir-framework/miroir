import {
  ACTION_OK,
  Action2VoidReturnType,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreAbstractInterface
} from "miroir-core";
import { packageName } from "../constants.js";
import { MongoDb } from "./MongoDb.js";
import { cleanLevel } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "MongoDbStore")
).then((logger: LoggerInterface) => {log = logger});

/**
 * Base class for MongoDB store implementations.
 * Implements the core PersistenceStoreAbstractInterface for open/close operations.
 */
export class MongoDbStore implements PersistenceStoreAbstractInterface {

  // ##############################################################################################
  constructor(
    public mongoDbStoreName: string,
    public localUuidMongoDb: MongoDb,
    public logHeader: string
  ) {}

  // #########################################################################################
  getStoreName(): string {
    return this.mongoDbStoreName;
  }

  // ##################################################################################################
  async open(): Promise<Action2VoidReturnType> {
    log.info("open()", this.mongoDbStoreName, ": opening...");
    await this.localUuidMongoDb.openObjectStore();
    log.info("open()", this.mongoDbStoreName, ": opened");
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async close(): Promise<Action2VoidReturnType> {
    log.info("close()", this.mongoDbStoreName, ": closing...");
    await this.localUuidMongoDb.closeObjectStore();
    log.info("close()", this.mongoDbStoreName, ": closed");
    return Promise.resolve(ACTION_OK);
  }
}
