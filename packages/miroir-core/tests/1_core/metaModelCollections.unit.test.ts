/**
 * #708 part B (analysis D7-a): `MetaModel` has a collection for every Entity of the meta-application
 * whose rows belong to an application's `model` or `modelVersion` section. Excluded: the `devData`
 * Entities (application data, not model), `Commit` (Miroir's own transaction log, never created for
 * other applications) and the `Test` Entity with its history, retired in #726.
 */
import { describe, expect, it } from "vitest";

import { defaultMiroirMetaModel } from "miroir-app-miroir";
import { selfApplicationLibrary } from "miroir-example-library";

import { getApplicationSection } from "../../src/1_core/Model.js";
import { miroirFundamentalMlSchema } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalMlSchema.js";
import type { Entity } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

const excluded = new Set(["Commit", "Test", "TestVersion", "ApplicationVersionCrossTestVersion"]);

/** B0 characterization: the collection each Entity is expected in, by Entity name. */
const expectedCollections: Record<string, string> = {
  Entity: "entities",
  EntityVersion: "entityVersions",
  Endpoint: "endpoints",
  MlSchema: "mlSchemas",
  Menu: "menus",
  Query: "storedQueries",
  Report: "reports",
  Runner: "runners",
  SelfApplication: "applications",
  ApplicationModelBranch: "applicationModelBranches",
  SelfApplicationVersion: "applicationVersions",
  MiroirTest: "tests",
  TestConfiguration: "testConfigurations",
  Theme: "themes",
  Blob: "blobs",
  TransformerDefinition: "transformerDefinitions",
  QueryVersion: "queryVersions",
  ReportVersion: "reportVersions",
  MenuVersion: "menuVersions",
  EndpointVersion: "endpointVersions",
  RunnerVersion: "runnerVersions",
  ThemeVersion: "themeVersions",
  TransformerDefinitionVersion: "transformerDefinitionVersions",
  MlSchemaVersion: "mlSchemaVersions",
  MiroirTestVersion: "miroirTestVersions",
  BlobVersion: "blobVersions",
  TestConfigurationVersion: "testConfigurationVersions",
  ApplicationVersionCrossEntityVersion: "applicationVersionCrossEntityVersion",
  ApplicationVersionCrossQueryVersion: "applicationVersionCrossQueryVersion",
  ApplicationVersionCrossReportVersion: "applicationVersionCrossReportVersion",
  ApplicationVersionCrossMenuVersion: "applicationVersionCrossMenuVersion",
  ApplicationVersionCrossEndpointVersion: "applicationVersionCrossEndpointVersion",
  ApplicationVersionCrossRunnerVersion: "applicationVersionCrossRunnerVersion",
  ApplicationVersionCrossThemeVersion: "applicationVersionCrossThemeVersion",
  ApplicationVersionCrossTransformerDefinitionVersion: "applicationVersionCrossTransformerDefinitionVersion",
  ApplicationVersionCrossMlSchemaVersion: "applicationVersionCrossMlSchemaVersion",
  ApplicationVersionCrossMiroirTestVersion: "applicationVersionCrossMiroirTestVersion",
  ApplicationVersionCrossBlobVersion: "applicationVersionCrossBlobVersion",
  ApplicationVersionCrossTestConfigurationVersion: "applicationVersionCrossTestConfigurationVersion",
  EvolutionTraceRecord: "evolutionTraceRecords",
};

const modelEntities = (defaultMiroirMetaModel.entities as Entity[]).filter((entity) => {
  const section = getApplicationSection(selfApplicationLibrary.uuid, entity.uuid);
  return (section === "model" || section === "modelVersion") && !excluded.has(entity.name);
});
const metaModelKeys = new Set(
  Object.keys((miroirFundamentalMlSchema.definition.context as any).metaModel.definition),
);

describe("MetaModel collections (#708 D7-a)", () => {
  it("names a collection for every Entity of an application's model and history", () => {
    const unnamed = modelEntities.filter((entity) => !(entity.name in expectedCollections)).map((e) => e.name);
    expect(unnamed).toEqual([]);
  });

  it("B0: the collections MetaModel lacks today", () => {
    const missing = modelEntities
      .filter((entity) => !metaModelKeys.has(expectedCollections[entity.name]))
      .map((entity) => entity.name)
      .sort();
    expect(missing).toEqual([
      "ApplicationModelBranch",
      "ApplicationVersionCrossBlobVersion",
      "ApplicationVersionCrossTestConfigurationVersion",
      "Blob",
      "BlobVersion",
      "EvolutionTraceRecord",
      "TestConfiguration",
      "TestConfigurationVersion",
    ]);
  });
});
