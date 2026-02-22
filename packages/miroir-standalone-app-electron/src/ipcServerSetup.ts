/**
 * ipcServerSetup.ts — Electron MAIN PROCESS
 *
 * Sets up the server-side Miroir infrastructure (store factories, domain controller, persistence
 * stores) and registers a single IPC channel `miroir-ipc` that the renderer process can call
 * instead of making HTTP requests.
 *
 * Three message types are handled:
 *   'rest-call'      – routes a REST-style call through RestClientStub (persistence actions)
 *   'server-action'  – routes an arbitrary DomainAction through the server DomainController
 *   'server-query'   – routes a boxed query through the server DomainController
 *
 * Because Electron IPC uses structured clone, class instances lose their prototype chain.
 * The RestClientCallReturnType.headers field (a Headers instance) is replaced with a plain
 * object before sending so that the renderer never receives a non-serialisable value.
 */

import { ipcMain } from "electron";
import {
  ConfigurationService,
  MiroirActivityTracker,
  MiroirConfigServer,
  MiroirContext,
  MiroirEventService,
  PersistenceStoreControllerManager,
  RestClientStub,
  miroirCoreStartup
} from "miroir-core";
// import {
//   adminSelfApplication,
//   deployment_Admin,
//   deployment_Miroir,
//   entityDeployment,
// } from "miroir-test-app_deployment-admin";
import { setupMiroirDomainController } from "miroir-localcache-redux";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";

export const MIROIR_IPC_CHANNEL = "miroir-ipc";

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
        ? Object.fromEntries((result.headers as Headers).entries())
        : result.headers ?? {};
    return { ...result, headers };
  }
  return result;
}

// ################################################################################################
/**
 * Initialises the server-side Miroir stack and registers the IPC handler.
 * Must be called from the main process before loadURL() so the handler is ready when the
 * renderer first sends a message.
 */
export async function setupIpcServer(): Promise<void> {
  // Register all store factories in the main-process ConfigurationService instance.
  // (The renderer process has a different ConfigurationService instance and can only register
  //  IndexedDb — which is why IPC is needed for filesystem / postgres / mongodb.)
  miroirCoreStartup();
  miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
  miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
  miroirMongoDbStoreSectionStartup(ConfigurationService.configurationService);
  miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);

  const miroirActivityTracker = new MiroirActivityTracker();
  const miroirEventService = new MiroirEventService(miroirActivityTracker);

  const electronServerConfig: MiroirConfigServer = {
    miroirConfigType: "server",
    server: { rootApiUrl: "http://localhost:3080" },
  };

  const miroirContext = new MiroirContext(
    miroirActivityTracker,
    miroirEventService,
    electronServerConfig
  );

  const persistenceStoreControllerManager = new PersistenceStoreControllerManager(
    ConfigurationService.configurationService.adminStoreFactoryRegister,
    ConfigurationService.configurationService.StoreSectionFactoryRegister
  );

  const domainController = await setupMiroirDomainController(miroirContext, {
    persistenceStoreAccessMode: "local",
    localPersistenceStoreControllerManager: persistenceStoreControllerManager,
  });

  // RestClientStub routes REST-shaped calls through restServerDefaultHandlers using the real stores.
  const restClientStub = new RestClientStub("http://localhost:3080");
  restClientStub.setServerDomainController(domainController);
  restClientStub.setPersistenceStoreControllerManager(persistenceStoreControllerManager);

  ipcMain.handle(MIROIR_IPC_CHANNEL, async (_event, payload: any) => {
    switch (payload.type) {
      case "rest-call": {
        const { rawUrl, method, endpoint, args } = payload;
        const result = await restClientStub.call(rawUrl, method, endpoint, args);
        return serializeRestResult(result);
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
