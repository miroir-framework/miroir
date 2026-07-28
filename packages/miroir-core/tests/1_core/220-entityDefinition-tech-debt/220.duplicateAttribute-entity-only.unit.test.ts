/**
 * #220 — entity_DuplicateAttribute Entity-only (no EntityVersion).
 * Plan: duplicateAttribute-entity-only-tdd-plan.md
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "../../../../..");

const MODEL_ENDPOINT = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data",
  "3d8da4d4-8f76-4bb4-9212-14869d81c00c",
  "7947ae40-eb34-4149-887b-15a9021e714e.json",
);

function duplicateAttributeAction(endpoint: any) {
  const actions = endpoint?.definition?.actions ?? [];
  const action = actions.find(
    (a: any) => a?.actionParameters?.actionType?.definition === "entity_DuplicateAttribute",
  );
  expect(action, "entity_DuplicateAttribute action missing from ModelEndpoint").toBeTruthy();
  return action;
}

describe("220 entity_DuplicateAttribute Entity-only — Slice 1 implementation", () => {
  it("actionImplementation looks up Entities, not EntityVersions, and alter has no entityVersionUuid", () => {
    const endpoint = JSON.parse(readFileSync(MODEL_ENDPOINT, "utf8"));
    const action = duplicateAttributeAction(endpoint);
    const impl = action.actionImplementation;
    expect(impl?.actionImplementationType).toBe("compositeActionTemplate");

    const serialized = JSON.stringify(impl);
    expect(serialized).not.toMatch(/sourceEntityDefinitionUuid/);
    expect(serialized).not.toMatch(/targetEntityDefinitionUuid/);
    expect(serialized).not.toMatch(/entityVersionUuid/);
    expect(serialized).not.toMatch(/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/); // EntityVersion entity uuid
    expect(serialized).not.toMatch(/EntittyDefinition|EntityDefinition|EntityVersion/);

    expect(serialized).toMatch(/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/); // Entity entity uuid
    expect(serialized).toMatch(/sourceEntityUuid/);
    expect(serialized).toMatch(/targetEntityUuid/);

    const seq = impl.definition.payload.actionSequence;
    const alter = seq.find((s: any) => s.actionType === "alterEntityAttribute");
    expect(alter).toBeTruthy();
    expect(alter.payload).not.toHaveProperty("entityVersionUuid");
    expect(alter.payload.entityUuid).toBeTruthy();
  });
});

describe("220 entity_DuplicateAttribute Entity-only — Slice 2 action schema", () => {
  it("payload schema has no *EntityDefinitionUuid", () => {
    const endpoint = JSON.parse(readFileSync(MODEL_ENDPOINT, "utf8"));
    const action = duplicateAttributeAction(endpoint);
    const payloadDef = action.actionParameters.payload.definition;
    expect(payloadDef).not.toHaveProperty("sourceEntityDefinitionUuid");
    expect(payloadDef).not.toHaveProperty("targetEntityDefinitionUuid");
    expect(payloadDef).toHaveProperty("sourceEntityUuid");
    expect(payloadDef).toHaveProperty("targetEntityUuid");
  });

  it("generated types have no *EntityDefinitionUuid on entity_DuplicateAttribute", () => {
    const src = readFileSync(
      join(
        REPO_ROOT,
        "packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts",
      ),
      "utf8",
    );
    const start = src.indexOf('actionType: "entity_DuplicateAttribute"');
    expect(start).toBeGreaterThanOrEqual(0);
    const end = src.indexOf('actionType: "renameEntity"', start);
    const body = src.slice(start, end > start ? end : start + 800);
    expect(body).toContain("sourceEntityUuid");
    expect(body).toContain("targetEntityUuid");
    expect(body).not.toContain("EntityDefinitionUuid");
  });
});

describe("220 entity_DuplicateAttribute Entity-only — Slice 4 callers grep gate", () => {
  it("MiroirTest Duplicate leaf does not pass *EntityDefinitionUuid", () => {
    const suite = JSON.parse(
      readFileSync(
        join(
          REPO_ROOT,
          "packages/miroir-test-app_deployment-miroir/assets/miroir_data",
          "a311f363-e238-4203-bdfc-29e8c160c26b",
          "a1b2c3d4-5e6f-4789-a0b1-c2d3e4f5a6b7.json",
        ),
        "utf8",
      ),
    );
    const leaf = suite.definition.miroirTests.find(
      (t: any) =>
        typeof t.miroirTestLabel === "string" &&
        t.miroirTestLabel.includes("Duplicate iso3166"),
    );
    expect(leaf).toBeTruthy();
    const dup = leaf.compositeActionSequence.payload.actionSequence.find(
      (a: any) => a.actionType === "entity_DuplicateAttribute",
    );
    expect(dup).toBeTruthy();
    expect(dup.payload).not.toHaveProperty("sourceEntityDefinitionUuid");
    expect(dup.payload).not.toHaveProperty("targetEntityDefinitionUuid");
    expect(dup.payload.sourceEntityUuid).toBe("d3139a6d-0486-4ec8-bded-2a83a3c3cee4");
    expect(dup.payload.targetEntityUuid).toBe("a027c379-8468-43a5-ba4d-bf618be25cab");
  });
});
