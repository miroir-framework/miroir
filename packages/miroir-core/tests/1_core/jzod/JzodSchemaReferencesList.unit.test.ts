import { miroirTest_JzodSchemaReferencesList } from "miroir-test-app_deployment-miroir";

import type { DeployedMiroirTestExport } from "../../helpers/runDeployedMiroirTestSuite";
import { runDeployedMiroirTestSuiteLoader } from "../../helpers/runDeployedMiroirTestSuiteLoader";

await runDeployedMiroirTestSuiteLoader(
  miroirTest_JzodSchemaReferencesList.definition as DeployedMiroirTestExport,
  "JzodSchemaReferencesList.unit.test",
);
