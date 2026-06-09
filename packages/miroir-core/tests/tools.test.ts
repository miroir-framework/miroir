import { unitTest_suite_tools } from "miroir-test-app_deployment-miroir";

import {
  runDeployedUnitTestSuite,
  type DeployedUnitTestExport,
} from "./helpers/runDeployedUnitTestSuite";

await runDeployedUnitTestSuite(
  unitTest_suite_tools as DeployedUnitTestExport,
  "tools.test",
);
