import { unitTest_suite_JzodSchemaReferencesList } from "miroir-test-app_deployment-miroir";

import { runDeployedUnitTestSuite, type DeployedUnitTestExport } from "../../helpers/runDeployedUnitTestSuite";

await runDeployedUnitTestSuite(
  unitTest_suite_JzodSchemaReferencesList as DeployedUnitTestExport,
  "JzodSchemaReferencesList.unit.test",
);
