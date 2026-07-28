import { describe, expect, it } from "vitest";

import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";
import {
  defaultMiroirMetaModel,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  Entity,
  EntityVersion,
  SelfApplication,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  compareEntityPresentModelDefinitions,
  inventoryEntityEntityDefinitionJoins
} from "../../src/1_core/entityPresentModel.js";

const ENTITY_COLLECTION_UUID = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
const ENTITY_DEFINITION_COLLECTION_UUID = "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd";
const SELF_APPLICATION_COLLECTION_UUID = "a659d350-dd97-4da9-91de-524fa01745dc";
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../../");

const CANONICAL_MODEL_ROOTS = [
  "packages/miroir-test-app_deployment-miroir/assets/miroir_model",
  "packages/miroir-test-app_deployment-admin/assets/admin_model",
  "packages/miroir-test-app_deployment-library/assets/library_model",
  "packages/miroir-test-app_deployment-postgres/assets/postgres_model",
  "packages/miroir-test-app_deployment-designer/assets/designer_model",
] as const;

const CANONICAL_SELF_APPLICATION_PATHS = [
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data/a659d350-dd97-4da9-91de-524fa01745dc/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json",
  "packages/miroir-test-app_deployment-admin/assets/admin_model/a659d350-dd97-4da9-91de-524fa01745dc/55af124e-8c05-4bae-a3ef-0933d41daa92.json",
  "packages/miroir-test-app_deployment-library/assets/library_model/a659d350-dd97-4da9-91de-524fa01745dc/5af03c98-fe5e-490b-b08f-e1230971c57f.json",
  "packages/miroir-test-app_deployment-postgres/assets/postgres_model/a659d350-dd97-4da9-91de-524fa01745dc/84d28eb1-d98a-499e-bf24-62cade033da6.json",
  "packages/miroir-test-app_deployment-designer/assets/designer_model/a659d350-dd97-4da9-91de-524fa01745dc/880831db-4f76-40b1-97c0-6a2f3f4ffccb.json",
] as const;

function loadJsonInstancesFromCollection(
  modelRootRelativePath: string,
  collectionUuid: string,
): Array<Record<string, unknown>> {
  const collectionDir = join(repoRoot, modelRootRelativePath, collectionUuid);
  return readdirSync(collectionDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) =>
      JSON.parse(readFileSync(join(collectionDir, name), "utf8")) as Record<string, unknown>,
    );
}

describe("217 Phase 3 — versioningEnabled on canonical applications", () => {
  for (const relativePath of CANONICAL_SELF_APPLICATION_PATHS) {
    it(`${relativePath} has versioningEnabled: true`, () => {
      const application = JSON.parse(
        readFileSync(join(repoRoot, relativePath), "utf8"),
      ) as SelfApplication;
      expect(application.versioningEnabled).toBe(true);
    });
  }

  it("selfApplicationMiroir export has versioningEnabled: true", () => {
    expect((selfApplicationMiroir as SelfApplication).versioningEnabled).toBe(true);
  });

  it("defaultLibraryAppModel application has versioningEnabled: true", () => {
    const application = defaultLibraryAppModel.applications[0] as SelfApplication;
    expect(application.versioningEnabled).toBe(true);
  });
});
