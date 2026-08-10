/**
 * #227 Phase 2 — TransformerDefinitionVersion in freeze plan.
 */
import { describe, expect, it } from "vitest";

import { buildFreezeApplicationVersionPlan } from "../../src/1_core/versioning/applicationVersionFreeze.js";
import type { Entity } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

const APP_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const BRANCH_UUID = "ad1ddc4e-556e-4598-9cff-706a2bde0be7";

function makeEntity(uuid: string, name: string): Entity {
  return {
    uuid,
    name,
    parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
    parentName: "Entity",
    mlSchema: { type: "object", definition: { title: { type: "string" } } },
  };
}

function sequentialUuid() {
  let n = 0;
  return () => {
    n += 1;
    return `dddddddd-dddd-4ddd-8ddd-${String(n).padStart(12, "0")}`;
  };
}

const sampleTransformer = {
  uuid: "11111111-1111-4111-8111-111111111111",
  name: "transformer_menu_addItem",
  defaultLabel: "Add menu item",
  transformerInterface: {
    transformerParameterSchema: {
      transformerType: { type: "literal", definition: "transformer_menu_addItem" },
      transformerDefinition: { type: "object", definition: {} },
    },
    transformerResultSchema: {
      returns: "mlSchema" as const,
      definition: { type: "string" },
    },
  },
  transformerImplementation: {
    transformerImplementationType: "libraryImplementation" as const,
    inMemoryImplementationFunctionName: "handleTransformer_menu_AddItem",
  },
};

describe("227 Phase 2 — TransformerDefinitionVersion freeze plan", () => {
  it("assembles TransformerDefinitionVersions + Cross rows alongside Entity freeze", () => {
    const transformerDefinitions = [
      sampleTransformer,
      {
        ...sampleTransformer,
        uuid: "22222222-2222-4222-8222-222222222222",
        name: "transformer_copy",
        defaultLabel: "Copy transformer",
      },
    ];
    const plan = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V1-Transformers",
      entities: [makeEntity("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "Book")],
      transformerDefinitions,
      newUuid: sequentialUuid(),
    });

    expect(plan.transformerDefinitionVersions).toHaveLength(2);
    expect(plan.crossTransformerDefinitionVersions).toHaveLength(2);
    const tdvUuids = new Set(plan.transformerDefinitionVersions.map((tdv) => tdv.uuid));
    expect(tdvUuids.size).toBe(2);
    for (const cross of plan.crossTransformerDefinitionVersions) {
      expect(cross.applicationVersion).toBe(plan.selfApplicationVersion.uuid);
      expect(tdvUuids.has(cross.transformerDefinitionVersion)).toBe(true);
    }
  });

  it("omits TransformerDefinitionVersion rows when transformerDefinitions is empty", () => {
    const plan = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V1-NoTransformers",
      entities: [makeEntity("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "Book")],
      transformerDefinitions: [],
      newUuid: sequentialUuid(),
    });
    expect(plan.transformerDefinitionVersions).toEqual([]);
    expect(plan.crossTransformerDefinitionVersions).toEqual([]);
  });
});
