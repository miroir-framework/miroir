import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  adminApplicationRow,
  applicationAssetsDirectory,
  deploymentRow,
  ENTITY_ADMIN_APPLICATION_UUID,
  ENTITY_DEPLOYMENT_UUID,
  type AdminRowLabels,
  type StoreUnitConfiguration,
} from "miroir-core";

import { EnvironmentError, type ResolvedEnvironment } from "./environmentFiles.js";
import { readRows } from "./stateCommands.js";

// ################################################################################################
// `miroir-env deploy <app>`: deploys an example application of the monorepo (packages/
// miroir-example-<app>) into the Admin data of an environment state, the way the server deploys
// the applications a definition installs: an AdminApplication row and a Deployment row opening
// the package assets live. The definition does not install the application: the server opens it
// with a warning until `miroir-env import` records it (or `prune` removes it).
// ################################################################################################

const EXAMPLE_PREFIX = "miroir-example-";
const SELF_APPLICATION_ENTITY = "a659d350-dd97-4da9-91de-524fa01745dc";
// Store sections of the Deployment, after admin, when the package assets have them.
const SECTIONS = ["model", "data", "modelVersion"] as const;

export type DeployOptions = {
  dryRun?: boolean;
  /** Environment state directory (.miroir/<environment>), relative to the repository root; default: the selected environment's. */
  state?: string;
};

type ExampleApplication = {
  package: string;
  selfApplication: string;
  deployment: string;
  labels: AdminRowLabels;
  configuration: StoreUnitConfiguration;
};

const readJson = (file: string) => JSON.parse(readFileSync(file, "utf-8")) as Record<string, any>;
const isDirectory = (directory: string) => existsSync(directory) && statSync(directory).isDirectory();

function packagesDirectory(resolved: ResolvedEnvironment): string {
  return resolved.environment.packagesDirectory ?? "packages";
}

function examplePackages(resolved: ResolvedEnvironment): string[] {
  const packages = path.join(resolved.repositoryRoot, packagesDirectory(resolved));
  return isDirectory(packages)
    ? readdirSync(packages)
        .filter((name) => name.startsWith(EXAMPLE_PREFIX) && isDirectory(path.join(packages, name, "assets", "deployment")))
        .sort()
    : [];
}

/** The application and deployment that packages/miroir-example-<app>/assets/deployment/ declares. */
function readExample(resolved: ResolvedEnvironment, app: string): ExampleApplication {
  const packageName = app.startsWith(EXAMPLE_PREFIX) ? app : EXAMPLE_PREFIX + app;
  const root = resolved.repositoryRoot;
  const assets = applicationAssetsDirectory(app, { package: packageName }, "admin", packagesDirectory(resolved));
  const declared = path.join(root, assets, "deployment");
  if (!isDirectory(declared)) {
    throw new EnvironmentError(
      `no example application "${packageName}" (${assets}/deployment/ not found); known: ${examplePackages(resolved).join(", ")}`,
    );
  }
  const rows = readRows(declared);
  const applications = rows.filter((row) => row.parentUuid === ENTITY_ADMIN_APPLICATION_UUID);
  const deployments = rows.filter((row) => row.parentUuid === ENTITY_DEPLOYMENT_UUID);
  if (applications.length !== 1 || deployments.length !== 1) {
    throw new EnvironmentError(
      `${assets}/deployment/ must hold one AdminApplication row and one Deployment row, found ${applications.length} and ${deployments.length}`,
    );
  }
  const selfApplication = String(applications[0].uuid);
  if (deployments[0].selfApplication !== selfApplication) {
    throw new EnvironmentError(
      `deployment ${deployments[0].uuid} of ${packageName} is for application ${deployments[0].selfApplication}, not ${selfApplication}`,
    );
  }

  const model = readdirSync(path.join(root, assets)).find((entry) => entry.endsWith("_model") && isDirectory(path.join(root, assets, entry)));
  if (!model) {
    throw new EnvironmentError(`${assets}/ has no <prefix>_model directory`);
  }
  const prefix = model.slice(0, -"_model".length);
  const configuration: Record<string, unknown> = { admin: { emulatedServerType: "filesystem", directory: assets } };
  for (const section of SECTIONS) {
    const directory = `${assets}/${prefix}_${section}`;
    if (isDirectory(path.join(root, directory))) {
      configuration[section] = { emulatedServerType: "filesystem", directory };
    }
  }
  if (!configuration.data) {
    throw new EnvironmentError(`${assets}/ has no ${prefix}_data directory`);
  }

  // Labels: the SelfApplication row of the model, as for installed applications, else the AdminApplication row.
  const selfApplicationRow = path.join(root, assets, model, SELF_APPLICATION_ENTITY, `${selfApplication}.json`);
  const labels = existsSync(selfApplicationRow) ? readJson(selfApplicationRow) : applications[0];
  return {
    package: packageName,
    selfApplication,
    deployment: String(deployments[0].uuid),
    labels: {
      name: String(labels.name),
      defaultLabel: typeof labels.defaultLabel === "string" ? labels.defaultLabel : undefined,
      description: typeof labels.description === "string" ? labels.description : undefined,
    },
    configuration: configuration as StoreUnitConfiguration,
  };
}

