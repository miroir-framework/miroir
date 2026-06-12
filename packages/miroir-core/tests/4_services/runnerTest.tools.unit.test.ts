import { describe, expect, it } from "vitest";

import { miroirTest_runner_library } from "miroir-test-app_deployment-library";
import {
  miroirTestForRunner,
  type MiroirTestDefinition,
  type MiroirTestForRunner,
  type MiroirTestSuite,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";
import { RUNNER_TEST_ENVIRONMENT_REFS } from "miroir-test-app_deployment-library";
import {
  libraryTestIdentifiers,
  resolveRunnerTestFixture,
  RUNNER_TEST_INITIAL_MODEL_FROM_PARAMETERS,
} from "miroir-test-app_deployment-library";
import { resolveRunnerTestLeaf } from "../../src/5_tests/RunnerTestTools";
import { expandResolvableResetAndinitializeDeploymentCompositeAction } from "../../src/1_core/Deployment";

describe("runnerTest tools", () => {
  it("miroirTestForRunner validates a minimal runnerTest leaf", () => {
    const parsed = miroirTestForRunner.parse({
      miroirTestType: "runnerTest",
      miroirTestLabel: "Lend Book Test Composite Action",
      runnerRef: "lendDocument",
      fixtureRef: "libraryLendBookDefaults",
      environmentRef: "libraryRunnerTestEnvironment",
    });
    expect(parsed.runnerRef).toBe("lendDocument");
    expect(miroirTestForRunner).toBe(miroirTestForRunner);
  });

  it("libraryLendBookDefaults uses getFromParameters transformer for initialModel", () => {
    const fixture = resolveRunnerTestFixture("libraryLendBookDefaults");
    expect(fixture.initialModel).toEqual(RUNNER_TEST_INITIAL_MODEL_FROM_PARAMETERS);
    expect(fixture.initialModel).not.toHaveProperty("entities");
  });

  it("libraryRunnerTestEnvironment seeds defaultLibraryAppModel in param bank", () => {
    const environment = RUNNER_TEST_ENVIRONMENT_REFS;
    expect(environment?.testParams.defaultLibraryAppModel).toBe(defaultLibraryAppModel);
    expect(environment).not.toHaveProperty("initialModel");
  });

  it("resolveRunnerTestLeaf builds testBuildPlusRuntimeCompositeActionSuite from fixture refs", () => {
    const suite = (miroirTest_runner_library as MiroirTestDefinition)
      .definition as MiroirTestSuite;
    const leaf = suite.miroirTests[0] as MiroirTestForRunner;
    const fixture = resolveRunnerTestFixture(leaf.fixtureRef);
    const environment = RUNNER_TEST_ENVIRONMENT_REFS;

    const resolved = resolveRunnerTestLeaf({
      leaf,
      pageLabel: "Runner_Miroir.integ.test",
      buildContext: {
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
      },
    });

    expect(resolved.testActionType).toBe("testBuildPlusRuntimeCompositeActionSuite");
    expect(resolved.application).toBe(libraryTestIdentifiers.testApplicationUuid);
    expect(resolved.testParams).toEqual({
      ...environment?.testParams,
      ...fixture.testParams,
    });
    expect(
      resolved.testCompositeAction.beforeEach?.payload._resolvableAppMetaModel,
    ).toEqual(RUNNER_TEST_INITIAL_MODEL_FROM_PARAMETERS);
    const expandedBeforeEach = expandResolvableResetAndinitializeDeploymentCompositeAction(
      resolved.testCompositeAction.beforeEach!,
      resolved.testParams as Record<string, unknown>,
    );
    expect(
      expandedBeforeEach.payload.actionSequence.some(
        (action) => action.actionLabel === "resetAndinitializeDeploymentCompositeAction_createEntities",
      ),
    ).toBe(true);
    expect(
      resolved.testCompositeAction.testCompositeActions?.["Lend Book Test Composite Action"]
        ?.testCompositeActionAssertions,
    ).toEqual(fixture.testCompositeActionAssertions);
  });

  it("resolveRunnerTestLeaf builds return book suite from fixture refs", () => {
    const leaf: MiroirTestForRunner = {
      miroirTestType: "runnerTest",
      miroirTestLabel: "Return Book Test Composite Action",
      environmentRef: "libraryRunnerTestEnvironment",
      runnerRef: "returnDocument",
      fixtureRef: "libraryReturnBookDefaults",
      deploymentRef: "libraryTestIdentifiers",
    };
    const fixture = resolveRunnerTestFixture(leaf.fixtureRef);
    const environment = RUNNER_TEST_ENVIRONMENT_REFS;

    const resolved = resolveRunnerTestLeaf({
      leaf,
      pageLabel: "Runner_Miroir.integ.test",
      buildContext: {
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
      },
    });

    expect(resolved.testParams).toEqual({
      ...environment?.testParams,
      ...fixture.testParams,
    });
    expect(
      resolved.testCompositeAction.testCompositeActions?.["Return Book Test Composite Action"]
        ?.testCompositeActionAssertions,
    ).toEqual(fixture.testCompositeActionAssertions);
  });
});
