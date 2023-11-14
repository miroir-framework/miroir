import {
  DataStoreApplicationType,
  EntityInstanceCollection,
  IDataSectionStore,
  IModelSectionStore,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName
} from "miroir-core";
import { MixedSqlDbEntityAndInstanceStore } from "./sqlDbEntityStoreMixin.js";

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"SqlDbModelSectionStore");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class SqlDbModelStore extends MixedSqlDbEntityAndInstanceStore implements IModelSectionStore {

  // ##############################################################################################
  constructor(
    applicationName: string,
    dataStoreType: DataStoreApplicationType,
    connectionString:string,
    schema:string,
    sqlDbDataStore: IDataSectionStore,
  ) {
    super(
      applicationName,
      dataStoreType,
      connectionString,
      schema,
      "SqlDbModelStore" + " Application " + applicationName + " dataStoreType " + dataStoreType  + ' section model',
      sqlDbDataStore,
    )
  }

  // ##############################################################################################
  // TODO: also defined in SqlDbDataStore => mix it up?
  async getState():Promise<{[uuid:string]:EntityInstanceCollection}>{ // TODO: same implementation as in StoreController
    let result = {};
    log.log(this.logHeader,'getState this.getEntityUuids()',this.getEntityUuids());
    
    for (const parentUuid of this.getEntityUuids()) {
      log.log(this.logHeader,'getState getting instances for',parentUuid);
      const dbInstances = await this.getInstances(parentUuid);
      const instances:EntityInstanceCollection = {parentUuid:parentUuid, applicationSection:'data',instances:dbInstances};
      // log.log(this.logHeader,'getState found instances',parentUuid,instances);
      
      Object.assign(result,{[parentUuid]:instances});
    }
    return Promise.resolve(result);
  }

}
