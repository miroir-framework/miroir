import { miroirTest_getAttributeTypesFromJzodSchema } from "miroir-test-app_deployment-miroir";

import type { MiroirTestSuite } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { runDeployedMiroirTestSuiteLoader } from "../helpers/runDeployedMiroirTestSuiteLoader";

await runDeployedMiroirTestSuiteLoader(
  miroirTest_getAttributeTypesFromJzodSchema.definition as MiroirTestSuite,
  "getAttributeTypesFromJzodSchema.unit.test",
);
