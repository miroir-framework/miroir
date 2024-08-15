import * as fs from "fs";
import * as path from "path";

import { ACTION_OK, PersistenceStoreAbstractInterface, ActionReturnType, ActionVoidReturnType, ApplicationSection, LoggerInterface, MiroirLoggerFactory, getLoggerName } from "miroir-core";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel, "SqlDbStore");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

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
  open(): Promise<ActionVoidReturnType> {
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
  close(): Promise<ActionVoidReturnType> {
    log.info(this.logHeader, "close does nothing!");
    return Promise.resolve(ACTION_OK);
  }
}
