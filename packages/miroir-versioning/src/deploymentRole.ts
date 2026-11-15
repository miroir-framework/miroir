/**
 * #9: the role of a deployment, read from its Admin Deployment row in the stores, and the refusals it
 * gives: a following deployment's model changes by a migration run only (analysis D6).
 */
import {
  Action2Error,
  deploymentRoleOf,
  type ApplicationDeploymentMap,
  type DomainControllerActionHost,
  type EntityInstance,
} from "@miroir-framework/core";
import { adminSelfApplication, deployment_Admin, entityDeployment } from "@miroir-framework/core/admin";

/** The map of a call that also reads and writes Admin data. */
export function withAdmin(applicationDeploymentMap: ApplicationDeploymentMap): ApplicationDeploymentMap {
  return {
    ...applicationDeploymentMap,
    [adminSelfApplication.uuid]: applicationDeploymentMap[adminSelfApplication.uuid] ?? deployment_Admin.uuid,
  };
}

/** A refusal of the versioning package, with its reason in `errorContext`. */
export function refusal(message: string, reason: string, extra: Record<string, unknown> = {}): Action2Error {
  return new Action2Error("FailedToHandleAction", message, undefined, undefined, { reason, ...extra });
}

/** The Admin Deployment row of `deploymentUuid`, read from the store. */
export async function storedDeploymentRow(
  host: Pick<DomainControllerActionHost, "readSectionInstances">,
  deploymentUuid: string,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<(EntityInstance & { role?: unknown }) | undefined | Action2Error> {
  const rows = await host.readSectionInstances(
    adminSelfApplication.uuid,
    withAdmin(applicationDeploymentMap),
    "data",
    entityDeployment.uuid,
  );
  return rows instanceof Action2Error ? rows : rows.find((row) => row.uuid === deploymentUuid);
}

/**
 * The refusal of `actionType` on `application` when its deployment is following (`deploymentFollows`);
 * `undefined` on an authoring deployment.
 */
export async function followingDeploymentRefusal(
  host: Pick<DomainControllerActionHost, "readSectionInstances">,
  actionType: string,
  application: string,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<Action2Error | undefined> {
  const deploymentUuid = applicationDeploymentMap[application];
  if (!deploymentUuid) {
    return undefined;
  }
  const deploymentRow = await storedDeploymentRow(host, deploymentUuid, applicationDeploymentMap);
  if (deploymentRow instanceof Action2Error || deploymentRoleOf(deploymentRow) !== "following") {
    return undefined;
  }
  return refusal(
    `${actionType}: deployment ${deploymentUuid} of ${application} is a following deployment: its model changes by a migration run only`,
    "deploymentFollows",
    { deployment: deploymentUuid },
  );
}
