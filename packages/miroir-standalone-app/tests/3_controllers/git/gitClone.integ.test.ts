/**
 * #679 slice 10 (#683): clone a repository from the Git page's server, list the deployments it holds, and
 * install one: its Deployment row is written in Admin with directories inside the clone, its stores open,
 * and the local caches show its instances. No Git program is needed by the actions; the test server runs
 * `git http-backend`.
 *
 * The repositories are copies of `miroir-fixture-appForTest` with new uuids, since `test-filesystem`
 * already deploys appForTest. The clones go to `.miroir/test-filesystem/git-clones/`, under the deployment
 * root folder (the repository root in this environment).
 *
 * Not reachable through MiroirTest: the test builds repositories on disk and starts a Git server.
 * Skipped when the `git` program, which the test server runs, is not on the PATH.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- gitClone
 * ```
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  Action2Error,
  ADMIN_APPLICATION_UUID,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  type CompositeActionTemplate,
  type GitCloneResult,
  type GitInstallClonedDeploymentResult,
} from "@miroir-framework/core";

import { runnerCloneApplicationFromGit } from "@miroir-framework/core/meta-model";

import { gitCli, gitProgramMissing, startGitHttpServer, type GitHttpServer } from "./gitHttpServer.js";
import {
  applicationDeploymentMap,
  expectGitError,
  expectOk,
  gitAction,
  openGitTestContext,
  setGitCapability,
  type GitTestContext,
} from "./gitTestSetup.js";

const gitMissing = gitProgramMissing();
if (gitMissing) {
  console.warn(`gitClone skipped: ${gitMissing}`);
}

const REPOSITORY_ROOT = path.resolve(__dirname, "../../../../..");
const CLONES = ".miroir/test-filesystem/git-clones";
const FIXTURE_ASSETS = path.join(REPOSITORY_ROOT, "packages/miroir-fixture-appForTest/assets");
const FIXTURE_APPLICATION = "eef01001-0001-4000-8000-000000000001";
const FIXTURE_DEPLOYMENT = "eef01001-0002-4000-8000-000000000002";
/** An Entity of appForTest with instances in its data section. */
const FIXTURE_DATA_ENTITY = "a027c379-8468-43a5-ba4d-bf618be25cab";
const ADMIN_DEPLOYMENT_UUID = defaultSelfApplicationDeploymentMap[ADMIN_APPLICATION_UUID];
const REMOTE_USER = { username: "miroir-designer", password: "ghp_test-token-679-clone" };

/** A copy of appForTest under new uuids: its own application and deployment. */
type ClonedApp = { application: string; deployment: string; name: string };
const ALPHA: ClonedApp = {
  application: "679a0010-0001-4000-8000-0000000000a1",
  deployment: "679a0010-0002-4000-8000-0000000000a2",
  name: "cloneAlpha",
};
const BETA: ClonedApp = {
  application: "679a0010-0001-4000-8000-0000000000b1",
  deployment: "679a0010-0002-4000-8000-0000000000b2",
  name: "cloneBeta",
};
const DELTA: ClonedApp = {
  application: "679a0010-0001-4000-8000-0000000000d1",
  deployment: "679a0010-0002-4000-8000-0000000000d2",
  name: "cloneDelta",
};
const ZETA: ClonedApp = {
  application: "679a0010-0001-4000-8000-0000000000e1",
  deployment: "679a0010-0002-4000-8000-0000000000e2",
  name: "cloneZeta",
};
const GAMMA: ClonedApp = {
  application: "679a0010-0001-4000-8000-0000000000c1",
  deployment: "679a0010-0002-4000-8000-0000000000c2",
  name: "cloneGamma",
};

let context: GitTestContext;
let server: GitHttpServer;
let authServer: GitHttpServer;
const workTrees: string[] = [];

/** Copies the appForTest assets into `<target>/assets`, renaming its uuids and its application. */
function writeApp(target: string, app: ClonedApp, options: { emptyData?: boolean } = {}): void {
  const rename = (text: string) =>
    text
      .replaceAll(FIXTURE_APPLICATION, app.application)
      .replaceAll(FIXTURE_DEPLOYMENT, app.deployment)
      .replaceAll('"appForTest"', JSON.stringify(app.name));
  const copy = (from: string, to: string) => {
    for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
      if (options.emptyData && entry.isDirectory() && entry.name === "appForTest_data") {
        continue; // Git keeps no empty folder: the clone has no data folder at all
      }
      const destination = path.join(to, rename(entry.name));
      if (entry.isDirectory()) {
        fs.mkdirSync(destination, { recursive: true });
        copy(path.join(from, entry.name), destination);
      } else {
        fs.writeFileSync(destination, rename(fs.readFileSync(path.join(from, entry.name), "utf8")));
      }
    }
  };
  fs.mkdirSync(path.join(target, "assets"), { recursive: true });
  copy(FIXTURE_ASSETS, path.join(target, "assets"));
}

