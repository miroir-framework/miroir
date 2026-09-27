// #321 Slice 8: the realServer-* profiles select the test environment of their storage, like the
// emulated ones, with a client that calls a running miroir-server: the stores a test opens on that
// server are the copies of the test environment, never the tracked Admin data of a profile file.
// vitest, not MiroirTest: test-launcher wiring that reads files and environment variables.
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { MiroirConfigForRestClient } from "miroir-core";

import { loadTestConfigFiles } from "../utils/fileTools.js";
import { applyIntegrationTestProfile, INTEGRATION_TEST_PROFILES } from "./integrationTestProfiles.js";

const ENV_KEYS = [
  "MIROIR_ENV",
  "MIROIR_TEST_CLIENT",
  "VITE_MIROIR_TEST_CONFIG_FILENAME",
  "VITE_MIROIR_LOG_CONFIG_FILENAME",
  "MIROIR_TEST_APP_STORE_TYPE",
  "MIROIR_TEST_ADMIN_STORE_TYPE",
  "MIROIR_TEST_POSTGRES_HOST",
  "MIROIR_TEST_ADMIN_SQL_SCHEMA",
  "CI",
] as const;
const ADMIN_DEPLOYMENT = "18db21bf-f8d3-4f6a-8296-84b69f6dc48b";
const LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";

describe("realServer profiles run on a test environment", () => {
  const savedEnv: Record<string, string | undefined> = {};
  beforeEach(() => {
    for (const key of ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  });
  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
  });

  it("realServer-<storage> selects test-<storage> and a client that calls the server; an emulated profile sets it back", () => {
    for (const storage of ["sql", "filesystem", "indexedDb", "mongodb"]) {
      const profile = applyIntegrationTestProfile(`realServer-${storage}`, { respectExistingEnv: false });
      expect(profile?.environment).toBe(`test-${storage}`);
      expect(process.env.MIROIR_ENV).toBe(`test-${storage}`);
      expect(process.env.MIROIR_TEST_CLIENT).toBe("realServer");
      expect(process.env.VITE_MIROIR_TEST_CONFIG_FILENAME).toBeUndefined();
    }
    applyIntegrationTestProfile("emulatedServer-filesystem", { respectExistingEnv: false });
    expect(process.env.MIROIR_TEST_CLIENT).toBe("emulatedServer");
    expect(Object.values(INTEGRATION_TEST_PROFILES).every((profile) => profile.environment?.startsWith("test-"))).toBe(
      true,
    );
  });

  it("MIROIR_TEST_CLIENT=realServer: the test calls the server with the stores of the test environment", async () => {
    const { miroirConfig } = await loadTestConfigFiles({ MIROIR_ENV: "test-filesystem", MIROIR_TEST_CLIENT: "realServer" });
    const client = miroirConfig.client as MiroirConfigForRestClient;

    expect(client.emulateServer).toBe(false);
    expect(client.serverConfig.rootApiUrl).toBe("https://localhost:3080");
    expect(miroirConfig.environment).toEqual({ name: "test-filesystem", appsDirectory: ".miroir/test-filesystem/apps" });
    expect(client.serverConfig.storeSectionConfiguration[ADMIN_DEPLOYMENT].data).toEqual({
      emulatedServerType: "filesystem",
      directory: ".miroir/test-filesystem/admin/data",
    });
    for (const configuration of Object.values(client.serverConfig.storeSectionConfiguration)) {
      for (const section of Object.values(configuration)) {
        expect((section as { directory: string }).directory).toMatch(/^\.miroir\/test-filesystem\//);
      }
    }
  });

  it("the server a Node test calls gets the database password of the environment", async () => {
    const { miroirConfig } = await loadTestConfigFiles({
      MIROIR_ENV: "test-sql",
      MIROIR_TEST_CLIENT: "realServer",
      MIROIR_POSTGRES_PASSWORD: "pw",
    });
    const client = miroirConfig.client as MiroirConfigForRestClient;
    const library = client.serverConfig.storeSectionConfiguration[LIBRARY_DEPLOYMENT].data as {
      connectionString: string;
      schema: string;
    };
    expect(library.connectionString).toBe("postgres://postgres:pw@localhost:5432/postgres");
    expect(library.schema).toBe("test_sql_library");
  });
});
