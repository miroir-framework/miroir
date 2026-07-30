import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  findAdminEntityByName,
  getAdminModelDir,
  readJsonInstance,
  type AdminJsonInstance,
} from "./helpers/adminAssetInventory";

const REPORT_ENTITY_UUID = "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916";
const MENU_PATH =
  "dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json";
const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(PACKAGE_ROOT, "../..");

const EXPECTED_REPORT_NAMES = [
  "MiroirUserList",
  "MiroirUserDetails",
  "MiroirRightList",
  "MiroirRightDetails",
] as const;

function listReports(modelDir: string): AdminJsonInstance[] {
  const reportDir = join(modelDir, REPORT_ENTITY_UUID);
  return readdirSync(reportDir)
    .filter((n) => n.endsWith(".json"))
    .map((n) => readJsonInstance(join(reportDir, n)));
}

function findReportByName(name: string, modelDir: string): AdminJsonInstance | undefined {
  return listReports(modelDir).find((r) => r.name === name);
}

function collectFilesRecursively(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      collectFilesRecursively(full, acc);
    } else {
      acc.push(full);
    }
  }
  return acc;
}

/**
 * Phase 3 — Admin list/detail reports + menu for MiroirUser / MiroirRight (#219).
 */
describe("miroirUserRights.219.phase3 — Admin reports and menu", () => {
  const modelDir = getAdminModelDir();

  it("has MiroirUser and MiroirRight list and detail reports", () => {
    for (const name of EXPECTED_REPORT_NAMES) {
      const report = findReportByName(name, modelDir);
      expect(report, `missing report ${name}`).toBeDefined();
      expect(report?.uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(report?.parentUuid).toBe(REPORT_ENTITY_UUID);
    }
  });

  it("MiroirRight list/detail target MiroirRight and cover grant fields via entity viewAttributes", () => {
    const rightEntity = findAdminEntityByName("MiroirRight", modelDir);
    expect(rightEntity?.uuid).toBeTruthy();
    const viewAttributes = rightEntity?.viewAttributes as string[] | undefined;
    expect(viewAttributes).toEqual(
      expect.arrayContaining(["miroirUser", "capability", "targetType", "targetUuid"])
    );

    const list = findReportByName("MiroirRightList", modelDir) as Record<string, any>;
    const details = findReportByName("MiroirRightDetails", modelDir) as Record<string, any>;
    expect(list).toBeDefined();
    expect(details).toBeDefined();

    const listSection = list.definition?.section;
    expect(listSection?.type).toBe("objectListReportSection");
    expect(listSection?.definition?.parentUuid).toBe(rightEntity!.uuid);

    const detailSections = details.definition?.section?.definition;
    expect(Array.isArray(detailSections)).toBe(true);
    const instanceSection = detailSections.find(
      (s: any) => s.type === "objectInstanceReportSection"
    );
    expect(instanceSection?.definition?.parentUuid).toBe(rightEntity!.uuid);
  });

  it("AdminMenu references MiroirUserList and MiroirRightList reports", () => {
    const userList = findReportByName("MiroirUserList", modelDir);
    const rightList = findReportByName("MiroirRightList", modelDir);
    expect(userList?.uuid).toBeTruthy();
    expect(rightList?.uuid).toBeTruthy();

    const menu = readJsonInstance(join(modelDir, MENU_PATH)) as Record<string, any>;
    const items: any[] = menu.definition?.definition?.[0]?.items ?? [];
    const reportUuids = items
      .filter((i) => i.miroirMenuItemType === "miroirMenuReportLink")
      .map((i) => i.reportUuid);
    expect(reportUuids).toContain(userList!.uuid);
    expect(reportUuids).toContain(rightList!.uuid);
  });

  it("package index.ts exports the new reports", () => {
    const indexSource = readFileSync(join(PACKAGE_ROOT, "index.ts"), "utf8");
    expect(indexSource).toMatch(/export \{ default as reportMiroirUserList \}/);
    expect(indexSource).toMatch(/export \{ default as reportMiroirUserDetails \}/);
    expect(indexSource).toMatch(/export \{ default as reportMiroirRightList \}/);
    expect(indexSource).toMatch(/export \{ default as reportMiroirRightDetails \}/);
  });

  it("does not add dedicated MiroirUser/MiroirRight React CRUD form components", () => {
    const scanRoots = [
      join(REPO_ROOT, "packages/miroir-react/src"),
      join(REPO_ROOT, "packages/miroir-standalone-app/src"),
    ];
    const banned = /MiroirUser.*Form|MiroirRight.*Form|Form.*MiroirUser|Form.*MiroirRight/i;
    const hits: string[] = [];
    for (const root of scanRoots) {
      for (const file of collectFilesRecursively(root)) {
        if (!/\.(tsx?|jsx?)$/.test(file)) continue;
        if (banned.test(file)) hits.push(file);
      }
    }
    expect(hits).toEqual([]);
  });
});
