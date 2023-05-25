import {
  DataStoreApplicationType,
  IDataSectionStore,
  IModelSectionStore
} from "miroir-core";
import { MixedIndexedDbEntityAndInstanceStore } from "./IndexedDbEntityStoreMixin.js";
import { IndexedDb } from "./indexedDb.js";

export class IndexedDbModelSectionStore extends MixedIndexedDbEntityAndInstanceStore implements IModelSectionStore {

  // ##############################################################################################
  constructor(
    applicationName: string,
    dataStoreType: DataStoreApplicationType,
    localUuidIndexedDb: IndexedDb,
    dataStore: IDataSectionStore,
  ) {
    super(
      applicationName,
      dataStoreType,
      localUuidIndexedDb,
      "IndexedDbModelSectionStore" + " Application " + applicationName + " dataStoreType " + dataStoreType,
      dataStore
    );
    console.log("IndexedDbModelSectionStore"+" Application " + applicationName + " dataStoreType " + dataStoreType,'dataStore',dataStore)
  }
}
