import { unitTest_suite_menu } from "miroir-test-app_deployment-miroir";

import { runDeployedUnitTestSuite } from "../helpers/runDeployedUnitTestSuite";

const vitestArgs = process.argv.slice(2);
const filePattern = vitestArgs.find((arg) => !arg.startsWith("-")) || "";
const shouldSkip = filePattern.includes("resolveConditionalSchema");

if (shouldSkip) {
  console.log("skipping menu.unit.test (resolveConditionalSchema pattern)");
} else {
  await runDeployedUnitTestSuite(unitTest_suite_menu, "menu.unit.test");
}
