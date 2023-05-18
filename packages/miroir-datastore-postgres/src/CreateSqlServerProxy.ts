import { DataStoreApplicationType, StoreFacadeInterface } from "miroir-core";
import { SqlDbStoreFacade } from "src/SqlDbStoreFacade";
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
):Promise<StoreFacadeInterface> {
  const seq = await import("sequelize");

  // const modelSequelize = new seq.Sequelize(modelConnectionString,{schema:modelSchema,logging: (...msg) => console.log(msg)}) // Example for postgres
  const modelSequelize = new seq.Sequelize(modelConnectionString,{schema:modelSchema}) // Example for postgres
  try {
    await modelSequelize.authenticate();
    console.log('Application',applicationName,'dataStoreType',dataStoreType,'model Connection to postgres model schema', modelSchema, 'has been established successfully.');
  } catch (error) {
    console.error('Unable to connect model to the postgres database:', error);
  }

  // const dataSequelize = new seq.Sequelize(dataConnectionString,{schema:dataSchema,logging: (...msg) => console.log(msg)}) // Example for postgres
  const dataSequelize = new seq.Sequelize(dataConnectionString,{schema:dataSchema}) // Example for postgres
  try {
    await dataSequelize.authenticate();
    console.log('Application',applicationName,'dataStoreType',dataStoreType,'data Connection to postgres data schema', dataSchema, 'has been established successfully.');
  } catch (error) {
    console.error('Unable to connect data', dataSchema, ' to the postgres database:', error);
  }

  const sqlDbServer:StoreFacadeInterface = new SqlDbStoreFacade(applicationName,dataStoreType,modelSequelize,modelSchema,dataSequelize,dataSchema);
  return Promise.resolve(sqlDbServer);
}