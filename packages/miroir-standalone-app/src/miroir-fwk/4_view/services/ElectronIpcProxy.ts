/**
 * ElectronIpcProxy.ts — RENDERER PROCESS
 *
 * Renderer-side proxies that forward calls to the Electron main process via IPC instead of
 * making HTTP network requests.  Two classes are exported:
 *
 *   ElectronRestClient
 *     Implements RestClientInterface.  Replaces RestClientStub / RestClient for the renderer's
 *     domainControllerForClient persistence layer when running inside Electron.
 *
 *   ElectronServerDomainControllerProxy
 *     Implements the subset of DomainControllerInterface used by startWebApp (handleAction +
 *     handleBoxedExtractorOrQueryAction).  Replaces domainControllerForServer so that store
 *     management calls are routed to the main process.
 *
 * IPC serialisation note
 * ──────────────────────
 * Electron structured clone strips class prototypes.  Action2Error instances returned by the
 * main process arrive as plain objects with { status: "error", errorType, … }.  The
 * reconstructIpcResult() helper re-wraps them so that downstream instanceof checks still work.
 */

import {
  Action2Error,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type RestClientCallReturnType,
  type RestClientInterface,
} from "miroir-core";

// ################################################################################################
// Helpers
// ################################################################################################

/**
 * Reconstruct an Action2Error from its structured-clone-serialised plain-object form.
 */
function reconstructAction2Error(raw: any): Action2Error {
  return new Action2Error(
    raw.errorType,
    raw.errorMessage,
    raw.errorStack,
    raw.innerError,
    raw.errorContext
  );
}

/**
 * After an IPC round-trip, restore the Action2Error prototype when the payload represents an
 * error (identified by { status: "error", errorType: string }).
 */
function reconstructIpcResult(result: any): any {
  if (
    result !== null &&
    typeof result === "object" &&
    result.status === "error" &&
    typeof result.errorType === "string"
  ) {
    return reconstructAction2Error(result);
  }
  return result;
}

// ################################################################################################
// ElectronRestClient
// ################################################################################################

/**
 * RestClientInterface implementation that routes calls to the main process via IPC.
 * Drop-in replacement for RestClientStub when the app runs inside Electron.
 */
export class ElectronRestClient implements RestClientInterface {
  async get(
    rawUrl: string,
    endpoint: string,
    customConfig: any = {}
  ): Promise<RestClientCallReturnType> {
    return (window as any).electronAPI.callMiroirIpc({
      type: "rest-call",
      rawUrl,
      method: "get",
      endpoint,
      args: { ...customConfig, method: "GET" },
    });
  }

  async post(
    rawUrl: string,
    endpoint: string,
    body: any,
    customConfig: any = {}
  ): Promise<RestClientCallReturnType> {
    return (window as any).electronAPI.callMiroirIpc({
      type: "rest-call",
      rawUrl,
      method: "post",
      endpoint,
      args: { ...customConfig, body },
    });
  }

  async put(
    rawUrl: string,
    endpoint: string,
    body: any,
    customConfig: any = {}
  ): Promise<RestClientCallReturnType> {
    return (window as any).electronAPI.callMiroirIpc({
      type: "rest-call",
      rawUrl,
      method: "put",
      endpoint,
      args: { ...customConfig, body },
    });
  }

  async delete(
    rawUrl: string,
    endpoint: string,
    body: any,
    customConfig: any = {}
  ): Promise<RestClientCallReturnType> {
    return (window as any).electronAPI.callMiroirIpc({
      type: "rest-call",
      rawUrl,
      method: "delete",
      endpoint,
      args: { ...customConfig, body },
    });
  }
}

// ################################################################################################
// ElectronServerDomainControllerProxy
// ################################################################################################

/**
 * Minimal proxy for the server-side DomainController.
 * Implements only the methods called by startWebApp:
 *   - handleAction            (store management: openStore, etc.)
 *   - handleBoxedExtractorOrQueryAction  (querying deployments)
 *
 * Cast to DomainControllerInterface at the call site with `as any as DomainControllerInterface`.
 */
export class ElectronServerDomainControllerProxy {
  async handleAction(
    action: any,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModel?: any
  ): Promise<any> {
    const result = await (window as any).electronAPI.callMiroirIpc({
      type: "server-action",
      action,
      applicationDeploymentMap,
      currentModel,
    });
    return reconstructIpcResult(result);
  }

  async handleBoxedExtractorOrQueryAction(
    action: any,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModel?: any
  ): Promise<any> {
    const result = await (window as any).electronAPI.callMiroirIpc({
      type: "server-query",
      action,
      applicationDeploymentMap,
      currentModel,
    });
    return reconstructIpcResult(result);
  }
}
