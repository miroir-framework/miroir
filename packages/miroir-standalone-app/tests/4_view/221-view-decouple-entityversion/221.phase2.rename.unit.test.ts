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

  it("Reports context uses DeploymentUuidToReportsEntities* (not *EntitiesDefinitions*)", () => {
    const filesToScan = [
      "components/Page/RootComponent.tsx",
      "routes/ReportDisplay.tsx",
      "components/Reports/ReportTools.ts",
      "components/Reports/ReportViewWithEditor.tsx",
      "components/Reports/ReportSectionListDisplay.tsx",
      "components/Reports/ReportSectionViewWithEditor.tsx",
      "components/Reports/ReportSectionEntityInstance.tsx",
      "components/JsonObjectEditFormDialog.tsx",
    ];
    for (const relativePath of filesToScan) {
      const source = readFileSync(join(VIEW_ROOT, relativePath), "utf8");
      expect(source, `${relativePath}`).not.toMatch(/ReportsEntitiesDefinitions/);
      expect(source, `${relativePath}`).not.toMatch(
        /getReportsAndEntitiesDefinitionsForDeploymentUuid/,
      );
    }
    const root = readFileSync(join(VIEW_ROOT, "components/Page/RootComponent.tsx"), "utf8");
    expect(root).toMatch(/getReportsAndEntitiesForDeploymentUuid/);
    expect(root).toMatch(/deploymentUuidToReportsEntitiesMapping/);
  });

  it("diagram Report section / Mermaid use Entity carriers (mlSchema); EntityVersion is opt-in mode", () => {
    const section = readFileSync(
      join(VIEW_ROOT, "components/Reports/ModelDiagramReportSectionView.tsx"),
      "utf8",
    );
    // Present-model default remains Entity; EntityVersion mode is opt-in for versioning diagrams.
    expect(section).toMatch(/mode\?:\s*DiagramCarrierMode/);
    expect(section).toMatch(/coerceDiagramCarriersToEntities/);
    expect(section).toMatch(/buildEntityVersionClickLinks/);
    expect(section).not.toMatch(/\bdiagramCarriers\b/);
    expect(section).not.toMatch(/entities=\{entitiesWithSchema\}/);

    const editor = readFileSync(
      join(VIEW_ROOT, "components/Reports/ReportSectionViewWithEditor.tsx"),
      "utf8",
    );
    expect(editor).toMatch(/modelDiagramEntities:\s*Entity\[\]/);
    expect(editor).toMatch(/entities=\{modelDiagramEntities\}/);
    expect(editor).toMatch(/mode=\{modelDiagramMode\}/);
    expect(editor).toMatch(/reportEntityVersionDetails/);
    expect(editor).not.toMatch(/\bdiagramCarriers\b/);
    expect(editor).not.toMatch(/modelDiagramCarriers/);

    const mermaid = readFileSync(
      join(
        REPO_ROOT,
        "packages/miroir-diagram-class/src/4_view/MermaidClassDiagram.tsx",
      ),
      "utf8",
    );
    expect(mermaid).toMatch(/\bentities:\s*MermaidDiagramEntity\[\]/);
    expect(mermaid).toMatch(/entitiesToMermaidClassDiagram/);
    expect(mermaid).not.toMatch(/entityDefinitionsToMermaid/);
    expect(mermaid).not.toMatch(/\bdiagramCarriers:\s*EntityVersion/);
    expect(mermaid).not.toMatch(/\bentities:\s*EntityVersion/);
  });
});
