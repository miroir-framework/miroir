// #321 Slice 7: an application installed from the UI puts its stores in the apps directory of the
// selected environment, named by the configuration a server or a test run receives; while the
// server runs, environments/local.json follows the Deployment rows it writes and deletes.
// vitest, not MiroirTest: a server-side DomainController on real filesystem Admin stores in a
// temporary checkout, and environments/local.json on disk.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
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
  type EntityInstance,
} from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";

import {
  changesDeployments,
  environmentClientConfig,
  environmentServerConfig,
  recordInstalledApplications,
  recordInstallsOf,
  resolveEnvironmentFromFiles,
} from "../src/index";
import { boot, temporaryCheckout } from "./bootTestSupport";
import { repositoryRoot, temporaryRepository } from "./cliTestSupport";

const ADMIN_APPLICATION = "55af124e-8c05-4bae-a3ef-0933d41daa92";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";
const TRANSACTIONAL_INSTANCE_ENDPOINT = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5";
const LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";

const SCRATCH = {
  selfApplication: "3f0e7b1c-6d2a-4c11-9a3e-321000000011",
  deployment: "3f0e7b1c-6d2a-4c11-9a3e-321000000012",
};

function filesystem(directory: string) {
  return { emulatedServerType: "filesystem", directory };
}

function scratchConfiguration(appsDirectory: string) {
  return {
    admin: filesystem(`${appsDirectory}/admin`),
    model: filesystem(`${appsDirectory}/Scratch-model`),
    data: filesystem(`${appsDirectory}/Scratch-data`),
  };
}

async function adminAction(
  domainController: DomainControllerInterface,
  actionType: "createInstance" | "deleteInstance",
  objects: EntityInstance[],
): Promise<void> {
  const result = await domainController.handleAction(
    {
      actionType,
      endpoint: INSTANCE_ENDPOINT,
      payload: { application: ADMIN_APPLICATION, applicationSection: "data", objects },
    } as any,
    defaultSelfApplicationDeploymentMap,
    defaultMetaModelEnvironment,
  );
  expect(result instanceof Action2Error ? result.errorMessage : "ok").toBe("ok");
}

async function handle(domainController: DomainControllerInterface, action: unknown): Promise<void> {
  const result = await domainController.handleAction(
    action as any,
    defaultSelfApplicationDeploymentMap,
    defaultMetaModelEnvironment,
  );
  expect(result instanceof Action2Error ? result.errorMessage : "ok").toBe("ok");
}

/** The Admin rows the deployApplication Runner writes, in its order. */
function scratchRows(appsDirectory: string): EntityInstance[][] {
  return [
    [
      {
        uuid: SCRATCH.selfApplication,
        parentName: "AdminApplication",
        parentUuid: ENTITY_ADMIN_APPLICATION_UUID,
        name: "Scratch",
        defaultLabel: "The Scratch Application.",
        selfApplication: SCRATCH.selfApplication,
      } as EntityInstance,
    ],
    [
      {
        uuid: SCRATCH.deployment,
        parentName: "Deployment",
        parentUuid: ENTITY_DEPLOYMENT_UUID,
        name: "Deployment of application Scratch",
        selfApplication: SCRATCH.selfApplication,
        configuration: scratchConfiguration(appsDirectory),
      } as EntityInstance,
    ],
  ];
}

async function installScratch(domainController: DomainControllerInterface, appsDirectory: string): Promise<void> {
  for (const objects of scratchRows(appsDirectory)) {
    await adminAction(domainController, "createInstance", objects);
  }
}

/** The same rows written in a transaction, then committed. */
async function installScratchInTransaction(
  domainController: DomainControllerInterface,
  appsDirectory: string,
): Promise<void> {
  for (const objects of scratchRows(appsDirectory)) {
    await handle(domainController, {
      actionType: "transactionalInstanceAction",
      endpoint: TRANSACTIONAL_INSTANCE_ENDPOINT,
      payload: {
        application: ADMIN_APPLICATION,
        instanceAction: {
          actionType: "createInstance",
          endpoint: INSTANCE_ENDPOINT,
          payload: { application: ADMIN_APPLICATION, applicationSection: "data", objects },
        },
      },
    });
  }
  await handle(domainController, { actionType: "commit", endpoint: MODEL_ENDPOINT, payload: { application: ADMIN_APPLICATION } });
}

function readLocal(root: string): any {
  return JSON.parse(readFileSync(path.join(root, "environments/local.json"), "utf-8"));
}

describe("the apps directory of an environment", () => {
  it("is named by the configuration a server or a test run receives", () => {
    const dev = resolveEnvironmentFromFiles({ cwd: repositoryRoot, env: {}, name: "dev" });
    expect(environmentServerConfig(dev).environment).toEqual({ name: "dev", appsDirectory: ".miroir/dev/apps" });

    const testFilesystem = resolveEnvironmentFromFiles({ cwd: repositoryRoot, env: {}, name: "test-filesystem" });
    expect(environmentClientConfig(testFilesystem).environment).toEqual({
      name: "test-filesystem",
      appsDirectory: ".miroir/test-filesystem/apps",
    });
  });
});

