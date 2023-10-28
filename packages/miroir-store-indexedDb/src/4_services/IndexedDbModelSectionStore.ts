import {
  DataStoreApplicationType,
  EntityInstanceCollection,
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

  // ##############################################################################################
  // TODO: also implemented in IndexedDbDataSectionStore => mix it up?
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
