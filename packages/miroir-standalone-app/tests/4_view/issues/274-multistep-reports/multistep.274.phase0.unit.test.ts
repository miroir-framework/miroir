import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  defaultMiroirModelEnvironment,
  report,
  rootReport,
  type Report,
  type ReportSection,
  type RootReport,
} from "miroir-core";

import {
  reportSectionsFormSchema,
  reportSectionsFormValue,
} from "../../../../src/miroir-fwk/4_view/components/Reports/ReportTools.js";
import { resolveRepoRoot } from "../../../helpers/integrationTestProfiles.js";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "multistep.274.phase0" ||
  RUN_TEST === "multistep.274.phase0.unit.test";

const REPORT_ENTITY_UUID = "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916";
const TABLE_DETAILS_UUID = "7c80d9ec-35b2-4cb8-8164-c5fe4e20687f";
const SCHEMA_DETAILS_UUID = "a72bb361-3126-4aa1-85cc-0be4d6838c84";
const MULTISTEP_COUNTRY_CREATE_UUID = "d2b2fbbd-6844-4422-8412-4e3c303296bc";
const MULTISTEP_COUNTRY_INSTANCE_UUID = "8f3c1a6e-2d47-4b91-9e05-c7a84b0d2e61";
const MULTISTEP_LAUNCH_PAD_UUID = "b6d9e2a1-4c58-4f70-8a13-9e2f0c5d7b44";

const REPO_ROOT = resolveRepoRoot();

const FUNDAMENTAL_TYPES_PATH = join(
  REPO_ROOT,
  "packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts",
);

const ASSET_TREES = [
  "packages/miroir-test-app_deployment-miroir/assets",
  "packages/miroir-test-app_deployment-admin/assets",
  "packages/miroir-test-app_deployment-library/assets",
  "packages/miroir-test-app_deployment-designer/assets",
  "packages/miroir-test-app_deployment-postgres/assets",
  "packages/miroir-test-app_deployment-spotify/assets",
];

const SKIP_WALK_DIRS = new Set(["node_modules", "dist", "graphify-out", ".git"]);

type ReportInventoryEntry = {
  uuid: string;
  name: string;
  type: string | null | undefined;
};

function extractExportTypeBlock(source: string, typeName: string): string {
  const marker = `export type ${typeName} =`;
  const start = source.indexOf(marker);
  expect(start).toBeGreaterThanOrEqual(0);
  const slice = source.slice(start);
  const end = slice.indexOf("\n};");
  expect(end).toBeGreaterThanOrEqual(0);
  return slice.slice(0, end + 3);
}

function collectReportInstances(root: string): ReportInventoryEntry[] {
  const found: ReportInventoryEntry[] = [];

  const walk = (dir: string) => {
    if (!existsSync(dir)) {
      return;
    }
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || SKIP_WALK_DIRS.has(entry.name)) {
        continue;
      }
      const full = join(dir, entry.name);
      if (entry.name === REPORT_ENTITY_UUID) {
        for (const fileName of readdirSync(full).filter((name) => name.endsWith(".json"))) {
          const instance = JSON.parse(readFileSync(join(full, fileName), "utf8")) as ReportInventoryEntry;
          if (instance.parentUuid === REPORT_ENTITY_UUID) {
            found.push(instance);
          }
        }
      } else {
        walk(full);
      }
    }
  };

  walk(root);
  return found;
}

function minimalValidReport(overrides: Partial<Report> = {}): Report {
  return {
    uuid: "00000000-0000-4000-8000-000000000001",
    parentUuid: REPORT_ENTITY_UUID,
    name: "phase0Fixture",
    defaultLabel: "Phase 0 fixture",
    definition: {
      section: {
        type: "list",
        definition: [],
      },
    },
    ...overrides,
  };
}

