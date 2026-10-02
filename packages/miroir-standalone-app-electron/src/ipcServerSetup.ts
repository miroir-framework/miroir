/**
 * ipcServerSetup.ts — Electron MAIN PROCESS
 *
 * Sets up the server-side Miroir infrastructure (store factories, domain controller, persistence
 * stores) and registers a single IPC channel `miroir-ipc` that the renderer process can call
 * instead of making HTTP requests.
 *
 * Message types:
 *   'rest-call'         – routes a REST-style call through RestClientStub (persistence actions)
 *   'server-action'     – routes an arbitrary DomainAction through the server DomainController
 *   'server-query'      – routes a boxed query through the server DomainController
 *   'get-client-config' – the renderer's client configuration, from the environment
 *
 * Because Electron IPC uses structured clone, class instances lose their prototype chain.
 * The RestClientCallReturnType.headers field (a Headers instance) is replaced with a plain
 * object before sending so that the renderer never receives a non-serialisable value.
 *
 * ENVIRONMENT (#345)
 * ─────────────────
 * The main process runs an environment like miroir-server (environmentBoot.ts): in development
 * the one selected in the checkout (MIROIR_ENV, environments/local.json, dev), packaged the
 * `desktop` environment in <userData>/miroir, seeded on first start from resources/miroir-assets.
 * It opens every deployment of the environment before the renderer loads; the renderer asks for
 * its client configuration with 'get-client-config' and opens no store itself.
 */

import { app, ipcMain } from "electron";
import express from "express";
import * as path from "path";
import {
  ConfigurationService,
  defaultSelfApplicationDeploymentMap,
  ELECTRON_LOOPBACK_ROOT_API_URL,
  electronRuntimeBaseUrl,
  getClientEnvironment,
  getProcessCapabilities,
  isAllowedElectronLoopbackOrigin,
  RestClientStub,
  shouldListenLoopbackHttp,
  shouldMountCopilotKitRoute,
  shouldMountMcpHttp,
  miroirCoreStartup
} from "miroir-core";
import { log } from "console";
import { bootElectronServer, DESKTOP_ENVIRONMENT, prepareDesktopRoot } from "./environmentBoot.js";

export const MIROIR_IPC_CHANNEL = "miroir-ipc";

// ################################################################################################
// Environment selection
// ################################################################################################

/**
 * Where the main process finds its environment: the checkout in development, the user-data
 * folder once packaged (seeded from resources/miroir-assets on first start).
 */
function electronEnvironmentLocation(): { cwd: string; env: Record<string, string | undefined> } {
  if (!app.isPackaged) {
    return { cwd: process.cwd(), env: process.env };
  }
  const root = prepareDesktopRoot({
    resources: path.join(process.resourcesPath, "miroir-assets"),
    userData: app.getPath("userData"),
  });
  // always `desktop`: a MIROIR_ENV from the shell names an environment of a checkout, not seeded here
  return { cwd: root, env: { ...process.env, MIROIR_ROOT: root, MIROIR_ENV: DESKTOP_ENVIRONMENT } };
}

// ################################################################################################
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

/**
 * Initialises the server-side Miroir stack and registers the IPC handler.
 * Must be called from the main process before loadURL() so the handler is ready when the
 * renderer first sends a message.
 */
