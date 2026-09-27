import {
  getReportsAndEntitiesForDeploymentUuid,
  type DeploymentUuidToReportsEntitiesMapping,
  type MetaModel,
  type Uuid,
} from "miroir-core";
import {
  adminSelfApplication,
  deployment_Admin,
  deployment_Miroir,
} from "miroir-test-app_deployment-admin";
import { selfApplicationMiroir } from "miroir-test-app_deployment-miroir";

/**
 * The reports and entities offered to the pages, by deployment: Admin, Miroir and the current
 * application. Computed by RootComponent in the app, and by the providers of the report test
 * runner, which mounts a page without RootComponent (#330).
 */
export function deploymentReportsEntitiesMapping(params: {
  miroirMetaModel: MetaModel;
  adminAppModel: MetaModel;
  currentApplication: Uuid;
  currentDeployment: Uuid;
  currentModel: MetaModel;
}): DeploymentUuidToReportsEntitiesMapping {
  return {
    [deployment_Admin.uuid]: getReportsAndEntitiesForDeploymentUuid(
      adminSelfApplication.uuid,
      params.miroirMetaModel,
      params.adminAppModel,
    ),
    [deployment_Miroir.uuid]: getReportsAndEntitiesForDeploymentUuid(
      selfApplicationMiroir.uuid,
      params.miroirMetaModel,
      params.miroirMetaModel,
    ),
    [params.currentDeployment]: getReportsAndEntitiesForDeploymentUuid(
      params.currentApplication,
      params.miroirMetaModel,
      params.currentModel,
    ),
  };
}
