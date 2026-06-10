import { miroirTest_jzodUnion_RecursiveUnfold } from "miroir-test-app_deployment-miroir";

import type { DeployedMiroirTestExport } from "../../helpers/runDeployedMiroirTestSuite";
import { runDeployedMiroirTestSuiteLoader } from "../../helpers/runDeployedMiroirTestSuiteLoader";

await runDeployedMiroirTestSuiteLoader(
  miroirTest_jzodUnion_RecursiveUnfold as DeployedMiroirTestExport,
  "jzodUnion_RecursiveUnfold.test",
);
