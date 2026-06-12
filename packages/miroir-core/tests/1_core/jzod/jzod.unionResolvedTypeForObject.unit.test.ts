import { miroirTest_jzodUnionResolvedTypeForObject } from "miroir-test-app_deployment-miroir";

import type { MiroirTestSuite } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { runMiroirCoreTestSuite } from "../../helpers/runMiroirCoreTestSuite";

await runMiroirCoreTestSuite(
  miroirTest_jzodUnionResolvedTypeForObject.definition as MiroirTestSuite,
  "jzod.unionResolvedTypeForObject.unit.test",
);
