import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  ConfigurationService,
  MiroirActivityTracker,
  MiroirContext,
  MiroirEventService,
  PersistenceStoreControllerManager,
} from "miroir-core";
import { setupMiroirDomainController } from "miroir-localcache-redux";

import {
  bootEnvironment,
  environmentServerConfig,
  resolveEnvironmentFromFiles,
  seedEnvironmentState,
} from "../src/index";
import { repositoryRoot } from "./cliTestSupport";

// Boot of a server-side DomainController from an environment, as miroir-server does it (#321).

const PACKAGES = [
  "miroir-app-miroir",
  "miroir-app-admin",
  "miroir-example-library",
  "miroir-example-designer",
];

/** A repository root holding the tracked dev environment and a copy of the packages it installs. */
export function temporaryCheckout(): string {
  const root = mkdtempSync(path.join(tmpdir(), "miroir-env-boot-"));
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ name: "r", workspaces: ["packages/*"] }));
  cpSync(path.join(repositoryRoot, "environments/dev.json"), path.join(root, "environments/dev.json"));
  for (const name of PACKAGES) {
    cpSync(path.join(repositoryRoot, "packages", name, "assets"), path.join(root, "packages", name, "assets"), {
      recursive: true,
    });
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
  const domainController = await setupMiroirDomainController(miroirContext, {
    persistenceStoreAccessMode: "local",
    localPersistenceStoreControllerManager: persistenceStoreControllerManager,
  });
  const reconciliation = await bootEnvironment(domainController, resolved);
  return { resolved, seed, domainController, persistenceStoreControllerManager, reconciliation };
}
