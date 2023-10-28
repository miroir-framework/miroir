import {
  DataStoreApplicationType,
  EntityInstanceCollection,
  IDataSectionStore
} from "miroir-core";

import { MixedFileSystemInstanceStore } from "./FileSystemInstanceStoreMixin.js";


export class FileSystemDataSectionStore extends MixedFileSystemInstanceStore implements IDataSectionStore {
  public logHeader: string;

  // #############################################################################################
  constructor(
    applicationName: string,
    dataStoreType: DataStoreApplicationType,
    directory: string,
  ) {
    super(
      applicationName,
      dataStoreType,
      directory,
      'FileSystemDataSectionStore' + ' Application '+ applicationName +' dataStoreType ' + dataStoreType
    );
  }

  // #############################################################################################
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