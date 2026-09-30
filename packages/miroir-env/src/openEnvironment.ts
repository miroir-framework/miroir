import {
  Action2Error,
  defaultMetaModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  ENTITY_ADMIN_APPLICATION_UUID,
  ENTITY_DEPLOYMENT_UUID,
  type ApplicationDeploymentMap,
  type Deployment,
  type DomainControllerInterface,
  type EntityInstance,
  type StoreUnitConfiguration,
} from "miroir-core";

import {
  appliedChange,
  compareAdminRows,
  deploymentLabel,
  extraDeploymentWarning,
  type AdminRow,
  type AdminRowChange,
} from "./adminRows.js";
import { EnvironmentError, type ResolvedEnvironment } from "./environmentFiles.js";
import { withConnectionPasswords } from "./environmentState.js";

// ################################################################################################
// Opening an environment's deployments (#321). The environment definition is the source of the
// Deployment and AdminApplication rows in Admin data; rows found there and absent from the
// definition (e.g. a UI install not recorded yet) are kept, opened, and reported as warnings.
// ################################################################################################

const ADMIN_APPLICATION = "55af124e-8c05-4bae-a3ef-0933d41daa92";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const QUERY_ENDPOINT = "9e404b3c-368c-40cb-be8b-e3c28550c25e";
const STORE_MANAGEMENT_ENDPOINT = "bbd08cbb-79ff-4539-b91f-7a14f15ac55f";

/** Opened first, with the platform's default application → deployment map. */
const BOOT_APPLICATIONS = ["admin", "miroir"];

export type EnvironmentReconciliation = {
  /** Every Deployment row in Admin data after reconciliation. */
  deployments: Deployment[];
  applicationDeploymentMap: ApplicationDeploymentMap;
  /** Deployment uuids open after reconciliation, boot deployments first. */
  opened: string[];
  /** Rows created or rewritten from the definition. */
  changes: string[];
  /** Deviations between the Admin data and the definition. */
  warnings: string[];
};

function rowsOf(value: unknown): AdminRow[] {
  if (Array.isArray(value)) {
    return value;
  }
  return value && typeof value === "object" ? (Object.values(value) as AdminRow[]) : [];
}

