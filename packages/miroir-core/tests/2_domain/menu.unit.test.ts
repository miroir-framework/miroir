import { miroirTest_menu } from "miroir-test-app_deployment-miroir";

import { runMiroirCoreTestSuite } from "../helpers/runMiroirCoreTestSuite";

const vitestArgs = process.argv.slice(2);
const filePattern = vitestArgs.find((arg) => !arg.startsWith("-")) || "";
const shouldSkip = filePattern.includes("resolveConditionalSchema");

if (shouldSkip) {
  console.log("skipping menu.unit.test (resolveConditionalSchema pattern)");
} else {
  await runMiroirCoreTestSuite(miroirTest_menu, "menu.unit.test");
}
