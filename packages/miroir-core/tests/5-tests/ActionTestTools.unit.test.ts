import { describe, expect, it, vi } from "vitest";
import * as vitest from "vitest";

import type { MiroirTestForAction } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
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
          deploymentUuid: canonicalDeploymentUuid,
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

  it("remaps hardcoded Library uuids before handleTestCompositeAction for ephemeral runTarget", async () => {
    const ephemeralApp = "11111111-1111-4111-8111-111111111111";
    const ephemeralDep = "22222222-2222-4222-8222-222222222222";
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
        runnerRegistry: {},
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
});
