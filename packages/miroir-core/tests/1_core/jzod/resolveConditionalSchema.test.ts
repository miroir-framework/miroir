// import * as vitest from 'vitest';
// import { describe, expect, it } from "vitest";
import {
  describe,
  expect,
} from "../../../src/1_core/test-expect";


import entityBook from "../../../src/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json";
import adminConfigurationDeploymentLibrary from "../../../src/assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json";

import { EntityInstance, type TransformerTestSuite } from "../../../src//0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { JzodElement } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import entityDefinitionCountry from "../../../src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/56628e31-3db5-4c5c-9328-4ff7ce54c36a.json";

import folio from "../../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/1f550a2a-33f5-4a56-83ee-302701039494.json";
import penguin from "../../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/516a7366-39e7-4998-82cb-80199a7fa667.json";
import springer from "../../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/c1c97d54-aba8-4599-883a-7fe8f3874095.json";
import author1 from "../../../src/assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/4441169e-0c22-4fbc-81b2-28c87cf48ab2.json";
import author2 from "../../../src/assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/ce7b601d-be5f-4bc6-a5af-14091594046a.json";
import author3 from "../../../src/assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17.json";
import author4 from "../../../src/assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/e4376314-d197-457c-aa5e-d2da5f8d5977.json";
import book1 from "../../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f.json";
import book2 from "../../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/e20e276b-619d-4e16-8816-b7ec37b53439.json";
import book3 from "../../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/4cb917b3-3c53-4f9b-b000-b0e4c07a81f7.json";
import book4 from "../../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/6fefa647-7ecf-4f83-b617-69d7d5094c37.json";
import book5 from "../../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c97be567-bd70-449f-843e-cd1d64ac1ddd.json";
import book6 from "../../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c6852e89-3c3c-447f-b827-4b5b9d830975.json";
// import test1 from "../../../src/assets/library_data/9ad64893-5f8f-4eaf-91aa-ffae110f88c8/150bacfd-06d0-4ecb-828d-f5275494448a.json";
import Country1 from "../../../src/assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/2eda1207-4dcc-4af9-a3ba-ef75e7f12c11.json";
import Country2 from "../../../src/assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/30b8e7c6-b75d-4db0-906f-fa81fa5c4cc0.json";
import Country3 from "../../../src/assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/b62fc20b-dcf5-4e3b-a247-62d0475cf60f.json";
import Country4 from "../../../src/assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/b6ddfb89-4301-48bf-9ed9-4ed6ee9261fe.json";

import publisher1 from "../../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/1f550a2a-33f5-4a56-83ee-302701039494.json";
import publisher2 from "../../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/516a7366-39e7-4998-82cb-80199a7fa667.json";
import publisher3 from "../../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/c1c97d54-aba8-4599-883a-7fe8f3874095.json";
// import { json } from "sequelize";
// import { transformerTestSuite_spreadsheet } from "./transformersTests_spreadsheet.data";
import {
  ignoreFailureAttributes,
  runTransformerTestInMemory,
  runTransformerTestSuite,
  transformerTestsDisplayResults,
} from "../../../src/4_services/TestTools";
import { Step } from "../../../src/2_domain/Transformers";



// import { adminConfigurationDeploymentLibrary } from "../../../dist/index.cjs";
import { DomainState } from "../../../src/0_interfaces/2_domain/DomainControllerInterface";
import { ReduxDeploymentsState } from "../../../src/0_interfaces/2_domain/ReduxDeploymentsStateInterface";
import { resolveConditionalSchema } from "../../../src/1_core/jzod/resolveConditionalSchema";
import { domainStateToReduxDeploymentsState } from "../../../src/tools";
import domainStateImport from "../../2_domain/domainState.json";


import transformerTestSuite_resolveConditionalSchema from "../../../src/assets/miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/3f025c6c-982d-47ed-8061-50009788773a.json";


const domainState: DomainState = domainStateImport as DomainState;
const reduxDeploymentsState: ReduxDeploymentsState = domainStateToReduxDeploymentsState(domainState);


const RUN_TEST= process.env.RUN_TEST
console.log("@@@@@@@@@@@@@@@@@@ RUN_TEST", RUN_TEST);

const selectedTestName: string[] = ["error if reduxDeploymentsState is missing when parentUuid is present"];

// ################################################################################################
// const testSuiteName = "transformers.unit.test";
if (RUN_TEST == transformerTestSuite_resolveConditionalSchema.definition.transformerTestLabel) {
  const testSuite: TransformerTestSuite = transformerTestSuite_resolveConditionalSchema.definition as TransformerTestSuite;
  // if (!Object.hasOwn(testSuite, "transformerTestType") || (testSuite as any).transformerTests === undefined) {
  if (!Object.hasOwn(testSuite, "transformerTestType") || testSuite.transformerTestType !== "transformerTestSuite" ) {
    throw new Error("No transformerTests found in the test suite definition" +  JSON.stringify(testSuite));
  }
  const selectedTests = selectedTestName.length > 0? Object.fromEntries(Object.entries((testSuite as any).transformerTests).filter(
    ([key, test]) => selectedTestName.includes((test as any).transformerTestLabel)
  )): (testSuite as any).transformerTests;
  const effectiveTests: TransformerTestSuite = {
    ...testSuite,
    transformerTests: selectedTests as any
  } as any;
  await runTransformerTestSuite(
    { describe, expect},//vitest,
    [],
    // transformerTestSuite_resolveConditionalSchema.definition as TransformerTestSuite,
    effectiveTests,
    runTransformerTestInMemory
  );
  transformerTestsDisplayResults(
    // transformerTestSuite_resolveConditionalSchema.definition as TransformerTestSuite,
    effectiveTests,
    RUN_TEST,
    transformerTestSuite_resolveConditionalSchema.definition.transformerTestLabel
  );
} else {
  console.log(
    "################################ skipping test suite:",
    transformerTestSuite_resolveConditionalSchema.definition.transformerTestLabel
  );
}
