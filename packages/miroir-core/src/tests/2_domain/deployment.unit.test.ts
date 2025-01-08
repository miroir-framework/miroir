// import { describe, expect } from 'vitest';

import { v4 as uuidv4 } from "uuid";

import { InitApplicationParameters } from "../../0_interfaces/4-services/PersistenceStoreControllerInterface.js";
import { getBasicApplicationConfiguration } from "../../2_domain/Deployment.js";
import {
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  selfApplicationDeploymentLibrary,
  selfApplicationLibrary,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationStoreBasedConfigurationLibrary,
  selfApplicationVersionLibraryInitialVersion,
} from "../../index.js";
import { defaultMiroirMetaModel } from "../1_core/alterObject.unit.test.js";
// const env:any = (import.meta as any).env
// console.log("@@@@@@@@@@@@@@@@@@ env", env);

// console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

// describe.sequential("templatesDEFUNCT.unit.test", () => {
describe("deployment.unit.test", () => {
  // ################################################################################################
  it("getBasicApplicationConfiguration_Library", async () => { // TODO: test failure cases!
      console.log(expect.getState().currentTestName, "START")

      const result:InitApplicationParameters = getBasicApplicationConfiguration("Library")
      const expectedResult: InitApplicationParameters = {
        dataStoreType:
          adminConfigurationDeploymentLibrary.uuid == adminConfigurationDeploymentMiroir.uuid ? "miroir" : "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
        metaModel: defaultMiroirMetaModel,
        // application: selfApplicationMiroir,
        application: {
          ...selfApplicationLibrary,
          "uuid": "5af03c98-fe5e-490b-b08f-e1230971c57f",
          // "parentName":"Application",
          // "parentUuid":"a659d350-dd97-4da9-91de-524fa01745dc",
          "name":"Library",
          // "name":applicationName,
          "defaultLabel": "The Library application.",
          "description": "The model and data of the Library application.",
          "selfApplication": "5af03c98-fe5e-490b-b08f-e1230971c57f"
        },
        adminApplicationDeploymentConfiguration: adminConfigurationDeploymentLibrary,
        selfApplicationDeploymentConfiguration: selfApplicationDeploymentLibrary,
        // applicationModelBranch: selfApplicationModelBranchMiroirMasterBranch,
        applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
        // applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationMiroir,
        applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationLibrary,
        // applicationVersion: selfApplicationVersionInitialMiroirVersion,
        applicationVersion: selfApplicationVersionLibraryInitialVersion,
      }

      const resultToCompare: any = {...result};
      delete resultToCompare.metaModel;
      const expectedResultToCompare: any = {...expectedResult};
      delete expectedResultToCompare.metaModel;
      console.log("################################", expect.getState().currentTestName, "result", JSON.stringify(resultToCompare,null,2))

      // console.log("################################ expectedResult", JSON.stringify(expectedResult,null,2))
      expect(resultToCompare).toEqual(expectedResultToCompare);

      console.log(expect.getState().currentTestName, "START")
    }
  );

  // ################################################################################################
  // it("getBasicApplicationConfiguration_Test", async () => { // TODO: test failure cases!
  //     console.log(expect.getState().currentTestName, "START")

  //     const applicationName = "Test"
  //     const applicationNameLC = applicationName.toLowerCase();
  //     // const applicationUuid = uuidv4();
  //     // const applicationUuid = "5af03c98-fe5e-490b-b08f-e1230971c57f";
  //     // const applicationUuid = "tttttttt-tttt-tttt-tttt-tttttttttttt";
  //     const applicationUuid = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  //     const deploymentUuid  = "dddddddd-dddd-dddd-dddd-dddddddddddd";
  //     const result:InitApplicationParameters = getBasicApplicationConfiguration("Test", applicationUuid)

  //     const expectedResult: InitApplicationParameters = {
  //       dataStoreType:
  //         adminConfigurationDeploymentLibrary.uuid == adminConfigurationDeploymentMiroir.uuid ? "miroir" : "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
  //       metaModel: defaultMiroirMetaModel,
  //       application: {
  //         ...selfApplicationLibrary,
  //         "uuid": applicationUuid,
  //         "name": applicationName,
  //         "defaultLabel": `The ${applicationName} application.`,
  //         "description": `The model and data of the ${applicationName} application.`,
  //         "selfApplication": applicationUuid
  //       },
  //       applicationDeploymentConfiguration: adminConfigurationDeploymentLibrary,
  //       selfApplicationDeploymentConfiguration: {
  //         ...selfApplicationDeploymentLibrary,
  //         application: applicationUuid,
  //       },
  //       // applicationModelBranch: selfApplicationModelBranchMiroirMasterBranch,
  //       applicationModelBranch: {
  //         ...selfApplicationModelBranchLibraryMasterBranch,
  //         application: applicationUuid,
  //       } as any,
  //       // applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationMiroir,
  //       applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationLibrary,
  //       // applicationVersion: selfApplicationVersionInitialMiroirVersion,
  //       applicationVersion: {
  //         ...selfApplicationVersionLibraryInitialVersion,
  //         application: applicationUuid,
  //       } as any,
  //     }

  //     const resultToCompare: any = {...result};
  //     delete resultToCompare.metaModel;
  //     const expectedResultToCompare: any = {...expectedResult};
  //     delete expectedResultToCompare.metaModel;
  //     console.log("################################", expect.getState().currentTestName, "result", JSON.stringify(resultToCompare,null,2))

  //     // console.log("################################ expectedResult", JSON.stringify(expectedResult,null,2))
  //     expect(resultToCompare).toEqual(expectedResultToCompare);

  //     console.log(expect.getState().currentTestName, "START")
  //   }
  // );

});
