import type { Uuid } from "miroir-core";
import { selfApplicationMiroir } from "miroir-test-app_deployment-miroir";

/**
 * Runner *instances* (definitions) live in Miroir data (`entityRunner`), even when
 * a report page is opened for another SelfApplication (e.g. Versioning for Library).
 * Page application still drives report extractors / SAV filters via URL params.
 */
export function resolveRunnerDefinitionApplication(
  _pageApplication?: Uuid,
): Uuid {
  return selfApplicationMiroir.uuid;
}
