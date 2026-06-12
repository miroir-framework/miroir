import { miroirTest_modelUpdates } from "miroir-test-app_deployment-miroir";

import type { DeployedMiroirTestExport } from "../helpers/runDeployedMiroirTestSuite";
import { runDeployedMiroirTestSuiteLoader } from "../helpers/runDeployedMiroirTestSuiteLoader";

await runDeployedMiroirTestSuiteLoader(
  miroirTest_modelUpdates.definition as DeployedMiroirTestExport,
  "modelUpdates.unit.test",
);
