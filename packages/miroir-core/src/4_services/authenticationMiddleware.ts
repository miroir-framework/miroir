/**
 * #263: the identity gate as an Express-style middleware, shared by miroir-server and the Electron
 * loopback server (`/api/copilotkit`, `/mcp`). It answers 401 AuthenticationRequired, or stores the
 * authenticated request on `request.miroirAuthentication` for the handler behind it (MCP tools
 * check application access per call with it).
 */

import {
  authenticateRequest,
  type AuthenticatedRequest,
  type AuthenticationGate,
} from "../1_core/authentication/AccessGate.js";

export type AuthenticatedHttpRequest = {
  headers?: Record<string, unknown>;
  miroirAuthentication?: Extract<AuthenticatedRequest, { allowed: true }>;
};

type JsonResponse = { status: (code: number) => { json: (body: unknown) => unknown } };

export function createIdentityGateMiddleware(gate: AuthenticationGate) {
  return async (request: AuthenticatedHttpRequest, response: JsonResponse, next: () => void) => {
    const header = request.headers?.authorization;
    const authenticated = await authenticateRequest(gate, typeof header === "string" ? header : undefined);
    if (!authenticated.allowed) {
      response.status(authenticated.status).json(authenticated.body);
      return;
    }
    request.miroirAuthentication = authenticated;
    next();
  };
}
