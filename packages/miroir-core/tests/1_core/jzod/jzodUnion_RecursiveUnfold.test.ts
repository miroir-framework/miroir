import { miroirTest_jzodUnion_RecursiveUnfold } from "miroir-test-app_deployment-miroir";

import type { MiroirTestSuite } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { runDeployedMiroirTestSuiteLoader } from "../../helpers/runDeployedMiroirTestSuiteLoader";

await runDeployedMiroirTestSuiteLoader(
  miroirTest_jzodUnion_RecursiveUnfold.definition as MiroirTestSuite,
  "jzodUnion_RecursiveUnfold.test",
);
