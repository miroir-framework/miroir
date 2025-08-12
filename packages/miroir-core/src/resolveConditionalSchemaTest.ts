import * as vitest from 'vitest';
import { describe, expect, it } from "vitest";

import entityBook from "./assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json";
import adminConfigurationDeploymentLibrary from "./assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json";

import { EntityInstance, type TransformerTestSuite } from "./0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { JzodElement } from "./0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import entityDefinitionCountry from "./assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/56628e31-3db5-4c5c-9328-4ff7ce54c36a.json";

import folio from "./assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/1f550a2a-33f5-4a56-83ee-302701039494.json";
import penguin from "./assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/516a7366-39e7-4998-82cb-80199a7fa667.json";
import springer from "./assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/c1c97d54-aba8-4599-883a-7fe8f3874095.json";
import author1 from "./assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/4441169e-0c22-4fbc-81b2-28c87cf48ab2.json";
import author2 from "./assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/ce7b601d-be5f-4bc6-a5af-14091594046a.json";
import author3 from "./assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17.json";
import author4 from "./assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/e4376314-d197-457c-aa5e-d2da5f8d5977.json";
import book1 from "./assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f.json";
import book2 from "./assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/e20e276b-619d-4e16-8816-b7ec37b53439.json";
import book3 from "./assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/4cb917b3-3c53-4f9b-b000-b0e4c07a81f7.json";
import book4 from "./assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/6fefa647-7ecf-4f83-b617-69d7d5094c37.json";
import book5 from "./assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c97be567-bd70-449f-843e-cd1d64ac1ddd.json";
import book6 from "./assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c6852e89-3c3c-447f-b827-4b5b9d830975.json";
// import test1 from "../../../src/assets/library_data/9ad64893-5f8f-4eaf-91aa-ffae110f88c8/150bacfd-06d0-4ecb-828d-f5275494448a.json";
import Country1 from "./assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/2eda1207-4dcc-4af9-a3ba-ef75e7f12c11.json";
import Country2 from "./assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/30b8e7c6-b75d-4db0-906f-fa81fa5c4cc0.json";
import Country3 from "./assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/b62fc20b-dcf5-4e3b-a247-62d0475cf60f.json";
import Country4 from "./assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/b6ddfb89-4301-48bf-9ed9-4ed6ee9261fe.json";

import publisher1 from "./assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/1f550a2a-33f5-4a56-83ee-302701039494.json";
import publisher2 from "./assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/516a7366-39e7-4998-82cb-80199a7fa667.json";
import publisher3 from "./assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/c1c97d54-aba8-4599-883a-7fe8f3874095.json";
// import { json } from "sequelize";
// import { transformerTestSuite_spreadsheet } from "./transformersTests_spreadsheet.data";
import {
  ignoreFailureAttributes,
  runTransformerTestInMemory,
  runTransformerTestSuite,
  // TransformerTest,
  transformerTestsDisplayResults,
  // TransformerTestSuite,
} from "./4_services/TestTools";
import { Step } from "./2_domain/TransformersForRuntime";



// import { adminConfigurationDeploymentLibrary } from "../../../dist/index.cjs";
import { DomainState } from "./0_interfaces/2_domain/DomainControllerInterface";
import { ReduxDeploymentsState } from "./0_interfaces/2_domain/ReduxDeploymentsStateInterface";
import { resolveConditionalSchema } from "./1_core/jzod/resolveConditionalSchema";
import { domainStateToReduxDeploymentsState } from "./tools";
import domainStateImport from "./domainState.json";



const domainState: DomainState = domainStateImport as DomainState;
const reduxDeploymentsState: ReduxDeploymentsState = domainStateToReduxDeploymentsState(domainState);

