import { miroirTest_buildAnyKeyMap } from "miroir-test-app_deployment-miroir";

import type { DeployedMiroirTestExport } from "../../helpers/runDeployedMiroirTestSuite";
import { runDeployedMiroirTestSuiteLoader } from "../../helpers/runDeployedMiroirTestSuiteLoader";

await runDeployedMiroirTestSuiteLoader(
  miroirTest_buildAnyKeyMap.definition as DeployedMiroirTestExport,
  "jzod.buildAnyKeyMap.unit.test",
);