/** Rewrites the Deployment row of an app written by `writeApp`. */
function editDeploymentRow(target: string, app: ClonedApp, edit: (row: Record<string, any>) => void): void {
  const file = path.join(target, "assets", "deployment", `${app.deployment}.json`);
  const row = JSON.parse(fs.readFileSync(file, "utf8"));
  edit(row);
  fs.writeFileSync(file, JSON.stringify(row, undefined, 2));
}

/** A bare repository of `remote` holding one commit of what `fill` writes in a work tree. */
function publish(remote: GitHttpServer, name: string, fill: (workTree: string) => void): string {
  const url = remote.createBareRepository(name);
  const workTree = fs.mkdtempSync(path.join(os.tmpdir(), "miroir-git679-clone-source-"));
  workTrees.push(workTree);
  fill(workTree);
  gitCli(workTree, "init", "--quiet", "--initial-branch=main");
  gitCli(workTree, "add", "--all");
  gitCli(workTree, "commit", "--quiet", "-m", `${name}: initial`);
  gitCli(workTree, "push", "--quiet", path.join(remote.root, `${name}.git`), "main");
  return url;
}

function cached(deploymentUuid: string, entityUuid: string): string[] {
  const state = context.domainController.getLocalCache().getDomainState() as any;
  return Object.keys(state?.[deploymentUuid]?.data?.[entityUuid] ?? {});
}

/** The uuids of the fixture's instances of an Entity, as its files hold them. */
function fixtureInstances(entityUuid: string): string[] {
  const folder = path.join(FIXTURE_ASSETS, "appForTest_data", entityUuid);
  return fs
    .readdirSync(folder)
    .map((file) => String(JSON.parse(fs.readFileSync(path.join(folder, file), "utf8")).uuid))
    .sort();
}

function cloneFolder(name: string): string {
  return path.join(REPOSITORY_ROOT, CLONES, name);
}

