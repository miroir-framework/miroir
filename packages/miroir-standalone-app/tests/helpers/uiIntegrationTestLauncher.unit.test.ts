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
  it("lists runner_library", () => {
    expect(listUiIntegrationRunnerSuiteKeys()).toContain("runner_library");
  });

  it("resolves runner_library entry", () => {
    const entry = resolveUiIntegrationRunnerSuite("runner_library");
    expect(entry.suiteDefinition.miroirTestLabel).toBe("runner.library");
    expect(Object.keys(entry.runnerRegistry).length).toBeGreaterThan(0);
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
});
