import { unitTest_suite_EntityPrimaryKey } from "miroir-test-app_deployment-miroir";

import {
  runDeployedUnitTestSuite,
  type DeployedUnitTestExport,
} from "../helpers/runDeployedUnitTestSuite";

await runDeployedUnitTestSuite(
  unitTest_suite_EntityPrimaryKey as DeployedUnitTestExport,
  "EntityPrimaryKey.unit.test",
);
