import {
  Action2EntityInstanceCollectionOrFailure,
  Action2Error,
  ApplicationSection,
  Domain2ElementFailed,
  EntityInstanceCollection,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreDataSectionInterface,
  PersistenceStoreModelSectionInterface
} from "miroir-core";

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";
import { MixedFileSystemDbEntityAndInstanceStoreSection } from "./FileSystemEntityStoreSectionMixin.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "FileSystemModelStoreSection")
).then((logger: LoggerInterface) => {log = logger});


export class FileSystemModelStoreSection
  extends MixedFileSystemDbEntityAndInstanceStoreSection
  implements PersistenceStoreModelSectionInterface
{
  // #############################################################################################
  constructor(
    applicationSection: ApplicationSection,
    filesystemStoreName: string,
    directory: string,
    dataStore: PersistenceStoreDataSectionInterface
  ) {
    super(
      applicationSection,
      filesystemStoreName,
      directory,
      "FileSystemModelStoreSection " + filesystemStoreName, // logheader
      dataStore
    );
  }

  // #############################################################################################
  // TODO: also implemented in IndexedDbDataStoreSection => mix it up?
  async getState(): Promise<{ [uuid: string]: EntityInstanceCollection }> {
    let result = {};
    log.info(this.logHeader, "getState this.getEntityUuids()", this.getEntityUuids());

    for (const parentUuid of this.getEntityUuids()) {
      log.debug(this.logHeader, "getState getting instances for", parentUuid);
      const instances: Action2EntityInstanceCollectionOrFailure = await this.getInstances(parentUuid);
      // log.info(this.logHeader, "getState found instances", parentUuid, instances);
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
