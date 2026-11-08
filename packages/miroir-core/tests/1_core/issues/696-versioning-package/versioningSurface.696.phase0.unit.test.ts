/**
 * #696 Slice 0: what core exports about versioning.
 *
 * The first half lists what core keeps when the freeze and trace implementations move to
 * `@miroir-framework/versioning`: other packages name these without loading the package. The second
 * half lists the implementations Slices 3 and 4 moved out of core.
 */
import { describe, expect, it } from "vitest";

import * as core from "@miroir-framework/core";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("versioningSurface.696");

/** Interfaces and policies that stay in core, with their values where they have one. */
const KEPT_CONSTANTS: Record<string, string> = {
  FREEZE_APPLICATION_VERSION_ACTION_TYPE: "freezeApplicationVersion",
  QUERY_VERSION_ENTITY_UUID: "7f3a8b2c-4d1e-4f9a-b6c3-8e5d2a1f0b9c",
  APPLICATION_VERSION_CROSS_QUERY_VERSION_UUID: "9e4c6d8a-2b5f-4a1c-9d7e-3f6b8a2c4e1d",
  REPORT_VERSION_ENTITY_UUID: "f1a2b3c4-d5e6-4789-a0a1-b2c3d4e5f6a7",
  APPLICATION_VERSION_CROSS_REPORT_VERSION_UUID: "f2b3c4d5-e6f7-4890-a1b2-c3d4e5f6a7b8",
  MENU_VERSION_ENTITY_UUID: "a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7",
  APPLICATION_VERSION_CROSS_MENU_VERSION_UUID: "b2c3d4e5-f6a7-4890-b1c2-d3e4f5a6b7c8",
  ENDPOINT_VERSION_ENTITY_UUID: "c2d3e4f5-a6b7-4789-a0b1-d2e3f4a5b6c7",
  APPLICATION_VERSION_CROSS_ENDPOINT_VERSION_UUID: "d3e4f5a6-b7c8-4890-b1c2-e3f4a5b6c7d8",
  RUNNER_VERSION_ENTITY_UUID: "e5f6a7b8-c9d0-4012-a3b4-c5d6e7f8a9b0",
  APPLICATION_VERSION_CROSS_RUNNER_VERSION_UUID: "f6a7b8c9-d0e1-4123-a4b5-c6d7e8f9a0b1",
  THEME_VERSION_ENTITY_UUID: "a7b8c9d0-e1f2-4012-a3b4-c5d6e7f8a9c0",
  APPLICATION_VERSION_CROSS_THEME_VERSION_UUID: "b8c9d0e1-f2a3-4123-a4b5-c6d7e8f9a0c1",
  TRANSFORMER_DEFINITION_VERSION_ENTITY_UUID: "e1f2a3b4-c5d6-4012-a3b4-c5d6e7f8a9d0",
  APPLICATION_VERSION_CROSS_TRANSFORMER_DEFINITION_VERSION_UUID: "f2a3b4c5-d6e7-4123-a4b5-c6d7e8f9a0d1",
  ML_SCHEMA_VERSION_ENTITY_UUID: "426cd199-8f38-498e-bd81-af636321b864",
  APPLICATION_VERSION_CROSS_ML_SCHEMA_VERSION_UUID: "da27d98d-6b52-412a-9317-557325ec4030",
  MIROIR_TEST_VERSION_ENTITY_UUID: "a2b1c33a-b0db-45b4-829c-c8fafc4a6110",
  APPLICATION_VERSION_CROSS_MIROIR_TEST_VERSION_UUID: "81af0bd1-388b-4f80-aabc-4004578c7ded",
  BLOB_VERSION_ENTITY_UUID: "4fbc43fa-8970-41b8-845e-20303002147e",
  APPLICATION_VERSION_CROSS_BLOB_VERSION_UUID: "28ed918a-5514-4dc2-a3f3-a6f353270dd5",
  TEST_CONFIGURATION_VERSION_ENTITY_UUID: "9b0f81d3-8b80-454f-9dfc-57489969a112",
  APPLICATION_VERSION_CROSS_TEST_CONFIGURATION_VERSION_UUID: "8bd811bf-82fa-4547-93e1-082c97589069",
  TEST_VERSION_ENTITY_UUID: "fe94c683-89d3-482e-a653-9ce1eeb4ef34",
  APPLICATION_VERSION_CROSS_TEST_VERSION_UUID: "be1d3cf3-b77c-464e-966c-6d23375a4d6f",
  EVOLUTION_TRACE_ENTITY_UUID: "de089f57-5fa5-4c0e-a43e-20f1a6df5a37",
  EVOLUTION_TRACE_EVENT_ENTITY_UUID: "f4c2b3a1-8d6e-4f9a-b2c1-3d4e5f6a7b8c",
};

