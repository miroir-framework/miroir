import { miroirTest_jzodToCopilotKitParameter } from "miroir-test-app_deployment-miroir";

import { runDeployedMiroirTestSuiteLoader } from "../../helpers/runDeployedMiroirTestSuiteLoader";

await runDeployedMiroirTestSuiteLoader(
  miroirTest_jzodToCopilotKitParameter,
  "jzodToCopilotKitParameter.unit.test",
);
