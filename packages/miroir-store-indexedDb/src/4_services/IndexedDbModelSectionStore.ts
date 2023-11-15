import {
  DataStoreApplicationType,
  EntityInstanceCollection,
  IDataSectionStore,
  IModelSectionStore,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName
} from "miroir-core";

import { MixedIndexedDbEntityAndInstanceStore } from "./IndexedDbEntityStoreMixin.js";
import { IndexedDb } from "./IndexedDbSnakeCase.js";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"IndexedDbModelSectionStore");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

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
    log.log("IndexedDbModelSectionStore"+" Application " + applicationName + " dataStoreType " + dataStoreType,'dataStore',dataStore)
  }

  // ##############################################################################################
  // TODO: also implemented in IndexedDbDataSectionStore => mix it up?
  async getState(): Promise<{ [uuid: string]: EntityInstanceCollection }> {
    let result = {};
    log.log(this.logHeader, "getState this.getEntityUuids()", this.getEntityUuids());

    for (const parentUuid of this.getEntityUuids()) {
      log.debug(this.logHeader, "getState getting instances for", parentUuid);
      const instances = await this.getInstances(parentUuid);
      // log.log(this.logHeader, "getState found instances", parentUuid, instances);

      Object.assign(result, { [parentUuid]: instances });
    }
    return Promise.resolve(result);
  }
}
