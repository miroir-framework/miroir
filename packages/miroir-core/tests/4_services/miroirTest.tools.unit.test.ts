import { describe, expect, it, vi } from "vitest";
import * as vitest from "vitest";

import {
  effectiveMiroirTransformerSkip,
  miroirTransformerAssertionName,
  defaultMetaModelEnvironment,
  runMiroirTestInMemory,
} from "../../src";
import type { MiroirTestForTransformer } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

describe("Miroir transformer leaf helpers", () => {
  it("miroirTransformerAssertionName uses miroirTestLabel", () => {
    const leaf: MiroirTestForTransformer = {
      miroirTestType: "transformerTest",
      miroirTestLabel: "returns string schema",
      transformerName: "resolveConditionalSchema",
      transformer: {
        transformerType: "resolveConditionalSchema",
        schema: { type: "string" },
        valueObject: "test",
        context: "defaultValue",
        valuePath: [],
      } as any,
      runTestStep: "build",
      transformerParams: {},
      expectedValue: { type: "string" },
    };
    expect(miroirTransformerAssertionName(leaf)).toBe("returns string schema");
    expect(effectiveMiroirTransformerSkip(leaf).skip).toBeUndefined();
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
    const leaf: MiroirTestForTransformer = {
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
