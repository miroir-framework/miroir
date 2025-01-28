import * as fs from "fs";

import { ACTION_OK, Action2VoidReturnType, ApplicationSection, LoggerInterface, MiroirLoggerFactory, PersistenceStoreAbstractInterface } from "miroir-core";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "SqlDbStore")
).then((logger: LoggerInterface) => {log = logger});

export class FileSystemStore implements PersistenceStoreAbstractInterface {
  // ##############################################################################################
  constructor(
    public applicationSection: ApplicationSection,
    public filesystemStoreName: string,
    public directory: string,
    public logHeader: string
  ) {}

  // #########################################################################################
  getStoreName(): string {
    return this.filesystemStoreName;
  }

  // #########################################################################################
  open(): Promise<Action2VoidReturnType> {
    // const entityDirectories = fs.readdirSync(this.directory);
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