describe.skipIf(gitMissing)("gitAction_clone and gitAction_installClonedDeployment (#679 slice 10)", () => {
  let singleUrl: string;
  let monorepoUrl: string;
  let emptyUrl: string;

  beforeAll(async () => {
    fs.rmSync(path.join(REPOSITORY_ROOT, CLONES), { recursive: true, force: true });
    context = await openGitTestContext();
    setGitCapability(context, true);
    server = await startGitHttpServer();
    // the repository of one package: `assets/` at its root
    singleUrl = publish(server, "alpha", (workTree) => writeApp(workTree, ALPHA));
    // a monorepo of two packages, one of them with no data file
    monorepoUrl = publish(server, "monorepo", (workTree) => {
      writeApp(path.join(workTree, "packages", "miroir-example-beta"), BETA);
      writeApp(path.join(workTree, "packages", "miroir-example-gamma"), GAMMA, { emptyData: true });
    });
    emptyUrl = publish(server, "nothing", (workTree) => fs.writeFileSync(path.join(workTree, "README.md"), "no app\n"));
  });

  afterAll(async () => {
    await server?.close();
    await authServer?.close();
    for (const workTree of workTrees) {
      fs.rmSync(workTree, { recursive: true, force: true });
    }
  });

  it("clones a repository into a folder of the deployment root and lists its deployment", async () => {
    const result = expectOk<GitCloneResult>(
      await gitAction(context, "gitAction_clone", { url: singleUrl, folderName: `${CLONES}/alpha` }),
    );
    expect(result.folderName).toBe(`${CLONES}/alpha`);
    expect(fs.realpathSync(result.root)).toBe(fs.realpathSync(cloneFolder("alpha")));
    expect(result.branches.current).toBe("main");
    expect(result.deployments).toEqual([
      {
        deploymentUuid: ALPHA.deployment,
        selfApplication: ALPHA.application,
        name: ALPHA.name,
        deploymentFile: `assets/deployment/${ALPHA.deployment}.json`,
        directories: {
          model: `${CLONES}/alpha/assets/appForTest_model`,
          data: `${CLONES}/alpha/assets/appForTest_data`,
          modelVersion: `${CLONES}/alpha/assets/appForTest_modelVersion`,
        },
        alreadyInstalled: false,
      },
    ]);
    expect(fs.existsSync(path.join(cloneFolder("alpha"), "assets", "appForTest_model"))).toBe(true);
  });

  it("installs the deployment of a clone: Admin lists it, and the local cache shows its instances", async () => {
    const installed = expectOk<GitInstallClonedDeploymentResult>(
      await gitAction(context, "gitAction_installClonedDeployment", { folderName: `${CLONES}/alpha` }),
    );
    expect(installed).toMatchObject({ application: ALPHA.application, deploymentUuid: ALPHA.deployment, name: ALPHA.name });
    expect(installed.reloadFailures).toBeUndefined();

    const admin = context.domainController.getLocalCache().getDomainState() as any;
    const adminDeployment = Object.keys(admin).find((deployment) => admin[deployment]?.data?.["7959d814-400c-4e80-988f-a00fe582ab98"]?.[ALPHA.deployment]);
    expect(adminDeployment, "the client's cache of Admin holds the new Deployment row").toBeDefined();
    const row = admin[adminDeployment!].data["7959d814-400c-4e80-988f-a00fe582ab98"][ALPHA.deployment];
    expect(row.selfApplication).toBe(ALPHA.application);
    expect(row.configuration.model).toEqual({ emulatedServerType: "filesystem", directory: `${CLONES}/alpha/assets/appForTest_model` });
    expect(row.configuration.admin.emulatedServerType).toBe("filesystem");

    expect(cached(ALPHA.deployment, FIXTURE_DATA_ENTITY).sort()).toEqual(fixtureInstances(FIXTURE_DATA_ENTITY));
  });

  it("refuses to install the same deployment twice", async () => {
    expectGitError(
      await gitAction(context, "gitAction_installClonedDeployment", { folderName: `${CLONES}/alpha` }),
      "applicationAlreadyDeployed",
    );
    const again = expectGitError(
      await gitAction(context, "gitAction_clone", { url: singleUrl, folderName: `${CLONES}/alpha` }),
      "folderNotEmpty",
    );
    expect(again.errorContext?.folderName).toBe(`${CLONES}/alpha`);
  });

  it("lists every deployment of a monorepo, and installs the one named", async () => {
    const result = expectOk<GitCloneResult>(
      await gitAction(context, "gitAction_clone", { url: monorepoUrl, folderName: `${CLONES}/monorepo` }),
    );
    expect(result.deployments.map((deployment) => deployment.name)).toEqual([BETA.name, GAMMA.name]);
    const gamma = result.deployments.find((deployment) => deployment.name === GAMMA.name)!;
    // no data file in the repository: the data folder goes next to the model folder
    expect(gamma.directories.data).toBe(`${CLONES}/monorepo/packages/miroir-example-gamma/assets/appForTest_data`);

    expectGitError(
      await gitAction(context, "gitAction_installClonedDeployment", { folderName: `${CLONES}/monorepo` }),
      "severalDeploymentsFound",
    );
    expectGitError(
      await gitAction(context, "gitAction_installClonedDeployment", {
        folderName: `${CLONES}/monorepo`,
        deploymentUuid: ALPHA.deployment,
      }),
      "unknownClonedDeployment",
    );
    expectOk(
      await gitAction(context, "gitAction_installClonedDeployment", {
        folderName: `${CLONES}/monorepo`,
        deploymentUuid: BETA.deployment,
      }),
    );
    expect(cached(BETA.deployment, FIXTURE_DATA_ENTITY).sort()).toEqual(fixtureInstances(FIXTURE_DATA_ENTITY));

    // the deployment with no data folder opens too, with no instance
    const installed = expectOk<GitInstallClonedDeploymentResult>(
      await gitAction(context, "gitAction_installClonedDeployment", {
        folderName: `${CLONES}/monorepo`,
        deploymentUuid: GAMMA.deployment,
      }),
    );
    expect(installed.reloadFailures).toBeUndefined();
    expect(cached(GAMMA.deployment, FIXTURE_DATA_ENTITY)).toEqual([]);
  });

  it("keeps the folder of a repository with no deployment, and says so", async () => {
    const error = expectGitError(
      await gitAction(context, "gitAction_clone", { url: emptyUrl, folderName: `${CLONES}/nothing` }),
      "noDeploymentFound",
    );
    expect(error.errorContext?.folderName).toBe(`${CLONES}/nothing`);
    expect(fs.existsSync(path.join(cloneFolder("nothing"), "README.md"))).toBe(true);
  });

  it("refuses a folder outside the deployment root, or inside an open deployment's folder", async () => {
    for (const folderName of ["../outside", "/tmp/outside", `${CLONES}/../../../outside`]) {
      expectGitError(await gitAction(context, "gitAction_clone", { url: singleUrl, folderName }), "outsideDeploymentRoot");
    }
    for (const folderName of ["", "with space", `${CLONES}/.git/x`]) {
      expectGitError(await gitAction(context, "gitAction_clone", { url: singleUrl, folderName }), "invalidFolderName");
    }
    expectGitError(
      await gitAction(context, "gitAction_clone", { url: singleUrl, folderName: ".miroir/test-filesystem/library/model/x" }),
      "sharedFolder",
    );
    expect(fs.existsSync(path.join(REPOSITORY_ROOT, "outside"))).toBe(false);
  });

  it("skips a Deployment row whose uuid or section folders would lead out of the clone", async () => {
    const url = publish(server, "tricked", (workTree) => {
      writeApp(path.join(workTree, "packages", "uuid"), ZETA);
      editDeploymentRow(path.join(workTree, "packages", "uuid"), ZETA, (row) => {
        row.uuid = "../../../../../../../../tmp/miroir-git679-pwn";
      });
      writeApp(path.join(workTree, "packages", "section"), DELTA, { emptyData: true });
      editDeploymentRow(path.join(workTree, "packages", "section"), DELTA, (row) => {
        row.configuration.data.directory = "x/..";
        row.configuration.devData = { emulatedServerType: "filesystem", directory: "..\\..\\..\\Windows" };
      });
    });
    const error = expectGitError(
      await gitAction(context, "gitAction_clone", { url, folderName: `${CLONES}/tricked` }),
      "noDeploymentFound",
    );
    expect((error.errorContext?.skipped as { reason: string }[]).map((skipped) => skipped.reason).sort()).toEqual([
      "Sections that are not files of the repository: data, devData",
      "The uuid or selfApplication of the Deployment row is not a uuid",
    ]);
    expect(fs.existsSync("/tmp/miroir-git679-pwn.json")).toBe(false);
  });

  it("refuses a repository holding a symbolic link, leaving no folder", async () => {
    const url = publish(server, "linked", (workTree) => {
      writeApp(workTree, ZETA);
      fs.symlinkSync("/", path.join(workTree, "assets", "appForTest_model", "root"));
    });
    expectGitError(await gitAction(context, "gitAction_clone", { url, folderName: `${CLONES}/linked` }), "symbolicLink");
    expect(fs.existsSync(cloneFolder("linked"))).toBe(false);
  });

  it("refuses a folder reached through a symbolic link out of the deployment root", async () => {
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), "miroir-git679-outside-"));
    workTrees.push(outside);
    fs.symlinkSync(outside, cloneFolder("escape"));
    expectGitError(
      await gitAction(context, "gitAction_clone", { url: singleUrl, folderName: `${CLONES}/escape/x` }),
      "outsideDeploymentRoot",
    );
    expect(fs.readdirSync(outside)).toEqual([]);
  });

  it("refuses to install an application Admin registers, even when its store is not open", async () => {
    const url = publish(server, "zeta", (workTree) => writeApp(workTree, ZETA));
    expectOk(await gitAction(context, "gitAction_clone", { url, folderName: `${CLONES}/zeta` }));
    const adminMap = { ...applicationDeploymentMap, [ADMIN_APPLICATION_UUID]: ADMIN_DEPLOYMENT_UUID };
    const createInstance = (actionType: "createInstance" | "deleteInstance") =>
      context.domainController.handleAction(
        {
          actionType,
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          payload: {
            application: ADMIN_APPLICATION_UUID,
            applicationSection: "data",
            objects: [
              {
                uuid: ZETA.application,
                parentUuid: "25d935e7-9e93-42c2-aade-0472b883492b",
                parentName: "AdminApplication",
                name: "registered elsewhere",
                defaultLabel: "registered elsewhere",
                selfApplication: ZETA.application,
              },
            ],
          },
        } as any,
        adminMap,
      );
    expectOk(await createInstance("createInstance"));
    try {
      expectGitError(
        await gitAction(context, "gitAction_installClonedDeployment", { folderName: `${CLONES}/zeta` }),
        "applicationAlreadyDeployed",
      );
    } finally {
      expectOk(await createInstance("deleteInstance"));
    }
  });

  it("skips a deployment whose data folder would be a file of the repository", async () => {
    const ETA: ClonedApp = {
      application: "679a0010-0001-4000-8000-0000000000f1",
      deployment: "679a0010-0002-4000-8000-0000000000f2",
      name: "cloneEta",
    };
    const url = publish(server, "broken", (workTree) => {
      writeApp(workTree, ETA, { emptyData: true });
      fs.writeFileSync(path.join(workTree, "assets", "appForTest_data"), "not a folder\n");
    });
    const error = expectGitError(
      await gitAction(context, "gitAction_clone", { url, folderName: `${CLONES}/broken` }),
      "noDeploymentFound",
    );
    expect(error.errorContext?.skipped).toEqual([
      {
        deploymentFile: `assets/deployment/${ETA.deployment}.json`,
        reason: "Sections that are not files of the repository: data",
      },
    ]);
  });

  it("refuses a URL that is not http(s) or that holds a token", async () => {
    expectGitError(
      await gitAction(context, "gitAction_clone", { url: "git@github.com:owner/repository.git", folderName: `${CLONES}/ssh` }),
      "unsupportedRemoteProtocol",
    );
    expectGitError(
      await gitAction(context, "gitAction_clone", {
        url: singleUrl.replace("http://", "http://user:token@"),
        folderName: `${CLONES}/token`,
      }),
      "invalidPayload",
    );
    expect(fs.existsSync(cloneFolder("ssh"))).toBe(false);
  });

  it("asks for a credential when the remote needs one, leaving no folder, then clones with it", async () => {
    authServer = await startGitHttpServer({ basicAuth: REMOTE_USER });
    const url = publish(authServer, "gamma", (workTree) => writeApp(workTree, GAMMA));
    const refused = await gitAction(context, "gitAction_clone", { url, folderName: `${CLONES}/private` });
    expect(refused instanceof Action2Error, JSON.stringify(refused)).toBe(true);
    expect((refused as Action2Error).errorType).toBe("ExternalServiceUnauthorized");
    expect((refused as Action2Error).errorContext).toMatchObject({ reason: "authenticationRequired", host: authServer.host });
    expect(fs.existsSync(cloneFolder("private"))).toBe(false);

    const result = expectOk<GitCloneResult>(
      await gitAction(context, "gitAction_clone", {
        url,
        folderName: `${CLONES}/private`,
        credential: { username: REMOTE_USER.username, token: REMOTE_USER.password },
      }),
    );
    expect(result.deployments.map((deployment) => deployment.selfApplication)).toEqual([GAMMA.application]);
    // the token is in no file of the clone
    const config = fs.readFileSync(path.join(cloneFolder("private"), ".git", "config"), "utf8");
    expect(config).not.toContain(REMOTE_USER.password);
    expect(config).toContain(url);
  });

  it("clones and installs through the runner Clone application from Git", async () => {
    const url = publish(server, "delta", (workTree) => writeApp(workTree, DELTA));
    const definition = runnerCloneApplicationFromGit.definition as { compositeActionSequence: CompositeActionTemplate };
    const result = await context.domainController.handleCompositeActionTemplate(
      definition.compositeActionSequence,
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
      { [runnerCloneApplicationFromGit.name]: { url, folderName: `${CLONES}/delta` } },
    );
    expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);
    expect(fs.existsSync(path.join(cloneFolder("delta"), "assets", "deployment", `${DELTA.deployment}.json`))).toBe(true);
    expect(cached(DELTA.deployment, FIXTURE_DATA_ENTITY).sort()).toEqual(fixtureInstances(FIXTURE_DATA_ENTITY));
  });

  it("refuses without the git capability, cloning nothing", async () => {
    setGitCapability(context, false);
    try {
      const refused = await gitAction(context, "gitAction_clone", { url: singleUrl, folderName: `${CLONES}/off` });
      expect(refused instanceof Action2Error, JSON.stringify(refused)).toBe(true);
      expect(fs.existsSync(cloneFolder("off"))).toBe(false);
    } finally {
      setGitCapability(context, true);
    }
  });
});
