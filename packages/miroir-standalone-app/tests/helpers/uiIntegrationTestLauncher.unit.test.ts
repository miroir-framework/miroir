import { describe, expect, it, vi } from "vitest";

import { miroirTest_runner_returnDocument } from "miroir-example-library";
import {
  miroirTest_action_domainController_modelUndoRedo,
} from "miroir-app-miroir";
import {
  indexApplicationMiroirTestsByKey,
  resolveDefaultApplicationNameFromMiroirTestSuite,
  type MiroirTestDefinition,
  type MiroirTestSuite,
} from "miroir-core";
import {
  loadApplicationMiroirTestCatalog,
  loadApplicationRunnerUuidIndexFromFolders,
} from "miroir-core/src/5_tests/loadApplicationMiroirTestsFromFolders.js";

import {
  isUiIntegrationSuiteRunSuccessful,
  REPORT_TESTS_NEED_A_SANDBOX_MESSAGE,
  REPORT_TESTS_NEED_AN_EMULATED_SERVER_MESSAGE,
  resolveUiIntegrationTestRunTarget,
  runUiIntegrationTestSuite,
  type UiIntegrationTestLauncherEnvironment,
} from "../../src/miroir-fwk/4-tests/uiIntegrationTestLauncher.js";
import { libraryTestbedInitParams } from "../../src/miroir-fwk/4-tests/uiIntegrationPlayfieldSeeds.js";
import { appForTestTestbedInitParams } from "../../src/miroir-fwk/4-tests/uiIntegrationAppForTestPlayfieldSeed.js";
import {
  buildUiIntegrationOrchestratorCreateSessionParams,
  listUiIntegrationRunnerSuiteKeys,
  resolveUiIntegrationOrchestratorSessionKind,
  resolveUiIntegrationRunnerUuidIndex,
  UI_INTEGRATION_RUNNER_SUITE_REGISTRY,
  UI_INTEGRATION_RUNNER_UUID_INDEX,
  uiIntegrationRunnerSuiteEntryFromDefinition,
  type UiIntegrationRunnerSuiteEntry,
} from "../../src/miroir-fwk/4-tests/uiIntegrationTestRunnerSuiteRegistry.js";

const applicationMiroirTestCatalogByKey = indexApplicationMiroirTestsByKey(
  loadApplicationMiroirTestCatalog(),
);
const applicationRunnerUuidIndex = loadApplicationRunnerUuidIndexFromFolders();

function runnerSuiteEntryFromFolders(suiteKey: string): UiIntegrationRunnerSuiteEntry {
  const catalogEntry = applicationMiroirTestCatalogByKey[suiteKey];
  if (!catalogEntry) {
    throw new Error(`Missing application MiroirTest suite "${suiteKey}"`);
  }
  const entry = uiIntegrationRunnerSuiteEntryFromDefinition(
    catalogEntry.suiteKey,
    catalogEntry.suiteDefinition,
  );
  if (!entry) {
    throw new Error(`Suite "${suiteKey}" is not a UI runner/action suite`);
  }
  return entry;
}

function runnerReturnDocumentSuite(): MiroirTestSuite {
  return (miroirTest_runner_returnDocument as MiroirTestDefinition).definition as MiroirTestSuite;
}

