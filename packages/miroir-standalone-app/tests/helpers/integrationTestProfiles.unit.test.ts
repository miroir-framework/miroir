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
  "MIROIR_TEST_CLIENT",
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

  it("every profile names a test environment; realServer profiles call a running server (#321)", () => {
    for (const profile of Object.values(INTEGRATION_TEST_PROFILES)) {
      expect(profile.logConfigFilename.endsWith(".json")).toBe(true);
      expect(profile.environment).toMatch(/^test-/);
      expect(profile.client).toBe(profile.name.startsWith("realServer-") ? "realServer" : undefined);
    }
  });

  it("lists all registered profile names", () => {
    expect(listIntegrationTestProfileNames()).toEqual([
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

  it("an environment profile drops a VITE_MIROIR_TEST_CONFIG_FILENAME set in the shell, with a warning (#321)", () => {
    process.env.VITE_MIROIR_TEST_CONFIG_FILENAME = "/custom/config.json";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      applyIntegrationTestProfile("emulatedServer-sql");

      expect(process.env.VITE_MIROIR_TEST_CONFIG_FILENAME).toBeUndefined();
      expect(warn).toHaveBeenCalledWith(
        "warning: integration test profile emulatedServer-sql: VITE_MIROIR_TEST_CONFIG_FILENAME=/custom/config.json is ignored, the profile uses environment test-sql",
      );
    } finally {
      warn.mockRestore();
    }
  });

  it("resolveTransformerDefaultsForProfile derives emulatedServer-sql from its environment", () => {
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
    expect(process.env.MIROIR_ENV).toBe("test-sql");
    expect(process.env.VITE_MIROIR_TEST_CONFIG_FILENAME).toBeUndefined();
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

    expect(process.env.VITE_MIROIR_TEST_CONFIG_FILENAME).toBeUndefined();
    expect(process.env.MIROIR_TEST_POSTGRES_HOST).toBe("localhost");
  });

  it("emulatedServer-filesystem selects the test-filesystem environment (#321)", () => {
    applyIntegrationTestProfile("emulatedServer-filesystem");

    expect(process.env.MIROIR_ENV).toBe("test-filesystem");
    expect(process.env.VITE_MIROIR_TEST_CONFIG_FILENAME).toBeUndefined();
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
