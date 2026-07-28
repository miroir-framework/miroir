/**
 * #221 Slice 2 / Group A — rename present-model vocabulary in dialogs + column helper.
 * No parent plumbing change: Entity / JzodObject already flow; names must match.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getMDataGridColumnDefinitionsFromEntity } from "../../../src/miroir-fwk/4_view/getColumnDefinitionsFromEntityAttributes.js";

const REPO_ROOT = join(import.meta.dirname, "../../../../..");
const VIEW_ROOT = join(REPO_ROOT, "packages/miroir-standalone-app/src/miroir-fwk/4_view");

const bookEntityShape = {
  uuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  name: "Book",
  viewAttributes: ["title", "author"],
  mlSchema: {
    type: "object" as const,
    definition: {
      title: { type: "string" as const },
      author: { type: "uuid" as const },
      isbn: { type: "string" as const },
    },
  },
};

describe("221 Phase 2 — rename present-model view vocabulary", () => {
  it("getMDataGridColumnDefinitionsFromEntity builds columns from Entity mlSchema + viewAttributes", () => {
    const cols = getMDataGridColumnDefinitionsFromEntity(
      "deployment-uuid",
      bookEntityShape.mlSchema,
      undefined,
      bookEntityShape,
    );
    expect(cols.map((c) => c.field)).toEqual(["title", "author"]);
    expect(cols.every((c) => c.headerName)).toBe(true);
  });

  it("dialogs expose mlSchema prop and no longer entityDefinitionJzodSchema", () => {
    for (const relativePath of [
      "components/JsonObjectEditFormDialog.tsx",
      "components/JsonObjectDeleteFormDialog.tsx",
    ]) {
      const source = readFileSync(join(VIEW_ROOT, relativePath), "utf8");
      expect(source, `${relativePath} must not declare entityDefinitionJzodSchema`).not.toMatch(
        /\bentityDefinitionJzodSchema\b/,
      );
      expect(source, `${relativePath} should declare mlSchema: JzodObject`).toMatch(
        /\bmlSchema\s*:\s*JzodObject\b/,
      );
    }
  });

  it("4_view has no leftover entityDefinitionJzodSchema or FromEntityDefinition helper name", () => {
    const filesToScan = [
      "getColumnDefinitionsFromEntityAttributes.ts",
      "components/JsonObjectEditFormDialog.tsx",
      "components/JsonObjectDeleteFormDialog.tsx",
      "components/Reports/ReportSectionListDisplay.tsx",
      "components/Grids/EntityInstanceGrid.tsx",
      "components/Grids/ValueObjectGridInterface.ts",
      "components/Grids/EntityInstanceCellRenderer.tsx",
    ];
    for (const relativePath of filesToScan) {
      const source = readFileSync(join(VIEW_ROOT, relativePath), "utf8");
      expect(source, `${relativePath}`).not.toContain("entityDefinitionJzodSchema");
      expect(source, `${relativePath}`).not.toContain(
        "getMDataGridColumnDefinitionsFromEntityDefinition",
      );
    }
  });
});
