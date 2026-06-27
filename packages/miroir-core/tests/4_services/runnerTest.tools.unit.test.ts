import { describe, expect, it } from "vitest";

import { miroirTest_runner_library } from "miroir-test-app_deployment-library";
import {
  miroirTestForRunner,
  type CoreTransformerForBuildPlusRuntime,
  type MiroirTestDefinition,
  type MiroirTestForRunner,
  type MiroirTestSuite,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";
import { RUNNER_TEST_ENVIRONMENT_REFS } from "miroir-test-app_deployment-library";
import {
  libraryTestIdentifiers,
  resolveRunnerTestFixture,
  RUNNER_TEST_APPLICATION_UUID_FROM_PARAMETERS,
  RUNNER_TEST_DEPLOYMENT_UUID_FROM_PARAMETERS,
  RUNNER_TEST_INITIAL_MODEL_FROM_PARAMETERS,
  RUNNER_TEST_LENDING_HISTORY_ENTITY_NAME_FROM_PARAMETERS,
  RUNNER_TEST_LENDING_HISTORY_ENTITY_UUID_FROM_PARAMETERS,
  RUNNER_TEST_PAYLOAD_BOOK_FROM_PARAMETERS,
  RUNNER_TEST_PAYLOAD_LEND_START_DATE_FROM_PARAMETERS,
  RUNNER_TEST_PAYLOAD_USER_FROM_PARAMETERS,
} from "miroir-test-app_deployment-library";
import { resolveRunnerTestLeaf, resolveRunnerTestDefinition } from "../../src/5_tests/RunnerTestTools";
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

  it("libraryLendBookDefaults uses getFromParameters transformers for runner payload", () => {
    const fixture = resolveRunnerTestFixture("libraryLendBookDefaults");
    const lendParams = fixture.testParams.lendDocument as {
      payload: Record<string, CoreTransformerForBuildPlusRuntime>;
    };
    expect(lendParams.payload.user).toEqual(RUNNER_TEST_PAYLOAD_USER_FROM_PARAMETERS);
    expect(lendParams.payload.book).toEqual(RUNNER_TEST_PAYLOAD_BOOK_FROM_PARAMETERS);
    expect(lendParams.payload.startDate).toEqual(RUNNER_TEST_PAYLOAD_LEND_START_DATE_FROM_PARAMETERS);
  });

  it("libraryLendBookDefaults preTest uses getFromParameters for deployment identifiers", () => {
    const fixture = resolveRunnerTestFixture("libraryLendBookDefaults");
    const preTest = fixture.preTestCompositeActions[0] as {
      payload: {
        payload: {
          application: CoreTransformerForBuildPlusRuntime;
          query: {
            application: CoreTransformerForBuildPlusRuntime;
            pageParams: { currentDeploymentUuid: CoreTransformerForBuildPlusRuntime };
            extractors: {
              items: {
                parentName: CoreTransformerForBuildPlusRuntime;
                parentUuid: CoreTransformerForBuildPlusRuntime;
              };
            };
          };
        };
      };
    };
    const inner = preTest.payload.payload;
    expect(inner.application).toEqual(RUNNER_TEST_APPLICATION_UUID_FROM_PARAMETERS);
    expect(inner.query.application).toEqual(RUNNER_TEST_APPLICATION_UUID_FROM_PARAMETERS);
    expect(inner.query.pageParams.currentDeploymentUuid).toEqual(
      RUNNER_TEST_DEPLOYMENT_UUID_FROM_PARAMETERS,
    );
    expect(inner.query.extractors.items.parentUuid).toEqual(
      RUNNER_TEST_LENDING_HISTORY_ENTITY_UUID_FROM_PARAMETERS,
    );
    expect(inner.query.extractors.items.parentName).toEqual(
      RUNNER_TEST_LENDING_HISTORY_ENTITY_NAME_FROM_PARAMETERS,
    );
  });

  it("libraryReturnBookDefaults preRunner uses getFromParameters for lend payload", () => {
    const fixture = resolveRunnerTestFixture("libraryReturnBookDefaults");
    const preRunner = fixture.preRunnerCompositeActions?.[0] as {
      payload: Record<string, CoreTransformerForBuildPlusRuntime>;
    };
    expect(preRunner.payload.user).toEqual(RUNNER_TEST_PAYLOAD_USER_FROM_PARAMETERS);
    expect(preRunner.payload.book).toEqual(RUNNER_TEST_PAYLOAD_BOOK_FROM_PARAMETERS);
    expect(preRunner.payload.startDate).toEqual(RUNNER_TEST_PAYLOAD_LEND_START_DATE_FROM_PARAMETERS);
  });

  it("resolveRunnerTestDefinition returns catalog entry for fixtureRef leaves", () => {
    const catalog = resolveRunnerTestFixture("libraryLendBookDefaults");
    const definition = resolveRunnerTestDefinition({
      miroirTestType: "runnerTest",
      miroirTestLabel: "Lend Book Test Composite Action",
      runnerRef: "lendDocument",
      fixtureRef: "libraryLendBookDefaults",
    });
    expect(definition).toBe(catalog);
  });

  it("runner_library leaves define inline runnerTest without fixtureRef", () => {
    const suite = (miroirTest_runner_library as MiroirTestDefinition)
      .definition as MiroirTestSuite;
    for (const test of suite.miroirTests) {
      const leaf = test as MiroirTestForRunner;
      expect(leaf.fixtureRef).toBeUndefined();
      expect(leaf.initialModel).toEqual(RUNNER_TEST_INITIAL_MODEL_FROM_PARAMETERS);
    }
  });

  it("resolveRunnerTestDefinition reads inline fields from runner_library leaf", () => {
    const suite = (miroirTest_runner_library as MiroirTestDefinition)
      .definition as MiroirTestSuite;
    const leaf = suite.miroirTests[0] as MiroirTestForRunner;
    const definition = resolveRunnerTestDefinition(leaf);
    expect(definition.initialModel).toEqual(RUNNER_TEST_INITIAL_MODEL_FROM_PARAMETERS);
    expect(definition.preTestCompositeActions).toHaveLength(1);
    expect(definition.testCompositeActionAssertions).toHaveLength(1);
  });

  it("libraryRunnerTestEnvironment seeds defaultLibraryAppModel in param bank", () => {
    const environment = RUNNER_TEST_ENVIRONMENT_REFS;
    expect(environment?.testParams.defaultLibraryAppModel).toBe(defaultLibraryAppModel);
    expect(environment).not.toHaveProperty("initialModel");
  });

  it("resolveRunnerTestLeaf builds testBuildPlusRuntimeCompositeActionSuite from inline JSON", () => {
    const suite = (miroirTest_runner_library as MiroirTestDefinition)
      .definition as MiroirTestSuite;
    const leaf = suite.miroirTests[0] as MiroirTestForRunner;
    const definition = resolveRunnerTestDefinition(leaf);
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
      ...definition.testParams,
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
    expect(environment?.testParams.defaultLibraryAppModel).toBe(defaultLibraryAppModel);
    expect(
      resolved.testCompositeAction.testCompositeActions?.["Lend Book Test Composite Action"]
        ?.testCompositeActionAssertions,
    ).toEqual(definition.testCompositeActionAssertions);
  });

  it("resolveRunnerTestLeaf builds return book suite from inline JSON definition", () => {
    const suite = (miroirTest_runner_library as MiroirTestDefinition)
      .definition as MiroirTestSuite;
    const leaf = suite.miroirTests[1] as MiroirTestForRunner;
    const definition = resolveRunnerTestDefinition(leaf);
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
      ...definition.testParams,
    });
    expect(definition.preRunnerCompositeActions).toHaveLength(1);
    expect(
      resolved.testCompositeAction.testCompositeActions?.["Return Book Test Composite Action"]
        ?.testCompositeActionAssertions,
    ).toEqual(definition.testCompositeActionAssertions);
  });
});
