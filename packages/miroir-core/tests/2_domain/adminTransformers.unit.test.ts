import { miroirTest_adminTransformers } from "miroir-test-app_deployment-miroir";

import type { DeployedMiroirTestExport } from "../helpers/runDeployedMiroirTestSuite";
import { runDeployedMiroirTestSuiteLoader } from "../helpers/runDeployedMiroirTestSuiteLoader";

await runDeployedMiroirTestSuiteLoader(
  miroirTest_adminTransformers.definition as DeployedMiroirTestExport,
  "adminTransformers.unit.test",
);
