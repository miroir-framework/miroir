/**
 * #227 Phase 0 — RunnerVersion freeze contracts.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  APPLICATION_VERSION_CROSS_RUNNER_VERSION_UUID,
  RUNNER_VERSION_ENTITY_UUID,
  snapshotRunnersAsHistoricalRunnerVersions,
} from "../../../../src/1_core/versioning/applicationVersionFreeze.js";

const REPO_ROOT = join(import.meta.dirname, "../../../../../..");

describe("227 Phase 0 — RunnerVersion freeze contracts", () => {
  it("exports stable entity UUID constants", () => {
    expect(RUNNER_VERSION_ENTITY_UUID).toBe("e5f6a7b8-c9d0-4012-a3b4-c5d6e7f8a9b0");
    expect(APPLICATION_VERSION_CROSS_RUNNER_VERSION_UUID).toBe(
      "f6a7b8c9-d0e1-4123-a4b5-c6d7e8f9a0b1",
    );
  });

  it("exports snapshotRunnersAsHistoricalRunnerVersions", () => {
    expect(typeof snapshotRunnersAsHistoricalRunnerVersions).toBe("function");
  });

  it("FreezeApplicationVersionPlan includes RunnerVersion fields", () => {
    const source = readFileSync(
      join(REPO_ROOT, "packages/miroir-core/src/1_core/versioning/applicationVersionFreeze.ts"),
      "utf8",
    );
    expect(source).toMatch(/runnerVersions:\s*RunnerVersionSnapshot\[\]/);
    expect(source).toMatch(/crossRunnerVersions:\s*ApplicationVersionCrossRunnerVersionRow\[\]/);
    expect(source).toMatch(/runnerVersionApplicationSection:\s*ApplicationSection/);
  });
});
