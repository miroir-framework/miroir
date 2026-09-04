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
  "domain_controller_application_version_freeze",
  "domain_controller_composite_pk_crud",
  "domain_controller_data_crud",
  "domain_controller_model_crud",
  "domain_controller_model_undo_redo",
  "domain_controller_no_parent_uuid_crud",
  "domain_controller_non_uuid_pk_data_crud",
  "domain_controller_non_uuid_pk_model_crud",
  "evolutionTraceWP1",
  "runner_create_entity",
  "runner_drop_entity",
  "runner_freeze_application_version",
  "runner_lend_document",
  "runner_mcp_get_instances",
  "runner_mcp_lend_document",
  "runner_return_document",
] as const;

const SKIP_RESET_KEYS = new Set(["runner_create_entity", "runner_drop_entity"]);
const ALLOWED_ENTRY_KEYS = new Set(["kind", "suiteDefinition"]);
const applicationMiroirTestCatalogByKey = indexApplicationMiroirTestsByKey(
  loadApplicationMiroirTestCatalog(),
);

(shouldRun ? describe : describe.skip)("UI integration runner registry", () => {
  it("lists the sixteen runner/action suite keys (legacy snapshot)", () => {
    expect(listUiIntegrationRunnerSuiteKeys()).toEqual([...EXPECTED_KEYS]);
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
