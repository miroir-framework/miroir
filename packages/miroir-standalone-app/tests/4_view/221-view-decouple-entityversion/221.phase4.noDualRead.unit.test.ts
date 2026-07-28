/**
 * #221 Slice 4 / Group D — remove EntityVersion dual-read from live Report/grid/FK/cascade.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  analyzeForeignKeyAttributes,
} from "../../../src/miroir-fwk/4_view/utils/foreignKeyAttributeAnalyzer.js";

const REPO_ROOT = join(import.meta.dirname, "../../../../..");
const VIEW_ROOT = join(REPO_ROOT, "packages/miroir-standalone-app/src/miroir-fwk/4_view");

const authorEntity = {
  uuid: "author-uuid",
  name: "Author",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  parentName: "Entity" as const,
  mlSchema: {
    type: "object" as const,
    definition: {
      name: { type: "string" as const },
      countryUuid: {
        type: "uuid" as const,
        tag: { value: { foreignKeyParams: { targetEntity: "country-uuid" } } },
      },
    },
  },
};

const bookEntity = {
  uuid: "book-uuid",
  name: "Book",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  parentName: "Entity" as const,
  mlSchema: {
    type: "object" as const,
    definition: {
      title: { type: "string" as const },
      authorUuid: {
        type: "uuid" as const,
        tag: { value: { foreignKeyParams: { targetEntity: "author-uuid" } } },
      },
    },
  },
};

const countryEntity = {
  uuid: "country-uuid",
  name: "Country",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  parentName: "Entity" as const,
  mlSchema: {
    type: "object" as const,
    definition: { name: { type: "string" as const } },
  },
};

describe("221 Phase 4 — remove dual-read fallbacks", () => {
  it("FK analyzer resolves Entity carriers by uuid only", () => {
    const result = analyzeForeignKeyAttributes(bookEntity, [bookEntity, authorEntity, countryEntity], {
      includeTransitive: true,
    });
    expect(result.find((fk) => fk.attributeName === "authorUuid")).toBeDefined();
    expect(result.find((fk) => fk.attributeName === "__fk_country-uuid")).toBeDefined();
  });


  it("EntityInstanceGrid has no currentEntityDefinition dual-read", () => {
    const grid = readFileSync(join(VIEW_ROOT, "components/Grids/EntityInstanceGrid.tsx"), "utf8");
    const iface = readFileSync(
      join(VIEW_ROOT, "components/Grids/EntityInstanceGridInterface.ts"),
      "utf8",
    );
    expect(grid).not.toContain("currentEntityDefinition");
    expect(iface).not.toContain("currentEntityDefinition");
    expect(iface).not.toMatch(/\bentityVersion\b/);
  });

  it("deleteCascade and list FK walk take entities only (no entityDefinitions param/list)", () => {
    const scripts = readFileSync(join(VIEW_ROOT, "scripts.ts"), "utf8");
    const list = readFileSync(
      join(VIEW_ROOT, "components/Reports/ReportSectionListDisplay.tsx"),
      "utf8",
    );
    // deleteCascade signature: no entityDefinitions
    expect(scripts).toMatch(/export const deleteCascade[\s\S]*?\bentities:\s*Entity\[\]/);
    expect(scripts).not.toMatch(/export const deleteCascade[\s\S]*?\bentityDefinitions\??:/);
    // list deleteCascade call
    expect(list).toMatch(/deleteCascade\([\s\S]*?\bentities:/);
    expect(list).not.toMatch(/deleteCascade\([\s\S]*?\bentityDefinitions:/);
    // list FK analyzer uses entities only (not entityVersions concat)
    expect(list).not.toMatch(/analyzeForeignKeyAttributes\([\s\S]*?entityVersions/);
  });

  it("foreignKeyAttributeAnalyzer is Entity-uuid identity (no entityUuid dual-read)", () => {
    const source = readFileSync(join(VIEW_ROOT, "utils/foreignKeyAttributeAnalyzer.ts"), "utf8");
    expect(source).not.toMatch(/entityUuid\s*\?\?/);
    expect(source).toMatch(/carrier\.uuid/);
  });
});
