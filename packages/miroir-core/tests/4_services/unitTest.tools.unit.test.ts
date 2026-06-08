import { describe, expect, it, vi } from "vitest";
import * as vitest from "vitest";

import {
  asTransformerTestFromUnitTest,
  defaultMetaModelEnvironment,
  entityDefinitionTransformerTest,
  entityDefinitionUnitTest,
  functionCallTestJzodSchema,
  getInnermostTypeCheckError,
  jzodTypeCheck,
  listQueryRunnerFixtureRefs,
  listWhitelistedFunctionRefs,
  queryRunnerTestJzodSchema,
  resolveFunctionCallTarget,
  resolveQueryRunnerFixture,
  runFunctionCallTestInMemory,
  runQueryRunnerTestInMemory,
  unitTestSuiteToTransformerTestSuite,
} from "../../src";
import {
  unitTest_pilot_transformer_plus,
  unitTest_suite_jzodToJsonSchema,
  unitTest_suite_mustache,
  unitTest_suite_queries_library,
} from "miroir-test-app_deployment-miroir";
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

describe("functionCallTest (Phase 2)", () => {
  it("functionCallTestJzodSchema validates a minimal functionCallTest", () => {
    const parsed = functionCallTestJzodSchema.parse({
      unitTestType: "functionCallTest",
      unitTestLabel: "converts string type",
      functionRef: {
        module: "miroir-core/1_core/jzod/JzodToJsonSchema",
        export: "jzodToJsonSchema",
      },
      arguments: [{ type: "string" }],
      expectedValue: { type: "string" },
    });
    expect(parsed.unitTestLabel).toBe("converts string type");
  });

  it("validates mustache, jzodToJsonSchema, and queries_library suites via jzodTypeCheck", () => {
    for (const instance of [
      unitTest_suite_mustache,
      unitTest_suite_jzodToJsonSchema,
      unitTest_suite_queries_library,
    ]) {
      const result = jzodTypeCheck(
        unitTestJzodSchema,
        instance,
        [],
        [],
        defaultMetaModelEnvironment,
        {},
      );
      if (result.status === "error") {
        console.error(getInnermostTypeCheckError(result));
      }
      expect(result.status).toBe("ok");
    }
  });

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

  it("runFunctionCallTestInMemory executes mustache happy path", async () => {
    const tracker = {
      getCurrentTestAssertionPath: () => [{ test: "t" }, { testAssertion: "t" }],
      setTestAssertionResult: vi.fn(),
    };
    await runFunctionCallTestInMemory(
      vitest,
      ["mustache"],
      undefined,
      {
        unitTestType: "functionCallTest",
        unitTestLabel: "should extract patterns with double braces",
        functionRef: {
          module: "miroir-core/1_core/mustache",
          export: "extractDoubleBracePatterns",
        },
        arguments: ["Hello {{ name }}!"],
        expectedValue: [{ content: "name", start: 6, end: 15 }],
      },
      tracker as any,
      [{ test: "t" }, { testAssertion: "t" }],
    );
    expect(tracker.setTestAssertionResult).toHaveBeenCalledWith(
      [{ test: "t" }, { testAssertion: "t" }],
      expect.objectContaining({ assertionResult: "ok" }),
    );
  });

  it("runFunctionCallTestInMemory executes expectedError path", async () => {
    const tracker = {
      getCurrentTestAssertionPath: () => [{ test: "t" }, { testAssertion: "t" }],
      setTestAssertionResult: vi.fn(),
    };
    await runFunctionCallTestInMemory(
      vitest,
      ["mustache"],
      undefined,
      {
        unitTestType: "functionCallTest",
        unitTestLabel: "should throw an error for empty patterns",
        functionRef: {
          module: "miroir-core/1_core/mustache",
          export: "extractDoubleBracePatterns",
        },
        arguments: ["Hello {{  }}!"],
        expectedError: "Empty pattern found",
      },
      tracker as any,
      [{ test: "t" }, { testAssertion: "t" }],
    );
    expect(tracker.setTestAssertionResult).toHaveBeenCalledWith(
      [{ test: "t" }, { testAssertion: "t" }],
      expect.objectContaining({ assertionResult: "ok" }),
    );
  });
});

describe("queryRunnerTest (Phase 4)", () => {
  it("queryRunnerTestJzodSchema validates a minimal queryRunnerTest", () => {
    const parsed = queryRunnerTestJzodSchema.parse({
      unitTestType: "queryRunnerTest",
      unitTestLabel: "error on non-existing Entity: EntityNotFound",
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

  it("resolveQueryRunnerFixture loads libraryDomainState", () => {
    const refs = listQueryRunnerFixtureRefs();
    expect(refs).toContain("libraryDomainState");
    const fixture = resolveQueryRunnerFixture("libraryDomainState");
    expect(fixture.domainState).toBeDefined();
    expect(fixture.deploymentEntityState).toBeDefined();
  });

  it("runQueryRunnerTestInMemory executes first queries_library scenario", async () => {
    const suite = unitTest_suite_queries_library.definition as UnitTestSuite;
    const leaf = suite.unitTests[0] as import("../../src").QueryRunnerTest;
    const tracker = {
      getCurrentTestAssertionPath: () => [{ test: "t" }, { testAssertion: "t" }],
      setTestAssertionResult: vi.fn(),
    };
    await runQueryRunnerTestInMemory(
      vitest,
      ["queries"],
      undefined,
      leaf,
      tracker as any,
      [{ test: "t" }, { testAssertion: "t" }],
    );
    expect(tracker.setTestAssertionResult).toHaveBeenCalledWith(
      [{ test: "t" }, { testAssertion: "t" }],
      expect.objectContaining({ assertionResult: "ok" }),
    );
  });
});
