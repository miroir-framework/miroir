import { describe, expect, it } from "vitest";

import {
  defaultLibraryAppModel,
  deployment_Library_DO_NO_USE,
  lendDocument,
  miroirTest_runner_lend_document,
  miroirTest_runner_return_document,
  returnDocument,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";
import {
  miroirTest_runner_create_entity,
  miroirTest_runner_drop_entity,
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
import { expandResolvableResetAndinitializeDeploymentCompositeAction } from "../../src/1_core/Deployment.js";
import { emptyApplicationModel } from "../../src/1_core/Model";
import { remapLibraryAppModelForRunTarget } from "../../src/1_core/model/cloneApplication/remapApplicationModelAtPaths.js";
import {
  buildRunnerTestSessionParamBank,
  resolveDefaultApplicationNameFromMiroirTestSuite,
  resolveRunnerFromMiroirTestSuite,
  resolveRunnerTestLeaf,
  resolveSkipRunTargetPlayfieldResetFromMiroirTestSuite,
} from "../../src/5_tests/RunnerTestTools";
import { getTestbedUuidsForTestSuite } from "../../src/5_tests/TestbedUuids";

const getFromParameters = (referenceName: string) => ({
  transformerType: "getFromParameters" as const,
  interpolation: "build" as const,
  referenceName,
});

function runnerLendDocumentSuite(): MiroirTestSuite {
  return (miroirTest_runner_lend_document as MiroirTestDefinition).definition as MiroirTestSuite;
}

function runnerReturnDocumentSuite(): MiroirTestSuite {
  return (miroirTest_runner_return_document as MiroirTestDefinition).definition as MiroirTestSuite;
}

function runnerLibrarySuites(): MiroirTestSuite[] {
  return [runnerLendDocumentSuite(), runnerReturnDocumentSuite()];
}

/** Single-leaf suites: the only runnerTest leaf of the given suite. */
function runnerLibraryLeaf(suite: MiroirTestSuite): MiroirTestForRunner {
  return suite.miroirTests[0] as MiroirTestForRunner;
}

function runnerLibrarySessionContext(suite: MiroirTestSuite) {
  const runTarget = getTestbedUuidsForTestSuite({ suite });
  const sessionTestParams = buildRunnerTestSessionParamBank(suite.testParams, runTarget, {
    defaultLibraryAppModel,
  });
  return { suite, runTarget, sessionTestParams };
}

const RUNNER_SUITE_STATIC_TEST_PARAM_KEYS = [
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
    const lendDocumentUuid = "cc853632-f158-43fa-b9ed-437c9c25f539";
    const parsed = miroirTestForRunnerSchema.parse({
      miroirTestType: "runnerTest",
      miroirTestLabel: "Lend Book Test Composite Action",
      runnerRef: lendDocumentUuid,
      deploymentRef: "libraryTestIdentifiers",
      initialModel: getFromParameters("defaultLibraryAppModel"),
    });
    expect(parsed.runnerRef).toBe(lendDocumentUuid);
    expect(parsed.fixtureRef).toBeUndefined();
  });

  it("runner create/drop entity leaves declare skipRunTargetPlayfieldReset", () => {
    const createSuite = (miroirTest_runner_create_entity as MiroirTestDefinition)
      .definition as MiroirTestSuite;
    const dropSuite = (miroirTest_runner_drop_entity as MiroirTestDefinition)
      .definition as MiroirTestSuite;
    expect(resolveSkipRunTargetPlayfieldResetFromMiroirTestSuite(createSuite)).toBe(true);
    expect(resolveDefaultApplicationNameFromMiroirTestSuite(createSuite)).toBe(
      "testApplication_CreateEntity",
    );
    expect(resolveSkipRunTargetPlayfieldResetFromMiroirTestSuite(dropSuite)).toBe(true);
    expect(resolveDefaultApplicationNameFromMiroirTestSuite(dropSuite)).toBe(
      "testApplication_DropEntity",
    );
  });

  it("resolveRunnerFromMiroirTestSuite looks up Runner via leaf runnerRef + runnerUuidIndex", () => {
    const suite = runnerLendDocumentSuite();
    const runnerUuidIndex = { [lendDocument.uuid]: lendDocument };
    expect(resolveRunnerFromMiroirTestSuite(suite, runnerUuidIndex)).toBe(lendDocument);
    expect(runnerLibraryLeaf(suite).runnerRef).toBe(lendDocument.uuid);
  });

  it("library runner suite leaves reference their Runner via runnerRef (resolved via runnerUuidIndex)", () => {
    expect(runnerLibraryLeaf(runnerLendDocumentSuite()).runnerRef).toBe(lendDocument.uuid);
    expect(runnerLibraryLeaf(runnerReturnDocumentSuite()).runnerRef).toBe(returnDocument.uuid);
    expect(lendDocument.uuid).toBe("cc853632-f158-43fa-b9ed-437c9c25f539");
    expect(returnDocument.uuid).toBe("98a38a84-e702-4540-a056-c7676a193a2b");
  });

  it("runner_lend_document / runner_return_document leaves are inline runnerTests without fixtureRef", () => {
    for (const suite of runnerLibrarySuites()) {
      for (const test of suite.miroirTests) {
        const leaf = test as MiroirTestForRunner;
        expect(leaf.fixtureRef).toBeUndefined();
        expect(leaf.initialModel).toEqual(getFromParameters("defaultLibraryAppModel"));
      }
    }
  });

  it("runner_lend_document leaf encodes getFromParameters transformers in JSON", () => {
    const leaf = runnerLibraryLeaf(runnerLendDocumentSuite());
    const lendParams = leaf.testParams!.lendDocument as {
      payload: Record<string, { referenceName: string }>;
    };
    expect(lendParams.payload.user).toEqual(getFromParameters("user1Uuid"));
    expect(lendParams.payload.book).toEqual(getFromParameters("book1Uuid"));
    expect(lendParams.payload.startDate).toEqual(getFromParameters("lendStartDate"));
  });

  it.each([
    ["runner_lend_document", runnerLendDocumentSuite],
    ["runner_return_document", runnerReturnDocumentSuite],
  ])("%s suite exposes suite-level testParams (R6-A)", (_name, suiteGetter) => {
    const suite = suiteGetter();
    expect(suite.testParams).toBeDefined();

    const parsedShell = miroirTestSuiteSchema.parse({
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: suite.miroirTestLabel,
      testParams: suite.testParams,
      miroirTests: [],
    });
    expect(parsedShell.testParams).toBeDefined();

    for (const key of RUNNER_SUITE_STATIC_TEST_PARAM_KEYS) {
      expect(parsedShell.testParams![key]).toBeDefined();
    }

    expect(parsedShell.testParams).not.toHaveProperty("testApplicationUuid");
    expect(parsedShell.testParams).not.toHaveProperty("testApplicationDeploymentUuid");
    expect(parsedShell.testParams).not.toHaveProperty("defaultLibraryAppModel");
  });

  it("resolveRunnerTestLeaf expands ephemeral defaultLibraryAppModel with new application uuid", () => {
    const suite = runnerLendDocumentSuite();
    const leaf = runnerLibraryLeaf(suite);
    const ephemeralApplicationUuid = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const ephemeralDeploymentUuid = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    const runTarget = getTestbedUuidsForTestSuite({
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
      resolvedRunner: lendDocument,
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
    const createEntitiesAction = expandedBeforeEach.payload.actionSequence.find(
      (action) =>
        action.actionLabel === "resetAndinitializeDeploymentCompositeAction_createEntities",
    );
    expect(createEntitiesAction?.payload?.entities).toEqual(
      remappedLibraryModel.entities,
    );
  });

  // ##############################################################################################
  it("resolveRunnerTestLeaf resolves the suite Runner via resolvedRunner", () => {
    const suite = runnerLendDocumentSuite();
    const leaf = runnerLibraryLeaf(suite);
    const { runTarget, sessionTestParams } = runnerLibrarySessionContext(suite);

    const resolved = resolveRunnerTestLeaf({
      leaf,
      pageLabel: "Runner_Miroir.integ.test",
      buildContext,
      runTarget,
      sessionTestParams,
      resolvedRunner: lendDocument,
    });

    expect(resolved.testActionType).toBe("testBuildPlusRuntimeCompositeActionSuite");
    expect(resolved.application).toBe(runTarget.applicationUuid);
  });

  // ##############################################################################################
  it.each([
    ["Lend Book Test Composite Action", runnerLendDocumentSuite, lendDocument],
    ["Return Book Test Composite Action", runnerReturnDocumentSuite, returnDocument],
  ])("resolveRunnerTestLeaf builds suite from session context — %s (R6-D/E)", (_label, suiteGetter, runner) => {
    const suite = suiteGetter();
    const leaf = runnerLibraryLeaf(suite);
    const { runTarget, sessionTestParams } = runnerLibrarySessionContext(suite);
    const resolved = resolveRunnerTestLeaf({
      leaf,
      pageLabel: "Runner_Miroir.integ.test",
      buildContext,
      runTarget,
      sessionTestParams,
      resolvedRunner: runner,
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

  // ##############################################################################################
  it("runner_create_entity suite omits runTarget and uses emptyApplicationModel initialModel", () => {
    const suite = (miroirTest_runner_create_entity as MiroirTestDefinition)
      .definition as MiroirTestSuite;
    expect(suite.runTarget).toBeUndefined();
    expect(suite.miroirTests).toHaveLength(2);
    for (const test of suite.miroirTests) {
      const leaf = test as MiroirTestForRunner;
      expect(leaf.runnerRef).toBe("82f81a25-2366-4abf-8a97-83ca5e9a9c46");
      expect(RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY[leaf.runnerRef]?.uuid).toBe(leaf.runnerRef);
      expect(leaf.initialModel).toEqual(getFromParameters("emptyApplicationModel"));
      expect(leaf.testParams?.createEntity).toBeDefined();
    }
  });

  // ##############################################################################################
  it("resolveRunnerTestLeaf builds createEntity suite with ephemeral runTarget + empty model", () => {
    const suite = (miroirTest_runner_create_entity as MiroirTestDefinition)
      .definition as MiroirTestSuite;
    const leaf = suite.miroirTests[0] as MiroirTestForRunner;
    const runTarget = getTestbedUuidsForTestSuite({
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
      resolvedRunner: RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY[leaf.runnerRef]!,
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

  it("runner_drop_entity suite omits runTarget and preRunner embeds createEntity sequence", () => {
    const suite = (miroirTest_runner_drop_entity as MiroirTestDefinition)
      .definition as MiroirTestSuite;
    expect(suite.runTarget).toBeUndefined();
    expect(suite.miroirTests).toHaveLength(1);
    const leaf = suite.miroirTests[0] as MiroirTestForRunner;
    expect(leaf.runnerRef).toBe("44313751-b0e5-4132-bb12-a544806e759b");
    expect(RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY[leaf.runnerRef]?.uuid).toBe(leaf.runnerRef);
    expect(leaf.initialModel).toEqual(getFromParameters("emptyApplicationModel"));
    expect(leaf.preRunnerCompositeActions).toHaveLength(1);
    expect(leaf.preRunnerCompositeActions?.[0]).toMatchObject({
      actionType: "compositeActionSequence",
      actionLabel: "createEntitySequence",
    });
    expect(leaf.testParams?.createEntity).toBeDefined();
    expect(leaf.testParams?.dropEntity).toBeDefined();
  });

  it("resolveRunnerTestLeaf builds dropEntity leaf with create+drop params expanded", () => {
    const suite = (miroirTest_runner_drop_entity as MiroirTestDefinition)
      .definition as MiroirTestSuite;
    const leaf = suite.miroirTests[0] as MiroirTestForRunner;
    const runTarget = getTestbedUuidsForTestSuite({
      suite,
      defaultApplicationName: "testApplication_CreateEntity",
    });
    const sessionTestParams = buildRunnerTestSessionParamBank(suite.testParams, runTarget, {
      emptyApplicationModel,
    });
    const resolved = resolveRunnerTestLeaf({
      leaf,
      pageLabel: "runner.dropEntity",
      buildContext,
      runTarget,
      sessionTestParams,
      resolvedRunner: RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY[leaf.runnerRef]!,
    });
    expect(resolved.testActionType).toBe("testBuildPlusRuntimeCompositeActionSuite");
    const dropParams = resolved.testParams.dropEntity as {
      application: string;
      entity: string;
    };
    expect(dropParams.application).toBe(runTarget.applicationUuid);
    expect(typeof dropParams.entity).toBe("string");
    const createParams = resolved.testParams.createEntity as {
      application: string;
    };
    expect(createParams.application).toBe(runTarget.applicationUuid);
  });
});
