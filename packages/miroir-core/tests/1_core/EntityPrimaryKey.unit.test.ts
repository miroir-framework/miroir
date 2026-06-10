import { miroirTest_EntityPrimaryKey } from "miroir-test-app_deployment-miroir";

import type { DeployedMiroirTestExport } from "../helpers/runDeployedMiroirTestSuite";
import { runDeployedMiroirTestSuiteLoader } from "../helpers/runDeployedMiroirTestSuiteLoader";

await runDeployedMiroirTestSuiteLoader(
  miroirTest_EntityPrimaryKey as DeployedMiroirTestExport,
  "EntityPrimaryKey.unit.test",
);