describe("recording the applications a running server installs and drops", () => {
  beforeAll(() => {
    miroirCoreStartup();
    miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
  });

  it("only instance actions on Deployment rows of Admin data are changes to record", () => {
    const action = (application: string, parentUuid: string) =>
      ({
        actionType: "deleteInstance",
        endpoint: INSTANCE_ENDPOINT,
        payload: { application, applicationSection: "data", objects: [{ uuid: "u", parentUuid }] },
      }) as any;
    expect(changesDeployments(action(ADMIN_APPLICATION, ENTITY_DEPLOYMENT_UUID))).toBe(true);
    expect(changesDeployments(action(ADMIN_APPLICATION, ENTITY_ADMIN_APPLICATION_UUID))).toBe(false);
    expect(changesDeployments(action("5af03c98-fe5e-490b-b08f-e1230971c57f", ENTITY_DEPLOYMENT_UUID))).toBe(false);
  });

  it("with local selected, an install is recorded in local.json and a drop removes it, or nulls an inherited application", async () => {
    const root = temporaryCheckout();
    writeFileSync(path.join(root, "environments/local.json"), JSON.stringify({ extends: "dev" }));
    const { resolved, domainController } = await boot(root);
    expect(resolved.name).toBe("local");
    const lines: string[] = [];
    recordInstallsOf(domainController, resolved, (line) => lines.push(line));

    await installScratch(domainController, ".miroir/local/apps");
    expect(readLocal(root)).toEqual({
      extends: "dev",
      applications: {
        scratch: {
          selfApplication: SCRATCH.selfApplication,
          deployment: SCRATCH.deployment,
          configuration: scratchConfiguration(".miroir/local/apps"),
        },
      },
    });
    expect(lines).toEqual([
      "environments/local.json: updated",
      `  recorded scratch: deployment ${SCRATCH.deployment} (Scratch), given configuration`,
    ]);
    // the next start installs it from the definition: nothing is left for "miroir-env import"
    expect(recordInstalledApplications(resolved)).toEqual([]);

    lines.length = 0;
    await adminAction(domainController, "deleteInstance", [
      { uuid: SCRATCH.deployment, parentUuid: ENTITY_DEPLOYMENT_UUID } as EntityInstance,
    ]);
    await adminAction(domainController, "deleteInstance", [
      { uuid: LIBRARY_DEPLOYMENT, parentUuid: ENTITY_DEPLOYMENT_UUID } as EntityInstance,
    ]);
    expect(readLocal(root)).toEqual({ extends: "dev", applications: { library: null } });
    expect(lines).toEqual([
      "environments/local.json: updated",
      `  removed scratch (deployment ${SCRATCH.deployment})`,
      "environments/local.json: updated",
      `  removed library (deployment ${LIBRARY_DEPLOYMENT}): null, since dev installs it`,
    ]);
  }, 120000);

  it("an install committed from a transaction is recorded too", async () => {
    const root = temporaryCheckout();
    writeFileSync(path.join(root, "environments/local.json"), JSON.stringify({ extends: "dev" }));
    const { resolved, domainController } = await boot(root);
    const lines: string[] = [];
    recordInstallsOf(domainController, resolved, (line) => lines.push(line));

    await installScratchInTransaction(domainController, ".miroir/local/apps");
    expect(readLocal(root).applications).toEqual({
      scratch: {
        selfApplication: SCRATCH.selfApplication,
        deployment: SCRATCH.deployment,
        configuration: scratchConfiguration(".miroir/local/apps"),
      },
    });
    expect(lines).toEqual([
      "environments/local.json: updated",
      `  recorded scratch: deployment ${SCRATCH.deployment} (Scratch), given configuration`,
    ]);
  }, 120000);

  it("with a tracked environment selected, nothing is written: the server hints at miroir-env import", async () => {
    const root = temporaryCheckout();
    const { resolved, domainController } = await boot(root);
    expect(resolved.name).toBe("dev");
    const lines: string[] = [];
    recordInstallsOf(domainController, resolved, (line) => lines.push(line));

    await installScratch(domainController, ".miroir/dev/apps");
    expect(existsSync(path.join(root, "environments/local.json"))).toBe(false);
    expect(lines).toEqual([
      `deployment ${SCRATCH.deployment} (Scratch) is installed but environment "dev" does not record it: record it with "miroir-env import"`,
    ]);
  }, 120000);

  it("a test environment, reseeded at every session, records nothing", () => {
    const root = temporaryRepository({
      "test-filesystem": JSON.parse(readFileSync(path.join(repositoryRoot, "environments/test-filesystem.json"), "utf-8")),
    });
    const resolved = resolveEnvironmentFromFiles({ cwd: root, env: {}, name: "test-filesystem" });
    expect(recordInstalledApplications(resolved)).toEqual([]);
  });
});
