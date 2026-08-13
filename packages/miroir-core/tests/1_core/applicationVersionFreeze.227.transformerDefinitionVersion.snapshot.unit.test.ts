/**
 * #227 Phase 1 — snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions.
 */
import { describe, expect, it } from "vitest";

import {
  TRANSFORMER_DEFINITION_VERSION_ENTITY_UUID,
  snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions,
  type StoredTransformerDefinitionForFreeze,
} from "../../src/1_core/versioning/applicationVersionFreeze.js";

function makeTransformer(
  uuid: string,
  name: string,
  extra?: Partial<StoredTransformerDefinitionForFreeze>,
): StoredTransformerDefinitionForFreeze {
  return {
    uuid,
    name,
    defaultLabel: `${name} Label`,
    classification: "basic",
    transformerInterface: {
      transformerParameterSchema: {
        transformerType: { type: "literal", definition: name },
        transformerDefinition: { type: "object", definition: {} },
      },
      transformerResultSchema: {
        returns: "mlSchema",
        definition: { type: "string" },
      },
    },
    transformerImplementation: {
      transformerImplementationType: "libraryImplementation",
      inMemoryImplementationFunctionName: `handle_${name}`,
    },
    description: `${name} description`,
    ...extra,
  };
}

describe("227 Phase 1 — snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions", () => {
  const deterministic = (() => {
    let counter = 0;
    return () => `xxxxxxxx-xxxx-4xxx-8xxx-${String(++counter).padStart(12, "0")}`;
  })();

  it("produces TransformerDefinitionVersion with new UUID ≠ live transformer uuid", () => {
    const transformer = makeTransformer(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "transformer_menu_addItem",
    );
    const [tdv] = snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions(
      [transformer],
      { newUuid: deterministic },
    );
    expect(tdv.uuid).not.toBe(transformer.uuid);
  });

  it("sets transformerUuid to live TransformerDefinition.uuid", () => {
    const transformer = makeTransformer(
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      "transformer_test",
    );
    const [tdv] = snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions(
      [transformer],
      { newUuid: deterministic },
    );
    expect(tdv.transformerUuid).toBe(transformer.uuid);
  });

  it("sets parentUuid/parentName to historical TransformerDefinitionVersion entity", () => {
    const transformer = makeTransformer(
      "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      "transformer_copy",
    );
    const [tdv] = snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions(
      [transformer],
      { newUuid: deterministic },
    );
    expect(tdv.parentUuid).toBe(TRANSFORMER_DEFINITION_VERSION_ENTITY_UUID);
    expect(tdv.parentName).toBe("TransformerDefinitionVersion");
  });

  it("copies name, defaultLabel, description, definition body", () => {
    const transformer = makeTransformer(
      "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      "transformer_merge",
    );
    const [tdv] = snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions(
      [transformer],
      { newUuid: deterministic },
    );
    expect(tdv.name).toBe("transformer_merge");
    expect(tdv.defaultLabel).toBe("transformer_merge Label");
    expect(tdv.description).toBe("transformer_merge description");
    expect(tdv.definition.transformerInterface).toEqual(transformer.transformerInterface);
    expect(tdv.definition.transformerImplementation).toEqual(
      transformer.transformerImplementation,
    );
    expect(tdv.definition.classification).toBe("basic");
  });

  it("deep isolation: mutating source implementation after snapshot does not affect copy", () => {
    const transformer = makeTransformer("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", "Mutable");
    const [tdv] = snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions(
      [transformer],
      { newUuid: deterministic },
    );
    if (transformer.transformerImplementation.transformerImplementationType === "libraryImplementation") {
      transformer.transformerImplementation.inMemoryImplementationFunctionName = "mutated";
    }
    expect(
      (tdv.definition.transformerImplementation as { inMemoryImplementationFunctionName?: string })
        .inMemoryImplementationFunctionName,
    ).toBe("handle_Mutable");
  });

  it("empty transformer list produces empty result", () => {
    expect(snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions([])).toEqual(
      [],
    );
  });

  it("throws on TransformerDefinition without transformerImplementation", () => {
    const incomplete = {
      uuid: "11111111-1111-4111-8111-111111111111",
      name: "Incomplete",
      defaultLabel: "Incomplete",
      transformerInterface: makeTransformer("11111111-1111-4111-8111-111111111111", "Incomplete")
        .transformerInterface,
    } as StoredTransformerDefinitionForFreeze;
    expect(() =>
      snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions([incomplete]),
    ).toThrow(/transformerImplementation/);
  });
});
