import { miroirTest_jzodObjectFlatten } from "miroir-test-app_deployment-miroir";

import type { DeployedMiroirTestExport } from "../../helpers/runDeployedMiroirTestSuite";
import { runDeployedMiroirTestSuiteLoader } from "../../helpers/runDeployedMiroirTestSuiteLoader";

await runDeployedMiroirTestSuiteLoader(
  miroirTest_jzodObjectFlatten.definition as DeployedMiroirTestExport,
  "jzodObjectFlatten.test",
);
