import * as vitest from "vitest";

import { miroirTest_unfoldSchemaOnce } from "miroir-test-app_deployment-miroir";

import type { DeployedMiroirTestExport } from "../../helpers/runDeployedMiroirTestSuite";
import { runDeployedMiroirTestSuiteLoader } from "../../helpers/runDeployedMiroirTestSuiteLoader";

const vitestArgs = process.argv.slice(2);
const filePattern = vitestArgs.find((arg) => !arg.startsWith("-")) || "";

const shouldSkip = filePattern.includes("resolveConditionalSchema");

if (shouldSkip) {
  console.log("skipping unfoldSchemaOnce.test (resolveConditionalSchema pattern)");
  vitest.test.skip("unfoldSchemaOnce.test skipped (resolveConditionalSchema pattern)", () => {});
} else {
  await runDeployedMiroirTestSuiteLoader(
    miroirTest_unfoldSchemaOnce as DeployedMiroirTestExport,
    "unfoldSchemaOnce.test",
    { honorRunTest: false },
  );
}
