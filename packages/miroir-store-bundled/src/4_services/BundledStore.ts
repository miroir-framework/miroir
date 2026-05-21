import {
  ACTION_OK,
  Action2VoidReturnType,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreAbstractInterface,
} from "miroir-core";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "BundledStore")
).then((logger: LoggerInterface) => {
  log = logger;
});

export class BundledStore implements PersistenceStoreAbstractInterface {
  constructor(
    public storeName: string,
    public logHeader: string,
  ) {}

  getStoreName(): string {
    return this.storeName;
  }

  async open(): Promise<Action2VoidReturnType> {
    log.info(this.logHeader, "open() bundled store — no-op");
    return Promise.resolve(ACTION_OK);
  }

  async close(): Promise<Action2VoidReturnType> {
    log.info(this.logHeader, "close() bundled store — no-op");
    return Promise.resolve(ACTION_OK);
  }
}
