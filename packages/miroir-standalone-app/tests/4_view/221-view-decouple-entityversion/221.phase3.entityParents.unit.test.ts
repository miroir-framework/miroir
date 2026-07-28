/**
 * #221 Slice 3 / Group B — parents pass Entity; deleteCascade Entity uuid identity.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  carrierIdentityUuid,
  findPresentModelSchemaCarrierByEntityUuid,
  reverseForeignKeysPointingToEntity,
} from "../../../src/miroir-fwk/4_view/scripts.js";

const REPO_ROOT = join(import.meta.dirname, "../../../../..");
const VIEW_ROOT = join(REPO_ROOT, "packages/miroir-standalone-app/src/miroir-fwk/4_view");

const authorEntity = {
  uuid: "author-uuid",
  name: "Author",
  mlSchema: {
    type: "object" as const,
    definition: {
      name: { type: "string" as const },
    },
  },
};

const bookEntity = {
  uuid: "book-uuid",
  name: "Book",
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

describe("221 Phase 3 — Entity parents + deleteCascade identity", () => {
  it("finds Entity carriers by uuid (no entityUuid) for cascade recursion", () => {
    const found = findPresentModelSchemaCarrierByEntityUuid(
      [authorEntity, bookEntity],
      "book-uuid",
    );
    expect(found?.name).toBe("Book");
    expect(carrierIdentityUuid(authorEntity)).toBe("author-uuid");
  });

  it("discovers reverse FKs from Entity-only schema carriers", () => {
    const pointing = reverseForeignKeysPointingToEntity(
      [authorEntity, bookEntity],
      "author-uuid",
    );
    expect(pointing).toEqual({ "book-uuid": "authorUuid" });
  });

  it("JsonObjectEditFormDialog requires entity and has no active entityVersion prop", () => {
    const source = readFileSync(
      join(VIEW_ROOT, "components/JsonObjectEditFormDialog.tsx"),
      "utf8",
    );
    expect(source).toMatch(/entity:\s*Entity/);
    // Strip line comments, then forbid entityVersion as a live prop declaration/pass
    const withoutLineComments = source.replace(/^\s*\/\/.*$/gm, "");
    expect(withoutLineComments).not.toMatch(/\bentityVersion\s*[:=]/);
  });

  it("Report list / grid pass entity= into edit dialog; deleteCascade uses entity param", () => {
    const list = readFileSync(
      join(VIEW_ROOT, "components/Reports/ReportSectionListDisplay.tsx"),
      "utf8",
    );
    const grid = readFileSync(
      join(VIEW_ROOT, "components/Grids/EntityInstanceGrid.tsx"),
      "utf8",
    );
    const scripts = readFileSync(join(VIEW_ROOT, "scripts.ts"), "utf8");

    expect(list).toMatch(/<JsonObjectEditFormDialog[\s\S]*?\bentity=\{/);
    expect(list).not.toMatch(/entityVersion=\{/);
    expect(list).toMatch(/deleteCascade\([\s\S]*?\bentity:/);

    expect(grid).toMatch(/<JsonObjectEditFormDialog[\s\S]*?\bentity=\{/);
    expect(grid).not.toMatch(/entityVersion=\{/);

    expect(scripts).toMatch(/export const deleteCascade[\s\S]*?\bentity:\s*PresentModelSchemaCarrier/);
    expect(scripts).not.toMatch(
      /export const deleteCascade[\s\S]*?\bentityVersion:\s*PresentModelSchemaCarrier/,
    );
    expect(scripts).toMatch(/findPresentModelSchemaCarrierByEntityUuid/);
  });

  it("GlideDataGridComponent has no currentEntityDefinition prop", () => {
    const source = readFileSync(
      join(VIEW_ROOT, "components/Grids/GlideDataGridComponent.tsx"),
      "utf8",
    );
    expect(source).not.toContain("currentEntityDefinition");
  });
});
