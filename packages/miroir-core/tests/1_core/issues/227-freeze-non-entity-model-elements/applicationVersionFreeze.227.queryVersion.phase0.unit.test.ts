/**
 * #227 Phase 0 — QueryVersion freeze contracts.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  APPLICATION_VERSION_CROSS_QUERY_VERSION_UUID,
  QUERY_VERSION_ENTITY_UUID,
  snapshotQueriesAsHistoricalQueryVersions,
} from "../../../../src/1_core/versioning/applicationVersionFreeze.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const freezeModulePath = join(
  __dirname,
  "../../../../src/1_core/versioning/applicationVersionFreeze.ts",
);

describe("227 Phase 0 — QueryVersion freeze contracts", () => {
  it("exports stable entity UUID constants", () => {
    expect(QUERY_VERSION_ENTITY_UUID).toBe("7f3a8b2c-4d1e-4f9a-b6c3-8e5d2a1f0b9c");
    expect(APPLICATION_VERSION_CROSS_QUERY_VERSION_UUID).toBe(
      "9e4c6d8a-2b5f-4a1c-9d7e-3f6b8a2c4e1d",
    );
  });

  it("exports snapshotQueriesAsHistoricalQueryVersions", () => {
    expect(typeof snapshotQueriesAsHistoricalQueryVersions).toBe("function");
  });

  it("FreezeApplicationVersionPlan includes QueryVersion fields", () => {
    const source = readFileSync(freezeModulePath, "utf8");
    expect(source).toMatch(/queryVersions:\s*QueryVersionSnapshot\[\]/);
    expect(source).toMatch(/crossQueryVersions:\s*ApplicationVersionCrossQueryVersionRow\[\]/);
    expect(source).toMatch(/queryVersionApplicationSection:\s*ApplicationSection/);
  });
});
