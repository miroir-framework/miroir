import {
  DataStoreApplicationType,
  EntityInstanceCollection,
  IDataSectionStore
} from "miroir-core";
import { MixedIndexedDbInstanceStore } from "./IndexedDbInstanceStoreMixin.js";
import { IndexedDb } from "./indexedDb.js";

export class IndexedDbDataSectionStore extends MixedIndexedDbInstanceStore implements IDataSectionStore {

  // ##############################################################################################
  constructor(
    applicationName: string,
    dataStoreType: DataStoreApplicationType,
    localUuidIndexedDb: IndexedDb
  ) {
    super(
      applicationName,
      dataStoreType,
      localUuidIndexedDb,
      "IndexedDbDataSectionStore" + " Application " + applicationName + " dataStoreType " + dataStoreType
    );
  }

  // ##############################################################################################
  async getState(): Promise<{ [uuid: string]: EntityInstanceCollection }> {
    let result = {};
    console.log(this.logHeader, "getState this.getEntityUuids()", this.getEntityUuids());

    for (const parentUuid of this.getEntityUuids()) {
      console.log(this.logHeader, "getState getting instances for", parentUuid);
      const instances = await this.getInstances(parentUuid);
      // console.log(this.logHeader, "getState found instances", parentUuid, instances);

      Object.assign(result, { [parentUuid]: instances });
    }
    return Promise.resolve(result);
  }
}
