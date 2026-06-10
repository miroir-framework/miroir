import { describe, expect, it } from "vitest";

import {
  listMiroirTestSuiteKeys,
  loadMiroirTestSuiteExport,
} from "./miroirTestSuiteRegistry";

describe("miroirTestSuiteRegistry (Phase 2)", () => {
  it("lists registered suite keys", () => {
    expect(listMiroirTestSuiteKeys()).toContain("schema_pilot_empty");
    expect(listMiroirTestSuiteKeys()).toContain("pilot_transformer_plus");
    expect(listMiroirTestSuiteKeys()).toContain("mustache");
    expect(listMiroirTestSuiteKeys()).toContain("queries_library");
    expect(listMiroirTestSuiteKeys()).toContain("adminTransformers");
    expect(listMiroirTestSuiteKeys()).toContain("alterObject");
    expect(listMiroirTestSuiteKeys().length).toBeGreaterThanOrEqual(30);
  });

  it("loads deployment export via dynamic import", async () => {
    const suiteExport = await loadMiroirTestSuiteExport("schema_pilot_empty");
    expect(suiteExport.definition.miroirTestType).toBe("miroirTestSuite");
    expect(suiteExport.definition.miroirTestLabel).toBe("schema_pilot_empty");
  });

  it("throws for unknown suite keys", async () => {
    await expect(loadMiroirTestSuiteExport("no_such_suite")).rejects.toThrow(/Unknown MiroirTest suite key/);
  });
});
