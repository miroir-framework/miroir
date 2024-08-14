import {
  DataStoreApplicationType,
  EntityInstanceCollection,
  PersistenceStoreDataSectionInterface,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName,
  ActionEntityInstanceCollectionReturnType
} from "miroir-core";
import { MixedIndexedDbInstanceStoreSection } from "./IndexedDbInstanceStoreSectionMixin.js";
import { IndexedDb } from "./IndexedDb.js";

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"IndexedDbDataStoreSection");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class IndexedDbDataStoreSection extends MixedIndexedDbInstanceStoreSection implements PersistenceStoreDataSectionInterface {

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
      const instances: ActionEntityInstanceCollectionReturnType = await this.getInstances(parentUuid);
      // log.info(this.logHeader, "getState found instances", parentUuid, instances);
      // TODO: proper treatment of errors!
      if (instances.status != "ok") {
        Object.assign(result,{[parentUuid]:{parentUuid, instances: []}});
      } else if (instances.returnedDomainElement?.elementType != "entityInstanceCollection") {
        Object.assign(result,{[parentUuid]:{parentUuid, instances: []}});
      } else {
        Object.assign(result,{[parentUuid]:instances.returnedDomainElement.elementValue});
      }
    }
    return Promise.resolve(result);
  }
}
