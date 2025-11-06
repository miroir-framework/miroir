import {
  adminConfigurationDeploymentMiroir,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentParis,
} from "miroir-core";
// import { adminConfigurationDeploymentParis } from "./miroir-fwk/4_view/routes/ReportPage.js";

export const packageName = "miroir-standalone-app";
export const cleanLevel = "5";


// ################################################################################################
// export type ReportUrlParamKeys = 'deploymentUuid' | 'applicationSection' | 'reportUuid' | 'instanceUuid';
export type ReportUrlParamKeys =
  | "deploymentUuid"
  | "applicationSection"
  | "reportUuid"
  | "instanceUuid"
  | "useReportViewWithEditor";


// ################################################################################################
// to place in admin_data/7959d814-400c-4e80-988f-a00fe582ab98/
export const adminConfigurationDeploymentTest4 = {
  "parentName": "Deployment",
  "parentUuid": "7959d814-400c-4e80-988f-a00fe582ab98",
  "uuid": "f97cce64-78e9-419f-a4bd-5cbf52833ede",
  "name": "test4ApplicationSqlDeployment",
  "defaultLabel": "test4ApplicationSqlDeployment",
  "selfApplication": "0e7e56a9-ef59-4bf1-b17e-c710444d969e",
  "description": "The default Sql Deployment for SelfApplication test4",
  "configuration": {
      "admin": {
          "emulatedServerType": "sql",
          "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
          "schema": "miroirAdmin"
      },
      "model": {
          "emulatedServerType": "sql",
          "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
          "schema": "test4Model"
      },
      "data": {
          "emulatedServerType": "sql",
          "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
          "schema": "test4Data"
      }
  }
}

export const adminConfigurationDeploymentTest1 = {
  "uuid":"15e2004a-e7a0-4b9e-8acd-6d3500a6c9ad",
  "parentName":"Deployment",
  "parentUuid":"7959d814-400c-4e80-988f-a00fe582ab98",
  "type":"singleNode",
  "name":"Test1ApplicationFilesystemDeployment",
  "defaultLabel":"Test1ApplicationFilesystemDeployment",
  "selfApplication":"1acc4342-8180-445b-9766-7cb91e55ca6c",
  "description": "The default Filesystem Deployment for SelfApplication Test1",
  "configuration": {
    "admin": {
      "emulatedServerType": "filesystem",
      "directory":"../miroir-core/src/assets/admin"
    },
    "model": {
      "emulatedServerType": "filesystem",
      "directory":"../miroir-core/src/assets/test1_model"
    },
    "data": {
      "emulatedServerType": "filesystem",
      "directory":"../miroir-core/src/assets/test1_data"
    }
  }
}

// ################################################################################################
export const defaultMenuParisUuid = "84c178cc-1b1b-497a-a035-9b3d756bb085";
export const selfApplicationParis = {
  "uuid": "70e02039-e283-4381-9575-8c52aed18a87",
  "parentName": "SelfApplication",
  "parentUuid": "25d935e7-9e93-42c2-aade-0472b883492b",
  "name": "Paris",
  "defaultLabel": "The Paris selfApplication.",
  "description": "This selfApplication contains the Paris model and data",
  "selfApplication": "70e02039-e283-4381-9575-8c52aed18a87"
};
export const applicationParis = {
  "uuid": "a118ba22-1be2-423f-aa77-f0baaa76313f",
  "parentName": "SelfApplication",
  "parentUuid": "25d935e7-9e93-42c2-aade-0472b883492b",
  "name": "Paris",
  "defaultLabel": "The Paris selfApplication.",
  "description": "This selfApplication contains the Paris model and data",
  "selfApplication": "70e02039-e283-4381-9575-8c52aed18a87"
};
// export const adminConfigurationDeploymentParis = {
//   uuid: "3d15b8c8-a74c-48ce-81d5-c76853803b90",
//   parentName: "Deployment",
//   parentUuid: "7959d814-400c-4e80-988f-a00fe582ab98",
//   name: "ParisApplicationSqlDeployment",
//   defaultLabel: "ParisApplicationSqlDeployment",
//   selfApplication: "70e02039-e283-4381-9575-8c52aed18a87",
//   description: "The default Sql Deployment for SelfApplication Paris",
//   configuration: {
//     admin: {
//       emulatedServerType: "sql",
//       connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
//       schema: "miroirAdmin",
//     },
//     model: {
//       emulatedServerType: "sql",
//       connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
//       schema: "ParisModel",
//     },
//     data: {
//       emulatedServerType: "sql",
//       connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
//       schema: "ParisData",
//     },
//   },
// };


export const deployments = [
  adminConfigurationDeploymentMiroir,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentAdmin,
  // adminConfigurationDeploymentTest1,
  // adminConfigurationDeploymentTest4,
  adminConfigurationDeploymentParis,
] as any[]; //type for Admin SelfApplication Deployment Entity Definition
