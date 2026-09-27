import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  listCliRunnerIntegrationSuiteKeysFromFolders,
  listCliTransformerIntegrationSuiteKeysFromFolders,
} from "miroir-core/src/5_tests/loadApplicationMiroirTestsFromFolders.js";

import { resolveVitestEntry } from "../../scripts/testMiroirLauncher.js";

const ENV_KEYS = ["MIROIR_TEST_MODE", "MIROIR_TEST_SUITES", "MIROIR_TEST_TAGS"] as const;

const DOMAIN_CONTROLLER_SUITES = [
  "action.domainController.freezeApplicationVersion",
  "action.domainController.dataCrud.compositePk",
  "action.domainController.dataCrud",
  "action.domainController.modelCrud",
  "action.domainController.modelUndoRedo",
  "action.domainController.dataCrud.noParentUuid",
  "action.domainController.dataCrud.nonUuidPk",
  "action.domainController.modelCrud.nonUuidPk",
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
    expect([...spawnedSuites(spawnEnv)].sort()).toEqual([...DOMAIN_CONTROLLER_SUITES].sort());
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
      "action.domainController.dataCrud,runner.createEntity",
      "--tags",
      "domain-controller",
      "--mode",
      "integ",
    ]);
    expect(spawnedSuites(spawnEnv)).toEqual(["action.domainController.dataCrud"]);
  });

  it("an empty --tags overrides MIROIR_TEST_TAGS", () => {
    process.env.MIROIR_TEST_TAGS = "transformer";
    const { vitestEntry, spawnEnv } = resolveVitestEntry(process.env, [
      "--suites",
      "runner.createEntity",
      "--tags",
      "",
      "--mode",
      "integ",
    ]);
    expect(vitestEntry).toBe("miroir-runner-tests.integ.test");
    expect(spawnedSuites(spawnEnv)).toEqual(["runner.createEntity"]);
    expect(spawnEnv.MIROIR_TEST_TAGS).toBe("");
  });

  it("refuses tags that select both core and runner suites", () => {
    const runnerKeys = listCliRunnerIntegrationSuiteKeysFromFolders();
    expect(runnerKeys).toContain("runner.createEntity");
    expect(() =>
      resolveVitestEntry(process.env, ["--tags", "transformer,runner", "--mode", "integ"]),
    ).toThrow(/both core suites .*miroirCoreTransformers.* and runner suites .*runner.createEntity/);
  });
});
