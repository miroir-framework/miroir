import { describe, expect, it } from "vitest";

import { defaultLibraryAppModel, deployment_Library_DO_NO_USE, miroirTest_runner_library, RUNNER_LIBRARY_RUNNER_REGISTRY, selfApplicationLibrary } from "miroir-test-app_deployment-library";
import {
  miroirTest_runner_create_entity,
  RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY,
} from "miroir-test-app_deployment-miroir";
import {
  miroirTestForRunner as miroirTestForRunnerSchema,
  miroirTestSuite as miroirTestSuiteSchema,
  type MetaModel,
  type MiroirTestDefinition,
  type MiroirTestForRunner,
  type MiroirTestSuite,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { emptyApplicationModel } from "../../src/1_core/Model";
import {
  buildRunnerTestSessionParamBank,
  mergeRunnerTestParamBank,
  resolveRunnerTestLeaf,
} from "../../src/5_tests/RunnerTestTools";
import { resolveRunnerTestRunTarget } from "../../src/5_tests/RunnerTestRunTarget";
import { remapLibraryAppModelForRunTarget } from "../../src/1_core/remapApplicationModelAtPaths";
import { expandResolvableResetAndinitializeDeploymentCompositeAction } from "../../src/1_core/Deployment";

const getFromParameters = (referenceName: string) => ({
  transformerType: "getFromParameters" as const,
  interpolation: "build" as const,
  referenceName,
});

function runnerLibrarySuite(): MiroirTestSuite {
  return (miroirTest_runner_library as MiroirTestDefinition).definition as MiroirTestSuite;
}

function runnerLibraryLeaf(index: number): MiroirTestForRunner {
  return runnerLibrarySuite().miroirTests[index] as MiroirTestForRunner;
}

function runnerLibrarySessionContext() {
  const suite = runnerLibrarySuite();
  const runTarget = resolveRunnerTestRunTarget({ suite });
  const sessionTestParams = buildRunnerTestSessionParamBank(suite.testParams, runTarget, {
    defaultLibraryAppModel,
  });
  return { suite, runTarget, sessionTestParams };
}

const RUNNER_LIBRARY_SUITE_STATIC_TEST_PARAM_KEYS = [
  "user1Uuid",
  "book1Uuid",
  "lendStartDate",
  "lendEndDate",
  "lendingHistoryItemEntityUuid",
  "lendingHistoryItemEntityName",
] as const;

const buildContext = {
  internalMiroirConfig: {
    client: {
      emulateServer: true,
      deploymentStorageConfig: {
        "f714bb2f-a12d-4e71-a03b-74dcedea6eb4": {
          admin: { emulatedServerType: "sql" },
          model: { emulatedServerType: "sql" },
          data: { emulatedServerType: "sql" },
        },
      },
    },
  } as any,
  adminDeployment: { uuid: "admin-deployment" } as any,
  testDeploymentStorageConfiguration: {
    admin: { emulatedServerType: "sql" },
    model: { emulatedServerType: "sql" },
    data: { emulatedServerType: "sql" },
  } as any,
};

describe("runnerTest tools", () => {
  it("miroirTestForRunner validates a minimal inline runnerTest leaf", () => {
    const parsed = miroirTestForRunnerSchema.parse({
      miroirTestType: "runnerTest",
      miroirTestLabel: "Lend Book Test Composite Action",
      runnerRef: "lendDocument",
      deploymentRef: "libraryTestIdentifiers",
      initialModel: getFromParameters("defaultLibraryAppModel"),
    });
    expect(parsed.runnerRef).toBe("lendDocument");
    expect(parsed.fixtureRef).toBeUndefined();
  });

  it("runner_library leaves are inline runnerTests without fixtureRef", () => {
    for (const test of runnerLibrarySuite().miroirTests) {
      const leaf = test as MiroirTestForRunner;
      expect(leaf.fixtureRef).toBeUndefined();
      expect(leaf.initialModel).toEqual(getFromParameters("defaultLibraryAppModel"));
    }
  });

  it("runner_library lend leaf encodes getFromParameters transformers in JSON", () => {
    const leaf = runnerLibraryLeaf(0);
    const lendParams = leaf.testParams!.lendDocument as {
      payload: Record<string, { referenceName: string }>;
    };
    expect(lendParams.payload.user).toEqual(getFromParameters("user1Uuid"));
    expect(lendParams.payload.book).toEqual(getFromParameters("book1Uuid"));
    expect(lendParams.payload.startDate).toEqual(getFromParameters("lendStartDate"));
  });

  it("runner_library suite exposes suite-level testParams (R6-A)", () => {
    const suite = runnerLibrarySuite();
    expect(suite.testParams).toBeDefined();

    const parsedShell = miroirTestSuiteSchema.parse({
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: suite.miroirTestLabel,
      testParams: suite.testParams,
      miroirTests: [],
    });
    expect(parsedShell.testParams).toBeDefined();

    for (const key of RUNNER_LIBRARY_SUITE_STATIC_TEST_PARAM_KEYS) {
      expect(parsedShell.testParams![key]).toBeDefined();
    }

    expect(parsedShell.testParams).not.toHaveProperty("testApplicationUuid");
    expect(parsedShell.testParams).not.toHaveProperty("testApplicationDeploymentUuid");
    expect(parsedShell.testParams).not.toHaveProperty("defaultLibraryAppModel");
  });

  it("resolveRunnerTestLeaf expands ephemeral defaultLibraryAppModel with new application uuid", () => {
    const leaf = runnerLibraryLeaf(0);
    const suite = runnerLibrarySuite();
    const ephemeralApplicationUuid = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const ephemeralDeploymentUuid = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    const runTarget = resolveRunnerTestRunTarget({
      suite: { miroirTestLabel: suite.miroirTestLabel },
      generateUuid: (() => {
        let index = 0;
        return () =>
          index++ === 0 ? ephemeralApplicationUuid : ephemeralDeploymentUuid;
      })(),
    });
    const remappedLibraryModel = remapLibraryAppModelForRunTarget(
      defaultLibraryAppModel as MetaModel,
      selfApplicationLibrary.uuid as string,
      deployment_Library_DO_NO_USE.uuid,
      runTarget,
    );
    const sessionTestParams = buildRunnerTestSessionParamBank(suite.testParams, runTarget, {
      defaultLibraryAppModel: remappedLibraryModel,
    });
    const resolved = resolveRunnerTestLeaf({
      leaf,
      pageLabel: "Runner_Miroir.integ.test",
      buildContext,
      runTarget,
      sessionTestParams,
      runnerRegistry: RUNNER_LIBRARY_RUNNER_REGISTRY,
    });

    const expandedBeforeEach = expandResolvableResetAndinitializeDeploymentCompositeAction(
      resolved.testCompositeAction.beforeEach!,
      resolved.testParams as Record<string, unknown>,
    );
    expect((resolved.testParams.defaultLibraryAppModel as MetaModel).applicationUuid).toBe(
      ephemeralApplicationUuid,
    );
    expect(
      expandedBeforeEach.payload.actionSequence.some(
        (action) => action.payload?.application === ephemeralApplicationUuid,
      ),
    ).toBe(true);
  });

  it.each([
    ["Lend Book Test Composite Action", 0],
    ["Return Book Test Composite Action", 1],
  ])("resolveRunnerTestLeaf builds suite from session context — %s (R6-D/E)", (_label, index) => {
    const leaf = runnerLibraryLeaf(index);
    const { runTarget, sessionTestParams } = runnerLibrarySessionContext();
    const resolved = resolveRunnerTestLeaf({
      leaf,
      pageLabel: "Runner_Miroir.integ.test",
      buildContext,
      runTarget,
      sessionTestParams,
      runnerRegistry: RUNNER_LIBRARY_RUNNER_REGISTRY,
    });

    expect(resolved.testActionType).toBe("testBuildPlusRuntimeCompositeActionSuite");
    expect(resolved.application).toBe(runTarget.applicationUuid);
    // Leaf getFromParameters in testParams are expanded against the session bank
    // (mustache runner templates need plain values under paths like createEntity.application).
    expect(resolved.testParams.testApplicationUuid).toBe(runTarget.applicationUuid);
    expect(resolved.testParams.user1Uuid).toBe(sessionTestParams.user1Uuid);
    const lendParams = resolved.testParams.lendDocument as {
      payload: { user: string; book: string; startDate: string };
    } | undefined;
    const returnParams = resolved.testParams.returnDocument as {
      payload: { user: string; book: string; endDate: string };
    } | undefined;
    if (lendParams?.payload) {
      expect(lendParams.payload.user).toBe(sessionTestParams.user1Uuid);
      expect(lendParams.payload.book).toBe(sessionTestParams.book1Uuid);
      expect(lendParams.payload.startDate).toBe(sessionTestParams.lendStartDate);
    }
    if (returnParams?.payload) {
      expect(returnParams.payload.user).toBe(sessionTestParams.user1Uuid);
      expect(returnParams.payload.book).toBe(sessionTestParams.book1Uuid);
      expect(returnParams.payload.endDate).toBe(sessionTestParams.lendEndDate);
    }
    expect(
      resolved.testCompositeAction.beforeEach?.payload._resolvableAppMetaModel,
    ).toEqual(getFromParameters("defaultLibraryAppModel"));

    const expandedBeforeEach = expandResolvableResetAndinitializeDeploymentCompositeAction(
      resolved.testCompositeAction.beforeEach!,
      resolved.testParams as Record<string, unknown>,
    );
    expect(
      expandedBeforeEach.payload.actionSequence.some(
        (action) => action.actionLabel === "resetAndinitializeDeploymentCompositeAction_createEntities",
      ),
    ).toBe(true);

    const testLabel = leaf.testCompositeActionLabel!;
    expect(
      resolved.testCompositeAction.testCompositeActions?.[testLabel]?.testCompositeActionAssertions,
    ).toEqual(leaf.testCompositeActionAssertions);
  });

  it("runner_create_entity suite omits runTarget and uses emptyApplicationModel initialModel", () => {
    const suite = (miroirTest_runner_create_entity as MiroirTestDefinition)
      .definition as MiroirTestSuite;
    expect(suite.runTarget).toBeUndefined();
    expect(suite.miroirTests).toHaveLength(2);
    for (const test of suite.miroirTests) {
      const leaf = test as MiroirTestForRunner;
      expect(leaf.runnerRef).toBe("createEntity");
      expect(leaf.initialModel).toEqual(getFromParameters("emptyApplicationModel"));
      expect(leaf.testParams?.createEntity).toBeDefined();
    }
  });

  it("resolveRunnerTestLeaf builds createEntity suite with ephemeral runTarget + empty model", () => {
    const suite = (miroirTest_runner_create_entity as MiroirTestDefinition)
      .definition as MiroirTestSuite;
    const leaf = suite.miroirTests[0] as MiroirTestForRunner;
    const runTarget = resolveRunnerTestRunTarget({
      suite,
      defaultApplicationName: "testApplication_CreateEntity",
    });
    expect(runTarget.applicationUuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    const sessionTestParams = buildRunnerTestSessionParamBank(suite.testParams, runTarget, {
      emptyApplicationModel,
    });
    expect(sessionTestParams.emptyApplicationModel).toBe(emptyApplicationModel);
    expect(sessionTestParams.testApplicationUuid).toBe(runTarget.applicationUuid);

    const resolved = resolveRunnerTestLeaf({
      leaf,
      pageLabel: "runner.createEntity",
      buildContext,
      runTarget,
      sessionTestParams,
      runnerRegistry: RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY,
    });
    expect(resolved.testActionType).toBe("testBuildPlusRuntimeCompositeActionSuite");
    expect(resolved.application).toBe(runTarget.applicationUuid);
    expect(
      resolved.testCompositeAction.beforeEach?.payload._resolvableAppMetaModel,
    ).toEqual(getFromParameters("emptyApplicationModel"));
    const createEntityParams = resolved.testParams.createEntity as {
      application: string;
    };
    expect(createEntityParams.application).toBe(runTarget.applicationUuid);
  });
});
