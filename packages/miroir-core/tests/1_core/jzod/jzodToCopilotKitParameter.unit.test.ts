import { miroirTest_jzodToCopilotKitParameter } from "miroir-test-app_deployment-miroir";

import { runMiroirCoreTestSuite } from "../../helpers/runMiroirCoreTestSuite";

await runMiroirCoreTestSuite(
  miroirTest_jzodToCopilotKitParameter,
  "jzodToCopilotKitParameter.unit.test",
);
