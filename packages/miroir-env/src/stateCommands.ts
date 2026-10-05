import { cpSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  applicationAssetsDirectory,
  deriveEnvironmentDeployments,
  ENTITY_ADMIN_APPLICATION_UUID,
  ENTITY_DEPLOYMENT_UUID,
  isTestEnvironment,
  type Deployment,
  type EnvironmentDefinition,
  type MiroirEnvironmentApplication,
  type StoreSectionConfiguration,
  type StoreUnitConfiguration,
} from "miroir-core";

import {
  compareAdminRows,
  deploymentLabel,
  extraDeploymentWarning,
  pendingChange,
  stableJson,
  type AdminRow,
  type AdminRowsComparison,
} from "./adminRows.js";
import {
  ENVIRONMENTS_DIRECTORY,
  EnvironmentError,
  LOCAL_ENVIRONMENT,
  type ResolvedEnvironment,
} from "./environmentFiles.js";
import { ENVIRONMENT_LOCK_FILE, environmentStateDirectory } from "./environmentState.js";

// ################################################################################################
// `miroir-env check`, `import` and `prune` on the state of an environment, without a server (#321,
// analysis D14, D15). They read the filesystem Admin data section of the environment state:
// - rows the next start creates or rewrites from the definition (info);
// - deployments the definition does not install, which the server opens anyway (warning);
// - deployments written into the package Admin data before #321, no longer opened (warning).
// `import` records the last two in environments/local.json, `prune` deletes the first of them.
// ################################################################################################

export type Finding = { level: "info" | "warning"; message: string };

export type ExtraDeployment = {
  deployment: Deployment;
  label: string;
  /** state: Admin data of the environment; legacy: package Admin data, paths rebased on the repository root. */
  source: "state" | "legacy";
};

export type StateInspection = {
  /** The Admin data section of the environment, relative to the repository root, when on the filesystem. */
  adminData?: string;
  comparison?: AdminRowsComparison;
  extras: ExtraDeployment[];
  findings: Finding[];
};

export function readRows(directory: string): AdminRow[] {
  if (!existsSync(directory)) {
    return [];
  }
  return readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => JSON.parse(readFileSync(path.join(directory, file), "utf-8")) as AdminRow);
}

/** The filesystem directory of Admin's data section, relative to the repository root. */
function adminDataDirectory(resolved: ResolvedEnvironment): string | undefined {
  const data = resolved.deployments.find((d) => d.applicationKey === "admin")?.configuration.data;
  return data?.emulatedServerType === "filesystem" ? data.directory : undefined;
}

/** Deployment uuids that some environment definition installs. */
function definedDeployments(definitions: Record<string, EnvironmentDefinition>): Set<string> {
  const uuids = new Set<string>();
  for (const definition of Object.values(definitions)) {
    for (const application of Object.values((definition.applications ?? {}) as Record<string, unknown>)) {
      const deployment = (application as { deployment?: unknown } | null)?.deployment;
      if (typeof deployment === "string") {
        uuids.add(deployment);
      }
    }
  }
  return uuids;
}

/** Store locations of a configuration written before #321, relative to packages/: rebased on the repository root. */
function rebaseLegacyConfiguration(configuration: StoreUnitConfiguration): StoreUnitConfiguration {
  const rebase = (location: string) => (path.isAbsolute(location) ? location : path.posix.join("packages", location));
  return Object.fromEntries(
    Object.entries(configuration).map(([section, store]) => [
      section,
      store?.emulatedServerType === "filesystem"
        ? { ...store, directory: rebase(store.directory) }
        : store?.emulatedServerType === "indexedDb"
          ? { ...store, indexedDbName: rebase(store.indexedDbName) }
          : store,
    ]),
  ) as StoreUnitConfiguration;
}

/** The package Admin data directory, where UI installs wrote their Deployment rows before #321. */
function legacyAdminDataDirectory(resolved: ResolvedEnvironment): string | undefined {
  const admin = resolved.environment.applications?.admin;
  return admin?.package
    ? applicationAssetsDirectory("admin", { ...admin, package: admin.package }, "data", resolved.environment.packagesDirectory)
    : undefined;
}

