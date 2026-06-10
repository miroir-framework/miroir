import { miroirTest_localizeJzodSchemaReferenceContext } from "miroir-test-app_deployment-miroir";

import type { DeployedMiroirTestExport } from "../../helpers/runDeployedMiroirTestSuite";
import { runDeployedMiroirTestSuiteLoader } from "../../helpers/runDeployedMiroirTestSuiteLoader";

await runDeployedMiroirTestSuiteLoader(
  miroirTest_localizeJzodSchemaReferenceContext as DeployedMiroirTestExport,
  "jzod.localizeReferenceContext.unit.test",
);
