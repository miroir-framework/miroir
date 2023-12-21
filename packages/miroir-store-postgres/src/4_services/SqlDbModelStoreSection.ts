import {
  DataStoreApplicationType,
  EntityInstanceCollection,
  IDataStoreSection,
  IModelStoreSection,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName
} from "miroir-core";
import { MixedSqlDbEntityAndInstanceStoreSection } from "./sqlDbEntityStoreSectionMixin.js";

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"SqlDbModelSectionStore");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class SqlDbModelStoreSection extends MixedSqlDbEntityAndInstanceStoreSection implements IModelStoreSection {

  // ##############################################################################################
  constructor(
    sqlDbStoreName: string, // used only for debugging purposes
    connectionString:string,
    schema:string,
    sqlDbDataStore: IDataStoreSection,
  ) {
    super(
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
    log.log(this.logHeader,'getState this.getEntityUuids()',this.getEntityUuids());
    
    for (const parentUuid of this.getEntityUuids()) {
      log.debug(this.logHeader,'getState getting instances for',parentUuid);
      const dbInstances = await this.getInstances(parentUuid);
      const instances:EntityInstanceCollection = {parentUuid:parentUuid, applicationSection:'data',instances:dbInstances};
      // log.log(this.logHeader,'getState found instances',parentUuid,instances);
      
      Object.assign(result,{[parentUuid]:instances});
    }
    return Promise.resolve(result);
  }

}
