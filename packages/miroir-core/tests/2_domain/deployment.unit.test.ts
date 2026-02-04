// // import { describe, expect, it } from 'vitest';

// import { v4 as uuidv4 } from "uuid";

// import { InitApplicationParameters } from "../../src/0_interfaces/4-services/PersistenceStoreControllerInterface";
// import { getBasicApplicationConfiguration } from "../../src/2_domain/Deployment";
// // import adminConfigurationDeploymentLibrary from "../../src/assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json";

// import menuDefaultAdmin from "../../src/assets/admin_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json";
// import adminConfigurationDeploymentAdmin from "../../src/assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/18db21bf-f8d3-4f6a-8296-84b69f6dc48b.json";
// import adminConfigurationDeploymentMiroir from "../../src/assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json";
// // import adminConfigurationDeploymentTest1 from "../../src/assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/15e2004a-e7a0-4b9e-8acd-6d3500a6c9ad.json";
// import entityApplicationForAdmin from "../../src/assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/25d935e7-9e93-42c2-aade-0472b883492b.json";
// // import entityDeployment from "../../src/assets/admin_model/16dbfe28-e1d7-4fa8-b3fa-f2c007fdbe24/7959d814-400c-4e80-988f-a00fe582ab98.json";
// import entityDefinitionDeployment from "../../src/assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/c50240e7-c451-46c2-b60a-07b3172a5ef9.json";
// // import adminApplicationLibrary from "../../src/assets/admin_data/25d935e7-9e93-42c2-aade-0472b883492b/5af03c98-fe5e-490b-b08f-e1230971c57f.json";
// // import selfApplicationLibrary from "../../src/assets/library_model/a659d350-dd97-4da9-91de-524fa01745dc/5af03c98-fe5e-490b-b08f-e1230971c57f.json";
// // import selfApplicationStoreBasedConfigurationLibrary from "../../src/assets/library_model/7990c0c9-86c3-40a1-a121-036c91b55ed7/2e5b7948-ff33-4917-acac-6ae6e1ef364f.json";
// // import selfApplicationVersionLibraryInitialVersion from "../../src/assets/library_model/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/419773b4-a73c-46ca-8913-0ee27fb2ce0a.json";
// // import selfApplicationModelBranchLibraryMasterBranch from "../../src/assets/library_model/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/ad1ddc4e-556e-4598-9cff-706a2bde0be7.json";

// import selfApplicationDeploymentLibrary from "../../src/assets/library_model/35c5608a-7678-4f07-a4ec-76fc5bc35424/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json";

// import { defaultMiroirMetaModel } from "../../src/1_core/Model";
// import { AdminApplicationDeploymentConfiguration } from "../../src/0_interfaces/1_core/StorageConfiguration";
// // const env:any = (import.meta as any).env
// // console.log("@@@@@@@@@@@@@@@@@@ env", env);

// // console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);
// const typedAdminConfigurationDeploymentLibrary:AdminApplicationDeploymentConfiguration = adminConfigurationDeploymentLibrary as any;
// // describe.sequential("templatesDEFUNCT.unit.test", () => {
// describe("deployment.unit.test", () => {
//   // ################################################################################################
//   it("getBasicApplicationConfiguration_Library", async () => { // TODO: test failure cases!
//       console.log(expect.getState().currentTestName, "START")

//       const result: InitApplicationParameters = getBasicApplicationConfiguration(
//         "Library",
//         selfApplicationLibrary.uuid,
//         adminConfigurationDeploymentLibrary.uuid,
//         selfApplicationModelBranchLibraryMasterBranch.uuid,
//         selfApplicationVersionLibraryInitialVersion.uuid,
//       );
//       const expectedResult: InitApplicationParameters = {
//         dataStoreType:
//           adminConfigurationDeploymentLibrary.uuid == adminConfigurationDeploymentMiroir.uuid ? "miroir" : "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
//         metaModel: defaultMiroirMetaModel,
//         // selfApplication: selfApplicationMiroir,
//         selfApplication: {
//           ...selfApplicationLibrary,
//           "uuid": "5af03c98-fe5e-490b-b08f-e1230971c57f",
//           "name":"Library",
//           "defaultLabel": "The Library selfApplication",
//           "description": "The model and data of the Library selfApplication",
//         },
//         // adminApplicationDeploymentConfiguration: typedAdminConfigurationDeploymentLibrary,
//         // selfApplicationDeploymentConfiguration: selfApplicationDeploymentLibrary,
//         applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
//         // applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationLibrary,
//         applicationVersion: selfApplicationVersionLibraryInitialVersion,
//       }

