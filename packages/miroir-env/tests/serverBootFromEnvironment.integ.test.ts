// #321 Slice 3: the server boots from the selected environment. Admin data is a copy seeded in
// .miroir/<environment>/, the Deployment and AdminApplication rows are generated from the
// definition, and writes to Admin data (rights, ViewParams) leave the package assets untouched.
// An Admin data section left without ViewParams gets the seed ones back at start.
// vitest, not MiroirTest: this is boot wiring on a real DomainController and filesystem stores.
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import {
  Action2Error,
  ConfigurationService,
  defaultMetaModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  ENTITY_ADMIN_APPLICATION_UUID,
  ENTITY_DEPLOYMENT_UUID,
  miroirCoreStartup,
  type DomainControllerInterface,
} from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";

import { boot, contentHashes, readRows, temporaryCheckout } from "./bootTestSupport";

const ENTITY_MIROIR_RIGHT = "a6136fc7-949b-4d64-9f13-dd3afce1ab3c";
const ENTITY_VIEW_PARAMS = "b9765b7c-b614-4126-a0e2-634463f99937";
const ENTITY_MIROIR_USER = "d20d09e5-0685-4fc7-b9bd-fcfa3845127a";
const DEFAULT_VIEW_PARAMS = "441cb6fd-2728-4a16-b170-ebceec1ce6c2";
const DESIGNER_DEPLOYMENT = "f0359240-e849-4546-8158-75f4a8ae5831";
const ADMIN_APPLICATION = "55af124e-8c05-4bae-a3ef-0933d41daa92";

async function persist(
  domainController: DomainControllerInterface,
  actionType: "createInstance" | "updateInstance",
  parentUuid: string,
  object: Record<string, unknown>,
) {
  const result = await domainController.handleAction(
    {
      actionType,
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: ADMIN_APPLICATION,
        applicationSection: "data",
        parentUuid,
        objects: [object as any],
      },
    },
    defaultSelfApplicationDeploymentMap,
    defaultMetaModelEnvironment,
  );
  expect(result instanceof Action2Error ? result.errorMessage : "ok").toBe("ok");
}

