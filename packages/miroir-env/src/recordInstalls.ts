import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  ENTITY_DEPLOYMENT_UUID,
  isTestEnvironment,
  REQUIRED_ENVIRONMENT_APPLICATIONS,
  resolveEnvironment,
  type Deployment,
  type DomainControllerInterface,
  type EnvironmentDefinition,
  type InstanceAction,
} from "miroir-core";

import {
  EnvironmentError,
  LOCAL_ENVIRONMENT,
  readEnvironmentDefinitions,
  resolveEnvironmentFromFiles,
  type ResolvedEnvironment,
} from "./environmentFiles.js";
import { inspectEnvironmentState, localApplicationEntry, localFile, readRows } from "./stateCommands.js";

// ################################################################################################
// Applications installed or dropped while a server runs (#321 Slice 7). Once a Deployment row of
// Admin data is written or deleted (Runners deployApplication, createApplication, dropApplication),
// environments/local.json follows the Admin data of the state, so the next start opens the same
// applications. Only local.json is written: a tracked environment gets a hint to run
// "miroir-env import", a test environment (reseeded at every session) nothing.
// ################################################################################################

const ADMIN_APPLICATION = "55af124e-8c05-4bae-a3ef-0933d41daa92";

/** Whether an instance action writes or deletes Deployment rows of Admin data. */
export function changesDeployments(action: InstanceAction): boolean {
  if (action.payload.application !== ADMIN_APPLICATION || !("objects" in action.payload)) {
    return false;
  }
  const objects = (action.payload.objects ?? []) as { parentUuid?: string }[];
  return objects.some((object) => object.parentUuid === ENTITY_DEPLOYMENT_UUID);
}

/** Application keys the environment extended by local.json installs. */
function inheritedApplications(definitions: Record<string, EnvironmentDefinition>, local: EnvironmentDefinition): Set<string> {
  if (!local.extends) {
    return new Set();
  }
  const parent = resolveEnvironment(definitions, local.extends);
  return new Set(parent.status === "ok" ? Object.keys(parent.environment.applications ?? {}) : []);
}

/**
 * Brings environments/local.json in line with the Deployment rows of the Admin data of the state:
 * records the deployments the definition does not install, removes the applications whose
 * Deployment row is gone (sets them to null when the extended environment installs them).
 * Returns what it did, or the hints for an environment it does not write.
 */
export function recordInstalledApplications(resolved: ResolvedEnvironment): string[] {
  if (isTestEnvironment(resolved.name)) {
    return [];
  }
  const definitions = readEnvironmentDefinitions(resolved.repositoryRoot);
  // read again: local.json may have changed since the server started
  const current = resolveEnvironmentFromFiles({ cwd: resolved.repositoryRoot, env: {}, name: resolved.name });
  const inspection = inspectEnvironmentState(current, definitions);
  if (!inspection.adminData) {
    return [];
  }
  const rows = readRows(path.join(current.repositoryRoot, inspection.adminData, ENTITY_DEPLOYMENT_UUID)) as Deployment[];
  const present = new Set(rows.map((row) => row.uuid));
  const installed = inspection.extras.filter((extra) => extra.source === "state" && extra.deployment.configuration);
  const required: readonly string[] = REQUIRED_ENVIRONMENT_APPLICATIONS;
  const dropped = current.deployments.filter(
    (deployment) => !present.has(deployment.deployment) && !required.includes(deployment.applicationKey),
  );
  if (installed.length === 0 && dropped.length === 0) {
    return [];
  }

  if (current.name !== LOCAL_ENVIRONMENT) {
    return [
      ...installed.map(
        (extra) =>
          `deployment ${extra.deployment.uuid} (${extra.label}) is installed but environment "${current.name}" does not record it: record it with "miroir-env import"`,
      ),
      ...dropped.map(
        (deployment) =>
          `application ${deployment.applicationKey} (deployment ${deployment.deployment}) was dropped but environment "${current.name}" installs it: the next start installs it again`,
      ),
    ];
  }

  const file = localFile(current);
  const local: EnvironmentDefinition = JSON.parse(readFileSync(file, "utf-8"));
  const applications = { ...((local.applications ?? {}) as Record<string, unknown>) };
  const inherited = inheritedApplications(definitions, local);
  const taken = new Set([...Object.keys(current.environment.applications ?? {}), ...Object.keys(applications)]);
  const lines: string[] = [];
  for (const extra of installed) {
    const entry = localApplicationEntry(current, extra, taken);
    applications[entry.key] = entry.application;
    lines.push(`recorded ${entry.description}`);
  }
  for (const deployment of dropped) {
    if (inherited.has(deployment.applicationKey)) {
      applications[deployment.applicationKey] = null;
      lines.push(`removed ${deployment.applicationKey} (deployment ${deployment.deployment}): null, since ${local.extends} installs it`);
    } else {
      delete applications[deployment.applicationKey];
      lines.push(`removed ${deployment.applicationKey} (deployment ${deployment.deployment})`);
    }
  }
  writeFileSync(file, JSON.stringify({ ...local, applications }, null, 2) + "\n");
  return ["environments/local.json: updated", ...lines.map((line) => `  ${line}`)];
}

/**
 * Keeps environments/local.json in line with the applications a running server installs or
 * drops: register once the start has reconciled the Admin data with the definition, since rows
 * missing before that are not drops. Returns the removal of the listener.
 */
export function recordInstallsOf(
  domainController: DomainControllerInterface,
  resolved: ResolvedEnvironment,
  report: (line: string) => void,
): () => void {
  return domainController.addInstanceActionListener((action) => {
    if (!changesDeployments(action)) {
      return;
    }
    try {
      recordInstalledApplications(resolved).forEach(report);
    } catch (error) {
      if (!(error instanceof EnvironmentError)) {
        throw error;
      }
      report(`cannot record the change in environments/local.json: ${error.message}`);
    }
  });
}
