import * as fs from "fs";

import {
  ACTION_OK,
  Action2VoidReturnType,
  ApplicationSection,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreAbstractInterface,
} from "miroir-core";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";
import path from "path";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "SqlDbStore")
).then((logger: LoggerInterface) => {log = logger});

export class FileSystemStore implements PersistenceStoreAbstractInterface {
  public directory: string;

  // ##############################################################################################
  constructor(
    public applicationSection: ApplicationSection,
    public filesystemStoreName: string,
    rootDirectory: string,
    subDirectory: string,
    public logHeader: string
  ) {
    this.directory = path.join(rootDirectory, subDirectory);
    log.debug(this.logHeader, "constructor initialized with directory:", this.directory);
  }

  // #########################################################################################
  getStoreName(): string {
    return this.filesystemStoreName;
  }

  // #########################################################################################
  open(): Promise<Action2VoidReturnType> {
    if (fs.existsSync(this.directory)) {
      log.debug(this.logHeader, "open checked that directory exist:", this.directory);
    } else {
      fs.mkdirSync(this.directory, { recursive: true });
      log.info(this.logHeader, "open created directory:", this.directory);
    }
    return Promise.resolve(ACTION_OK);
  }

  // #############################################################################################
  close(): Promise<Action2VoidReturnType> {
    log.info(this.logHeader, "close does nothing!");
    return Promise.resolve(ACTION_OK);
  }
}
