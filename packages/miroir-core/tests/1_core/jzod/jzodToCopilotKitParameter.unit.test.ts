import { unitTest_suite_jzodToCopilotKitParameter } from "miroir-test-app_deployment-miroir";

import { runDeployedUnitTestSuite } from "../../helpers/runDeployedUnitTestSuite";

await runDeployedUnitTestSuite(
  unitTest_suite_jzodToCopilotKitParameter,
  "jzodToCopilotKitParameter.unit.test",
);
