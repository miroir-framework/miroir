import { unitTest_suite_mergePositionBased } from "miroir-test-app_deployment-miroir";

import { runDeployedUnitTestSuite } from "../../helpers/runDeployedUnitTestSuite";

await runDeployedUnitTestSuite(
  unitTest_suite_mergePositionBased,
  "mergePositionBased.unit.test",
);
