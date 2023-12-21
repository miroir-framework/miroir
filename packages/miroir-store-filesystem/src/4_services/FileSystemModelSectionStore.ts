import {
  DataStoreApplicationType,
  EntityInstanceCollection,
  IDataSectionStore,
  IModelSectionStore,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName
} from "miroir-core";

import { MixedFileSystemDbEntityAndInstanceStore } from "./FileSystemEntityStoreMixin.js";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"FileSystemModelSectionStore");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class FileSystemModelSectionStore extends MixedFileSystemDbEntityAndInstanceStore implements IModelSectionStore {

  // #############################################################################################
  constructor(
    filesystemStoreName: string,
    directory: string,
    dataStore: IDataSectionStore,
  ) {
    super(
      filesystemStoreName,
      directory,
      'FileSystemModelSectionStore ' + filesystemStoreName, // logheader
      dataStore
    )
  }

  // #############################################################################################
  // TODO: also implemented in FileSystemDataSectionStore => mix it up?
  async getState(): Promise<{ [uuid: string]: EntityInstanceCollection; }> {
    let result = {};
    log.log(this.logHeader, 'getState this.getEntityUuids()',this.getEntityUuids());

    for (const parentUuid of this.getEntityUuids()) {
      log.debug(this.logHeader, 'getState getting instances for',parentUuid);
      const instances = await this.getInstances(parentUuid);
      // log.log(this.logHeader, 'getState found instances',parentUuid,instances);

      Object.assign(result,{[parentUuid]:instances});
    }
    return Promise.resolve(result);
  }
  
}
