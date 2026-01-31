import {
  Action2EntityInstanceCollectionOrFailure,
  Action2Error,
  Domain2ElementFailed,
  EntityInstanceCollection,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreDataSectionInterface,
  PersistenceStoreModelSectionInterface
} from "miroir-core";

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";
import { MongoDb } from "./MongoDb.js";
import { MixedMongoDbEntityAndInstanceStoreSection } from "./MongoDbEntityStoreSectionMixin.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "MongoDbModelStoreSection")
).then((logger: LoggerInterface) => {log = logger});

/**
 * MongoDB Model Store Section.
 * Handles model storage operations (entities, entity definitions) and delegates data storage.
 */
export class MongoDbModelStoreSection
  extends MixedMongoDbEntityAndInstanceStoreSection
  implements PersistenceStoreModelSectionInterface
{
  // ##############################################################################################
  constructor(
    mongoDbStoreName: string,
    localUuidMongoDb: MongoDb,
    dataStore: PersistenceStoreDataSectionInterface
  ) {
    super(
      mongoDbStoreName,
      localUuidMongoDb,
      "MongoDbModelStoreSection " + mongoDbStoreName, // logheader
      dataStore
    );
    log.info("MongoDbModelStoreSection started for", mongoDbStoreName);
  }

  // ##############################################################################################
  // TODO: also implemented in MongoDbDataStoreSection => mix it up?
  async getState(): Promise<{ [uuid: string]: EntityInstanceCollection }> {
    let result = {};
    log.info(this.logHeader, "getState this.getEntityUuids()", this.getEntityUuids());

    for (const parentUuid of this.getEntityUuids()) {
      log.debug(this.logHeader, "getState getting instances for", parentUuid);
      const instances: Action2EntityInstanceCollectionOrFailure = await this.getInstances(parentUuid);
      // TODO: proper treatment of errors!
      if (instances instanceof Action2Error || instances.returnedDomainElement instanceof Domain2ElementFailed) {
        Object.assign(result, { [parentUuid]: { parentUuid, instances: [] } });
      } else if (typeof instances.returnedDomainElement !== "object" || Array.isArray(instances.returnedDomainElement)) {
        Object.assign(result, { [parentUuid]: { parentUuid, instances: [] } });
      } else {
        Object.assign(result, { [parentUuid]: instances.returnedDomainElement });
      }
    }
    return Promise.resolve(result);
  }
}
