// #321 Slice 6: `miroir-env check`, `import` and `prune` on the environment state a server start
// leaves in .miroir/<environment>/ (analysis D14, D15). check reports what the next start does
// (missing and differing rows: info) and what it cannot settle (deployments absent from the
// definition: warning, error under --strict or CI); import records those deployments in
// environments/local.json; prune removes them with their stores in the environment state.
// vitest, not MiroirTest: CLI commands on real filesystem Admin stores in a temporary checkout.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import {
  ConfigurationService,
  ENTITY_ADMIN_APPLICATION_UUID,
  ENTITY_DEPLOYMENT_UUID,
  miroirCoreStartup,
} from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";

import { boot, contentHashes, readRows, temporaryCheckout } from "./bootTestSupport";
import { repositoryRoot, run, temporaryRepository } from "./cliTestSupport";

const LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
const DESIGNER_DEPLOYMENT = "f0359240-e849-4546-8158-75f4a8ae5831";

type Install = { name: string; selfApplication: string; deployment: string; configuration: Record<string, unknown> };

function filesystem(directory: string) {
  return { emulatedServerType: "filesystem", directory };
}

/** Admin rows and stores of an application installed from the UI, as a Runner writes them. */
function installFromUi(root: string, environment: string, install: Install): void {
  const adminData = path.join(root, ".miroir", environment, "admin/data");
  mkdirSync(path.join(adminData, ENTITY_ADMIN_APPLICATION_UUID), { recursive: true });
  writeFileSync(
    path.join(adminData, ENTITY_ADMIN_APPLICATION_UUID, `${install.selfApplication}.json`),
    JSON.stringify({
      uuid: install.selfApplication,
      parentName: "AdminApplication",
      parentUuid: ENTITY_ADMIN_APPLICATION_UUID,
      name: install.name,
      defaultLabel: `The ${install.name} Application.`,
      selfApplication: install.selfApplication,
    }),
  );
  writeFileSync(
    path.join(adminData, ENTITY_DEPLOYMENT_UUID, `${install.deployment}.json`),
    JSON.stringify({
      uuid: install.deployment,
      parentName: "Deployment",
      parentUuid: ENTITY_DEPLOYMENT_UUID,
      name: `Deployment of application ${install.name}`,
      selfApplication: install.selfApplication,
      configuration: install.configuration,
    }),
  );
  for (const [section, store] of Object.entries(install.configuration) as [string, { directory: string }][]) {
    if (section !== "admin") {
      mkdirSync(path.join(root, store.directory), { recursive: true });
      writeFileSync(path.join(root, store.directory, "marker.json"), "{}");
    }
  }
}

const SPOTIFY: Install = {
  name: "Spotify",
  selfApplication: "3f0e7b1c-6d2a-4c11-9a3e-321000000001",
  deployment: "3f0e7b1c-6d2a-4c11-9a3e-321000000002",
  configuration: {
    admin: filesystem(".miroir/dev/apps/spotify"),
    model: filesystem(".miroir/dev/apps/spotify/model"),
    data: filesystem(".miroir/dev/apps/spotify/data"),
  },
};

const SCRATCH: Install = {
  name: "Scratch",
  selfApplication: "3f0e7b1c-6d2a-4c11-9a3e-321000000003",
  deployment: "3f0e7b1c-6d2a-4c11-9a3e-321000000004",
  configuration: {
    admin: filesystem(".miroir/local/apps/scratch"),
    model: filesystem(".miroir/local/apps/scratch/model"),
    data: filesystem("outside/scratch_data"),
  },
};

const LEGACY_SELF_APPLICATION = "3f0e7b1c-6d2a-4c11-9a3e-321000000005";
const LEGACY_DEPLOYMENT = "3f0e7b1c-6d2a-4c11-9a3e-321000000006";

describe("miroir-env check validates every definition", () => {
  it("exits 1 naming the definition that does not resolve, even when another one is selected", async () => {
    const dev = JSON.parse(readFileSync(path.join(repositoryRoot, "environments/dev.json"), "utf-8"));
    const root = temporaryRepository({ dev, "test-live": { extends: "dev" } });
    const result = await run(["check"], root);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("environment dev, selected by default");
    expect(result.stdout).toContain("definitions: dev valid");
    expect(result.stdout).toContain(
      'error: environment "test-live": application "miroir", section "admin" is live; test environments use copy only',
    );
  });
});

