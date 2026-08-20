import { describe, expect, it } from "vitest";

import { miroirTest_runner_return_document } from "miroir-test-app_deployment-library";
import { miroirTest_miroirCoreTransformers } from "miroir-test-app_deployment-miroir";
import {
  classifyMiroirTestSuiteExecutionCapabilities,
  inferIntegrationSessionKind,
  type MiroirTestDefinition,
  type MiroirTestSuite,
} from "miroir-core";

import type {
  UiIntegrationTestRunRequest,
  UiIntegrationTestRunResult,
} from "../../src/miroir-fwk/4-tests/uiIntegrationTestLauncherTypes.js";

function suiteDefinition(instance: { definition: unknown }): MiroirTestSuite {
  return instance.definition as MiroirTestSuite;
}

describe("uiIntegrationTestLauncherTypes (B0)", () => {
  it("accepts a minimal run request shape", () => {
    const request: UiIntegrationTestRunRequest = {
      suiteKey: "runner_return_document",
      suiteDefinition: suiteDefinition(miroirTest_runner_return_document),
      profileName: "emulatedServer-sql",
      runTargetMode: "ephemeral",
      hostMode: "isolated",
    };

    expect(request.hostMode).toBe("isolated");
  });

  it("accepts a minimal run result shape", () => {
    const result: UiIntegrationTestRunResult = {
      suiteKey: "runner_return_document",
      sessionKind: "runner",
      runTarget: {
        applicationUuid: "5af03c98-fe5e-490b-b08f-e1230971c57f",
        applicationName: "Library",
        deploymentUuid: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
      },
      runTargetMode: "pinned",
      profileName: "emulatedServer-sql",
      hostMode: "isolated",
      success: true,
      inspector: {
        profileName: "emulatedServer-sql",
        sessionKind: "runner",
        runTarget: {
          applicationUuid: "5af03c98-fe5e-490b-b08f-e1230971c57f",
          applicationName: "Library",
          deploymentUuid: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
        },
        runTargetMode: "pinned",
        hostMode: "isolated",
        paramBankKeys: [],
      },
    };

    expect(result.success).toBe(true);
  });
});

describe("inferIntegrationSessionKind via miroir-core (B0 smoke)", () => {
  it("routes runner_return_document and miroirCoreTransformers", () => {
    expect(inferIntegrationSessionKind(suiteDefinition(miroirTest_runner_return_document))).toBe("runner");
    expect(inferIntegrationSessionKind(suiteDefinition(miroirTest_miroirCoreTransformers))).toBe(
      "transformer",
    );
  });

  it("classifies execution capabilities for UI badges", () => {
    expect(
      classifyMiroirTestSuiteExecutionCapabilities(suiteDefinition(miroirTest_runner_return_document))
        .uiExecutionMode,
    ).toBe("integration");
    expect(
      classifyMiroirTestSuiteExecutionCapabilities(
        suiteDefinition(miroirTest_miroirCoreTransformers),
      ).uiExecutionMode,
    ).toBe("mixed");
  });
});
