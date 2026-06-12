import * as vitest from "vitest";

import { miroirTest_defaultValueForMLSchema } from "miroir-test-app_deployment-miroir";

import type { MiroirTestSuite } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { runDeployedMiroirTestSuiteLoader } from "../helpers/runDeployedMiroirTestSuiteLoader";

const vitestArgs = process.argv.slice(2);
const filePattern = vitestArgs.find((arg) => !arg.startsWith("-")) || "";

const shouldRun = filePattern.includes("resolveConditionalSchema") || !filePattern;

if (!shouldRun) {
  console.log("skipping defaultValueForJzodSchema.unit.test");
  vitest.test.skip("defaultValueForJzodSchema.unit.test skipped", () => {});
} else {
  await runDeployedMiroirTestSuiteLoader(
    miroirTest_defaultValueForMLSchema.definition as MiroirTestSuite,
    "defaultValueForJzodSchema.unit.test",
    { honorRunTest: false },
  );
}
