import { unitTest_suite_alterObject } from "miroir-test-app_deployment-miroir";

import { runDeployedUnitTestSuite, type DeployedUnitTestExport } from "../helpers/runDeployedUnitTestSuite";

await runDeployedUnitTestSuite(unitTest_suite_alterObject as DeployedUnitTestExport, "alterObject.unit.test");
