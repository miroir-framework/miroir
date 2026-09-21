import type {
  ApplicationDeploymentMap,
  CompositeActionSequence,
  DomainControllerInterface,
  EntityInstance,
  MiroirModelEnvironment,
  StoreUnitConfiguration,
  Uuid,
} from "miroir-core";
import {
  adminSelfApplication,
  entityApplicationForAdmin,
  entityDeployment,
  entityMiroirRight,
} from "miroir-test-app_deployment-admin";

export type TeardownTestApplicationStoresOptions = {
  deleteAdminInstances?: boolean;
  accessGrantUuid?: string;
};

const STORE_ENDPOINT = "bbd08cbb-79ff-4539-b91f-7a14f15ac55f" as const;
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89" as const;
const COMPOSITE_ENDPOINT = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5" as const;

function compositeSequence(
  actionLabel: string,
  actionSequence: CompositeActionSequence["payload"]["actionSequence"],
): CompositeActionSequence {
  return {
    actionType: "compositeActionSequence",
    actionLabel,
    endpoint: COMPOSITE_ENDPOINT,
    payload: {
      actionSequence,
    },
  };
}

/**
 * Browser-safe — no Node built-ins. Shared by runner sessions and IntegrationTestSession.
 *
 * Drops the ephemeral run-target store (model, data, and modelVersion when configured).
 * Admin Application / Deployment / MiroirRight cleanup is a separate sequence so a
 * FailedToDeleteStore does not skip metadata removal.
 * those Admin rows.
 */
export function buildTeardownTestApplicationStoreCleanupAction(
  deploymentUuid: Uuid,
  applicationUuid: Uuid,
  storeConfig: StoreUnitConfiguration,
): CompositeActionSequence {
  return compositeSequence("teardownTestApplicationStores", [
    {
      actionType: "storeManagementAction_deleteStore",
      actionLabel: "deleteStore model/data",
      endpoint: STORE_ENDPOINT,
      payload: {
        application: applicationUuid,
        deploymentUuid,
        configuration: storeConfig,
      },
    },
    {
      actionType: "storeManagementAction_closeStore",
      actionLabel: "closeStore",
      endpoint: STORE_ENDPOINT,
      payload: {
        application: applicationUuid,
      },
    },
  ]);
}

export function buildTeardownTestApplicationAdminCleanupAction(
  deploymentUuid: Uuid,
  applicationUuid: Uuid,
  options: TeardownTestApplicationStoresOptions = {},
): CompositeActionSequence | undefined {
  if (options.deleteAdminInstances === false) {
    return undefined;
  }
  const actionSequence: CompositeActionSequence["payload"]["actionSequence"] = [];
  if (options.accessGrantUuid) {
    actionSequence.push({
      actionType: "deleteInstance",
      actionLabel: "DeleteTestbedApplicationAccessGrant for " + applicationUuid,
      endpoint: INSTANCE_ENDPOINT,
      payload: {
        application: adminSelfApplication.uuid,
        applicationSection: "data",
        objects: [
          {
            uuid: options.accessGrantUuid,
            parentUuid: entityMiroirRight.uuid,
          } as EntityInstance,
        ],
      },
    });
  }
  actionSequence.push(
    {
      actionType: "deleteInstance",
      actionLabel: "DeleteDeploymentInstance for " + applicationUuid,
      endpoint: INSTANCE_ENDPOINT,
      payload: {
        application: adminSelfApplication.uuid,
        applicationSection: "data",
        objects: [
          {
            uuid: deploymentUuid,
            parentUuid: entityDeployment.uuid,
          } as EntityInstance,
        ],
      },
    },
    {
      actionType: "deleteInstance",
      actionLabel: "DeleteAdminApplicationInstance for " + applicationUuid,
      endpoint: INSTANCE_ENDPOINT,
      payload: {
        application: adminSelfApplication.uuid,
        applicationSection: "data",
        objects: [
          {
            uuid: applicationUuid,
            parentUuid: entityApplicationForAdmin.uuid,
          } as EntityInstance,
        ],
      },
    },
  );
  return compositeSequence("teardownTestApplicationAdminInstances", actionSequence);
}

/**
 * Combined store + Admin sequence (inspection / backward compatible). Runtime
 * teardown uses {@link runTeardownTestApplicationStores} so Admin cleanup still
 * runs when deleteStore fails.
 */
export function buildTeardownTestApplicationStoresAction(
  deploymentUuid: Uuid,
  applicationUuid: Uuid,
  storeConfig: StoreUnitConfiguration,
  options: TeardownTestApplicationStoresOptions = {},
): CompositeActionSequence {
  const storeCleanup = buildTeardownTestApplicationStoreCleanupAction(
    deploymentUuid,
    applicationUuid,
    storeConfig,
  );
  const adminCleanup = buildTeardownTestApplicationAdminCleanupAction(
    deploymentUuid,
    applicationUuid,
    options,
  );
  return compositeSequence("teardownTestApplicationStores", [
    ...storeCleanup.payload.actionSequence,
    ...(adminCleanup?.payload.actionSequence ?? []),
  ]);
}

export async function runTeardownTestApplicationStores(args: {
  domainController: DomainControllerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
  modelEnvironment: MiroirModelEnvironment;
  deploymentUuid: Uuid;
  applicationUuid: Uuid;
  storeConfig: StoreUnitConfiguration;
  options?: TeardownTestApplicationStoresOptions;
}): Promise<void> {
  const options = args.options ?? {};
  const storeCleanup = buildTeardownTestApplicationStoreCleanupAction(
    args.deploymentUuid,
    args.applicationUuid,
    args.storeConfig,
  );
  const adminCleanup = buildTeardownTestApplicationAdminCleanupAction(
    args.deploymentUuid,
    args.applicationUuid,
    options,
  );

  let storeFailure: unknown;
  try {
    const result = await args.domainController.handleCompositeAction(
      storeCleanup,
      args.applicationDeploymentMap,
      args.modelEnvironment,
      {},
    );
    if (result && typeof result === "object" && "status" in result && result.status === "error") {
      storeFailure = result;
    }
  } catch (error) {
    storeFailure = error;
  }

  if (adminCleanup) {
    await args.domainController.handleCompositeAction(
      adminCleanup,
      args.applicationDeploymentMap,
      args.modelEnvironment,
      {},
    );
  }

  if (storeFailure) {
    throw storeFailure;
  }
}
