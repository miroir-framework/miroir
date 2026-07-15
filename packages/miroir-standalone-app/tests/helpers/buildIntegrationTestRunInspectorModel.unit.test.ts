import { describe, expect, it } from "vitest";

import { miroirTest_runner_library } from "miroir-test-app_deployment-library";
import type { MiroirTestDefinition, MiroirTestSuite } from "miroir-core";

import { buildIntegrationTestRunInspectorModel } from "../../src/miroir-fwk/4-tests/buildIntegrationTestRunInspectorModel.js";
import type { UiIntegrationTestRunResult } from "../../src/miroir-fwk/4-tests/uiIntegrationTestLauncherTypes.js";

function runnerLibrarySuite(): MiroirTestSuite {
  return (miroirTest_runner_library as MiroirTestDefinition).definition as MiroirTestSuite;
}

describe("buildIntegrationTestRunInspectorModel (B6)", () => {
  it("builds inspector model from a mock run result", () => {
    const suite = runnerLibrarySuite();
    const result: UiIntegrationTestRunResult = {
      suiteKey: "runner_library",
      sessionKind: "runner",
      runTarget: {
        applicationUuid: "app-uuid",
        applicationName: "library-test",
        deploymentUuid: "deploy-uuid",
      },
      runTargetMode: "ephemeral",
      profileName: "emulatedServer-sql",
      hostMode: "isolated",
      success: true,
      inspector: {
        profileName: "emulatedServer-sql",
        sessionKind: "runner",
        runTarget: {
          applicationUuid: "app-uuid",
          applicationName: "library-test",
          deploymentUuid: "deploy-uuid",
        },
        runTargetMode: "ephemeral",
        hostMode: "isolated",
        paramBankKeys: Object.keys(suite.testParams ?? {}).sort(),
      },
      testSuiteResults: {
        testsResults: {
          "Lend Book Test Composite Action": {
            testResult: "ok",
            testAssertionsResults: {},
          },
          "Return Book Test Composite Action": {
            testResult: "error",
            testAssertionsResults: {},
          },
        },
      },
    };

    const model = buildIntegrationTestRunInspectorModel(result);

    expect(model.profileDescription).toContain("Postgres");
    expect(model.sessionDescriptor.playfield).toBe("libraryDeployment");
    expect(model.sessionDescriptor.bootstrapPhases).toEqual([
      "wireEmulatedStack",
      "deployMiroir",
    ]);
    expect(model.assertionSummary.total).toBe(2);
    expect(model.assertionSummary.passed).toBe(1);
    expect(model.assertionSummary.failed).toBe(1);
    expect(model.assertionSummary.recentFailures[0]?.testLabel).toBe(
      "Return Book Test Composite Action",
    );
  });
});
