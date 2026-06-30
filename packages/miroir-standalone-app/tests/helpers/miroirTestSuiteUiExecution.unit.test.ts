import { describe, expect, it } from "vitest";

import { miroirTest_runner_library } from "miroir-test-app_deployment-library";
import { miroirTest_miroirCoreTransformers } from "miroir-test-app_deployment-miroir";
import type { MiroirTestSuite } from "miroir-core";

import {
  isUiIntegrationRunnerSuiteSupported,
  resolveMiroirTestSuiteUiExecutionMode,
  uiExecutionModeBadgeColors,
} from "../../src/miroir-fwk/4-tests/miroirTestSuiteUiExecution.js";

function suiteDefinition(instance: { definition: unknown }): MiroirTestSuite {
  return instance.definition as MiroirTestSuite;
}

describe("miroirTestSuiteUiExecution (B5)", () => {
  it("classifies runner_library as integration-only UI mode", () => {
    expect(resolveMiroirTestSuiteUiExecutionMode(suiteDefinition(miroirTest_runner_library))).toBe(
      "integration",
    );
  });

  it("classifies transformer suite as mixed", () => {
    expect(
      resolveMiroirTestSuiteUiExecutionMode(suiteDefinition(miroirTest_miroirCoreTransformers)),
    ).toBe("mixed");
  });

  it("marks runner_library as UI integration supported", () => {
    expect(isUiIntegrationRunnerSuiteSupported("runner_library")).toBe(true);
    expect(isUiIntegrationRunnerSuiteSupported("unknown_suite")).toBe(false);
  });

  it("returns badge colors for each execution mode", () => {
    expect(uiExecutionModeBadgeColors("unit").color).toBeTruthy();
    expect(uiExecutionModeBadgeColors("integration").color).toBeTruthy();
    expect(uiExecutionModeBadgeColors("mixed").color).toBeTruthy();
  });
});
