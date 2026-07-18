import { describe, expect, it, vi } from "vitest";

import type { TestCompositeActionParams } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { miroirTestForActionDraft } from "../../src/0_interfaces/5-tests/miroirTestActionTypes";
import { runCompositeActionTestParams } from "../../src/5_tests/CompositeActionTestTools";

const applicationUuid = "5af03c98-fe5e-490b-b08f-e1230971c57f";

function mockDomainController(handleSuiteResult: unknown = { status: "ok" }) {
  return {
    currentModelEnvironment: vi.fn(() => ({ model: "env" })),
    handleTestCompositeActionSuite: vi.fn(async () => handleSuiteResult),
    handleTestCompositeAction: vi.fn(async () => ({ status: "ok" })),
    handleTestCompositeActionTemplateSuite: vi.fn(async () => ({ status: "ok" })),
  };
}

function mockTracker() {
  return {
    trackTestSuite: vi.fn(async (_name: string, _path: string, _parent: undefined, fn: () => Promise<unknown>) =>
      fn(),
    ),
    trackTest: vi.fn(async (_name: string, _parent: unknown, fn: () => Promise<unknown>) => fn()),
    getCurrentActivityId: vi.fn(() => "activity-1"),
  };
}

describe("miroirTestForActionDraft (Phase 0 schema)", () => {
  it("accepts a minimal actionTest leaf", () => {
    const parsed = miroirTestForActionDraft.parse({
      miroirTestType: "actionTest",
      miroirTestLabel: "Refresh all Instances",
    });
    expect(parsed.miroirTestLabel).toBe("Refresh all Instances");
  });

  it("rejects a leaf missing miroirTestLabel", () => {
    expect(() =>
      miroirTestForActionDraft.parse({
        miroirTestType: "actionTest",
      }),
    ).toThrow();
  });
});

describe("runCompositeActionTestParams", () => {
  it("runs testCompositeActionSuite via handleTestCompositeActionSuite with merged params", async () => {
    const domainController = mockDomainController({ status: "ok", payload: { n: 1 } });
    const tracker = mockTracker();
    const testAction: TestCompositeActionParams = {
      testActionType: "testCompositeActionSuite",
      testActionLabel: "Data.CRUD",
      application: applicationUuid,
      testCompositeAction: {
        testType: "testCompositeActionSuite",
        testLabel: "Data.CRUD",
        testCompositeActions: {},
      },
    };

    const result = await runCompositeActionTestParams(
      domainController as any,
      testAction,
      { [applicationUuid]: "dep-1" } as any,
      tracker as any,
      { fromCaller: true },
    );

    expect(result).toEqual({ status: "ok", payload: { n: 1 } });
    expect(domainController.handleTestCompositeActionSuite).toHaveBeenCalledWith(
      applicationUuid,
      testAction.testCompositeAction,
      { [applicationUuid]: "dep-1" },
      { model: "env" },
      { fromCaller: true },
    );
    expect(tracker.trackTestSuite).toHaveBeenCalledWith(
      "Data.CRUD",
      "Data.CRUD",
      undefined,
      expect.any(Function),
    );
  });

  it("merges testParams for testBuildPlusRuntimeCompositeActionSuite", async () => {
    const domainController = mockDomainController({ status: "ok" });
    const tracker = mockTracker();
    const testAction: TestCompositeActionParams = {
      testActionType: "testBuildPlusRuntimeCompositeActionSuite",
      testActionLabel: "Lend Book",
      application: applicationUuid,
      testParams: { book1Uuid: "b1" },
      testCompositeAction: {
        testType: "testBuildPlusRuntimeCompositeActionSuite",
        testLabel: "Lend Book",
        testCompositeActions: {},
      },
    };

    await runCompositeActionTestParams(
      domainController as any,
      testAction,
      {} as any,
      tracker as any,
      { fromCaller: true },
    );

    expect(domainController.handleTestCompositeActionSuite).toHaveBeenCalledWith(
      applicationUuid,
      testAction.testCompositeAction,
      {},
      { model: "env" },
      { fromCaller: true, book1Uuid: "b1" },
    );
  });
});
