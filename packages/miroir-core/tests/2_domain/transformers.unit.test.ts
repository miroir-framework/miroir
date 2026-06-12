import { miroirTest_miroirCoreTransformers } from "miroir-test-app_deployment-miroir";

import type { DeployedMiroirTestExport } from "../helpers/runDeployedMiroirTestSuite";
import { runDeployedMiroirTestSuiteLoader } from "../helpers/runDeployedMiroirTestSuiteLoader";

await runDeployedMiroirTestSuiteLoader(
  miroirTest_miroirCoreTransformers.definition as DeployedMiroirTestExport,
  "transformers.unit.test",
);
