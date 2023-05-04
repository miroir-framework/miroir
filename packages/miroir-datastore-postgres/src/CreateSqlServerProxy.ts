import { DataStoreApplicationType, DataStoreInterface } from "miroir-core";
import { SqlDbDatastore } from "src/sqlDbDatastore";
import { detect } from "detect-browser";

const browserInfo = detect();
console.log('browserInfo',browserInfo);

export async function createSqlServerProxy (
  applicationName: string,
  dataStoreType: DataStoreApplicationType,
  modelConnectionString:string,
  modelSchema:string,
  dataConnectionString:string,
  dataSchema:string,
):Promise<DataStoreInterface> {
  const seq = await import("sequelize");

  const modelSequelize = new seq.Sequelize(modelConnectionString,{schema:modelSchema,logging: (...msg) => console.log(msg)}) // Example for postgres
  try {
    await modelSequelize.authenticate();
    console.log('model Connection to postgres model schema', modelSchema, 'has been established successfully.');
  } catch (error) {
    console.error('Unable to connect model to the postgres database:', error);
  }

  const dataSequelize = new seq.Sequelize(dataConnectionString,{schema:dataSchema,logging: (...msg) => console.log(msg)}) // Example for postgres
  try {
    await dataSequelize.authenticate();
    console.log('data Connection to postgres has been established successfully.');
  } catch (error) {
    console.error('Unable to connect data', dataSchema, ' to the postgres database:', error);
  }

  const sqlDbServer:DataStoreInterface = new SqlDbDatastore(applicationName,dataStoreType,modelSequelize,modelSchema,dataSequelize,dataSchema);
  return Promise.resolve(sqlDbServer);
}