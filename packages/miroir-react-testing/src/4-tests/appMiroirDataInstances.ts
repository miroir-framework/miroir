import {
  defaultSelfApplicationDeploymentMap,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type EntityInstance,
} from "@miroir-framework/core";
import { entityReport, entityRunner, selfApplicationMiroir } from "@miroir-framework/core/meta-model";

/**
 * The Entities of Miroir's data section that a Report test may display: its Reports (#330) and the
 * Runners those Reports show (#225, the Runners page). The session of a suite of `reportTest`
 * leaves bootstraps a few of them only.
 */
export const reportTestMiroirDataEntityUuids: readonly string[] = [entityReport.uuid, entityRunner.uuid];

/**
 * The Miroir Reports and Runners loaded in the app, read when a run starts: an in-app run of a
 * suite of `reportTest` leaves creates in its session those the session lacks.
 */
export function readAppMiroirDataInstances(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap | undefined,
): EntityInstance[] {
  const miroirDeployment =
    applicationDeploymentMap?.[selfApplicationMiroir.uuid] ??
    defaultSelfApplicationDeploymentMap[selfApplicationMiroir.uuid];
  const miroirData = domainController.getDomainState()[miroirDeployment]?.data ?? {};
  return reportTestMiroirDataEntityUuids.flatMap((entityUuid) =>
    Object.values(miroirData[entityUuid] ?? {}),
  );
}
