import { describe, expect, it } from "vitest";

import {
  RUNNER_LIBRARY_RUNNER_REGISTRY,
  resolveRunnerLibraryRunnerRef,
} from "miroir-test-app_deployment-library";
import { resolveRunnerFromRegistry } from "../../src/5_tests/resolveRunnerFromRegistry";

describe("runner library test registry (R6-E)", () => {
  it("resolveRunnerLibraryRunnerRef returns lendDocument runner", () => {
    const runner = resolveRunnerLibraryRunnerRef("lendDocument");
    expect(runner).toBe(RUNNER_LIBRARY_RUNNER_REGISTRY.lendDocument);
    expect(runner.name).toBe("lendDocument");
  });

  it("resolveRunnerFromRegistry resolves from suite-local map", () => {
    const runner = resolveRunnerFromRegistry(RUNNER_LIBRARY_RUNNER_REGISTRY, "returnDocument");
    expect(runner.name).toBe("returnDocument");
  });

  it("throws for unknown runnerRef", () => {
    expect(() => resolveRunnerLibraryRunnerRef("unknownRunner")).toThrow(
      "Unknown runnerRef for runner.library suite: unknownRunner",
    );
  });
});
