import { miroirTest_jzodToJsonSchema } from "miroir-test-app_deployment-miroir";

import type { DeployedMiroirTestExport } from "../../helpers/runDeployedMiroirTestSuite";
import { runDeployedMiroirTestSuiteLoader } from "../../helpers/runDeployedMiroirTestSuiteLoader";

await runDeployedMiroirTestSuiteLoader(
  miroirTest_jzodToJsonSchema.definition as DeployedMiroirTestExport,
  "jzodToJsonSchema.unit.test",
);
