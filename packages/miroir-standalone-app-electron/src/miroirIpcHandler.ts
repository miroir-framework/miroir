/**
 * miroirIpcHandler.ts — Electron MAIN PROCESS, free of any `electron` import so tests run it in Node.
 *
 * Answers the renderer's `miroir-ipc` messages (see ipcServerSetup.ts). #263: with authentication
 * on, every message that reads or changes application data carries `authorization` (the renderer's
 * Bearer header). `rest-call` goes through the RestClientStub gate (also `/auth/status`,
 * `/auth/login`, `/auth/change-password`); `server-action` and `server-query` run the same
 * identity and application access steps here. `get-client-config` and
 * `get-default-filesystem-folder` stay open.
 */

import {
  accessDirectoryLoader,
  authenticateRequest,
  authorizeDeployment,
  deploymentUuidFromHttpRequest,
  persistPasswordChange,
  resolveAuthenticationEnabled,
  resolveMcpAuthenticationEnabled,
  type ApplicationDeploymentMap,
  type AuthenticationGate,
  type DomainControllerInterface,
  type MiroirConfigClient,
  type MiroirConfigServer,
  type RestClientStub,
} from "miroir-core";

export type MiroirIpcPayload = { type: string; authorization?: string; [key: string]: any };

export type MiroirIpcDeps = {
  restClientStub: RestClientStub;
  domainController: DomainControllerInterface;
  gate: AuthenticationGate;
  clientConfig: MiroirConfigClient;
  environmentRoot: string;
};

/**
 * The main process's hatch: the server's (--disable-auth / --enable-auth, MIROIR_AUTH_ENABLED,
 * server.authentication.enabled of the environment, default on), and the MCP switch on top.
 */
export function electronAuthenticationGates(args: {
  argv: string[];
  env: Record<string, string | undefined>;
  serverConfig: MiroirConfigServer;
  domainController: DomainControllerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
}): { gate: AuthenticationGate; mcpGate: AuthenticationGate } {
  const authentication = (
    args.serverConfig.server as { authentication?: { enabled?: boolean; mcp?: boolean } }
  ).authentication;
  const enabled = resolveAuthenticationEnabled({
    argv: args.argv,
    env: args.env,
    config: { enabled: authentication?.enabled },
  });
  const gate: AuthenticationGate = {
    enabled,
    loadDirectory: accessDirectoryLoader(args.domainController, args.applicationDeploymentMap),
    persistPasswordChange: (change) =>
      persistPasswordChange(args.domainController, args.applicationDeploymentMap, change),
  };
  const mcpEnabled = resolveMcpAuthenticationEnabled({
    argv: args.argv,
    env: args.env,
    config: { mcp: authentication?.mcp },
    globalEnabled: enabled,
  });
  return { gate, mcpGate: { ...gate, enabled: mcpEnabled } };
}

/**
 * Plain objects survive structured clone; the renderer rebuilds an Action2Error from
 * `{ status: "error", errorType }` (ElectronIpcProxy.ts).
 */
function ipcError(errorType: string, errorMessage: string) {
  return { status: "error", errorType, errorMessage };
}

/**
 * Serialise the result of a RestClientStub.call() before sending over IPC.
 * Structured clone cannot handle Headers instances (different across Node/Chromium), so
 * we replace them with a plain object of their entries.
 */
function serializeRestResult(result: any): any {
  if (result && typeof result === "object" && !("errorType" in result)) {
    const headers =
      result.headers instanceof Headers
        ? Object.fromEntries(Object.entries((result.headers as Headers)))
        : result.headers ?? {};
    return { ...result, headers };
  }
  return result;
}

/** Identity, then application access on the deployment the action names. */
async function gateServerCall(deps: MiroirIpcDeps, payload: MiroirIpcPayload) {
  const authenticated = await authenticateRequest(deps.gate, payload.authorization);
  if (!authenticated.allowed) {
    return { allowed: false as const, result: ipcError("AuthenticationRequired", "Authentication required") };
  }
  const access = authorizeDeployment(
    deps.gate.enabled,
    authenticated,
    deploymentUuidFromHttpRequest({
      body: { action: payload.action, applicationDeploymentMap: payload.applicationDeploymentMap },
    }),
  );
  if (!access.allowed) {
    return { allowed: false as const, result: ipcError("AccessDenied", "Access denied") };
  }
  return { allowed: true as const, principal: authenticated.principal };
}

export async function handleMiroirIpc(payload: MiroirIpcPayload, deps: MiroirIpcDeps): Promise<any> {
  switch (payload.type) {
    case "rest-call": {
      const { rawUrl, method, endpoint, args } = payload;
      const headers = { ...(args?.headers ?? {}) };
      if (payload.authorization && !headers.Authorization && !headers.authorization) {
        headers.Authorization = payload.authorization;
      }
      const result = await deps.restClientStub.call(rawUrl, method, endpoint, { ...(args ?? {}), headers });
      return serializeRestResult(result);
    }

    // The root of the environment: store paths are relative to it
    case "get-default-filesystem-folder": {
      return deps.environmentRoot;
    }

    case "get-client-config": {
      return deps.clientConfig;
    }

    case "server-action": {
      const gated = await gateServerCall(deps, payload);
      if (!gated.allowed) {
        return gated.result;
      }
      // Plain objects and Action2Error data fields survive structured clone as-is.
      return deps.domainController.handleAction(
        payload.action,
        payload.applicationDeploymentMap,
        payload.currentModel,
        undefined,
        undefined,
        gated.principal,
      );
    }

    case "server-query": {
      const gated = await gateServerCall(deps, payload);
      if (!gated.allowed) {
        return gated.result;
      }
      return deps.domainController.handleBoxedExtractorOrQueryAction(
        payload.action,
        payload.applicationDeploymentMap,
        payload.currentModel,
        gated.principal,
      );
    }

    default:
      throw new Error(`handleMiroirIpc: unknown IPC message type: ${(payload as any).type}`);
  }
}
