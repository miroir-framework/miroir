/**
 * Application version freeze — modelVersion storage section routing.
 *
 * getApplicationSection returns "modelVersion" for every version-history entity
 * family (it is the single routing source), freeze plans tag all version-history
 * persist sections accordingly, and a second freeze chains previousVersion from
 * history rows that only exist in the persisted modelVersion slice.
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
  entityHistoricalMlSchemaVersion,
  entityApplicationVersionCrossMlSchemaVersion,
  entityHistoricalMiroirTestVersion,
  entityApplicationVersionCrossMiroirTestVersion,
  entityHistoricalBlobVersion,
  entityApplicationVersionCrossBlobVersion,
  entityHistoricalTestConfigurationVersion,
  entityApplicationVersionCrossTestConfigurationVersion,
  entityHistoricalTestVersion,
  entityApplicationVersionCrossTestVersion,
  entitySelfApplicationVersion,
  selfApplicationMiroir,
} from "miroir-app-miroir";
import { selfApplicationLibrary } from "miroir-example-library";

import {
  buildFreezeApplicationVersionPlan,
  mergeVersionHistoryIntoFreezeMetaModel,
  planFreezeApplicationVersionFromMetaModel,
  selectEntitiesToFreeze,
  type FreezeMetaModelSlice,
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
  { name: "MlSchemaVersion",                            entity: entityHistoricalMlSchemaVersion },
  { name: "ApplicationVersionCrossMlSchemaVersion",     entity: entityApplicationVersionCrossMlSchemaVersion },
  { name: "MiroirTestVersion",                          entity: entityHistoricalMiroirTestVersion },
  { name: "ApplicationVersionCrossMiroirTestVersion",   entity: entityApplicationVersionCrossMiroirTestVersion },
  { name: "BlobVersion", entity: entityHistoricalBlobVersion },
  { name: "ApplicationVersionCrossBlobVersion", entity: entityApplicationVersionCrossBlobVersion },
  { name: "TestConfigurationVersion", entity: entityHistoricalTestConfigurationVersion },
  { name: "ApplicationVersionCrossTestConfigurationVersion", entity: entityApplicationVersionCrossTestConfigurationVersion },
  { name: "TestVersion", entity: entityHistoricalTestVersion },
  { name: "ApplicationVersionCrossTestVersion", entity: entityApplicationVersionCrossTestVersion },
];

describe("getApplicationSection routes version-history entities to modelVersion", () => {
  it("versionHistoryEntityUuids covers all history families", () => {
    for (const { name, entity } of VERSION_HISTORY_ENTITIES) {
      expect(versionHistoryEntityUuids.has(entity.uuid!), `${name} UUID in set`).toBe(true);
    }
    expect(versionHistoryEntityUuids.size).toBe(VERSION_HISTORY_ENTITIES.length);
  });

  it("getApplicationSection returns modelVersion for all history families regardless of app", () => {
    for (const { name, entity } of VERSION_HISTORY_ENTITIES) {
      expect(getApplicationSection(selfApplicationMiroir.uuid, entity.uuid!), `${name} Miroir`).toBe("modelVersion");
      expect(getApplicationSection(selfApplicationLibrary.uuid, entity.uuid!), `${name} Library`).toBe("modelVersion");
    }
  });

  it("freeze plan sets all version-history persist section fields to modelVersion", () => {
    const plan = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: selfApplicationMiroir.uuid,
      branchUuid: "ad1ddc4e-556e-4598-9cff-706a2bde0be7",
      versionName: "V1",
      entities: [makeEntity("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "Book")],
      newUuid: (() => { let n = 0; return () => `aaaaaaaa-aaaa-4aaa-8aaa-${String(++n).padStart(12, "0")}`; })(),
    });
    expect(plan.entityVersionApplicationSection).toBe("modelVersion");
    expect(plan.queryVersionApplicationSection).toBe("modelVersion");
    expect(plan.reportVersionApplicationSection).toBe("modelVersion");
    expect(plan.menuVersionApplicationSection).toBe("modelVersion");
    expect(plan.endpointVersionApplicationSection).toBe("modelVersion");
    expect(plan.runnerVersionApplicationSection).toBe("modelVersion");
    expect(plan.themeVersionApplicationSection).toBe("modelVersion");
    expect(plan.transformerDefinitionVersionApplicationSection).toBe("modelVersion");
    expect(plan.mlSchemaVersionApplicationSection).toBe("modelVersion");
    expect(plan.miroirTestVersionApplicationSection).toBe("modelVersion");
  });

  it("live getApplicationSection is unchanged for Entity (model) and non-Entity (data)", () => {
    const ENTITY_UUID = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
    expect(getApplicationSection(selfApplicationMiroir.uuid, ENTITY_UUID)).toBe("model");
    expect(getApplicationSection(selfApplicationMiroir.uuid, "00000000-0000-0000-0000-000000000000")).toBe("data");
    expect(getApplicationSection(selfApplicationLibrary.uuid, ENTITY_UUID)).toBe("model");
  });
});

describe("freeze chaining from modelVersion-persisted history", () => {
  it("second freeze links previousVersion when prior tip exists only in persisted slice", () => {
    const appUuid = selfApplicationLibrary.uuid;
    const branchUuid = "9034141b-0d0d-4beb-82af-dfc02be15c2d";
    const v1Uuid = "7a46582b-6018-4b07-b5a8-32c03c6cfdfe";
    const live: FreezeMetaModelSlice = {
      applications: [{ uuid: appUuid, versioningEnabled: true }],
      entities: [makeEntity("7395d1e5-6a44-49d8-91cb-452302b41162", "Book")],
      applicationVersions: [
        {
          uuid: "419773b4-a73c-46ca-8913-0ee27fb2ce0a",
          name: "Initial",
          selfApplication: appUuid,
          branch: branchUuid,
          parentUuid: entitySelfApplicationVersion.uuid!,
          parentName: "ApplicationVersion",
          modelStructureMigration: [],
          modelCUDMigration: [],
        },
      ],
      entityVersions: [],
      applicationVersionCrossEntityVersion: [],
    };
    const persisted: Partial<FreezeMetaModelSlice> = {
      applicationVersions: [
        {
          uuid: v1Uuid,
          name: "V1-Chain",
          selfApplication: appUuid,
          branch: branchUuid,
          parentUuid: entitySelfApplicationVersion.uuid!,
          parentName: "ApplicationVersion",
          modelStructureMigration: [],
          modelCUDMigration: [],
        },
      ],
      applicationVersionCrossEntityVersion: [
        {
          uuid: "cross-v1-book",
          parentUuid: entityApplicationVersionCrossEntityVersion.uuid!,
          applicationVersion: v1Uuid,
          entityVersion: "ev-v1-book",
        },
      ],
      entityVersions: [
        {
          uuid: "ev-v1-book",
          entityUuid: "7395d1e5-6a44-49d8-91cb-452302b41162",
          parentUuid: entityEntityVersion.uuid!,
          parentName: "EntityVersion",
          name: "Book",
          mlSchema: { type: "object", definition: { title: { type: "string" } } },
        },
      ],
    };
    const enriched = mergeVersionHistoryIntoFreezeMetaModel(live, persisted);
    const plan = planFreezeApplicationVersionFromMetaModel(
      { application: appUuid, versionName: "V2-Chain", branch: branchUuid },
      {
        ...enriched,
        entities: live.entities,
      },
    );
    expect(plan.selfApplicationVersion.previousVersion).toBe(v1Uuid);
  });
});

describe("selectEntitiesToFreeze (#230)", () => {
  const ENTITY_UUID = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
  const REPORT_UUID = "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916";
  const BLOB_UUID = "62209e4a-e429-4d7d-9b28-dcc1da6b51a2";
  const BUNDLE_SIZE_MEASUREMENT_UUID = "90d603f9-58f8-4ac4-b2eb-cb1d718e8b3b";
  const BOOK_UUID = "e8ba151b-d68e-4cc3-9a83-3459d309ccf5";
  const metaEntities = [
    makeEntity(ENTITY_UUID, "Entity"),
    makeEntity(REPORT_UUID, "Report"),
    makeEntity(entityEntityVersion.uuid!, "EntityVersion"),
    makeEntity(entitySelfApplicationVersion.uuid!, "SelfApplicationVersion"),
    makeEntity(entityApplicationVersionCrossEntityVersion.uuid!, "ApplicationVersionCrossEntityVersion"),
    makeEntity(entityHistoricalMiroirTestVersion.uuid!, "MiroirTestVersion"),
    makeEntity(BUNDLE_SIZE_MEASUREMENT_UUID, "BundleSizeMeasurement"),
  ];
  const metaUuids = new Set(metaEntities.map((e) => e.uuid));

  it("freezes Miroir's own Entities, meta-model ones included, but not its history or devData Entities", () => {
    const selected = selectEntitiesToFreeze(
      selfApplicationMiroir.uuid,
      [...metaEntities, makeEntity(BLOB_UUID, "Blob")],
      metaUuids,
    );
    expect(selected.map((e) => e.name).sort()).toEqual(["Blob", "Entity", "Report"]);
  });

  it("leaves the meta-model Entities out of an application's freeze", () => {
    const selected = selectEntitiesToFreeze(
      selfApplicationLibrary.uuid,
      [...metaEntities, makeEntity(BOOK_UUID, "Book")],
      metaUuids,
    );
    expect(selected.map((e) => e.name)).toEqual(["Book"]);
  });
});
