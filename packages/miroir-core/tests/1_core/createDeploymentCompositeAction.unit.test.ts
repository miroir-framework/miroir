import { describe, expect, it } from "vitest";

import type {
  Deployment,
  MiroirConfigClient,
  StoreUnitConfiguration,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  createDeploymentCompositeAction,
  testUtils_deleteApplicationDeployment,
} from "../../src/1_core/Deployment";
import { adminSelfApplication, entityApplicationForAdmin, entityDeployment } from "miroir-test-app_deployment-admin";

const ADMIN_DEPLOYMENT_UUID = "18db21bf-f8d3-4f6a-8296-84b69f6dc48b";
const APP_UUID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const DEPLOYMENT_UUID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const adminDeployment = {
  uuid: ADMIN_DEPLOYMENT_UUID,
  selfApplication: adminSelfApplication.uuid,
  configuration: {
    admin: { emulatedServerType: "filesystem", directory: "admin" },
    model: { emulatedServerType: "filesystem", directory: "admin_model" },
    data: { emulatedServerType: "filesystem", directory: "admin_data" },
  },
} as Deployment;

const newDeploymentConfiguration = {
  admin: { emulatedServerType: "sql", schema: "testAdmin" },
  model: { emulatedServerType: "sql", schema: "test" },
  data: { emulatedServerType: "sql", schema: "test" },
} as StoreUnitConfiguration;

describe("createDeploymentCompositeAction", () => {
  it("matches Create Application / Deploy Existing order (AdminApplication before open/create store)", () => {
    const sequence = createDeploymentCompositeAction(
      "Library",
      DEPLOYMENT_UUID,
      APP_UUID,
      adminDeployment,
      newDeploymentConfiguration,
      { skipOpenAdminStore: true },
    );

    const actions = sequence.payload.actionSequence;
    expect(actions.map((a) => a.actionType)).toEqual([
      "createInstance",
      "storeManagementAction_openStore",
      "storeManagementAction_createStore",
      "createInstance",
    ]);

    expect(actions[0]).toMatchObject({
      actionType: "createInstance",
      actionLabel: "CreateAdminApplicationInstance for Library",
      payload: {
        application: adminSelfApplication.uuid,
        applicationSection: "data",
        objects: [
          {
            uuid: APP_UUID,
            parentUuid: entityApplicationForAdmin.uuid,
            selfApplication: APP_UUID,
          },
        ],
      },
    });
    expect((actions[0] as { payload: { objects: unknown[] } }).payload.objects).toHaveLength(1);

    expect(actions[1]).toMatchObject({
      actionType: "storeManagementAction_openStore",
      actionLabel: "storeManagementAction_openStore for Library",
      payload: {
        application: APP_UUID,
        deploymentUuid: DEPLOYMENT_UUID,
      },
    });

    expect(actions[2]).toMatchObject({
      actionType: "storeManagementAction_createStore",
      actionLabel: "storeManagementAction_createStore for Library",
    });

    expect(actions[3]).toMatchObject({
      actionType: "createInstance",
      actionLabel: "CreateDeploymentInstance for Library",
      payload: {
        application: adminSelfApplication.uuid,
        objects: [
          {
            uuid: DEPLOYMENT_UUID,
            parentUuid: entityDeployment.uuid,
            selfApplication: APP_UUID,
          },
        ],
      },
    });
    expect((actions[3] as { payload: { objects: unknown[] } }).payload.objects).toHaveLength(1);
  });

  it("includes Admin openStore as the first action by default (emulated)", () => {
    const sequence = createDeploymentCompositeAction(
      "Library",
      DEPLOYMENT_UUID,
      APP_UUID,
      adminDeployment,
      newDeploymentConfiguration,
    );

    const actions = sequence.payload.actionSequence;
    expect(actions[0]).toMatchObject({
      actionType: "storeManagementAction_openStore",
      actionLabel: "storeManagementAction_openStore for Library admin",
      payload: {
        application: adminSelfApplication.uuid,
        deploymentUuid: ADMIN_DEPLOYMENT_UUID,
      },
    });
    expect(actions.map((a) => a.actionType)).toEqual([
      "storeManagementAction_openStore",
      "createInstance",
      "storeManagementAction_openStore",
      "storeManagementAction_createStore",
      "createInstance",
    ]);
  });

  it("omits Admin openStore when skipOpenAdminStore is true", () => {
    const sequence = createDeploymentCompositeAction(
      "Library",
      DEPLOYMENT_UUID,
      APP_UUID,
      adminDeployment,
      newDeploymentConfiguration,
      { skipOpenAdminStore: true },
    );

    const actions = sequence.payload.actionSequence;
    expect(
      actions.some(
        (a) =>
          a.actionType === "storeManagementAction_openStore" &&
          (a as { payload?: { application?: string } }).payload?.application ===
            adminSelfApplication.uuid,
      ),
    ).toBe(false);
  });
});

describe("testUtils_deleteApplicationDeployment", () => {
  it("deletes the store, then Admin Deployment and AdminApplication instances", () => {
    const miroirConfig = {
      client: {
        emulateServer: false,
        serverConfig: {
          storeSectionConfiguration: {
            [DEPLOYMENT_UUID]: newDeploymentConfiguration,
          },
        },
      },
    } as unknown as MiroirConfigClient;

    const sequence = testUtils_deleteApplicationDeployment(
      miroirConfig,
      APP_UUID,
      DEPLOYMENT_UUID,
    );

    expect(sequence.payload.actionSequence.map((step) => step.actionType)).toEqual([
      "storeManagementAction_deleteStore",
      "deleteInstance",
      "deleteInstance",
    ]);
    expect(sequence.payload.actionSequence[1]).toMatchObject({
      actionType: "deleteInstance",
      payload: {
        application: adminSelfApplication.uuid,
        objects: [{ uuid: DEPLOYMENT_UUID, parentUuid: entityDeployment.uuid }],
      },
    });
    expect(sequence.payload.actionSequence[2]).toMatchObject({
      actionType: "deleteInstance",
      payload: {
        application: adminSelfApplication.uuid,
        objects: [{ uuid: APP_UUID, parentUuid: entityApplicationForAdmin.uuid }],
      },
    });
  });
});