/** Compares the Admin data of the environment state with the definition, and looks for legacy rows. */
export function inspectEnvironmentState(
  resolved: ResolvedEnvironment,
  definitions: Record<string, EnvironmentDefinition>,
): StateInspection {
  const adminData = adminDataDirectory(resolved);
  if (!adminData) {
    const store = resolved.deployments.find((d) => d.applicationKey === "admin")?.configuration.data?.emulatedServerType;
    return {
      extras: [],
      findings: [{ level: "info", message: `Admin data of environment "${resolved.name}" is on ${store}: only the server compares it with the definition` }],
    };
  }
  const inspection: StateInspection = { adminData, extras: [], findings: [] };
  const adminDataRoot = path.join(resolved.repositoryRoot, adminData);
  if (existsSync(adminDataRoot)) {
    const comparison = compareAdminRows(resolved, {
      deployments: readRows(path.join(adminDataRoot, ENTITY_DEPLOYMENT_UUID)),
      applications: readRows(path.join(adminDataRoot, ENTITY_ADMIN_APPLICATION_UUID)),
    });
    inspection.comparison = comparison;
    inspection.findings.push(...comparison.changes.map((change) => ({ level: "info" as const, message: pendingChange(change) })));
    for (const deployment of comparison.extras) {
      const label = deploymentLabel(comparison, deployment);
      inspection.extras.push({ deployment, label, source: "state" });
      inspection.findings.push({ level: "warning", message: extraDeploymentWarning(resolved, deployment, label) });
    }
  }

  const legacy = legacyAdminDataDirectory(resolved);
  if (!isTestEnvironment(resolved.name) && legacy && legacy !== adminData) {
    const known = definedDeployments(definitions);
    const inState = new Set(inspection.extras.map((extra) => extra.deployment.uuid));
    for (const row of readRows(path.join(resolved.repositoryRoot, legacy, ENTITY_DEPLOYMENT_UUID)) as Deployment[]) {
      if (known.has(row.uuid) || inState.has(row.uuid) || !row.configuration) {
        continue;
      }
      inspection.extras.push({
        deployment: { ...row, configuration: rebaseLegacyConfiguration(row.configuration) },
        label: row.name,
        source: "legacy",
      });
      inspection.findings.push({
        level: "warning",
        message: `deployment ${row.uuid} (${row.name}) of ${legacy} is no longer opened: Admin data lives in the environment state; record it with "miroir-env import"`,
      });
    }
  }
  return inspection;
}

// ################################################################################################
// import
// ################################################################################################

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function uniqueKey(base: string, uuid: string, taken: Set<string>): string {
  return taken.has(base) ? `${base}_${uuid.slice(0, 8)}` : base;
}

/**
 * The short form of a deployment whose stores are the live filesystem layout of a package
 * (`packages/<package>/assets/<prefix>_<section>`), checked by deriving it back.
 */
function packageApplication(
  resolved: ResolvedEnvironment,
  deployment: Deployment,
  taken: Set<string>,
): { key: string; application: MiroirEnvironmentApplication } | undefined {
  const configuration = deployment.configuration as StoreUnitConfiguration;
  if (configuration.admin?.emulatedServerType !== "filesystem" || configuration.model?.emulatedServerType !== "filesystem") {
    return undefined;
  }
  const packageName = /^packages\/([^/]+)\/assets$/.exec(configuration.admin.directory)?.[1];
  if (!packageName) {
    return undefined;
  }
  const prefix = new RegExp(`^packages/${escapeRegExp(packageName)}/assets/(.+)_model$`).exec(configuration.model.directory)?.[1];
  if (!prefix) {
    return undefined;
  }
  const key = uniqueKey(prefix, deployment.uuid, taken);
  const application: MiroirEnvironmentApplication = {
    package: packageName,
    ...(key !== prefix ? { assetPrefix: prefix } : {}),
    selfApplication: deployment.selfApplication,
    deployment: deployment.uuid,
    store: "filesystem",
    mode: "live",
    ...(configuration.modelVersion ? { sections: { modelVersion: {} } } : {}),
  };
  const derived = deriveEnvironmentDeployments({ applications: { [key]: application } }, resolved.stateName);
  return derived.status === "ok" && stableJson(derived.deployments[0].configuration) === stableJson(configuration)
    ? { key, application }
    : undefined;
}

/** A configuration with the state directory `from` replaced by `to`. */
function moveStateConfiguration(configuration: StoreUnitConfiguration, from: string, to: string): StoreUnitConfiguration {
  const move = (location: string) => (location === from || location.startsWith(`${from}/`) ? to + location.slice(from.length) : location);
  return Object.fromEntries(
    Object.entries(configuration).map(([section, store]) => [
      section,
      store?.emulatedServerType === "filesystem"
        ? { ...store, directory: move(store.directory) }
        : store?.emulatedServerType === "indexedDb"
          ? { ...store, indexedDbName: move(store.indexedDbName) }
          : store,
    ]),
  ) as StoreUnitConfiguration;
}

