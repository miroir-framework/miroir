import { describe, expect, it, vi } from "vitest";
import * as vitest from "vitest";

import type { MiroirTestForAction } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  resolveActionTestLeaf,
  runMiroirActionTest,
} from "../../src/5_tests/ActionTestTools";
import type { MiroirTestExecutionEnvironment } from "../../src/5_tests/MiroirTestTools";

const applicationUuid = "5af03c98-fe5e-490b-b08f-e1230971c57f";

const minimalLeaf: MiroirTestForAction = {
  miroirTestType: "actionTest",
  miroirTestLabel: "Refresh all Instances",
  compositeActionSequence: {
    actionType: "compositeActionSequence",
    actionLabel: "testLibraryBooks",
    endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
    payload: { actionSequence: [] },
  },
  testCompositeActionAssertions: [
    {
      actionType: "compositeRunTestAssertion",
      actionLabel: "checkNumberOfBooks",
      nameGivenToResult: "checkNumberOfBooks",
      testAssertion: {
        testType: "testAssertion",
        testLabel: "checkNumberOfBooks",
        definition: {
          resultAccessPath: ["0"],
          expectedValue: { aggregate: 5 },
        },
      },
    },
  ],
};

describe("resolveActionTestLeaf", () => {
  it("builds testCompositeAction params from leaf + applicationUuid", () => {
    const params = resolveActionTestLeaf({
      leaf: minimalLeaf,
      applicationUuid,
    });

    expect(params).toEqual({
      testActionType: "testCompositeAction",
      testActionLabel: "Refresh all Instances",
      application: applicationUuid,
      testCompositeAction: {
        testType: "testCompositeAction",
        testLabel: "Refresh all Instances",
        compositeActionSequence: minimalLeaf.compositeActionSequence,
        testCompositeActionAssertions: minimalLeaf.testCompositeActionAssertions,
      },
    });
  });

  it("requires compositeActionSequence", () => {
    expect(() =>
      resolveActionTestLeaf({
        leaf: {
          miroirTestType: "actionTest",
          miroirTestLabel: "incomplete",
        },
        applicationUuid,
      }),
    ).toThrow(/requires compositeActionSequence/);
  });
});

describe("runMiroirActionTest", () => {
  it("runs resolved leaf via handleTestCompositeAction and records ok", async () => {
    const handleTestCompositeAction = vi.fn(async () => ({ status: "ok" }));
    const tracker = {
      getCurrentActivityId: vi.fn(() => "activity-1"),
      trackTest: vi.fn(async (_n: string, _p: unknown, fn: () => Promise<unknown>) => fn()),
      setTestAssertionResult: vi.fn(),
    };
    const domainController = {
      currentModelEnvironment: vi.fn(() => ({ model: "env" })),
      handleTestCompositeAction,
      handleTestCompositeActionSuite: vi.fn(),
    };
    const executionEnvironment = {
      domainController,
      applicationDeploymentMap: { [applicationUuid]: "dep" },
      testApplicationUuid: applicationUuid,
      persistenceStoreControllerManager: {} as any,
      runnerTestContext: {
        domainController,
        applicationDeploymentMap: { [applicationUuid]: "dep" },
        internalMiroirConfig: {} as any,
        pageLabel: "p",
        adminDeployment: {} as any,
        testDeploymentStorageConfiguration: {} as any,
        runTarget: {
          applicationUuid,
          applicationName: "Library",
          deploymentUuid: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
        },
        runnerRegistry: {},
        testParams: {},
        runtimeContext: {},
      },
    } as unknown as MiroirTestExecutionEnvironment;

    const path = [{ test: "t" }, { testAssertion: "t" }];
    await runMiroirActionTest(
      vitest,
      ["action"],
      undefined,
      minimalLeaf,
      tracker as any,
      path,
      false,
      executionEnvironment,
    );

    expect(handleTestCompositeAction).toHaveBeenCalled();
    expect(tracker.setTestAssertionResult).toHaveBeenCalledWith(
      path,
      expect.objectContaining({ assertionName: "Refresh all Instances", assertionResult: "ok" }),
    );
  });
});
