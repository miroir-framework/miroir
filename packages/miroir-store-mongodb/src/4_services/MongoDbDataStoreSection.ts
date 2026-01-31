import {
  Action2EntityInstanceCollectionOrFailure,
  Action2Error,
  Domain2ElementFailed,
  EntityInstanceCollection,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreDataSectionInterface
} from "miroir-core";
import { MongoDb } from "./MongoDb.js";
import { MixedMongoDbInstanceStoreSection } from "./MongoDbInstanceStoreSectionMixin.js";

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "MongoDbDataStoreSection")
).then((logger: LoggerInterface) => {log = logger});

/**
 * MongoDB Data Store Section.
 * Handles data storage operations for entity instances.
 */
export class MongoDbDataStoreSection extends MixedMongoDbInstanceStoreSection implements PersistenceStoreDataSectionInterface {

  // ##############################################################################################
  constructor(
    mongoDbStoreName: string,
    localUuidMongoDb: MongoDb
  ) {
    super(
      mongoDbStoreName,
      localUuidMongoDb,
      "MongoDbDataStoreSection " + mongoDbStoreName
    );
  }

  // ##############################################################################################
  async getState(): Promise<{ [uuid: string]: EntityInstanceCollection }> {
    let result = {};
    log.info(this.logHeader, "getState this.getEntityUuids()", this.getEntityUuids());

    for (const parentUuid of this.getEntityUuids()) {
      log.debug(this.logHeader, "getState getting instances for", parentUuid);
      const instances: Action2EntityInstanceCollectionOrFailure = await this.getInstances(parentUuid);
      // TODO: proper treatment of errors!
      if (instances instanceof Action2Error || instances.returnedDomainElement instanceof Domain2ElementFailed) {
        log.error(this.logHeader, "getState error getting instances for", parentUuid, instances);
        // TODO: return error!!
        Object.assign(result, { [parentUuid]: { parentUuid, instances: [] } });
      } else {
        Object.assign(result, { [parentUuid]: instances.returnedDomainElement });
      }
    }
    return Promise.resolve(result);
  }
}
