/**
 * #252 Slice 2 — Entity TestConfiguration, list/details reports, menus, section routing.
 * Vitest: inventory of applicative JSON + getApplicationSection, not an ML behavior.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import type {
  Entity,
  EntityVersion,
  Menu,
  Report,
} from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { getApplicationSection } from "../../../../src/1_core/Model.js";
import { defaultMiroirMetaModel } from "../../../../src/1_core/defaultMiroirMetaModel.js";
import {
  entityMiroirTest,
  entityTestConfiguration,
  menuApplicationModelScopeTemplate,
  menuDefaultMiroir,
  reportTestConfigurationDetails,
  reportTestConfigurationList,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "testConfigurationEntity.252.phase2" ||
  RUN_TEST === "testConfigurationEntity.252.phase2.unit.test";

const ENTITY_UUID = "675ccd46-7dd3-400b-a2bd-1319c39e11da";
const ENTITY_VERSION_UUID = "d85749be-caf7-4595-9375-5ab6abf2061b";
const LIST_REPORT_UUID = "08cd379a-9ec8-4e1b-ac99-8a77a6905d72";
const DETAILS_REPORT_UUID = "21a693e4-127b-4c84-a7eb-d145eaf4d0d2";

const REPO_ROOT = join(import.meta.dirname, "../../../../../..");
const ENTITY_PATH = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  `${ENTITY_UUID}.json`,
);
const ENTITY_VERSION_PATH = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_modelVersion/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
  `${ENTITY_VERSION_UUID}.json`,
);

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

function complexMenuItems(menu: Menu): Array<{
  label: string;
  section?: string;
  menuItemScope?: string;
  reportUuid?: string;
}> {
  if (menu.definition.menuType !== "complexMenu") {
    return [];
  }
  return menu.definition.definition[0]?.items ?? [];
}

(shouldRun ? describe : describe.skip)(
  "TestConfiguration entity, reports, and menus (issue #252 slice 2)",
  () => {
    it("Entity JSON exists with name TestConfiguration and details report uuid", () => {
      const row = readJson(ENTITY_PATH) as Entity;
      expect(row.uuid).toBe(ENTITY_UUID);
      expect(row.name).toBe("TestConfiguration");
      expect(row.conceptLevel).toBe("Model");
      expect(row.cache?.cacheAllInstancesOnRefresh).toBe(true);
      expect(row.defaultInstanceDetailsReportUuid).toBe(DETAILS_REPORT_UUID);
      expect(row.parentDefinitionVersionUuid).toBe("381ab1be-337f-4198-b1d3-f686867fc1dd");
      expect((entityTestConfiguration as Entity).uuid).toBe(ENTITY_UUID);
    });

    it("EntityVersion JSON dual-writes mlSchema with the Entity", () => {
      const entity = readJson(ENTITY_PATH) as Entity;
      const version = readJson(ENTITY_VERSION_PATH) as EntityVersion;
      expect(version.uuid).toBe(ENTITY_VERSION_UUID);
      expect(version.entityUuid).toBe(ENTITY_UUID);
      expect(version.mlSchema).toEqual(entity.mlSchema);
    });

    it("defaultMiroirMetaModel.entities includes TestConfiguration", () => {
      expect(defaultMiroirMetaModel.entities.map((e) => e.uuid)).toContain(ENTITY_UUID);
      expect(defaultMiroirMetaModel.entityVersions.map((e) => e.uuid)).toContain(
        ENTITY_VERSION_UUID,
      );
    });

    it("getApplicationSection puts TestConfiguration in Miroir data and Library model", () => {
      expect(getApplicationSection(selfApplicationMiroir.uuid, ENTITY_UUID)).toBe("data");
      expect(getApplicationSection(selfApplicationLibrary.uuid, ENTITY_UUID)).toBe("model");
    });

    it("list report extracts TestConfiguration instances by entity (QueryList clone)", () => {
      const report = reportTestConfigurationList as Report;
      expect(report.uuid).toBe(LIST_REPORT_UUID);
      expect(report.definition.extractorTemplates).toEqual({
        testConfigurations: {
          extractorOrCombinerType: "extractorInstancesByEntity",
          parentName: "TestConfiguration",
          parentUuid: ENTITY_UUID,
        },
      });
      expect(JSON.stringify(report)).not.toMatch(/miroirTestReportSection/);
    });

    it("details report uses extractorByPrimaryKey and objectInstanceReportSection", () => {
      const report = reportTestConfigurationDetails as Report;
      expect(report.uuid).toBe(DETAILS_REPORT_UUID);
      const extractors = report.definition.extractorTemplates as Record<string, { extractorOrCombinerType?: string }>;
      expect(extractors.elementToDisplay?.extractorOrCombinerType).toBe("extractorByPrimaryKey");
      const section = report.definition.section as {
        type?: string;
        definition?: Array<{ type?: string }>;
      };
      expect(section.type).toBe("list");
      expect(section.definition?.[0]?.type).toBe("objectInstanceReportSection");
    });

    it("ApplicationModelScopeTemplate has Test Configurations after Tests", () => {
      const items = complexMenuItems(menuApplicationModelScopeTemplate as Menu);
      const labels = items.map((item) => item.label);
      expect(labels).toEqual([
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
      ]);
      const added = items[8];
      expect(added.section).toBe("model");
      expect(added.menuItemScope).toBe("model");
      expect(added.reportUuid).toBe(LIST_REPORT_UUID);
      expect(items[9]?.label).toBe("Model-Data Divider");
    });

    it("MiroirMenu has Miroir Test Configurations immediately after Miroir Tests", () => {
      const items = complexMenuItems(menuDefaultMiroir as Menu);
      const testsIndex = items.findIndex((item) => item.label === "Miroir Tests");
      expect(testsIndex).toBeGreaterThanOrEqual(0);
      const added = items[testsIndex + 1];
      expect(added.label).toBe("Miroir Test Configurations");
      expect(added.section).toBe("data");
      expect(added.reportUuid).toBe(LIST_REPORT_UUID);
    });

    it("MiroirTestSuite has optional testConfiguration FK to TestConfiguration", () => {
      const entity = readJson(
        join(
          REPO_ROOT,
          "packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          `${(entityMiroirTest as Entity).uuid}.json`,
        ),
      ) as Entity;
      const definitionField = entity.mlSchema.definition.definition as {
        context?: {
          miroirTestSuite?: {
            definition?: {
              testConfiguration?: {
                type?: string;
                optional?: boolean;
                tag?: { value?: { foreignKeyParams?: { targetEntity?: string } } };
              };
            };
          };
        };
      };
      const field = definitionField.context?.miroirTestSuite?.definition?.testConfiguration;
      expect(field?.type).toBe("uuid");
      expect(field?.optional).toBe(true);
      expect(field?.tag?.value?.foreignKeyParams?.targetEntity).toBe(ENTITY_UUID);
    });
  },
);
