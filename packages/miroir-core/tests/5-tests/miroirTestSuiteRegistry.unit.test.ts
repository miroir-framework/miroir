import { describe, expect, it } from "vitest";

import {
  listMiroirTestSuiteKeys,
  loadMiroirCoreTestSuite,
} from "../../src/5_tests/miroirCoreTestSuiteRegistry";

describe("miroirTestSuiteRegistry (Phase 2)", () => {
  it("lists registered suite keys", () => {
    expect(listMiroirTestSuiteKeys()).toContain("mergePositionBased");
    expect(listMiroirTestSuiteKeys()).toContain("pilot_transformer_plus");
    expect(listMiroirTestSuiteKeys()).toContain("mustache");
    expect(listMiroirTestSuiteKeys()).toContain("queries_library");
    expect(listMiroirTestSuiteKeys()).toContain("adminTransformers");
    expect(listMiroirTestSuiteKeys()).toContain("alterObject");
    expect(listMiroirTestSuiteKeys().length).toBeGreaterThanOrEqual(30);
  });

  it("loads deployment export via dynamic import", async () => {
    const suiteExport = await loadMiroirCoreTestSuite("mergePositionBased");
    expect(suiteExport.miroirTestType).toBe("miroirTestSuite");
    expect(suiteExport.miroirTestLabel).toBe("jzod.mergePositionBased");
  });

  it("throws for unknown suite keys", async () => {
    await expect(loadMiroirCoreTestSuite("no_such_suite")).rejects.toThrow(/Unknown MiroirTest suite key/);
  });
});
