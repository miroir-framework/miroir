/**
 * #225 Phase 0 — lock Versioning UI contracts & characterize gaps (filesystem).
 *
 * Avoids importing miroir-core modules that pull deployment packages (fragile in
 * partial builds). Stable locks stay true; gap assertions flip when later phases land.
 */
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
const APP_BAR_PATH = join(
  REPO_ROOT,
  "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/AppBar.tsx",
);

/** Locked naming for later phases. */
export const VERSIONING_UI_225 = {
  runnerRegistryKey: "freezeApplicationVersion",
  runnerName: "freezeApplicationVersion",
  versioningReportName: "Versioning",
  versioningReportUuid: "c2b89408-bed7-473d-ab0a-2f4adc6a85e1",
  applicationVersionDetailsReportName: "ApplicationVersionDetails",
  applicationVersionDetailsReportUuid: "17e78252-2540-4003-9305-d85c0c02d7ba",
  freezeRunnerUuid: "20d51c4c-52e5-4077-baf3-5e87bd75e496",
  appBarIcon: "commit",
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

describe("225 Phase 0 — Versioning UI contracts", () => {
  it("locks freeze Action type string from #216 source", () => {
    const src = readFileSync(FREEZE_MODULE_PATH, "utf8");
    expect(src).toMatch(
      /FREEZE_APPLICATION_VERSION_ACTION_TYPE\s*=\s*"freezeApplicationVersion"/,
    );
    expect(VERSIONING_UI_225.runnerRegistryKey).toBe("freezeApplicationVersion");
  });

  it("locks Versioning UI naming constants", () => {
    expect(VERSIONING_UI_225.versioningReportName).toBe("Versioning");
    expect(VERSIONING_UI_225.applicationVersionDetailsReportName).toBe(
      "ApplicationVersionDetails",
    );
    expect(VERSIONING_UI_225.appBarIcon).toBe("commit");
    expect(VERSIONING_UI_225.modelEndpointUuid).toBe(
      "7947ae40-eb34-4149-887b-15a9021e714e",
    );
  });

  it("freezeApplicationVersion Runner asset exists (Phase 1)", () => {
    const freezeRunners = runnerJsonFiles().filter(
      (r) => r.name === VERSIONING_UI_225.runnerName,
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
    expect(step?.endpoint).toBe(VERSIONING_UI_225.modelEndpointUuid);
  });

  it("SelfApplicationVersion points to ApplicationVersionDetails report (Phase 3)", () => {
    const entity = JSON.parse(readFileSync(SAV_ENTITY_PATH, "utf8")) as Record<
      string,
      unknown
    >;
    expect(entity.uuid).toBe(VERSIONING_UI_225.selfApplicationVersionEntityUuid);
    expect(entity.defaultInstanceDetailsReportUuid).toBe(
      VERSIONING_UI_225.applicationVersionDetailsReportUuid,
    );
    const detailsPath = join(
      REPO_ROOT,
      `packages/miroir-test-app_deployment-miroir/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/${VERSIONING_UI_225.applicationVersionDetailsReportUuid}.json`,
    );
    expect(existsSync(detailsPath)).toBe(true);
    const details = JSON.parse(readFileSync(detailsPath, "utf8")) as {
      name: string;
      definition: { extractorTemplates: Record<string, { parentUuid: string }> };
    };
    expect(details.name).toBe(VERSIONING_UI_225.applicationVersionDetailsReportName);
    expect(
      details.definition.extractorTemplates.applicationVersion.parentUuid,
    ).toBe(VERSIONING_UI_225.selfApplicationVersionEntityUuid);
  });

  it("Versioning report embeds freeze Runner and filters SAV by application (Phase 4)", () => {
    const versioningPath = join(
      REPO_ROOT,
      `packages/miroir-test-app_deployment-miroir/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/${VERSIONING_UI_225.versioningReportUuid}.json`,
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
    expect(report.name).toBe(VERSIONING_UI_225.versioningReportName);
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
    expect(runnerSection?.definition.runner).toBe(VERSIONING_UI_225.freezeRunnerUuid);
    expect(runnerSection?.definition.runnerReportSectionType).toBe("storedRunner");
    const listSection = report.definition.section.definition.find(
      (s) => s.type === "objectListReportSection",
    );
    expect(listSection?.definition.parentUuid).toBe(
      VERSIONING_UI_225.selfApplicationVersionEntityUuid,
    );
    expect(report.definition.extractorTemplates.applicationVersions.filter?.attributeName).toBe(
      "selfApplication",
    );
    expect(
      report.definition.extractorTemplates.applicationVersions.filter?.value?.referenceName,
    ).toBe("application");
  });

  it("AppBar commit icon links to Versioning as Miroir scaffolding report (Phase 5)", () => {
    const appBar = readFileSync(APP_BAR_PATH, "utf8");
    expect(appBar.includes('icon: "commit"') || appBar.includes("icon: 'commit'")).toBe(true);
    expect(appBar.includes("Versioning")).toBe(true);
    expect(appBar.includes("reportVersioning")).toBe(true);
    expect(appBar.includes("resolveAppBarReportLinkApplication")).toBe(true);
    // Open under Miroir data section; in-report input steers target application.
    expect(appBar).toMatch(/label:\s*"Versioning"[\s\S]*?section:\s*"data"/);
  });

  it("ApplicationVersionList exists and is unscoped (Versioning report is new)", () => {
    const report = JSON.parse(readFileSync(AV_LIST_REPORT_PATH, "utf8")) as {
      uuid: string;
      name: string;
      definition: { extractorTemplates?: { applicationVersions?: { filter?: unknown } } };
    };
    expect(report.uuid).toBe(VERSIONING_UI_225.applicationVersionListReportUuid);
    expect(report.name).toBe("ApplicationVersionList");
    expect(report.definition.extractorTemplates?.applicationVersions?.filter).toBeUndefined();
  });
});
