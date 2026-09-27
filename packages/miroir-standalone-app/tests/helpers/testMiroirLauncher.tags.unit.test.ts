import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  listCliRunnerIntegrationSuiteKeysFromFolders,
  listCliTransformerIntegrationSuiteKeysFromFolders,
} from "miroir-core/src/5_tests/loadApplicationMiroirTestsFromFolders.js";

import { resolveVitestEntry } from "../../scripts/testMiroirLauncher.js";

const ENV_KEYS = ["MIROIR_TEST_MODE", "MIROIR_TEST_SUITES", "MIROIR_TEST_TAGS"] as const;

const DOMAIN_CONTROLLER_SUITES = [
  "domain_controller_application_version_freeze",
  "domain_controller_composite_pk_crud",
  "domain_controller_data_crud",
  "domain_controller_model_crud",
  "domain_controller_model_undo_redo",
  "domain_controller_no_parent_uuid_crud",
  "domain_controller_non_uuid_pk_data_crud",
  "domain_controller_non_uuid_pk_model_crud",
];

function spawnedSuites(spawnEnv: NodeJS.ProcessEnv): string[] {
  return (spawnEnv.MIROIR_TEST_SUITES ?? "").split(",").filter(Boolean).sort();
}

describe("testMiroirLauncher --tags (#312)", () => {
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

  it("routes runner-tagged suites to the runner entry, with exactly those suites", () => {
    const { vitestEntry, spawnEnv } = resolveVitestEntry(process.env, [
      "--tags",
      "domain-controller",
      "--mode",
      "integ",
    ]);
    expect(vitestEntry).toBe("miroir-runner-tests.integ.test");
    expect(spawnedSuites(spawnEnv)).toEqual(DOMAIN_CONTROLLER_SUITES);
    expect(spawnEnv.MIROIR_TEST_TAGS).toBe("domain-controller");
  });

  it("routes transformer-tagged suites to the core integ entry, integ-capable suites only", () => {
    const transformerIntegKeys = listCliTransformerIntegrationSuiteKeysFromFolders();
    const { vitestEntry, spawnEnv } = resolveVitestEntry(process.env, [
      "--tags",
      "transformer",
      "--mode",
      "integ",
    ]);
    expect(vitestEntry).toBe("miroir-core-tests.integ.test");
    const suites = spawnedSuites(spawnEnv);
    expect(suites).toContain("miroirCoreTransformers");
    for (const suite of suites) {
      expect(transformerIntegKeys, suite).toContain(suite);
    }
  });

  it("intersects --tags with --suites", () => {
    const { spawnEnv } = resolveVitestEntry(process.env, [
      "--suites",
      "domain_controller_data_crud,runner_create_entity",
      "--tags",
      "domain-controller",
      "--mode",
      "integ",
    ]);
    expect(spawnedSuites(spawnEnv)).toEqual(["domain_controller_data_crud"]);
  });

  it("an empty --tags overrides MIROIR_TEST_TAGS", () => {
    process.env.MIROIR_TEST_TAGS = "transformer";
    const { vitestEntry, spawnEnv } = resolveVitestEntry(process.env, [
      "--suites",
      "runner_create_entity",
      "--tags",
      "",
      "--mode",
      "integ",
    ]);
    expect(vitestEntry).toBe("miroir-runner-tests.integ.test");
    expect(spawnedSuites(spawnEnv)).toEqual(["runner_create_entity"]);
    expect(spawnEnv.MIROIR_TEST_TAGS).toBe("");
  });

  it("refuses tags that select both core and runner suites", () => {
    const runnerKeys = listCliRunnerIntegrationSuiteKeysFromFolders();
    expect(runnerKeys).toContain("runner_create_entity");
    expect(() =>
      resolveVitestEntry(process.env, ["--tags", "transformer,runner", "--mode", "integ"]),
    ).toThrow(/both core suites .*miroirCoreTransformers.* and runner suites .*runner_create_entity/);
  });
});
