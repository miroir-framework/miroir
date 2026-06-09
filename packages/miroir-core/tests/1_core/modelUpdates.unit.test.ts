import { unitTest_suite_modelUpdates } from "miroir-test-app_deployment-miroir";

import {
  runDeployedUnitTestSuite,
  type DeployedUnitTestExport,
} from "../helpers/runDeployedUnitTestSuite";

await runDeployedUnitTestSuite(
  unitTest_suite_modelUpdates as DeployedUnitTestExport,
  "modelUpdates.unit.test",
);
