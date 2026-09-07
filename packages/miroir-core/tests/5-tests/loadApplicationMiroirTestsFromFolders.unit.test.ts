import { describe, expect, it } from "vitest";

import { MIROIR_TEST_SUITE_REGISTRY_NAMES } from "../../src/5_tests/miroirCoreTestSuiteRegistry";
import { MIROIR_RUNNER_TEST_SUITE_REGISTRY_NAMES } from "../../src/5_tests/parseMiroirRunnerTestCLIConfig";
import {
  listCliRunnerIntegrationSuiteKeys,
  listCliUnitSuiteKeys,
  resolveApplicationMiroirTestSuiteKey,
  resolveApplicationMiroirTestSuiteKeys,
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
    const leftoverSnapshotToName: Record<string, string> = {
      alterObject: "alterObject_atPath",
      jzodTypeCheck: "jzodTypeCheck_TransformerTestSuite",
      menu: "menu_build",
      metaModelTransformers: "metaModelTransformersTest",
    };
    for (const key of MIROIR_TEST_SUITE_REGISTRY_NAMES) {
      const targetName = leftoverSnapshotToName[key] ?? key;
      expect(unitKeys, key).toContain(targetName);
      expect(resolveApplicationMiroirTestSuiteKey(catalog, targetName), targetName).toBe(
        targetName,
      );
      if (leftoverSnapshotToName[key]) {
        expect(resolveApplicationMiroirTestSuiteKey(catalog, key), key).toBeUndefined();
      }
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

  it("rejects Table C leftover aliases and points label tokens at instance name", () => {
    const catalog = loadApplicationMiroirTestCatalog();
    const leftoverAliases: Array<[string, string]> = [
      ["menu", "menu_build"],
      ["jzodTypeCheck", "jzodTypeCheck_TransformerTestSuite"],
      ["alterObject", "alterObject_atPath"],
      ["metaModelTransformers", "metaModelTransformersTest"],
      ["runner.returnDocument", "runner_return_document"],
    ];
    for (const [token, targetName] of leftoverAliases) {
      expect(resolveApplicationMiroirTestSuiteKey(catalog, token), token).toBeUndefined();
      expect(resolveApplicationMiroirTestSuiteKey(catalog, targetName), targetName).toBe(
        targetName,
      );
    }
    expect(() => resolveApplicationMiroirTestSuiteKeys(catalog, ["jzodTypeCheck"])).toThrow(
      /Did you mean "jzodTypeCheck_TransformerTestSuite"/,
    );
    expect(() => resolveApplicationMiroirTestSuiteKeys(catalog, ["runner.returnDocument"])).toThrow(
      /Did you mean "runner_return_document"/,
    );
    expect(() => resolveApplicationMiroirTestSuiteKeys(catalog, ["menu"])).toThrow(
      /Unknown suite key "menu". Use instance name. Available:/,
    );
    expect(() => resolveApplicationMiroirTestSuiteKeys(catalog, ["no_such_suite"])).toThrow(
      /Unknown suite key "no_such_suite". Use instance name. Available:/,
    );
  });
});
