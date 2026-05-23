/**
 * navigation.ts — Query-parameter URL builders for the Miroir application.
 *
 * All navigation in the app uses `?page=<pageName>` query params instead of
 * path-based routing, making the app work correctly on both:
 * - the standalone/electron app (createBrowserRouter, served at /)
 * - the demo/GitHub-Pages app (createHashRouter, served at /miroir/)
 *
 * Usage:
 *   navigate(pageUrl("settings"))
 *   navigate(reportUrl(app, deployment, section, reportUuid, instanceUuid))
 *   navigate(eventsUrl(eventId))
 *   navigate(instanceUrl(deployment, section, entity, instance))
 */

/** Navigate to a named simple page: "/?page=home", "/?page=settings", etc.
 *
 * Uses absolute paths (starting with "/") so that navigation is not affected
 * by the current URL's pathname.  Both createBrowserRouter and createHashRouter
 * treat "/" as the router root, so this works for all router types.
 */
export function pageUrl(page: string): string {
  return `/?page=${encodeURIComponent(page)}`;
}

/** Navigate to a report page with the given parameters. */
export function reportUrl(
  application: string,
  deploymentUuid: string,
  applicationSection: string,
  reportUuid: string,
  instanceUuid?: string,
): string {
  const base = [
    "/?page=report",
    `application=${encodeURIComponent(application)}`,
    `deploymentUuid=${encodeURIComponent(deploymentUuid)}`,
    `applicationSection=${encodeURIComponent(applicationSection)}`,
    `reportUuid=${encodeURIComponent(reportUuid)}`,
  ].join("&");
  return instanceUuid ? `${base}&instanceUuid=${encodeURIComponent(instanceUuid)}` : base;
}

/** Navigate to the events page, optionally filtered to a specific event. */
export function eventsUrl(eventId?: string): string {
  return eventId
    ? `/?page=events&eventId=${encodeURIComponent(eventId)}`
    : `/?page=events`;
}

/** Navigate to an instance detail page. */
export function instanceUrl(
  deploymentUuid: string,
  applicationSection: string,
  entityUuid: string,
  instanceUuid: string,
): string {
  return [
    "/?page=instance",
    `deploymentUuid=${encodeURIComponent(deploymentUuid)}`,
    `applicationSection=${encodeURIComponent(applicationSection)}`,
    `entityUuid=${encodeURIComponent(entityUuid)}`,
    `instanceUuid=${encodeURIComponent(instanceUuid)}`,
  ].join("&");
}
