import { unitTest_suite_jzodReferencesGraphConnectedComponents } from "miroir-test-app_deployment-miroir";

import {
  runDeployedUnitTestSuite,
  type DeployedUnitTestExport,
} from "../../helpers/runDeployedUnitTestSuite";

await runDeployedUnitTestSuite(
  unitTest_suite_jzodReferencesGraphConnectedComponents as DeployedUnitTestExport,
  "jzodReferencesGraphConnectedComponents.unit.test",
);
