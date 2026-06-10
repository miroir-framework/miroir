import { miroirTest_selectUnionBranchFromDiscriminator } from "miroir-test-app_deployment-miroir";

import type { DeployedMiroirTestExport } from "../../helpers/runDeployedMiroirTestSuite";
import { runDeployedMiroirTestSuiteLoader } from "../../helpers/runDeployedMiroirTestSuiteLoader";

await runDeployedMiroirTestSuiteLoader(
  miroirTest_selectUnionBranchFromDiscriminator as DeployedMiroirTestExport,
  "jzod.selectUnionBranchFromDiscriminator.unit.test",
);
