import type {
  CompositeActionSequence,
  EntityInstance,
  StoreUnitConfiguration,
  Uuid,
} from "miroir-core";
import {
  adminSelfApplication,
  entityApplicationForAdmin,
  entityDeployment,
} from "miroir-test-app_deployment-admin";

/**
 * Browser-safe — no Node built-ins. Shared by runner sessions and IntegrationTestSession.
 *
 * Drops the ephemeral run-target store, then removes the Admin Deployment and
 * AdminApplication instances created for that run (otherwise they accumulate in
 * the shared Admin filesystem assets).
 */
export function buildTeardownTestApplicationStoresAction(
  deploymentUuid: Uuid,
  applicationUuid: Uuid,
  storeConfig: StoreUnitConfiguration,
): CompositeActionSequence {
  return {
    actionType: "compositeActionSequence",
    actionLabel: "teardownTestApplicationStores",
    endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
    payload: {
      actionSequence: [
        {
          actionType: "storeManagementAction_deleteStore",
          actionLabel: "deleteStore model/data",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          payload: {
            application: applicationUuid,
            deploymentUuid,
            configuration: storeConfig,
          },
        },
        {
          actionType: "storeManagementAction_closeStore",
          actionLabel: "closeStore",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          payload: {
            application: applicationUuid,
          },
        },
        {
          actionType: "deleteInstance",
          actionLabel: "DeleteDeploymentInstance for " + applicationUuid,
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
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
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
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
      ],
    },
  };
}
