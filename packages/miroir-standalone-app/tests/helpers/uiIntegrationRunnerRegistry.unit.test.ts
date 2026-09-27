/**
 * Legacy UI_INTEGRATION_RUNNER_SUITE_REGISTRY snapshot: kind + suite only.
 * Live init refs are asserted from the application folder catalog.
 */

import { describe, expect, it } from "vitest";

import {
  indexApplicationMiroirTestsByKey,
  resolveSkipRunTargetPlayfieldResetFromMiroirTestSuite,
} from "miroir-core";
import { loadApplicationMiroirTestCatalog } from "miroir-core/src/5_tests/loadApplicationMiroirTestsFromFolders.js";

import {
  listUiIntegrationRunnerSuiteKeys,
  UI_INTEGRATION_RUNNER_SUITE_REGISTRY,
} from "../../src/miroir-fwk/4-tests/uiIntegrationTestRunnerSuiteRegistry.js";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "uiIntegrationRunnerRegistry" ||
  RUN_TEST === "uiIntegrationRunnerRegistry.unit.test";

const EXPECTED_KEYS = [
  "action.domainController.freezeApplicationVersion",
  "action.domainController.dataCrud.compositePk",
  "action.domainController.dataCrud",
  "action.domainController.modelCrud",
  "action.domainController.modelUndoRedo",
  "action.domainController.dataCrud.noParentUuid",
  "action.domainController.dataCrud.nonUuidPk",
  "action.domainController.modelCrud.nonUuidPk",
  "action.scenario.evolutionTrace",
  "runner.createEntity",
  "runner.dropEntity",
  "runner.freezeApplicationVersion",
  "runner.lendDocument",
  "runner.mcp.getInstances",
  "runner.mcp.lendDocument",
  "runner.returnDocument",
] as const;

const SKIP_RESET_KEYS = new Set(["runner.createEntity", "runner.dropEntity"]);
const ALLOWED_ENTRY_KEYS = new Set(["kind", "suiteDefinition"]);
const applicationMiroirTestCatalogByKey = indexApplicationMiroirTestsByKey(
  loadApplicationMiroirTestCatalog(),
);

(shouldRun ? describe : describe.skip)("UI integration runner registry", () => {
  it("lists the sixteen runner/action suite keys (legacy snapshot)", () => {
    expect([...listUiIntegrationRunnerSuiteKeys()].sort()).toEqual([...EXPECTED_KEYS].sort());
  });

  it("legacy entries are kind + suiteDefinition; init lives on folder suite JSON", () => {
    for (const key of EXPECTED_KEYS) {
      const entry = UI_INTEGRATION_RUNNER_SUITE_REGISTRY[key];
      expect(entry, key).toBeDefined();
      for (const field of Object.keys(entry)) {
        expect(ALLOWED_ENTRY_KEYS.has(field), `${key}.${field}`).toBe(true);
      }

      expect(Object.prototype.hasOwnProperty.call(entry, "testBedModelAndInstances"), key).toBe(
        false,
      );
      expect(
        Object.prototype.hasOwnProperty.call(entry, "testbedInitApplicationParameters"),
        key,
      ).toBe(false);
      expect(entry.kind, key).toBeDefined();
      expect(entry.suiteDefinition, key).toBeDefined();

      const folderSuite = applicationMiroirTestCatalogByKey[key]?.suiteDefinition;
      expect(folderSuite, key).toBeDefined();
      if (SKIP_RESET_KEYS.has(key)) {
        expect(folderSuite.testbedInitApplicationParameters, key).toBeUndefined();
        expect(
          resolveSkipRunTargetPlayfieldResetFromMiroirTestSuite(folderSuite),
          key,
        ).toBe(true);
        continue;
      }

      expect(folderSuite.testbedInitApplicationParameters, key).toBeDefined();
      expect(
        resolveSkipRunTargetPlayfieldResetFromMiroirTestSuite(folderSuite),
        key,
      ).toBe(false);
    }
  });
});
