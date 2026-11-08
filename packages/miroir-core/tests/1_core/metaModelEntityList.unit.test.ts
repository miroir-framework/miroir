/**
 * #703: every Entity Miroir defines is in the meta-model Entity list (`defaultMiroirMetaModel.entities`),
 * so section routing, application model initialization and the freeze treat them alike.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  appModelInitializeCreateEntityOrder,
  defaultMiroirMetaModel,
  miroirModelInitializeCreateEntityOrder,
  entityBlob,
  entityTest,
  entityTransformerDefinition,
  selfApplicationMiroir,
} from "miroir-app-miroir";
import { selfApplicationLibrary } from "miroir-example-library";

import { getApplicationSection, metaModelEntityUuids } from "../../src/1_core/Model.js";
import { selectEntitiesToFreeze } from "../../src/1_core/versioning/applicationVersionFreeze.js";
import type { Entity } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { resolveMonorepoRoot } from "../../src/5_tests/loadApplicationMiroirTestsFromFolders.js";

const miroirEntityFolder = join(
  resolveMonorepoRoot(),
  "packages/miroir-app-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
);
const lateEntities = [entityBlob, entityTest, entityTransformerDefinition] as Entity[];

describe("meta-model Entity list (#703)", () => {
  it("lists every Entity file of Miroir's model", () => {
    const fileEntities = readdirSync(miroirEntityFolder)
      .filter((file) => file.endsWith(".json"))
      .map((file) => JSON.parse(readFileSync(join(miroirEntityFolder, file), "utf8")) as Entity);
    const listed = new Set((defaultMiroirMetaModel.entities as Entity[]).map((entity) => entity.uuid));

    const missing = fileEntities.filter((entity) => !listed.has(entity.uuid)).map((entity) => entity.name);
    expect(missing).toEqual([]);
  });

  it("routes Blob, Test and TransformerDefinition to an application's model, and to Miroir's data", () => {
    for (const entity of lateEntities) {
      expect(metaModelEntityUuids, entity.name).toContain(entity.uuid);
      expect(getApplicationSection(selfApplicationLibrary.uuid, entity.uuid), `${entity.name} Library`).toBe("model");
      expect(getApplicationSection(selfApplicationMiroir.uuid, entity.uuid), `${entity.name} Miroir`).toBe("data");
    }
  });

  it("creates them when an application's model, or Miroir's, is initialized", () => {
    for (const order of [appModelInitializeCreateEntityOrder, miroirModelInitializeCreateEntityOrder]) {
      expect(order.map((entity) => entity.name)).toEqual(
        expect.arrayContaining(lateEntities.map((entity) => entity.name)),
      );
    }
  });

  it("leaves them out of an application's freeze, and keeps them in Miroir's", () => {
    const metaUuids = new Set(metaModelEntityUuids);
    expect(selectEntitiesToFreeze(selfApplicationLibrary.uuid, lateEntities, metaUuids)).toEqual([]);
    expect(
      selectEntitiesToFreeze(selfApplicationMiroir.uuid, lateEntities, metaUuids).map((entity) => entity.name),
    ).toEqual(lateEntities.map((entity) => entity.name));
  });
});
