import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  prepareTestByFileLaunch,
  stripProfileArgs,
} from "../../scripts/testByFileLauncher.js";

const ENV_KEYS = [
  "VITE_MIROIR_TEST_CONFIG_FILENAME",
  "VITE_MIROIR_LOG_CONFIG_FILENAME",
  "VITE_TEST_MODE",
  "MIROIR_TEST_STORAGE",
] as const;

describe("testByFileLauncher profile (Gap D5)", () => {
  const savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

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

  it("stripProfileArgs removes --profile / --storage and values from argv", () => {
    expect(
      stripProfileArgs([
        "--profile",
        "emulatedServer-sql",
        "PersistenceStoreController.integ",
      ]),
    ).toEqual(["PersistenceStoreController.integ"]);
    expect(stripProfileArgs(["-p", "emulatedServer-filesystem", "--bail=1"])).toEqual(["--bail=1"]);
    expect(
      stripProfileArgs([
        "--storage",
        "sql",
        "uiIntegrationTestLauncher.realServer.integ",
      ]),
    ).toEqual(["uiIntegrationTestLauncher.realServer.integ"]);
    expect(stripProfileArgs(["-S", "mongodb", "--bail=1"])).toEqual(["--bail=1"]);
  });

  it("--profile emulatedServer-sql sets VITE_* on spawn env", () => {
    const { vitestArgs, spawnEnv } = prepareTestByFileLaunch(process.env, [
      "--profile",
      "emulatedServer-sql",
      "PersistenceStoreController.integ",
    ]);

    expect(vitestArgs).toEqual(["PersistenceStoreController.integ"]);
    expect(spawnEnv.VITE_TEST_MODE).toBe("true");
    expect(spawnEnv.VITE_MIROIR_TEST_CONFIG_FILENAME).toContain(
      "miroirConfig.test-emulatedServer-sql.json",
    );
    expect(spawnEnv.VITE_MIROIR_LOG_CONFIG_FILENAME).toContain("specificLoggersConfig");
  });

  it("--storage sql applies realServer-sql profile and sets MIROIR_TEST_STORAGE", () => {
    const { vitestArgs, spawnEnv } = prepareTestByFileLaunch(process.env, [
      "--storage",
      "sql",
      "uiIntegrationTestLauncher.realServer.integ",
    ]);

    expect(vitestArgs).toEqual(["uiIntegrationTestLauncher.realServer.integ"]);
    expect(spawnEnv.MIROIR_TEST_STORAGE).toBe("sql");
    expect(spawnEnv.VITE_MIROIR_TEST_CONFIG_FILENAME).toContain(
      "miroirConfig.test-realServer-sql.json",
    );
  });

  it("--profile realServer-filesystem sets MIROIR_TEST_STORAGE from profile name", () => {
    const { spawnEnv } = prepareTestByFileLaunch(process.env, [
      "--profile",
      "realServer-filesystem",
      "uiIntegrationTestLauncher.realServer.integ",
    ]);

    expect(spawnEnv.MIROIR_TEST_STORAGE).toBe("filesystem");
    expect(spawnEnv.VITE_MIROIR_TEST_CONFIG_FILENAME).toContain(
      "miroirConfig.test-realServer-filesystem.json",
    );
  });

  it("--profile wins over --storage", () => {
    const { spawnEnv } = prepareTestByFileLaunch(process.env, [
      "--storage",
      "mongodb",
      "--profile",
      "realServer-sql",
      "uiIntegrationTestLauncher.realServer.integ",
    ]);

    expect(spawnEnv.MIROIR_TEST_STORAGE).toBe("sql");
    expect(spawnEnv.VITE_MIROIR_TEST_CONFIG_FILENAME).toContain(
      "miroirConfig.test-realServer-sql.json",
    );
  });

  it("without profile does not set VITE_MIROIR_*", () => {
    const { spawnEnv } = prepareTestByFileLaunch(process.env, [
      "PersistenceStoreController.integ",
    ]);

    expect(spawnEnv.VITE_TEST_MODE).toBe("true");
    expect(spawnEnv.VITE_MIROIR_TEST_CONFIG_FILENAME).toBeUndefined();
  });

  it("respectExistingEnv: pre-set VITE_MIROIR_TEST_CONFIG_FILENAME is kept", () => {
    process.env.VITE_MIROIR_TEST_CONFIG_FILENAME = "/custom/config.json";

    const { spawnEnv } = prepareTestByFileLaunch(process.env, [
      "--profile",
      "emulatedServer-sql",
      "PersistenceStoreController.integ",
    ]);

    expect(spawnEnv.VITE_MIROIR_TEST_CONFIG_FILENAME).toBe("/custom/config.json");
  });
});