/** The Admin data directory, relative to the repository root, and the environment name the rows mention. */
function adminData(resolved: ResolvedEnvironment, state: string | undefined): { directory: string; environment: string } {
  if (state) {
    const relative = path.isAbsolute(state) ? path.relative(resolved.repositoryRoot, state) : state;
    return { directory: path.posix.join(relative.split(path.sep).join("/"), "admin/data"), environment: path.basename(state) };
  }
  const data = resolved.deployments.find((d) => d.applicationKey === "admin")?.configuration.data;
  if (data?.emulatedServerType !== "filesystem") {
    throw new EnvironmentError(
      `Admin data of environment "${resolved.name}" is on ${data?.emulatedServerType}: deploy writes Admin data on the filesystem only`,
    );
  }
  return { directory: data.directory, environment: resolved.name };
}

/** Writes the AdminApplication and Deployment rows of the example application; returns the report. */
export function deployExample(resolved: ResolvedEnvironment, app: string, options: DeployOptions = {}): string[] {
  const example = readExample(resolved, app);
  const target = adminData(resolved, options.state);
  const root = path.join(resolved.repositoryRoot, target.directory);
  if (!isDirectory(root)) {
    throw new EnvironmentError(
      `${target.directory} not found: start the server once on environment "${target.environment}" so its state is created`,
    );
  }
  const name = example.labels.name;

  const deployed = readRows(path.join(root, ENTITY_DEPLOYMENT_UUID)).find(
    (row) => row.uuid === example.deployment || row.selfApplication === example.selfApplication,
  );
  if (deployed) {
    return [`${name} (${example.package}) is already deployed in ${target.directory}: deployment ${deployed.uuid} (${deployed.name}). Nothing to do.`];
  }

  const verb = options.dryRun ? "would write" : "wrote";
  const write = (entity: string, row: { uuid: string }) => {
    const file = path.posix.join(target.directory, entity, `${row.uuid}.json`);
    if (!options.dryRun) {
      mkdirSync(path.join(root, entity), { recursive: true });
      writeFileSync(path.join(resolved.repositoryRoot, file), JSON.stringify(row, null, 2) + "\n");
    }
    return file;
  };

  const lines: string[] = [];
  if (readRows(path.join(root, ENTITY_ADMIN_APPLICATION_UUID)).some((row) => row.uuid === example.selfApplication)) {
    lines.push(`AdminApplication ${example.selfApplication} (${name}) already in the Admin data: kept`);
  } else {
    const file = write(ENTITY_ADMIN_APPLICATION_UUID, adminApplicationRow(example.selfApplication, example.labels));
    lines.push(`${verb} AdminApplication ${example.selfApplication} (${name}): ${file}`);
  }
  const deployment = deploymentRow(example.deployment, example.selfApplication, example.configuration, {
    name: `${name}_${target.environment}`,
    defaultLabel: `${name} in environment ${target.environment}`,
    description: `Deployment of ${name} in environment "${target.environment}", deployed by miroir-env from ${example.package}.`,
  });
  lines.push(`${verb} Deployment ${deployment.uuid} (${deployment.name}): ${write(ENTITY_DEPLOYMENT_UUID, deployment)}`);
  for (const [section, store] of Object.entries(example.configuration)) {
    lines.push(`  ${section.padEnd(12)} ${(store as { directory: string }).directory}`);
  }
  lines.push(
    `the definition of environment "${target.environment}" does not install it: the server opens it with a warning; record it with "miroir-env import" or remove it with "miroir-env prune"`,
  );
  return lines;
}
