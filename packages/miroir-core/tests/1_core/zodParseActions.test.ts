"use strict";

import { describe, expect } from 'vitest';
import { ZodTypeAny } from "zod";

import {
  ActionError,
  domainAction,
  DomainAction,
  Entity,
  EntityDefinition,
  ZodParseError
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import { InitApplicationParameters } from "../../src/0_interfaces/4-services/PersistenceStoreControllerInterface";
import entityEntity from "../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json";
import entityDefinitionEntity from "../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json";



import { zodErrorDeepestIssueLeaves } from "../../src/1_core/zodParseErrorHandler";
import { defaultMiroirMetaModel } from './defaultMiroirMetaModel';

import { Uuid } from '../../src/0_interfaces/1_core/EntityDefinition.js';
import { getBasicApplicationConfiguration } from '../../src/2_domain/Deployment.js';

const testSuiteName = "transformers.integ.test";

const testApplicationName = "testApplication"
const sqlDbStoreName = "testStoreName"
const connectionString = "postgres://postgres:postgres@localhost:5432/postgres"
// const schema = "testSchema"
const schema = testApplicationName;
const paramSelfApplicationUuid = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const paramAdminConfigurationDeploymentUuid: Uuid = "bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const applicationModelBranchUuid: Uuid = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const selfApplicationVersionUuid: Uuid = "dddddddd-dddd-dddd-dddd-dddddddddddd";

const testApplicationConfig: InitApplicationParameters = getBasicApplicationConfiguration(
  testApplicationName,
  paramSelfApplicationUuid,
  // {
  //   emulatedServerType: "sql",
  //   connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  // },
  paramAdminConfigurationDeploymentUuid,
  applicationModelBranchUuid,
  selfApplicationVersionUuid
);

// ################################################################################################
// TS VALIDATION TESTS ############################################################################
// ################################################################################################
const actionTest1: ActionError = {
  status: "error",
  errorType: "FailedToGetInstances",
  errorMessage: "Failed to get instances",
};

// ################################################################################################
// ZOD VALIDATION TESTS ###########################################################################
// ################################################################################################
type ZodParseTest = {
  zodSchema: ZodTypeAny,
  action: DomainAction
}

const actionsZodParseTests: Record<string, ZodParseTest> = {
  // // error actions
  // "actionError is parsable": {
  //   zodSchema: actionError,
  //   action: actionTest1,
  // },
  // model actions
  "commit ModelAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "commit",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
    },
  },
  "rollback ModelAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "rollback",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
    },
  },
  "initModel ModelAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "initModel",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
      params: {
        dataStoreType: "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
        // metaModel: defaultMiroirMetaModel,
        metaModel: {
          entities: [],
          entityDefinitions: [],
          jzodSchemas: [],
          menus: [],
          applicationVersions: [],
          reports: [],
          applicationVersionCrossEntityDefinition: [],
        },
        // TODO: this is wrong, selfApplication, selfApplication version, etc. must be passed as parameters!!!!!!!!!!!!!!!!!!!!
        selfApplication: testApplicationConfig.selfApplication,
        applicationModelBranch: testApplicationConfig.applicationModelBranch,
        applicationVersion: testApplicationConfig.applicationVersion,
      },
    },
  },
  "resetModel ModelAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "resetModel",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
    },
  },
  "resetData ModelAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "resetData",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
    },
  },
  "alterEntityAttribute ModelAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "alterEntityAttribute",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
      entityDefinitionUuid: "00000000-0000-0000-0000-000000000001",
      entityName: "newEntity",
      entityUuid: "00000000-0000-0000-0000-000000000002",
      addColumns: [
        {
          name: "aNewColumnForTest",
          definition: {
            type: "number",
            optional: true,
            tag: { value: { id: 6, defaultLabel: "Gender (narrow-minded)", editable: true } },
          },
        },
      ],
    },
  },
  "renameEntity ModelAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "renameEntity",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
      entityDefinitionUuid: "00000000-0000-0000-0000-000000000001",
      entityName: "newEntity",
      entityUuid: "00000000-0000-0000-0000-000000000002",
      targetValue: "renamedEntity",
    },
  },
  "createEntity ModelAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "createEntity",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
      entities: [
        {
          entity: entityEntity as Entity,
          entityDefinition: entityDefinitionEntity as EntityDefinition,
        },
      ]
    }
  },
  "dropEntity ModelAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "dropEntity",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
      entityDefinitionUuid: "00000000-0000-0000-0000-000000000001",
      entityUuid: "00000000-0000-0000-0000-000000000002",
    },
  },
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
describe("zodParseActions", () => {
  it.each(Object.entries(actionsZodParseTests))("%s", (testName, testParams) => {
    const { zodSchema, action } = testParams;
    console.log(expect.getState().currentTestName, "action to test=", JSON.stringify(action, null, 2));
    try {
      zodSchema.parse(action);
      expect(true).toBe(true); // Pass the test if parsing does not throw an error
    } catch (error) {
      const zodParseError = error as ZodParseError;
      console.error("Zod parse error :", JSON.stringify(zodErrorDeepestIssueLeaves(zodParseError), null, 2));
      expect(true).toBe(false); // Fail the test if parsing throws an error
      // throw error; // Re-throw the error to fail the test
    }
  });
});


  // it("reportCountryList.definition.extractorTemplates.countries is parsable by extractorOrCombinerTemplate", () => {
  //   const zodSchema = extractorOrCombinerTemplate
  //   const transformer = reportCountryList.definition.extractorTemplates.countries;
  //   console.log("transformer to test=", JSON.stringify(transformer, null, 2));
  //   expect(() => zodSchema.parse(transformer)).not.toThrow();
  // });

  // it("reportCountryList.definition.extractorTemplates is parsable by extractorOrCombinerTemplateRecord", () => {
  //   const zodSchema = extractorOrCombinerTemplateRecord
  //   const transformer = reportCountryList.definition.extractorTemplates;
  //   console.log("transformer to test=", JSON.stringify(transformer, null, 2));
  //   expect(() => zodSchema.parse(transformer)).not.toThrow();
  // });

  // it("reportCountryList.definition is parsable by rootReport", () => {
  //   const zodSchema = rootReport
  //   const transformer = reportCountryList.definition;
  //   console.log("transformer to test=", JSON.stringify(transformer, null, 2));
  //   expect(() => zodSchema.parse(transformer)).not.toThrow();
  // });
// });


// })