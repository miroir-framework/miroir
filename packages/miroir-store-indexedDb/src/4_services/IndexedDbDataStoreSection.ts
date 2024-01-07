import {
  DataStoreApplicationType,
  EntityInstanceCollection,
  IDataStoreSection,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName
} from "miroir-core";
import { MixedIndexedDbInstanceStoreSection } from "./IndexedDbInstanceStoreSectionMixin.js";
import { IndexedDb } from "./IndexedDbSnakeCase.js";

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"IndexedDbDataStoreSection");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class IndexedDbDataStoreSection extends MixedIndexedDbInstanceStoreSection implements IDataStoreSection {

  // ##############################################################################################
  constructor(
    indexedDbStoreName: string,
    localUuidIndexedDb: IndexedDb
  ) {
    super(
      indexedDbStoreName,
      localUuidIndexedDb,
      "IndexedDbDataStoreSection " + indexedDbStoreName
    );
  }

  // ##############################################################################################
  async getState(): Promise<{ [uuid: string]: EntityInstanceCollection }> {
    let result = {};
    log.info(this.logHeader, "getState this.getEntityUuids()", this.getEntityUuids());

    for (const parentUuid of this.getEntityUuids()) {
      log.debug(this.logHeader, "getState getting instances for", parentUuid);
      const instances = await this.getInstances(parentUuid);
      // log.info(this.logHeader, "getState found instances", parentUuid, instances);

      Object.assign(result, { [parentUuid]: instances });
    }
    return Promise.resolve(result);
  }
}
