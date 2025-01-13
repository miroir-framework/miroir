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
  StoreSectionConfiguration,
} from "../../index.js";
import { defaultMiroirMetaModel } from "../1_core/alterObject.unit.test.js";
import { AdminApplicationDeploymentConfiguration } from "../../0_interfaces/1_core/StorageConfiguration.js";
// const env:any = (import.meta as any).env
// console.log("@@@@@@@@@@@@@@@@@@ env", env);

// console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);
const typedAdminConfigurationDeploymentLibrary:AdminApplicationDeploymentConfiguration = adminConfigurationDeploymentLibrary as any;
// describe.sequential("templatesDEFUNCT.unit.test", () => {
describe("deployment.unit.test", () => {
  // ################################################################################################
  it("getBasicApplicationConfiguration_Library", async () => { // TODO: test failure cases!
      console.log(expect.getState().currentTestName, "START")

      const result: InitApplicationParameters = getBasicApplicationConfiguration(
        "Library",
        selfApplicationLibrary.uuid,
        adminConfigurationDeploymentLibrary.uuid,
        selfApplicationModelBranchLibraryMasterBranch.uuid,
        selfApplicationVersionLibraryInitialVersion.uuid,
      );
      const expectedResult: InitApplicationParameters = {
        dataStoreType:
          adminConfigurationDeploymentLibrary.uuid == adminConfigurationDeploymentMiroir.uuid ? "miroir" : "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
        metaModel: defaultMiroirMetaModel,
        // selfApplication: selfApplicationMiroir,
        selfApplication: {
          ...selfApplicationLibrary,
          "uuid": "5af03c98-fe5e-490b-b08f-e1230971c57f",
          "name":"Library",
          "defaultLabel": "The Library selfApplication",
          "description": "The model and data of the Library selfApplication",
        },
        // adminApplicationDeploymentConfiguration: typedAdminConfigurationDeploymentLibrary,
        // selfApplicationDeploymentConfiguration: selfApplicationDeploymentLibrary,
        applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
        // applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationLibrary,
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
  it("getBasicApplicationConfiguration_Test", async () => { // TODO: test failure cases!
      console.log(expect.getState().currentTestName, "START")

      const applicationName = "Test"
      const applicationNameLC = applicationName.toLowerCase();
      // const applicationUuid = uuidv4();
      // const applicationUuid = "5af03c98-fe5e-490b-b08f-e1230971c57f";
      // const applicationUuid = "tttttttt-tttt-tttt-tttt-tttttttttttt";
      const selfApplicationUuid = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
      const adminApplicationDeploymentConfigurationUuid  = "dddddddd-dddd-dddd-dddd-dddddddddddd";
      const applicationModelBranchUuid = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
      const selfApplicationVersionUuid = "vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvvv";
      const result: InitApplicationParameters = getBasicApplicationConfiguration(
        "Test",
        selfApplicationUuid,
        adminApplicationDeploymentConfigurationUuid,
        applicationModelBranchUuid,
        selfApplicationVersionUuid,
      );

      const expectedResult: InitApplicationParameters = {
        dataStoreType:
          adminConfigurationDeploymentLibrary.uuid == adminConfigurationDeploymentMiroir.uuid ? "miroir" : "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
        metaModel: defaultMiroirMetaModel,
        // adminApplicationDeploymentConfiguration: {
        //   ...typedAdminConfigurationDeploymentLibrary,
        //   uuid: adminApplicationDeploymentConfigurationUuid,
        //   selfApplication: selfApplicationUuid,
        //   configuration: {
        //     ...typedAdminConfigurationDeploymentLibrary.configuration,
        //     // admin: {
        //     //   ...adminConfigurationDeploymentLibrary.configuration.admin,
        //     //   directory:  `../miroir-core/src/assets/admin`
        //     // },
        //     model: {
        //       ...adminConfigurationDeploymentLibrary.configuration.model,
        //       directory: `../miroir-core/src/assets/${applicationNameLC}_model`,
        //     } as StoreSectionConfiguration,
        //     data: {
        //       ...adminConfigurationDeploymentLibrary.configuration.model,
        //       directory: `../miroir-core/src/assets/${applicationNameLC}_data`,
        //     } as StoreSectionConfiguration,
        //   },
        // },
        selfApplication: {
          ...selfApplicationLibrary,
          uuid: selfApplicationUuid,
          name: applicationName,
          defaultLabel: `The ${applicationName} selfApplication`,
          description: `The model and data of the ${applicationName} selfApplication`,
        },
        // selfApplicationDeploymentConfiguration: {
        //   ...selfApplicationDeploymentLibrary,
        //   uuid: adminApplicationDeploymentConfigurationUuid,
        //   selfApplication: selfApplicationUuid,
        // },
        applicationModelBranch: {
          ...selfApplicationModelBranchLibraryMasterBranch,
          uuid: applicationModelBranchUuid,
          selfApplication: selfApplicationUuid,
          headVersion: selfApplicationVersionUuid,
          description: `The master branch of the ${applicationName} SelfApplication`,
        } as any,
        // applicationStoreBasedConfiguration: {
        //   ...selfApplicationStoreBasedConfigurationLibrary,
        //   defaultLabel: `The reference configuration for the ${applicationName} selfApplication storage`,
        // } as any,
        applicationVersion: {
          ...selfApplicationVersionLibraryInitialVersion,
          uuid: selfApplicationVersionUuid,
          branch: applicationModelBranchUuid,
          selfApplication: selfApplicationUuid,
          description: `Initial ${applicationName} selfApplication version`,
        } as any,
      };

      const resultToCompare: any = {...result};
      delete resultToCompare.metaModel;
      const expectedResultToCompare: any = {...expectedResult};
      delete expectedResultToCompare.metaModel;
      console.log(
        "################################",
        expect.getState().currentTestName,
        "result",
        JSON.stringify(resultToCompare, null, 2)
      );

      // console.log("################################ expectedResult", JSON.stringify(expectedResult,null,2))
      expect(resultToCompare).toEqual(expectedResultToCompare);

      console.log(expect.getState().currentTestName, "START")
    }
  );

});
