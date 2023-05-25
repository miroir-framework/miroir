import {
  DataStoreApplicationType,
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
}
