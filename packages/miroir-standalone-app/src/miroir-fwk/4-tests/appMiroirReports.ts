import {
  defaultSelfApplicationDeploymentMap,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type EntityInstance,
} from "miroir-core";
import { entityReport, selfApplicationMiroir } from "miroir-test-app_deployment-miroir";

/**
 * The Miroir Reports loaded in the app (#330), read when a run starts: an in-app run of a suite of
 * `reportTest` leaves creates in its session those the session lacks.
 */
export function readAppMiroirReports(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap | undefined,
): EntityInstance[] {
  const miroirDeployment =
    applicationDeploymentMap?.[selfApplicationMiroir.uuid] ??
    defaultSelfApplicationDeploymentMap[selfApplicationMiroir.uuid];
  return Object.values(
    domainController.getDomainState()[miroirDeployment]?.data?.[entityReport.uuid] ?? {},
  );
}