export const transformerTestSuite_resolveConditionalSchema: TransformerTestSuite = {
  transformerTestType: "transformerTestSuite",
  transformerTestLabel: "resolveConditionalSchema",
  transformerTests: {
    resolveConditionalSchema: {
      transformerTestType: "transformerTestSuite",
      transformerTestLabel: "resolveConditionalSchema",
      transformerTests: {
        "returns the original schema if no conditionalMMLS tag is present": {
          transformerTestType: "transformerTest",
          transformerTestLabel: "returns the original schema if no conditionalMMLS tag is present",
          transformerName: "resolveConditionalSchema",
          runTestStep: "build",
          transformer: {
            transformerType: "resolveConditionalSchema",
            interpolation: "build",
            schema: { type: "string" },
            valueObject: "test",
            context: "defaultValue",
            valuePath: [],
            // deploymentUuid: "dummyDeploymentUuid",
          },
          transformerParams: {},
          expectedValue: { type: "string" },
        },
        "returns the original schema if conditionalMMLS tag is present but no parentUuid": {
          transformerTestType: "transformerTest",
          transformerTestLabel:
            "returns the original schema if conditionalMMLS tag is present but no parentUuid",
          transformerName: "resolveConditionalSchema",
          runTestStep: "build",
          transformer: {
            transformerType: "resolveConditionalSchema",
            interpolation: "build",
            schema: { type: "string", tag: { value: { conditionalMMLS: {} } } },
            valueObject: "test",
            context: "defaultValue",
            valuePath: [],
            // deploymentUuid: "dummyDeploymentUuid",
          },
          transformerParams: {},
          expectedValue: { type: "string", tag: { value: { conditionalMMLS: {} } } },
        },
        "returns error if reduxDeploymentsState is missing when parentUuid is present": {
          transformerTestType: "transformerTest",
          transformerTestLabel:
            "returns error if reduxDeploymentsState is missing when parentUuid is present",
          transformerName: "resolveConditionalSchema",
          runTestStep: "build",
          transformer: {
            transformerType: "resolveConditionalSchema",
            interpolation: "build",
            schema: {
              type: "object",
              definition: {
                a: {
                  type: "object",
                  definition: { b: { type: "string" } },
                },
                c: {
                  type: "object",
                  definition: {
                    d: {
                      type: "any",
                      tag: {
                        value: {
                          conditionalMMLS: { parentUuid: { path: "#.notExistingAttribute" } },
                        },
                      },
                    },
                  },
                },
              },
            },
            valueObject: {},
            context: "defaultValue",
            valuePath: ["c", "d"],
            // deploymentUuid: "dummyDeploymentUuid",
          },
          transformerParams: {},
          expectedValue: { error: "NO_REDUX_DEPLOYMENTS_STATE" },
        },
        "returns error if no value found at given parentUuid path": {
          transformerTestType: "transformerTest",
          transformerTestLabel: "returns error if no value found at given parentUuid path",
          transformerName: "resolveConditionalSchema",
          runTestStep: "build",
          transformer: {
            transformerType: "resolveConditionalSchema",
            interpolation: "build",
            schema: {
              type: "object",
              definition: {
                a: {
                  type: "object",
                  definition: { b: { type: "string" } },
                },
                c: {
                  type: "object",
                  definition: {
                    d: {
                      type: "any",
                      tag: {
                        value: {
                          conditionalMMLS: { parentUuid: { path: "#.notExistingAttribute" } },
                        },
                      },
                    },
                  },
                },
              },
            },
            valueObject: {},
            context: "defaultValue",
            valuePath: ["c", "d"],
            // deploymentUuid: "dummyDeploymentUuid",
          },
          transformerParams: {},
          expectedValue: {
            error: "INVALID_PARENT_UUID_CONFIG",
            details:
              'parentUuid resolution failed: {\n  "error": "PATH_SEGMENT_NOT_FOUND",\n  "segment": "notExistingAttribute",\n  "acc": {}\n}',
          },
        },
        "resolves schema using legacy single path configuration": {
          transformerTestType: "transformerTest",
          transformerTestLabel: "resolves schema using legacy single path configuration",
          transformerName: "resolveConditionalSchema",
          runTestStep: "build",
          transformer: {
            transformerType: "resolveConditionalSchema",
            interpolation: "build",
            schema: {
              type: "object",
              definition: {
                a: {
                  type: "object",
                  definition: { b: { type: "string" } },
                },
                c: {
                  type: "object",
                  definition: {
                    d: {
                      type: "any",
                      tag: { value: { conditionalMMLS: { parentUuid: { path: "#.e" } } } },
                    },
                    e: { type: "string" },
                  },
                },
              },
            },
            valueObject: {},
            context: "defaultValue",
            valuePath: ["c", "d"],
            // deploymentUuid: "dummyDeploymentUuid",
          },
          transformerParams: {},
          expectedValue: {
            type: "object",
            definition: {
              uuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                tag: { id: 1, defaultLabel: "Uuid", editable: false },
              },
              parentName: {
                type: "simpleType",
                definition: "string",
                optional: true,
                tag: { id: 2, defaultLabel: "Entity Name", editable: false },
              },
              parentUuid: {
                type: "simpleType",
                definition: "string",
                validations: [{ type: "uuid" }],
                tag: { id: 3, defaultLabel: "Entity Uuid", editable: false },
              },
              name: {
                type: "simpleType",
                definition: "string",
                tag: { id: 4, defaultLabel: "Name", editable: true },
              },
              author: {
                type: "simpleType",
                definition: "string",
                validations: [
                  {
                    type: "uuid",
                  },
                ],
                optional: true,
                tag: {
                  id: 5,
                  defaultLabel: "Author",
                  targetEntity: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
                  editable: true,
                },
              },
              publisher: {
                type: "simpleType",
                definition: "string",
                validations: [
                  {
                    type: "uuid",
                  },
                ],
                optional: true,
                tag: {
                  id: 5,
                  defaultLabel: "Publisher",
                  targetEntity: "a027c379-8468-43a5-ba4d-bf618be25cab",
                  editable: true,
                },
              },
            },
          },
        },
      },
    },
  },
};