const KEPT_FUNCTIONS = [
  "resolveVersioningMode",
  "getFreezeAvailability",
  "isVersioningAppBarItemVisible",
  "assertApplicationVersioningEnabled",
  "assertVersioningEnabledImmutable",
  "getApplicationSection",
  "isEvolutionTraceEnabled",
  "shouldTraceEvolutionEvent",
  "generateEvolutionBaseline",
  "buildEvolutionBaselineCreateInstanceActions",
];

/** Freeze and trace implementations core exports today; they leave core with #696. */
/** #696 Slice 3: the freeze implementation, in `@miroir-framework/versioning`. */
const MOVED_FREEZE_FUNCTIONS = [
  "buildFreezeApplicationVersionPlan",
  "planFreezeApplicationVersion",
  "planFreezeApplicationVersionFromMetaModel",
  "selectEntitiesToFreeze",
  "resolvePreviousApplicationVersion",
  "isApplicationVersionPlaceholder",
  "diffEntityVersionSnapshots",
  "snapshotEntitiesAsHistoricalEntityVersions",
  "snapshotQueriesAsHistoricalQueryVersions",
  "snapshotTestsAsHistoricalTestVersions",
];

/** #696 Slice 4: the trace implementation, in `@miroir-framework/versioning`. */
const MOVED_TRACE_FUNCTIONS = [
  "createTraceEventFromModelAction",
  "createTraceEventFromInstanceAction",
  "produceEvolutionTraceEvent",
  "fetchEvolutionHistory",
  "buildEvolutionTracePersistenceActions",
  "collectEvolutionTraceStateFromDomainState",
  "resolveDefinitionVersionForTraceEvent",
];

if (runThis) {
  describe("versioningSurface.696.phase0: core's versioning exports", () => {
    it("keeps the action type, the version Entity uuids and the trace Entity uuids", () => {
      const actual = Object.fromEntries(
        Object.keys(KEPT_CONSTANTS).map((name) => [name, (core as Record<string, unknown>)[name]]),
      );
      expect(actual).toEqual(KEPT_CONSTANTS);
    });

    it("keeps the mode, section routing, trace policy and baseline functions", () => {
      const missing = KEPT_FUNCTIONS.filter(
        (name) => typeof (core as Record<string, unknown>)[name] !== "function",
      );
      expect(missing).toEqual([]);
      expect((core as Record<string, unknown>).versionHistoryEntityUuids).toBeInstanceOf(Set);
    });

    it("no longer exports the freeze implementation", () => {
      const stillExported = MOVED_FREEZE_FUNCTIONS.filter((name) => name in core);
      expect(stillExported).toEqual([]);
      expect("APPLICATION_VERSION_PLACEHOLDER_NAMES" in core).toBe(false);
    });

    it("no longer exports the trace implementation", () => {
      const stillExported = MOVED_TRACE_FUNCTIONS.filter((name) => name in core);
      expect(stillExported).toEqual([]);
    });

    it("exports what a package needs to register lazy action implementations", () => {
      expect(typeof core.registerLazyActionImplementations).toBe("function");
      expect(typeof core.loadLazyCapabilityModule).toBe("function");
      expect(core.VERSIONING_ACTION_IMPLEMENTATION_NAMES).toEqual(["handleAction_freezeApplicationVersion"]);
      expect(core.VERSIONING_PACKAGE_NAME).toBe("@miroir-framework/versioning");
    });
  });
}