describe("miroir-env check, import and prune on the state of a server start", () => {
  let root: string;
  let adminData: (environment: string) => string;

  beforeAll(async () => {
    miroirCoreStartup();
    miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
    root = temporaryCheckout();
    adminData = (environment) => path.join(root, ".miroir", environment, "admin/data");
    await boot(root);
  }, 120000);

  it("check finds the state of a server start in line with the definition, also under --strict", async () => {
    const result = await run(["check", "--strict"], root);
    expect(result.stdout).not.toMatch(/^(warning|error):/m);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("definitions: dev valid");
    expect(result.stdout).toContain("state .miroir/dev: last started with the current definition");
  });

  it("show reports a definition changed since the last start (env.lock.json)", async () => {
    const lock = JSON.parse(readFileSync(path.join(root, ".miroir/dev/env.lock.json"), "utf-8"));
    expect(lock).toMatchObject({ environment: "dev", files: ["environments/dev.json"] });
    expect(lock.deployments[LIBRARY_DEPLOYMENT]).toMatchObject({ applicationKey: "library" });

    const devFile = path.join(root, "environments/dev.json");
    const definition = readFileSync(devFile, "utf-8");
    const dev = JSON.parse(definition);
    delete dev.applications.designer;
    dev.applications.library.sections = { data: { mode: "copy" } };
    writeFileSync(devFile, JSON.stringify(dev));
    try {
      const result = await run(["show"], root);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(
        "state .miroir/dev: last started with another definition (designer removed, library changed); the next start reconciles it",
      );
    } finally {
      writeFileSync(devFile, definition);
    }
  });

  it("check reports a missing and a differing Deployment row as info and changes nothing (D15 cases 1, 2)", async () => {
    rmSync(path.join(adminData("dev"), ENTITY_DEPLOYMENT_UUID, `${LIBRARY_DEPLOYMENT}.json`));
    const designerFile = path.join(adminData("dev"), ENTITY_DEPLOYMENT_UUID, `${DESIGNER_DEPLOYMENT}.json`);
    const designer = JSON.parse(readFileSync(designerFile, "utf-8"));
    designer.configuration.data.directory = ".miroir/dev/elsewhere";
    writeFileSync(designerFile, JSON.stringify(designer));
    const state = contentHashes(path.join(root, ".miroir/dev"));

    const result = await run(["check", "--strict"], root);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(
      `info: Deployment ${LIBRARY_DEPLOYMENT} (Library_dev) is missing from the Admin data: the next start creates it from the definition`,
    );
    expect(result.stdout).toContain(
      `info: Deployment ${DESIGNER_DEPLOYMENT} (Designer_dev) differs from the definition: the next start rewrites it`,
    );
    expect(contentHashes(path.join(root, ".miroir/dev"))).toEqual(state);

    const next = await boot(root);
    expect(next.reconciliation.changes).toEqual([
      `created Deployment ${LIBRARY_DEPLOYMENT} (Library_dev) from the definition`,
      `rewrote Deployment ${DESIGNER_DEPLOYMENT} (Designer_dev) from the definition`,
    ]);
    expect((await run(["check", "--strict"], root)).stdout).not.toContain("info: Deployment");
  }, 120000);

  it("check warns about a deployment the definition does not install, an error under --strict or CI (D15 case 3)", async () => {
    installFromUi(root, "dev", SPOTIFY);
    const warning = `deployment ${SPOTIFY.deployment} (Spotify) is in the Admin data of environment "dev" but not in its definition: it is opened anyway; record it with "miroir-env import" or remove it with "miroir-env prune"`;

    const result = await run(["check"], root);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(`warning: ${warning}`);

    const strict = await run(["check", "--strict"], root);
    expect(strict.exitCode).toBe(1);
    expect(strict.stdout).toContain(`error: ${warning}`);

    expect((await run(["check"], root, { CI: "true" })).exitCode).toBe(1);
  });

  it("import records the extra deployment in a new environments/local.json and moves the state along", async () => {
    const devState = contentHashes(path.join(root, ".miroir/dev"));

    const result = await run(["import"], root);
    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("environments/local.json: created, extends dev");
    expect(result.stdout).toContain(`spotify: deployment ${SPOTIFY.deployment}`);

    expect(JSON.parse(readFileSync(path.join(root, "environments/local.json"), "utf-8"))).toEqual({
      extends: "dev",
      applications: {
        spotify: {
          selfApplication: SPOTIFY.selfApplication,
          deployment: SPOTIFY.deployment,
          configuration: {
            admin: filesystem(".miroir/local/apps/spotify"),
            model: filesystem(".miroir/local/apps/spotify/model"),
            data: filesystem(".miroir/local/apps/spotify/data"),
          },
        },
      },
    });
    expect(existsSync(path.join(root, ".miroir/local/apps/spotify/model/marker.json"))).toBe(true);
    expect(existsSync(path.join(root, ".miroir/local/env.lock.json"))).toBe(false);
    expect(contentHashes(path.join(root, ".miroir/dev"))).toEqual(devState);

    // the rows copied from .miroir/dev are rewritten at the next start (info), nothing is left to decide
    const check = await run(["check", "--strict"], root);
    expect(check.stdout).toContain("environment local, selected by environments/local.json");
    expect(check.stdout).not.toMatch(/^(warning|error):/m);
    expect(check.exitCode).toBe(0);
  });

  it("prune removes extra deployments with their stores in the environment state, and nothing else", async () => {
    installFromUi(root, "local", SCRATCH);
    const extraFiles = [
      path.join(adminData("local"), ENTITY_DEPLOYMENT_UUID, `${SCRATCH.deployment}.json`),
      path.join(adminData("local"), ENTITY_ADMIN_APPLICATION_UUID, `${SCRATCH.selfApplication}.json`),
      path.join(root, ".miroir/local/apps/scratch/model/marker.json"),
    ];

    const dryRun = await run(["prune", "--dry-run"], root);
    expect(dryRun.exitCode).toBe(0);
    expect(dryRun.stdout).toContain(`would remove Deployment ${SCRATCH.deployment} (Scratch)`);
    expect(extraFiles.every((file) => existsSync(file))).toBe(true);

    const result = await run(["prune"], root);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(`removed Deployment ${SCRATCH.deployment} (Scratch)`);
    expect(result.stdout).toContain(`removed AdminApplication ${SCRATCH.selfApplication} (Scratch)`);
    expect(result.stdout).toContain("removed .miroir/local/apps/scratch");
    expect(result.stdout).toContain("left in place: outside/scratch_data (outside .miroir/local)");
    expect(extraFiles.some((file) => existsSync(file))).toBe(false);
    expect(existsSync(path.join(root, "outside/scratch_data/marker.json"))).toBe(true);
    expect(existsSync(path.join(root, ".miroir/local/apps/spotify/model/marker.json"))).toBe(true);
    expect(readRows(path.join(adminData("local"), ENTITY_DEPLOYMENT_UUID))[SPOTIFY.deployment]).toBeDefined();

    expect((await run(["check", "--strict"], root)).exitCode).toBe(0);
  });

  it("check flags a legacy deployment of the package Admin data, which import records in its short form (D14)", async () => {
    const legacyAssets = path.join(root, "packages/miroir-example-legacy/assets");
    mkdirSync(path.join(legacyAssets, "legacy_model"), { recursive: true });
    mkdirSync(path.join(legacyAssets, "legacy_data"), { recursive: true });
    // before #321, Admin data rows were written into the package, with paths relative to packages/
    writeFileSync(
      path.join(root, "packages/miroir-app-admin/assets/admin_data", ENTITY_DEPLOYMENT_UUID, `${LEGACY_DEPLOYMENT}.json`),
      JSON.stringify({
        uuid: LEGACY_DEPLOYMENT,
        parentName: "Deployment",
        parentUuid: ENTITY_DEPLOYMENT_UUID,
        name: "LegacyApplicationFilesystemDeployment",
        selfApplication: LEGACY_SELF_APPLICATION,
        configuration: {
          admin: filesystem("miroir-example-legacy/assets"),
          model: filesystem("miroir-example-legacy/assets/legacy_model"),
          data: filesystem("miroir-example-legacy/assets/legacy_data"),
        },
      }),
    );

    const check = await run(["check"], root);
    expect(check.exitCode).toBe(0);
    expect(check.stdout).toContain(
      `warning: deployment ${LEGACY_DEPLOYMENT} (LegacyApplicationFilesystemDeployment) of packages/miroir-app-admin/assets/admin_data is no longer opened: Admin data lives in the environment state; record it with "miroir-env import"`,
    );
    expect((await run(["check", "--strict"], root)).exitCode).toBe(1);

    const result = await run(["import"], root);
    expect(result.exitCode).toBe(0);
    const local = JSON.parse(readFileSync(path.join(root, "environments/local.json"), "utf-8"));
    expect(Object.keys(local.applications).sort()).toEqual(["legacy", "spotify"]);
    expect(local.applications.legacy).toEqual({
      package: "miroir-example-legacy",
      selfApplication: LEGACY_SELF_APPLICATION,
      deployment: LEGACY_DEPLOYMENT,
      store: "filesystem",
      mode: "live",
    });

    expect((await run(["check", "--strict"], root)).exitCode).toBe(0);
    expect((await run(["show"], root)).stdout).toContain("packages/miroir-example-legacy/assets/legacy_model");
  });

  it("check --tracked-clean fails when a run changed an asset file under git", async () => {
    const git = (...args: string[]) =>
      execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], { cwd: root, stdio: "pipe" });
    git("init", "-q");
    git("add", "packages", "environments/dev.json");
    git("commit", "-qm", "checkout");

    const clean = await run(["check", "--tracked-clean"], root);
    expect(clean.exitCode).toBe(0);
    expect(clean.stdout).toContain("tracked assets: clean");

    const written = "packages/miroir-example-library/assets/library_data/written-by-a-run.json";
    writeFileSync(path.join(root, written), "{}");
    const dirty = await run(["check", "--tracked-clean"], root);
    expect(dirty.exitCode).toBe(1);
    expect(dirty.stdout).toContain(`error: asset file changed: ${written}`);
  });
});
