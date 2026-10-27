import { afterEach, describe, expect, it } from "vitest";

import { Action2Error } from "../../../../src/0_interfaces/2_domain/DomainElement";
import type {
  ActionImplementationContext,
  DomainControllerActionHost,
} from "../../../../src/0_interfaces/3_controllers/DomainControllerActionHost";
import { ACTION_OK } from "../../../../src/1_core/constants";
import { defaultMiroirModelEnvironment } from "../../../../src/1_core/Model";
import { MiroirActivityTracker } from "../../../../src/3_controllers/MiroirActivityTracker";
import { MiroirEventService } from "../../../../src/3_controllers/MiroirEventService";
import { handleAction_runMiroirTestAction } from "../../../../src/5_tests/RunMiroirTestAction";

// #575: runMiroirTestAction runs a MiroirTest's leaves on a throwaway copy of the application.
const APPLICATION = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
const MIROIR_APPLICATION = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const MIROIR_DEPLOYMENT = "10ff36f2-50a3-48d8-b80f-e48e5d13af8e";
const MIROIR_TEST = "6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b";
const RUNNER = "cc853632-f158-43fa-b9ed-437c9c25f539";
const MCP_RUNNER = "1d2e3f40-5a6b-4c7d-8e9f-0a1b2c3d4e5f";
const ENDPOINT_COMPOSITE = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5";
const LENDING_ENDPOINT = "212f2784-5b68-43b2-8ee0-89b1c6fdd0de";

const context: ActionImplementationContext = {
  applicationDeploymentMap: { [APPLICATION]: DEPLOYMENT, [MIROIR_APPLICATION]: MIROIR_DEPLOYMENT },
  modelEnvironment: defaultMiroirModelEnvironment,
};

const runAction = (miroirTest: string, leaves?: string[]) => ({
  actionType: "runMiroirTestAction",
  endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
  payload: { application: APPLICATION, miroirTest, ...(leaves ? { leaves } : {}) },
});

/** An assertion the fake DomainController passes when its expected value is "pass". */
const assertion = (testLabel: string, expectedValue: string) => ({
  actionType: "compositeRunTestAssertion",
  endpoint: ENDPOINT_COMPOSITE,
  actionLabel: testLabel,
  nameGivenToResult: testLabel,
  payload: { testType: "testAssertion", testLabel, definition: { resultAccessPath: ["0"], expectedValue } },
});

const sum = (label: string, expected: number) => ({
  miroirTestType: "transformerTest",
  miroirTestLabel: label,
  transformerName: label,
  transformer: { transformerType: "+", interpolation: "runtime", args: [1, 2] },
  transformerParams: {},
  unitTestExpectedValue: expected,
});

const actionTest = (label: string, expectedValue = "pass") => ({
  miroirTestType: "actionTest",
  miroirTestLabel: label,
  compositeActionSequence: {
    actionType: "compositeActionSequence",
    actionLabel: label,
    endpoint: ENDPOINT_COMPOSITE,
    payload: {
      actionSequence: [
        {
          actionType: "rollback",
          actionLabel: "refresh",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: { application: APPLICATION },
        },
      ],
    },
  },
  testCompositeActionAssertions: [assertion(`${label} check`, expectedValue)],
});

const runnerTest = (label: string, runnerRef = RUNNER) => ({
  miroirTestType: "runnerTest",
  miroirTestLabel: label,
  runnerRef,
  testCompositeActionLabel: label,
  testParams: {
    lendDocument: {
      actionType: "lendDocument",
      endpoint: "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
      payload: { application: APPLICATION, user: "user-1", book: "book-1" },
    },
  },
  testCompositeActionAssertions: [assertion(`${label} check`, "pass")],
});

const suite = (...miroirTests: unknown[]) => ({
  uuid: MIROIR_TEST,
  name: "agent.test",
  definition: { miroirTestType: "miroirTestSuite", miroirTestLabel: "agent.test", miroirTests },
});

