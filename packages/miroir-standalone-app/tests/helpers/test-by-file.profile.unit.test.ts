import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  buildTestByFileVitestArgs,
  prepareTestByFileLaunch,
  stripProfileArgs,
} from "../../scripts/testByFileLauncher.js";

const ENV_KEYS = [
  "VITE_MIROIR_TEST_CONFIG_FILENAME",
  "VITE_MIROIR_LOG_CONFIG_FILENAME",
  "VITE_TEST_MODE",
  "MIROIR_TEST_STORAGE",
  "MIROIR_TEST_PROFILE",
  "MIROIR_ENV",
  "MIROIR_TEST_CLIENT",
  "CI",
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

  it("--profile emulatedServer-sql sets MIROIR_ENV and VITE_MIROIR_LOG_CONFIG_FILENAME on spawn env", () => {
    const { vitestArgs, spawnEnv } = prepareTestByFileLaunch(process.env, [
      "--profile",
      "emulatedServer-sql",
      "PersistenceStoreController.integ",
    ]);

    expect(vitestArgs).toEqual(["PersistenceStoreController.integ"]);
    expect(spawnEnv.VITE_TEST_MODE).toBe("true");
    expect(spawnEnv.MIROIR_AUTH_ENABLED).toBe("0");
    expect(spawnEnv.MIROIR_ENV).toBe("test-sql");
    expect(spawnEnv.VITE_MIROIR_TEST_CONFIG_FILENAME).toBeUndefined();
    expect(spawnEnv.VITE_MIROIR_LOG_CONFIG_FILENAME).toContain("config/logging");
  });

  it("--storage sql applies realServer-sql profile and sets MIROIR_TEST_STORAGE", () => {
    const { vitestArgs, spawnEnv } = prepareTestByFileLaunch(process.env, [
      "--storage",
      "sql",
      "uiIntegrationTestLauncher.realServer.integ",
    ]);

    expect(vitestArgs).toEqual(["uiIntegrationTestLauncher.realServer.integ"]);
    expect(spawnEnv.MIROIR_TEST_STORAGE).toBe("sql");
    expect(spawnEnv.MIROIR_ENV).toBe("test-sql");
    expect(spawnEnv.MIROIR_TEST_CLIENT).toBe("realServer");
  });

  it("--profile realServer-filesystem sets MIROIR_TEST_STORAGE from profile name", () => {
    const { spawnEnv } = prepareTestByFileLaunch(process.env, [
      "--profile",
      "realServer-filesystem",
      "uiIntegrationTestLauncher.realServer.integ",
    ]);

    expect(spawnEnv.MIROIR_TEST_STORAGE).toBe("filesystem");
    expect(spawnEnv.MIROIR_ENV).toBe("test-filesystem");
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
    expect(spawnEnv.MIROIR_ENV).toBe("test-sql");
  });

  it("without profile does not set VITE_MIROIR_*", () => {
    const { spawnEnv } = prepareTestByFileLaunch(process.env, [
      "PersistenceStoreController.integ",
    ]);

    expect(spawnEnv.VITE_TEST_MODE).toBe("true");
    expect(spawnEnv.VITE_MIROIR_TEST_CONFIG_FILENAME).toBeUndefined();
    expect(spawnEnv.MIROIR_TEST_PROFILE).toBeUndefined();
  });

  it("#318: --profile names the launch profile for tests that load a profile by name", () => {
    const { spawnEnv } = prepareTestByFileLaunch(process.env, [
      "--profile",
      "emulatedServer-filesystem",
      "uiIntegrationTestLauncher.integ",
    ]);

    expect(spawnEnv.MIROIR_TEST_PROFILE).toBe("emulatedServer-filesystem");
  });

  it("#318: --storage names the real-server profile it selects", () => {
    const { spawnEnv } = prepareTestByFileLaunch(process.env, [
      "--storage",
      "filesystem",
      "uiIntegrationTestLauncher.integ",
    ]);

    expect(spawnEnv.MIROIR_TEST_PROFILE).toBe("realServer-filesystem");
  });

  it("a VITE_MIROIR_TEST_CONFIG_FILENAME set in the shell is dropped: the profile uses its environment (#321)", () => {
    process.env.VITE_MIROIR_TEST_CONFIG_FILENAME = "/custom/config.json";

    const { spawnEnv } = prepareTestByFileLaunch(process.env, [
      "--profile",
      "realServer-sql",
      "uiIntegrationTestLauncher.realServer.integ",
    ]);

    expect(spawnEnv.VITE_MIROIR_TEST_CONFIG_FILENAME).toBeUndefined();
    expect(spawnEnv.MIROIR_ENV).toBe("test-sql");
  });
});

describe("buildTestByFileVitestArgs (#307)", () => {
  const base = ["run", "--reporter=verbose", "--maxWorkers=1"];

  it("adds --bail=1 by default", () => {
    expect(buildTestByFileVitestArgs(["some.integ"])).toEqual([...base, "--bail=1", "some.integ"]);
  });

  it("--no-bail drops the default bail and is not forwarded", () => {
    expect(buildTestByFileVitestArgs(["--no-bail", "some.integ"])).toEqual([...base, "some.integ"]);
  });

  it("a user --bail=<n> replaces the default", () => {
    expect(buildTestByFileVitestArgs(["--bail=3", "some.integ"])).toEqual([...base, "--bail=3", "some.integ"]);
    expect(buildTestByFileVitestArgs(["--bail", "2", "some.integ"])).toEqual([
      ...base,
      "--bail",
      "2",
      "some.integ",
    ]);
  });

  it("--bail=0 means no bail", () => {
    expect(buildTestByFileVitestArgs(["--bail=0", "some.integ"])).toEqual([...base, "some.integ"]);
    expect(buildTestByFileVitestArgs(["--bail", "0", "some.integ"])).toEqual([...base, "some.integ"]);
  });

  it("keeps a -t pattern with spaces as one argument", () => {
    expect(buildTestByFileVitestArgs(["some.integ", "-t", "field at 1"])).toEqual([
      ...base,
      "--bail=1",
      "some.integ",
      "-t",
      "field at 1",
    ]);
  });
});
