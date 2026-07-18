import { describe, expect, it } from "vitest";

import { miroirTest_runner_library } from "miroir-test-app_deployment-library";
import { miroirTest_miroirCoreTransformers } from "miroir-test-app_deployment-miroir";

import type {
  MiroirTestDefinition,
  MiroirTestForTransformer,
  MiroirTestSuite,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  classifyMiroirTestSuiteExecutionCapabilities,
  inferIntegrationSessionKind,
  transformerTestLeafRequiresIntegration,
  walkMiroirTestLeaves,
} from "../../src/5_tests/inferIntegrationSessionKind";

function runnerLibrarySuite(): MiroirTestSuite {
  return (miroirTest_runner_library as MiroirTestDefinition).definition as MiroirTestSuite;
}

function miroirCoreTransformersSuite(): MiroirTestSuite {
  return (miroirTest_miroirCoreTransformers as MiroirTestDefinition).definition as MiroirTestSuite;
}

describe("walkMiroirTestLeaves (B0)", () => {
  it("collects nested leaves depth-first", () => {
    const suite: MiroirTestSuite = {
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: "nested",
      miroirTests: [
        {
          miroirTestType: "miroirTestSuite",
          miroirTestLabel: "inner",
          miroirTests: [
            {
              miroirTestType: "transformerTest",
              miroirTestLabel: "leaf-a",
              transformerName: "t",
              transformer: { transformerType: "identity" } as MiroirTestForTransformer["transformer"],
              unitTestExpectedValue: 1,
            },
          ],
        },
        {
          miroirTestType: "runnerTest",
          miroirTestLabel: "leaf-b",
          runnerRef: "r",
          initialModel: {},
        } as MiroirTestSuite["miroirTests"][number],
      ],
    };

    expect(walkMiroirTestLeaves(suite).map((leaf) => leaf.miroirTestLabel)).toEqual([
      "leaf-a",
      "leaf-b",
    ]);
  });
});

describe("transformerTestLeafRequiresIntegration (B0)", () => {
  it("is true when integrationTestExpectedValue is set", () => {
    const leaf: MiroirTestForTransformer = {
      miroirTestType: "transformerTest",
      miroirTestLabel: "integ leaf",
      transformerName: "t",
      transformer: { transformerType: "identity" } as MiroirTestForTransformer["transformer"],
      integrationTestExpectedValue: { ok: true },
    };

    expect(transformerTestLeafRequiresIntegration(leaf)).toBe(true);
  });

  it("is false for unit-only transformer leaves", () => {
    const leaf: MiroirTestForTransformer = {
      miroirTestType: "transformerTest",
      miroirTestLabel: "unit leaf",
      transformerName: "t",
      transformer: { transformerType: "identity" } as MiroirTestForTransformer["transformer"],
      unitTestExpectedValue: 42,
    };

    expect(transformerTestLeafRequiresIntegration(leaf)).toBe(false);
  });
});

describe("inferIntegrationSessionKind (B0)", () => {
  it("returns runner for runner_library suite", () => {
    expect(inferIntegrationSessionKind(runnerLibrarySuite())).toBe("runner");
  });

  it("returns transformer for miroirCoreTransformers suite", () => {
    expect(inferIntegrationSessionKind(miroirCoreTransformersSuite())).toBe("transformer");
  });

  it("returns undefined for unit-only transformer suites", () => {
    const suite: MiroirTestSuite = {
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: "mustache-like",
      miroirTests: [
        {
          miroirTestType: "transformerTest",
          miroirTestLabel: "unit only",
          transformerName: "t",
          transformer: { transformerType: "identity" } as MiroirTestForTransformer["transformer"],
          unitTestExpectedValue: 1,
        },
      ],
    };

    expect(inferIntegrationSessionKind(suite)).toBeUndefined();
  });

  it("prefers runner when suite mixes runnerTest and transformer integ leaves", () => {
    const suite: MiroirTestSuite = {
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: "mixed kinds",
      miroirTests: [
        {
          miroirTestType: "transformerTest",
          miroirTestLabel: "integ transformer",
          transformerName: "t",
          transformer: { transformerType: "identity" } as MiroirTestForTransformer["transformer"],
          integrationTestExpectedValue: {},
        },
        {
          miroirTestType: "runnerTest",
          miroirTestLabel: "runner leaf",
          runnerRef: "r",
          initialModel: {},
        } as MiroirTestSuite["miroirTests"][number],
      ],
    };

    expect(inferIntegrationSessionKind(suite)).toBe("runner");
  });

  it("returns runner for actionTest-only suites (1.3-a)", () => {
    const suite: MiroirTestSuite = {
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: "domainController.data.crud",
      miroirTests: [
        {
          miroirTestType: "actionTest",
          miroirTestLabel: "Refresh all Instances",
        },
      ],
    };

    expect(inferIntegrationSessionKind(suite)).toBe("runner");
  });
});

