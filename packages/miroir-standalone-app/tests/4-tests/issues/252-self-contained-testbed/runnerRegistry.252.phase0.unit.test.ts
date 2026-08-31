/**
 * #252 Slice 0 — lock current UI_INTEGRATION_RUNNER_SUITE_REGISTRY shape.
 * Transitional; deleted in Slice 8.
 */
import { describe, expect, it } from "vitest";

import {
  listUiIntegrationRunnerSuiteKeys,
  UI_INTEGRATION_RUNNER_SUITE_REGISTRY,
} from "../../../../src/miroir-fwk/4-tests/uiIntegrationTestRunnerSuiteRegistry.js";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "runnerRegistry.252.phase0" ||
  RUN_TEST === "runnerRegistry.252.phase0.unit.test";

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
  "runner_return_document",
] as const;

const EXPECTED_KIND: Record<(typeof EXPECTED_KEYS)[number], string> = {
  domain_controller_application_version_freeze: "domainControllerTest",
  domain_controller_composite_pk_crud: "domainControllerTest",
  domain_controller_data_crud: "domainControllerTest",
  domain_controller_model_crud: "domainControllerTest",
  domain_controller_model_undo_redo: "domainControllerTest",
  domain_controller_no_parent_uuid_crud: "domainControllerTest",
  domain_controller_non_uuid_pk_data_crud: "domainControllerTest",
  domain_controller_non_uuid_pk_model_crud: "domainControllerTest",
  evolutionTraceWP1: "actionTest",
  runner_create_entity: "runnerTest",
  runner_drop_entity: "runnerTest",
  runner_freeze_application_version: "runnerTest",
  runner_lend_document: "runnerTest",
  runner_return_document: "runnerTest",
};

const NULL_PLAYFIELD_KEYS = new Set(["runner_create_entity", "runner_drop_entity"]);

(shouldRun ? describe : describe.skip)(
  "UI integration runner registry current contracts (issue #252 slice 0)",
  () => {
    it("lists the fourteen runner/action suite keys", () => {
      expect(listUiIntegrationRunnerSuiteKeys()).toEqual([...EXPECTED_KEYS]);
    });

    it("each entry has kind; create/drop omit playfield and init; all other rows are suite-owned", () => {
      for (const key of EXPECTED_KEYS) {
        const entry = UI_INTEGRATION_RUNNER_SUITE_REGISTRY[key];
        expect(entry, key).toBeDefined();
        expect(entry.kind, key).toBe(EXPECTED_KIND[key]);
        expect(
          Object.prototype.hasOwnProperty.call(entry, "testBedModelAndInstances"),
          key,
        ).toBe(false);

        if (NULL_PLAYFIELD_KEYS.has(key)) {
          expect(entry.testbedInitApplicationParameters, key).toBeUndefined();
          continue;
        }

        expect(entry.testbedInitApplicationParameters, key).toBeDefined();
      }
    });
  },
);
