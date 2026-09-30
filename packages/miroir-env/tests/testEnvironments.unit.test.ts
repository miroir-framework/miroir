// #321 Slice 4: a test environment gives the tests an emulated-server client configuration whose
// stores are all copies in .miroir/<environment>/, and a reseed brings them back to the package assets.
// vitest, not MiroirTest: seeding copies files on disk.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  environmentClientConfig,
  openTestEnvironment,
  resolveEnvironmentFromFiles,
  seedEnvironmentState,
  selectedTestEnvironment,
} from "../src/index";
import { repositoryRoot, temporaryRepository } from "./cliTestSupport";

const application = (name: string, selfApplication: string, deployment: string) => ({
  package: `miroir-app-${name}`,
  selfApplication,
  deployment,
  store: "filesystem",
  mode: "copy",
});
const testFilesystem = {
  server: { rootApiUrl: "https://localhost:3080" },
  applications: {
    miroir: application("miroir", "360fcf1f-f0d4-4f8a-9262-07886e70fa15", "10ff36f2-50a3-48d8-b80f-e48e5d13af8e"),
    admin: application("admin", "55af124e-8c05-4bae-a3ef-0933d41daa92", "18db21bf-f8d3-4f6a-8296-84b69f6dc48b"),
  },
};

describe("test environments", () => {
  it("the tracked test-filesystem environment gives a client configuration with every store in .miroir/test-filesystem", () => {
    const resolved = resolveEnvironmentFromFiles({ cwd: repositoryRoot, env: { MIROIR_ENV: "test-filesystem" } });
    const config = environmentClientConfig(resolved);

    expect(config.miroirConfigType).toBe("client");
    expect(config.client).toMatchObject({
      emulateServer: true,
      rootApiUrl: "https://localhost:3080",
      filesystemDeploymentRootDirectory: repositoryRoot,
    });
    const storage = (config.client as { deploymentStorageConfig: Record<string, Record<string, { directory: string }>> })
      .deploymentStorageConfig;
    expect(Object.keys(storage).sort()).toEqual(resolved.deployments.map((d) => d.deployment).sort());
    for (const sections of Object.values(storage)) {
      for (const section of Object.values(sections)) {
        expect(section.directory.startsWith(".miroir/test-filesystem/")).toBe(true);
      }
    }
  });

  it("a reseed wipes what a run wrote and copies the package assets again", () => {
    const root = temporaryRepository({ "test-filesystem": testFilesystem });
    const userRow = "packages/miroir-app-admin/assets/admin_data/d20d09e5-0685-4fc7-b9bd-fcfa3845127a/u.json";
    mkdirSync(path.dirname(path.join(root, userRow)), { recursive: true });
    writeFileSync(path.join(root, userRow), "{}");
    const resolved = resolveEnvironmentFromFiles({ cwd: root, env: { MIROIR_ENV: "test-filesystem" } });

    expect(seedEnvironmentState(resolved, { reseed: true }).seeded).toContain("admin/data");
    const written = path.join(root, ".miroir/test-filesystem/admin/data/runtime.json");
    writeFileSync(written, "{}");
    seedEnvironmentState(resolved, { reseed: true });

    expect(existsSync(written)).toBe(false);
    expect(existsSync(path.join(root, ".miroir/test-filesystem/admin/data/d20d09e5-0685-4fc7-b9bd-fcfa3845127a/u.json"))).toBe(
      true,
    );
  });

  // #345: the helper every package's tests share
  it("openTestEnvironment with reseed also wipes the stores of applications installed at runtime", () => {
    const root = temporaryRepository({ "test-filesystem": testFilesystem });
    const installed = path.join(root, ".miroir/test-filesystem/apps/pingapp_data/x.json");
    mkdirSync(path.dirname(installed), { recursive: true });
    writeFileSync(installed, "{}");

    const environment = openTestEnvironment("test-filesystem", { cwd: root, reseed: true });

    expect(existsSync(installed)).toBe(false);
    expect(environment.seed?.seeded).toContain("admin/data");
    expect(environment.miroirConfig.client).toMatchObject({ emulateServer: true, filesystemDeploymentRootDirectory: root });
  });

  it("openTestEnvironment refuses an environment that is not a test environment", () => {
    expect(() => openTestEnvironment("dev", { cwd: repositoryRoot })).toThrow(/not a test environment/);
  });

  it("selectedTestEnvironment ignores a MIROIR_ENV that is not test-*, with a warning", () => {
    const warnings: string[] = [];
    expect(selectedTestEnvironment({ MIROIR_ENV: "dev" }, (w) => warnings.push(w))).toBeUndefined();
    expect(warnings).toHaveLength(1);
    expect(selectedTestEnvironment({ MIROIR_ENV: "test-sql" })).toBe("test-sql");
  });

  it("an environment without server.rootApiUrl cannot emulate a server", () => {
    const root = temporaryRepository({ "test-filesystem": { ...testFilesystem, server: undefined } });
    const resolved = resolveEnvironmentFromFiles({ cwd: root, env: { MIROIR_ENV: "test-filesystem" } });

    expect(() => environmentClientConfig(resolved)).toThrow('environment "test-filesystem" has no server.rootApiUrl');
  });
});
