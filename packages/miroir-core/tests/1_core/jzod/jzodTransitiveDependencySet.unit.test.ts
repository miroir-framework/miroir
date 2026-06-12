import { miroirTest_jzodTransitiveDependencySet } from "miroir-test-app_deployment-miroir";

import type { MiroirTestSuite } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { runDeployedMiroirTestSuiteLoader } from "../../helpers/runDeployedMiroirTestSuiteLoader";

await runDeployedMiroirTestSuiteLoader(
  miroirTest_jzodTransitiveDependencySet.definition as MiroirTestSuite,
  "jzodTransitiveDependencySet.unit.test",
);
