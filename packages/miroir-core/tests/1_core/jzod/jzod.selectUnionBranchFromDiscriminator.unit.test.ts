import { unitTest_suite_selectUnionBranchFromDiscriminator } from "miroir-test-app_deployment-miroir";

import {
  runDeployedUnitTestSuite,
  type DeployedUnitTestExport,
} from "../../helpers/runDeployedUnitTestSuite";

await runDeployedUnitTestSuite(
  unitTest_suite_selectUnionBranchFromDiscriminator as DeployedUnitTestExport,
  "jzod.selectUnionBranchFromDiscriminator.unit.test",
);
