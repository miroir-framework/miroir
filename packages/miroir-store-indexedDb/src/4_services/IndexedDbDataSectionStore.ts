import {
  DataStoreApplicationType,
  EntityInstanceCollection,
  IDataSectionStore,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName
} from "miroir-core";
import { MixedIndexedDbInstanceStore } from "./IndexedDbInstanceStoreMixin.js";
import { IndexedDb } from "./IndexedDbSnakeCase.js";

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
    indexedDbStoreName: string,
    localUuidIndexedDb: IndexedDb
  ) {
    super(
      indexedDbStoreName,
      localUuidIndexedDb,
      "IndexedDbDataSectionStore " + indexedDbStoreName
    );
  }

  // ##############################################################################################
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
