import type {
  CompositeActionSequence,
  StoreUnitConfiguration,
  Uuid,
} from "miroir-core";

/** Browser-safe — no Node built-ins. Shared by runner sessions and IntegrationTestSession. */
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
      ],
    },
  };
}
