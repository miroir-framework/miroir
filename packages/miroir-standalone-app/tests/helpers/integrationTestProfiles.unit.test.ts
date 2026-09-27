import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyIntegrationTestProfile,
  INTEGRATION_TEST_PROFILES,
  listIntegrationTestProfileNames,
  resolveTransformerDefaultsForProfile,
} from "./integrationTestProfiles.js";

const ENV_KEYS = [
  "VITE_MIROIR_TEST_CONFIG_FILENAME",
  "VITE_MIROIR_LOG_CONFIG_FILENAME",
  "MIROIR_TEST_APP_STORE_TYPE",
  "MIROIR_TEST_ADMIN_STORE_TYPE",
  "MIROIR_TEST_POSTGRES_HOST",
  "MIROIR_TEST_ADMIN_SQL_SCHEMA",
  "MIROIR_ENV",
  "CI",
] as const;

describe("integrationTestProfiles (Gap D0)", () => {
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

  it("catalog includes emulatedServer-sql with json config paths", () => {
    const profile = INTEGRATION_TEST_PROFILES["emulatedServer-sql"];
    expect(profile.miroirConfigFilename.endsWith(".json")).toBe(true);
    expect(profile.logConfigFilename.endsWith(".json")).toBe(true);
    expect(profile.miroirConfigFilename).toContain("miroirConfig.test-emulatedServer-sql.json");
  });

  it("lists all registered profile names", () => {
    expect(listIntegrationTestProfileNames()).toEqual([
      "ci-emulatedServer-dockerized-sql",
      "ci-emulatedServer-host-sql",
      "emulatedServer-filesystem",
      "emulatedServer-indexedDb",
      "emulatedServer-mongodb",
      "emulatedServer-sql",
      "realServer-filesystem",
      "realServer-indexedDb",
      "realServer-mongodb",
      "realServer-sql",
    ]);
  });

  it("throws for unknown profile", () => {
    expect(() => applyIntegrationTestProfile("nope")).toThrow(/Unknown integration test profile: nope/);
    expect(() => applyIntegrationTestProfile("nope")).toThrow(/emulatedServer-sql/);
  });

  it("respectExistingEnv does not overwrite pre-set VITE_MIROIR_TEST_CONFIG_FILENAME", () => {
    process.env.VITE_MIROIR_TEST_CONFIG_FILENAME = "/custom/config.json";

    applyIntegrationTestProfile("emulatedServer-sql", { respectExistingEnv: true });

    expect(process.env.VITE_MIROIR_TEST_CONFIG_FILENAME).toBe("/custom/config.json");
    expect(process.env.VITE_MIROIR_LOG_CONFIG_FILENAME).toContain("config/logging");
  });

  it("resolveTransformerDefaultsForProfile derives emulatedServer-sql from JSON", () => {
    const defaults = resolveTransformerDefaultsForProfile(
      INTEGRATION_TEST_PROFILES["emulatedServer-sql"],
    );

    expect(defaults.appStoreType).toBe("sql");
    expect(defaults.adminStoreType).toBe("filesystem");
    expect(defaults.postgresHost).toBe("localhost");
  });

  it("applyIntegrationTestProfile sets VITE and transformer defaults when env is empty", () => {
    const profile = applyIntegrationTestProfile("emulatedServer-sql");

    expect(profile?.name).toBe("emulatedServer-sql");
    expect(process.env.VITE_MIROIR_TEST_CONFIG_FILENAME).toContain(
      "miroirConfig.test-emulatedServer-sql.json",
    );
    expect(process.env.VITE_MIROIR_LOG_CONFIG_FILENAME).toContain("catch-all.json");
    expect(process.env.MIROIR_TEST_APP_STORE_TYPE).toBe("sql");
    expect(process.env.MIROIR_TEST_ADMIN_STORE_TYPE).toBe("filesystem");
    expect(process.env.MIROIR_TEST_POSTGRES_HOST).toBe("localhost");
  });

  it("returns undefined when profile name is omitted", () => {
    expect(applyIntegrationTestProfile(undefined)).toBeUndefined();
  });

  it("respectExistingEnv false overwrites existing values", () => {
    process.env.VITE_MIROIR_TEST_CONFIG_FILENAME = "/custom/config.json";
    process.env.MIROIR_TEST_POSTGRES_HOST = "other-host";

    applyIntegrationTestProfile("emulatedServer-sql", { respectExistingEnv: false });

    expect(process.env.VITE_MIROIR_TEST_CONFIG_FILENAME).toContain(
      "miroirConfig.test-emulatedServer-sql.json",
    );
    expect(process.env.MIROIR_TEST_POSTGRES_HOST).toBe("localhost");
  });

  it("emulatedServer-filesystem selects the test-filesystem environment (#321)", () => {
    applyIntegrationTestProfile("emulatedServer-filesystem");

    expect(process.env.MIROIR_ENV).toBe("test-filesystem");
    expect(process.env.VITE_MIROIR_TEST_CONFIG_FILENAME).toContain(
      "miroirConfig.test-emulatedServer-filesystem.json",
    );
    expect(process.env.MIROIR_TEST_APP_STORE_TYPE).toBe("filesystem");
    expect(process.env.MIROIR_TEST_ADMIN_STORE_TYPE).toBe("filesystem");
  });

  it("a MIROIR_ENV naming another test environment is kept, a development one is replaced (#321)", () => {
    process.env.MIROIR_ENV = "test-other";
    applyIntegrationTestProfile("emulatedServer-filesystem");
    expect(process.env.MIROIR_ENV).toBe("test-other");

    process.env.MIROIR_ENV = "dev";
    applyIntegrationTestProfile("emulatedServer-filesystem");
    expect(process.env.MIROIR_ENV).toBe("test-filesystem");
  });

  it("profiles without an environment leave MIROIR_ENV unset (#321)", () => {
    applyIntegrationTestProfile("realServer-sql");

    expect(process.env.MIROIR_ENV).toBeUndefined();
  });

  it("respectExistingEnv false: a profile without an environment drops the previous profile's (#321)", () => {
    applyIntegrationTestProfile("emulatedServer-filesystem", { respectExistingEnv: false });
    applyIntegrationTestProfile("realServer-sql", { respectExistingEnv: false });

    expect(process.env.MIROIR_ENV).toBeUndefined();
    expect(process.env.VITE_MIROIR_TEST_CONFIG_FILENAME).toContain("miroirConfig.test-realServer-sql.json");
  });

  it("sql, indexedDb and mongodb profiles select their test environment (#321)", () => {
    for (const [profile, environment, appStoreType] of [
      ["emulatedServer-sql", "test-sql", "sql"],
      ["emulatedServer-indexedDb", "test-indexedDb", "indexedDb"],
      ["emulatedServer-mongodb", "test-mongodb", "mongodb"],
    ]) {
      applyIntegrationTestProfile(profile, { respectExistingEnv: false });
      expect(process.env.MIROIR_ENV).toBe(environment);
      expect(process.env.MIROIR_TEST_APP_STORE_TYPE).toBe(appStoreType);
      expect(process.env.MIROIR_TEST_ADMIN_STORE_TYPE).toBe("filesystem");
    }
    expect(process.env.MIROIR_TEST_POSTGRES_HOST).toBe("localhost");
  });

  it("a shell variable that contradicts the profile is kept with a warning (#321)", () => {
    process.env.MIROIR_TEST_APP_STORE_TYPE = "sql";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      applyIntegrationTestProfile("emulatedServer-filesystem");
      expect(process.env.MIROIR_TEST_APP_STORE_TYPE).toBe("sql");
      expect(warn).toHaveBeenCalledWith(
        "warning: integration test profile emulatedServer-filesystem: MIROIR_TEST_APP_STORE_TYPE=sql is kept, the profile sets filesystem",
      );
    } finally {
      warn.mockRestore();
    }
  });

  it("under CI, a shell variable that contradicts the profile is an error (#321)", () => {
    process.env.MIROIR_TEST_APP_STORE_TYPE = "sql";
    process.env.CI = "true";

    expect(() => applyIntegrationTestProfile("emulatedServer-filesystem")).toThrow(
      /MIROIR_TEST_APP_STORE_TYPE=sql is kept, the profile sets filesystem/,
    );
  });
});
