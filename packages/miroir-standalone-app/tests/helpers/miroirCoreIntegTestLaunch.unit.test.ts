import { describe, expect, it } from "vitest";

import { listMiroirTestSuiteKeys } from "miroir-core";

import { applyIntegrationTestProfile } from "./integrationTestProfiles.js";
import {
  assertMiroirCoreIntegTestLaunchReady,
  formatMiroirCoreIntegTestUsage,
  formatProfileLaunchHint,
  validateMiroirCoreIntegTestLaunch,
} from "./miroirCoreIntegTestLaunch.js";
import { resolveTestSessionForIntegOptionsFromEnv } from "./IntegrationTestSession.js";

const PROFILE_ENV_KEYS = [
  "VITE_MIROIR_TEST_CONFIG_FILENAME",
  "VITE_MIROIR_LOG_CONFIG_FILENAME",
  "MIROIR_TEST_APP_STORE_TYPE",
  "MIROIR_TEST_ADMIN_STORE_TYPE",
  "MIROIR_TEST_POSTGRES_HOST",
  "MIROIR_TEST_ADMIN_SQL_SCHEMA",
] as const;

function baseContext(overrides: {
  env?: NodeJS.ProcessEnv;
  argv?: string[];
  config?: Partial<{
    suiteKeys: string[];
    executionMode: "unit" | "integration";
    filter?: Record<string, string[]>;
  }>;
}) {
  const env = overrides.env ?? {
    MIROIR_TEST_SUITES: "miroirCoreTransformers",
    MIROIR_TEST_MODE: "integ",
  };
  return {
    env,
    argv: overrides.argv ?? [],
    config: {
      suiteKeys: ["miroirCoreTransformers"],
      executionMode: "integration" as const,
      filter: undefined,
      ...overrides.config,
    },
    testSessionOptions: resolveTestSessionForIntegOptionsFromEnv(env),
  };
}

describe("miroirCoreIntegTestLaunch", () => {
  it("prints shell-style usage", () => {
    const usage = formatMiroirCoreIntegTestUsage();
    expect(usage).toContain("Usage:");
    expect(usage).toContain("MIROIR_TEST_APP_STORE_TYPE");
    expect(usage).toContain("MIROIR_TEST_ADMIN_STORE_TYPE");
    expect(usage).toContain("--profile emulatedServer-sql");
    expect(usage).toContain("no manual MIROIR_TEST_POSTGRES_HOST");
  });

  it("accepts profile-applied configuration without manually setting MIROIR_TEST_POSTGRES_HOST", () => {
    const savedEnv: Partial<Record<(typeof PROFILE_ENV_KEYS)[number], string | undefined>> = {};
    for (const key of PROFILE_ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }

    try {
      applyIntegrationTestProfile("emulatedServer-sql");

      const env = {
        ...process.env,
        MIROIR_TEST_SUITES: "miroirCoreTransformers",
        MIROIR_TEST_MODE: "integ",
      };

      expect(env.MIROIR_TEST_POSTGRES_HOST).toBe("localhost");

      const errors = validateMiroirCoreIntegTestLaunch(baseContext({ env }));
      expect(errors).toEqual([]);
    } finally {
      for (const key of PROFILE_ENV_KEYS) {
        if (savedEnv[key] === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = savedEnv[key];
        }
      }
    }
  });

  it("reports missing CI sql configuration without profile or postgres host", () => {
    const errors = validateMiroirCoreIntegTestLaunch(
      baseContext({
        env: {
          CI: "true",
          MIROIR_TEST_SUITES: "miroirCoreTransformers",
          MIROIR_TEST_MODE: "integ",
        },
      }),
    );
    expect(errors.some((error) => error.includes("--profile emulatedServer-sql"))).toBe(true);
  });

  it("accepts CI sql configuration when profile env is present", () => {
    const errors = validateMiroirCoreIntegTestLaunch(
      baseContext({
        env: {
          CI: "true",
          MIROIR_TEST_SUITES: "miroirCoreTransformers",
          MIROIR_TEST_MODE: "integ",
          VITE_MIROIR_TEST_CONFIG_FILENAME:
            "./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json",
        },
      }),
    );
    expect(errors.filter((error) => error.includes("CI requires"))).toEqual([]);
  });

  it("accepts default sql + filesystem configuration", () => {
    const errors = validateMiroirCoreIntegTestLaunch(baseContext({}));
    expect(errors).toEqual([]);
  });

  it("reports unit mode on integration entry", () => {
    const errors = validateMiroirCoreIntegTestLaunch(
      baseContext({
        env: {
          MIROIR_TEST_SUITES: "miroirCoreTransformers",
          MIROIR_TEST_MODE: "unit",
        },
        config: { executionMode: "unit" },
      }),
    );
    expect(errors.some((error) => error.includes("integ or integration"))).toBe(true);
  });

  it("reports unknown suite keys", () => {
    const errors = validateMiroirCoreIntegTestLaunch(
      baseContext({
        config: { suiteKeys: ["no_such_suite"] },
      }),
    );
    expect(errors.some((error) => error.includes("Unknown MIROIR_TEST_SUITES"))).toBe(true);
  });

  it("reports missing mongodb connection string", () => {
    const errors = validateMiroirCoreIntegTestLaunch(
      baseContext({
        env: {
          MIROIR_TEST_SUITES: "miroirCoreTransformers",
          MIROIR_TEST_MODE: "integ",
          MIROIR_TEST_APP_STORE_TYPE: "mongodb",
        },
      }),
    );
    expect(errors.some((error) => error.includes("MIROIR_TEST_MONGODB_CONNECTION_STRING"))).toBe(
      true,
    );
  });

  it("reports bundled admin without bundledDeploymentData", () => {
    const errors = validateMiroirCoreIntegTestLaunch(
      baseContext({
        env: {
          MIROIR_TEST_SUITES: "miroirCoreTransformers",
          MIROIR_TEST_MODE: "integ",
          MIROIR_TEST_ADMIN_STORE_TYPE: "bundled",
        },
      }),
    );
    expect(errors.some((error) => error.includes("bundledDeploymentData"))).toBe(true);
  });

  it("does not reject filter keys that differ from registry suite keys", () => {
    const errors = validateMiroirCoreIntegTestLaunch(
      baseContext({
        config: {
          suiteKeys: ["mustache"],
          filter: {
            testList: { "mustache.extractDoubleBracePatterns": ["should extract patterns with double braces"] },
          },
        },
      }),
    );
    expect(errors.some((error) => error.includes("MIROIR_TEST_FILTER"))).toBe(false);
  });

  it("throws with usage and profile hint when assert fails", () => {
    expect(() =>
      assertMiroirCoreIntegTestLaunchReady(
        baseContext({
          config: { suiteKeys: ["definitely_not_a_suite"] },
        }),
      ),
    ).toThrow(/Usage:/);
    expect(() =>
      assertMiroirCoreIntegTestLaunchReady(
        baseContext({
          config: { suiteKeys: ["definitely_not_a_suite"] },
        }),
      ),
    ).toThrow(/--profile emulatedServer-sql/);
    expect(formatProfileLaunchHint()).toContain("--profile emulatedServer-sql");
  });

  it("skips validation when no suites are selected", () => {
    const errors = validateMiroirCoreIntegTestLaunch(
      baseContext({
        env: { MIROIR_TEST_MODE: "unit" },
        config: { suiteKeys: [] },
      }),
    );
    expect(errors).toEqual([]);
    expect(listMiroirTestSuiteKeys().length).toBeGreaterThan(0);
  });
});
