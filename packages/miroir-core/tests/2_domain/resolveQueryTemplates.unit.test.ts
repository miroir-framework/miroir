import { miroirTest_resolveQueryTemplates } from "miroir-test-app_deployment-miroir";

import type { DeployedMiroirTestExport } from "../helpers/runDeployedMiroirTestSuite";
import { runDeployedMiroirTestSuiteLoader } from "../helpers/runDeployedMiroirTestSuiteLoader";

await runDeployedMiroirTestSuiteLoader(
  miroirTest_resolveQueryTemplates as DeployedMiroirTestExport,
  "resolveQueryTemplates.unit.test",
);
