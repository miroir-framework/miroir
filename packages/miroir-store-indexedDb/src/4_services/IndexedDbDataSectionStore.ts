import {
  DataStoreApplicationType,
  EntityInstanceCollection,
  IDataSectionStore,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName
} from "miroir-core";
import { MixedIndexedDbInstanceStore } from "./IndexedDbInstanceStoreMixin.js";
import { IndexedDb } from "./IndexedDb.js";

import { packageName } from "../constants";
import { cleanLevel } from "./constants";

const loggerName: string = getLoggerName(packageName, cleanLevel,"IndexedDbDataSectionStore");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

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
    log.log(this.logHeader, "getState this.getEntityUuids()", this.getEntityUuids());

    for (const parentUuid of this.getEntityUuids()) {
      log.log(this.logHeader, "getState getting instances for", parentUuid);
      const instances = await this.getInstances(parentUuid);
      // log.log(this.logHeader, "getState found instances", parentUuid, instances);

      Object.assign(result, { [parentUuid]: instances });
    }
    return Promise.resolve(result);
  }
}
