import type { Uuid } from "miroir-core";
import {
  runnerCreateEntity,
  runnerDeployApplication,
  runnerDropApplication,
  runnerDropEntity,
  runnerFreezeApplicationVersion,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";

/**
 * Runner instances stored in Miroir data (`miroir_data/e54d7dc1…`), regardless of
 * which application a report page is opened for (e.g. Versioning input steers Library
 * while the freeze Runner definition lives on Miroir).
 */
const MIROIR_DATA_RUNNER_UUIDS = new Set<Uuid>([
  runnerCreateEntity.uuid,
  runnerDeployApplication.uuid,
  runnerDropApplication.uuid,
  runnerDropEntity.uuid,
  runnerFreezeApplicationVersion.uuid,
  // createApplication — not re-exported from deployment index
  "bcc872dc-649a-410a-81bc-a8ad65f21e1c",
]);

/**
 * Resolve which SelfApplication owns a stored Runner definition for cache lookup.
 *
 * - Miroir-data runners → always Miroir (section `data`).
 * - App-model runners (e.g. Library lend/return) → page application (section `model`).
 */
export function resolveRunnerDefinitionApplication(
  pageApplication?: Uuid,
  runnerUuid?: Uuid,
): Uuid {
  if (runnerUuid && MIROIR_DATA_RUNNER_UUIDS.has(runnerUuid)) {
    return selfApplicationMiroir.uuid;
  }
  return pageApplication ?? selfApplicationMiroir.uuid;
}
