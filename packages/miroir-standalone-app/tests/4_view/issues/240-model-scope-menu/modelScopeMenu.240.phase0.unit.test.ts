import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import type { Menu, MiroirMenuItem, MiroirMenuReportLink } from "miroir-core";
import { menuDefaultLibrary } from "miroir-test-app_deployment-library";

import { resolveRepoRoot } from "../../../helpers/integrationTestProfiles.js";

function readJsonMenu(relativePathFromRepoRoot: string): Menu {
  const absolutePath = path.join(resolveRepoRoot(), relativePathFromRepoRoot);
  return JSON.parse(readFileSync(absolutePath, "utf8")) as Menu;
}

function complexMenuSections(menu: Menu) {
  const menuDefinition = menu.definition;
  if (menuDefinition.menuType !== "complexMenu") {
    throw new Error(`expected complexMenu, got ${menuDefinition.menuType}`);
  }
  return menuDefinition.definition;
}

function sectionItems(menu: Menu, sectionLabel: string): MiroirMenuItem[] {
  const section = complexMenuSections(menu).find((entry) => entry.label === sectionLabel);
  expect(section, `section ${sectionLabel}`).toBeDefined();
  return section!.items;
}

function allComplexMenuItems(menu: Menu): MiroirMenuItem[] {
  return complexMenuSections(menu).flatMap((section) => section.items);
}

function isReportLink(item: MiroirMenuItem): item is MiroirMenuReportLink {
  return item.miroirMenuItemType === "miroirMenuReportLink";
}

function isDivider(item: MiroirMenuItem): boolean {
  return item.miroirMenuItemType === "miroirMenuItemDivider";
}

function countModelMarked(items: MiroirMenuItem[]) {
  return items.filter((item) => "menuItemScope" in item && item.menuItemScope === "model").length;
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

    it("has 6 data-only items in the Library section (post–slice 4 cleanup)", () => {
      expect(complexMenuSections(menuDefaultLibrary as Menu)).toHaveLength(1);
      expect(items).toHaveLength(6);
    });

    it("contains only unscoped data report links — no model-scope or divider items", () => {
      expect(items.every((item) => isReportLink(item) && item.section === "data")).toBe(true);
      expect(items.every((item) => isReportLink(item) && item.menuItemScope === undefined)).toBe(true);
      expect(items.filter((item) => isDivider(item))).toHaveLength(0);
      expect(countModelMarked(items)).toBe(0);
      expect(
        items.map((item) => (isReportLink(item) ? item.label : undefined)),
      ).toEqual([
        "Library Books",
        "Library Authors",
        "Library Publishers",
        "Library countries",
        "Library Users",
        "Library Lending History",
      ]);
    });
  });

  describe("Postgres PostgresManagerMenu (fs-read)", () => {
    const menu = readJsonMenu(
      "packages/miroir-test-app_deployment-postgres/assets/postgres_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json",
    );
    const items = allComplexMenuItems(menu);

    it("has 3 data-scoped items (post–slice 5 cleanup)", () => {
      expect(items).toHaveLength(3);
    });

    it("contains only data-scoped report links — no model items or dividers", () => {
      expect(items.every((item) => isReportLink(item) && item.section === "data")).toBe(true);
      expect(countDataScopedReportLinks(items)).toBe(3);
      expect(countModelReportLinks(items)).toBe(0);
      expect(countModelMarked(items)).toBe(0);
      expect(items.filter((item) => isDivider(item))).toHaveLength(0);
      expect(
        items.map((item) => (isReportLink(item) ? item.label : undefined)),
      ).toEqual(["Postgres Schemas", "Postgres Tables", "Postgres Table Columns"]);
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
      for (const item of [entities, applications, reports]) {
        expect(item).toBeDefined();
        expect(isReportLink(item!)).toBe(true);
        expect((item as MiroirMenuReportLink).menuItemScope).toBeUndefined();
      }
    });
  });

  describe("CreateApplication runner appDefaultMenu source", () => {
    const appDefaultMenuSource = readCreateApplicationAppDefaultMenuSource();

    it("generates an empty items array — no model-scope menu items", () => {
      expect(appDefaultMenuSource).toContain("items: []");
      expect(appDefaultMenuSource.match(/menuItemScope: "model"/g) ?? []).toHaveLength(0);
      expect(appDefaultMenuSource.match(/miroirMenuItemType: "miroirMenuReportLink"/g) ?? []).toHaveLength(0);
      expect(appDefaultMenuSource.match(/miroirMenuItemType: "miroirMenuItemDivider"/g) ?? []).toHaveLength(0);
    });

    it("keeps a valid complexMenu section shell", () => {
      expect(appDefaultMenuSource).toContain('menuType: "complexMenu"');
      expect(appDefaultMenuSource).toContain("{{createApplicationAndDeployment.applicationName}} Menu");
      expect(appDefaultMenuSource).toContain("{{createApplicationAndDeployment.applicationName}}");
    });
  });
});
