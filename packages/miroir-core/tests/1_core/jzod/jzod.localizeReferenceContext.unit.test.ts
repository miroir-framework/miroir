import { unitTest_suite_localizeJzodSchemaReferenceContext } from "miroir-test-app_deployment-miroir";

import {
  runDeployedUnitTestSuite,
  type DeployedUnitTestExport,
} from "../../helpers/runDeployedUnitTestSuite";

await runDeployedUnitTestSuite(
  unitTest_suite_localizeJzodSchemaReferenceContext as DeployedUnitTestExport,
  "jzod.localizeReferenceContext.unit.test",
);