describe("server boot from the dev environment", () => {
  let root: string;
  let packagesBefore: Record<string, string>;
  let first: Awaited<ReturnType<typeof boot>>;
  let adminData: string;

  beforeAll(async () => {
    miroirCoreStartup();
    miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
    root = temporaryCheckout();
    packagesBefore = contentHashes(path.join(root, "packages"));
    first = await boot(root);
    adminData = path.join(root, ".miroir/dev/admin/data");
  }, 120000);

  it("keeps Admin's model live and copies its data into the environment state", () => {
    const admin = first.resolved.deployments.find((d) => d.applicationKey === "admin")!;
    expect(admin.configuration.model).toEqual({
      emulatedServerType: "filesystem",
      directory: "packages/miroir-app-admin/assets/admin_model",
    });
    expect(admin.configuration.data).toEqual({ emulatedServerType: "filesystem", directory: ".miroir/dev/admin/data" });
    expect(first.seed.seeded).toContain("admin/data");
    expect(Object.keys(readRows(path.join(adminData, ENTITY_MIROIR_USER))).length).toBeGreaterThan(0);
  });

  it("writes one Deployment and one AdminApplication row per installed application, from the definition", () => {
    const deployments = readRows(path.join(adminData, ENTITY_DEPLOYMENT_UUID));
    expect(Object.keys(deployments).sort()).toEqual(first.resolved.deployments.map((d) => d.deployment).sort());
    for (const deployment of first.resolved.deployments) {
      expect(deployments[deployment.deployment]).toMatchObject({
        parentUuid: ENTITY_DEPLOYMENT_UUID,
        selfApplication: deployment.selfApplication,
        configuration: deployment.configuration,
      });
    }
    const applications = readRows(path.join(adminData, ENTITY_ADMIN_APPLICATION_UUID));
    expect(Object.keys(applications).sort()).toEqual(first.resolved.deployments.map((d) => d.selfApplication).sort());
    expect(applications["5af03c98-fe5e-490b-b08f-e1230971c57f"]).toMatchObject({ name: "Library" });
  });

  it("opens every deployment of the environment and warns about nothing", () => {
    expect(first.reconciliation.warnings).toEqual([]);
    expect([...first.reconciliation.opened].sort()).toEqual(first.resolved.deployments.map((d) => d.deployment).sort());
    for (const deployment of first.resolved.deployments) {
      expect(first.persistenceStoreControllerManager.getPersistenceStoreController(deployment.deployment)).toBeDefined();
    }
    expect(first.reconciliation.applicationDeploymentMap["880831db-4f76-40b1-97c0-6a2f3f4ffccb"]).toBe(DESIGNER_DEPLOYMENT);
  });

  it("writes rights and ViewParams under .miroir/dev only", async () => {
    await persist(first.domainController, "createInstance", ENTITY_MIROIR_RIGHT, {
      uuid: "7c0f3a52-3321-4d3e-9f5b-3d2a6e0a0321",
      parentName: "MiroirRight",
      parentUuid: ENTITY_MIROIR_RIGHT,
      name: "slice 3 right",
      miroirUser: "e2343a39-f5d9-4898-83b4-74e2ccc33125",
      targetType: "deployment",
      targetUuid: DESIGNER_DEPLOYMENT,
      capability: "read",
    });
    const viewParams = readRows(path.join(adminData, ENTITY_VIEW_PARAMS))[DEFAULT_VIEW_PARAMS];
    await persist(first.domainController, "updateInstance", ENTITY_VIEW_PARAMS, { ...viewParams, sidebarWidth: 321 });

    expect(contentHashes(path.join(root, "packages"))).toEqual(packagesBefore);
    expect(readRows(path.join(adminData, ENTITY_MIROIR_RIGHT))["7c0f3a52-3321-4d3e-9f5b-3d2a6e0a0321"]).toBeDefined();
    expect(readRows(path.join(adminData, ENTITY_VIEW_PARAMS))[DEFAULT_VIEW_PARAMS].sidebarWidth).toBe(321);
  });

  it("keeps the state on the next boot, and warns about a deployment the definition no longer installs", async () => {
    const devFile = path.join(root, "environments/dev.json");
    const dev = JSON.parse(readFileSync(devFile, "utf-8"));
    delete dev.applications.designer;
    writeFileSync(devFile, JSON.stringify(dev, null, 2));

    const second = await boot(root);
    expect(second.seed.seeded).toEqual([]);
    expect(readRows(path.join(adminData, ENTITY_MIROIR_RIGHT))["7c0f3a52-3321-4d3e-9f5b-3d2a6e0a0321"]).toBeDefined();
    expect(readRows(path.join(adminData, ENTITY_VIEW_PARAMS))[DEFAULT_VIEW_PARAMS].sidebarWidth).toBe(321);
    expect(second.reconciliation.changes).toEqual([]);
    expect(second.reconciliation.warnings).toEqual([
      `deployment ${DESIGNER_DEPLOYMENT} (Designer) is in the Admin data of environment "dev" but not in its definition: it is opened anyway; record it with "miroir-env import" or remove it with "miroir-env prune"`,
    ]);
    expect(second.reconciliation.opened).toContain(DESIGNER_DEPLOYMENT);
    expect(contentHashes(path.join(root, "packages"))).toEqual(packagesBefore);
  }, 120000);

  it("restores the default ViewParams from the Admin seed when Admin data has none left", async () => {
    rmSync(path.join(adminData, ENTITY_VIEW_PARAMS, `${DEFAULT_VIEW_PARAMS}.json`));
    expect(readRows(path.join(adminData, ENTITY_VIEW_PARAMS))).toEqual({});

    const third = await boot(root);
    const seed = readRows(path.join(root, "packages/miroir-app-admin/assets/admin_data", ENTITY_VIEW_PARAMS));
    expect(readRows(path.join(adminData, ENTITY_VIEW_PARAMS))).toEqual(seed);
    expect(third.reconciliation.changes).toEqual([
      `restored ViewParams ${DEFAULT_VIEW_PARAMS} (Default ViewParams) from the Admin seed`,
    ]);

    const fourth = await boot(root);
    expect(fourth.reconciliation.changes).toEqual([]);
    expect(contentHashes(path.join(root, "packages"))).toEqual(packagesBefore);
  }, 120000);
});
