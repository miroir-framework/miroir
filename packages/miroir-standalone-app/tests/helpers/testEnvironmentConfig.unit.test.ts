// #321 Slice 4: tests take their store configuration from the test environment named by MIROIR_ENV
// (set by --profile emulatedServer-filesystem): every section is a copy in .miroir/<environment>/,
// seeded from the package assets, so no test writes into tracked files.
// vitest, not MiroirTest: this is test-launcher wiring that reads files and environment variables.
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import type { MiroirConfigForClientStub } from "miroir-core";

import { loadTestConfigFiles } from "../utils/fileTools.js";
import { resolveRepoRoot } from "./integrationTestProfiles.js";

const ENTITY_DEPLOYMENT = "7959d814-400c-4e80-988f-a00fe582ab98";
const ENTITY_MIROIR_USER = "d20d09e5-0685-4fc7-b9bd-fcfa3845127a";

describe("test configuration from a test environment", () => {
  it("MIROIR_ENV=test-filesystem puts every store in .miroir/test-filesystem, seeded from the packages", async () => {
    const { miroirConfig } = await loadTestConfigFiles({ MIROIR_ENV: "test-filesystem" });
    const client = miroirConfig.client as MiroirConfigForClientStub;

    expect(client.emulateServer).toBe(true);
    expect(client.filesystemDeploymentRootDirectory).toBe(resolveRepoRoot());
    expect(Object.keys(client.deploymentStorageConfig).sort()).toEqual([
      "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
      "18db21bf-f8d3-4f6a-8296-84b69f6dc48b",
      "eef01001-0002-4000-8000-000000000002",
      "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
      "fd47d115-67e2-4870-8339-1c26665d1d15",
    ]);
    for (const configuration of Object.values(client.deploymentStorageConfig)) {
      for (const section of Object.values(configuration)) {
        expect((section as { directory: string }).directory).toMatch(/^\.miroir\/test-filesystem\//);
      }
    }

    const adminData = path.join(resolveRepoRoot(), ".miroir/test-filesystem/admin/data");
    expect(readdirSync(path.join(adminData, ENTITY_MIROIR_USER)).length).toBeGreaterThan(0);
    expect(existsSync(path.join(adminData, ENTITY_DEPLOYMENT))).toBe(true);
    expect(readdirSync(path.join(adminData, ENTITY_DEPLOYMENT))).toEqual([]);
  });

  it("a MIROIR_ENV that is not a test environment selects nothing: tests never run on dev or local", async () => {
    await expect(loadTestConfigFiles({ MIROIR_ENV: "dev" })).rejects.toThrow(/no test environment selected/);
  });

  it("without a test environment the run fails, saying how to select one; a configuration file selects nothing", async () => {
    await expect(loadTestConfigFiles({})).rejects.toThrow(/--profile .*MIROIR_ENV=test-filesystem/);
    await expect(
      loadTestConfigFiles({ VITE_MIROIR_TEST_CONFIG_FILENAME: "packages/miroir-standalone-app/tests/some-config.json" }),
    ).rejects.toThrow(/no test environment selected/);
  });
});
