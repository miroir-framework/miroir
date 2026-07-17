import { describe, expect, it } from "vitest";
import {
  adminSelfApplication,
  entityApplicationForAdmin,
  entityDeployment,
} from "miroir-test-app_deployment-admin";

import { buildTeardownTestApplicationStoresAction } from "../../src/miroir-fwk/4-tests/testApplicationStoreTeardown.js";

describe("buildTeardownTestApplicationStoresAction", () => {
  it("deletes the ephemeral store, then Admin Deployment and AdminApplication instances", () => {
    const deploymentUuid = "11111111-1111-4111-8111-111111111111";
    const applicationUuid = "22222222-2222-4222-8222-222222222222";
    const storeConfig = {
      model: {
        emulatedServerType: "mongodb" as const,
        connectionString: "mongodb://localhost:27017",
        database: "ephemeral",
      },
      data: {
        emulatedServerType: "mongodb" as const,
        connectionString: "mongodb://localhost:27017",
        database: "ephemeral",
      },
    };

    const action = buildTeardownTestApplicationStoresAction(
      deploymentUuid,
      applicationUuid,
      storeConfig,
    );

    expect(action.actionLabel).toBe("teardownTestApplicationStores");
    expect(action.payload.actionSequence.map((step) => step.actionType)).toEqual([
      "storeManagementAction_deleteStore",
      "storeManagementAction_closeStore",
      "deleteInstance",
      "deleteInstance",
    ]);

    const deleteDeployment = action.payload.actionSequence[2]!;
    expect(deleteDeployment).toMatchObject({
      actionType: "deleteInstance",
      payload: {
        application: adminSelfApplication.uuid,
        applicationSection: "data",
        objects: [
          {
            uuid: deploymentUuid,
            parentUuid: entityDeployment.uuid,
          },
        ],
      },
    });

    const deleteAdminApplication = action.payload.actionSequence[3]!;
    expect(deleteAdminApplication).toMatchObject({
      actionType: "deleteInstance",
      payload: {
        application: adminSelfApplication.uuid,
        applicationSection: "data",
        objects: [
          {
            uuid: applicationUuid,
            parentUuid: entityApplicationForAdmin.uuid,
          },
        ],
      },
    });
  });
});
