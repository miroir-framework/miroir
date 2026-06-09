import { unitTest_suite_jzodObjectFlatten } from "miroir-test-app_deployment-miroir";

import {
  runDeployedUnitTestSuite,
  type DeployedUnitTestExport,
} from "../../helpers/runDeployedUnitTestSuite";

await runDeployedUnitTestSuite(
  unitTest_suite_jzodObjectFlatten as DeployedUnitTestExport,
  "jzodObjectFlatten.test",
);
