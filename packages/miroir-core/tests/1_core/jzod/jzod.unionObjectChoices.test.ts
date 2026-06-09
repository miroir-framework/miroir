import { unitTest_suite_unionObjectChoices } from "miroir-test-app_deployment-miroir";

import {
  runDeployedUnitTestSuite,
  type DeployedUnitTestExport,
} from "../../helpers/runDeployedUnitTestSuite";

await runDeployedUnitTestSuite(
  unitTest_suite_unionObjectChoices as DeployedUnitTestExport,
  "jzod.unionObjectChoices.test",
);
