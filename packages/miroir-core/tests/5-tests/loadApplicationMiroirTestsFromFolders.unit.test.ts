import { describe, expect, it } from "vitest";

import { MIROIR_TEST_SUITE_REGISTRY_NAMES } from "../../src/5_tests/miroirCoreTestSuiteRegistry";
import { MIROIR_RUNNER_TEST_SUITE_REGISTRY_NAMES } from "../../src/5_tests/parseMiroirRunnerTestCLIConfig";
import {
  listCliRunnerIntegrationSuiteKeys,
  listCliUnitSuiteKeys,
  resolveApplicationMiroirTestSuiteKey,
} from "../../src/5_tests/applicationMiroirTestCatalog";
import { APPLICATION_MIROIR_TEST_SOURCE_FOLDERS } from "../../src/5_tests/applicationMiroirTestFolders";
import {
  loadApplicationMiroirTestCatalog,
  loadMiroirCoreTestSuiteFromFolders,
} from "../../src/5_tests/loadApplicationMiroirTestsFromFolders";

describe("loadApplicationMiroirTestsFromFolders", () => {
  it("lists the known application MiroirTest folders", () => {
    expect(APPLICATION_MIROIR_TEST_SOURCE_FOLDERS.map((folder) => folder.applicationKey)).toEqual([
      "miroir",
      "library",
    ]);
  });

  it("discovers CLI unit and runner keys from those folders, covering the legacy snapshots", () => {
    const catalog = loadApplicationMiroirTestCatalog();
    const unitKeys = listCliUnitSuiteKeys(catalog);
    const runnerKeys = listCliRunnerIntegrationSuiteKeys(catalog);

    expect(catalog.length).toBeGreaterThanOrEqual(45);
    for (const key of MIROIR_TEST_SUITE_REGISTRY_NAMES) {
      const resolved = resolveApplicationMiroirTestSuiteKey(catalog, key);
      expect(resolved, key).toBeDefined();
      expect(unitKeys, key).toContain(resolved);
    }
    for (const key of MIROIR_RUNNER_TEST_SUITE_REGISTRY_NAMES) {
      expect(runnerKeys, key).toContain(key);
    }
    expect(unitKeys).not.toContain("runner_lend_document");
    expect(runnerKeys).toContain("runner_lend_document");
    expect(runnerKeys).toContain("runner_return_document");
  });

  it("loads suite JSON from application folders, including library runner suites", () => {
    const unitSuite = loadMiroirCoreTestSuiteFromFolders("mergePositionBased");
    expect(unitSuite.miroirTestType).toBe("miroirTestSuite");
    expect(unitSuite.miroirTestLabel).toBe("jzod.mergePositionBased");

    const lendSuite = loadMiroirCoreTestSuiteFromFolders("runner_lend_document");
    expect(lendSuite.miroirTestLabel).toBe("runner.lendDocument");
    expect(lendSuite.testbedInitApplicationParameters).toBe("libraryTestbedInitParams");
  });
});
