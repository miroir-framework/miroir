import * as vitest from "vitest";

import { miroirTest_unfoldSchemaOnce } from "miroir-test-app_deployment-miroir";

import type { MiroirTestSuite } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { runDeployedMiroirTestSuiteLoader } from "../../helpers/runDeployedMiroirTestSuiteLoader";

const vitestArgs = process.argv.slice(2);
const filePattern = vitestArgs.find((arg) => !arg.startsWith("-")) || "";

const shouldSkip = filePattern.includes("resolveConditionalSchema");

if (shouldSkip) {
  console.log("skipping unfoldSchemaOnce.test (resolveConditionalSchema pattern)");
  vitest.test.skip("unfoldSchemaOnce.test skipped (resolveConditionalSchema pattern)", () => {});
} else {
  await runDeployedMiroirTestSuiteLoader(
    miroirTest_unfoldSchemaOnce.definition as MiroirTestSuite,
    "unfoldSchemaOnce.test",
    { honorRunTest: false },
  );
}
