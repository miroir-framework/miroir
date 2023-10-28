import {
  DataStoreApplicationType,
  EntityInstanceCollection,
  IDataSectionStore,
  IModelSectionStore
} from "miroir-core";

import * as fs from "fs";
import * as path from "path";
import { MixedFileSystemDbEntityAndInstanceStore } from "./FileSystemEntityStoreMixin.js";

export class FileSystemModelSectionStore extends MixedFileSystemDbEntityAndInstanceStore implements IModelSectionStore {

  // #############################################################################################
  constructor(
    applicationName: string,
    dataStoreType: DataStoreApplicationType,
    directory: string,
    dataStore: IDataSectionStore,
  ) {
    super(
      applicationName,
      dataStoreType,
      directory,
      'FileSystemModelSectionStore ' + applicationName + ' dataStoreType ' + dataStoreType,
      dataStore
    )
  }

  // #############################################################################################
  // TODO: also implemented in FileSystemDataSectionStore => mix it up?
  async getState(): Promise<{ [uuid: string]: EntityInstanceCollection; }> {
    let result = {};
    console.log(this.logHeader, 'getState this.getEntityUuids()',this.getEntityUuids());

    for (const parentUuid of this.getEntityUuids()) {
      console.log(this.logHeader, 'getState getting instances for',parentUuid);
      const instances = await this.getInstances(parentUuid);
      // console.log(this.logHeader, 'getState found instances',parentUuid,instances);

      Object.assign(result,{[parentUuid]:instances});
    }
    return Promise.resolve(result);
  }
  
}