const liveModel: Record<string, unknown[]> = {
  applications: [{ uuid: APPLICATION, parentName: "SelfApplication", name: "Library" }],
  applicationModelBranches: [{ uuid: "branch-1", parentName: "ApplicationModelBranch", selfApplication: APPLICATION }],
  applicationVersions: [{ uuid: "version-1", parentName: "ApplicationVersion", selfApplication: APPLICATION }],
  runners: [
    { uuid: RUNNER, parentName: "Runner", name: "lendDocument", application: APPLICATION, definition: { runnerType: "actionRunner" } },
    {
      uuid: MCP_RUNNER,
      parentName: "Runner",
      name: "mcpLend",
      application: APPLICATION,
      definition: { runnerType: "mcpToolRunner", toolName: "Library_lendDocument" },
    },
  ],
  endpoints: [
    {
      uuid: LENDING_ENDPOINT,
      parentName: "Endpoint",
      name: "Lending",
      application: APPLICATION,
      definition: { actions: [{ actionParameters: { actionType: { type: "literal", definition: "lendDocument" } } }] },
    },
  ],
};

type Call = { method: string; args: any[] };

// a test suite is tracked through the event service, as on the server
const disposables: { destroy(): void }[] = [];
afterEach(() => {
  disposables.splice(0).forEach((disposable) => disposable.destroy());
});

/**
 * A host on a fake DomainController: queries answer from `miroirTest` and `liveModel`, every action
 * succeeds, and a composite test records its assertions in the activity tracker as the real one does.
 */
function fakeHost(miroirTest: unknown, throwingTests: string[] = [], refusedActions: string[] = []) {
  const tracker = new MiroirActivityTracker();
  disposables.push(tracker, new MiroirEventService(tracker));
  const calls: Call[] = [];
  const recordAssertions = (testLabel: string, assertions: any[]) => {
    for (const { payload } of assertions ?? []) {
      const passed = payload.definition.expectedValue == "pass";
      tracker.setTestAssertionResult([{ test: testLabel }, { testAssertion: payload.testLabel }], {
        assertionName: payload.testLabel,
        assertionResult: passed ? "ok" : "error",
        ...(passed ? {} : { assertionExpectedValue: payload.definition.expectedValue, assertionActualValue: "pass" }),
      });
    }
  };
  const domainController = new Proxy(
    {},
    {
      get: (_target, method) => {
        if (method == "then") {
          return undefined;
        }
        if (method == "currentModelEnvironment") {
          return () => defaultMiroirModelEnvironment;
        }
        return async (...args: any[]) => {
          calls.push({ method: String(method), args });
          if (method == "handleAction" && refusedActions.includes(args[0].actionType)) {
            return new Action2Error("FailedToHandleAction", `${args[0].actionType} refused`);
          }
          if (method == "handleTestCompositeAction") {
            if (throwingTests.includes(args[0].testLabel)) {
              throw new Error(`${args[0].testLabel} threw`);
            }
            recordAssertions(args[0].testLabel, args[0].testCompositeActionAssertions);
          }
          if (method == "handleTestCompositeActionSuite") {
            for (const test of Object.values<any>(args[1].testCompositeActions)) {
              recordAssertions(test.testLabel, test.testCompositeActionAssertions);
            }
          }
          return ACTION_OK;
        };
      },
    },
  );
  const host = {
    handleBoxedExtractorOrQueryAction: async (action: any) => {
      const read: Record<string, unknown> = {};
      for (const key of Object.keys(action.payload.query.extractors)) {
        read[key] =
          key == "miroirTest"
            ? miroirTest
            : key == "deployment"
              ? {
                  uuid: DEPLOYMENT,
                  configuration: {
                    admin: { emulatedServerType: "filesystem", directory: ".miroir/bench/admin" },
                    model: { emulatedServerType: "filesystem", directory: ".miroir/bench/library/model" },
                    data: { emulatedServerType: "filesystem", directory: ".miroir/bench/library/data" },
                  },
                }
              : (liveModel[key] ?? []);
      }
      return { status: "ok", returnedDomainElement: read };
    },
    handleCompositeAction: async (...args: any[]) => {
      calls.push({ method: "host.handleCompositeAction", args });
      return ACTION_OK;
    },
    asDomainControllerInterface: () => domainController,
    getMiroirActivityTracker: () => tracker,
  } as unknown as DomainControllerActionHost;
  return { host, calls };
}

