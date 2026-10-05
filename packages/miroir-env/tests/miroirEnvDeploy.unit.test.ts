// `miroir-env deploy <app>`: deploys an example application of the monorepo (packages/
// miroir-example-<app>) into the Admin data of an environment state: an AdminApplication row and
// a Deployment row opening the package assets live; nothing when it is already deployed.
// vitest, not MiroirTest: a CLI command on filesystem Admin data in a temporary checkout.
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";

import { ENTITY_ADMIN_APPLICATION_UUID, ENTITY_DEPLOYMENT_UUID } from "miroir-core";

import { repositoryRoot, run } from "./cliTestSupport";

const GITHUB_APPLICATION = "6c4edcb2-e165-407a-b728-fbf8a18b6bf7";
const GITHUB_DEPLOYMENT = "752c2412-a2cc-4632-94f3-937168969998";
const EXAMPLES = ["miroir-example-github", "miroir-example-library", "miroir-example-postgres"];

/** A checkout with environments/dev.json, a few example packages' assets and empty dev Admin data. */
function checkout(): string {
  const root = mkdtempSync(path.join(tmpdir(), "miroir-env-deploy-"));
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ name: "r", workspaces: ["packages/*"] }));
  cpSync(path.join(repositoryRoot, "environments/dev.json"), path.join(root, "environments/dev.json"));
  for (const name of EXAMPLES) {
    cpSync(path.join(repositoryRoot, "packages", name, "assets"), path.join(root, "packages", name, "assets"), { recursive: true });
  }
  mkdirSync(path.join(root, ".miroir/dev/admin/data"), { recursive: true });
  return root;
}

const readJson = (file: string) => JSON.parse(readFileSync(file, "utf-8"));
const adminData = (root: string, ...parts: string[]) => path.join(root, ".miroir/dev/admin/data", ...parts);

describe("miroir-env deploy", () => {
  let root: string;
  beforeEach(() => {
    root = checkout();
  });

  it("writes the AdminApplication and Deployment rows of the example application", async () => {
    const result = await run(["deploy", "miroir-example-github"], root);

    expect(result.exitCode).toBe(0);
    const application = readJson(adminData(root, ENTITY_ADMIN_APPLICATION_UUID, `${GITHUB_APPLICATION}.json`));
    expect(application).toMatchObject({ parentName: "AdminApplication", name: "GitHub", selfApplication: GITHUB_APPLICATION });
    const deployment = readJson(adminData(root, ENTITY_DEPLOYMENT_UUID, `${GITHUB_DEPLOYMENT}.json`));
    expect(deployment).toMatchObject({ parentName: "Deployment", name: "GitHub_dev", selfApplication: GITHUB_APPLICATION });
    expect(deployment.configuration).toEqual({
      admin: { emulatedServerType: "filesystem", directory: "packages/miroir-example-github/assets" },
      model: { emulatedServerType: "filesystem", directory: "packages/miroir-example-github/assets/github_model" },
      data: { emulatedServerType: "filesystem", directory: "packages/miroir-example-github/assets/github_data" },
    });
  });

  it("accepts the short name and is then seen by check as a deployment the definition does not install", async () => {
    expect((await run(["deploy", "github"], root)).exitCode).toBe(0);

    const check = await run(["check"], root);
    expect(check.stdout).toContain(`warning: deployment ${GITHUB_DEPLOYMENT} (GitHub) is in the Admin data of environment "dev" but not in its definition`);
  });

  it("does nothing when the application is already deployed", async () => {
    await run(["deploy", "github"], root);
    const file = adminData(root, ENTITY_DEPLOYMENT_UUID, `${GITHUB_DEPLOYMENT}.json`);
    const before = readFileSync(file, "utf-8");

    const result = await run(["deploy", "github"], root);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(
      `GitHub (miroir-example-github) is already deployed in .miroir/dev/admin/data: deployment ${GITHUB_DEPLOYMENT} (GitHub_dev). Nothing to do.\n`,
    );
    expect(readFileSync(file, "utf-8")).toBe(before);
  });

  it("does nothing when another deployment of the application exists", async () => {
    const other = { uuid: "3f0e7b1c-6d2a-4c11-9a3e-000000000001", name: "GitHub elsewhere", selfApplication: GITHUB_APPLICATION };
    mkdirSync(adminData(root, ENTITY_DEPLOYMENT_UUID));
    writeFileSync(adminData(root, ENTITY_DEPLOYMENT_UUID, `${other.uuid}.json`), JSON.stringify(other));

    const result = await run(["deploy", "github"], root);

    expect(result.stdout).toContain(`already deployed in .miroir/dev/admin/data: deployment ${other.uuid} (GitHub elsewhere)`);
    expect(existsSync(adminData(root, ENTITY_DEPLOYMENT_UUID, `${GITHUB_DEPLOYMENT}.json`))).toBe(false);
  });

  it("writes nothing with --dry-run", async () => {
    const result = await run(["deploy", "github", "--dry-run"], root);

    expect(result.stdout).toContain(`would write Deployment ${GITHUB_DEPLOYMENT} (GitHub_dev)`);
    expect(readdirSync(adminData(root))).toEqual([]);
  });

  it("writes into the state directory given by --state", async () => {
    mkdirSync(path.join(root, "elsewhere/admin/data"), { recursive: true });

    await run(["deploy", "github", "--state", "elsewhere"], root);

    const deployment = readJson(path.join(root, "elsewhere/admin/data", ENTITY_DEPLOYMENT_UUID, `${GITHUB_DEPLOYMENT}.json`));
    expect(deployment.name).toBe("GitHub_elsewhere");
  });

  it("deploys the modelVersion section when the package has one", async () => {
    await run(["deploy", "postgres"], root);

    const [file] = readdirSync(adminData(root, ENTITY_DEPLOYMENT_UUID));
    expect(readJson(adminData(root, ENTITY_DEPLOYMENT_UUID, file)).configuration.modelVersion).toEqual({
      emulatedServerType: "filesystem",
      directory: "packages/miroir-example-postgres/assets/postgres_modelVersion",
    });
  });

  it("names the known examples for an unknown application", async () => {
    const result = await run(["deploy", "nope"], root);

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain(`no example application "miroir-example-nope"`);
    expect(result.stderr).toContain("known: miroir-example-github, miroir-example-library, miroir-example-postgres");
  });

  it("asks for the state to exist", async () => {
    const result = await run(["deploy", "github", "--state", "absent"], root);

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("absent/admin/data not found");
  });

  it("prints the usage without an application", async () => {
    const result = await run(["deploy"], root);

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("deploy <app>");
  });
});
