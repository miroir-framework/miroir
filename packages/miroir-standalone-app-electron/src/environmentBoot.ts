/**
 * environmentBoot.ts — the environment half of the Electron main process (#345), free of any
 * `electron` import so that tests run it in Node.
 *
 * The main process runs an environment like miroir-server does (docs/reference/environments.md):
 *   - development: the environment selected in the checkout (MIROIR_ENV, environments/local.json,
 *     dev), state in .miroir/<environment>/;
 *   - packaged: the `desktop` environment in the user-data folder, seeded on first start from the
 *     assets bundled in resources/miroir-assets (`prepareDesktopRoot`).
 * It seeds the environment's copies, opens every deployment it installs, and gives the renderer
 * the client configuration it needs: the renderer opens no store itself.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

import {
  ConfigurationService,
  ELECTRON_LOOPBACK_ROOT_API_URL,
  MiroirActivityTracker,
  MiroirContext,
  MiroirEventService,
  PersistenceStoreControllerManager,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type MiroirConfigClient,
  type MiroirConfigServer,
} from "miroir-core";
import {
  bootEnvironment,
  environmentClientConfig,
  environmentServerConfig,
  GENERATED_ADMIN_ENTITIES,
  missingConnectionPasswords,
  recordInstallsOf,
  resolveEnvironmentFromFiles,
  seedEnvironmentState,
  type ResolvedEnvironment,
} from "miroir-env";
import { setupMiroirDomainController } from "miroir-localcache-redux/node";

import { registerStoreOnDemand } from "./storesOnDemand.js";

/** The environment of the packaged application. */
export const DESKTOP_ENVIRONMENT = "desktop";

export type ElectronServer = {
  environment: ResolvedEnvironment;
  serverConfig: MiroirConfigServer;
  miroirContext: MiroirContext;
  persistenceStoreControllerManager: PersistenceStoreControllerManager;
  domainController: DomainControllerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
  /** What the renderer receives over IPC (`get-client-config`): no database password. */
  clientConfig: MiroirConfigClient;
};

/**
 * The server configuration of the environment, served on the Electron loopback URL. Designer tools
 * stay on in Electron unless the environment turns them off.
 */
function electronServerConfig(environment: ResolvedEnvironment): MiroirConfigServer {
  const config = environmentServerConfig({
    ...environment,
    environment: { ...environment.environment, server: { ...environment.environment.server, rootApiUrl: ELECTRON_LOOPBACK_ROOT_API_URL } },
  });
  return { ...config, features: { designerTools: true, ...environment.environment.features } } as MiroirConfigServer;
}

/**
 * Selects, seeds and boots the environment of the Electron main process. `log` receives the lines
 * the server would print (selection, seeding, reconciliation).
 */
export async function bootElectronServer(
  options: { cwd: string; env: Record<string, string | undefined> },
  log: (line: string) => void = console.log,
): Promise<ElectronServer> {
  const environment = resolveEnvironmentFromFiles({ cwd: options.cwd, env: options.env });
  log(`environment: ${environment.name}, selected by ${environment.source}, defined by ${environment.files.join(" <- ")}`);
  const seed = seedEnvironmentState(environment);
  if (seed.seeded.length > 0) {
    log(`environment state seeded from package assets: ${seed.seeded.join(", ")}`);
  }
  for (const warning of missingConnectionPasswords(environment, options.env as NodeJS.ProcessEnv)) {
    log(`warning: ${warning}`);
  }

  // #370: each store package (and its database driver) loads when a section on that store opens.
  const configurationService = ConfigurationService.configurationService;
  registerStoreOnDemand(configurationService, "filesystem", async () =>
    (await import("miroir-store-filesystem")).miroirFileSystemStoreSectionStartup);
  registerStoreOnDemand(configurationService, "indexedDb", async () =>
    (await import("miroir-store-indexedDb")).miroirIndexedDbStoreSectionStartup);
  registerStoreOnDemand(configurationService, "mongodb", async () =>
    (await import("miroir-store-mongodb")).miroirMongoDbStoreSectionStartup);
  registerStoreOnDemand(configurationService, "sql", async () =>
    (await import("miroir-store-postgres")).miroirPostgresStoreSectionStartup);

  const serverConfig = electronServerConfig(environment);
  const miroirActivityTracker = new MiroirActivityTracker();
  const miroirContext = new MiroirContext(miroirActivityTracker, new MiroirEventService(miroirActivityTracker), serverConfig);
  const persistenceStoreControllerManager = new PersistenceStoreControllerManager(
    ConfigurationService.configurationService.adminStoreFactoryRegister,
    ConfigurationService.configurationService.StoreSectionFactoryRegister,
    serverConfig.server.filesystemDeploymentRootDirectory,
  );
  const domainController = await setupMiroirDomainController(miroirContext, {
    persistenceStoreAccessMode: "local",
    localPersistenceStoreControllerManager: persistenceStoreControllerManager,
  });

  const reconciliation = await bootEnvironment(domainController, environment, options.env);
  reconciliation.changes.forEach((change) => log(change));
  reconciliation.warnings.forEach((warning) => log(`warning: ${warning}`));
  // applications installed or dropped from the UI are recorded in environments/local.json
  recordInstallsOf(domainController, environment, log);

  const clientConfig = environmentClientConfig(environment);
  return {
    environment,
    serverConfig,
    miroirContext,
    persistenceStoreControllerManager,
    domainController,
    applicationDeploymentMap: reconciliation.applicationDeploymentMap,
    clientConfig: {
      ...clientConfig,
      client: { ...clientConfig.client, rootApiUrl: ELECTRON_LOOPBACK_ROOT_API_URL },
    } as MiroirConfigClient,
  };
}

/**
 * Empties the Admin data entities whose rows the environment generates (Deployment,
 * AdminApplication): the bundled Admin data carries the rows of the development checkout.
 */
function clearGeneratedAdminRows(root: string): void {
  const environment = resolveEnvironmentFromFiles({ cwd: root, env: { MIROIR_ROOT: root, MIROIR_ENV: DESKTOP_ENVIRONMENT } });
  const adminData = environment.deployments.find((d) => d.applicationKey === "admin")?.configuration.data;
  if (!adminData || !("directory" in adminData)) {
    return;
  }
  for (const entity of GENERATED_ADMIN_ENTITIES) {
    const directory = path.join(root, adminData.directory, entity);
    rmSync(directory, { recursive: true, force: true });
    mkdirSync(directory, { recursive: true });
  }
}

/**
 * The root of the packaged application's environment: `userData/miroir`, seeded on first start
 * with the assets bundled in `resources` (environments/ and <package>/assets), like the Docker
 * entrypoint seeds /data. Later starts keep what is there and only add the environment
 * definitions it lacks, so user data survives application updates.
 */
export function prepareDesktopRoot(options: { resources: string; userData: string }): string {
  const root = path.join(options.userData, "miroir");
  if (!existsSync(root) || readdirSync(root).length === 0) {
    cpSync(options.resources, root, { recursive: true });
    clearGeneratedAdminRows(root);
    return root;
  }
  const environments = path.join(options.resources, "environments");
  if (existsSync(environments)) {
    mkdirSync(path.join(root, "environments"), { recursive: true });
    for (const definition of readdirSync(environments)) {
      const target = path.join(root, "environments", definition);
      if (!existsSync(target)) {
        cpSync(path.join(environments, definition), target);
      }
    }
  }
  return root;
}
