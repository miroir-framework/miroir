import { miroirTest_ansiColumnsToJzodSchema } from "miroir-test-app_deployment-miroir";

import type { DeployedMiroirTestExport } from "../helpers/runDeployedMiroirTestSuite";
import { runDeployedMiroirTestSuiteLoader } from "../helpers/runDeployedMiroirTestSuiteLoader";

await runDeployedMiroirTestSuiteLoader(
  miroirTest_ansiColumnsToJzodSchema as DeployedMiroirTestExport,
  "ansiColumnsToJzodSchema.unit.test",
);