async function openDeployment(
  domainController: DomainControllerInterface,
  selfApplication: string,
  deployment: string,
  configuration: StoreUnitConfiguration,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<void> {
  const result = await domainController.handleAction(
    {
      actionType: "storeManagementAction_openStore",
      endpoint: STORE_MANAGEMENT_ENDPOINT,
      payload: {
        application: selfApplication,
        deploymentUuid: deployment,
        configuration: { [deployment]: configuration },
      },
    },
    applicationDeploymentMap,
    defaultMetaModelEnvironment,
  );
  if (result instanceof Action2Error) {
    throw new EnvironmentError(`could not open deployment ${deployment}: ${result.errorMessage}`);
  }
}

async function persistAdminRows(
  domainController: DomainControllerInterface,
  actionType: "createInstance" | "updateInstance",
  parentUuid: string,
  objects: EntityInstance[],
): Promise<void> {
  if (objects.length === 0) {
    return;
  }
  const result = await domainController.handleAction(
    {
      actionType,
      endpoint: INSTANCE_ENDPOINT,
      payload: { application: ADMIN_APPLICATION, applicationSection: "data", parentUuid, objects },
    },
    defaultSelfApplicationDeploymentMap,
    defaultMetaModelEnvironment,
  );
  if (result instanceof Action2Error) {
    throw new EnvironmentError(`could not write Admin rows of entity ${parentUuid}: ${result.errorMessage}`);
  }
}

/**
 * Opens the Admin and Miroir deployments of an environment. The platform addresses them through
 * `defaultSelfApplicationDeploymentMap`, so an environment cannot give them other uuids.
 */
export async function openEnvironmentBootDeployments(
  domainController: DomainControllerInterface,
  resolved: ResolvedEnvironment,
  env: NodeJS.ProcessEnv = {},
): Promise<string[]> {
  const opened: string[] = [];
  for (const key of BOOT_APPLICATIONS) {
    const deployment = resolved.deployments.find((d) => d.applicationKey === key);
    if (!deployment) {
      throw new EnvironmentError(`environment "${resolved.name}" does not install application "${key}"`);
    }
    const expected = defaultSelfApplicationDeploymentMap[deployment.selfApplication];
    if (expected !== deployment.deployment) {
      throw new EnvironmentError(
        `environment "${resolved.name}": application "${key}" must use deployment ${expected}, the one the platform opens, got ${deployment.deployment}`,
      );
    }
    await openDeployment(
      domainController,
      deployment.selfApplication,
      deployment.deployment,
      withConnectionPasswords(resolved, deployment.configuration, env),
      defaultSelfApplicationDeploymentMap,
    );
    opened.push(deployment.deployment);
  }
  return opened;
}

async function queryAdminRows(domainController: DomainControllerInterface) {
  const result = await domainController.handleBoxedExtractorOrQueryAction(
    {
      actionType: "runBoxedQueryAction",
      endpoint: QUERY_ENDPOINT,
      payload: {
        application: ADMIN_APPLICATION,
        applicationSection: "data",
        queryExecutionStrategy: "storage",
        query: {
          application: ADMIN_APPLICATION,
          queryType: "boxedQueryWithExtractorCombinerTransformer",
          extractors: {
            deployments: { extractorOrCombinerType: "extractorInstancesByEntity", parentUuid: ENTITY_DEPLOYMENT_UUID },
            applications: { extractorOrCombinerType: "extractorInstancesByEntity", parentUuid: ENTITY_ADMIN_APPLICATION_UUID },
          },
        },
      },
    },
    defaultSelfApplicationDeploymentMap,
    defaultMetaModelEnvironment,
  );
  if (result instanceof Action2Error) {
    throw new EnvironmentError(`could not read the Deployment rows of Admin: ${result.errorMessage}`);
  }
  const element = (result as { returnedDomainElement?: { deployments?: unknown; applications?: unknown } }).returnedDomainElement;
  return { deployments: rowsOf(element?.deployments), applications: rowsOf(element?.applications) };
}

/** Writes the created and rewritten rows of one entity. */
async function applyChanges(
  domainController: DomainControllerInterface,
  entity: { uuid: string; name: AdminRowChange["entity"] },
  changes: AdminRowChange[],
): Promise<void> {
  for (const action of ["create", "rewrite"] as const) {
    await persistAdminRows(
      domainController,
      action === "create" ? "createInstance" : "updateInstance",
      entity.uuid,
      changes.filter((change) => change.entity === entity.name && change.action === action).map((change) => change.row as EntityInstance),
    );
  }
}

/**
 * After the boot deployments are open: aligns the Deployment and AdminApplication rows of Admin
 * with the definition, then opens every other deployment, those of the definition and the extra
 * ones found in Admin data (with a warning).
 */
export async function reconcileEnvironmentDeployments(
  domainController: DomainControllerInterface,
  resolved: ResolvedEnvironment,
  env: NodeJS.ProcessEnv = {},
): Promise<EnvironmentReconciliation> {
  const comparison = compareAdminRows(resolved, await queryAdminRows(domainController));
  await applyChanges(domainController, { uuid: ENTITY_ADMIN_APPLICATION_UUID, name: "AdminApplication" }, comparison.changes);
  await applyChanges(domainController, { uuid: ENTITY_DEPLOYMENT_UUID, name: "Deployment" }, comparison.changes);
  const deployments = comparison.rows.deployments as Deployment[];

  const applicationDeploymentMap: ApplicationDeploymentMap = Object.fromEntries(
    deployments.map((deployment) => [deployment.selfApplication, deployment.uuid]),
  );
  const opened = resolved.deployments.filter((d) => BOOT_APPLICATIONS.includes(d.applicationKey)).map((d) => d.deployment);
  const warnings: string[] = [];

  for (const deployment of resolved.deployments) {
    if (opened.includes(deployment.deployment)) {
      continue;
    }
    await openDeployment(
      domainController,
      deployment.selfApplication,
      deployment.deployment,
      withConnectionPasswords(resolved, deployment.configuration, env),
      applicationDeploymentMap,
    );
    opened.push(deployment.deployment);
  }
  for (const deployment of comparison.extras) {
    warnings.push(extraDeploymentWarning(resolved, deployment, deploymentLabel(comparison, deployment)));
    if (!deployment.configuration) {
      continue;
    }
    await openDeployment(
      domainController,
      deployment.selfApplication,
      deployment.uuid,
      withConnectionPasswords(resolved, deployment.configuration as StoreUnitConfiguration, env),
      applicationDeploymentMap,
    );
    opened.push(deployment.uuid);
  }

  return {
    deployments,
    applicationDeploymentMap,
    opened,
    changes: comparison.changes.map(appliedChange),
    warnings,
  };
}

/**
 * Opens every deployment of an environment, as a server start does: the boot deployments (Admin,
 * Miroir), then the Deployment and AdminApplication rows aligned with the definition, then the
 * other deployments. For runtimes with nothing to do in between (CLI, Electron, tests); the server
 * imports its secrets between the two steps. `env` holds the Postgres password the definition names
 * (`connections.postgres.passwordEnv`).
 */
export async function bootEnvironment(
  domainController: DomainControllerInterface,
  resolved: ResolvedEnvironment,
  env: NodeJS.ProcessEnv = {},
): Promise<EnvironmentReconciliation> {
  await openEnvironmentBootDeployments(domainController, resolved, env);
  return reconcileEnvironmentDeployments(domainController, resolved, env);
}
