import { miroirTest_selectUnionBranchFromDiscriminator } from "miroir-test-app_deployment-miroir";

import type { MiroirTestSuite } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { runDeployedMiroirTestSuiteLoader } from "../../helpers/runDeployedMiroirTestSuiteLoader";

await runDeployedMiroirTestSuiteLoader(
  miroirTest_selectUnionBranchFromDiscriminator.definition as MiroirTestSuite,
  "jzod.selectUnionBranchFromDiscriminator.unit.test",
);
