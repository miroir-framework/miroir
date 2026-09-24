/**
 * Extract the target deployment uuid from an incoming REST request (issue #267 follow-up).
 *
 * Route params (`/CRUD/:deploymentUuid/...`) win; action bodies carry the deployment in
 * `payload.deploymentUuid`, or — for query actions (`/query`, `/queryTemplate`) — in
 * `payload.application` (legacy naming: query-action payloads put the deployment uuid in
 * `application`). A probe body names the target application on `payload.endpoint.application`
 * and resolves it through `applicationDeploymentMap`. Bodies may wrap the action as
 * `{ action, applicationDeploymentMap }`.
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
      const mapped = deploymentForApplication(body, fromApplication);
      // Query-action convention: payload.application is the APPLICATION uuid, resolved to
      // the deployment actually accessed via the body's applicationDeploymentMap.
      // Fallback: some callers put the deployment uuid in `application` directly.
      return mapped ?? fromApplication;
    }
    const endpoint = (payload as Record<string, unknown>).endpoint;
    const endpointApplication =
      endpoint && typeof endpoint === "object"
        ? (endpoint as Record<string, unknown>).application
        : undefined;
    if (typeof endpointApplication === "string" && endpointApplication) {
      const mapped = deploymentForApplication(body, endpointApplication);
      if (mapped) {
        return mapped;
      }
    }
  }
  return undefined;
}

function deploymentForApplication(body: Record<string, unknown> | undefined, application: string): string | undefined {
  const map = body?.applicationDeploymentMap;
  if (!map || typeof map !== "object") {
    return undefined;
  }
  const mapped = (map as Record<string, unknown>)[application];
  return typeof mapped === "string" && mapped ? mapped : undefined;
}