//       const resultToCompare: any = {...result};
//       delete resultToCompare.metaModel;
//       const expectedResultToCompare: any = {...expectedResult};
//       delete expectedResultToCompare.metaModel;
//       console.log("################################", expect.getState().currentTestName, "result", JSON.stringify(resultToCompare,null,2))

//       // console.log("################################ expectedResult", JSON.stringify(expectedResult,null,2))
//       expect(resultToCompare).toEqual(expectedResultToCompare);

//       console.log(expect.getState().currentTestName, "START")
//     }
//   );

//   // ################################################################################################
//   it("getBasicApplicationConfiguration_Test", async () => { // TODO: test failure cases!
//       console.log(expect.getState().currentTestName, "START")

//       const applicationName = "Test"
//       const applicationNameLC = applicationName.toLowerCase();
//       // const applicationUuid = uuidv4();
//       // const applicationUuid = "5af03c98-fe5e-490b-b08f-e1230971c57f";
//       // const applicationUuid = "tttttttt-tttt-tttt-tttt-tttttttttttt";
//       const selfApplicationUuid = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
//       const adminApplicationDeploymentConfigurationUuid  = "dddddddd-dddd-dddd-dddd-dddddddddddd";
//       const applicationModelBranchUuid = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
//       const selfApplicationVersionUuid = "vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvvv";
//       const result: InitApplicationParameters = getBasicApplicationConfiguration(
//         "Test",
//         selfApplicationUuid,
//         adminApplicationDeploymentConfigurationUuid,
//         applicationModelBranchUuid,
//         selfApplicationVersionUuid,
//       );

//       const expectedResult: InitApplicationParameters = {
//         dataStoreType:
//           adminConfigurationDeploymentLibrary.uuid == adminConfigurationDeploymentMiroir.uuid ? "miroir" : "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
//         metaModel: defaultMiroirMetaModel,
//         // adminApplicationDeploymentConfiguration: {
//         //   ...typedAdminConfigurationDeploymentLibrary,
//         //   uuid: adminApplicationDeploymentConfigurationUuid,
//         //   selfApplication: selfApplicationUuid,
//         //   configuration: {
//         //     ...typedAdminConfigurationDeploymentLibrary.configuration,
//         //     // admin: {
//         //     //   ...adminConfigurationDeploymentLibrary.configuration.admin,
//         //     //   directory:  `../miroir-core/src/assets/admin`
//         //     // },
//         //     model: {
//         //       ...adminConfigurationDeploymentLibrary.configuration.model,
//         //       directory: `../miroir-core/src/assets/${applicationNameLC}_model`,
//         //     } as StoreSectionConfiguration,
//         //     data: {
//         //       ...adminConfigurationDeploymentLibrary.configuration.model,
//         //       directory: `../miroir-core/src/assets/${applicationNameLC}_data`,
//         //     } as StoreSectionConfiguration,
//         //   },
//         // },
//         selfApplication: {
//           ...selfApplicationLibrary,
//           uuid: selfApplicationUuid,
//           name: applicationName,
//           defaultLabel: `The ${applicationName} selfApplication`,
//           description: `The model and data of the ${applicationName} selfApplication`,
//         },
//         // selfApplicationDeploymentConfiguration: {
//         //   ...selfApplicationDeploymentLibrary,
//         //   uuid: adminApplicationDeploymentConfigurationUuid,
//         //   selfApplication: selfApplicationUuid,
//         // },
//         applicationModelBranch: {
//           ...selfApplicationModelBranchLibraryMasterBranch,
//           uuid: applicationModelBranchUuid,
//           selfApplication: selfApplicationUuid,
//           headVersion: selfApplicationVersionUuid,
//           description: `The master branch of the ${applicationName} SelfApplication`,
//         } as any,
//         // applicationStoreBasedConfiguration: {
//         //   ...selfApplicationStoreBasedConfigurationLibrary,
//         //   defaultLabel: `The reference configuration for the ${applicationName} selfApplication storage`,
//         // } as any,
//         applicationVersion: {
//           ...selfApplicationVersionLibraryInitialVersion,
//           uuid: selfApplicationVersionUuid,
//           branch: applicationModelBranchUuid,
//           selfApplication: selfApplicationUuid,
//           description: `Initial ${applicationName} selfApplication version`,
//         } as any,
//       };

//       const resultToCompare: any = {...result};
//       delete resultToCompare.metaModel;
//       const expectedResultToCompare: any = {...expectedResult};
//       delete expectedResultToCompare.metaModel;
//       console.log(
//         "################################",
//         expect.getState().currentTestName,
//         "result",
//         JSON.stringify(resultToCompare, null, 2)
//       );

//       // console.log("################################ expectedResult", JSON.stringify(expectedResult,null,2))
//       expect(resultToCompare).toEqual(expectedResultToCompare);

//       console.log(expect.getState().currentTestName, "START")
//     }
//   );

// });
