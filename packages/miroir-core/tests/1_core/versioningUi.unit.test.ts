import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(import.meta.dirname, "../../../..");
const FREEZE_MODULE_PATH = join(
  REPO_ROOT,
  "packages/miroir-core/src/1_core/versioning/applicationVersionFreeze.ts",
);
const RUNNER_DATA_DIR = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd",
);
const SAV_ENTITY_PATH = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json",
);
const AV_LIST_REPORT_PATH = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/0810de28-fdab-4baf-8935-7e04a8f779a9.json",
);

const VERSIONING_UI = {
  runnerName: "freezeApplicationVersion",
  versioningReportName: "Versioning",
  versioningReportUuid: "c2b89408-bed7-473d-ab0a-2f4adc6a85e1",
  applicationVersionDetailsReportName: "ApplicationVersionDetails",
  applicationVersionDetailsReportUuid: "17e78252-2540-4003-9305-d85c0c02d7ba",
  freezeRunnerUuid: "20d51c4c-52e5-4077-baf3-5e87bd75e496",
  modelEndpointUuid: "7947ae40-eb34-4149-887b-15a9021e714e",
  selfApplicationVersionEntityUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
  applicationVersionListReportUuid: "0810de28-fdab-4baf-8935-7e04a8f779a9",
} as const;

function runnerJsonFiles(): { path: string; name: string }[] {
  if (!existsSync(RUNNER_DATA_DIR)) return [];
  return readdirSync(RUNNER_DATA_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const path = join(RUNNER_DATA_DIR, f);
      const raw = JSON.parse(readFileSync(path, "utf8")) as { name?: string };
      return { path, name: raw.name ?? "" };
    });
}

