import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * #217 Phase 12 — vocabulary rename gate (EntityDefinition → EntityVersion).
 * Rename-only: no present-model authority change. UI hub remains until a follow-up slice.
 */

const REPO_ROOT = join(import.meta.dirname, "../../../..");

const ENTITY_ENTITY_VERSION_ASSET = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_model",
  "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json",
);

const ENTITY_VERSION_OF_ENTITY_VERSION_ASSET = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_model",
  "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
  "bdd7ad43-f0fc-4716-90c1-87454c40dd95.json",
);

const AVCED_ENTITY_ASSET = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_model",
  "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  "8bec933d-6287-4de7-8a88-5c24216de9f4.json",
);

const FUNDAMENTAL_TYPE = join(
  REPO_ROOT,
  "packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts",
);

const FUNDAMENTAL_SCHEMA_BUILDER = join(
  REPO_ROOT,
  "packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts",
);

const ENTITY_PRESENT_MODEL = join(
  REPO_ROOT,
  "packages/miroir-core/src/1_core/entityPresentModel.ts",
);

const INDEX_TS = join(REPO_ROOT, "packages/miroir-core/src/index.ts");

describe("217 Phase 12 — EntityDefinition → EntityVersion vocabulary gate", () => {
  it("bootstrap Entity formerly EntityDefinition is named EntityVersion (UUID preserved)", () => {
    const asset = JSON.parse(readFileSync(ENTITY_ENTITY_VERSION_ASSET, "utf8"));
    expect(asset.uuid).toBe("54b9c72f-d4f3-4db9-9e0e-0dc840b530bd");
    expect(asset.name).toBe("EntityVersion");
    expect(asset.name).not.toBe("EntityDefinition");
  });

  it("self-describing EntityVersion instance uses parentName EntityVersion", () => {
    const asset = JSON.parse(readFileSync(ENTITY_VERSION_OF_ENTITY_VERSION_ASSET, "utf8"));
    expect(asset.uuid).toBe("bdd7ad43-f0fc-4716-90c1-87454c40dd95");
    expect(asset.parentUuid).toBe("54b9c72f-d4f3-4db9-9e0e-0dc840b530bd");
    expect(asset.parentName).toBe("EntityVersion");
    expect(asset.name).toBe("EntityVersion");
  });

  it("ApplicationVersionCrossEntityDefinition is renamed ApplicationVersionCrossEntityVersion", () => {
    const asset = JSON.parse(readFileSync(AVCED_ENTITY_ASSET, "utf8"));
    expect(asset.uuid).toBe("8bec933d-6287-4de7-8a88-5c24216de9f4");
    expect(asset.name).toBe("ApplicationVersionCrossEntityVersion");
  });

  it("fundamental schema builder registers entityVersion context key", () => {
    const src = readFileSync(FUNDAMENTAL_SCHEMA_BUILDER, "utf8");
    expect(src).toMatch(/\bentityVersion\s*:/);
    expect(src).toContain("entityVersion: entityDefinitionEntityDefinitionV1.mlSchema");
  });

  it("generated types export EntityVersion and deprecated EntityDefinition alias", () => {
    const generated = readFileSync(FUNDAMENTAL_TYPE, "utf8");
    expect(generated).toMatch(/export type EntityVersion\s*=/);
    const index = readFileSync(INDEX_TS, "utf8");
    // Public surface keeps EntityDefinition as deprecated alias for one release
    expect(index).toMatch(/EntityDefinition/);
    expect(index).toMatch(/EntityVersion/);
  });

  it("UI hub presentEntityAsRedundantEntityDefinition remains (deferred off vocabulary slice)", () => {
    const hub = readFileSync(ENTITY_PRESENT_MODEL, "utf8");
    expect(hub).toContain("presentEntityAsRedundantEntityDefinition");
  });
});
