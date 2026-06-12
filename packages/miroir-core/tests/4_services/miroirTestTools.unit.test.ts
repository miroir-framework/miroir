import { describe, expect, it, vi } from "vitest";
import * as vitest from "vitest";

import {
  effectiveMiroirTransformerSkip,
  miroirTransformerAssertionName,
  defaultMetaModelEnvironment,
  listQueryRunnerFixtureRefs,
  listWhitelistedFunctionRefs,
  miroirTestForFunctionCall,
  miroirTestForQuery,
  miroirTest_pilot_transformer_plus,
  miroirTest_queries_library,
  resolveFunctionCallTarget,
  resolveQueryRunnerFixture,
  runMiroirTestInMemory,
  runMiroirTests,
  runMiroirTestSuite,
} from "../../src";
import type {
  MiroirTestForFunctionCall,
  MiroirTestForQuery,
  MiroirTestForRunner,
  MiroirTestDefinition,
  MiroirTestSuite,
  MiroirTestForTransformer,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

function mockTracker() {
  return {
    getCurrentTestAssertionPath: () => [{ test: "t" }, { testAssertion: "t" }],
    setTestAssertionResult: vi.fn(),
  };
}

describe("Miroir transformer leaf helpers", () => {
  it("uses miroirTestLabel for assertion naming on pilot leaf", () => {
    const suite = (miroirTest_pilot_transformer_plus as MiroirTestDefinition)
      .definition as MiroirTestSuite;
    const leaf = suite.miroirTests[0] as MiroirTestForTransformer;
    expect(miroirTransformerAssertionName(leaf)).toBe(
      "returns the original schema if no ifThenElseMMLS tag is present",
    );
    expect(effectiveMiroirTransformerSkip(leaf).miroirTestLabel).toBe(leaf.miroirTestLabel);
  });

  it("merges skip flags from leaf and parent", () => {
    const leaf: MiroirTestForTransformer = {
      miroirTestType: "transformerTest",
      miroirTestLabel: "x",
      skip: true,
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
    const result = effectiveMiroirTransformerSkip(leaf, false);
    expect(result.skip).toBe(true);
  });
});

describe("miroir leaf zod schemas", () => {
  it("miroirTestForFunctionCall validates a minimal functionCallTest leaf", () => {
    const parsed = miroirTestForFunctionCall.parse({
      miroirTestType: "functionCallTest",
      miroirTestLabel: "converts string type",
      functionRef: {
        module: "miroir-core/1_core/jzod/JzodToJsonSchema",
        export: "jzodToJsonSchema",
      },
      arguments: [{ type: "string" }],
      expectedValue: { type: "string" },
    });
    expect(parsed.miroirTestLabel).toBe("converts string type");
  });

  it("miroirTestForQuery validates a minimal queryTest leaf", () => {
    const parsed = miroirTestForQuery.parse({
      miroirTestType: "queryTest",
      miroirTestLabel: "error on non-existing Entity: EntityNotFound",
      fixtureRef: "libraryDomainState",
      query: {
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        application: "5af03c98-fe5e-490b-b08f-e1230971c57f",
        extractors: {},
      },
      assertions: [
        {
          label: "test1",
          expectedValue: { queryFailure: "ReferenceNotFound" },
        },
      ],
    });
    expect(parsed.fixtureRef).toBe("libraryDomainState");
  });
});

describe("runMiroirTestInMemory — functionCallTest", () => {
  it("resolveFunctionCallTarget rejects non-whitelisted module/export", () => {
    expect(() =>
      resolveFunctionCallTarget({ module: "evil/module", export: "hack" }),
    ).toThrow(/not whitelisted/);
    expect(() =>
      resolveFunctionCallTarget({
        module: "miroir-core/1_core/mustache",
        export: "unknownExport",
      }),
    ).toThrow(/not whitelisted/);
  });

  it("whitelist includes mustache and jzodToJsonSchema exports", () => {
    const refs = listWhitelistedFunctionRefs();
    expect(refs).toContainEqual({
      module: "miroir-core/1_core/mustache",
      export: "extractDoubleBracePatterns",
    });
    expect(refs).toContainEqual({
      module: "miroir-core/1_core/jzod/JzodToJsonSchema",
      export: "jzodToJsonSchema",
    });
  });

  it("executes mustache happy path", async () => {
    const tracker = mockTracker();
    const leaf: MiroirTestForFunctionCall = {
      miroirTestType: "functionCallTest",
      miroirTestLabel: "should extract patterns with double braces",
      functionRef: {
        module: "miroir-core/1_core/mustache",
        export: "extractDoubleBracePatterns",
      },
      arguments: ["Hello {{ name }}!"],
      expectedValue: [{ content: "name", start: 6, end: 15 }],
    };
    await runMiroirTestInMemory(
      vitest,
      ["mustache"],
      undefined,
      leaf,
      defaultMetaModelEnvironment,
      tracker as any,
      undefined,
      false,
      runMiroirTests,
      { executionMode: "unit" },
      [{ test: "t" }, { testAssertion: "t" }],
    );
    expect(tracker.setTestAssertionResult).toHaveBeenCalledWith(
      [{ test: "t" }, { testAssertion: "t" }],
      expect.objectContaining({ assertionResult: "ok" }),
    );
  });

  it("executes expectedError path", async () => {
    const tracker = mockTracker();
    const leaf: MiroirTestForFunctionCall = {
      miroirTestType: "functionCallTest",
      miroirTestLabel: "should throw an error for empty patterns",
      functionRef: {
        module: "miroir-core/1_core/mustache",
        export: "extractDoubleBracePatterns",
      },
      arguments: ["Hello {{  }}!"],
      expectedError: "Empty pattern found",
    };
    await runMiroirTestInMemory(
      vitest,
      ["mustache"],
      undefined,
      leaf,
      defaultMetaModelEnvironment,
      tracker as any,
      undefined,
      false,
      runMiroirTests,
      { executionMode: "unit" },
      [{ test: "t" }, { testAssertion: "t" }],
    );
    expect(tracker.setTestAssertionResult).toHaveBeenCalledWith(
      [{ test: "t" }, { testAssertion: "t" }],
      expect.objectContaining({ assertionResult: "ok" }),
    );
  });

  it("executes expectedAction2ErrorType path", async () => {
    const tracker = mockTracker();
    const leaf: MiroirTestForFunctionCall = {
      miroirTestType: "functionCallTest",
      miroirTestLabel: "returns Action2Error when both parentUuid sources are absent",
      functionRef: {
        module: "miroir-core/1_core/EntityPrimaryKey",
        export: "resolveInstanceParentUuid",
      },
      arguments: [
        { uuid: "00000000-0000-0000-0000-000000000004" },
        { __miroirJsonUndefined: true },
      ],
      expectedAction2ErrorType: "FailedToResolveParentUuid",
    };
    await runMiroirTestInMemory(
      vitest,
      ["EntityPrimaryKey"],
      undefined,
      leaf,
      defaultMetaModelEnvironment,
      tracker as any,
      undefined,
      false,
      runMiroirTests,
      { executionMode: "unit" },
      [{ test: "t" }, { testAssertion: "t" }],
    );
    expect(tracker.setTestAssertionResult).toHaveBeenCalledWith(
      [{ test: "t" }, { testAssertion: "t" }],
      expect.objectContaining({ assertionResult: "ok" }),
    );
  });

  it("rejects integration mode for functionCallTest leaves", async () => {
    const leaf: MiroirTestForFunctionCall = {
      miroirTestType: "functionCallTest",
      miroirTestLabel: "x",
      functionRef: {
        module: "miroir-core/1_core/mustache",
        export: "extractDoubleBracePatterns",
      },
      arguments: ["{{ x }}"],
      expectedValue: [],
    };
    await expect(
      runMiroirTestInMemory(
        vitest,
        ["mustache"],
        undefined,
        leaf,
        defaultMetaModelEnvironment,
        mockTracker() as any,
        undefined,
        false,
        runMiroirTests,
        { executionMode: "integration", integrationStore: {} },
      ),
    ).rejects.toThrow(/functionCallTest leaves cannot run in integration mode/);
  });
});

describe("runMiroirTestInMemory — queryTest", () => {
  it("resolveQueryRunnerFixture loads libraryDomainState", () => {
    const refs = listQueryRunnerFixtureRefs();
    expect(refs).toContain("libraryDomainState");
    const fixture = resolveQueryRunnerFixture("libraryDomainState");
    expect(fixture.domainState).toBeDefined();
    expect(fixture.deploymentEntityState).toBeDefined();
  });

  it("executes first queries_library scenario", async () => {
    const tracker = mockTracker();
    const leaf = (
      (miroirTest_queries_library as MiroirTestDefinition).definition as MiroirTestSuite
    ).miroirTests[0] as MiroirTestForQuery;
    await runMiroirTestInMemory(
      vitest,
      ["queries"],
      undefined,
      leaf,
      defaultMetaModelEnvironment,
      tracker as any,
      undefined,
      false,
      runMiroirTests,
      { executionMode: "unit" },
      [{ test: "t" }, { testAssertion: "t" }],
    );
    expect(tracker.setTestAssertionResult).toHaveBeenCalledWith(
      [{ test: "t" }, { testAssertion: "t" }],
      expect.objectContaining({ assertionResult: "ok" }),
    );
  });

  it("rejects integration mode for queryTest leaves", async () => {
    const leaf = (
      (miroirTest_queries_library as MiroirTestDefinition).definition as MiroirTestSuite
    ).miroirTests[0] as MiroirTestForQuery;
    await expect(
      runMiroirTestInMemory(
        vitest,
        ["queries"],
        undefined,
        leaf,
        defaultMetaModelEnvironment,
        mockTracker() as any,
        undefined,
        false,
        runMiroirTests,
        { executionMode: "integration", integrationStore: {} },
      ),
    ).rejects.toThrow(/queryTest leaves cannot run in integration mode/);
  });
});

describe("runMiroirTestInMemory — runnerTest", () => {
  it("requires executionMode integration", async () => {
    const leaf: MiroirTestForRunner = {
      miroirTestType: "runnerTest",
      miroirTestLabel: "Lend Book Test Composite Action",
      runnerRef: "lendDocument",
      fixtureRef: "libraryLendBookDefaults",
    };
    await expect(
      runMiroirTestInMemory(
        vitest,
        ["runner"],
        undefined,
        leaf,
        defaultMetaModelEnvironment,
        mockTracker() as any,
        undefined,
        false,
        runMiroirTests,
        { executionMode: "unit" },
        [{ test: "t" }, { testAssertion: "t" }],
      ),
    ).rejects.toThrow(/runnerTest leaves require executionMode integration/);
  });
});

describe("runMiroirTestInMemory — transformerTest", () => {
  it("executes pilot resolveConditionalSchema build test", async () => {
    const tracker = mockTracker();
    const leaf = (
      (miroirTest_pilot_transformer_plus as MiroirTestDefinition).definition as MiroirTestSuite
    ).miroirTests[0] as MiroirTestForTransformer;
    await runMiroirTestInMemory(
      vitest,
      ["pilot"],
      undefined,
      leaf,
      defaultMetaModelEnvironment,
      tracker as any,
      undefined,
      false,
      runMiroirTests,
      { executionMode: "unit" },
      [{ test: "t" }, { testAssertion: "t" }],
    );
    expect(tracker.setTestAssertionResult).toHaveBeenCalledWith(
      [{ test: "t" }, { testAssertion: "t" }],
      expect.objectContaining({ assertionResult: "ok" }),
    );
  });

  it("requires integrationStore when executionMode is integration", async () => {
    const leaf = (
      (miroirTest_pilot_transformer_plus as MiroirTestDefinition).definition as MiroirTestSuite
    ).miroirTests[0] as MiroirTestForTransformer;
    await expect(
      runMiroirTestInMemory(
        vitest,
        ["pilot"],
        undefined,
        leaf,
        defaultMetaModelEnvironment,
        mockTracker() as any,
        undefined,
        false,
        runMiroirTests,
        { executionMode: "integration" },
      ),
    ).rejects.toThrow(/integrationStore is required/);
  });
});

describe("runMiroirTestSuite", () => {
  it("requires vitest.expect before registering suite tests", async () => {
    const emptySuite: MiroirTestSuite = {
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: "schema_pilot_empty",
      miroirTests: [],
    };
    const vitestWithoutExpect = {
      test: vitest.test,
      describe: vitest.describe,
    } as typeof vitest;
    await expect(
      runMiroirTestSuite(
        vitestWithoutExpect,
        ["empty"],
        emptySuite,
        undefined,
        defaultMetaModelEnvironment,
        mockTracker() as any,
        undefined,
        false,
        runMiroirTests,
        { executionMode: "unit" },
      ),
    ).rejects.toThrow(/without vitest\.expect/);
  });

  it("exposes tracking wrappers on runMiroirTests", () => {
    expect(runMiroirTests._runMiroirTestSuite).toBe(runMiroirTestSuite);
    expect(runMiroirTests._runMiroirTest).toBe(runMiroirTestInMemory);
    expect(typeof runMiroirTests._runMiroirTestSuiteWithTracking).toBe("function");
    expect(typeof runMiroirTests._runMiroirTestWithTracking).toBe("function");
  });
});