describe("Versioning UI contracts", () => {
  it("freeze Action type constant is freezeApplicationVersion", () => {
    const src = readFileSync(FREEZE_MODULE_PATH, "utf8");
    expect(src).toMatch(
      /FREEZE_APPLICATION_VERSION_ACTION_TYPE\s*=\s*"freezeApplicationVersion"/,
    );
  });

  it("freezeApplicationVersion Runner asset exists", () => {
    const freezeRunners = runnerJsonFiles().filter(
      (r) => r.name === VERSIONING_UI.runnerName,
    );
    expect(freezeRunners).toHaveLength(1);
    const raw = JSON.parse(readFileSync(freezeRunners[0].path, "utf8")) as {
      definition?: {
        compositeActionSequence?: {
          payload?: { actionSequence?: { actionType?: string; endpoint?: string }[] };
        };
      };
    };
    const step = raw.definition?.compositeActionSequence?.payload?.actionSequence?.[0];
    expect(step?.actionType).toBe("freezeApplicationVersion");
    expect(step?.endpoint).toBe(VERSIONING_UI.modelEndpointUuid);
  });

  it("SelfApplicationVersion points to ApplicationVersionDetails report", () => {
    const entity = JSON.parse(readFileSync(SAV_ENTITY_PATH, "utf8")) as Record<
      string,
      unknown
    >;
    expect(entity.uuid).toBe(VERSIONING_UI.selfApplicationVersionEntityUuid);
    expect(entity.defaultInstanceDetailsReportUuid).toBe(
      VERSIONING_UI.applicationVersionDetailsReportUuid,
    );
    const detailsPath = join(
      REPO_ROOT,
      `packages/miroir-test-app_deployment-miroir/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/${VERSIONING_UI.applicationVersionDetailsReportUuid}.json`,
    );
    expect(existsSync(detailsPath)).toBe(true);
    const details = JSON.parse(readFileSync(detailsPath, "utf8")) as {
      name: string;
      definition: {
        extractorTemplates: Record<string, { parentUuid: string }>;
        combinerTemplates?: Record<
          string,
          {
            extractorOrCombinerType?: string;
            parentUuid?: string;
            objectListReference?: string;
            objectListReferenceAttribute?: string;
          }
        >;
        section: {
          type: string;
          definition: Array<{
            type: string;
            definition: Record<string, unknown>;
          }>;
        };
      };
    };
    expect(details.name).toBe(VERSIONING_UI.applicationVersionDetailsReportName);
    expect(
      details.definition.extractorTemplates.applicationVersion.parentUuid,
    ).toBe(VERSIONING_UI.selfApplicationVersionEntityUuid);
    // EntityVersions linked via ApplicationVersionCrossEntityVersion (many-to-many).
    expect(details.definition.combinerTemplates?.["00_crossEntityVersions"]?.parentUuid).toBe(
      "8bec933d-6287-4de7-8a88-5c24216de9f4",
    );
    expect(details.definition.combinerTemplates?.["01_entityVersions"]?.extractorOrCombinerType).toBe(
      "combinerManyToMany",
    );
    expect(
      details.definition.combinerTemplates?.["01_entityVersions"]?.objectListReferenceAttribute,
    ).toBe("entityVersion");
    const entityVersionsSection = details.definition.section.definition.find(
      (s) =>
        s.type === "objectListReportSection" &&
        s.definition.fetchedDataReference === "01_entityVersions",
    );
    expect(entityVersionsSection?.definition.parentUuid).toBe(
      "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
    );
    const diagramSection = details.definition.section.definition.find(
      (s) => s.type === "modelDiagramReportSection",
    );
    expect(diagramSection?.definition.mode).toBe("EntityVersion");
    expect(
      (diagramSection?.definition.entityDefinitions as { referenceName?: string })?.referenceName,
    ).toBe("01_entityVersions");
    // QueryVersions linked via ApplicationVersionCrossQueryVersion.
    expect(details.definition.combinerTemplates?.["02_crossQueryVersions"]?.parentUuid).toBe(
      "9e4c6d8a-2b5f-4a1c-9d7e-3f6b8a2c4e1d",
    );
    expect(details.definition.combinerTemplates?.["03_queryVersions"]?.extractorOrCombinerType).toBe(
      "combinerManyToMany",
    );
    expect(
      details.definition.combinerTemplates?.["03_queryVersions"]?.objectListReferenceAttribute,
    ).toBe("queryVersion");
    const queryVersionsSection = details.definition.section.definition.find(
      (s) =>
        s.type === "objectListReportSection" &&
        s.definition.fetchedDataReference === "03_queryVersions",
    );
    expect(queryVersionsSection?.definition.label).toBe("Query Versions");
    expect(queryVersionsSection?.definition.parentUuid).toBe(
      "7f3a8b2c-4d1e-4f9a-b6c3-8e5d2a1f0b9c",
    );
    // ReportVersions linked via ApplicationVersionCrossReportVersion.
    expect(details.definition.combinerTemplates?.["04_crossReportVersions"]?.parentUuid).toBe(
      "f2b3c4d5-e6f7-4890-a1b2-c3d4e5f6a7b8",
    );
    expect(details.definition.combinerTemplates?.["05_reportVersions"]?.extractorOrCombinerType).toBe(
      "combinerManyToMany",
    );
    expect(
      details.definition.combinerTemplates?.["05_reportVersions"]?.objectListReferenceAttribute,
    ).toBe("reportVersion");
    const reportVersionsSection = details.definition.section.definition.find(
      (s) =>
        s.type === "objectListReportSection" &&
        s.definition.fetchedDataReference === "05_reportVersions",
    );
    expect(reportVersionsSection?.definition.label).toBe("Report Versions");
    expect(reportVersionsSection?.definition.parentUuid).toBe(
      "f1a2b3c4-d5e6-4789-a0a1-b2c3d4e5f6a7",
    );
    // MenuVersions linked via ApplicationVersionCrossMenuVersion.
    expect(details.definition.combinerTemplates?.["06_crossMenuVersions"]?.parentUuid).toBe(
      "b2c3d4e5-f6a7-4890-b1c2-d3e4f5a6b7c8",
    );
    expect(details.definition.combinerTemplates?.["07_menuVersions"]?.extractorOrCombinerType).toBe(
      "combinerManyToMany",
    );
    expect(
      details.definition.combinerTemplates?.["07_menuVersions"]?.objectListReferenceAttribute,
    ).toBe("menuVersion");
    const menuVersionsSection = details.definition.section.definition.find(
      (s) =>
        s.type === "objectListReportSection" &&
        s.definition.fetchedDataReference === "07_menuVersions",
    );
    expect(menuVersionsSection?.definition.label).toBe("Menu Versions");
    expect(menuVersionsSection?.definition.parentUuid).toBe(
      "a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7",
    );
  });

  it("Versioning report embeds freeze Runner and filters versions by application", () => {
    const versioningPath = join(
      REPO_ROOT,
      `packages/miroir-test-app_deployment-miroir/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/${VERSIONING_UI.versioningReportUuid}.json`,
    );
    expect(existsSync(versioningPath)).toBe(true);
    const report = JSON.parse(readFileSync(versioningPath, "utf8")) as {
      name: string;
      selfApplication: string;
      definition: {
        extractorTemplates: {
          applicationVersions: {
            filter?: { attributeName?: string; value?: { referenceName?: string } };
          };
        };
        section: {
          type: string;
          definition: Array<{
            type: string;
            definition: Record<string, unknown>;
          }>;
        };
      };
    };
    expect(report.name).toBe(VERSIONING_UI.versioningReportName);
    expect(report.selfApplication).toBe("360fcf1f-f0d4-4f8a-9262-07886e70fa15");
    expect(report.definition.section.type).toBe("list");
    const inputSection = report.definition.section.definition.find(
      (s) => s.type === "inputReportSection",
    );
    expect(inputSection?.definition.inputPrefix).toBe("versioningInput");
    expect(
      (inputSection?.definition.inputMLSchema as { definition?: { application?: unknown } })
        ?.definition?.application,
    ).toBeTruthy();
    const runnerSection = report.definition.section.definition.find(
      (s) => s.type === "runnerReportSection",
    );
    expect(runnerSection?.definition.runner).toBe(VERSIONING_UI.freezeRunnerUuid);
    expect(runnerSection?.definition.runnerReportSectionType).toBe("storedRunner");
    const listSection = report.definition.section.definition.find(
      (s) => s.type === "objectListReportSection",
    );
    expect(listSection?.definition.parentUuid).toBe(
      VERSIONING_UI.selfApplicationVersionEntityUuid,
    );
    expect(report.definition.extractorTemplates.applicationVersions.filter?.attributeName).toBe(
      "selfApplication",
    );
    expect(
      report.definition.extractorTemplates.applicationVersions.filter?.value?.referenceName,
    ).toBe("application");
  });

  it("ApplicationVersionList exists and is unscoped (Versioning report is new)", () => {
    const report = JSON.parse(readFileSync(AV_LIST_REPORT_PATH, "utf8")) as {
      uuid: string;
      name: string;
      definition: { extractorTemplates?: { applicationVersions?: { filter?: unknown } } };
    };
    expect(report.uuid).toBe(VERSIONING_UI.applicationVersionListReportUuid);
    expect(report.name).toBe("ApplicationVersionList");
    expect(report.definition.extractorTemplates?.applicationVersions?.filter).toBeUndefined();
  });
});
