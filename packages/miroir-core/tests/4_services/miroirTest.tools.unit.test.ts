import { describe, expect, it, vi } from "vitest";
import * as vitest from "vitest";

import {
  asFunctionCallTestFromMiroir,
  asQueryRunnerTestFromMiroir,
  asTransformerTestFromMiroirLeaf,
  defaultMetaModelEnvironment,
  runMiroirTestInMemory,
} from "../../src";
import type {
  MiroirFunctionCallTest,
  MiroirQueryRunnerTest,
  MiroirTestTransformerLeaf,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

describe("MiroirTestTools adapters (Phase 1)", () => {
  it("asTransformerTestFromMiroirLeaf maps unified leaf to TransformerTest", () => {
    const leaf: MiroirTestTransformerLeaf = {
      miroirTestType: "transformerTest",
      miroirTestLabel: "returns string schema",
      transformerName: "resolveConditionalSchema",
      transformer: {
        transformerType: "resolveConditionalSchema",
        schema: { type: "string" },
        valueObject: "test",
        context: "defaultValue",
        valuePath: [],
      },
      runTestStep: "build",
      transformerParams: {},
      expectedValue: { type: "string" },
    };
    const transformerTest = asTransformerTestFromMiroirLeaf(leaf);
    expect(transformerTest.transformerTestType).toBe("transformerTest");
    expect(transformerTest.transformerTestLabel).toBe("returns string schema");
    expect(transformerTest.transformerName).toBe("resolveConditionalSchema");
    expect(transformerTest.expectedValue).toEqual({ type: "string" });
  });

  it("asFunctionCallTestFromMiroir renames label discriminator", () => {
    const leaf: MiroirFunctionCallTest = {
      miroirTestType: "functionCallTest",
      miroirTestLabel: "mustache case",
      functionRef: {
        module: "miroir-core/1_core/mustache",
        export: "extractDoubleBracePatterns",
      },
      arguments: ["Hello {{ name }}!"],
      expectedValue: [{ content: "name", start: 6, end: 15 }],
    };
    const unitTest = asFunctionCallTestFromMiroir(leaf);
    expect(unitTest.unitTestType).toBe("functionCallTest");
    expect(unitTest.unitTestLabel).toBe("mustache case");
  });

  it("asQueryRunnerTestFromMiroir renames label discriminator", () => {
    const leaf: MiroirQueryRunnerTest = {
      miroirTestType: "queryRunnerTest",
      miroirTestLabel: "query case",
      runner: "inMemory",
      assertions: [{ label: "count", expectedValue: 1 }],
    };
    const unitTest = asQueryRunnerTestFromMiroir(leaf);
    expect(unitTest.unitTestType).toBe("queryRunnerTest");
    expect(unitTest.unitTestLabel).toBe("query case");
  });
});

describe("runMiroirTestInMemory (Phase 1)", () => {
  it("executes functionCallTest leaf in unit mode", async () => {
    const tracker = {
      getCurrentTestAssertionPath: () => [{ test: "t" }, { testAssertion: "t" }],
      setTestAssertionResult: vi.fn(),
    };
    await runMiroirTestInMemory(
      vitest,
      ["mustache"],
      undefined,
      {
        miroirTestType: "functionCallTest",
        miroirTestLabel: "should extract patterns with double braces",
        functionRef: {
          module: "miroir-core/1_core/mustache",
          export: "extractDoubleBracePatterns",
        },
        arguments: ["Hello {{ name }}!"],
        expectedValue: [{ content: "name", start: 6, end: 15 }],
      },
      defaultMetaModelEnvironment,
      tracker as any,
      undefined,
      false,
      {} as any,
      { executionMode: "unit" },
      [{ test: "t" }, { testAssertion: "t" }],
    );
    expect(tracker.setTestAssertionResult).toHaveBeenCalledWith(
      [{ test: "t" }, { testAssertion: "t" }],
      expect.objectContaining({ assertionResult: "ok" }),
    );
  });

  it("rejects functionCallTest in integration mode", async () => {
    await expect(
      runMiroirTestInMemory(
        vitest,
        ["mustache"],
        undefined,
        {
          miroirTestType: "functionCallTest",
          miroirTestLabel: "fn",
          functionRef: { module: "miroir-core/1_core/mustache", export: "extractDoubleBracePatterns" },
          arguments: ["x"],
          expectedValue: [],
        },
        defaultMetaModelEnvironment,
        { getCurrentTestAssertionPath: () => [], setTestAssertionResult: vi.fn() } as any,
        undefined,
        false,
        {} as any,
        { executionMode: "integration", integrationStore: {} },
      ),
    ).rejects.toThrow(/cannot run in integration mode/);
  });

  it("executes transformerTest leaf in unit mode", async () => {
    const tracker = {
      getCurrentTestAssertionPath: () => [{ test: "t" }, { testAssertion: "t" }],
      setTestAssertionResult: vi.fn(),
    };
    await runMiroirTestInMemory(
      vitest,
      ["plus"],
      undefined,
      {
        miroirTestType: "transformerTest",
        miroirTestLabel: "1 + 2",
        transformerName: "plus",
        transformer: {
          transformerType: "+",
          interpolation: "runtime",
          args: [
            { transformerType: "returnValue", interpolation: "runtime", value: 1 },
            { transformerType: "returnValue", interpolation: "runtime", value: 2 },
          ],
        },
        expectedValue: 3,
      },
      defaultMetaModelEnvironment,
      tracker as any,
      undefined,
      false,
      {} as any,
      { executionMode: "unit" },
      [{ test: "t" }, { testAssertion: "t" }],
    );
    expect(tracker.setTestAssertionResult).toHaveBeenCalledWith(
      [{ test: "t" }, { testAssertion: "t" }],
      expect.objectContaining({ assertionResult: "ok" }),
    );
  });

  it("requires integrationStore for transformer integration mode", async () => {
    const leaf: MiroirTestTransformerLeaf = {
      miroirTestType: "transformerTest",
      miroirTestLabel: "t",
      transformerName: "plus",
      transformer: {
        transformerType: "+",
        interpolation: "runtime",
        args: [
          { transformerType: "returnValue", interpolation: "runtime", value: 1 },
          { transformerType: "returnValue", interpolation: "runtime", value: 2 },
        ],
      },
      expectedValue: 3,
    };
    await expect(
      runMiroirTestInMemory(
        vitest,
        ["t"],
        undefined,
        leaf,
        defaultMetaModelEnvironment,
        { getCurrentTestAssertionPath: () => [], setTestAssertionResult: vi.fn() } as any,
        undefined,
        false,
        {} as any,
        { executionMode: "integration" },
      ),
    ).rejects.toThrow(/integrationStore is required/);
  });
});
