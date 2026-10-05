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

/**
 * Every deployment a request names (#263): route param, body, `payload.deploymentUuid`, the
 * deployment `payload.application` maps to, and the one `payload.endpoint.application` maps to.
 * An access gate authorizes all of them, so a caller cannot pass one allowed deployment while the
 * action resolves its store from another field. Empty when the request names none.
 */
export function deploymentUuidsFromHttpRequest(request: { params?: unknown; body?: unknown }): string[] {
  const params = request.params as Record<string, unknown> | undefined;
  const body = request.body as Record<string, unknown> | undefined;
  const found = new Set<string>();
  const add = (value: unknown) => {
    if (typeof value === "string" && value) {
      found.add(value);
    }
  };
  add(params?.deploymentUuid);
  add(body?.deploymentUuid);
  const action =
    body?.action && typeof body.action === "object"
      ? (body.action as Record<string, unknown>)
      : body;
  const payload = action?.payload;
  if (payload && typeof payload === "object") {
    const fields = payload as Record<string, unknown>;
    add(fields.deploymentUuid);
    if (typeof fields.application === "string" && fields.application) {
      add(deploymentForApplication(body, fields.application) ?? fields.application);
    }
    const endpoint = fields.endpoint;
    const endpointApplication =
      endpoint && typeof endpoint === "object" ? (endpoint as Record<string, unknown>).application : undefined;
    if (typeof endpointApplication === "string" && endpointApplication) {
      add(deploymentForApplication(body, endpointApplication));
    }
  }
  return [...found];
}
