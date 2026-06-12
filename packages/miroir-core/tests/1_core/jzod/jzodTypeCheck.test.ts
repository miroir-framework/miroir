import * as vitest from "vitest";

import { miroirTest_jzodTypeCheck } from "miroir-test-app_deployment-miroir";

import type { MiroirTestSuite } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { runMiroirCoreTestSuite } from "../../helpers/runMiroirCoreTestSuite";

const vitestArgs = process.argv.slice(2);
const filePattern = vitestArgs.find((arg) => !arg.startsWith("-")) || "";

const shouldSkip = filePattern.includes("resolveConditionalSchema");

if (shouldSkip) {
  console.log("skipping jzodTypeCheck.test (resolveConditionalSchema pattern)");
  vitest.test.skip("jzodTypeCheck.test skipped (resolveConditionalSchema pattern)", () => {});
} else {
  await runMiroirCoreTestSuite(
    miroirTest_jzodTypeCheck.definition as MiroirTestSuite,
    "jzodTypeCheck.test",
    { honorRunTest: false },
  );
}