describe("uiIntegrationTestRunnerSuiteRegistry (B3)", () => {
  it("lists runner.lendDocument, runner.returnDocument, runner.createEntity, runner.dropEntity, and action.domainController suites", () => {
    const keys = listUiIntegrationRunnerSuiteKeys();
    expect(keys).toContain("runner.lendDocument");
    expect(keys).toContain("runner.returnDocument");
    expect(keys).toContain("runner.mcp.getInstances");
    expect(keys).toContain("runner.mcp.lendDocument");
    expect(keys).toContain("runner.createEntity");
    expect(keys).toContain("runner.dropEntity");
    expect(keys).toContain("action.domainController.dataCrud");
    expect(keys).toContain("action.domainController.modelCrud");
  });

  it("registry entries use discriminated union kinds", () => {
    expect(UI_INTEGRATION_RUNNER_SUITE_REGISTRY["runner.lendDocument"].kind).toBe("runnerTest");
    expect(UI_INTEGRATION_RUNNER_SUITE_REGISTRY["runner.returnDocument"].kind).toBe("runnerTest");
    expect(UI_INTEGRATION_RUNNER_SUITE_REGISTRY["runner.createEntity"].kind).toBe("runnerTest");
    expect(UI_INTEGRATION_RUNNER_SUITE_REGISTRY["action.domainController.dataCrud"].kind).toBe(
      "domainControllerTest",
    );
    expect(UI_INTEGRATION_RUNNER_SUITE_REGISTRY["action.scenario.evolutionTrace"].kind).toBe("actionTest");
  });

  it("buildUiIntegrationOrchestratorCreateSessionParams distinguishes runner vs action kinds", () => {
    const context = { miroirConfig: {} as never };
    const runTarget = {
      applicationUuid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      deploymentUuid: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      applicationName: "Library",
    };
    const runnerParams = buildUiIntegrationOrchestratorCreateSessionParams(
      runnerSuiteEntryFromFolders("runner.lendDocument"),
      context,
      "test",
      runTarget,
      {},
      applicationRunnerUuidIndex,
    );
    expect(runnerParams.kind).toBe("runner");
    if (runnerParams.kind === "runner") {
      expect(runnerParams.resolvedRunner).toBeDefined();
      expect(runnerParams.sessionSpecificOptions?.runnerUuidIndex).toBe(
        applicationRunnerUuidIndex,
      );
      expect(runnerParams.sessionSpecificOptions?.integTestbedResetParams).toBeDefined();
    }

    const actionParams = buildUiIntegrationOrchestratorCreateSessionParams(
      runnerSuiteEntryFromFolders("action.domainController.dataCrud"),
      context,
      "test",
      runTarget,
      {},
      applicationRunnerUuidIndex,
    );
    expect(actionParams.kind).toBe("action");
    if (actionParams.kind === "action") {
      expect(actionParams.sessionSpecificOptions.integTestbedResetParams).toBeDefined();
      expect("resolvedRunner" in actionParams).toBe(false);
    }
  });

  it("resolveUiIntegrationOrchestratorSessionKind maps registry entry kinds", () => {
    expect(
      resolveUiIntegrationOrchestratorSessionKind(
        UI_INTEGRATION_RUNNER_SUITE_REGISTRY["runner.returnDocument"],
      ),
    ).toBe("runner");
    expect(
      resolveUiIntegrationOrchestratorSessionKind(
        UI_INTEGRATION_RUNNER_SUITE_REGISTRY["action.domainController.dataCrud"],
      ),
    ).toBe("action");
  });

  it("composes undo_redo playfield from suite JSON plus suite init ref", () => {
    const entry = runnerSuiteEntryFromFolders("action.domainController.modelUndoRedo");
    expect(Object.prototype.hasOwnProperty.call(entry, "integTestbedResetParams")).toBe(false);

    const context = { miroirConfig: {} as never };
    const runTarget = {
      applicationUuid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      deploymentUuid: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      applicationName: "Library",
    };
    const params = buildUiIntegrationOrchestratorCreateSessionParams(
      entry,
      context,
      "test",
      runTarget,
      {},
      applicationRunnerUuidIndex,
    );
    expect(params.kind).toBe("action");
    if (params.kind !== "action") {
      return;
    }
    const seed = params.sessionSpecificOptions.integTestbedResetParams;
    const suite = (miroirTest_action_domainController_modelUndoRedo as MiroirTestDefinition)
      .definition as MiroirTestSuite;
    expect(seed.testbedModel).toEqual(suite.testbedModel);
    expect(seed.testbedEntitiesAndInstances).toEqual(suite.testbedEntitiesAndInstances);
    expect(seed.testbedInitApplicationParameters).toEqual(libraryTestbedInitParams);
  });

  it("lend/return/mcp compose the Library document TestConfiguration seed and drop registry playfield", () => {
    const context = { miroirConfig: {} as never };
    const runTarget = {
      applicationUuid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      deploymentUuid: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      applicationName: "Library",
    };
    const expectedEntityNames = ["Author", "Book", "Publisher", "User"];
    for (const key of [
      "runner.lendDocument",
      "runner.returnDocument",
      "runner.mcp.getInstances",
      "runner.mcp.lendDocument",
    ] as const) {
      const entry = runnerSuiteEntryFromFolders(key);
      expect(Object.prototype.hasOwnProperty.call(entry, "integTestbedResetParams"), key).toBe(
        false,
      );
      expect(entry.suiteDefinition.testbedInitApplicationParameters, key).toBe(
        "libraryTestbedInitParams",
      );

      const params = buildUiIntegrationOrchestratorCreateSessionParams(
        entry,
        context,
        "test",
        runTarget,
        {},
        applicationRunnerUuidIndex,
      );
      expect(params.kind, key).toBe("runner");
      if (params.kind !== "runner") {
        continue;
      }
      const seed = params.sessionSpecificOptions?.integTestbedResetParams;
      expect(seed, key).toBeDefined();
      if (seed === undefined) {
        continue;
      }
      expect(seed.testbedInitApplicationParameters, key).toEqual(libraryTestbedInitParams);
      expect(
        seed.testbedEntitiesAndInstances.map((entry) => entry.entity.name).sort(),
        key,
      ).toEqual(expectedEntityNames);
      expect(seed.testbedModel.applicationUuid, key).toBe(
        "5af03c98-fe5e-490b-b08f-e1230971c57f",
      );
      expect(seed.testbedModel.applicationName, key).toBe("Library");
      expect(
        (seed.testbedModel.entities ?? []).map((entity) => entity.name).sort(),
        key,
      ).toEqual([
        "Author",
        "Book",
        "Country",
        "LendingHistoryItem",
        "Publisher",
        "User",
      ]);
      expect(
        (seed.testbedModel.endpoints ?? []).map((endpoint) => endpoint.uuid).sort(),
        key,
      ).toEqual([
        "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
        "9884c1a4-5122-488a-85db-a99fbc02e678",
      ]);
    }
  });

  it("model_crud / freeze / action.scenario.evolutionTrace compose the Miroir Publisher+Country TestConfiguration seed and drop registry playfield", () => {
    const context = { miroirConfig: {} as never };
    const runTarget = {
      applicationUuid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      deploymentUuid: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      applicationName: "Library",
    };
    const expectedEntityNames = ["Country", "Publisher"];
    for (const key of [
      "action.domainController.modelCrud",
      "action.domainController.freezeApplicationVersion",
      "action.scenario.evolutionTrace",
    ] as const) {
      const entry = runnerSuiteEntryFromFolders(key);
      expect(Object.prototype.hasOwnProperty.call(entry, "integTestbedResetParams"), key).toBe(
        false,
      );
      expect(entry.suiteDefinition.testbedInitApplicationParameters, key).toBe(
        "libraryTestbedInitParams",
      );

      const params = buildUiIntegrationOrchestratorCreateSessionParams(
        entry,
        context,
        "test",
        runTarget,
        {},
        applicationRunnerUuidIndex,
      );
      expect(params.kind, key).toBe("action");
      if (params.kind !== "action") {
        continue;
      }
      const seed = params.sessionSpecificOptions.integTestbedResetParams;
      expect(seed, key).toBeDefined();
      expect(seed.testbedInitApplicationParameters, key).toEqual(libraryTestbedInitParams);
      expect(
        seed.testbedEntitiesAndInstances.map((entry) => entry.entity.name).sort(),
        key,
      ).toEqual(expectedEntityNames);
      expect(seed.testbedModel.applicationUuid, key).toBe(
        "5af03c98-fe5e-490b-b08f-e1230971c57f",
      );
      expect(seed.testbedModel.applicationName, key).toBe("Library");
      expect(
        (seed.testbedModel.entities ?? []).map((entity) => entity.name),
        key,
      ).toEqual(["Publisher", "Country"]);
    }
  });

  it("unique DC suites compose inline JSON playfield and drop registry playfield", () => {
    const context = { miroirConfig: {} as never };
    const runTarget = {
      applicationUuid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      deploymentUuid: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      applicationName: "Library",
    };
    const expectedByKey: Record<string, { entityNames: string[]; modelEntityNames: string[] }> = {
      "action.domainController.dataCrud": {
        entityNames: ["Author", "Book", "Publisher"],
        modelEntityNames: ["Author", "Book", "Publisher"],
      },
      "action.domainController.dataCrud.compositePk": {
        entityNames: ["TestEntityCompositePK"],
        modelEntityNames: ["TestEntityCompositePK"],
      },
      "action.domainController.modelCrud.nonUuidPk": {
        entityNames: ["Publisher"],
        modelEntityNames: ["Publisher"],
      },
      "action.domainController.dataCrud.nonUuidPk": {
        entityNames: ["TestEntityCodeNumber"],
        modelEntityNames: ["TestEntityCodeNumber"],
      },
      "action.domainController.dataCrud.noParentUuid": {
        entityNames: ["Publisher", "TestEntityNoParentUuid"],
        modelEntityNames: ["Publisher", "TestEntityNoParentUuid"],
      },
    };
    for (const key of Object.keys(expectedByKey) as (keyof typeof expectedByKey)[]) {
      const entry = runnerSuiteEntryFromFolders(key);
      expect(Object.prototype.hasOwnProperty.call(entry, "integTestbedResetParams"), key).toBe(
        false,
      );
      expect(entry.suiteDefinition.testbedInitApplicationParameters, key).toBe(
        "libraryTestbedInitParams",
      );

      const params = buildUiIntegrationOrchestratorCreateSessionParams(
        entry,
        context,
        "test",
        runTarget,
        {},
        applicationRunnerUuidIndex,
      );
      expect(params.kind, key).toBe("action");
      if (params.kind !== "action") {
        continue;
      }
      const seed = params.sessionSpecificOptions.integTestbedResetParams;
      expect(seed.testbedInitApplicationParameters, key).toEqual(libraryTestbedInitParams);
      expect(
        seed.testbedEntitiesAndInstances.map((row) => row.entity.name),
        key,
      ).toEqual(expectedByKey[key].entityNames);
      expect((seed.testbedModel.entities ?? []).map((entity) => entity.name), key).toEqual(
        expectedByKey[key].modelEntityNames,
      );
      expect(seed.testbedModel.applicationName, key).toBe("Library");
      expect(seed.testbedModel.reports, key).toBeUndefined();
    }
  });

  it("freeze suite composes inline appForTest playfield and drops registry playfield", () => {
    const context = { miroirConfig: {} as never };
    const runTarget = {
      applicationUuid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      deploymentUuid: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      applicationName: "appForTest",
    };
    const entry = runnerSuiteEntryFromFolders("runner.freezeApplicationVersion");
    expect(Object.prototype.hasOwnProperty.call(entry, "integTestbedResetParams")).toBe(false);
    expect(entry.suiteDefinition.testbedInitApplicationParameters).toBe(
      "appForTestTestbedInitParams",
    );

    const params = buildUiIntegrationOrchestratorCreateSessionParams(
      entry,
      context,
      "test",
      runTarget,
      {},
      applicationRunnerUuidIndex,
    );
    expect(params.kind).toBe("runner");
    if (params.kind !== "runner") {
      return;
    }
    const seed = params.sessionSpecificOptions?.integTestbedResetParams;
    expect(seed).toBeDefined();
    if (seed === undefined) {
      return;
    }
    expect(seed.testbedInitApplicationParameters).toEqual(appForTestTestbedInitParams);
    expect(seed.testbedEntitiesAndInstances.map((row) => row.entity.name)).toEqual([
      "Publisher",
      "Country",
    ]);
    expect(seed.testbedModel.applicationUuid).toBe("eef01001-0001-4000-8000-000000000001");
    expect(seed.testbedModel.applicationName).toBe("appForTest");
    expect((seed.testbedModel.entities ?? []).map((entity) => entity.name)).toEqual([
      "Publisher",
      "Country",
    ]);
    expect(seed.testbedModel.reports).toBeUndefined();
  });

  it("throws when a non-skipReset suite has no suite-owned playfield (no registry fallback)", () => {
    const context = { miroirConfig: {} as never };
    const runTarget = {
      applicationUuid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      deploymentUuid: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      applicationName: "Library",
    };
    const entry = {
      kind: "actionTest" as const,
      suiteDefinition: {
        miroirTestType: "miroirTestSuite",
        miroirTestLabel: "synthetic_no_playfield",
        testbedInitApplicationParameters: "libraryTestbedInitParams",
        miroirTests: [],
      } as MiroirTestSuite,
    };
    expect(() =>
      buildUiIntegrationOrchestratorCreateSessionParams(
        entry,
        context,
        "test",
        runTarget,
        {},
        applicationRunnerUuidIndex,
      ),
    ).toThrow(/no suite-owned playfield/);
  });

  it("create/drop omit a playfield seed because skipRunTargetPlayfieldReset is set", () => {
    const context = { miroirConfig: {} as never };
    const runTarget = {
      applicationUuid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      deploymentUuid: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      applicationName: "Library",
    };
    for (const key of ["runner.createEntity", "runner.dropEntity"] as const) {
      const entry = runnerSuiteEntryFromFolders(key);
      expect(
        Object.prototype.hasOwnProperty.call(entry, "integTestbedResetParams"),
        key,
      ).toBe(false);
      expect(entry.suiteDefinition.testbedInitApplicationParameters, key).toBeUndefined();
      const params = buildUiIntegrationOrchestratorCreateSessionParams(
        entry,
        context,
        "test",
        runTarget,
        {},
        applicationRunnerUuidIndex,
      );
      expect(params.kind, key).toBe("runner");
      if (params.kind !== "runner") {
        continue;
      }
      expect(params.sessionSpecificOptions?.integTestbedResetParams, key).toBeUndefined();
      expect(params.sessionSpecificOptions?.skipRunTargetPlayfieldReset, key).toBe(true);
    }
  });
});

