import { unitTest_suite_jzodUnion_RecursiveUnfold } from "miroir-test-app_deployment-miroir";

import {
  runDeployedUnitTestSuite,
  type DeployedUnitTestExport,
} from "../../helpers/runDeployedUnitTestSuite";

await runDeployedUnitTestSuite(
  unitTest_suite_jzodUnion_RecursiveUnfold as DeployedUnitTestExport,
  "jzodUnion_RecursiveUnfold.test",
);
