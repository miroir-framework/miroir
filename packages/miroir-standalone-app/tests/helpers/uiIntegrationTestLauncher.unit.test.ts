import { describe, expect, it } from "vitest";

import { miroirTest_runner_return_document } from "miroir-test-app_deployment-library";
import {
  miroirTest_domain_controller_model_undo_redo,
} from "miroir-test-app_deployment-miroir";
import type { MiroirTestDefinition, MiroirTestSuite } from "miroir-core";

import {
  isUiIntegrationSuiteRunSuccessful,
  resolveUiIntegrationTestRunTarget,
} from "../../src/miroir-fwk/4-tests/uiIntegrationTestLauncher.js";
import { resolveDefaultApplicationNameFromMiroirTestSuite } from "miroir-core";
import { libraryTestbedInitParams } from "../../src/miroir-fwk/4-tests/uiIntegrationPlayfieldSeeds.js";
import { appForTestTestbedInitParams } from "../../src/miroir-fwk/4-tests/uiIntegrationAppForTestPlayfieldSeed.js";
import {
  buildUiIntegrationOrchestratorCreateSessionParams,
  listUiIntegrationRunnerSuiteKeys,
  resolveUiIntegrationOrchestratorSessionKind,
  UI_INTEGRATION_RUNNER_SUITE_REGISTRY,
  UI_INTEGRATION_RUNNER_UUID_INDEX,
} from "../../src/miroir-fwk/4-tests/uiIntegrationTestRunnerSuiteRegistry.js";

function runnerReturnDocumentSuite(): MiroirTestSuite {
  return (miroirTest_runner_return_document as MiroirTestDefinition).definition as MiroirTestSuite;
}