describe("uiIntegrationTestTransformerSuiteRegistry (B7)", () => {
  it("lists and resolves tr.core", async () => {
    const {
      listUiIntegrationTransformerSuiteKeys,
      resolveUiIntegrationTransformerSuite,
    } = await import("../../src/miroir-fwk/4-tests/uiIntegrationTestTransformerSuiteRegistry.js");
    expect(listUiIntegrationTransformerSuiteKeys()).toContain("tr.core");
    const entry = resolveUiIntegrationTransformerSuite("tr.core");
    expect(entry.suiteDefinition.miroirTestLabel).toBe("tr.core");
  });
});

describe("resolveUiIntegrationRunnerUuidIndex", () => {
  it("uses a non-empty requested index", () => {
    expect(resolveUiIntegrationRunnerUuidIndex(applicationRunnerUuidIndex)).toBe(
      applicationRunnerUuidIndex,
    );
  });

  it("falls back to the legacy snapshot when the requested index is missing or empty", () => {
    expect(resolveUiIntegrationRunnerUuidIndex(undefined)).toBe(UI_INTEGRATION_RUNNER_UUID_INDEX);
    expect(resolveUiIntegrationRunnerUuidIndex({})).toBe(UI_INTEGRATION_RUNNER_UUID_INDEX);
  });
});

