import { miroirTest_pilot_transformer_plus } from "miroir-test-app_deployment-miroir";

import type { DeployedMiroirTestExport } from "../helpers/runDeployedMiroirTestSuite";
import { runDeployedMiroirTestSuiteLoader } from "../helpers/runDeployedMiroirTestSuiteLoader";

await runDeployedMiroirTestSuiteLoader(
  miroirTest_pilot_transformer_plus as DeployedMiroirTestExport,
  "unitTest.pilot.unit.test",
);
