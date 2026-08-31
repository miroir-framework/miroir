/**
 * #252 Slice 0 — lock current MiroirTest suite JSON, Entity folder, model-scope
 * menu, and getApplicationSection for MiroirTest. Transitional; deleted in Slice 8.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import type {
  Menu,
  MiroirTestDefinition,
  MiroirTestSuite,
} from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { getApplicationSection } from "../../../../src/1_core/Model.js";
import {
  entityMiroirTest,
  menuApplicationModelScopeTemplate,
  miroirTest_domain_controller_application_version_freeze,
  miroirTest_domain_controller_composite_pk_crud,
  miroirTest_domain_controller_data_crud,
  miroirTest_domain_controller_model_crud,
  miroirTest_domain_controller_model_undo_redo,
  miroirTest_domain_controller_no_parent_uuid_crud,
  miroirTest_domain_controller_non_uuid_pk_data_crud,
  miroirTest_domain_controller_non_uuid_pk_model_crud,
  miroirTest_evolutionTraceWP1,
  miroirTest_runner_create_entity,
  miroirTest_runner_drop_entity,
  miroirTest_runner_freeze_application_version,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import {
  miroirTest_runner_lend_document,
  miroirTest_runner_return_document,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "selfContainedTestbed.252.phase0" ||
  RUN_TEST === "selfContainedTestbed.252.phase0.unit.test";

const PLAYFIELD_FIELD_NAMES = [
  "testbedModel",
  "testbedEntitiesAndInstances",
  "testConfiguration",
] as const;

const INTEG_SUITE_DEFINITIONS: Record<string, MiroirTestSuite> = {
  runner_lend_document: (miroirTest_runner_lend_document as MiroirTestDefinition).definition,
  runner_return_document: (miroirTest_runner_return_document as MiroirTestDefinition).definition,
  runner_create_entity: (miroirTest_runner_create_entity as MiroirTestDefinition).definition,
  runner_drop_entity: (miroirTest_runner_drop_entity as MiroirTestDefinition).definition,
  runner_freeze_application_version: (
    miroirTest_runner_freeze_application_version as MiroirTestDefinition
  ).definition,
  domain_controller_data_crud: (miroirTest_domain_controller_data_crud as MiroirTestDefinition)
    .definition,
  domain_controller_model_crud: (miroirTest_domain_controller_model_crud as MiroirTestDefinition)
    .definition,
  domain_controller_composite_pk_crud: (
    miroirTest_domain_controller_composite_pk_crud as MiroirTestDefinition
  ).definition,
  domain_controller_non_uuid_pk_model_crud: (
    miroirTest_domain_controller_non_uuid_pk_model_crud as MiroirTestDefinition
  ).definition,
  domain_controller_non_uuid_pk_data_crud: (
    miroirTest_domain_controller_non_uuid_pk_data_crud as MiroirTestDefinition
  ).definition,
  domain_controller_no_parent_uuid_crud: (
    miroirTest_domain_controller_no_parent_uuid_crud as MiroirTestDefinition
  ).definition,
  domain_controller_model_undo_redo: (
    miroirTest_domain_controller_model_undo_redo as MiroirTestDefinition
  ).definition,
  domain_controller_application_version_freeze: (
    miroirTest_domain_controller_application_version_freeze as MiroirTestDefinition
  ).definition,
  evolutionTraceWP1: (miroirTest_evolutionTraceWP1 as MiroirTestDefinition).definition,
};

const EXPECTED_MODEL_SCOPE_LABELS = [
  "Application",
  "Entities",
  "Queries",
  "Reports",
  "Menus",
  "Endpoints",
  "Runners",
  "Tests",
  "Test Configurations",
  "Model-Data Divider",
] as const;

const REPO_ROOT = join(import.meta.dirname, "../../../../../..");
const ENTITY_METACLASS_DIR = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
);

function playfieldFieldsOn(definition: MiroirTestSuite): string[] {
  return PLAYFIELD_FIELD_NAMES.filter((field) => field in definition);
}

function modelScopeItemLabels(menu: Menu): string[] {
  if (menu.definition.menuType !== "complexMenu") {
    return [];
  }
  return menu.definition.definition[0]?.items.map((item) => item.label) ?? [];
}

(shouldRun ? describe : describe.skip)(
  "self-contained testbed current contracts (issue #252 slice 0)",
  () => {
    it("integ suite JSON definitions have no playfield fields except undo_redo inline seed and uuid-owned suites", () => {
      const keys = Object.keys(INTEG_SUITE_DEFINITIONS).sort();
      expect(keys).toEqual([
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
      ]);

      for (const [name, definition] of Object.entries(INTEG_SUITE_DEFINITIONS)) {
        if (name === "domain_controller_model_undo_redo") {
          expect(playfieldFieldsOn(definition), name).toEqual([
            "testbedModel",
            "testbedEntitiesAndInstances",
          ]);
          continue;
        }
        if (
          name === "runner_lend_document" ||
          name === "runner_return_document" ||
          name === "domain_controller_model_crud" ||
          name === "domain_controller_application_version_freeze" ||
          name === "evolutionTraceWP1"
        ) {
          expect(playfieldFieldsOn(definition), name).toEqual(["testConfiguration"]);
          continue;
        }
        expect(playfieldFieldsOn(definition), name).toEqual([]);
      }
    });

    it("Entity JSON under the Entity metaclass folder includes TestConfiguration", () => {
      const names = readdirSync(ENTITY_METACLASS_DIR)
        .filter((file) => file.endsWith(".json"))
        .map((file) => {
          const row = JSON.parse(readFileSync(join(ENTITY_METACLASS_DIR, file), "utf8")) as {
            name?: string;
            uuid?: string;
          };
          return row;
        });
      const testConfiguration = names.find((row) => row.name === "TestConfiguration");
      expect(testConfiguration?.uuid).toBe("675ccd46-7dd3-400b-a2bd-1319c39e11da");
    });

    it("ApplicationModelScopeTemplate item labels are the nine report links plus divider", () => {
      const labels = modelScopeItemLabels(menuApplicationModelScopeTemplate as Menu);
      expect(labels).toEqual([...EXPECTED_MODEL_SCOPE_LABELS]);
    });

    it("getApplicationSection puts MiroirTest in Miroir data and Library model", () => {
      const miroirTestUuid = entityMiroirTest.uuid as string;
      expect(miroirTestUuid).toBe("a311f363-e238-4203-bdfc-29e8c160c26b");
      expect(getApplicationSection(selfApplicationMiroir.uuid, miroirTestUuid)).toBe("data");
      expect(getApplicationSection(selfApplicationLibrary.uuid, miroirTestUuid)).toBe("model");
    });
  },
);
