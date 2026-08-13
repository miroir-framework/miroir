/**
 * #227 Phase 0 — MenuVersion freeze contracts.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  APPLICATION_VERSION_CROSS_MENU_VERSION_UUID,
  MENU_VERSION_ENTITY_UUID,
  snapshotMenusAsHistoricalMenuVersions,
} from "../../src/1_core/versioning/applicationVersionFreeze.js";

const REPO_ROOT = join(import.meta.dirname, "../../../..");

describe("227 Phase 0 — MenuVersion freeze contracts", () => {
  it("exports stable entity UUID constants", () => {
    expect(MENU_VERSION_ENTITY_UUID).toBe("a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7");
    expect(APPLICATION_VERSION_CROSS_MENU_VERSION_UUID).toBe(
      "b2c3d4e5-f6a7-4890-b1c2-d3e4f5a6b7c8",
    );
  });

  it("exports snapshotMenusAsHistoricalMenuVersions", () => {
    expect(typeof snapshotMenusAsHistoricalMenuVersions).toBe("function");
  });

  it("FreezeApplicationVersionPlan includes MenuVersion fields", () => {
    const source = readFileSync(
      join(REPO_ROOT, "packages/miroir-core/src/1_core/versioning/applicationVersionFreeze.ts"),
      "utf8",
    );
    expect(source).toMatch(/menuVersions:\s*MenuVersionSnapshot\[\]/);
    expect(source).toMatch(/crossMenuVersions:\s*ApplicationVersionCrossMenuVersionRow\[\]/);
    expect(source).toMatch(/menuVersionApplicationSection:\s*ApplicationSection/);
  });
});
