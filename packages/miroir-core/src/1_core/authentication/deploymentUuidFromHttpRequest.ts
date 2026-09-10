/**
 * Extract the target deployment uuid from an incoming REST request (issue #267 follow-up).
 *
 * Route params (`/CRUD/:deploymentUuid/...`) win; action bodies carry the deployment in
 * `payload.deploymentUuid`, or — for query actions (`/query`, `/queryTemplate`) — in
 * `payload.application` (legacy naming: query-action payloads put the deployment uuid in
 * `application`). Bodies may wrap the action as `{ action, applicationDeploymentMap }`.
 *
 * Used by the server's access gate (`assertAccessForDeployment`): returning `undefined`
 * means the request is denied when authentication is enabled.
 */
export function deploymentUuidFromHttpRequest(request: {
  params?: unknown;
  body?: unknown;
}): string | undefined {
  const params = request.params as Record<string, unknown> | undefined;
  const body = request.body as Record<string, unknown> | undefined;
  const fromParams = params?.deploymentUuid;
  if (typeof fromParams === "string" && fromParams) {
    return fromParams;
  }
  if (typeof body?.deploymentUuid === "string" && body.deploymentUuid) {
    return body.deploymentUuid;
  }
  const action =
    body?.action && typeof body.action === "object"
      ? (body.action as Record<string, unknown>)
      : body;
  const payload = action?.payload;
  if (payload && typeof payload === "object") {
    const fromPayload = (payload as Record<string, unknown>).deploymentUuid;
    if (typeof fromPayload === "string" && fromPayload) {
      return fromPayload;
    }
    const fromApplication = (payload as Record<string, unknown>).application;
    if (typeof fromApplication === "string" && fromApplication) {
      // Query-action convention: payload.application is the APPLICATION uuid, resolved to
      // the deployment actually accessed via the body's applicationDeploymentMap.
      const map = body?.applicationDeploymentMap;
      if (map && typeof map === "object") {
        const mapped = (map as Record<string, unknown>)[fromApplication];
        if (typeof mapped === "string" && mapped) {
          return mapped;
        }
      }
      // Fallback: some callers put the deployment uuid in `application` directly.
      return fromApplication;
    }
  }
  return undefined;
}
