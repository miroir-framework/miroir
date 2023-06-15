import {
  DataStoreApplicationType,
  IDataSectionStore,
  IModelSectionStore
} from "miroir-core";
import { MixedSqlDbEntityAndInstanceStore } from "./sqlDbEntityStoreMixin.js";

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
}
