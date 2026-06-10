import { miroirTest_tools } from "miroir-test-app_deployment-miroir";

import type { DeployedMiroirTestExport } from "./helpers/runDeployedMiroirTestSuite";
import { runDeployedMiroirTestSuiteLoader } from "./helpers/runDeployedMiroirTestSuiteLoader";

await runDeployedMiroirTestSuiteLoader(
  miroirTest_tools as DeployedMiroirTestExport,
  "tools.test",
);
