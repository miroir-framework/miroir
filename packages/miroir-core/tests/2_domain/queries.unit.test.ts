import { miroirTest_queries_library } from "miroir-test-app_deployment-miroir";

import type { MiroirTestSuite } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { runMiroirCoreTestSuite } from "../helpers/runMiroirCoreTestSuite";

await runMiroirCoreTestSuite(
  miroirTest_queries_library.definition as MiroirTestSuite,
  "queries.unit.test",
);
