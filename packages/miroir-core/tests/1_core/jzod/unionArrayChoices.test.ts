import { miroirTest_unionArrayChoices } from "miroir-test-app_deployment-miroir";

import type { MiroirTestSuite } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { runMiroirCoreTestSuite } from "../../helpers/runMiroirCoreTestSuite";

await runMiroirCoreTestSuite(
  miroirTest_unionArrayChoices.definition as MiroirTestSuite,
  "unionArrayChoices.test",
);
