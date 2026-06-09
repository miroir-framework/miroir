import { unitTest_suite_jzodUnionResolvedTypeForArray } from "miroir-test-app_deployment-miroir";

import {
  runDeployedUnitTestSuite,
  type DeployedUnitTestExport,
} from "../../helpers/runDeployedUnitTestSuite";

await runDeployedUnitTestSuite(
  unitTest_suite_jzodUnionResolvedTypeForArray as DeployedUnitTestExport,
  "jzod.unionResolvedTypeForArray.unit.test",
);
