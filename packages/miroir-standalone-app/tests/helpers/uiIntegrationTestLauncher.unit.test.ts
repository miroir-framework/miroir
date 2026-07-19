import { describe, expect, it } from "vitest";

import { miroirTest_runner_library } from "miroir-test-app_deployment-library";
import type { MiroirTestDefinition, MiroirTestSuite } from "miroir-core";

import {
  isUiIntegrationSuiteRunSuccessful,
  resolveUiIntegrationTestRunTarget,
} from "../../src/miroir-fwk/4-tests/uiIntegrationTestLauncher.js";
import {
  listUiIntegrationRunnerSuiteKeys,
  resolveUiIntegrationRunnerSuite,
} from "../../src/miroir-fwk/4-tests/uiIntegrationTestRunnerSuiteRegistry.js";

function runnerLibrarySuite(): MiroirTestSuite {
  return (miroirTest_runner_library as MiroirTestDefinition).definition as MiroirTestSuite;
}

describe("uiIntegrationTestRunnerSuiteRegistry (B3)", () => {
  it("lists runner_library and domain_controller action suites", () => {
    const keys = listUiIntegrationRunnerSuiteKeys();
    expect(keys).toContain("runner_library");
    expect(keys).toContain("domain_controller_data_crud");
    expect(keys).toContain("domain_controller_model_crud");
  });

  it("resolves runner_library entry", () => {
    const entry = resolveUiIntegrationRunnerSuite("runner_library");
    expect(entry.suiteDefinition.miroirTestLabel).toBe("runner.library");
    expect(Object.keys(entry.runnerRegistry).length).toBeGreaterThan(0);
  });

  it("resolves domain_controller_data_crud with playfield seed and empty runner registry", () => {
    const entry = resolveUiIntegrationRunnerSuite("domain_controller_data_crud");
    expect(entry.suiteDefinition.miroirTestLabel).toBe("domainController.data.crud");
    expect(entry.runnerRegistry).toEqual({});
    expect(entry.libraryPlayfieldSeed).toBeDefined();
  });
});

describe("uiIntegrationTestTransformerSuiteRegistry (B7)", () => {
  it("lists and resolves miroirCoreTransformers", async () => {
    const {
      listUiIntegrationTransformerSuiteKeys,
      resolveUiIntegrationTransformerSuite,
    } = await import("../../src/miroir-fwk/4-tests/uiIntegrationTestTransformerSuiteRegistry.js");
    expect(listUiIntegrationTransformerSuiteKeys()).toContain("miroirCoreTransformers");
    const entry = resolveUiIntegrationTransformerSuite("miroirCoreTransformers");
    expect(entry.suiteDefinition.miroirTestLabel).toBe("miroirCoreTransformers");
  });
});

describe("resolveUiIntegrationTestRunTarget (B3)", () => {
  it("pinned mode uses suite runTarget", () => {
    const suite = runnerLibrarySuite();
    const resolved = resolveUiIntegrationTestRunTarget("pinned", suite);

    expect(resolved.applicationUuid).toBe(suite.runTarget?.applicationUuid);
    expect(resolved.deploymentUuid).toBe(suite.runTarget?.deploymentUuid);
  });

  it("ephemeral mode ignores suite pins", () => {
    const suite = runnerLibrarySuite();
    const pinned = resolveUiIntegrationTestRunTarget("pinned", suite);
    const ephemeral = resolveUiIntegrationTestRunTarget("ephemeral", suite);

    expect(ephemeral.applicationUuid).not.toBe(pinned.applicationUuid);
    expect(ephemeral.deploymentUuid).not.toBe(pinned.deploymentUuid);
  });
});

describe("isUiIntegrationSuiteRunSuccessful (B3)", () => {
  it("returns false when no test results exist", () => {
    expect(
      isUiIntegrationSuiteRunSuccessful(
        {
          getTestAssertionsResults: () => ({}),
        } as never,
        "runner_library",
      ),
    ).toBe(false);
  });

  it("returns true for nested transformer suite results (B7)", () => {
    expect(
      isUiIntegrationSuiteRunSuccessful(
        {
          getTestAssertionsResults: () => ({
            testsSuiteResults: {
              runtimeTransformerTests: {
                testsSuiteResults: {
                  plus: {
                    testsResults: {
                      "plus with empty args fails": {
                        testLabel: "plus with empty args fails",
                        testResult: "ok",
                        testAssertionsResults: {},
                      },
                    },
                  },
                },
              },
            },
          }),
        } as never,
        "miroirCoreTransformers",
      ),
    ).toBe(true);
  });
});
