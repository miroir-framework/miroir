import { unitTest_suite_resolveQueryTemplates } from "miroir-test-app_deployment-miroir";

import {
  runDeployedUnitTestSuite,
  type DeployedUnitTestExport,
} from "../helpers/runDeployedUnitTestSuite";

await runDeployedUnitTestSuite(
  unitTest_suite_resolveQueryTemplates as DeployedUnitTestExport,
  "resolveQueryTemplates.unit.test",
);
