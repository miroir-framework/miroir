import { describe, expect, it } from "vitest";

import { listMiroirTestSuiteKeys } from "miroir-core";

import {
  assertMiroirCoreIntegTestLaunchReady,
  formatMiroirCoreIntegTestUsage,
  validateMiroirCoreIntegTestLaunch,
} from "./miroirCoreIntegTestLaunch.js";
import {
  resolveDefaultAdminAssetsRoot,
  resolveDefaultFilesystemDeploymentRoot,
  resolveTestSessionForIntegOptionsFromEnv,
} from "./IntegrationTestSession.js";

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

  it("throws with usage when assert fails", () => {
    expect(() =>
      assertMiroirCoreIntegTestLaunchReady(
        baseContext({
          config: { suiteKeys: ["definitely_not_a_suite"] },
        }),
      ),
    ).toThrow(/Usage:/);
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
