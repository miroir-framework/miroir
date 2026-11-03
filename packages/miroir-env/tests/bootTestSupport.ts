import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  applicationAssetsDirectory,
  ConfigurationService,
  MiroirActivityTracker,
  MiroirContext,
  MiroirEventService,
  PersistenceStoreControllerManager,
  localCacheKindFromEnvironment,
  type DomainControllerInterface,
  type LocalCacheModule,
} from "@miroir-framework/core";

import {
  bootEnvironment,
  environmentServerConfig,
  resolveEnvironmentFromFiles,
  seedEnvironmentState,
} from "../src/index";
import { repositoryRoot } from "./cliTestSupport";

// Boot of a server-side DomainController from an environment, as miroir-server does it (#321).

/**
 * A repository root holding the tracked dev environment and a copy of the assets of the applications
 * it installs, wherever their folder is (#671: AgentRuns lives under code-helpers/).
 */
export function temporaryCheckout(): string {
  const root = mkdtempSync(path.join(tmpdir(), "miroir-env-boot-"));
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ name: "r", workspaces: ["packages/*"] }));
  const devFile = path.join(repositoryRoot, "environments/dev.json");
  cpSync(devFile, path.join(root, "environments/dev.json"));
  const dev = JSON.parse(readFileSync(devFile, "utf-8"));
  for (const [key, application] of Object.entries<any>(dev.applications)) {
    const assets = applicationAssetsDirectory(key, application, "admin", dev.packagesDirectory);
    cpSync(path.join(repositoryRoot, assets), path.join(root, assets), { recursive: true });
  }
  return root;
}

export function contentHashes(directory: string): Record<string, string> {
  const hashes: Record<string, string> = {};
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const file = path.join(current, entry);
      if (statSync(file).isDirectory()) {
        walk(file);
      } else {
        hashes[path.relative(directory, file)] = createHash("sha256").update(readFileSync(file)).digest("hex");
      }
    }
  };
  walk(directory);
  return hashes;
}

/** The rows of an entity directory of a filesystem data section, by uuid. */
export function readRows(directory: string): Record<string, any> {
  if (!existsSync(directory)) {
    return {};
  }
  return Object.fromEntries(
    readdirSync(directory).map((file) => [file.replace(/\.json$/, ""), JSON.parse(readFileSync(path.join(directory, file), "utf-8"))]),
  );
}

// #656: the local cache MIROIR_TEST_LOCAL_CACHE names (run-nonreg.py --local-cache), redux when unset. From the
// caches' Node entries (test code): this package cannot depend on @miroir-framework/server, which depends on it.
async function testLocalCacheModule(): Promise<LocalCacheModule> {
  return localCacheKindFromEnvironment(process.env) === "zustand"
    ? (await import("miroir-localcache-zustand/node")).localCacheModule
    : (await import("miroir-localcache-redux/node")).localCacheModule;
}

/** #656: a platform built on another local cache than the one asked for would test the wrong one. */
function expectLocalCache(domainController: DomainControllerInterface): void {
  const expected = localCacheKindFromEnvironment(process.env);
  const actual = domainController.currentLocalCacheInfo().implementation;
  if (actual !== expected) {
    throw new Error(`test platform started on the ${actual} local cache, MIROIR_TEST_LOCAL_CACHE asks for ${expected}`);
  }
}

/** Seeds the selected environment and opens its deployments, like a server start. */
export async function boot(root: string, env: Record<string, string | undefined> = {}) {
  const resolved = resolveEnvironmentFromFiles({ cwd: root, env });
  const seed = seedEnvironmentState(resolved);
  const miroirConfig = environmentServerConfig(resolved);
  const activityTracker = new MiroirActivityTracker();
  const miroirContext = new MiroirContext(activityTracker, new MiroirEventService(activityTracker), miroirConfig);
  const persistenceStoreControllerManager = new PersistenceStoreControllerManager(
    ConfigurationService.configurationService.adminStoreFactoryRegister,
    ConfigurationService.configurationService.StoreSectionFactoryRegister,
    miroirConfig.server.filesystemDeploymentRootDirectory,
  );
  const domainController = (await testLocalCacheModule()).setupMiroirDomainController(miroirContext, {
    persistenceStoreAccessMode: "local",
    localPersistenceStoreControllerManager: persistenceStoreControllerManager,
  });
  expectLocalCache(domainController);
  const reconciliation = await bootEnvironment(domainController, resolved, env);
  return { resolved, seed, domainController, persistenceStoreControllerManager, reconciliation };
}
