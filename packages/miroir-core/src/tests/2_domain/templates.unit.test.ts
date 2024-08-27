import { v4 as uuidv4 } from 'uuid';
// import { describe, expect } from 'vitest';

import { renderObjectBuildTemplate, renderObjectRuntimeTemplate } from "../../2_domain/Templates.js";
import {
  DomainAction,
  StoreUnitConfiguration,
  ObjectBuildTemplate,
  DomainElementObject,
  RuntimeTransformer,
  EntityInstance,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { book1, book2, book3, book4, book5, book6 } from '../../index.js';
import { object } from 'zod';
// const env:any = (import.meta as any).env
// console.log("@@@@@@@@@@@@@@@@@@ env", env);

// console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

// describe.sequential("templatesDEFUNCT.unit.test", () => {
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

      const newDeploymentStoreConfiguration: StoreUnitConfiguration = renderObjectBuildTemplate(
        "ROOT",
        newDeploymentStoreConfigurationTemplate as any,
        {
          elementType: "object",
          elementValue: {
            newApplicationName: { elementType: "string", elementValue: newApplicationName }
          }
        },
        undefined
      ).elementValue as StoreUnitConfiguration;

      const actionParams: DomainElementObject = {
        elementType: "object",
        elementValue: {
          newApplicationName: { elementType: "string", elementValue: newApplicationName },
          newAdminAppApplicationUuid: { elementType: "string", elementValue: newAdminAppApplicationUuid },
          newSelfApplicationUuid: { elementType: "string", elementValue: newSelfApplicationUuid },
          newDeploymentUuid: { elementType: "string", elementValue: newDeploymentUuid },
        }
      }

      const testAction /*: ObjectBuildTemplate */ = {
        actionType: "storeManagementAction",
        actionName: "openStore",
        endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        configuration: {
          templateType: "fullObjectTemplate",
          definition: [
            {
              attributeKey: {
                templateType: "parameterReference",
                referenceName: "newDeploymentUuid"
              },
              attributeValue: newDeploymentStoreConfigurationTemplate
              // {
              //   templateType: "parameterReference",
              //   referenceName: "newDeploymentStoreConfiguration"
              // },
            }
          ]
        },
        deploymentUuid: {
          templateType: "parameterReference",
          referenceName: "newDeploymentUuid"
        }
      }
      const convertedAction: DomainAction = renderObjectBuildTemplate(
        "ROOT",
        testAction as any,
        actionParams,
        undefined
      ).elementValue as DomainAction;

      const expectedAction: DomainAction = {
        "actionType": "storeManagementAction",
        "actionName": "openStore",
        "endpoint": "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        "configuration": {
          [newDeploymentUuid]: newDeploymentStoreConfiguration
        },
        deploymentUuid: newDeploymentUuid
      };

      console.log("################################ expectedAction", JSON.stringify(expectedAction,null,2))
      console.log("################################ convertedAction", JSON.stringify(convertedAction,null,2))
      expect(convertedAction).toEqual(expectedAction
        // {
        //   "actionType": "storeManagementAction",
        //   "actionName": "openStore",
        //   "endpoint": "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        //   "configuration": {
        //     [newDeploymentUuid]: newDeploymentStoreConfiguration
        //   },
        //   deploymentUuid: newDeploymentUuid
        // }
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

      const mustacheTemplate:ObjectBuildTemplate = {
        templateType: "mustacheStringTemplate",
        definition: "{{newApplicationName}}Application"
      }

      const testResult: string = renderObjectBuildTemplate(
        "ROOT",
        mustacheTemplate,
        { elementType: "object", elementValue: {newApplicationName: { elementType: "string", elementValue: newApplicationName }} },
        undefined
      ).elementValue as string;

      console.log("################################ converted template", testResult)
      expect(testResult).toEqual("testApplication");
      console.log("convert mustache string END")
    }
  );

  // ################################################################################################
  it("unique authors from books runtime template", async () => { // TODO: test failure cases!
      // if (miroirConfig.client.emulateServer) {
      console.log("convert mustache string START")
      const newApplicationName = "test";

      const uniqueRuntimeTemplate:RuntimeTransformer = {
        templateType: "unique",
        interpolation: "runtime",
        referencedExtractor: "books",
        attribute: "author",
        orderBy: "author",
      }

      const testResult: string = renderObjectRuntimeTemplate(
        "ROOT",
        uniqueRuntimeTemplate,
        { elementType: "object", elementValue: {} }, // queryParams
        {
          elementType: "object",
          elementValue: {
            books: {
              elementType: "instanceUuidIndex",
              elementValue: Object.fromEntries(
                [
                  book1 as EntityInstance,
                  book2 as EntityInstance,
                  book3 as EntityInstance,
                  book4 as EntityInstance,
                  book5 as EntityInstance,
                  book6 as EntityInstance,
                ].map((book: EntityInstance) => {
                  return [book.uuid, book];
                })
              ),
            },
          },
        } // context
        // undefined
      ).elementValue as string;

      console.log("################################ converted template", testResult)
      expect(testResult).toEqual(
        [
          { author: "4441169e-0c22-4fbc-81b2-28c87cf48ab2" },
          { author: "ce7b601d-be5f-4bc6-a5af-14091594046a" },
          { author: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17" },
          { author: "e4376314-d197-457c-aa5e-d2da5f8d5977" },
        ]
      );
      console.log("convert mustache string END")
    }
  );

  // ################################################################################################
  it("count books by author runtime template", async () => { // TODO: test failure cases!
      // if (miroirConfig.client.emulateServer) {
      console.log("count books by author runtime template START")
      const newApplicationName = "test";

      const uniqueRuntimeTemplate:RuntimeTransformer = {
        templateType: "count",
        interpolation: "runtime",
        referencedExtractor: "books",
        groupBy: "author",
        orderBy: "author",
      }

      const testResult: string = renderObjectRuntimeTemplate(
        "ROOT",
        uniqueRuntimeTemplate,
        { elementType: "object", elementValue: {} }, // queryParams
        {
          elementType: "object",
          elementValue: {
            books: {
              elementType: "instanceUuidIndex",
              elementValue: Object.fromEntries(
                [
                  book1 as EntityInstance,
                  book2 as EntityInstance,
                  book3 as EntityInstance,
                  book4 as EntityInstance,
                  book5 as EntityInstance,
                  book6 as EntityInstance,
                ].map((book: EntityInstance) => {
                  return [book.uuid, book];
                })
              ),
            },
          },
        } // context
        // undefined
      ).elementValue as string;

      console.log("################################ count books by author runtime template", testResult)
      expect(testResult).toEqual(
        [
          { author: "4441169e-0c22-4fbc-81b2-28c87cf48ab2", count: 1 },
          { author: "ce7b601d-be5f-4bc6-a5af-14091594046a", count: 2 },
          { author: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17", count: 2 },
          { author: "e4376314-d197-457c-aa5e-d2da5f8d5977", count: 1 },
        ]
      );
      console.log("convert mustache string END")
    }
  );

});
