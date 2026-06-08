import { unitTest_suite_JzodSchemaReferencesSet } from "miroir-test-app_deployment-miroir";

import { runDeployedUnitTestSuite, type DeployedUnitTestExport } from "../../helpers/runDeployedUnitTestSuite";

await runDeployedUnitTestSuite(
  unitTest_suite_JzodSchemaReferencesSet as DeployedUnitTestExport,
  "JzodSchemaReferencesSet.unit.test",
);
