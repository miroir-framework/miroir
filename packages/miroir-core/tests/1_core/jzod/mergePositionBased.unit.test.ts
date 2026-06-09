import { unitTest_suite_mergePositionBased } from "miroir-test-app_deployment-miroir";

import { runDeployedUnitTestSuite, type DeployedUnitTestExport } from "../../helpers/runDeployedUnitTestSuite";

await runDeployedUnitTestSuite(
  unitTest_suite_mergePositionBased as DeployedUnitTestExport,
  "mergePositionBased.unit.test",
);
