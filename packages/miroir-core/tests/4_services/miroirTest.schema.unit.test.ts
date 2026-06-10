import { describe, expect, it } from "vitest";

import {
  defaultMetaModelEnvironment,
  entityDefinitionMiroirTest,
  entityDefinitionTransformerTest,
  entityDefinitionUnitTest,
  entityMiroirTest,
  getInnermostTypeCheckError,
  jzodTypeCheck,
  miroirTest_mustache,
  miroirTest_queries_library,
  miroirTest_pilot_transformer_plus,
  miroirTest_schema_pilot_empty,
} from "../../src";
import type {
  EntityDefinition,
  JzodElement,
  MiroirTestDefinition,
  MiroirTestSuite,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

const miroirTestJzodSchema = (entityDefinitionMiroirTest as unknown as EntityDefinition)
  .mlSchema as unknown as JzodElement;

describe("MiroirTestDefinition schema (Phase 0)", () => {
  it("registers MiroirTest entity separate from UnitTest and TransformerTest", () => {
    expect(entityMiroirTest.name).toBe("MiroirTest");
    expect(entityMiroirTest.uuid).toBe("a311f363-e238-4203-bdfc-29e8c160c26b");
    expect(entityDefinitionMiroirTest.name).toBe("MiroirTest");
    expect(entityDefinitionMiroirTest.uuid).toBe("51c647fe-07ec-411c-89cc-02689dc66d6a");
    expect(entityDefinitionUnitTest.name).toBe("UnitTest");
    expect(entityDefinitionTransformerTest.name).toBe("TransformerTest");
    expect(entityDefinitionMiroirTest.name).not.toBe(entityDefinitionUnitTest.name);
  });

  it("validates empty pilot MiroirTest instance via jzodTypeCheck", () => {
    const result = jzodTypeCheck(
      miroirTestJzodSchema,
      miroirTest_schema_pilot_empty,
      [],
      [],
      defaultMetaModelEnvironment,
      {},
    );
    if (result.status === "error") {
      console.error(getInnermostTypeCheckError(result));
    }
    expect(result.status).toBe("ok");

    const suite = (miroirTest_schema_pilot_empty as MiroirTestDefinition)
      .definition as MiroirTestSuite;
    expect(suite.miroirTestType).toBe("miroirTestSuite");
    expect(suite.miroirTestLabel).toBe("schema_pilot_empty");
    expect(suite.miroirTests).toEqual([]);
  });

  it("validates pilot_transformer_plus MiroirTest instance via jzodTypeCheck", () => {
    const result = jzodTypeCheck(
      miroirTestJzodSchema,
      miroirTest_pilot_transformer_plus,
      [],
      [],
      defaultMetaModelEnvironment,
      {},
    );
    if (result.status === "error") {
      console.error(getInnermostTypeCheckError(result));
    }
    expect(result.status).toBe("ok");

    const suite = (miroirTest_pilot_transformer_plus as MiroirTestDefinition)
      .definition as MiroirTestSuite;
    expect(suite.miroirTestLabel).toBe("pilot_resolveConditionalSchema");
    expect(suite.miroirTests).toHaveLength(1);
    expect(suite.miroirTests[0]).toMatchObject({
      miroirTestType: "transformerTest",
      transformerName: "resolveConditionalSchema",
    });
  });

  it("validates mustache MiroirTest instance via jzodTypeCheck", () => {
    const result = jzodTypeCheck(
      miroirTestJzodSchema,
      miroirTest_mustache,
      [],
      [],
      defaultMetaModelEnvironment,
      {},
    );
    if (result.status === "error") {
      console.error(getInnermostTypeCheckError(result));
    }
    expect(result.status).toBe("ok");

    const suite = (miroirTest_mustache as MiroirTestDefinition).definition as MiroirTestSuite;
    expect(suite.miroirTestLabel).toBe("mustache.extractDoubleBracePatterns");
    expect(suite.miroirTests).toHaveLength(6);
    expect(suite.miroirTests[0]).toMatchObject({
      miroirTestType: "functionCallTest",
      functionRef: {
        module: "miroir-core/1_core/mustache",
        export: "extractDoubleBracePatterns",
      },
    });
  });

  it("validates queries_library MiroirTest instance via jzodTypeCheck", () => {
    const result = jzodTypeCheck(
      miroirTestJzodSchema,
      miroirTest_queries_library,
      [],
      [],
      defaultMetaModelEnvironment,
      {},
    );
    if (result.status === "error") {
      console.error(getInnermostTypeCheckError(result));
    }
    expect(result.status).toBe("ok");

    const suite = (miroirTest_queries_library as MiroirTestDefinition)
      .definition as MiroirTestSuite;
    expect(suite.miroirTestLabel).toBe("queries.library");
    expect(suite.miroirTests).toHaveLength(17);
    expect(suite.miroirTests[0]).toMatchObject({
      miroirTestType: "queryRunnerTest",
      runner: "runQueryFromDomainState",
      fixtureRef: "libraryDomainState",
    });
  });
});