describe("resolveUiIntegrationTestRunTarget (B3)", () => {
  it("pinned mode uses suite runTarget", () => {
    const suite = runnerReturnDocumentSuite();
    const resolved = resolveUiIntegrationTestRunTarget("pinned", suite);

    expect(resolved.applicationUuid).toBe(suite.runTarget?.applicationUuid);
    expect(resolved.deploymentUuid).toBe(suite.runTarget?.deploymentUuid);
  });

  it("ephemeral mode ignores suite pins and uses leaf defaultApplicationName", () => {
    const suite = runnerReturnDocumentSuite();
    const pinned = resolveUiIntegrationTestRunTarget("pinned", suite);
    const ephemeral = resolveUiIntegrationTestRunTarget("ephemeral", suite);

    expect(ephemeral.applicationUuid).not.toBe(pinned.applicationUuid);
    expect(ephemeral.deploymentUuid).not.toBe(pinned.deploymentUuid);
    expect(ephemeral.applicationName).toBe(resolveDefaultApplicationNameFromMiroirTestSuite(suite));
  });
});

describe("isUiIntegrationSuiteRunSuccessful (B3)", () => {
  it("returns false when no test results exist", () => {
    expect(
      isUiIntegrationSuiteRunSuccessful(
        {
          getTestAssertionsResults: () => ({}),
        } as never,
        "runner.returnDocument",
      ),
    ).toBe(false);
  });

  it("returns true for nested transformer suite results (B7)", () => {
    expect(
      isUiIntegrationSuiteRunSuccessful(
        {
          getTestAssertionsResults: () => ({
            testsSuiteResults: {
              runtimeTransformerTests: {
                testsSuiteResults: {
                  plus: {
                    testsResults: {
                      "plus with empty args fails": {
                        testLabel: "plus with empty args fails",
                        testResult: "ok",
                        testAssertionsResults: {},
                      },
                    },
                  },
                },
              },
            },
          }),
        } as never,
        "tr.core",
      ),
    ).toBe(true);
  });
});


