import { unitTest_suite_jzodUnionResolvedTypeForObject } from "miroir-test-app_deployment-miroir";

import {
  runDeployedUnitTestSuite,
  type DeployedUnitTestExport,
} from "../../helpers/runDeployedUnitTestSuite";

await runDeployedUnitTestSuite(
  unitTest_suite_jzodUnionResolvedTypeForObject as DeployedUnitTestExport,
  "jzod.unionResolvedTypeForObject.unit.test",
);
