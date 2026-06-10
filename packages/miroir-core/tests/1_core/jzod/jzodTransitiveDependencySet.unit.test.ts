import { miroirTest_jzodTransitiveDependencySet } from "miroir-test-app_deployment-miroir";

import type { DeployedMiroirTestExport } from "../../helpers/runDeployedMiroirTestSuite";
import { runDeployedMiroirTestSuiteLoader } from "../../helpers/runDeployedMiroirTestSuiteLoader";

await runDeployedMiroirTestSuiteLoader(
  miroirTest_jzodTransitiveDependencySet as DeployedMiroirTestExport,
  "jzodTransitiveDependencySet.unit.test",
);
