import { SelfApplicationDeploymentConfiguration } from "./0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

// duplicated from server!!!!!!!!
export const applicationDeploymentLibrary: SelfApplicationDeploymentConfiguration = {
  "uuid":"f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  "parentName":"SelfApplicationDeploymentConfiguration",
  "parentUuid":"35c5608a-7678-4f07-a4ec-76fc5bc35424",
  // "type":"singleNode",
  "name":"LibraryApplicationPostgresDeployment",
  "defaultLabel":"LibraryApplicationPostgresDeployment",
  "selfApplication":"5af03c98-fe5e-490b-b08f-e1230971c57f",
  "description": "The default Postgres Deployment for SelfApplication Library",
  // "applicationModelLevel": "model",
  "model": {
    "location": {
      "type": "sql",
      "side":"server",
      "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
      "schema": "library"
    }
  },
  "data": {
    "location": {
      "type": "sql",
      "side":"server",
      "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
      "schema": "library"
    }
  }
}