describe("uiIntegrationTestRunnerSuiteRegistry (B3)", () => {
  it("lists runner_lend_document, runner_return_document, runner_create_entity, runner_drop_entity, and domain_controller action suites", () => {
    const keys = listUiIntegrationRunnerSuiteKeys();
    expect(keys).toContain("runner_lend_document");
    expect(keys).toContain("runner_return_document");
    expect(keys).toContain("runner_create_entity");
    expect(keys).toContain("runner_drop_entity");
    expect(keys).toContain("domain_controller_data_crud");
    expect(keys).toContain("domain_controller_model_crud");
  });

  it("registry entries use discriminated union kinds", () => {
    expect(UI_INTEGRATION_RUNNER_SUITE_REGISTRY.runner_lend_document.kind).toBe("runnerTest");
    expect(UI_INTEGRATION_RUNNER_SUITE_REGISTRY.runner_return_document.kind).toBe("runnerTest");
    expect(UI_INTEGRATION_RUNNER_SUITE_REGISTRY.runner_create_entity.kind).toBe("runnerTest");
    expect(UI_INTEGRATION_RUNNER_SUITE_REGISTRY.domain_controller_data_crud.kind).toBe(
      "domainControllerTest",
    );
    expect(UI_INTEGRATION_RUNNER_SUITE_REGISTRY.evolutionTraceWP1.kind).toBe("actionTest");
  });

  it("buildUiIntegrationOrchestratorCreateSessionParams distinguishes runner vs action kinds", () => {
    const context = { miroirConfig: {} as never };
    const runTarget = {
      applicationUuid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      deploymentUuid: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      applicationName: "Library",
    };
    const runnerParams = buildUiIntegrationOrchestratorCreateSessionParams(
      UI_INTEGRATION_RUNNER_SUITE_REGISTRY.runner_lend_document,
      context,
      "test",
      runTarget,
      {},
      UI_INTEGRATION_RUNNER_UUID_INDEX,
    );
    expect(runnerParams.kind).toBe("runner");
    if (runnerParams.kind === "runner") {
      expect(runnerParams.resolvedRunner).toBeDefined();
      expect(runnerParams.sessionSpecificOptions?.runnerUuidIndex).toBe(
        UI_INTEGRATION_RUNNER_UUID_INDEX,
      );
      expect(runnerParams.sessionSpecificOptions?.testBedModelAndInstances).toBeDefined();
    }

    const actionParams = buildUiIntegrationOrchestratorCreateSessionParams(
      UI_INTEGRATION_RUNNER_SUITE_REGISTRY.domain_controller_data_crud,
      context,
      "test",
      runTarget,
      {},
      UI_INTEGRATION_RUNNER_UUID_INDEX,
    );
    expect(actionParams.kind).toBe("action");
    if (actionParams.kind === "action") {
      expect(actionParams.sessionSpecificOptions.testBedModelAndInstances).toBeDefined();
      expect("resolvedRunner" in actionParams).toBe(false);
    }
  });

  it("resolveUiIntegrationOrchestratorSessionKind maps registry entry kinds", () => {
    expect(
      resolveUiIntegrationOrchestratorSessionKind(
        UI_INTEGRATION_RUNNER_SUITE_REGISTRY.runner_return_document,
      ),
    ).toBe("runner");
    expect(
      resolveUiIntegrationOrchestratorSessionKind(
        UI_INTEGRATION_RUNNER_SUITE_REGISTRY.domain_controller_data_crud,
      ),
    ).toBe("action");
  });

  it("composes undo_redo playfield from suite JSON plus registry init params", () => {
    const entry = UI_INTEGRATION_RUNNER_SUITE_REGISTRY.domain_controller_model_undo_redo;
    expect(Object.prototype.hasOwnProperty.call(entry, "testBedModelAndInstances")).toBe(false);

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
      UI_INTEGRATION_RUNNER_UUID_INDEX,
    );
    expect(params.kind).toBe("action");
    if (params.kind !== "action") {
      return;
    }
    const seed = params.sessionSpecificOptions.testBedModelAndInstances;
    const suite = (miroirTest_domain_controller_model_undo_redo as MiroirTestDefinition)
      .definition as MiroirTestSuite;
    expect(seed.testbedModel).toEqual(suite.testbedModel);
    expect(seed.testbedEntitiesAndInstances).toEqual(suite.testbedEntitiesAndInstances);
    expect(seed.testbedInitApplicationParameters).toEqual(libraryTestbedInitParams);
  });

  it("lend/return compose the Library document TestConfiguration seed and drop registry playfield", () => {
    const context = { miroirConfig: {} as never };
    const runTarget = {
      applicationUuid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      deploymentUuid: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      applicationName: "Library",
    };
    const expectedEntityNames = ["Author", "Book", "Publisher", "User"];
    for (const key of ["runner_lend_document", "runner_return_document"] as const) {
      const entry = UI_INTEGRATION_RUNNER_SUITE_REGISTRY[key];
      expect(Object.prototype.hasOwnProperty.call(entry, "testBedModelAndInstances"), key).toBe(
        false,
      );
      expect(entry.testbedInitApplicationParameters, key).toEqual(libraryTestbedInitParams);

      const params = buildUiIntegrationOrchestratorCreateSessionParams(
        entry,
        context,
        "test",
        runTarget,
        {},
        UI_INTEGRATION_RUNNER_UUID_INDEX,
      );
      expect(params.kind, key).toBe("runner");
      if (params.kind !== "runner") {
        continue;
      }
      const seed = params.sessionSpecificOptions?.testBedModelAndInstances;
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

  it("model_crud / freeze / evolutionTraceWP1 compose the Miroir Publisher+Country TestConfiguration seed and drop registry playfield", () => {
    const context = { miroirConfig: {} as never };
    const runTarget = {
      applicationUuid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      deploymentUuid: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      applicationName: "Library",
    };
    const expectedEntityNames = ["Country", "Publisher"];
    for (const key of [
      "domain_controller_model_crud",
      "domain_controller_application_version_freeze",
      "evolutionTraceWP1",
    ] as const) {
      const entry = UI_INTEGRATION_RUNNER_SUITE_REGISTRY[key];
      expect(Object.prototype.hasOwnProperty.call(entry, "testBedModelAndInstances"), key).toBe(
        false,
      );
      expect(entry.testbedInitApplicationParameters, key).toEqual(libraryTestbedInitParams);

      const params = buildUiIntegrationOrchestratorCreateSessionParams(
        entry,
        context,
        "test",
        runTarget,
        {},
        UI_INTEGRATION_RUNNER_UUID_INDEX,
      );
      expect(params.kind, key).toBe("action");
      if (params.kind !== "action") {
        continue;
      }
      const seed = params.sessionSpecificOptions.testBedModelAndInstances;
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
      domain_controller_data_crud: {
        entityNames: ["Author", "Book", "Publisher"],
        modelEntityNames: ["Author", "Book", "Publisher"],
      },
      domain_controller_composite_pk_crud: {
        entityNames: ["TestEntityCompositePK"],
        modelEntityNames: ["TestEntityCompositePK"],
      },
      domain_controller_non_uuid_pk_model_crud: {
        entityNames: ["Publisher"],
        modelEntityNames: ["Publisher"],
      },
      domain_controller_non_uuid_pk_data_crud: {
        entityNames: ["TestEntityCodeNumber"],
        modelEntityNames: ["TestEntityCodeNumber"],
      },
      domain_controller_no_parent_uuid_crud: {
        entityNames: ["Publisher", "TestEntityNoParentUuid"],
        modelEntityNames: ["Publisher", "TestEntityNoParentUuid"],
      },
    };
    for (const key of Object.keys(expectedByKey) as (keyof typeof expectedByKey)[]) {
      const entry = UI_INTEGRATION_RUNNER_SUITE_REGISTRY[key];
      expect(Object.prototype.hasOwnProperty.call(entry, "testBedModelAndInstances"), key).toBe(
        false,
      );
      expect(entry.testbedInitApplicationParameters, key).toEqual(libraryTestbedInitParams);

      const params = buildUiIntegrationOrchestratorCreateSessionParams(
        entry,
        context,
        "test",
        runTarget,
        {},
        UI_INTEGRATION_RUNNER_UUID_INDEX,
      );
      expect(params.kind, key).toBe("action");
      if (params.kind !== "action") {
        continue;
      }
      const seed = params.sessionSpecificOptions.testBedModelAndInstances;
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
    const entry = UI_INTEGRATION_RUNNER_SUITE_REGISTRY.runner_freeze_application_version;
    expect(Object.prototype.hasOwnProperty.call(entry, "testBedModelAndInstances")).toBe(false);
    expect(entry.testbedInitApplicationParameters).toEqual(appForTestTestbedInitParams);

    const params = buildUiIntegrationOrchestratorCreateSessionParams(
      entry,
      context,
      "test",
      runTarget,
      {},
      UI_INTEGRATION_RUNNER_UUID_INDEX,
    );
    expect(params.kind).toBe("runner");
    if (params.kind !== "runner") {
      return;
    }
    const seed = params.sessionSpecificOptions?.testBedModelAndInstances;
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
        miroirTests: [],
      } as MiroirTestSuite,
      testbedInitApplicationParameters: libraryTestbedInitParams,
    };
    expect(() =>
      buildUiIntegrationOrchestratorCreateSessionParams(
        entry,
        context,
        "test",
        runTarget,
        {},
        UI_INTEGRATION_RUNNER_UUID_INDEX,
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
    for (const key of ["runner_create_entity", "runner_drop_entity"] as const) {
      const entry = UI_INTEGRATION_RUNNER_SUITE_REGISTRY[key];
      expect(
        Object.prototype.hasOwnProperty.call(entry, "testBedModelAndInstances"),
        key,
      ).toBe(false);
      expect(entry.testbedInitApplicationParameters, key).toBeUndefined();
      const params = buildUiIntegrationOrchestratorCreateSessionParams(
        UI_INTEGRATION_RUNNER_SUITE_REGISTRY[key],
        context,
        "test",
        runTarget,
        {},
        UI_INTEGRATION_RUNNER_UUID_INDEX,
      );
      expect(params.kind, key).toBe("runner");
      if (params.kind !== "runner") {
        continue;
      }
      expect(params.sessionSpecificOptions?.testBedModelAndInstances, key).toBeUndefined();
      expect(params.sessionSpecificOptions?.skipRunTargetPlayfieldReset, key).toBe(true);
    }
  });
});

describe("uiIntegrationTestTransformerSuiteRegistry (B7)", () => {
  it("lists and resolves miroirCoreTransformers", async () => {
    const {
      listUiIntegrationTransformerSuiteKeys,
      resolveUiIntegrationTransformerSuite,
    } = await import("../../src/miroir-fwk/4-tests/uiIntegrationTestTransformerSuiteRegistry.js");
    expect(listUiIntegrationTransformerSuiteKeys()).toContain("miroirCoreTransformers");
    const entry = resolveUiIntegrationTransformerSuite("miroirCoreTransformers");
    expect(entry.suiteDefinition.miroirTestLabel).toBe("miroirCoreTransformers");
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
        "runner_return_document",
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
        "miroirCoreTransformers",
      ),
    ).toBe(true);
  });
});
