import {
  DataStoreApplicationType,
  EntityInstanceCollection,
  IDataSectionStore
} from "miroir-core";
import { MixedSqlDbInstanceStore } from "./sqlDbInstanceStoreMixin.js";


export class SqlDbDataStore extends MixedSqlDbInstanceStore implements IDataSectionStore {
  // ##############################################################################################
  constructor(
    applicationName: string,
    dataStoreType: DataStoreApplicationType,
    dataConnectionString:string,
    dataSchema:string,
  ) {
    super(
      applicationName,
      dataStoreType,
      dataConnectionString,
      dataSchema,
      'SqlDbDataStore' + ' Application '+ applicationName +' dataStoreType ' + dataStoreType + ' section data'
    )
  }

  // ##############################################################################################
  async getState():Promise<{[uuid:string]:EntityInstanceCollection}>{ // TODO: same implementation as in StoreController
    let result = {};
    console.log(this.logHeader,'getState this.getEntityUuids()',this.getEntityUuids());
    
    for (const parentUuid of this.getEntityUuids()) {
      console.log(this.logHeader,'getState getting instances for',parentUuid);
      const instances:EntityInstanceCollection = {parentUuid:parentUuid, applicationSection:'data',instances:await this.getInstances(parentUuid)};
      // console.log(this.logHeader,'getState found instances',parentUuid,instances);
      
      Object.assign(result,{[parentUuid]:instances});
    }
    return Promise.resolve(result);
  }
}