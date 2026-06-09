import { unitTest_suite_buildAnyKeyMap } from "miroir-test-app_deployment-miroir";

import {
  runDeployedUnitTestSuite,
  type DeployedUnitTestExport,
} from "../../helpers/runDeployedUnitTestSuite";

await runDeployedUnitTestSuite(
  unitTest_suite_buildAnyKeyMap as DeployedUnitTestExport,
  "jzod.buildAnyKeyMap.unit.test",
);
