import * as fs from "fs";
import * as path from "path";

import { AbstractStoreInterface, ActionReturnType, LoggerInterface, MiroirLoggerFactory, getLoggerName } from "miroir-core";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";

const loggerName: string = getLoggerName(packageName, cleanLevel, "SqlDbStore");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class FileSystemStore implements AbstractStoreInterface {
  // ##############################################################################################
  constructor(public filesystemStoreName: string, public directory: string, public logHeader: string) {}

  // #########################################################################################
  getStoreName(): string {
    return this.filesystemStoreName;
  }

  // #########################################################################################
  open(): Promise<ActionReturnType> {
    // const entityDirectories = fs.readdirSync(this.directory);
    if (fs.existsSync(this.directory)) {
      log.debug(this.logHeader, "open checked that directory exist:", this.directory);
    } else {
      fs.mkdirSync(this.directory, { recursive: true });
      log.info(this.logHeader, "open created directory:", this.directory);
    }
    return Promise.resolve( { status: "ok" } );
  }

  // #############################################################################################
  close(): Promise<ActionReturnType> {
    log.info(this.logHeader, "close does nothing!");
    return Promise.resolve( { status: "ok" } );
  }
}
