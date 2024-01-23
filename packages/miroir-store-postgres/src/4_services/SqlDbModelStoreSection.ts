import {
  DataStoreApplicationType,
  EntityInstanceCollection,
  StoreDataSectionInterface,
  StoreModelSectionInterface,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName,
  ActionReturnType,
  ApplicationSection,
  ActionEntityInstanceCollectionReturnType
} from "miroir-core";
import { MixedSqlDbEntityAndInstanceStoreSection } from "./sqlDbEntityStoreSectionMixin.js";

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"SqlDbModelSectionStore");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class SqlDbModelStoreSection extends MixedSqlDbEntityAndInstanceStoreSection implements StoreModelSectionInterface {

  // ##############################################################################################
  constructor(
    applicationSection: ApplicationSection,
    sqlDbStoreName: string, // used only for debugging purposes
    connectionString:string,
    schema:string,
    sqlDbDataStore: StoreDataSectionInterface,
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
  async getState():Promise<{[uuid:string]:EntityInstanceCollection}>{ // TODO: same implementation as in StoreController
    let result = {};
    log.info(this.logHeader,'getState this.getEntityUuids()',this.getEntityUuids());
    
    for (const parentUuid of this.getEntityUuids()) {
      log.debug(this.logHeader,'getState getting instances for',parentUuid);
      const instances:ActionEntityInstanceCollectionReturnType = await this.getInstances(parentUuid);
      // log.info(this.logHeader,'getState found instances',parentUuid,instances);
            // TODO: proper treatment of errors!
      if (instances.status != "ok") {
        Object.assign(result,{[parentUuid]:{parentUuid, instances: []}});
      } else if (instances.returnedDomainElement?.elementType != "entityInstanceCollection") {
        Object.assign(result,{[parentUuid]:{parentUuid, instances: []}});
      } else {
        // const instanceCollection:EntityInstanceCollection = {parentUuid:parentUuid, applicationSection:'data',instances:instances.returnedDomainElement.elementValue};

        Object.assign(result,{[parentUuid]:instances});
      }
      
      Object.assign(result,{[parentUuid]:instances});
    }
    return Promise.resolve(result);
  }

}
