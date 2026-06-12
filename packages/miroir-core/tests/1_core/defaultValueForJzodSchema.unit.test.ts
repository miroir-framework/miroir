import * as vitest from "vitest";

import { miroirTest_defaultValueForMLSchema } from "miroir-test-app_deployment-miroir";

import type { DeployedMiroirTestExport } from "../helpers/runDeployedMiroirTestSuite";
import { runDeployedMiroirTestSuiteLoader } from "../helpers/runDeployedMiroirTestSuiteLoader";

const vitestArgs = process.argv.slice(2);
const filePattern = vitestArgs.find((arg) => !arg.startsWith("-")) || "";

const shouldRun = filePattern.includes("resolveConditionalSchema") || !filePattern;

if (!shouldRun) {
  console.log("skipping defaultValueForJzodSchema.unit.test");
  vitest.test.skip("defaultValueForJzodSchema.unit.test skipped", () => {});
} else {
  await runDeployedMiroirTestSuiteLoader(
    miroirTest_defaultValueForMLSchema.definition as DeployedMiroirTestExport,
    "defaultValueForJzodSchema.unit.test",
    { honorRunTest: false },
  );
}
