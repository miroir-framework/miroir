/**
 * #221 Slice 1 / Group C — Report subtree must pass `entityVersions`
 * into findEntityFromUuid (not `entityDefinitions`).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "../../../../..");
const VIEW_ROOT = join(REPO_ROOT, "packages/miroir-standalone-app/src/miroir-fwk/4_view");

/** Wrong-key shapes observed in Report findEntityFromUuid call sites. */
const FORBIDDEN_RESOLVE_KEY_PATTERNS: { file: string; pattern: RegExp; label: string }[] = [
  {
    file: "components/Reports/ReportViewWithEditor.tsx",
    pattern: /entityDefinitions:\s*miroirMapping/,
    label: "entityDefinitions: miroirMapping…",
  },
  {
    file: "components/Reports/ReportTools.ts",
    pattern: /entityDefinitions:\s*sectionMapping/,
    label: "entityDefinitions: sectionMapping…",
  },
  {
    file: "components/Reports/ReportSectionListDisplay.tsx",
    pattern: /findEntityFromUuid\(\s*\{\s*entities,\s*entityDefinitions\s*\}/,
    label: "findEntityFromUuid({ entities, entityDefinitions })",
  },
];

/** Mapping destructures that must bind entityVersions (property on DeploymentUuidToReportsEntitiesDefinitions). */
const MAPPING_DESTRUCTURE_FILES = [
  "routes/ReportDisplay.tsx",
  "components/Reports/ReportSectionListDisplay.tsx",
  "components/Reports/ReportSectionEntityInstance.tsx",
  "components/Reports/ReportSectionViewWithEditor.tsx",
] as const;

describe("221 Phase 1 — Report subtree resolve keys", () => {
  it("findEntityFromUuid call sites do not pass entityDefinitions key", () => {
    for (const { file, pattern, label } of FORBIDDEN_RESOLVE_KEY_PATTERNS) {
      const source = readFileSync(join(VIEW_ROOT, file), "utf8");
      expect(source, `${file} must not use ${label}`).not.toMatch(pattern);
    }
  });

  it("Report mapping destructures bind entityVersions (not entityDefinitions)", () => {
    for (const relativePath of MAPPING_DESTRUCTURE_FILES) {
      const source = readFileSync(join(VIEW_ROOT, relativePath), "utf8");
      expect(
        source,
        `${relativePath} must not destructure entityDefinitions from reports mapping`,
      ).not.toMatch(/\{\s*availableReports\s*,\s*entities\s*,\s*entityDefinitions\s*\}/);
      expect(
        source,
        `${relativePath} should destructure entityVersions from reports mapping`,
      ).toMatch(/\{\s*availableReports\s*,\s*entities\s*,\s*entityVersions\s*\}/);
    }
  });
});
