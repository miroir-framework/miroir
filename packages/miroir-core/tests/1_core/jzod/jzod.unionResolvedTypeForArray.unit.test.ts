import { miroirTest_jzodUnionResolvedTypeForArray } from "miroir-test-app_deployment-miroir";

import type { MiroirTestSuite } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { runDeployedMiroirTestSuiteLoader } from "../../helpers/runDeployedMiroirTestSuiteLoader";

await runDeployedMiroirTestSuiteLoader(
  miroirTest_jzodUnionResolvedTypeForArray.definition as MiroirTestSuite,
  "jzod.unionResolvedTypeForArray.unit.test",
);
