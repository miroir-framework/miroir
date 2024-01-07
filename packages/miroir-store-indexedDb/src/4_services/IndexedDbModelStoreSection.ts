import {
  DataStoreApplicationType,
  EntityInstanceCollection,
  IDataStoreSection,
  IModelStoreSection,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName
} from "miroir-core";

import { MixedIndexedDbEntityAndInstanceStoreSection } from "./IndexedDbEntityStoreSectionMixin.js";
import { IndexedDb } from "./IndexedDbSnakeCase.js";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"IndexedDbModelStoreSection");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class IndexedDbModelStoreSection extends MixedIndexedDbEntityAndInstanceStoreSection implements IModelStoreSection {

  // ##############################################################################################
  constructor(
    indexedDbStoreName: string,
    localUuidIndexedDb: IndexedDb,
    dataStore: IDataStoreSection,
  ) {
    super(
      indexedDbStoreName,
      localUuidIndexedDb,
      "IndexedDbModelStoreSection " + indexedDbStoreName, // logheader
      dataStore
    );
    log.info("IndexedDbModelStoreSection " + indexedDbStoreName, dataStore)
  }

  // ##############################################################################################
  // TODO: also implemented in IndexedDbDataStoreSection => mix it up?
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