describe("Report suites in the UI launcher (#330 Slice 8)", () => {
  const context = { miroirConfig: {} as never };
  const runTarget = {
    applicationUuid: "5af03c98-fe5e-490b-b08f-e1230971c57f",
    deploymentUuid: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
    applicationName: "Library",
  };

  it("lists report.bookDetails and report.connectExternalServiceWizard as Report suites on an action session with their playfield", () => {
    for (const key of ["report.bookDetails", "report.connectExternalServiceWizard"] as const) {
      const entry = runnerSuiteEntryFromFolders(key);
      expect(entry.kind, key).toBe("reportTest");
      expect(resolveUiIntegrationOrchestratorSessionKind(entry), key).toBe("action");
      const params = buildUiIntegrationOrchestratorCreateSessionParams(
        entry,
        context,
        "test",
        runTarget,
        {},
        applicationRunnerUuidIndex,
      );
      expect(params.kind, key).toBe("action");
      if (params.kind !== "action") {
        continue;
      }
      const seed = params.sessionSpecificOptions.integTestbedResetParams;
      expect(seed.testbedInitApplicationParameters, key).toEqual(libraryTestbedInitParams);
      expect((seed.testbedModel.reports ?? []).map((report) => report.name), key).toEqual(["BookDetails"]);
      expect((seed.testbedModel.menus ?? []).map((menu) => menu.uuid), key).toEqual([
        "dd168e5a-2a21-4d2d-a443-032c6d15eb22",
      ]);
    }
  });

  it("recognises a Report suite by its leaves, not by its name", () => {
    const suite = runnerSuiteEntryFromFolders("report.bookDetails").suiteDefinition;
    expect(uiIntegrationRunnerSuiteEntryFromDefinition("any.name", suite)?.kind).toBe("reportTest");
  });

  it("refuses a Report suite when the app gives no sandbox to mount its Reports", async () => {
    const suite = runnerSuiteEntryFromFolders("report.bookDetails").suiteDefinition;
    await expect(
      runUiIntegrationTestSuite(
        {
          suiteKey: "report.bookDetails",
          suiteDefinition: suite,
          profileName: "emulatedServer-indexedDb",
          runTargetMode: "pinned",
        },
        {} as UiIntegrationTestLauncherEnvironment,
      ),
    ).rejects.toThrow(REPORT_TESTS_NEED_A_SANDBOX_MESSAGE);
  });

  it("refuses a Report suite on a real-server profile, whose pinned targets are live deployments, before opening a session", async () => {
    const suite = runnerSuiteEntryFromFolders("report.bookDetails").suiteDefinition;
    const prepareReportTests = vi.fn(async () => () => {});
    const createOrchestrator = vi.fn();
    const environment = {
      getCoordinator: () => ({ runExclusive: <T>(fn: () => Promise<T>) => fn() }),
      loadConfigForProfile: async () => ({
        miroirConfig: { client: { emulateServer: false } },
        logConfig: {},
      }),
      createOrchestrator,
    } as unknown as UiIntegrationTestLauncherEnvironment;
    await expect(
      runUiIntegrationTestSuite(
        {
          suiteKey: "report.bookDetails",
          suiteDefinition: suite,
          profileName: "realServer-sql",
          runTargetMode: "ephemeral",
          prepareReportTests,
        },
        environment,
      ),
    ).rejects.toThrow(REPORT_TESTS_NEED_AN_EMULATED_SERVER_MESSAGE);
    expect(createOrchestrator).not.toHaveBeenCalled();
    expect(prepareReportTests).not.toHaveBeenCalled();
  });
});