describe("classifyMiroirTestSuiteExecutionCapabilities (B0)", () => {
  it("marks runner_library as integration-only", () => {
    const caps = classifyMiroirTestSuiteExecutionCapabilities(runnerLibrarySuite());

    expect(caps).toEqual({
      hasUnitLeaves: false,
      hasIntegrationLeaves: true,
      integrationSessionKind: "runner",
      uiExecutionMode: "integration",
    });
  });

  it("marks miroirCoreTransformers as mixed (unit + integration transformer leaves)", () => {
    const caps = classifyMiroirTestSuiteExecutionCapabilities(miroirCoreTransformersSuite());

    expect(caps.integrationSessionKind).toBe("transformer");
    expect(caps.uiExecutionMode).toBe("mixed");
    expect(caps.hasIntegrationLeaves).toBe(true);
    expect(caps.hasUnitLeaves).toBe(true);
  });

  it("marks unit-only suites", () => {
    const suite: MiroirTestSuite = {
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: "unit suite",
      miroirTests: [
        {
          miroirTestType: "queryTest",
          miroirTestLabel: "q",
          fixtureRef: "f",
          queryRef: "q",
        } as MiroirTestSuite["miroirTests"][number],
      ],
    };

    expect(classifyMiroirTestSuiteExecutionCapabilities(suite)).toMatchObject({
      hasUnitLeaves: true,
      hasIntegrationLeaves: false,
      integrationSessionKind: undefined,
      uiExecutionMode: "unit",
    });
  });

  it("marks mixed unit + integration suites", () => {
    const suite: MiroirTestSuite = {
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: "mixed",
      miroirTests: [
        {
          miroirTestType: "transformerTest",
          miroirTestLabel: "unit",
          transformerName: "t",
          transformer: { transformerType: "identity" } as MiroirTestForTransformer["transformer"],
          unitTestExpectedValue: 1,
        },
        {
          miroirTestType: "transformerTest",
          miroirTestLabel: "integ",
          transformerName: "t2",
          transformer: { transformerType: "identity" } as MiroirTestForTransformer["transformer"],
          integrationTestExpectedValue: {},
        },
      ],
    };

    expect(classifyMiroirTestSuiteExecutionCapabilities(suite)).toEqual({
      hasUnitLeaves: true,
      hasIntegrationLeaves: true,
      integrationSessionKind: "transformer",
      uiExecutionMode: "mixed",
    });
  });

  it("marks actionTest suites as integration-only with runner session kind", () => {
    const suite: MiroirTestSuite = {
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: "action suite",
      miroirTests: [
        {
          miroirTestType: "actionTest",
          miroirTestLabel: "Add Book instance",
        },
      ],
    };

    expect(classifyMiroirTestSuiteExecutionCapabilities(suite)).toEqual({
      hasUnitLeaves: false,
      hasIntegrationLeaves: true,
      integrationSessionKind: "runner",
      uiExecutionMode: "integration",
    });
  });
});
