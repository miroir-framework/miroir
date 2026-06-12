import { miroirTest_jzodUnionResolvedTypeForObject } from "miroir-test-app_deployment-miroir";

import type { DeployedMiroirTestExport } from "../../helpers/runDeployedMiroirTestSuite";
import { runDeployedMiroirTestSuiteLoader } from "../../helpers/runDeployedMiroirTestSuiteLoader";

await runDeployedMiroirTestSuiteLoader(
  miroirTest_jzodUnionResolvedTypeForObject.definition as DeployedMiroirTestExport,
  "jzod.unionResolvedTypeForObject.unit.test",
);
