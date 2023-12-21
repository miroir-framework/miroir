import {
  DataStoreApplicationType,
  EntityInstanceCollection,
  IDataSectionStore,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName
} from "miroir-core";
import { MixedSqlDbInstanceStore } from "./sqlDbInstanceStoreMixin.js";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"SqlDbDataStore");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});


export class SqlDbDataStore extends MixedSqlDbInstanceStore implements IDataSectionStore {
  // ##############################################################################################
  constructor(
    sqlDbStoreName: string, // used only for debugging purposes
    // applicationName: string, // used only for debugging purposes
    // dataStoreType: DataStoreApplicationType, // used only for debugging purposes
    dataConnectionString:string,
    dataSchema:string,
  ) {
    super(
      sqlDbStoreName,
      dataConnectionString,
      dataSchema,
      'SqlDbDataStore ' + sqlDbStoreName + ' section data'
    )
  }

  // ##############################################################################################
  async getState():Promise<{[uuid:string]:EntityInstanceCollection}>{ // TODO: same implementation as in StoreController
    let result = {};
    log.log(this.logHeader,'getState this.getEntityUuids()',this.getEntityUuids());
    
    for (const parentUuid of this.getEntityUuids()) {
      log.debug(this.logHeader,'getState getting instances for',parentUuid);
      const dbInstances = await this.getInstances(parentUuid);
      const instances:EntityInstanceCollection = {parentUuid:parentUuid, applicationSection:'data',instances: dbInstances};
      // log.log(this.logHeader,'getState found instances',parentUuid,instances);
      
      Object.assign(result,{[parentUuid]:instances});
    }
    return Promise.resolve(result);
  }
}