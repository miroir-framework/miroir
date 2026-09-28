import type { Uuid } from "miroir-core";
import { deployment_AppForTest_DO_NO_USE } from "miroir-fixture-appForTest";
import { deployment_Library_DO_NO_USE } from "miroir-example-library";

export function resolveCanonicalTestDeploymentUuid(applicationName: string): Uuid {
  if (applicationName === "appForTest") {
    return deployment_AppForTest_DO_NO_USE.uuid;
  }
  return deployment_Library_DO_NO_USE.uuid;
}
