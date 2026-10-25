import { describe, expect, it, vi } from "vitest";
import * as vitest from "vitest";

import type {
  MiroirTestForAction,
  TestAssertionResult,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LIBRARY_TMP } from "../../src/0_interfaces/1_core/LIBRARY_TMP";
import {
  remapActionTestLeafForRunTarget,
  resolveActionTestLeaf,
  runMiroirActionTest,
} from "../../src/5_tests/ActionTestTools";
import type { MiroirTestExecutionEnvironment } from "../../src/5_tests/MiroirTestTools";

const applicationUuid = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const canonicalDeploymentUuid = LIBRARY_TMP.deployment_Library_DO_NO_USE.uuid;

const minimalLeaf: MiroirTestForAction = {
  miroirTestType: "actionTest",
  miroirTestLabel: "Refresh all Instances",
  compositeActionSequence: {
    actionType: "compositeActionSequence",
    actionLabel: "testLibraryBooks",
    endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
    payload: {
      actionSequence: [
        {
          actionType: "rollback",
          actionLabel: "refreshLibraryLocalCache",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: applicationUuid,
          },
        },
        {
          actionType: "compositeRunBoxedQueryAction",
          endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
          actionLabel: "query",
          nameGivenToResult: "entityBookList",
          payload: {
            actionType: "runBoxedQueryAction",
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            payload: {
              application: applicationUuid,
              applicationSection: "data",
              query: {
                queryType: "boxedQueryWithExtractorCombinerTransformer",
                application: applicationUuid,
                pageParams: {
                  currentDeploymentUuid: canonicalDeploymentUuid,
                },
                extractors: {},
              },
            },
          },
        },
      ],
    },
  },
  testCompositeActionAssertions: [
    {
      actionType: "compositeRunTestAssertion",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      actionLabel: "checkNumberOfBooks",
      nameGivenToResult: "checkNumberOfBooks",
      payload: {
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

describe("remapActionTestLeafForRunTarget", () => {
  it("no-ops when runTarget already uses canonical Library application uuid", () => {
    const remapped = remapActionTestLeafForRunTarget(minimalLeaf, {
      applicationUuid,
      applicationName: "Library",
      deploymentUuid: canonicalDeploymentUuid,
    });
    expect(remapped).toBe(minimalLeaf);
  });

  it("rewrites canonical Library application and deployment uuids for ephemeral runTarget", () => {
    const ephemeralApp = "11111111-1111-4111-8111-111111111111";
    const ephemeralDep = "22222222-2222-4222-8222-222222222222";
    const remapped = remapActionTestLeafForRunTarget(minimalLeaf, {
      applicationUuid: ephemeralApp,
      applicationName: "Library",
      deploymentUuid: ephemeralDep,
    });

    const sequence = remapped.compositeActionSequence?.payload?.actionSequence as any[];
    expect(sequence[0].payload.application).toBe(ephemeralApp);
    expect(sequence[1].payload.payload.application).toBe(ephemeralApp);
    expect(sequence[1].payload.payload.query.application).toBe(ephemeralApp);
    expect(sequence[1].payload.payload.query.pageParams.currentDeploymentUuid).toBe(
      ephemeralDep,
    );
    // Miroir / other uuids must stay untouched
    expect(sequence[0].endpoint).toBe("7947ae40-eb34-4149-887b-15a9021e714e");
  });
});

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
  /** A tracker whose test "Refresh all Instances" recorded `assertions`, as handleTestCompositeActionAssertion does. */
  function trackerWithAssertions(assertions: Record<string, TestAssertionResult>) {
    return {
      getCurrentActivityId: vi.fn(() => "activity-1"),
      trackTest: vi.fn(async (_n: string, _p: unknown, fn: () => Promise<unknown>) => fn()),
      setTestAssertionResult: vi.fn(),
      getTestAssertionsResults: vi.fn(() => ({
        testsSuiteResults: {
          action: {
            testsResults: {
              "Refresh all Instances": {
                testLabel: "Refresh all Instances",
                testResult: "ok",
                testAssertionsResults: assertions,
              },
            },
          },
        },
      })),
    };
  }

  it("runs resolved leaf via handleTestCompositeAction and records ok", async () => {
    const handleTestCompositeAction = vi.fn(async () => ({ status: "ok" }));
    const tracker = trackerWithAssertions({ checkNumberOfBooks: { assertionName: "checkNumberOfBooks", assertionResult: "ok" } });
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
          deploymentUuid: canonicalDeploymentUuid,
        },
        resolvedRunner: {} as any,
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

  it("remaps hardcoded Library uuids before handleTestCompositeAction for ephemeral runTarget", async () => {
    const ephemeralApp = "11111111-1111-4111-8111-111111111111";
    const ephemeralDep = "22222222-2222-4222-8222-222222222222";
    const handleTestCompositeAction = vi.fn(async () => ({ status: "ok" }));
    const tracker = trackerWithAssertions({ checkNumberOfBooks: { assertionName: "checkNumberOfBooks", assertionResult: "ok" } });
    const domainController = {
      currentModelEnvironment: vi.fn(() => ({ model: "env" })),
      handleTestCompositeAction,
      handleTestCompositeActionSuite: vi.fn(),
    };
    const executionEnvironment = {
      domainController,
      applicationDeploymentMap: { [ephemeralApp]: ephemeralDep },
      testApplicationUuid: ephemeralApp,
      persistenceStoreControllerManager: {} as any,
      runnerTestContext: {
        domainController,
        applicationDeploymentMap: { [ephemeralApp]: ephemeralDep },
        internalMiroirConfig: {} as any,
        pageLabel: "p",
        adminDeployment: {} as any,
        testDeploymentStorageConfiguration: {} as any,
        runTarget: {
          applicationUuid: ephemeralApp,
          applicationName: "Library",
          deploymentUuid: ephemeralDep,
        },
        resolvedRunner: {} as any,
        testParams: {
          testApplicationUuid: ephemeralApp,
          testApplicationDeploymentUuid: ephemeralDep,
        },
        runtimeContext: {},
      },
    } as unknown as MiroirTestExecutionEnvironment;

    await runMiroirActionTest(
      vitest,
      ["action"],
      undefined,
      minimalLeaf,
      tracker as any,
      [{ test: "t" }, { testAssertion: "t" }],
      false,
      executionEnvironment,
    );

    const compositeAction = handleTestCompositeAction.mock.calls[0][0];
    const sequence = compositeAction.compositeActionSequence.payload.actionSequence;
    expect(sequence[0].payload.application).toBe(ephemeralApp);
    expect(sequence[1].payload.payload.query.pageParams.currentDeploymentUuid).toBe(
      ephemeralDep,
    );
    expect(handleTestCompositeAction.mock.calls[0][3]).toEqual(
      expect.objectContaining({
        testApplicationUuid: ephemeralApp,
        testApplicationDeploymentUuid: ephemeralDep,
      }),
    );
  });

  // #554: a composite action records a failed assertion in the tracker and still returns ok
  function libraryExecutionEnvironment(handleTestCompositeAction: (...args: any[]) => Promise<unknown>) {
    const domainController = {
      currentModelEnvironment: vi.fn(() => ({ model: "env" })),
      handleTestCompositeAction,
      handleTestCompositeActionSuite: vi.fn(),
    };
    return {
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
        runTarget: { applicationUuid, applicationName: "Library", deploymentUuid: canonicalDeploymentUuid },
        resolvedRunner: {} as any,
        testParams: {},
        runtimeContext: {},
      },
    } as unknown as MiroirTestExecutionEnvironment;
  }

  it("fails the leaf and records error when an assertion failed, though the composite action returned ok (#554)", async () => {
    const tracker = trackerWithAssertions({
      checkNumberOfBooks: {
        assertionName: "checkNumberOfBooks",
        assertionResult: "error",
        assertionExpectedValue: { aggregate: 999 },
        assertionActualValue: { aggregate: 5 },
      },
    });
    const path = [{ test: "t" }, { testAssertion: "t" }];

    await expect(
      runMiroirActionTest(
        vitest,
        ["action"],
        undefined,
        minimalLeaf,
        tracker as any,
        path,
        false,
        libraryExecutionEnvironment(vi.fn(async () => ({ status: "ok" }))),
      ),
    ).rejects.toThrow(
      'actionTest "Refresh all Instances" assertion failed: checkNumberOfBooks expected {"aggregate":999} actual {"aggregate":5}',
    );
    expect(tracker.setTestAssertionResult).toHaveBeenCalledWith(path, {
      assertionName: "Refresh all Instances",
      assertionResult: "error",
      assertionExpectedValue: { aggregate: 999 },
      assertionActualValue: { aggregate: 5 },
    });
  });

  it("fails the leaf when an assertion did not run (#554)", async () => {
    const tracker = trackerWithAssertions({});

    await expect(
      runMiroirActionTest(
        vitest,
        ["action"],
        undefined,
        minimalLeaf,
        tracker as any,
        [{ test: "t" }, { testAssertion: "t" }],
        false,
        libraryExecutionEnvironment(vi.fn(async () => ({ status: "ok" }))),
      ),
    ).rejects.toThrow('actionTest "Refresh all Instances" assertion "checkNumberOfBooks" did not run');
  });

  it("checks only the assertions among the leaf's assertion steps (#554)", async () => {
    const tracker = trackerWithAssertions({
      checkNumberOfBooks: { assertionName: "checkNumberOfBooks", assertionResult: "ok" },
    });
    const leafWithQueryStep: MiroirTestForAction = {
      ...minimalLeaf,
      testCompositeActionAssertions: [
        {
          actionType: "compositeRunBoxedQueryAction",
          endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
          actionLabel: "queryBooks",
          nameGivenToResult: "books",
        } as any,
        ...(minimalLeaf.testCompositeActionAssertions ?? []),
      ],
    };
    const path = [{ test: "t" }, { testAssertion: "t" }];

    await runMiroirActionTest(
      vitest,
      ["action"],
      undefined,
      leafWithQueryStep,
      tracker as any,
      path,
      false,
      libraryExecutionEnvironment(vi.fn(async () => ({ status: "ok" }))),
    );

    expect(tracker.setTestAssertionResult).toHaveBeenCalledWith(
      path,
      expect.objectContaining({ assertionResult: "ok" }),
    );
  });
});