const run = async (host: DomainControllerActionHost, leaves?: string[]) =>
  (await handleAction_runMiroirTestAction(host, runAction(MIROIR_TEST, leaves), context)) as any;

const containing = (calls: Call[], text: string) => calls.filter((call) => JSON.stringify(call.args).includes(text));

describe("runMiroirTestAction (#575)", () => {
  it("fails with FailedToRunMiroirTest when the MiroirTest does not exist", async () => {
    const { host, calls } = fakeHost(undefined);
    const result = await run(host);
    expect(result).toBeInstanceOf(Action2Error);
    expect(result.errorType).toBe("FailedToRunMiroirTest");
    expect(calls).toEqual([]);
  });

  it("fails when a selected leaf does not exist", async () => {
    const { host } = fakeHost(suite(sum("adds", 3)));
    const result = await run(host, ["missing"]);
    expect(result.errorType).toBe("FailedToRunMiroirTest");
    expect(result.errorMessage).toContain('"missing"');
  });

  it("runs unit leaves in memory, without a testbed", async () => {
    const { host, calls } = fakeHost(suite(sum("adds", 3), sum("adds wrongly", 4)));
    const result = await run(host);
    expect(result.status).toBe("ok");
    expect(result.returnedDomainElement.leaves.map((leaf: any) => [leaf.path, leaf.result])).toEqual([
      [["agent.test", "adds"], "ok"],
      [["agent.test", "adds wrongly"], "error"],
    ]);
    expect(result.returnedDomainElement.leaves[1].message).toBeDefined();
    expect(calls).toEqual([]);
  });

  it("runs an actionTest leaf on a testbed created, reseeded and dropped around it", async () => {
    const { host, calls } = fakeHost(suite(actionTest("lends")));
    const result = await run(host);
    expect(result.status).toBe("ok");
    const { testbed, leaves } = result.returnedDomainElement;
    expect(leaves).toEqual([
      {
        path: ["agent.test", "lends"],
        type: "actionTest",
        result: "ok",
        assertions: [{ name: "lends check", result: "ok" }],
      },
    ]);

    const [create] = calls;
    expect(create.method).toBe("host.handleCompositeAction");
    expect(JSON.stringify(create.args[0])).toContain(testbed.deploymentUuid);
    // the leaves never reach the live application
    expect(create.args[1]).toEqual({ [MIROIR_APPLICATION]: MIROIR_DEPLOYMENT, [testbed.applicationUuid]: testbed.deploymentUuid });
    const leafRun = calls.find((call) => call.method == "handleTestCompositeAction")!;
    expect(JSON.stringify(leafRun.args[0])).not.toContain(APPLICATION);
    expect(JSON.stringify(leafRun.args[0])).toContain(testbed.applicationUuid);

    const leafIndex = calls.indexOf(leafRun);
    expect(containing(calls.slice(1, leafIndex), "resetAndInitApplicationDeployment").length).toBeGreaterThan(0);
    expect(containing(calls.slice(leafIndex), "storeManagementAction_deleteStore").length).toBeGreaterThan(0);
  });

  it("reports a failed assertion with its expected and actual values", async () => {
    const { host } = fakeHost(suite(actionTest("lends", "fail")));
    const [leaf] = (await run(host)).returnedDomainElement.leaves;
    expect(leaf.result).toBe("error");
    expect(leaf.assertions).toEqual([{ name: "lends check", result: "error", expected: "fail", actual: "pass" }]);
  });

  it("reports a leaf that throws, runs the next one and still drops the testbed", async () => {
    const { host, calls } = fakeHost(suite(actionTest("throws"), actionTest("lends")), ["throws"]);
    const result = await run(host);
    expect(result.returnedDomainElement.leaves.map((leaf: any) => leaf.result)).toEqual(["error", "ok"]);
    expect(result.returnedDomainElement.leaves[0].message).toContain("throws threw");
    expect(containing(calls, "storeManagementAction_deleteStore").length).toBeGreaterThan(0);
  });

  it("runs only the selected leaves", async () => {
    const { host } = fakeHost(suite(sum("adds", 3), actionTest("lends")));
    const result = await run(host, ["adds"]);
    expect(result.returnedDomainElement.leaves.map((leaf: any) => leaf.result)).toEqual(["ok", "skipped"]);
    expect(result.returnedDomainElement.testbed).toBeUndefined();
  });

  it("runs a runnerTest leaf on the testbed, without creating or dropping a deployment of its own", async () => {
    const { host, calls } = fakeHost(suite(runnerTest("lend through the runner")));
    const result = await run(host);
    const { testbed, leaves } = result.returnedDomainElement;
    expect(leaves.map((leaf: any) => [leaf.result, leaf.message])).toEqual([["ok", undefined]]);
    const leafRun = calls.find((call) => call.method == "handleTestCompositeActionSuite")!;
    const [application, suiteRun, , , testParams] = leafRun.args;
    expect(application).toBe(testbed.applicationUuid);
    expect(suiteRun.beforeAll).toBeUndefined();
    expect(suiteRun.beforeEach).toBeUndefined();
    expect(JSON.stringify([suiteRun, testParams])).not.toContain(APPLICATION);
    expect(JSON.stringify(testParams.lendDocument)).toContain(testbed.applicationUuid);
  });

  it("marks leaves it cannot run as unsupported", async () => {
    const { host } = fakeHost(
      suite(
        { miroirTestType: "reportTest", miroirTestLabel: "report" },
        { miroirTestType: "reactComponentTest", miroirTestLabel: "component" },
        { ...sum("store transformer", 3), unitTestExpectedValue: undefined, integrationTestExpectedValue: 3 },
      ),
    );
    const { leaves } = (await run(host)).returnedDomainElement;
    expect(leaves.map((leaf: any) => leaf.result)).toEqual(["unsupported", "unsupported", "unsupported"]);
    expect(leaves.every((leaf: any) => typeof leaf.message == "string")).toBe(true);
  });

  it("runs an mcpToolRunner leaf's tool as the testbed's Endpoint action, never the live one", async () => {
    const mcpLeaf = (label: string, expectedMcpStatus: string) => ({
      ...runnerTest(label, MCP_RUNNER),
      testParams: {
        mcpLend: { user: "user-1", book: "book-1", application: APPLICATION },
        expectedMcpStatus,
      },
      testCompositeActionAssertions: [],
    });
    const { host, calls } = fakeHost(
      suite(mcpLeaf("refused", "error"), mcpLeaf("expects success", "success")),
      [],
      ["lendDocument"],
    );
    const { testbed, leaves } = (await run(host)).returnedDomainElement;
    expect(leaves.map((leaf: any) => leaf.result)).toEqual(["ok", "error"]);
    const lends = calls.filter((call) => call.method == "handleAction" && call.args[0].actionType == "lendDocument");
    expect(lends).toHaveLength(2);
    expect(lends[0].args[0]).toMatchObject({ endpoint: LENDING_ENDPOINT, payload: { user: "user-1", application: testbed.applicationUuid } });
    expect(lends[0].args[1]).not.toHaveProperty(APPLICATION);
  });
});
