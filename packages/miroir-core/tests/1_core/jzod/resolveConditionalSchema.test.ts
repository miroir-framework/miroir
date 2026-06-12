import * as vitest from "vitest";

import { miroirTest_resolveConditionalSchema } from "miroir-test-app_deployment-miroir";

import type { DeployedMiroirTestExport } from "../../helpers/runDeployedMiroirTestSuite";
import { runDeployedMiroirTestSuiteLoader } from "../../helpers/runDeployedMiroirTestSuiteLoader";

const VITEST_FILTER = process.env.VITEST_FILTER;
const vitestArgs = process.argv.slice(2);
const filePattern = vitestArgs.find((arg) => !arg.startsWith("-")) || "";

const testSuiteName = "resolveConditionalSchema.test";
const currentFileName =
  (typeof __filename !== "undefined"
    ? __filename.split(/[\\/]/).pop()?.replace(".ts", "")
    : "") || "";

const shouldRun =
  !filePattern ||
  currentFileName.includes(filePattern) ||
  testSuiteName.includes(filePattern) ||
  (VITEST_FILTER !== undefined && testSuiteName.match(VITEST_FILTER) !== null);

if (!shouldRun) {
  console.log("skipping resolveConditionalSchema.test");
  vitest.test.skip("resolveConditionalSchema.test skipped", () => {});
} else {
  await runDeployedMiroirTestSuiteLoader(
    miroirTest_resolveConditionalSchema.definition as DeployedMiroirTestExport,
    testSuiteName,
    {
      honorRunTest: false,
      filter: {
        testList: {
          resolveConditionalSchema: ["fails when wrong parentUuid is given"],
        },
      },
    },
  );
}