export function localFile(resolved: ResolvedEnvironment): string {
  return path.join(resolved.repositoryRoot, ENVIRONMENTS_DIRECTORY, `${LOCAL_ENVIRONMENT}.json`);
}

/**
 * The entry of environments/local.json recording an extra deployment, under a key not in `taken`
 * (added to it): the short form when its stores are the live layout of a package, else the
 * deployment with its configuration.
 */
export function localApplicationEntry(
  resolved: ResolvedEnvironment,
  extra: ExtraDeployment,
  taken: Set<string>,
  configuration: StoreUnitConfiguration = extra.deployment.configuration as StoreUnitConfiguration,
): { key: string; application: MiroirEnvironmentApplication; description: string } {
  const short = packageApplication(resolved, extra.deployment, taken);
  const slug = extra.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "application";
  const key = short?.key ?? uniqueKey(slug, extra.deployment.uuid, taken);
  taken.add(key);
  return {
    key,
    application: short?.application ?? {
      selfApplication: extra.deployment.selfApplication,
      deployment: extra.deployment.uuid,
      configuration,
    },
    description: `${key}: deployment ${extra.deployment.uuid} (${extra.label}), ${short ? `package ${short.application.package}` : "given configuration"}`,
  };
}

/**
 * Records the deployments the definition does not install (state and legacy) in
 * environments/local.json, created to extend the selected environment when absent. The state of
 * that environment is copied to .miroir/local/ at creation, since the environment name changes.
 */
export function importExtras(
  resolved: ResolvedEnvironment,
  definitions: Record<string, EnvironmentDefinition>,
  options: { dryRun?: boolean; env: Record<string, string | undefined> },
): string[] {
  if (isTestEnvironment(resolved.name)) {
    throw new EnvironmentError(`environment "${resolved.name}" is a test environment, reseeded at every session: nothing to import`);
  }
  const file = localFile(resolved);
  const exists = existsSync(file);
  if (exists && resolved.name !== LOCAL_ENVIRONMENT) {
    throw new EnvironmentError(
      `environments/local.json exists but environment "${resolved.name}" is selected (by ${resolved.source}): select local to import into it`,
    );
  }
  const inspection = inspectEnvironmentState(resolved, definitions);
  if (!inspection.adminData) {
    throw new EnvironmentError(`import reads Admin data from the filesystem; ${inspection.findings[0]?.message}`);
  }
  if (inspection.extras.length === 0) {
    return ["nothing to import: the definition installs every deployment of the Admin data"];
  }

  const lines: string[] = [];
  const verb = options.dryRun ? "would record" : "recorded";
  const fromState = environmentStateDirectory(resolved);
  const toState = environmentStateDirectory({ ...resolved, name: LOCAL_ENVIRONMENT, stateName: LOCAL_ENVIRONMENT });
  const copyState =
    !exists &&
    existsSync(path.join(resolved.repositoryRoot, fromState)) &&
    !existsSync(path.join(resolved.repositoryRoot, toState));

  const local: EnvironmentDefinition = exists
    ? JSON.parse(readFileSync(file, "utf-8"))
    : { extends: resolved.name };
  const applications = { ...((local.applications ?? {}) as Record<string, unknown>) };
  const taken = new Set([...Object.keys(resolved.environment.applications ?? {}), ...Object.keys(applications)]);
  for (const extra of inspection.extras) {
    const configuration = extra.deployment.configuration as StoreUnitConfiguration;
    const entry = localApplicationEntry(
      resolved,
      extra,
      taken,
      copyState && extra.source === "state" ? moveStateConfiguration(configuration, fromState, toState) : configuration,
    );
    applications[entry.key] = entry.application;
    lines.push(`  ${entry.description}`);
  }
  local.applications = applications;

  const header = exists
    ? `environments/local.json: ${options.dryRun ? "would update" : "updated"}`
    : `environments/local.json: ${options.dryRun ? "would create" : "created"}, extends ${resolved.name}`;
  lines.unshift(header, `${verb}:`);
  if (copyState) {
    lines.push(`${options.dryRun ? "would copy" : "copied"} ${fromState} to ${toState}`);
  }
  if (!exists && options.env.MIROIR_ENV) {
    lines.push(`note: MIROIR_ENV=${options.env.MIROIR_ENV} still selects "${options.env.MIROIR_ENV}"; unset it to use environments/local.json`);
  }
  if (options.dryRun) {
    return lines;
  }
  if (copyState) {
    const source = path.join(resolved.repositoryRoot, fromState);
    cpSync(source, path.join(resolved.repositoryRoot, toState), {
      recursive: true,
      filter: (entry) => entry !== path.join(source, ENVIRONMENT_LOCK_FILE),
    });
  }
  writeFileSync(file, JSON.stringify(local, null, 2) + "\n");
  return lines;
}

