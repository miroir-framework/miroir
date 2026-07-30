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
  applicationVersionDetailsReportName: "ApplicationVersionDetails",
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

  it("gap: SelfApplicationVersion has no defaultInstanceDetailsReportUuid (Phase 3)", () => {
    const entity = JSON.parse(readFileSync(SAV_ENTITY_PATH, "utf8")) as Record<
      string,
      unknown
    >;
    expect(entity.uuid).toBe(VERSIONING_UI_225.selfApplicationVersionEntityUuid);
    expect(entity.defaultInstanceDetailsReportUuid).toBeUndefined();
  });

  it("gap: AppBar has no commit / Versioning report link yet (Phase 5)", () => {
    const appBar = readFileSync(APP_BAR_PATH, "utf8");
    expect(appBar.includes('icon: "commit"') || appBar.includes("icon: 'commit'")).toBe(
      false,
    );
    expect(appBar.includes("Versioning")).toBe(false);
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
