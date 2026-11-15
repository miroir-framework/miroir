/**
 * #708 part B, Slice B0: what a freeze keeps of each live row. A model read back from a version must equal
 * the model that was frozen (analysis D7-a, plan Q-B4), so a snapshot keeps every field of the live row but
 * the identity ones. This characterization records, per element type, the fields of the real rows of Library
 * and Miroir that the snapshot drops: B0 recorded the gaps, Slice B3 closed them.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  checkModelValidationInstance,
  defaultMiroirModelEnvironment,
  miroirFundamentalMlSchemaUuid,
  type MlElement,
} from "@miroir-framework/core";

import {
  snapshotEndpointsAsHistoricalEndpointVersions,
  snapshotMenusAsHistoricalMenuVersions,
  snapshotMiroirTestsAsHistoricalMiroirTestVersions,
  snapshotMlSchemasAsHistoricalMlSchemaVersions,
  snapshotQueriesAsHistoricalQueryVersions,
  snapshotReportsAsHistoricalReportVersions,
  snapshotRunnersAsHistoricalRunnerVersions,
  snapshotThemesAsHistoricalThemeVersions,
  snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions,
} from "../src/applicationVersionFreeze.js";

const monorepoRoot = fileURLToPath(new URL("../../..", import.meta.url));

const identityFields = new Set(["uuid", "parentUuid", "parentName", "parentDefinitionVersionUuid", "conceptLevel"]);

const assetFolders = [
  "packages/miroir-example-library/assets/library_model",
  "packages/miroir-app-miroir/assets/miroir_data",
];

/** The rows of an Entity in Library's model and Miroir's data, from the asset files. */
function realRows(entityUuid: string): Record<string, unknown>[] {
  return assetFolders.flatMap((folder) => {
    const path = join(monorepoRoot, folder, entityUuid);
    let files: string[];
    try {
      files = readdirSync(path).filter((file) => file.endsWith(".json"));
    } catch {
      return [];
    }
    return files.map((file) => JSON.parse(readFileSync(join(path, file), "utf8")));
  });
}

const elementTypes: {
  name: string;
  entityUuid: string;
  snapshot: (rows: any[]) => Record<string, unknown>[];
}[] = [
  { name: "Query", entityUuid: "e4320b9e-ab45-4abe-85d8-359604b3c62f", snapshot: snapshotQueriesAsHistoricalQueryVersions },
  { name: "Report", entityUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916", snapshot: snapshotReportsAsHistoricalReportVersions },
  { name: "Menu", entityUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842", snapshot: snapshotMenusAsHistoricalMenuVersions },
  { name: "Endpoint", entityUuid: "3d8da4d4-8f76-4bb4-9212-14869d81c00c", snapshot: snapshotEndpointsAsHistoricalEndpointVersions },
  { name: "Runner", entityUuid: "e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd", snapshot: snapshotRunnersAsHistoricalRunnerVersions },
  { name: "Theme", entityUuid: "bdcf956a-771d-40a1-a878-06e0bf6efd3e", snapshot: snapshotThemesAsHistoricalThemeVersions },
  {
    name: "TransformerDefinition",
    entityUuid: "a557419d-a288-4fb8-8a1e-971c86c113b8",
    snapshot: snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions,
  },
  { name: "MlSchema", entityUuid: "5e81e1b9-38be-487c-b3e5-53796c57fccf", snapshot: snapshotMlSchemasAsHistoricalMlSchemaVersions },
  { name: "MiroirTest", entityUuid: "a311f363-e238-4203-bdfc-29e8c160c26b", snapshot: snapshotMiroirTestsAsHistoricalMiroirTestVersions },
];

/** Per element type, the fields of a live row that its snapshot does not hold at the top level. */
function droppedFields(): Record<string, string[]> {
  return Object.fromEntries(
    elementTypes.map(({ name, entityUuid, snapshot }) => {
      const rows = realRows(entityUuid);
      const versions = snapshot(rows);
      const dropped = new Set<string>();
      rows.forEach((row, index) => {
        Object.keys(row)
          .filter((field) => !identityFields.has(field) && !(field in versions[index]))
          .forEach((field) => dropped.add(field));
      });
      return [name, [...dropped].sort()];
    }),
  );
}

describe("freeze snapshot fields (#708 B0, B3)", () => {
  it("reads real rows of every older element type", () => {
    const empty = elementTypes.filter(({ entityUuid }) => realRows(entityUuid).length === 0).map(({ name }) => name);
    expect(empty).toEqual([]);
  });

  it("B3: a snapshot keeps every field of the live row but the identity ones", () => {
    const dropped = Object.fromEntries(Object.entries(droppedFields()).filter(([, fields]) => fields.length > 0));
    expect(dropped).toEqual({});
  });

  it("B3: every snapshot is an instance of its version type in the fundamental schema", () => {
    const failing = elementTypes.flatMap(({ name, entityUuid, snapshot }) => {
      const versionType: MlElement = {
        type: "schemaReference",
        definition: { absolutePath: miroirFundamentalMlSchemaUuid, relativePath: `${name.charAt(0).toLowerCase()}${name.slice(1)}Version` },
      } as MlElement;
      return snapshot(realRows(entityUuid))
        .map((version) => checkModelValidationInstance(versionType, version, name, defaultMiroirModelEnvironment))
        .filter((check) => check.status === "error")
        .map((check) => `${name} ${check.label}`);
    });
    expect(failing).toEqual([]);
  });
});
