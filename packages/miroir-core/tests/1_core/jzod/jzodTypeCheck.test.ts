import * as vitest from "vitest";

import { miroirTest_jzodTypeCheck } from "miroir-test-app_deployment-miroir";

import type { DeployedMiroirTestExport } from "../../helpers/runDeployedMiroirTestSuite";
import { runDeployedMiroirTestSuiteLoader } from "../../helpers/runDeployedMiroirTestSuiteLoader";

const vitestArgs = process.argv.slice(2);
const filePattern = vitestArgs.find((arg) => !arg.startsWith("-")) || "";

const shouldSkip = filePattern.includes("resolveConditionalSchema");

if (shouldSkip) {
  console.log("skipping jzodTypeCheck.test (resolveConditionalSchema pattern)");
  vitest.test.skip("jzodTypeCheck.test skipped (resolveConditionalSchema pattern)", () => {});
} else {
  await runDeployedMiroirTestSuiteLoader(
    miroirTest_jzodTypeCheck as DeployedMiroirTestExport,
    "jzodTypeCheck.test",
    { honorRunTest: false },
  );
}
