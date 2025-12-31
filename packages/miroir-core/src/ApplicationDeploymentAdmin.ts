import { SelfApplicationDeploymentConfiguration } from "./0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

// duplicated from server!!!!!!!!
// TODO: REMOVE!!!!!
export const applicationDeploymentAdmin: SelfApplicationDeploymentConfiguration = {
  "uuid":"18db21bf-f8d3-4f6a-8296-84b69f6dc48b",
  "parentName":"SelfApplicationDeploymentConfiguration",
  "parentUuid":"7959d814-400c-4e80-988f-a00fe582ab98",
  // "type":"singleNode",
  "name":"AmdinApplicationPostgresDeployment",
  "defaultLabel":"AdminApplicationPostgresDeployment",
  "selfApplication":"55af124e-8c05-4bae-a3ef-0933d41daa92",
  "description": "The default Postgres Deployment for SelfApplication Admin",
  // "applicationModelLevel": "model",
  // "admin": {
  //   "location": {
  //     "type": "sql",
  //     "side":"server",
  //     "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
  //     "schema": "library"
  //   }
  // },
  // "model": {
  //   "location": {
  //     "type": "sql",
  //     "side":"server",
  //     "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
  //     "schema": "admin"
  //   }
  // },
  // "data": {
  //   "location": {
  //     "type": "sql",
  //     "side":"server",
  //     "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
  //     "schema": "admin"
  //   }
  // }
}
