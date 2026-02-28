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
 *
 * PATH RESOLUTION FOR FILESYSTEM STORES
 * ──────────────────────────────────────
 * In development (non-packaged) the current working-directory is the electron package folder
 * (`packages/miroir-standalone-app-electron/`), so relative store paths like
 * `../miroir-test-app_deployment-admin/assets` resolve correctly.
 *
 * In production (packaged) the CWD is the installation directory and the assets are stored
 * under `resources/miroir-assets/` (bundled by electron-builder extraResources).  The helper
 * `resolveOpenStoreAction` rewrites every relative `directory` value in
 * `storeManagementAction_openStore` actions to an absolute path so both scenarios work
 * identically without modifying any stored JSON or renderer code.
 *
 *   Dev   assetsBase = packages/
 *   Prod  assetsBase = <resourcesPath>/miroir-assets/
 *
 * The assets directory layout under `assetsBase` mirrors the monorepo packages structure, e.g.
 *   miroir-core/src/assets/admin/
 *   miroir-test-app_deployment-admin/assets/
 *   miroir-test-app_deployment-miroir/assets/
 */

import { app, ipcMain } from "electron";
import * as os from "os";
import * as path from "path";
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
// Path resolution helpers
// ################################################################################################

/**
 * Returns the base directory that mirrors the monorepo `packages/` layout.
 * Receives `mainDirname` (the `__dirname` of main.ts) to avoid `import.meta.url`
 * in this file (tsconfig targets commonjs for IDE analysis).
 *
 * Dev   (non-packaged): dist/ → electron-pkg/ → packages/
 * Prod  (packaged):      <resourcesPath>/miroir-assets/
 */
export function getAssetsBasePath(mainDirname: string): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, "miroir-assets")
    : path.join(mainDirname, "../..");  // dist/ → electron-pkg/ → packages/
}

/**
 * Converts a potentially-relative store directory to an absolute path.
 * Relative paths are treated as relative to `assetsBasePath` using a fake
 * sibling `__stub` so that paths like `../miroir-foo/assets` resolve to
 * `assetsBasePath/miroir-foo/assets`.
 */
function resolveStoreDir(dir: string, assetsBasePath: string): string {
  if (path.isAbsolute(dir)) return dir;
  // path.resolve of "__stub/../miroir-foo" → "assetsBasePath/miroir-foo"
  return path.resolve(path.join(assetsBasePath, "__stub"), dir);
}

/**
 * Walks the `configuration` map inside a `storeManagementAction_openStore`
 * action and makes every `directory` value absolute.  Other action types are
 * returned unchanged.
 */
function resolveOpenStoreAction(action: any, assetsBasePath: string): any {
  if (action?.actionType !== "storeManagementAction_openStore") return action;
  const config = action.payload?.configuration;
  if (!config) return action;

  const resolvedConfig: Record<string, any> = {};
  for (const [deploymentUuid, deploymentConfig] of Object.entries(config as Record<string, any>)) {
    const resolved: Record<string, any> = {};
    for (const [section, sectionCfg] of Object.entries(deploymentConfig as Record<string, any>)) {
      if (sectionCfg && typeof sectionCfg === "object" && "directory" in sectionCfg) {
        resolved[section] = { ...sectionCfg, directory: resolveStoreDir(sectionCfg.directory, assetsBasePath) };
      } else {
        resolved[section] = sectionCfg;
      }
    }
    resolvedConfig[deploymentUuid] = resolved;
  }

  return { ...action, payload: { ...action.payload, configuration: resolvedConfig } };
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
 *
 * @param mainDirname - `__dirname` of main.ts, used to resolve dev-mode asset paths.
 */
export async function setupIpcServer(mainDirname: string): Promise<void> {
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
    server: { rootApiUrl: "https://localhost:3080" },
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
  const restClientStub = new RestClientStub("https://localhost:3080");
  restClientStub.setServerDomainController(domainController);
  restClientStub.setPersistenceStoreControllerManager(persistenceStoreControllerManager);

  // Expose the assets base path so the renderer (or other callers) can read it for
  // diagnostic purposes.  Path normalization of openStore actions is done transparently
  // inside the 'server-action' handler below; renderers do not need to call this for
  // normal operation.
  ipcMain.handle("get-assets-base-path", () => getAssetsBasePath(mainDirname));

  // Expose the platform-appropriate default filesystem folder so the renderer can
  // pre-populate filesystem / indexedDb deployment paths in Runner components.
  // Returns os.homedir() which resolves to e.g. /home/user on Linux, C:\Users\user on Windows.
  ipcMain.handle("get-default-filesystem-folder", () => os.homedir());

  ipcMain.handle(MIROIR_IPC_CHANNEL, async (_event, payload: any) => {
    switch (payload.type) {
      case "rest-call": {
        const { rawUrl, method, endpoint, args } = payload;
        const result = await restClientStub.call(rawUrl, method, endpoint, args);
        return serializeRestResult(result);
      }

      case "server-action": {
        // Normalize relative filesystem store paths so they work in both dev and
        // production (packaged) mode.  See getAssetsBasePath() / resolveOpenStoreAction().
        const resolvedAction = resolveOpenStoreAction(payload.action, getAssetsBasePath(mainDirname));
        const result = await domainController.handleAction(
          resolvedAction,
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
