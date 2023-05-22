import { DataStoreApplicationType, DataStoreInterface, ModelStoreInterface, StoreController, StoreControllerInterface } from "miroir-core";
import { detect } from "detect-browser";
import { SqlDbDataStore } from "./SqlDbDataStore.js";
import { SqlDbModelStore } from "./SqlDbModelStore.js";

const browserInfo = detect();
console.log('browserInfo',browserInfo);

export async function SqlStoreFactory (
  applicationName: string,
  dataStoreType: DataStoreApplicationType,
  modelStore:ModelStoreInterface,
  dataStore:DataStoreInterface,
  modelConnectionString:string,
  modelSchema:string,
  dataConnectionString:string,
  dataSchema:string,
):Promise<StoreControllerInterface> {
  // const seq = await import("sequelize");


  const dataStore2 = new SqlDbDataStore(applicationName,dataStoreType,dataConnectionString,dataSchema);
  try {
    // await dataStore.connect();
    await dataStore2.connect();
    console.log('Application',applicationName,'dataStoreType',dataStoreType,'data Connection to postgres data schema', dataSchema, 'has been established successfully.');
  } catch (error) {
    console.error('Unable to connect data', dataSchema, ' to the postgres database:', error);
  }

  const modelStore2 = new SqlDbModelStore(applicationName,dataStoreType,modelConnectionString,modelSchema,dataStore2);
  try {
    // await modelStore.connect()
    await modelStore2.connect()
    console.log('Application',applicationName,'dataStoreType',dataStoreType,'model Connection to postgres model schema', modelSchema, 'has been established successfully.');
  } catch (error) {
    console.error('Unable to connect model to the postgres database:', error);
  }


  // const sqlDbServer:StoreControllerInterface = new StoreController(applicationName,dataStoreType,modelStore,dataStore);
  const sqlDbServer:StoreControllerInterface = new StoreController(applicationName,dataStoreType,modelStore2,dataStore2);
  return Promise.resolve(sqlDbServer);
}