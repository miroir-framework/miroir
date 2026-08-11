/**
 * #232 Slice 1.2 / refactor — getApplicationSection returns "model-version" for all
 * version-history entity families. The family-specific resolveFreeze* helpers and
 * get*WriteSection helpers have been removed; getApplicationSection is the single source.
 */
import { describe, expect, it } from "vitest";

import {
  entityEntityVersion,
  entityHistoricalQueryVersion,
  entityHistoricalReportVersion,
  entityHistoricalMenuVersion,
  entityHistoricalEndpointVersion,
  entityHistoricalRunnerVersion,
  entityHistoricalThemeVersion,
  entityHistoricalTransformerDefinitionVersion,
  entityApplicationVersionCrossEntityVersion,
  entityApplicationVersionCrossQueryVersion,
  entityApplicationVersionCrossReportVersion,
  entityApplicationVersionCrossMenuVersion,
  entityApplicationVersionCrossEndpointVersion,
  entityApplicationVersionCrossRunnerVersion,
  entityApplicationVersionCrossThemeVersion,
  entityApplicationVersionCrossTransformerDefinitionVersion,
  entitySelfApplicationVersion,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";

import {
  buildFreezeApplicationVersionPlan,
} from "../../src/1_core/versioning/applicationVersionFreeze.js";
import { getApplicationSection, versionHistoryEntityUuids } from "../../src/1_core/Model.js";
import type { Entity } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

function makeEntity(uuid: string, name: string): Entity {
  return {
    uuid,
    name,
    parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
    parentName: "Entity",
    mlSchema: { type: "object", definition: { title: { type: "string" } } },
  };
}

const VERSION_HISTORY_ENTITIES = [
  { name: "EntityVersion",                              entity: entityEntityVersion },
  { name: "SelfApplicationVersion",                    entity: entitySelfApplicationVersion },
  { name: "ApplicationVersionCrossEntityVersion",       entity: entityApplicationVersionCrossEntityVersion },
  { name: "QueryVersion",                               entity: entityHistoricalQueryVersion },
  { name: "ApplicationVersionCrossQueryVersion",        entity: entityApplicationVersionCrossQueryVersion },
  { name: "ReportVersion",                              entity: entityHistoricalReportVersion },
  { name: "ApplicationVersionCrossReportVersion",       entity: entityApplicationVersionCrossReportVersion },
  { name: "MenuVersion",                                entity: entityHistoricalMenuVersion },
  { name: "ApplicationVersionCrossMenuVersion",         entity: entityApplicationVersionCrossMenuVersion },
  { name: "EndpointVersion",                            entity: entityHistoricalEndpointVersion },
  { name: "ApplicationVersionCrossEndpointVersion",     entity: entityApplicationVersionCrossEndpointVersion },
  { name: "RunnerVersion",                              entity: entityHistoricalRunnerVersion },
  { name: "ApplicationVersionCrossRunnerVersion",       entity: entityApplicationVersionCrossRunnerVersion },
  { name: "ThemeVersion",                               entity: entityHistoricalThemeVersion },
  { name: "ApplicationVersionCrossThemeVersion",        entity: entityApplicationVersionCrossThemeVersion },
  { name: "TransformerDefinitionVersion",               entity: entityHistoricalTransformerDefinitionVersion },
  { name: "ApplicationVersionCrossTransformerDefinitionVersion", entity: entityApplicationVersionCrossTransformerDefinitionVersion },
];

describe("232 — getApplicationSection routes version-history entities to model-version", () => {
  it("versionHistoryEntityUuids covers all history families", () => {
    for (const { name, entity } of VERSION_HISTORY_ENTITIES) {
      expect(versionHistoryEntityUuids.has(entity.uuid!), `${name} UUID in set`).toBe(true);
    }
    expect(versionHistoryEntityUuids.size).toBe(VERSION_HISTORY_ENTITIES.length);
  });

  it("getApplicationSection returns model-version for all history families regardless of app", () => {
    for (const { name, entity } of VERSION_HISTORY_ENTITIES) {
      expect(getApplicationSection(selfApplicationMiroir.uuid, entity.uuid!), `${name} Miroir`).toBe("model-version");
      expect(getApplicationSection(selfApplicationLibrary.uuid, entity.uuid!), `${name} Library`).toBe("model-version");
    }
  });

  it("freeze plan sets all *ApplicationSection fields to model-version", () => {
    const plan = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: selfApplicationMiroir.uuid,
      branchUuid: "ad1ddc4e-556e-4598-9cff-706a2bde0be7",
      versionName: "V1",
      entities: [makeEntity("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "Book")],
      newUuid: (() => { let n = 0; return () => `aaaaaaaa-aaaa-4aaa-8aaa-${String(++n).padStart(12, "0")}`; })(),
    });
    expect(plan.entityVersionApplicationSection).toBe("model-version");
    expect(plan.queryVersionApplicationSection).toBe("model-version");
    expect(plan.reportVersionApplicationSection).toBe("model-version");
    expect(plan.menuVersionApplicationSection).toBe("model-version");
    expect(plan.endpointVersionApplicationSection).toBe("model-version");
    expect(plan.runnerVersionApplicationSection).toBe("model-version");
    expect(plan.themeVersionApplicationSection).toBe("model-version");
    expect(plan.transformerDefinitionVersionApplicationSection).toBe("model-version");
  });

  it("live getApplicationSection is unchanged for Entity (model) and non-Entity (data)", () => {
    const ENTITY_UUID = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
    expect(getApplicationSection(selfApplicationMiroir.uuid, ENTITY_UUID)).toBe("model");
    expect(getApplicationSection(selfApplicationMiroir.uuid, "00000000-0000-0000-0000-000000000000")).toBe("data");
    expect(getApplicationSection(selfApplicationLibrary.uuid, ENTITY_UUID)).toBe("model");
  });
});
