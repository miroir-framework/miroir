import { describe, expect, it } from "vitest";

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

  it("default Miroir menu references both new report UUIDs", async () => {
    const {
      reportApplicationEvolutionTraceList,
      reportApplicationEvolutionTraceHistory,
      menuDefaultMiroir,
    } = await import("miroir-test-app_deployment-miroir");
    const menuJson = JSON.stringify(menuDefaultMiroir);
    expect(menuJson).toContain(reportApplicationEvolutionTraceList.uuid);
    expect(menuJson).toContain(reportApplicationEvolutionTraceHistory.uuid);
  });
});
