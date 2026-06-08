import { describe, expect, it } from "vitest";

import {
  asTransformerTestFromUnitTest,
  defaultMetaModelEnvironment,
  entityDefinitionTransformerTest,
  entityDefinitionUnitTest,
  getInnermostTypeCheckError,
  jzodTypeCheck,
  unitTestSuiteToTransformerTestSuite,
} from "../../src";
import { unitTest_pilot_transformer_plus } from "miroir-test-app_deployment-miroir";
import type {
  EntityDefinition,
  JzodElement,
  UnitTestAsTransformerTest,
  UnitTestSuite,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

const unitTestJzodSchema = (entityDefinitionUnitTest as unknown as EntityDefinition)
  .mlSchema as unknown as JzodElement;

describe("UnitTestDefinition schema (Phase 1)", () => {
  it("validates pilot UnitTestDefinition instance via jzodTypeCheck", () => {
    const result = jzodTypeCheck(
      unitTestJzodSchema,
      unitTest_pilot_transformer_plus,
      [],
      [],
      defaultMetaModelEnvironment,
      {},
    );
    if (result.status === "error") {
      console.error(getInnermostTypeCheckError(result));
    }
    expect(result.status).toBe("ok");
    const suite = unitTest_pilot_transformer_plus.definition as UnitTestSuite;
    expect(suite.unitTestType).toBe("unitTestSuite");
    expect(suite.unitTestLabel).toBe("pilot_resolveConditionalSchema");
    expect(suite.unitTests[0].unitTestType).toBe("transformerTest");
  });

  it("does not alter TransformerTest EntityDefinition (non-regression)", () => {
    expect(entityDefinitionTransformerTest.name).toBe("TransformerTest");
    expect(entityDefinitionTransformerTest.uuid).toBe(
      "405bb1fc-a20f-4def-9d3a-206f72350633",
    );
    expect(entityDefinitionUnitTest.name).toBe("UnitTest");
    expect(entityDefinitionUnitTest.uuid).toBe(
      "ab96dd2a-41fc-45c5-86a5-9a245c5c4d85",
    );
    expect(entityDefinitionTransformerTest.name).not.toBe(entityDefinitionUnitTest.name);
  });
});

describe("asTransformerTestFromUnitTest", () => {
  it("unwraps payload and preserves expected value", () => {
    const suite = unitTest_pilot_transformer_plus.definition as UnitTestSuite;
    const leaf = suite.unitTests[0] as UnitTestAsTransformerTest;
    const transformerTest = asTransformerTestFromUnitTest(leaf);
    expect(transformerTest.transformerTestType).toBe("transformerTest");
    expect(transformerTest.transformerName).toBe("resolveConditionalSchema");
    expect(transformerTest.expectedValue).toEqual({ type: "string" });
    expect(transformerTest.transformerTestLabel).toBe(
      "returns the original schema if no ifThenElseMMLS tag is present",
    );
  });

  it("merges skip flags from wrapper and parent", () => {
    const leaf: UnitTestAsTransformerTest = {
      unitTestType: "transformerTest",
      skip: true,
      payload: {
        transformerTestType: "transformerTest",
        transformerTestLabel: "x",
        transformerName: "plus",
        transformer: {
          transformerType: "plus",
          interpolation: "runtime",
          left: { transformerType: "returnValue", interpolation: "runtime", value: 1 },
          right: { transformerType: "returnValue", interpolation: "runtime", value: 2 },
        },
        expectedValue: 3,
      },
    };
    const result = asTransformerTestFromUnitTest(leaf, false);
    expect(result.skip).toBe(true);
  });
});

describe("unitTestSuiteToTransformerTestSuite", () => {
  it("converts pilot suite to TransformerTestSuite", () => {
    const suite = unitTest_pilot_transformer_plus.definition as UnitTestSuite;
    const converted = unitTestSuiteToTransformerTestSuite(suite);
    expect(converted.transformerTestType).toBe("transformerTestSuite");
    expect(converted.transformerTests).toHaveLength(1);
    expect(converted.transformerTests[0].transformerTestType).toBe("transformerTest");
  });

  it("rejects non-transformer leaf tests", () => {
    const suite: UnitTestSuite = {
      unitTestType: "unitTestSuite",
      unitTestLabel: "mixed",
      unitTests: [
        {
          unitTestType: "functionCallTest",
          unitTestLabel: "fn",
          functionRef: { module: "m", export: "f" },
        },
      ],
    };
    expect(() => unitTestSuiteToTransformerTestSuite(suite)).toThrow(/unsupported unitTestType/);
  });
});

describe("runUnitTests dispatch (Phase 1)", () => {
  it("runUnitTestInMemory rejects functionCallTest until Phase 2", async () => {
    const { runUnitTestInMemory, runUnitTests } = await import("../../src/4_services/UnitTestTools");
    await expect(
      runUnitTestInMemory(
        expect as any,
        ["suite"],
        undefined,
        {
          unitTestType: "functionCallTest",
          unitTestLabel: "fn",
          functionRef: { module: "m", export: "f" },
        },
        defaultMetaModelEnvironment,
        { getCurrentTestAssertionPath: () => undefined } as any,
        undefined,
        false,
        runUnitTests,
      ),
    ).rejects.toThrow(/Phase 2/);
  });
});
