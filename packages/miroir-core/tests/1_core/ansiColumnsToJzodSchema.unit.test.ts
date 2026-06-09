import { unitTest_suite_ansiColumnsToJzodSchema } from "miroir-test-app_deployment-miroir";

import {
  runDeployedUnitTestSuite,
  type DeployedUnitTestExport,
} from "../helpers/runDeployedUnitTestSuite";

await runDeployedUnitTestSuite(
  unitTest_suite_ansiColumnsToJzodSchema as DeployedUnitTestExport,
  "ansiColumnsToJzodSchema.unit.test",
);
