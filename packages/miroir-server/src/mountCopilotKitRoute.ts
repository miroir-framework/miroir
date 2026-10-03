import type { ApplicationDeploymentMap, DomainControllerInterface, ProcessCapabilities } from "miroir-core";
import { isAgentBackendAllowed, shouldMountCopilotKitRoute } from "miroir-core";

type RequestHandler = (request: any, response: any, next: any) => unknown;

export interface CopilotKitRouteHost {
  use(path: string, ...handlers: RequestHandler[]): unknown;
}

export interface MountCopilotKitRouteOptions {
  capabilities: ProcessCapabilities;
  domainController: DomainControllerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
  mcpHttpUrl: string;
  /** `features.agentModel` (#409). */
  agentModel?: string;
  /** Runs before the CopilotKit router, e.g. the authentication gate. */
  requestGate?: RequestHandler;
  /** Test seam; defaults to the dynamic import of `miroir-ai`. */
  importMiroirAi?: () => Promise<Pick<typeof import("miroir-ai"), "createCopilotKitRouter" | "assertAgentSdkPackaged">>;
}

// webpackIgnore keeps the import dynamic in the ncc release bundle, which otherwise hoists
// an external dynamic import into a static one.
const defaultImportMiroirAi = () => import(/* webpackIgnore: true */ "miroir-ai");

/**
 * Mounts `/api/copilotkit` when the `ai` capability is on. `miroir-ai` (CopilotKit and the
 * token provider SDKs) is imported only then, so a server with `ai` off never loads it (#409).
 * When the configured agent backend is reachable, its SDK must resolve: a Docker image built
 * for another `AGENT_BACKEND` fails here, at start, rather than on the first chat.
 */
export async function mountCopilotKitRoute(
  app: CopilotKitRouteHost,
  options: MountCopilotKitRouteOptions,
): Promise<boolean> {
  if (!shouldMountCopilotKitRoute(options.capabilities.ai)) {
    return false;
  }
  const { createCopilotKitRouter, assertAgentSdkPackaged } = await (
    options.importMiroirAi ?? defaultImportMiroirAi
  )();
  if (isAgentBackendAllowed(options.capabilities)) {
    assertAgentSdkPackaged(options.capabilities.agentBackend);
  }
  if (options.requestGate) {
    app.use("/api/copilotkit", options.requestGate);
  }
  app.use(
    "/api/copilotkit",
    createCopilotKitRouter(options.domainController, options.applicationDeploymentMap, {
      capabilities: options.capabilities,
      mcpHttpUrl: options.mcpHttpUrl,
      agentModel: options.agentModel,
    }),
  );
  return true;
}
