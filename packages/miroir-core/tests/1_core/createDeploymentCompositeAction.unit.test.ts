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
import {
  adminSelfApplication,
  entityApplicationForAdmin,
  entityDeployment,
  entityMiroirRight,
} from "miroir-test-app_deployment-admin";

const ADMIN_DEPLOYMENT_UUID = "18db21bf-f8d3-4f6a-8296-84b69f6dc48b";
const APP_UUID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const DEPLOYMENT_UUID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ALICE_UUID = "1c39328c-7de4-44ae-bcf1-5bbc38d8e267";
/** uuid v5(`${alice}\napplication\n${app}`, ENTITY_MIROIR_RIGHT_UUID) */
const EXPECTED_GRANT_UUID = "20b0b4ce-1d09-54c5-93be-59886264356f";

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
  it("registers AdminApplication and Deployment before open/create store (hatch-on access gate)", () => {
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
      "createInstance",
      "storeManagementAction_openStore",
      "storeManagementAction_createStore",
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
    expect((actions[1] as { payload: { objects: unknown[] } }).payload.objects).toHaveLength(1);

    expect(actions[2]).toMatchObject({
      actionType: "storeManagementAction_openStore",
      actionLabel: "storeManagementAction_openStore for Library",
      payload: {
        application: APP_UUID,
        deploymentUuid: DEPLOYMENT_UUID,
      },
    });

    expect(actions[3]).toMatchObject({
      actionType: "storeManagementAction_createStore",
      actionLabel: "storeManagementAction_createStore for Library",
    });
  });

  it("inserts an application MiroirRight after Deployment and before openStore when grantAccessTo is set", () => {
    const sequence = createDeploymentCompositeAction(
      "Library",
      DEPLOYMENT_UUID,
      APP_UUID,
      adminDeployment,
      newDeploymentConfiguration,
      { skipOpenAdminStore: true, grantAccessTo: { miroirUserUuid: ALICE_UUID } },
    );

    const actions = sequence.payload.actionSequence;
    expect(actions.map((a) => a.actionType)).toEqual([
      "createInstance",
      "createInstance",
      "createInstance",
      "storeManagementAction_openStore",
      "storeManagementAction_createStore",
    ]);

    expect(actions[2]).toMatchObject({
      actionType: "createInstance",
      actionLabel: "CreateTestbedApplicationAccessGrant for Library",
      payload: {
        application: adminSelfApplication.uuid,
        applicationSection: "data",
        objects: [
          {
            uuid: EXPECTED_GRANT_UUID,
            parentName: "MiroirRight",
            parentUuid: entityMiroirRight.uuid,
            miroirUser: ALICE_UUID,
            targetType: "application",
            targetUuid: APP_UUID,
            capability: "admin",
          },
        ],
      },
    });
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
      "createInstance",
      "storeManagementAction_openStore",
      "storeManagementAction_createStore",
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
