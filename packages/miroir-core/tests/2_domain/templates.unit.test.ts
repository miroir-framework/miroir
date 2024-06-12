import { v4 as uuidv4 } from 'uuid';
// import { describe, expect } from 'vitest';

import { ObjectTemplate, objectTemplateToObject } from "../../src/2_domain/Templates";
import {
  DomainAction,
  StoreUnitConfiguration,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
// const env:any = (import.meta as any).env
// console.log("@@@@@@@@@@@@@@@@@@ env", env);

// console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

// describe.sequential("templates.unit.test", () => {
describe("templates.unit.test", () => {

  // ################################################################################################
  it("convert basic template", async () => { // TODO: test failure cases!
      // if (miroirConfig.client.emulateServer) {
      console.log("convert basic template START")
      const newApplicationName = "test";
      const newAdminAppApplicationUuid = uuidv4();
      const newSelfApplicationUuid = uuidv4();
      const newDeploymentUuid = uuidv4();

      const newDeploymentStoreConfigurationTemplate = {
        "admin": {
          "emulatedServerType": "sql",
          "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
          "schema": "miroirAdmin"
        },
        "model": {
          "emulatedServerType": "sql",
          "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
          "schema": {
            templateType: "parameterReference",
            referenceName: "newApplicationName",
            applyFunction: (a:string) => (a + "Model")
          }
        },
        "data": {
          "emulatedServerType": "sql",
          "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
          "schema": {
            templateType: "parameterReference",
            referenceName: "newApplicationName",
            applyFunction: (a:string) => (a + "Data")
          }
          // "schema": newApplicationName + "Data"
        }
      }

      const newDeploymentStoreConfiguration: StoreUnitConfiguration = objectTemplateToObject(
        "ROOT",
        newDeploymentStoreConfigurationTemplate as any,
        {newApplicationName},
        undefined
      );

      // console.log("test result", newDeploymentStoreConfiguration)
      // // test
      // expect(newDeploymentStoreConfiguration).toEqual({
      //   admin: {
      //     emulatedServerType: 'sql',
      //     connectionString: 'postgres://postgres:postgres@localhost:5432/postgres',
      //     schema: 'miroirAdmin'
      //   },
      //   model: {
      //     emulatedServerType: 'sql',
      //     connectionString: 'postgres://postgres:postgres@localhost:5432/postgres',
      //     schema: 'testModel'
      //   },
      //   data: {
      //     emulatedServerType: 'sql',
      //     connectionString: 'postgres://postgres:postgres@localhost:5432/postgres',
      //     schema: 'testData'
      //   }
      // })

      // ##########################################################################################
      const actionParams = {
        newApplicationName,
        newAdminAppApplicationUuid,
        newSelfApplicationUuid,
        newDeploymentUuid,
        // newDeploymentStoreConfiguration,
        // submitMiroirConfig,
      }

      const testAction /*: ObjectTemplate */ = {
        actionType: "storeManagementAction",
        actionName: "openStore",
        endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        configuration: {
          templateType: "fullObjectTemplate",
          definition: [
            [
              {
                templateType: "parameterReference",
                referenceName: "newDeploymentUuid"
              },
              newDeploymentStoreConfigurationTemplate
              // {
              //   templateType: "parameterReference",
              //   referenceName: "newDeploymentStoreConfiguration"
              // },
            ]
          ]
        },
        deploymentUuid: {
          templateType: "parameterReference",
          referenceName: "newDeploymentUuid"
        }
      }
      const convertedAction: DomainAction = objectTemplateToObject(
        "ROOT",
        testAction as any,
        actionParams,
        undefined
      );

      // console.log("################################ convertedAction", JSON.stringify(convertedAction,null,2))
      expect(convertedAction).toEqual(
        {
          "actionType": "storeManagementAction",
          "actionName": "openStore",
          "endpoint": "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          "configuration": {
            [newDeploymentUuid]: newDeploymentStoreConfiguration
          },
          deploymentUuid: newDeploymentUuid
        }
      )
    ;


      console.log("convert basic template END")
    }
  );

  // ################################################################################################
  it("convert mustache string template", async () => { // TODO: test failure cases!
      // if (miroirConfig.client.emulateServer) {
      console.log("convert mustache string START")
      const newApplicationName = "test";

      const mustacheTemplate:ObjectTemplate = {
        templateType: "mustacheStringTemplate",
        definition: "{{newApplicationName}}Application"
      }

      const testResult: string = objectTemplateToObject(
        "ROOT",
        mustacheTemplate,
        {newApplicationName},
        undefined
      );


      console.log("################################ converted template", testResult)
      expect(testResult).toEqual("testApplication");
    console.log("convert mustache string END")
    }
  );

});
