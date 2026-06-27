import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  prepareTestByFileLaunch,
  stripProfileArgs,
} from "../../scripts/testByFileLauncher.js";

const ENV_KEYS = [
  "VITE_MIROIR_TEST_CONFIG_FILENAME",
  "VITE_MIROIR_LOG_CONFIG_FILENAME",
  "VITE_TEST_MODE",
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

  it("stripProfileArgs removes --profile and value from argv", () => {
    expect(
      stripProfileArgs([
        "--profile",
        "emulatedServer-sql",
        "PersistenceStoreController.integ",
      ]),
    ).toEqual(["PersistenceStoreController.integ"]);
    expect(stripProfileArgs(["-p", "emulatedServer-filesystem", "--bail=1"])).toEqual(["--bail=1"]);
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
