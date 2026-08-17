/**
 * #227 Phase 0 — ReportVersion freeze contracts.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  APPLICATION_VERSION_CROSS_REPORT_VERSION_UUID,
  REPORT_VERSION_ENTITY_UUID,
  snapshotReportsAsHistoricalReportVersions,
} from "../../../../src/1_core/versioning/applicationVersionFreeze.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const freezeModulePath = join(
  __dirname,
  "../../../../src/1_core/versioning/applicationVersionFreeze.ts",
);

describe("227 Phase 0 — ReportVersion freeze contracts", () => {
  it("exports stable entity UUID constants", () => {
    expect(REPORT_VERSION_ENTITY_UUID).toBe("f1a2b3c4-d5e6-4789-a0a1-b2c3d4e5f6a7");
    expect(APPLICATION_VERSION_CROSS_REPORT_VERSION_UUID).toBe(
      "f2b3c4d5-e6f7-4890-a1b2-c3d4e5f6a7b8",
    );
  });

  it("exports snapshotReportsAsHistoricalReportVersions", () => {
    expect(typeof snapshotReportsAsHistoricalReportVersions).toBe("function");
  });

  it("FreezeApplicationVersionPlan includes ReportVersion fields", () => {
    const source = readFileSync(freezeModulePath, "utf8");
    expect(source).toMatch(/reportVersions:\s*ReportVersionSnapshot\[\]/);
    expect(source).toMatch(/crossReportVersions:\s*ApplicationVersionCrossReportVersionRow\[\]/);
    expect(source).toMatch(/reportVersionApplicationSection:\s*ApplicationSection/);
  });
});
