import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../../");

describe("WP1 evolution trace reports + menu", () => {
  it("ApplicationEvolutionTraceList report is importable with a uuid", async () => {
    const { reportApplicationEvolutionTraceList } = await import(
      "miroir-test-app_deployment-miroir"
    );
    expect(reportApplicationEvolutionTraceList).toBeDefined();
    expect(reportApplicationEvolutionTraceList.uuid).toBeTruthy();
  });

  it("ApplicationEvolutionTraceHistory report is importable with a uuid", async () => {
    const { reportApplicationEvolutionTraceHistory } = await import(
      "miroir-test-app_deployment-miroir"
    );
    expect(reportApplicationEvolutionTraceHistory).toBeDefined();
    expect(reportApplicationEvolutionTraceHistory.uuid).toBeTruthy();
  });

  it("ApplicationEvolutionTraceDetails report is importable with a uuid", async () => {
    const { reportApplicationEvolutionTraceDetails } = await import(
      "miroir-test-app_deployment-miroir"
    );
    expect(reportApplicationEvolutionTraceDetails).toBeDefined();
    expect(reportApplicationEvolutionTraceDetails.uuid).toBeTruthy();
    expect(reportApplicationEvolutionTraceDetails.name).toBe(
      "ApplicationEvolutionTraceDetails"
    );
  });

  it("default Miroir menu references both list report UUIDs", async () => {
    const {
      reportApplicationEvolutionTraceList,
      reportApplicationEvolutionTraceHistory,
      menuDefaultMiroir,
    } = await import("miroir-test-app_deployment-miroir");
    const menuJson = JSON.stringify(menuDefaultMiroir);
    expect(menuJson).toContain(reportApplicationEvolutionTraceList.uuid);
    expect(menuJson).toContain(reportApplicationEvolutionTraceHistory.uuid);
  });

  it("default Library menu references traces and events report UUIDs", async () => {
    const {
      reportApplicationEvolutionTraceList,
      reportApplicationEvolutionTraceHistory,
    } = await import("miroir-test-app_deployment-miroir");
    const libraryMenuPath = join(
      repoRoot,
      "packages/miroir-test-app_deployment-library/assets/library_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json"
    );
    const menuJson = readFileSync(libraryMenuPath, "utf8");
    expect(menuJson).toContain(reportApplicationEvolutionTraceList.uuid);
    expect(menuJson).toContain(reportApplicationEvolutionTraceHistory.uuid);
    expect(menuJson).toContain("Application Evolution Traces");
    expect(menuJson).toContain("Application Evolution Trace Events");
  });

  it("ApplicationEvolutionTrace entity definition points to the details report", async () => {
    const {
      entityDefinitionApplicationEvolutionTrace,
      reportApplicationEvolutionTraceDetails,
    } = await import("miroir-test-app_deployment-miroir");
    expect(
      entityDefinitionApplicationEvolutionTrace.defaultInstanceDetailsReportUuid
    ).toBe(reportApplicationEvolutionTraceDetails.uuid);
  });
});
