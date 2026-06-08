import { unitTest_suite_alterObject } from "miroir-test-app_deployment-miroir";

import { runDeployedUnitTestSuite } from "../helpers/runDeployedUnitTestSuite";

await runDeployedUnitTestSuite(unitTest_suite_alterObject, "alterObject.unit.test");
