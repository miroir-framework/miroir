import { DataStoreInterface } from "miroir-core";
import { SqlDbServer } from "src/sqlDbServer";
import { detect } from "detect-browser";

const browserInfo = detect();
console.log('browserInfo',browserInfo);

let createServerInt;

export async function createServer (
    connectionString:string,
  ):Promise<DataStoreInterface> {
    const seq = await import("sequelize");

    const sequelize = new seq.Sequelize(connectionString,{logging: (...msg) => console.log(msg)}) // Example for postgres
    try {
      await sequelize.authenticate();
      console.log('Connection to postgres has been established successfully.');
    } catch (error) {
      console.error('Unable to connect to the postgres database:', error);
    }
  
    const sqlDbServer:DataStoreInterface = new SqlDbServer(sequelize);
    return Promise.resolve(sqlDbServer);
  }