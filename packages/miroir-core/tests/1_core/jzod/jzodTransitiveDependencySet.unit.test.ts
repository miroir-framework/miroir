import { unitTest_suite_jzodTransitiveDependencySet } from "miroir-test-app_deployment-miroir";

import { runDeployedUnitTestSuite, type DeployedUnitTestExport } from "../../helpers/runDeployedUnitTestSuite";

await runDeployedUnitTestSuite(
  unitTest_suite_jzodTransitiveDependencySet as DeployedUnitTestExport,
  "jzodTransitiveDependencySet.unit.test",
);
