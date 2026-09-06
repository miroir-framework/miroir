import { describe, expect, it } from "vitest";

import { MIROIR_TEST_SUITE_REGISTRY_NAMES } from "../../src/5_tests/miroirCoreTestSuiteRegistry";
import { MIROIR_RUNNER_TEST_SUITE_REGISTRY_NAMES } from "../../src/5_tests/parseMiroirRunnerTestCLIConfig";
import {
  listCliRunnerIntegrationSuiteKeys,
  listCliUnitSuiteKeys,
  resolveApplicationMiroirTestSuiteKey,
} from "../../src/5_tests/applicationMiroirTestCatalog";
import {
  APPLICATION_MIROIR_TEST_SOURCE_FOLDERS_LEGACY,
} from "../../src/5_tests/applicationMiroirTestFolders";
import {
  discoverApplicationMiroirTestSourceFolders,
  loadApplicationMiroirTestCatalog,
  loadApplicationRunnerUuidIndexFromFolders,
  loadMiroirCoreTestSuiteFromFolders,
} from "../../src/5_tests/loadApplicationMiroirTestsFromFolders";

describe("loadApplicationMiroirTestsFromFolders", () => {
  it("discovers MiroirTest folders under deployment packages, covering the legacy snapshot", () => {
    const discovered = discoverApplicationMiroirTestSourceFolders();
    expect(discovered.map((folder) => folder.applicationKey).sort()).toEqual(
      expect.arrayContaining(["library", "miroir"]),
    );
    for (const legacy of APPLICATION_MIROIR_TEST_SOURCE_FOLDERS_LEGACY) {
      expect(discovered).toContainEqual(legacy);
    }
  });

  it("loads Runner instances from sibling folders of those MiroirTest apps", () => {
    const index = loadApplicationRunnerUuidIndexFromFolders();
    expect(index["cc853632-f158-43fa-b9ed-437c9c25f539"]?.name).toBe("lendDocument");
    expect(index["98a38a84-e702-4540-a056-c7676a193a2b"]?.name).toBe("returnDocument");
    expect(index["dbb39e31-5c7d-4473-9adb-5286e2972e46"]?.name).toBe("mcpLendDocument");
    expect(index["82f81a25-2366-4abf-8a97-83ca5e9a9c46"]?.name).toBe("createEntity");
    expect(index["44313751-b0e5-4132-bb12-a544806e759b"]?.name).toBe("dropEntity");
    expect(Object.keys(index).length).toBeGreaterThanOrEqual(7);
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
