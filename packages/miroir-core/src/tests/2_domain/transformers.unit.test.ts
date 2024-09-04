import { v4 as uuidv4 } from 'uuid';
// import { describe, expect } from 'vitest';

import { transformer_apply } from "../../2_domain/Transformers.js";
import {
  DomainAction,
  StoreUnitConfiguration,
  TransformerForBuild,
  DomainElementObject,
  TransformerForRuntime,
  EntityInstance,
  TransformerForRuntime_InnerReference,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { book1, book2, book3, book4, book5, book6, Country1, Country2, Country3, Country4, ignorePostgresExtraAttributesOnList, ignorePostgresExtraAttributesOnRecord } from '../../index.js';
import { object } from 'zod';
// const env:any = (import.meta as any).env
// console.log("@@@@@@@@@@@@@@@@@@ env", env);

// console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

// describe.sequential("templatesDEFUNCT.unit.test", () => {
describe("transformers.unit.test", () => {

  // ################################################################################################
  it("convert basic template", async () => { // TODO: test failure cases!
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

      const newDeploymentStoreConfiguration: StoreUnitConfiguration = transformer_apply(
        "build",
        "ROOT",
        newDeploymentStoreConfigurationTemplate as any,
        { newApplicationName },
        undefined
      ).elementValue as StoreUnitConfiguration;

      const actionParams: Record<string, any> = {
        newApplicationName,
        newAdminAppApplicationUuid,
        newSelfApplicationUuid,
        newDeploymentUuid,
      }

      const testAction /*: TransformerForBuild */ = {
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
            }
          ]
        },
        deploymentUuid: {
          templateType: "parameterReference",
          referenceName: "newDeploymentUuid"
        }
      }
      const convertedAction: DomainAction = transformer_apply(
        "build",
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

      const mustacheTemplate:TransformerForBuild = {
        templateType: "mustacheStringTemplate",
        definition: "{{newApplicationName}}Application"
      }

      const testResult: string = transformer_apply(
        "build",
        "ROOT",
        mustacheTemplate,
        { newApplicationName },
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

      const uniqueRuntimeTemplate:TransformerForRuntime = {
        templateType: "unique",
        interpolation: "runtime",
        referencedExtractor: "books",
        attribute: "author",
        orderBy: "author",
      }

      const testResult: string = transformer_apply(
        "runtime",
        "ROOT",
        uniqueRuntimeTemplate,
        { }, // queryParams
        {
          books: Object.fromEntries(
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
        }, // context
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

      const uniqueRuntimeTemplate:TransformerForRuntime = {
        templateType: "count",
        interpolation: "runtime",
        referencedExtractor: "books",
        groupBy: "author",
        orderBy: "author",
      }

      const testResult: string = transformer_apply(
        "runtime",
        "ROOT",
        uniqueRuntimeTemplate,
        { }, // queryParams
        {
          books: Object.fromEntries(
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

  // ################################################################################################
  it("built custom object with runtime template", async () => { // TODO: test failure cases!
      // if (miroirConfig.client.emulateServer) {
      console.log("built custom object with runtime template START")
      const newApplicationName = "test";
      const newUuid = uuidv4();

      const uniqueRuntimeTemplate:TransformerForRuntime = {
        templateType: "fullObjectTemplate",
        interpolation: "runtime",
        referencedExtractor: "country",
        definition: [
          {
            attributeKey: {
              interpolation: "runtime",
              templateType: "constantUuid",
              constantUuidValue: "uuid"
            },
            attributeValue: {
              interpolation: "runtime",
              templateType: "parameterReference",
              referenceName: "newUuid"
            }
          },
          {
            attributeKey: {
              interpolation: "runtime",
              templateType: "constantUuid",
              constantUuidValue: "name"
            },
            attributeValue: {
              templateType: "mustacheStringTemplate",
              interpolation: "runtime",
              definition: "{{country.iso3166-1Alpha-2}}"
            }
          }
        ]
      }

      const testResult: string = transformer_apply(
        "runtime",
        "ROOT",
        uniqueRuntimeTemplate,
        { newUuid },
        {
          country: Country1 as EntityInstance,
        } // context
      ).elementValue as string;

      console.log("################################ count books by author runtime template", testResult)
      expect(testResult).toEqual(
        { uuid: newUuid, name: "US"  },
      );
      console.log("convert mustache string END")
    }
  );

  // ################################################################################################
  it("build custom object InstanceUuidIndex with runtime transformer", async () => { // TODO: test failure cases!
      console.log("build custom object list with runtime transformer START")
      const newApplicationName = "test";
      const newUuid = uuidv4();

      const uniqueRuntimeTemplate:TransformerForRuntime = {
        templateType: "listMapper",
        interpolation: "runtime",
        referencedExtractor: "countries",
        elementTransformer: {
          templateType: "fullObjectTemplate",
          interpolation: "runtime",
          referencedExtractor: "country",
          definition: [
            {
              attributeKey: {
                interpolation: "runtime",
                templateType: "constantUuid",
                constantUuidValue: "uuid"
              },
              attributeValue: {
                interpolation: "runtime",
                templateType: "newUuid",
              }
            },
            {
              attributeKey: {
                interpolation: "runtime",
                templateType: "constantUuid",
                constantUuidValue: "name"
              },
              attributeValue: {
                templateType: "mustacheStringTemplate",
                interpolation: "runtime",
                definition: "{{country.iso3166-1Alpha-2}}"
              }
            }
          ]
        }
      }

      // const preTestResult: {[k: string]: {[l:string]: any}} = transformer_apply(
      const preTestResult: {[k: string]: {[l:string]: any}} = transformer_apply(
        "runtime",
        "ROOT",
        // uniqueRuntimeTemplate,
        uniqueRuntimeTemplate as any,
        {
          newUuid: newUuid ,
        }, // queryParams
        {
          countries: [
              Country1 as EntityInstance,
              Country2 as EntityInstance,
              Country3 as EntityInstance,
              Country4 as EntityInstance,
          ],
        } // context
      ).elementValue;

      console.log("################################ build custom object list with runtime transformer preTestResult", preTestResult)
      const testResult = ignorePostgresExtraAttributesOnList(preTestResult as any,["uuid"]); // uuid value is ignored
      console.log("################################ build custom object list with runtime transformer", testResult)
      expect(testResult).toEqual(
        [
          { name: 'US' },
          { name: 'DE' },
          { name: 'FR' },
          { name: 'GB' },
        ]
      );
      console.log("build custom object list with runtime transformer END")
    }
  );

});
