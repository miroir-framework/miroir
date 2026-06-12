import { miroirTest_miroirCoreTransformers } from "miroir-test-app_deployment-miroir";

import type { MiroirTestSuite } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { runMiroirCoreTestSuite } from "../helpers/runMiroirCoreTestSuite";

await runMiroirCoreTestSuite(
  miroirTest_miroirCoreTransformers.definition as MiroirTestSuite,
  "transformers.unit.test",
);
