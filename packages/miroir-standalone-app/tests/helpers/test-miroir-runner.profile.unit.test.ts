import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  prepareTestMiroirLaunch,
  resolveVitestEntry,
} from "../../scripts/testMiroirLauncher.js";

const ENV_KEYS = [
  "VITE_MIROIR_TEST_CONFIG_FILENAME",
  "VITE_MIROIR_LOG_CONFIG_FILENAME",
  "MIROIR_TEST_APP_STORE_TYPE",
  "MIROIR_TEST_ADMIN_STORE_TYPE",
  "MIROIR_TEST_POSTGRES_HOST",
  "MIROIR_TEST_ADMIN_SQL_SCHEMA",
  "MIROIR_TEST_MODE",
  "MIROIR_TEST_SUITES",
] as const;

describe("testMiroirLauncher profile (Gap D1)", () => {
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

  it("runner route: --profile emulatedServer-sql sets VITE_* and MIROIR_TEST_POSTGRES_HOST", () => {
    const { vitestEntry, spawnEnv } = prepareTestMiroirLaunch(process.env, [
      "--profile",
      "emulatedServer-sql",
      "--suites",
      "runner_library",
      "--mode",
      "integ",
    ]);

    expect(vitestEntry).toBe("miroir-runner-tests.integ.test");
    expect(spawnEnv.VITE_MIROIR_TEST_CONFIG_FILENAME).toContain(
      "miroirConfig.test-emulatedServer-sql.json",
    );
    expect(spawnEnv.VITE_MIROIR_LOG_CONFIG_FILENAME).toContain("specificLoggersConfig");
    expect(spawnEnv.MIROIR_TEST_POSTGRES_HOST).toBe("localhost");
    expect(spawnEnv.MIROIR_TEST_APP_STORE_TYPE).toBe("sql");
    expect(spawnEnv.MIROIR_TEST_ADMIN_STORE_TYPE).toBe("filesystem");
  });

  it("core route: --profile emulatedServer-sql sets same env as runner route", () => {
    const runner = prepareTestMiroirLaunch(process.env, [
      "--profile",
      "emulatedServer-sql",
      "--suites",
      "runner_library",
      "--mode",
      "integ",
    ]);

    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }

    const core = prepareTestMiroirLaunch(process.env, [
      "--profile",
      "emulatedServer-sql",
      "--suites",
      "miroirCoreTransformers",
      "--mode",
      "integ",
    ]);

    expect(core.vitestEntry).toBe("miroir-core-tests.integ.test");
    expect(core.spawnEnv.VITE_MIROIR_TEST_CONFIG_FILENAME).toBe(
      runner.spawnEnv.VITE_MIROIR_TEST_CONFIG_FILENAME,
    );
    expect(core.spawnEnv.VITE_MIROIR_LOG_CONFIG_FILENAME).toBe(
      runner.spawnEnv.VITE_MIROIR_LOG_CONFIG_FILENAME,
    );
    expect(core.spawnEnv.MIROIR_TEST_POSTGRES_HOST).toBe(runner.spawnEnv.MIROIR_TEST_POSTGRES_HOST);
    expect(core.spawnEnv.MIROIR_TEST_APP_STORE_TYPE).toBe(runner.spawnEnv.MIROIR_TEST_APP_STORE_TYPE);
    expect(core.spawnEnv.MIROIR_TEST_ADMIN_STORE_TYPE).toBe(
      runner.spawnEnv.MIROIR_TEST_ADMIN_STORE_TYPE,
    );
  });

  it("respectExistingEnv: pre-set MIROIR_TEST_POSTGRES_HOST is not overwritten by profile", () => {
    process.env.MIROIR_TEST_POSTGRES_HOST = "custom-host";

    const { spawnEnv } = prepareTestMiroirLaunch(process.env, [
      "--profile",
      "emulatedServer-sql",
      "--suites",
      "runner_library",
      "--mode",
      "integ",
    ]);

    expect(spawnEnv.MIROIR_TEST_POSTGRES_HOST).toBe("custom-host");
    expect(spawnEnv.VITE_MIROIR_TEST_CONFIG_FILENAME).toContain(
      "miroirConfig.test-emulatedServer-sql.json",
    );
  });

  it("resolveVitestEntry without profile does not set VITE_* (launcher applies profile separately)", () => {
    process.env.MIROIR_TEST_MODE = "integ";

    const { spawnEnv } = resolveVitestEntry(process.env, [
      "--suites",
      "runner_library",
      "--mode",
      "integ",
    ]);

    expect(spawnEnv.VITE_MIROIR_TEST_CONFIG_FILENAME).toBeUndefined();
    expect(spawnEnv.MIROIR_TEST_POSTGRES_HOST).toBeUndefined();
  });
});