// ################################################################################################
// prune
// ################################################################################################

/** The location of a store section on disk (filesystem, IndexedDB), relative to the repository root. */
function storeLocation(store: StoreSectionConfiguration | undefined): string | undefined {
  if (store?.emulatedServerType === "filesystem") {
    return path.posix.normalize(store.directory);
  }
  if (store?.emulatedServerType === "indexedDb") {
    return path.posix.normalize(store.indexedDbName);
  }
  return undefined;
}

function contains(outer: string, inner: string): boolean {
  return inner === outer || inner.startsWith(`${outer}/`);
}

/**
 * Deletes the deployments of the Admin data that the definition does not install: their
 * Deployment rows, their AdminApplication rows when no other deployment uses them, and their
 * stores inside the environment state. Stores elsewhere (package assets, databases) are left.
 */
export function pruneExtras(
  resolved: ResolvedEnvironment,
  definitions: Record<string, EnvironmentDefinition>,
  options: { dryRun?: boolean },
): string[] {
  const inspection = inspectEnvironmentState(resolved, definitions);
  if (!inspection.adminData) {
    throw new EnvironmentError(`prune works on Admin data on the filesystem; ${inspection.findings[0]?.message}`);
  }
  const extras = inspection.extras.filter((extra) => extra.source === "state");
  if (extras.length === 0) {
    return ["nothing to prune: the definition installs every deployment of the Admin data"];
  }
  const removed = options.dryRun ? "would remove" : "removed";
  const stateDirectory = environmentStateDirectory(resolved);
  const adminData = path.join(resolved.repositoryRoot, inspection.adminData);
  const prunedUuids = new Set(extras.map((extra) => extra.deployment.uuid));
  const usedApplications = new Set([
    ...resolved.deployments.map((d) => d.selfApplication),
    ...(inspection.comparison?.rows.deployments ?? [])
      .filter((row) => !prunedUuids.has(String(row.uuid)))
      .map((row) => String(row.selfApplication)),
  ]);
  const definedLocations = resolved.deployments.flatMap((d) =>
    Object.values(d.configuration)
      .map((store) => storeLocation(store))
      .filter((location): location is string => location !== undefined)
      .map((location) => ({ location, applicationKey: d.applicationKey })),
  );

  const lines: string[] = [];
  const files: string[] = [];
  const directories: string[] = [];
  for (const { deployment, label } of extras) {
    files.push(path.join(adminData, ENTITY_DEPLOYMENT_UUID, `${deployment.uuid}.json`));
    lines.push(`${removed} Deployment ${deployment.uuid} (${label})`);
    const applicationFile = path.join(adminData, ENTITY_ADMIN_APPLICATION_UUID, `${deployment.selfApplication}.json`);
    if (!usedApplications.has(deployment.selfApplication) && existsSync(applicationFile) && !files.includes(applicationFile)) {
      files.push(applicationFile);
      lines.push(`${removed} AdminApplication ${deployment.selfApplication} (${label})`);
    }
    for (const store of Object.values(deployment.configuration ?? {})) {
      const location = storeLocation(store);
      if (!location) {
        const name = store?.emulatedServerType === "sql" ? `sql schema ${store.schema}` : `${store?.emulatedServerType} database ${(store as { database?: string }).database}`;
        lines.push(`left in place: ${name} (drop it by hand)`);
        continue;
      }
      const user = definedLocations.find((defined) => contains(defined.location, location) || contains(location, defined.location));
      if (user) {
        lines.push(`left in place: ${location} (used by application ${user.applicationKey})`);
      } else if (!location.startsWith(`${stateDirectory}/`)) {
        lines.push(`left in place: ${location} (outside ${stateDirectory})`);
      } else {
        directories.push(location);
      }
    }
  }
  const outermost = [...new Set(directories)]
    .sort((a, b) => a.length - b.length)
    .filter((location, index, sorted) => !sorted.slice(0, index).some((outer) => contains(outer, location)));
  for (const location of outermost) {
    if (existsSync(path.join(resolved.repositoryRoot, location))) {
      lines.push(`${removed} ${location}`);
    }
  }
  if (!options.dryRun) {
    for (const file of files) {
      rmSync(file, { force: true });
    }
    for (const location of outermost) {
      rmSync(path.join(resolved.repositoryRoot, location), { recursive: true, force: true });
    }
  }
  return lines;
}
