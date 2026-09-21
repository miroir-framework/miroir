import { describe, expect, it } from "vitest";
import {
  adminSelfApplication,
  entityApplicationForAdmin,
  entityDeployment,
  entityMiroirRight,
} from "miroir-test-app_deployment-admin";

import type { DomainControllerInterface } from "miroir-core";

import {
  buildTeardownTestApplicationStoresAction,
  runTeardownTestApplicationStores,
} from "../../src/miroir-fwk/4-tests/testApplicationStoreTeardown.js";

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

  it("omits Admin instance deletes when deleteAdminInstances is false (transformer session)", () => {
    const action = buildTeardownTestApplicationStoresAction(
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
      {
        model: { emulatedServerType: "indexedDb", indexedDbName: "x" },
        data: { emulatedServerType: "indexedDb", indexedDbName: "x" },
      },
      { deleteAdminInstances: false },
    );

    expect(action.payload.actionSequence.map((step) => step.actionType)).toEqual([
      "storeManagementAction_deleteStore",
      "storeManagementAction_closeStore",
    ]);
  });

  it("deletes the testbed MiroirRight before Admin Deployment and Application when accessGrantUuid is set", () => {
    const grantUuid = "20b0b4ce-1d09-54c5-93be-59886264356f";
    const action = buildTeardownTestApplicationStoresAction(
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
      {
        model: { emulatedServerType: "indexedDb", indexedDbName: "x" },
        data: { emulatedServerType: "indexedDb", indexedDbName: "x" },
      },
      { accessGrantUuid: grantUuid },
    );

    expect(action.payload.actionSequence.map((step) => step.actionType)).toEqual([
      "storeManagementAction_deleteStore",
      "storeManagementAction_closeStore",
      "deleteInstance",
      "deleteInstance",
      "deleteInstance",
    ]);
    expect(action.payload.actionSequence[2]).toMatchObject({
      actionType: "deleteInstance",
      actionLabel: "DeleteTestbedApplicationAccessGrant for 22222222-2222-4222-8222-222222222222",
      payload: {
        application: adminSelfApplication.uuid,
        objects: [{ uuid: grantUuid, parentUuid: entityMiroirRight.uuid }],
      },
    });
  });

  it("does not delete the grant when Admin instances are kept", () => {
    const action = buildTeardownTestApplicationStoresAction(
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
      {
        model: { emulatedServerType: "indexedDb", indexedDbName: "x" },
        data: { emulatedServerType: "indexedDb", indexedDbName: "x" },
      },
      {
        deleteAdminInstances: false,
        accessGrantUuid: "20b0b4ce-1d09-54c5-93be-59886264356f",
      },
    );

    expect(action.payload.actionSequence.map((step) => step.actionType)).toEqual([
      "storeManagementAction_deleteStore",
      "storeManagementAction_closeStore",
    ]);
  });

  it("deletes the testbed MiroirRight before Admin Deployment and Application when accessGrantUuid is set", () => {
    const grantUuid = "20b0b4ce-1d09-54c5-93be-59886264356f";
    const action = buildTeardownTestApplicationStoresAction(
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
      {
        model: { emulatedServerType: "indexedDb", indexedDbName: "x" },
        data: { emulatedServerType: "indexedDb", indexedDbName: "x" },
      },
      { accessGrantUuid: grantUuid },
    );

    expect(action.payload.actionSequence.map((step) => step.actionType)).toEqual([
      "storeManagementAction_deleteStore",
      "storeManagementAction_closeStore",
      "deleteInstance",
      "deleteInstance",
      "deleteInstance",
    ]);
    expect(action.payload.actionSequence[2]).toMatchObject({
      actionType: "deleteInstance",
      actionLabel: "DeleteTestbedApplicationAccessGrant for 22222222-2222-4222-8222-222222222222",
      payload: {
        application: adminSelfApplication.uuid,
        objects: [{ uuid: grantUuid, parentUuid: entityMiroirRight.uuid }],
      },
    });
  });

  it("does not delete the grant when Admin instances are kept", () => {
    const action = buildTeardownTestApplicationStoresAction(
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
      {
        model: { emulatedServerType: "indexedDb", indexedDbName: "x" },
        data: { emulatedServerType: "indexedDb", indexedDbName: "x" },
      },
      {
        deleteAdminInstances: false,
        accessGrantUuid: "20b0b4ce-1d09-54c5-93be-59886264356f",
      },
    );

    expect(action.payload.actionSequence.map((step) => step.actionType)).toEqual([
      "storeManagementAction_deleteStore",
      "storeManagementAction_closeStore",
    ]);
  });

  it("runTeardownTestApplicationStores deletes Admin rows after deleteStore fails", async () => {
    const labels: string[] = [];
    const domainController = {
      handleCompositeAction: async (action: { actionLabel?: string }) => {
        labels.push(action.actionLabel ?? "");
        if (action.actionLabel === "teardownTestApplicationStores") {
          throw new Error("FailedToDeleteStore");
        }
        return { status: "ok" };
      },
    } as unknown as DomainControllerInterface;

    await expect(
      runTeardownTestApplicationStores({
        domainController,
        applicationDeploymentMap: {},
        modelEnvironment: { deploymentUuid: "11111111-1111-4111-8111-111111111111" } as any,
        deploymentUuid: "11111111-1111-4111-8111-111111111111",
        applicationUuid: "22222222-2222-4222-8222-222222222222",
        storeConfig: {
          model: { emulatedServerType: "indexedDb", indexedDbName: "x" },
          data: { emulatedServerType: "indexedDb", indexedDbName: "x" },
        },
        options: { accessGrantUuid: "20b0b4ce-1d09-54c5-93be-59886264356f" },
      }),
    ).rejects.toThrow("FailedToDeleteStore");

    expect(labels).toEqual([
      "teardownTestApplicationStores",
      "teardownTestApplicationAdminInstances",
    ]);
  });
});
