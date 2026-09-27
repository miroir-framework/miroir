import { describe, expect, it } from "vitest";

import {
  listMiroirTestSuiteKeys,
  loadMiroirCoreTestSuite,
} from "../../src/5_tests/miroirCoreTestSuiteRegistry";

describe("miroirTestSuiteRegistry (Phase 2)", () => {
  it("lists registered suite keys", () => {
    expect(listMiroirTestSuiteKeys()).toContain("fn.mlsToMls.mergePositionBased");
    expect(listMiroirTestSuiteKeys()).toContain("tr.resolveConditionalSchema.build");
    expect(listMiroirTestSuiteKeys()).toContain("fn.mustache.extractDoubleBracePatterns");
    expect(listMiroirTestSuiteKeys()).toContain("query.library.instances");
    expect(listMiroirTestSuiteKeys()).toContain("tr.admin.duplicateApplicationModel");
    expect(listMiroirTestSuiteKeys()).toContain("fn.tools.alterObjectAtPath");
    expect(listMiroirTestSuiteKeys().length).toBeGreaterThanOrEqual(30);
  });

  it("loads deployment export via dynamic import", async () => {
    const suiteExport = await loadMiroirCoreTestSuite("fn.mlsToMls.mergePositionBased");
    expect(suiteExport.miroirTestType).toBe("miroirTestSuite");
    expect(suiteExport.miroirTestLabel).toBe("fn.mlsToMls.mergePositionBased");
  });

  it("throws for unknown suite keys", async () => {
    await expect(loadMiroirCoreTestSuite("no_such_suite")).rejects.toThrow(/Unknown MiroirTest suite key/);
  });
});
