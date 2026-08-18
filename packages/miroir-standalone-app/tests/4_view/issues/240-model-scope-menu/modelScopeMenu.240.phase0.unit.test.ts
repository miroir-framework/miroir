import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import type { Menu, MiroirMenuItem } from "miroir-core";
import { menuDefaultLibrary } from "miroir-test-app_deployment-library";

import { resolveRepoRoot } from "../../../helpers/integrationTestProfiles.js";

const MIROIR_TEST_LIST_REPORT = "58dc6706-0473-468c-90ee-61b54b157140";
const ENTITY_DEFINITIONS_REPORT = "f9aff35d-8636-4519-8361-c7648e0ddc68";

function readJsonMenu(relativePathFromRepoRoot: string): Menu {
  const absolutePath = path.join(resolveRepoRoot(), relativePathFromRepoRoot);
  return JSON.parse(readFileSync(absolutePath, "utf8")) as Menu;
}

function complexMenuSections(menu: Menu) {
  expect(menu.definition.menuType).toBe("complexMenu");
  return menu.definition.definition;
}

function sectionItems(menu: Menu, sectionLabel: string): MiroirMenuItem[] {
  const section = complexMenuSections(menu).find((entry) => entry.label === sectionLabel);
  expect(section, `section ${sectionLabel}`).toBeDefined();
  return section!.items;
}

function allComplexMenuItems(menu: Menu): MiroirMenuItem[] {
  return complexMenuSections(menu).flatMap((section) => section.items);
}

function isReportLink(item: MiroirMenuItem): item is MiroirMenuItem & { reportUuid?: string } {
  return item.miroirMenuItemType === "miroirMenuReportLink";
}

function isDivider(item: MiroirMenuItem): boolean {
  return item.miroirMenuItemType === "miroirMenuItemDivider";
}

function countModelMarked(items: MiroirMenuItem[]) {
  return items.filter((item) => item.menuItemScope === "model").length;
}

function countModelReportLinks(items: MiroirMenuItem[]) {
  return items.filter((item) => isReportLink(item) && item.menuItemScope === "model").length;
}

function countDataScopedReportLinks(items: MiroirMenuItem[]) {
  return items.filter((item) => isReportLink(item) && item.menuItemScope === "data").length;
}

function readCreateApplicationAppDefaultMenuSource(): string {
  const runnerPath = path.join(
    resolveRepoRoot(),
    "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Runners/Runner_CreateApplication.tsx",
  );
  const source = readFileSync(runnerPath, "utf8");
  const start = source.indexOf("appDefaultMenu:");
  const end = source.indexOf("initParametersForTest:", start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe("#240 phase0 — menu asset inventories (pre-refactor locks)", () => {
  describe("Library menuDefaultLibrary", () => {
    const items = allComplexMenuItems(menuDefaultLibrary as Menu);

    it("has 18 items in the Library section", () => {
      expect(complexMenuSections(menuDefaultLibrary as Menu)).toHaveLength(1);
      expect(items).toHaveLength(18);
    });

    it("splits into 7 core model links, 1 unscoped Tests link, 2 model dividers, 6 data links, 2 evolution model links", () => {
      const coreModelReportLinks = items.filter(
        (item) =>
          isReportLink(item) &&
          item.menuItemScope === "model" &&
          item.label !== "Application Evolution Traces" &&
          item.label !== "Application Evolution Trace Events",
      );
      expect(coreModelReportLinks).toHaveLength(7);
      expect(
        items.filter(
          (item) =>
            isReportLink(item) &&
            item.reportUuid === MIROIR_TEST_LIST_REPORT &&
            item.menuItemScope === undefined,
        ),
      ).toHaveLength(1);
      expect(items.filter((item) => isDivider(item) && item.menuItemScope === "model")).toHaveLength(2);
      expect(items.filter((item) => isReportLink(item) && item.menuItemScope === undefined && item.section === "data")).toHaveLength(6);
      expect(
        items.filter(
          (item) =>
            isReportLink(item) &&
            item.menuItemScope === "model" &&
            (item.label === "Application Evolution Traces" ||
              item.label === "Application Evolution Trace Events"),
        ),
      ).toHaveLength(2);
    });
  });

  describe("Postgres PostgresManagerMenu (fs-read)", () => {
    const menu = readJsonMenu(
      "packages/miroir-test-app_deployment-postgres/assets/postgres_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json",
    );
    const items = allComplexMenuItems(menu);

    it("has 11 items", () => {
      expect(items).toHaveLength(11);
    });

    it("has 7 model-marked links, 1 model divider, 3 data-scoped links", () => {
      expect(countModelReportLinks(items)).toBe(7);
      expect(items.filter((item) => isDivider(item) && item.menuItemScope === "model")).toHaveLength(1);
      expect(countDataScopedReportLinks(items)).toBe(3);
      expect(countModelMarked(items)).toBe(8);
    });
  });

  describe("Designer DesignerMenu (fs-read)", () => {
    const menu = readJsonMenu(
      "packages/miroir-test-app_deployment-designer/assets/designer_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json",
    );

    it("Requirements section: 4 unscoped data links", () => {
      const requirements = sectionItems(menu, "requirements");
      expect(requirements).toHaveLength(4);
      expect(requirements.every((item) => isReportLink(item) && item.section === "data" && !item.menuItemScope)).toBe(true);
    });

    it("Designer section: Entities and Reports are model section without menuItemScope; Applications is data", () => {
      const designer = sectionItems(menu, "designer");
      expect(designer).toHaveLength(3);

      const entities = designer.find((item) => item.label === "Designer Entities");
      const applications = designer.find((item) => item.label === "Designer Applications");
      const reports = designer.find((item) => item.label === "Designer Reports");

      expect(entities).toMatchObject({ section: "model" });
      expect(applications).toMatchObject({ section: "data" });
      expect(reports).toMatchObject({ section: "model" });
      expect(entities?.menuItemScope).toBeUndefined();
      expect(applications?.menuItemScope).toBeUndefined();
      expect(reports?.menuItemScope).toBeUndefined();
    });
  });

  describe("CreateApplication runner appDefaultMenu source", () => {
    const appDefaultMenuSource = readCreateApplicationAppDefaultMenuSource();

    it("generates 8 model-marked report links and 1 model-marked divider, no data items", () => {
      const modelScopeCount = (appDefaultMenuSource.match(/menuItemScope: "model"/g) ?? []).length;
      const reportLinkCount = (appDefaultMenuSource.match(/miroirMenuItemType: "miroirMenuReportLink"/g) ?? []).length;
      const dividerCount = (appDefaultMenuSource.match(/miroirMenuItemType: "miroirMenuItemDivider"/g) ?? []).length;
      const dataScopeCount = (appDefaultMenuSource.match(/menuItemScope: "data"/g) ?? []).length;
      const sectionDataCount = (appDefaultMenuSource.match(/section: "data"/g) ?? []).length;

      expect(modelScopeCount).toBe(9);
      expect(reportLinkCount).toBe(8);
      expect(dividerCount).toBe(1);
      expect(dataScopeCount).toBe(0);
      expect(sectionDataCount).toBe(0);
    });

    it("includes Entity Definitions report uuid f9aff35d-…", () => {
      expect(appDefaultMenuSource).toContain(`reportUuid: "${ENTITY_DEFINITIONS_REPORT}"`);
    });
  });
});
