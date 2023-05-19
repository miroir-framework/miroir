import { DataStoreApplicationType, StoreController, StoreControllerInterface } from "miroir-core";
import { detect } from "detect-browser";
import { SqlDbDataStore } from "./SqlDbDataStore.js";
import { SqlDbModelStore } from "./SqlDbModelStore.js";

const browserInfo = detect();
console.log('browserInfo',browserInfo);

export async function SqlStoreControllerFactory (
  applicationName: string,
  dataStoreType: DataStoreApplicationType,
  modelConnectionString:string,
  modelSchema:string,
  dataConnectionString:string,
  dataSchema:string,
):Promise<StoreControllerInterface> {
  const seq = await import("sequelize");


  const dataStore = new SqlDbDataStore(seq,applicationName,dataStoreType,dataConnectionString,dataSchema);
  try {
    await dataStore.connect();
    console.log('Application',applicationName,'dataStoreType',dataStoreType,'data Connection to postgres data schema', dataSchema, 'has been established successfully.');
  } catch (error) {
    console.error('Unable to connect data', dataSchema, ' to the postgres database:', error);
  }

  const modelStore = new SqlDbModelStore(seq,applicationName,dataStoreType,modelConnectionString,modelSchema,dataStore);
  try {
    await modelStore.connect()
    console.log('Application',applicationName,'dataStoreType',dataStoreType,'model Connection to postgres model schema', modelSchema, 'has been established successfully.');
  } catch (error) {
    console.error('Unable to connect model to the postgres database:', error);
  }


  const sqlDbServer:StoreControllerInterface = new StoreController(applicationName,dataStoreType,modelStore,dataStore);
  return Promise.resolve(sqlDbServer);
}