describe.skipIf(!shouldRun)("multistep reports #274 phase0 — current contracts", () => {
  it('generated Report.type is optional "list" | "grid" | "multistep"', () => {
    const source = readFileSync(FUNDAMENTAL_TYPES_PATH, "utf8");
    const reportTypeBlock = extractExportTypeBlock(source, "Report");
    const reportVersionTypeBlock = extractExportTypeBlock(source, "ReportVersion");

    expect(reportTypeBlock).toContain('type?: ("list" | "grid" | "multistep")');
    expect(reportVersionTypeBlock).toContain('type?: ("list" | "grid" | "multistep")');

    const listReport = minimalValidReport({ type: "list" });
    const gridReport = minimalValidReport({ type: "grid" });
    const multistepReport = minimalValidReport({ type: "multistep" });

    expect(report.safeParse(listReport).success).toBe(true);
    expect(report.safeParse(gridReport).success).toBe(true);
    expect(report.safeParse(multistepReport).success).toBe(true);
  });

  it("seed inventory: 87 Reports including MultistepCountryCreate, MultistepCountryInstance, and MultistepLaunchPad", () => {
    const reports = ASSET_TREES.flatMap((tree) =>
      collectReportInstances(join(REPO_ROOT, tree)),
    );

    const listReports = reports.filter((entry) => entry.type === "list");
    const gridReports = reports.filter((entry) => entry.type === "grid");
    const multistepReports = reports.filter((entry) => entry.type === "multistep");
    const omittedTypeReports = reports.filter((entry) => entry.type === undefined);
    const nullTypeReports = reports.filter((entry) => entry.type === null);

    expect(reports).toHaveLength(87);
    expect(listReports).toHaveLength(12);
    expect(gridReports).toHaveLength(0);
    expect(multistepReports).toHaveLength(2);
    expect(omittedTypeReports).toHaveLength(71);
    expect(nullTypeReports).toHaveLength(2);
    expect(nullTypeReports.map((entry) => ({ name: entry.name, uuid: entry.uuid }))).toEqual([
      { name: "TableDetails", uuid: TABLE_DETAILS_UUID },
      { name: "SchemaDetails", uuid: SCHEMA_DETAILS_UUID },
    ]);
    expect(multistepReports.map((entry) => ({ name: entry.name, uuid: entry.uuid }))).toEqual(
      expect.arrayContaining([
        { name: "MultistepCountryCreate", uuid: MULTISTEP_COUNTRY_CREATE_UUID },
        { name: "MultistepCountryInstance", uuid: MULTISTEP_COUNTRY_INSTANCE_UUID },
      ]),
    );
    expect(listReports.map((entry) => ({ name: entry.name, uuid: entry.uuid }))).toEqual(
      expect.arrayContaining([
        { name: "MultistepLaunchPad", uuid: MULTISTEP_LAUNCH_PAD_UUID },
      ]),
    );
  });

  it("RootReport has optional compositeActionSequence in generated types and zod schema", () => {
    const source = readFileSync(FUNDAMENTAL_TYPES_PATH, "utf8");
    const rootReportTypeBlock = extractExportTypeBlock(source, "RootReport");

    expect(rootReportTypeBlock).toContain("compositeActionSequence?");

    const validRootReport: RootReport = {
      section: {
        type: "list",
        definition: [],
      },
    };
    expect(rootReport.safeParse(validRootReport).success).toBe(true);
    expect(
      rootReport.safeParse({
        ...validRootReport,
        compositeActionSequence: [],
      }).success,
    ).toBe(false);
  });

  it("reportSectionsFormSchema throws for inputReportSection and returns {} for openReportSection", () => {
    const invoke = (reportSection: ReportSection) =>
      reportSectionsFormSchema(
        reportSection,
        "00000000-0000-4000-8000-000000000002",
        "00000000-0000-4000-8000-000000000003",
        {},
        { applicationUuid: "00000000-0000-4000-8000-000000000002", entities: [] },
        {},
        ["definition", "section"],
      );

    expect(() =>
      invoke({
        type: "inputReportSection",
        definition: {
          inputMLSchema: { type: "object", definition: {} },
        },
      }),
    ).toThrow(/reportSectionsFormSchema: report section type inputReportSection is not supported/);

    expect(
      invoke({
        type: "openReportSection",
        definition: {
          label: "Open",
          reportUuid: "00000000-0000-4000-8000-000000000004",
          openAs: "modal",
        },
      }),
    ).toEqual({});
  });

  it("reportSectionsFormValue default returns {} for runnerReportSection", () => {
    const result = reportSectionsFormValue(
      {},
      {
        type: "runnerReportSection",
        definition: {
          runnerReportSectionType: "storedRunner",
          runner: "00000000-0000-4000-8000-000000000000",
        },
      },
      ["definition", "section"],
      undefined,
      undefined,
      undefined,
      defaultMiroirModelEnvironment,
    );

    expect(result).toEqual({});
  });

  it("ReportViewWithEditor initialReportSectionsFormValue includes pageParams and report definition", () => {
    const source = readFileSync(
      join(
        REPO_ROOT,
        "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.tsx",
      ),
      "utf8",
    );

    expect(source).toContain("pageParams: props.pageParams");
    expect(source).toContain("[reportName]: props.reportDefinition");
    expect(source).toMatch(
      /import\s*\{[^}]*reportReportDetailsKey[^}]*\}\s*from\s*['"]\.\/InlineReportEditor\.js['"]/,
    );
  });

  it("ReportSectionEntityInstance still uses a no-op Formik onSubmit", () => {
    const source = readFileSync(
      join(
        REPO_ROOT,
        "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionEntityInstance.tsx",
      ),
      "utf8",
    );

    expect(source).toMatch(/<Formik[\s\S]*?onSubmit=\{\(\) => \{\}\}/);
  });
});
