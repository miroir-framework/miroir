import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

import {
  applicationAssetsDirectory,
  ENTITY_ADMIN_APPLICATION_UUID,
  ENTITY_DEPLOYMENT_UUID,
  environmentSectionMode,
  environmentSections,
  type MiroirConfigClient,
  type MiroirConfigServer,
  type StoreSectionConfiguration,
  type StoreUnitConfiguration,
} from "miroir-core";

import { EnvironmentError, type ResolvedEnvironment } from "./environmentFiles.js";

// ################################################################################################
// Environment state (#321): `copy` sections live in .miroir/<environment>/ (gitignored), seeded
// from the application package assets on first use. Admin's Deployment and AdminApplication rows
// are not seeded: they are generated from the definition (openEnvironment.ts).
// ################################################################################################

/** Admin data entities whose rows are generated from the environment definition, never seeded. */
export const GENERATED_ADMIN_ENTITIES = [ENTITY_DEPLOYMENT_UUID, ENTITY_ADMIN_APPLICATION_UUID];

export type SeedReport = {
  /** `<application>/<section>` copied from the package assets. */
  seeded: string[];
  /** `<application>/<section>` already present in the state, left as is. */
  kept: string[];
};

/**
 * Seeds every `copy` filesystem section that is missing from the environment state.
 * `reseed` wipes and seeds them again (test sessions start from the seed every time).
 */
export function seedEnvironmentState(resolved: ResolvedEnvironment, options: { reseed?: boolean } = {}): SeedReport {
  const report: SeedReport = { seeded: [], kept: [] };
  for (const deployment of resolved.deployments) {
    const application = resolved.environment.applications?.[deployment.applicationKey];
    if (!application) {
      continue;
    }
    for (const section of environmentSections(application)) {
      if (section === "admin" || environmentSectionMode(application, section) !== "copy") {
        continue;
      }
      const configuration = (deployment.configuration as Record<string, StoreSectionConfiguration>)[section];
      if (!configuration || !("directory" in configuration)) {
        continue;
      }
      const name = `${deployment.applicationKey}/${section}`;
      const target = path.join(resolved.repositoryRoot, configuration.directory);
      if (existsSync(target)) {
        if (!options.reseed) {
          report.kept.push(name);
          continue;
        }
        rmSync(target, { recursive: true, force: true });
      }
      const source = path.join(resolved.repositoryRoot, applicationAssetsDirectory(deployment.applicationKey, application, section));
      if (existsSync(source)) {
        // the entity directories of generated rows are kept (a filesystem data section knows its
        // entities by their directories), their rows are not
        const generated =
          deployment.applicationKey === "admin" && section === "data"
            ? GENERATED_ADMIN_ENTITIES.map((entity) => path.join(source, entity))
            : [];
        cpSync(source, target, { recursive: true, filter: (file) => !generated.includes(path.dirname(file)) });
      } else {
        mkdirSync(target, { recursive: true });
      }
      report.seeded.push(name);
    }
  }
  return report;
}

/** The server configuration of an environment; the filesystem root is the repository root. */
export function environmentServerConfig(resolved: ResolvedEnvironment): MiroirConfigServer {
  const server = resolved.environment.server;
  if (!server?.rootApiUrl) {
    throw new EnvironmentError(`environment "${resolved.name}" has no server.rootApiUrl: it cannot start a server`);
  }
  const config = {
    miroirConfigType: "server",
    server: {
      rootApiUrl: server.rootApiUrl,
      ...(server.mcpUrl ? { mcpUrl: server.mcpUrl } : {}),
      filesystemDeploymentRootDirectory: resolved.repositoryRoot,
      ...(server.corsAllowedOrigins ? { corsAllowedOrigins: server.corsAllowedOrigins } : {}),
    },
    ...(resolved.environment.features ? { features: resolved.environment.features } : {}),
  };
  return config as MiroirConfigServer;
}

/** Whether an installed application of the environment has a section on the given store. */
function usesStore(resolved: ResolvedEnvironment, store: string): boolean {
  return resolved.deployments.some((deployment) =>
    Object.values(deployment.configuration).some((section) => section?.emulatedServerType === store),
  );
}

/**
 * Warnings about database passwords a run of the environment needs and cannot find: the
 * definition names the variable (`connections.postgres.passwordEnv`), never the password.
 */
export function missingConnectionPasswords(resolved: ResolvedEnvironment, env: NodeJS.ProcessEnv): string[] {
  const passwordEnv = resolved.environment.connections?.postgres?.passwordEnv;
  if (!passwordEnv || env[passwordEnv] || !usesStore(resolved, "sql")) {
    return [];
  }
  return [
    `environment "${resolved.name}": ${passwordEnv} is not set, PostgreSQL connections go without a password (PGPASSWORD or ~/.pgpass may still provide one)`,
  ];
}

/** The deployment configuration with the Postgres password from `connections.postgres.passwordEnv`. */
function withConnectionPasswords(
  resolved: ResolvedEnvironment,
  configuration: StoreUnitConfiguration,
  env: NodeJS.ProcessEnv,
): StoreUnitConfiguration {
  const passwordEnv = resolved.environment.connections?.postgres?.passwordEnv;
  const password = passwordEnv ? env[passwordEnv] : undefined;
  if (!password) {
    return configuration;
  }
  const sections = Object.entries(configuration).map(([section, store]) => [
    section,
    store?.emulatedServerType === "sql"
      ? {
          ...store,
          connectionString: store.connectionString.replace(
            /^(postgres(?:ql)?:\/\/[^:@/]+)@/,
            `$1:${encodeURIComponent(password)}@`,
          ),
        }
      : store,
  ]);
  return Object.fromEntries(sections) as StoreUnitConfiguration;
}

/**
 * The client configuration of an environment run with an emulated server (tests): the stores of
 * every installed application, opened in process; the filesystem root is the repository root.
 * `env` provides the database passwords the definition names.
 */
export function environmentClientConfig(resolved: ResolvedEnvironment, env: NodeJS.ProcessEnv = {}): MiroirConfigClient {
  const rootApiUrl = resolved.environment.server?.rootApiUrl;
  if (!rootApiUrl) {
    throw new EnvironmentError(`environment "${resolved.name}" has no server.rootApiUrl: it cannot emulate a server`);
  }
  const deploymentStorageConfig: Record<string, StoreUnitConfiguration> = Object.fromEntries(
    resolved.deployments.map((deployment) => [
      deployment.deployment,
      withConnectionPasswords(resolved, deployment.configuration as StoreUnitConfiguration, env),
    ]),
  );
  const config = {
    miroirConfigType: "client",
    client: {
      emulateServer: true,
      rootApiUrl,
      filesystemDeploymentRootDirectory: resolved.repositoryRoot,
      deploymentStorageConfig,
    },
    ...(resolved.environment.features ? { features: resolved.environment.features } : {}),
  };
  return config as MiroirConfigClient;
}
