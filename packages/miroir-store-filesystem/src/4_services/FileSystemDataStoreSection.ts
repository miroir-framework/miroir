import {
  DataStoreApplicationType,
  EntityInstanceCollection,
  StoreDataSectionInterface,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName
} from "miroir-core";

import { MixedFileSystemInstanceStoreSection } from "./FileSystemInstanceStoreSectionMixin.js";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"FileSystemDataStoreSection");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class FileSystemDataStoreSection extends MixedFileSystemInstanceStoreSection implements StoreDataSectionInterface {
  // public logHeader: string;

  // #############################################################################################
  constructor(
    filesystemStoreName: string,
    directory: string,
  ) {
    super(
      filesystemStoreName,
      directory,
      'FileSystemDataStoreSection' + filesystemStoreName 
    );
  }

  // #############################################################################################
  async getState(): Promise<{ [uuid: string]: EntityInstanceCollection; }> {
    let result = {};
    log.info(this.logHeader, 'getState this.getEntityUuids()',this.getEntityUuids());

    for (const parentUuid of this.getEntityUuids()) {
      log.debug(this.logHeader, 'getState getting instances for',parentUuid);
      const instances = await this.getInstances(parentUuid);
      // log.info(this.logHeader, 'getState found instances',parentUuid,instances);

      Object.assign(result,{[parentUuid]:instances});
    }
    return Promise.resolve(result);
  }
}