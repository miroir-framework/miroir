import { miroirTest_getAttributeTypesFromJzodSchema } from "miroir-test-app_deployment-miroir";

import type { DeployedMiroirTestExport } from "../helpers/runDeployedMiroirTestSuite";
import { runDeployedMiroirTestSuiteLoader } from "../helpers/runDeployedMiroirTestSuiteLoader";

await runDeployedMiroirTestSuiteLoader(
  miroirTest_getAttributeTypesFromJzodSchema as DeployedMiroirTestExport,
  "getAttributeTypesFromJzodSchema.unit.test",
);