export async function setupIpcServer(): Promise<void> {
  // Store factories are registered in the main-process ConfigurationService instance.
  // (The renderer process has a different ConfigurationService instance and can only register
  //  IndexedDb — which is why IPC is needed for filesystem / postgres / mongodb.)
  miroirCoreStartup();
  const { domainController, persistenceStoreControllerManager, serverConfig: electronServerConfig, clientConfig, environment } =
    await bootElectronServer(electronEnvironmentLocation(), (line) => log(`[miroir-env] ${line}`));

  // RestClientStub routes REST-shaped calls through restServerDefaultHandlers using the real stores.
  const restClientStub = new RestClientStub(ELECTRON_LOOPBACK_ROOT_API_URL);
  restClientStub.setServerDomainController(domainController);
  restClientStub.setPersistenceStoreControllerManager(persistenceStoreControllerManager);
  const capabilities = getProcessCapabilities({
    config: electronServerConfig,
    environment: getClientEnvironment(),
    storeSectionFactoryRegister:
      ConfigurationService.configurationService.StoreSectionFactoryRegister,
    adminStoreFactoryRegister:
      ConfigurationService.configurationService.adminStoreFactoryRegister,
  });
  restClientStub.setProcessCapabilities(capabilities);
  domainController.setProcessCapabilities(capabilities);

  // #370: miroir-ai and miroir-mcp load only when their feature is on.
  if (app.isPackaged && capabilities.agentBackend !== "none") {
    const { assertAgentSdkPackaged } = await import("miroir-ai");
    assertAgentSdkPackaged(capabilities.agentBackend);
  }

  if (shouldListenLoopbackHttp({ ai: capabilities.ai, mcp: capabilities.mcp })) {
    const loopbackApp = express();
    loopbackApp.use(express.json({ limit: "50mb" }));
    loopbackApp.use((request, response, next) => {
      const origin = typeof request.headers.origin === "string" ? request.headers.origin : undefined;
      if (origin && !isAllowedElectronLoopbackOrigin(origin)) {
        if (request.method === "OPTIONS") {
          response.status(403).end();
          return;
        }
        next();
        return;
      }
      const allowedOrigin =
        origin && isAllowedElectronLoopbackOrigin(origin) ? origin : undefined;
      if (allowedOrigin) {
        response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
        response.setHeader("Access-Control-Allow-Credentials", "true");
      }
      response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      if (request.method === "OPTIONS") {
        response.status(204).end();
        return;
      }
      next();
    });

    if (shouldMountCopilotKitRoute(capabilities.ai)) {
      const { createCopilotKitRouter } = await import("miroir-ai");
      const listenUrl = new URL(ELECTRON_LOOPBACK_ROOT_API_URL);
      const mcpHttpUrl = `http://127.0.0.1:${Number(listenUrl.port) || 3080}/mcp`;
      loopbackApp.use(
        "/api/copilotkit",
        createCopilotKitRouter(domainController, defaultSelfApplicationDeploymentMap, { capabilities, mcpHttpUrl }),
      );
    }

    if (shouldMountMcpHttp(capabilities.mcp)) {
      const { EndpointToolRegistry, setupMcpServer } = await import("miroir-mcp");
      const endpointToolRegistry = new EndpointToolRegistry(
        domainController,
        defaultSelfApplicationDeploymentMap,
      );
      const mcpServer = await setupMcpServer(
        express(),
        defaultSelfApplicationDeploymentMap,
        endpointToolRegistry,
        domainController,
      );
      mcpServer.mountHttpRoutes(loopbackApp);
    }

    const runtimeBase = electronRuntimeBaseUrl(electronServerConfig.server);
    const listenUrl = new URL(runtimeBase);
    const port = Number(listenUrl.port) || 3080;
    const server = loopbackApp.listen(port, "127.0.0.1", () => {
      log(`Electron loopback HTTP listening on 127.0.0.1:${port}`);
    });
    server.on("error", (error: Error) => {
      log("Electron loopback HTTP listen failed", error);
    });
  }

  // The root of the environment (repository root, or <userData>/miroir once packaged), for diagnostics.
  ipcMain.handle("get-assets-base-path", () => environment.repositoryRoot);

  ipcMain.handle(MIROIR_IPC_CHANNEL, async (_event, payload: any) => {
    switch (payload.type) {
      case "rest-call": {
        const { rawUrl, method, endpoint, args } = payload;
        const result = await restClientStub.call(rawUrl, method, endpoint, args);
        return serializeRestResult(result);
      }
      
      // The root of the environment: store paths are relative to it
      case "get-default-filesystem-folder": {
        return environment.repositoryRoot;
      }

      case "get-client-config": {
        return clientConfig;
      }

      case "server-action": {
        const result = await domainController.handleAction(
          payload.action,
          payload.applicationDeploymentMap,
          payload.currentModel
        );
        // Plain objects and Action2Error data fields survive structured clone as-is.
        return result;
      }

      case "server-query": {
        const result = await domainController.handleBoxedExtractorOrQueryAction(
          payload.action,
          payload.applicationDeploymentMap,
          payload.currentModel
        );
        return result;
      }

      default:
        throw new Error(
          `setupIpcServer: unknown IPC message type: ${(payload as any).type}`
        );
    }
  });
}
