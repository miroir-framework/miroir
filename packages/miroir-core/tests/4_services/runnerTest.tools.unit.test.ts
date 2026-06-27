import { describe, expect, it } from "vitest";

import { defaultLibraryAppModel, miroirTest_runner_library } from "miroir-test-app_deployment-library";
import {
  miroirTestForRunner,
  miroirTestSuite,
  type MiroirTestDefinition,
  type MiroirTestForRunner,
  type MiroirTestSuite,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { RUNNER_TEST_ENVIRONMENT_REFS } from "miroir-test-app_deployment-library";
import { libraryTestIdentifiers } from "miroir-test-app_deployment-library";
import { mergeRunnerTestParamBank, resolveRunnerTestLeaf } from "../../src/5_tests/RunnerTestTools";
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
        [libraryTestIdentifiers.testApplicationDeploymentUuid]: {
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
    const parsed = miroirTestForRunner.parse({
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

  it("libraryRunnerTestEnvironment seeds defaultLibraryAppModel in param bank", () => {
    expect(RUNNER_TEST_ENVIRONMENT_REFS?.testParams.defaultLibraryAppModel).toBe(
      defaultLibraryAppModel,
    );
  });

  it("runner_library suite exposes suite-level testParams (R6-A)", () => {
    const suite = runnerLibrarySuite();
    expect(suite.testParams).toBeDefined();

    const parsedShell = miroirTestSuite.parse({
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: suite.miroirTestLabel,
      testParams: suite.testParams,
      miroirTests: [],
    });
    expect(parsedShell.testParams).toBeDefined();

    for (const key of RUNNER_LIBRARY_SUITE_STATIC_TEST_PARAM_KEYS) {
      expect(parsedShell.testParams![key]).toEqual(RUNNER_TEST_ENVIRONMENT_REFS.testParams[key]);
    }

    expect(parsedShell.testParams).not.toHaveProperty("testApplicationUuid");
    expect(parsedShell.testParams).not.toHaveProperty("testApplicationDeploymentUuid");
    expect(parsedShell.testParams).not.toHaveProperty("defaultLibraryAppModel");
  });

  it.each([
    ["Lend Book Test Composite Action", 0],
    ["Return Book Test Composite Action", 1],
  ])("resolveRunnerTestLeaf builds suite from inline JSON — %s", (_label, index) => {
    const leaf = runnerLibraryLeaf(index);
    const resolved = resolveRunnerTestLeaf({
      leaf,
      pageLabel: "Runner_Miroir.integ.test",
      buildContext,
    });

    expect(resolved.testActionType).toBe("testBuildPlusRuntimeCompositeActionSuite");
    expect(resolved.application).toBe(libraryTestIdentifiers.testApplicationUuid);
    expect(resolved.testParams).toEqual(mergeRunnerTestParamBank(RUNNER_TEST_ENVIRONMENT_REFS, leaf));
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
});
