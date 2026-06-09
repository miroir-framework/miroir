import { unitTest_suite_unionArrayChoices } from "miroir-test-app_deployment-miroir";

import {
  runDeployedUnitTestSuite,
  type DeployedUnitTestExport,
} from "../../helpers/runDeployedUnitTestSuite";

await runDeployedUnitTestSuite(
  unitTest_suite_unionArrayChoices as DeployedUnitTestExport,
  "unionArrayChoices.test",
);
