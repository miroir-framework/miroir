import { describe, expect, it } from "vitest";

import { MIROIR_TEST_SUITE_REGISTRY_NAMES } from "../../src/5_tests/miroirCoreTestSuiteRegistry";
import { MIROIR_RUNNER_TEST_SUITE_REGISTRY_NAMES } from "../../src/5_tests/parseMiroirRunnerTestCLIConfig";
import type { MiroirTestDefinition } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  buildApplicationMiroirTestCatalog,
  listCliRunnerIntegrationSuiteKeys,
  listCliUnitSuiteKeys,
  resolveApplicationMiroirTestSuiteKey,
  resolveApplicationMiroirTestSuiteKeys,
} from "../../src/5_tests/applicationMiroirTestCatalog";
import {
  APPLICATION_MIROIR_TEST_SOURCE_FOLDERS_LEGACY,
  ENTITY_MIROIR_TEST_UUID,
  deploymentPackageApplicationKey,
} from "../../src/5_tests/applicationMiroirTestFolders";
import {
  discoverApplicationMiroirTestSourceFolders,
  loadApplicationMiroirTestCatalog,
  loadApplicationRunnerUuidIndexFromFolders,
  loadMiroirCoreTestSuiteFromFolders,
} from "../../src/5_tests/loadApplicationMiroirTestsFromFolders";

describe("loadApplicationMiroirTestsFromFolders", () => {
  it("reads the application key from framework, example and fixture package names (#344)", () => {
    expect(deploymentPackageApplicationKey("miroir-app-admin")).toBe("admin");
    expect(deploymentPackageApplicationKey("miroir-example-library")).toBe("library");
    expect(deploymentPackageApplicationKey("miroir-fixture-appForTest")).toBe("appForTest");
    expect(deploymentPackageApplicationKey("miroir-core")).toBeUndefined();
  });

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
      expect(unitKeys, key).toContain(key);
      expect(resolveApplicationMiroirTestSuiteKey(catalog, key), key).toBe(key);
    }
    for (const key of MIROIR_RUNNER_TEST_SUITE_REGISTRY_NAMES) {
      expect(runnerKeys, key).toContain(key);
    }
    expect(unitKeys).not.toContain("runner.lendDocument");
    expect(runnerKeys).toContain("runner.lendDocument");
    expect(runnerKeys).toContain("runner.returnDocument");
  });

  it("loads suite JSON from application folders, including library runner suites", () => {
    const unitSuite = loadMiroirCoreTestSuiteFromFolders("fn.mlsToMls.mergePositionBased");
    expect(unitSuite.miroirTestType).toBe("miroirTestSuite");
    expect(unitSuite.miroirTestLabel).toBe("fn.mlsToMls.mergePositionBased");

    const lendSuite = loadMiroirCoreTestSuiteFromFolders("runner.lendDocument");
    expect(lendSuite.miroirTestLabel).toBe("runner.lendDocument");
    expect(lendSuite.testbedInitApplicationParameters).toBe("libraryTestbedInitParams");
  });

  it("rejects Table C leftover aliases and points label tokens at instance name", () => {
    const catalog = loadApplicationMiroirTestCatalog();
    const leftoverAliases: Array<[string, string]> = [
      ["menu", "tr.menuBuild"],
      ["mlsTypeCheck", "tr.mlsTypeCheck"],
      ["alterObject", "fn.tools.alterObjectAtPath"],
      ["metaModelTransformers", "tr.metaModel.extractAttributes"],
    ];
    for (const [token, targetName] of leftoverAliases) {
      expect(resolveApplicationMiroirTestSuiteKey(catalog, token), token).toBeUndefined();
      expect(resolveApplicationMiroirTestSuiteKey(catalog, targetName), targetName).toBe(
        targetName,
      );
    }
    // Root labels equal names (#316 D11), so the label hint needs a synthetic instance.
    const labelledCatalog = buildApplicationMiroirTestCatalog([
      {
        uuid: "00000000-0000-4000-8000-000000000316",
        parentUuid: ENTITY_MIROIR_TEST_UUID,
        name: "tr.mlsTypeCheck",
        definition: {
          miroirTestType: "miroirTestSuite",
          miroirTestLabel: "legacy.mlsTypeCheckLabel",
          miroirTests: [
            {
              miroirTestType: "transformerTest",
              miroirTestLabel: "leaf",
              transformerName: "t",
              transformer: { transformerType: "identity" },
              unitTestExpectedValue: {},
            },
          ],
        },
      } as unknown as MiroirTestDefinition,
    ]);
    expect(() =>
      resolveApplicationMiroirTestSuiteKeys(labelledCatalog, ["legacy.mlsTypeCheckLabel"]),
    ).toThrow(/Did you mean "tr.mlsTypeCheck"/);
    expect(() => resolveApplicationMiroirTestSuiteKeys(catalog, ["mlsTypeCheck"])).toThrow(
      /Unknown suite key "mlsTypeCheck". Use instance name. Available:/,
    );
    expect(() => resolveApplicationMiroirTestSuiteKeys(catalog, ["menu"])).toThrow(
      /Unknown suite key "menu". Use instance name. Available:/,
    );
    expect(() => resolveApplicationMiroirTestSuiteKeys(catalog, ["no_such_suite"])).toThrow(
      /Unknown suite key "no_such_suite". Use instance name. Available:/,
    );
  });
});
