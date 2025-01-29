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
import { MixedSqlDbEntityAndInstanceStoreSection } from "./sqlDbEntityStoreSectionMixin";

import { packageName } from "../constants";
import { cleanLevel } from "./constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "SqlDbModelSectionStore")
).then((logger: LoggerInterface) => {log = logger});


export class SqlDbModelStoreSection extends MixedSqlDbEntityAndInstanceStoreSection implements PersistenceStoreModelSectionInterface {

  // ##############################################################################################
  constructor(
    applicationSection: ApplicationSection,
    sqlDbStoreName: string, // used only for debugging purposes
    connectionString:string,
    schema:string,
    sqlDbDataStore: PersistenceStoreDataSectionInterface,
  ) {
    super(
      applicationSection,
      sqlDbStoreName,
      connectionString,
      schema,
      "SqlDbModelStoreSection " + sqlDbStoreName  + ' section model',
      sqlDbDataStore,
    )
  }

  // ##############################################################################################
  // TODO: also defined in SqlDbDataStoreSection => mix it up?
  async getState():Promise<{[uuid:string]:EntityInstanceCollection}>{ // TODO: same implementation as in PersistenceStoreController
    let result = {};
    log.info(this.logHeader,'getState this.getEntityUuids()',this.getEntityUuids());
    
    for (const parentUuid of this.getEntityUuids()) {
      log.debug(this.logHeader,'getState getting instances for',parentUuid);
      const instances:Action2EntityInstanceCollectionOrFailure = await this.getInstances(parentUuid);
      // log.info(this.logHeader,'getState found instances',parentUuid,instances);
            // TODO: proper treatment of errors!
      if (instances instanceof Action2Error) {
        log.error(this.logHeader,'getState error getting instances for',parentUuid,instances);
        Object.assign(result,{[parentUuid]:{parentUuid, instances: []}});
      } else if (instances.returnedDomainElement instanceof Domain2ElementFailed) {
        log.error(this.logHeader,'getState error getting instances for',parentUuid,instances);
        Object.assign(result,{[parentUuid]:{parentUuid, instances: []}});
      } else if (typeof instances.returnedDomainElement != "object" || Array.isArray(instances.returnedDomainElement)) {
        log.error(this.logHeader,'getState error getting instances for',parentUuid,"wrong type for instances:", instances);
        Object.assign(result,{[parentUuid]:{parentUuid, instances: []}});
      } else
      {
        Object.assign(result,{[parentUuid]:instances});
      }
      
      Object.assign(result,{[parentUuid]:instances});
    }
    return Promise.resolve(result);
  }

}
